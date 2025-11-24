#!/usr/bin/env node

import { Command } from 'commander';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { Server } from './server';

const PID_FILE = '/tmp/mcp-dev-helper.pid';
const DEFAULT_PORT = 7777;

function getPid(): number | null {
  if (!existsSync(PID_FILE)) {
    return null;
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
    if (isNaN(pid)) {
      return null;
    }

    // Check if process is still running
    try {
      process.kill(pid, 0);
      return pid;
    } catch {
      // Process doesn't exist
      unlinkSync(PID_FILE);
      return null;
    }
  } catch {
    return null;
  }
}

function savePid(pid: number): void {
  writeFileSync(PID_FILE, pid.toString(), 'utf-8');
}

function removePid(): void {
  if (existsSync(PID_FILE)) {
    unlinkSync(PID_FILE);
  }
}

async function startServer(port: number): Promise<void> {
  const existingPid = getPid();
  if (existingPid !== null) {
    console.error(`mcp-dev-helper is already running (PID: ${existingPid})`);
    process.exit(1);
  }

  // Start server in background
  // Use the compiled server-daemon.js from the dist directory
  const serverScript = join(__dirname, 'server-daemon.js');
  const child = spawn(process.execPath, [serverScript, port.toString()], {
    detached: true,
    stdio: 'ignore',
    cwd: __dirname,
  });

  child.unref();
  savePid(child.pid!);

  // Give it a moment to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`mcp-dev-helper server started on http://localhost:${port} (PID: ${child.pid})`);
  process.exit(0);
}

async function stopServer(): Promise<void> {
  const pid = getPid();
  if (pid === null) {
    console.log('mcp-dev-helper is not running');
    return;
  }

  try {
    process.kill(pid, 'SIGTERM');
    removePid();
    console.log(`mcp-dev-helper server stopped (PID: ${pid})`);
  } catch (error) {
    console.error(`Failed to stop server: ${error}`);
    process.exit(1);
  }
}

const program = new Command();

program
  .name('mcp-dev-helper')
  .description('Ultra-fast local documentation server')
  .version('0.1.0');

program
  .command('start')
  .description('Start the mcp-dev-helper server')
  .option('-p, --port <port>', 'Port to run the server on', DEFAULT_PORT.toString())
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      console.error('Invalid port number');
      process.exit(1);
    }
    await startServer(port);
  });

program
  .command('stop')
  .description('Stop the mcp-dev-helper server')
  .action(async () => {
    await stopServer();
  });

program.parse();

