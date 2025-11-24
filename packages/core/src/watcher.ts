import { watch, FSWatcher } from 'chokidar';
import { join, dirname } from 'path';
import { getConfigPath, loadConfig, type Project } from './config';
import { Cache } from './cache';

export type ConfigChangeCallback = (projects: Project[]) => void;
export type FileChangeCallback = (projectId: string, docName: string) => void;

export class FileWatcher {
  private configWatcher: FSWatcher | null = null;
  private projectWatchers: Map<string, FSWatcher> = new Map();
  private cache: Cache;
  private onConfigChange: ConfigChangeCallback;
  private onFileChange: FileChangeCallback;

  constructor(
    cache: Cache,
    onConfigChange: ConfigChangeCallback,
    onFileChange: FileChangeCallback
  ) {
    this.cache = cache;
    this.onConfigChange = onConfigChange;
    this.onFileChange = onFileChange;
  }

  start(): void {
    const configPath = getConfigPath();
    const configDir = dirname(configPath);

    // Watch configuration file
    this.configWatcher = watch(configPath, {
      persistent: true,
      ignoreInitial: true,
    });

    this.configWatcher.on('change', () => {
      try {
        const config = loadConfig();
        this.onConfigChange(config.projects);
        this.updateProjectWatchers(config.projects);
      } catch (error) {
        console.error('Error reloading configuration:', error);
      }
    });

    // Initial watch setup
    try {
      const config = loadConfig();
      this.updateProjectWatchers(config.projects);
    } catch (error) {
      console.error('Error loading initial configuration:', error);
    }
  }

  private updateProjectWatchers(projects: Project[]): void {
    // Stop old watchers
    for (const watcher of this.projectWatchers.values()) {
      watcher.close();
    }
    this.projectWatchers.clear();

    // Start new watchers for each project
    for (const project of projects) {
      const watcher = watch(join(project.path, '**/*.md'), {
        persistent: true,
        ignoreInitial: true,
      });

      watcher.on('change', (filePath) => {
        const docName = filePath
          .replace(project.path, '')
          .replace(/^\//, '')
          .replace(/\.md$/, '');
        const cacheKey = this.cache.getCacheKey(project.id, docName);
        this.cache.delete(cacheKey);
        this.onFileChange(project.id, docName);
      });

      this.projectWatchers.set(project.id, watcher);
    }
  }

  stop(): void {
    if (this.configWatcher) {
      this.configWatcher.close();
      this.configWatcher = null;
    }

    for (const watcher of this.projectWatchers.values()) {
      watcher.close();
    }
    this.projectWatchers.clear();
  }
}

