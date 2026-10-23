import { createApp } from './app.js';

const app = await createApp();
await app.listen(Number(process.env.PORT || 9005), process.env.HOST || '127.0.0.1');
const server = app.getHttpServer();
server.requestTimeout = 30000;
server.headersTimeout = 15000;
