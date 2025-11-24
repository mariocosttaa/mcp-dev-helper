import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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

export type Project = z.infer<typeof ConfigSchema>['projects'][0];
export type Config = z.infer<typeof ConfigSchema>;

const CONFIG_PATH = join(homedir(), '.mcp-dev-helper', 'config.yml');

export function loadConfig(): Config {
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

export function getConfigPath(): string {
  return CONFIG_PATH;
}

