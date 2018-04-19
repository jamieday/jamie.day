const path = require('path');
const express = require('express');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);
const favicon = require('serve-favicon');
const io = require('socket.io')(server);
const socketHandler = require('./app-sockethandler').createHandler(io);
const exec = require('child_process').exec;
const config = require('./config');
const port = process.env.PORT || 5050

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

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items The array containing the items.
 */
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}

app.get('/', function(req, res) {
  let websiteWords = [
    "Website", "Site", "This website", "This site"
  ];
  let currentlyWords = [
    "currently", "actively", "seriously"
  ];
  let prepositionWords = [
    "under", "in", "undergoing"
  ];
  let constructionWords = [
    "construction", "development"
  ];
  let randomElement = arr => arr[Math.floor(Math.random() * arr.length)];
  let phrase = {
    websiteWord: randomElement(websiteWords),
    currentlyWord: randomElement(currentlyWords),
    prepositionWord: randomElement(prepositionWords),
    constructionWord: randomElement(constructionWords)
  };
  res.render('pages/index', { phrase: phrase });
});

async function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) reject(error);
        resolve({stdout: stdout, stderr: stderr});
      });
  });
}

async function executePipeline(command) {
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

async function listen(port) {
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
