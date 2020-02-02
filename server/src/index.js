const app = require('./app');
const fs = require('fs');
// const https = require('https');
const http = require('http');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;

// const options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// }

// http.createServer(function(req, res) {
// }).listen(port, hostname, () => {
//     /* eslint-disable no-console */
//     console.log(`Listening: http://${hostname}:${port}`);
//     /* eslint-enable no-console */
//   });

app.listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: http://${host}:${port}`);
  /* eslint-enable no-console */
});
