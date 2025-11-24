import { Server } from './server';

const port = parseInt(process.argv[2] || '7777', 10);

const server = new Server(port);

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

server.start(port).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

