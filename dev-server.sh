# /bin/bash
tsc -p .
tsc -p src/scripts -w &
node app.js
