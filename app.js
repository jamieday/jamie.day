let path = require('path');
let express = require('express');
let fs = require('fs');
let app = express();
let exec = require('child_process').exec;
let config = require('./config');

if (!process.env.ENVIRONMENT) {
  console.error("ERR: No environment specified (e.g., DEV / STAGING / PRODUCTION)");
  process.exit(1);
}

let isDev = process.env.ENVIRONMENT === 'DEV';

app.set('port', (process.env.PORT || 5050));

app.use(express.static(path.join(__dirname, 'public')));
if (isDev) {
  // Note: this is a major hack
  app.use(express.static(path.join(__dirname, 'src')));
  setTimeout(runApp, 0);
} else {
  // Run css pipeline
  exec("mkdir -p public/styles && node_modules/.bin/postcss src/styles/main.css --use autoprefixer | node_modules/.bin/cssmin >public/styles/main.css",
    (err, stdout, stderr) => {
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      runApp();
    });
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

function runApp() {
  let port = app.get('port');
  app.listen(port, function() {
    console.log(`[${process.env.ENVIRONMENT}] Kicking it on port ${port}`);
  });
}
