# /bin/bash
tsc -p .
tsc -p src/scripts -w > /dev/null &
node app.js
