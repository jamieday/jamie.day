import * as path from 'path';
import express from 'express';
import { createServer } from 'http';
import favicon from 'serve-favicon';

const app = express();
const server = createServer(app);

const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;
const env =
  process.env.ENVIRONMENT ||
  (() => {
    const defaultEnv = 'PRODUCTION';
    console.warn(
      `Info: No environment specified, defaulting to ${defaultEnv}`
    );
    return defaultEnv;
  })();

const frontendDir = path.join(__dirname, 'build');
app.use(express.static(frontendDir));
app.use(favicon(path.join(frontendDir, 'favicon.ico')));

app.get('/', (_, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Tetris Game
app.get('/tetris', (_, res) => {
  res.sendFile(
    path.join(__dirname, 'build', 'tetris', 'index.html')
  );
});

async function listen(port: number) {
  return new Promise(resolve => {
    server.listen(port, resolve);
  });
}

async function runApp() {
  await listen(port);
  console.log(`[${env}] Waiting for friends to join port ${port}`);
}

runApp();
