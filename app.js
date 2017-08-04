const path = require('path');
const express = require('express');
const fs = require('fs');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const socketHandler = require('./app-sockethandler').createHandler(io);
const exec = require('child_process').exec;
const config = require('./config');
const port = process.env.PORT || 5050

if (!process.env.ENVIRONMENT) {
  console.error("ERR: No environment specified (e.g., DEV / STAGING / PRODUCTION)");
  process.exit(1);
}

let isDev = process.env.ENVIRONMENT === 'DEV';
let skipPipeline = false;

app.use(express.static(path.join(__dirname, 'public')));
if (isDev) {
  // use styles from source in dev instead of preprocessed
  app.use('/styles', express.static(path.join(__dirname, 'src', 'styles')));
  skipPipeline = true;
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

async function executeCssPipeline() {
  try {
    let output = await executeCommand("mkdir -p public/styles && node_modules/.bin/postcss src/styles/main.css --use autoprefixer | node_modules/.bin/cssmin >public/styles/main.css");
    if (output.stdout) console.log(output.stdout);
    if (output.stderr) console.error(output.stderr);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
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
  if (!skipPipeline) await executeCssPipeline();
  await listen(port);
  console.log(`[${process.env.ENVIRONMENT}] Kicking it on port ${port}`);
}

runApp();
