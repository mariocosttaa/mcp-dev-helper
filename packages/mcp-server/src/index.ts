#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, normalize } from 'path';
import { marked } from 'marked';
import { parse } from 'yaml';
import { z } from 'zod';
import { homedir } from 'os';

const ConfigSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string().min(1),
      path: z.string().min(1),
    })
  ),
});

type Project = z.infer<typeof ConfigSchema>['projects'][0];

const CONFIG_PATH = join(homedir(), '.mcp-dev-helper', 'config.yml');

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(
      `Configuration file not found at ${CONFIG_PATH}. Please create it with your project mappings.`
    );
  }

  try {
    const fileContent = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = parse(fileContent);
    return ConfigSchema.parse(parsed);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid configuration file: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }
    throw new Error(`Failed to read configuration file: ${error}`);
  }
}

class MCPDevHelperMCPServer {
  private server: Server;
  private projects: Project[] = [];

  constructor() {
    this.server = new Server(
      {
        name: 'mcp-dev-helper-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
    this.loadConfig();
  }

  private loadConfig(): void {
    try {
      const config = loadConfig();
      this.projects = config.projects;
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_documentation',
            description:
              'Get documentation content for a specific document. Returns the HTML-rendered markdown content.',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description:
                    'The project ID (e.g., "react-native", "api", "full-app")',
                },
                doc_name: {
                  type: 'string',
                  description:
                    'The document name without .md extension (e.g., "api-client", "README")',
                },
              },
              required: ['project_id', 'doc_name'],
            },
          },
          {
            name: 'list_projects',
            description: 'List all available projects in MCP Dev Helper',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'list_documents',
            description: 'List all documents in a project',
            inputSchema: {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'The project ID',
                },
              },
              required: ['project_id'],
            },
          },
          {
            name: 'search_documents',
            description: 'Search for documents by name across all projects',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query (document name or partial match)',
                },
              },
              required: ['query'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_documentation': {
            const { project_id, doc_name } = args as {
              project_id: string;
              doc_name: string;
            };
            const content = await this.getDocumentHtml(project_id, doc_name);
            if (!content) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Document "${doc_name}" not found in project "${project_id}"`,
                  },
                ],
                isError: true,
              };
            }
            return {
              content: [
                {
                  type: 'text',
                  text: content,
                },
              ],
            };
          }

          case 'list_projects': {
            this.loadConfig();
            const projectList = this.projects
              .map((p) => `- ${p.id} (${p.path})`)
              .join('\n');
            return {
              content: [
                {
                  type: 'text',
                  text: `Available projects:\n${projectList}`,
                },
              ],
            };
          }

          case 'list_documents': {
            const { project_id } = args as { project_id: string };
            const project = this.projects.find((p) => p.id === project_id);
            if (!project) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `Project "${project_id}" not found`,
                  },
                ],
                isError: true,
              };
            }
            const files = this.getMarkdownFiles(project.path);
            const fileList = files.length > 0 ? files.join('\n') : 'No documents found';
            return {
              content: [
                {
                  type: 'text',
                  text: `Documents in "${project_id}":\n${fileList}`,
                },
              ],
            };
          }

          case 'search_documents': {
            const { query } = args as { query: string };
            const results: Array<{ project: string; document: string }> = [];
            for (const project of this.projects) {
              const files = this.getMarkdownFiles(project.path);
              for (const file of files) {
                if (file.toLowerCase().includes(query.toLowerCase())) {
                  results.push({ project: project.id, document: file });
                }
              }
            }
            if (results.length === 0) {
              return {
                content: [
                  {
                    type: 'text',
                    text: `No documents found matching "${query}"`,
                  },
                ],
              };
            }
            const resultText = results
              .map((r) => `- ${r.project}/${r.document}`)
              .join('\n');
            return {
              content: [
                {
                  type: 'text',
                  text: `Found ${results.length} document(s):\n${resultText}`,
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown tool: ${name}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      this.loadConfig();
      return {
        resources: this.projects.map((project) => ({
          uri: `mcp-dev-helper://${project.id}`,
          name: `${project.id} - Documentation`,
          description: `Documentation for ${project.id} project`,
          mimeType: 'text/markdown',
        })),
      };
    });

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const match = uri.match(/^mcp-dev-helper:\/\/([^/]+)(?:\/(.+))?$/);
      if (!match) {
        throw new Error(`Invalid URI: ${uri}`);
      }

      const projectId = match[1];
      const docName = match[2] || 'README';

      const content = await this.getDocumentHtml(projectId, docName);
      if (!content) {
        throw new Error(`Document not found: ${projectId}/${docName}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/html',
            text: content,
          },
        ],
      };
    });
  }

  private async getDocumentHtml(
    projectId: string,
    docName: string
  ): Promise<string | null> {
    const project = this.projects.find((p) => p.id === projectId);
    if (!project) {
      return null;
    }

    // Sanitize docName to prevent directory traversal
    const sanitizedDocName = normalize(docName).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = resolve(project.path, `${sanitizedDocName}.md`);

    // Ensure the file is within the project path
    const resolvedProjectPath = resolve(project.path);
    if (!filePath.startsWith(resolvedProjectPath)) {
      return null;
    }

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const markdown = readFileSync(filePath, 'utf-8');
      const html = marked(markdown) as string;
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Dev Helper MCP server running on stdio');
  }
}

// Start the server
const server = new MCPDevHelperMCPServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

