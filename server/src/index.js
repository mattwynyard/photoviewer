const app = require('./app');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;
    
app.listen(port, () => {
  console.log(`Listening: http://${host}:${port}`);
});