const fs = require('fs');
const path = require('path');

const clientDist = path.resolve(__dirname, '../client/dist');
const rootDist = path.resolve(__dirname, '../dist');

if (fs.existsSync(clientDist)) {
  fs.cpSync(clientDist, rootDist, { recursive: true });
  console.log('Synchronized client/dist to root dist/');
}
