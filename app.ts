import * as path from 'path';
import * as express from 'express';
import { createServer } from 'http';
import * as favicon from 'serve-favicon';
import * as socketIO from 'socket.io';
import SocketHandler from './app-sockethandler';
import { exec } from 'child_process';
import config from './config';

const app = express();
const server = createServer(app);
const io = socketIO(server);
const socketHandler = new SocketHandler(io);

const port = process.env.PORT 
  ? parseInt(process.env.PORT)
  : 5050
const env = process.env.ENVIRONMENT || (() => {
  console.warn('Warning: No environment specified, defaulting to DEV');
  return 'DEV';
})();

const isDev = env === 'DEV';
const skipCssPipeline = isDev;

app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
if (skipCssPipeline) {
  // use styles from source in dev instead of preprocessed
  app.use('/styles', express.static(path.join(__dirname, 'src', 'styles')));
}

// views is directory for all template files
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function shuffle(a: any[]) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}

app.get('/', (_, res) => {
  res.render('pages/index');
});

// Tetris Game
app.get('/tetris', (_, res) => {
  res.sendFile('/tetris/index.html');
});

async function executeCommand(cmd: string) {
  return <Promise<{stdout: string, stderr: string}>> new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) reject(error);
        resolve({stdout: stdout, stderr: stderr});
      });
  });
}

async function executePipeline(command: string) {
  try {
    let output = await executeCommand(command);
    if (output.stdout) console.log(output.stdout);
    if (output.stderr) console.error(output.stderr);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

async function executeJsPipeline() {
  await executePipeline("tsc -p src/scripts");
}

async function executeCssPipeline() {
  await executePipeline("mkdir -p public/styles && node_modules/.bin/postcss src/styles/main.css --use autoprefixer | node_modules/.bin/cssmin >public/styles/main.css");
};

async function listen(port: number) {
  return new Promise(resolve => {
    // listen for socket connections
    socketHandler.registerListeners();
    // begin listening http
    server.listen(port, resolve);
  });
}

async function runApp() {
  await executeJsPipeline();
  if (!skipCssPipeline) await executeCssPipeline();
  await listen(port);
  console.log(`[${env}] Kicking it on port ${port}`);
}

runApp();
