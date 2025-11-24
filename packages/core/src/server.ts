import Fastify, { FastifyInstance } from 'fastify';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { marked } from 'marked';
import { loadConfig, type Project } from './config';
import { Cache } from './cache';
import { FileWatcher } from './watcher';

export class Server {
  private app: FastifyInstance;
  private cache: Cache;
  private watcher: FileWatcher | null = null;
  private projects: Project[] = [];

  constructor(port: number = 7777) {
    this.app = Fastify({ logger: true });
    this.cache = new Cache();
    this.setupRoutes();
    this.setupWatcher();
  }

  private setupWatcher(): void {
    try {
      const config = loadConfig();
      this.projects = config.projects;

      this.watcher = new FileWatcher(
        this.cache,
        (projects) => {
          this.projects = projects;
          console.log('Configuration reloaded:', projects.length, 'projects');
        },
        (projectId, docName) => {
          console.log(`File changed: ${projectId}/${docName}`);
        }
      );

      this.watcher.start();
    } catch (error) {
      console.error('Failed to setup file watcher:', error);
    }
  }

  private setupRoutes(): void {
    // Homepage - list all projects
    this.app.get('/', async (request, reply) => {
      try {
        const config = loadConfig();
        const projectsHtml = config.projects
          .map(
            (project) =>
              `<li><a href="/projects/${project.id}">${project.id}</a></li>`
          )
          .join('');

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Dev Helper</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 10px 0;
    }
    a {
      display: block;
      padding: 15px;
      background: white;
      border-radius: 5px;
      text-decoration: none;
      color: #0066cc;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    a:hover {
      transform: translateX(5px);
    }
  </style>
</head>
<body>
  <h1>MCP Dev Helper</h1>
  <p>Select a project to view its documentation:</p>
  <ul>
    ${projectsHtml || '<li>No projects configured</li>'}
  </ul>
</body>
</html>
        `;

        return reply.type('text/html').send(html);
      } catch (error) {
        return reply.code(500).send({ error: String(error) });
      }
    });

    // List documents for a project
    this.app.get<{ Params: { projectId: string } }>(
      '/projects/:projectId',
      async (request, reply) => {
        try {
          const config = loadConfig();
          const project = config.projects.find(
            (p) => p.id === request.params.projectId
          );

          if (!project) {
            return reply.code(404).send({ error: 'Project not found' });
          }

          const projectPath = resolve(project.path);
          const files = this.getMarkdownFiles(projectPath);

          const filesHtml = files
            .map(
              (file) =>
                `<li><a href="/projects/${project.id}/${file}">${file}</a></li>`
            )
            .join('');

          const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.id} - MCP Dev Helper</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 {
      color: #333;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 10px 0;
    }
    a {
      display: block;
      padding: 15px;
      background: white;
      border-radius: 5px;
      text-decoration: none;
      color: #0066cc;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    a:hover {
      transform: translateX(5px);
    }
  </style>
</head>
<body>
  <h1>${project.id}</h1>
  <p><a href="/">← Back to projects</a></p>
  <ul>
    ${filesHtml || '<li>No documentation files found</li>'}
  </ul>
</body>
</html>
          `;

          return reply.type('text/html').send(html);
        } catch (error) {
          return reply.code(500).send({ error: String(error) });
        }
      }
    );

    // View a specific document
    this.app.get<{ Params: { projectId: string; docName: string } }>(
      '/projects/:projectId/:docName',
      async (request, reply) => {
        try {
          const config = loadConfig();
          const project = config.projects.find(
            (p) => p.id === request.params.projectId
          );

          if (!project) {
            return reply.code(404).send({ error: 'Project not found' });
          }

          const htmlContent = await this.getDocumentHtml(
            project.id,
            project.path,
            request.params.docName
          );

          if (!htmlContent) {
            return reply.code(404).send({ error: 'Document not found' });
          }

          const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${request.params.docName} - ${project.id} - MCP Dev Helper</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 900px;
      margin: 50px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <p><a href="/projects/${project.id}">← Back to ${project.id}</a></p>
  <div class="content">
    ${htmlContent}
  </div>
</body>
</html>
          `;

          return reply.type('text/html').send(html);
        } catch (error) {
          return reply.code(500).send({ error: String(error) });
        }
      }
    );

    // API endpoint for IDE integration
    this.app.get<{ Params: { projectId: string; docName: string } }>(
      '/api/docs/:projectId/:docName',
      async (request, reply) => {
        try {
          const config = loadConfig();
          const project = config.projects.find(
            (p) => p.id === request.params.projectId
          );

          if (!project) {
            return reply.code(404).send({ error: 'Project not found' });
          }

          const htmlContent = await this.getDocumentHtml(
            project.id,
            project.path,
            request.params.docName
          );

          if (!htmlContent) {
            return reply.code(404).send({ error: 'Document not found' });
          }

          return reply.send({ htmlContent });
        } catch (error) {
          return reply.code(500).send({ error: String(error) });
        }
      }
    );
  }

  private async getDocumentHtml(
    projectId: string,
    projectPath: string,
    docName: string
  ): Promise<string | null> {
    // Check cache first
    const cacheKey = this.cache.getCacheKey(projectId, docName);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Sanitize docName to prevent directory traversal
    const sanitizedDocName = normalize(docName).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = resolve(projectPath, `${sanitizedDocName}.md`);

    // Ensure the file is within the project path
    const resolvedProjectPath = resolve(projectPath);
    if (!filePath.startsWith(resolvedProjectPath)) {
      return null;
    }

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const markdown = readFileSync(filePath, 'utf-8');
      const html = marked(markdown) as string;
      this.cache.set(cacheKey, html);
      return html;
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  private getMarkdownFiles(dirPath: string, basePath: string = ''): string[] {
    const files: string[] = [];
    const resolvedPath = resolve(dirPath);

    if (!existsSync(resolvedPath)) {
      return files;
    }

    try {
      const entries = readdirSync(resolvedPath);

      for (const entry of entries) {
        const fullPath = join(resolvedPath, entry);
        const relativePath = basePath ? join(basePath, entry) : entry;

        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            files.push(...this.getMarkdownFiles(fullPath, relativePath));
          } else if (entry.endsWith('.md')) {
            files.push(relativePath.replace(/\.md$/, ''));
          }
        } catch {
          // Skip files we can't access
        }
      }
    } catch {
      // Skip directories we can't read
    }

    return files;
  }

  async start(port: number = 7777): Promise<void> {
    try {
      await this.app.listen({ port, host: '0.0.0.0' });
      console.log(`MCP Dev Helper server running on http://localhost:${port}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      this.watcher.stop();
    }
    await this.app.close();
  }
}

