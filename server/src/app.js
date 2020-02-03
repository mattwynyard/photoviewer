'use strict';
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db.js');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const middlewares = require('./middlewares');
const app = express();
const users = require('./user.js')
const jwt = require('jsonwebtoken');
const jwtKey = 'onssuperSeCr_eTKKey?ffcafff';
const jwtExpirySeconds = 300;

const fs = require('fs');
const https = require('https');
const http = require('http');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;

const options = {
  key: fs.readFileSync('./key.pem', 'utf8'),
  cert: fs.readFileSync('./server.crt', 'utf8')
}

const token = null;

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: false }))
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use((req, res, next) => {
  //res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

// app.listen(port, () => {
//   /* eslint-disable no-console */
//   console.log(`Listening: https://${host}:${port}`);
//   /* eslint-enable no-console */
// });

https.createServer(options, app).listen(port, () => {
  /* eslint-disable no-console */
  console.log(`Listening: https://${host}:${port}`);
  /* eslint-enable no-console */
});

app.get('/api', (req, res) => {
  res.send({ express: 'Server online' });
  
});

app.post('/login', async (request, response, next) => {
  let succeded = null;
  const password = request.body.key;
  const user = request.body.user;
  //uncomment to genrate password for new user
  //generatePassword(password, 10);
  
  let p = await db.password(user);
  if (p.rows.length == 0) { //user doesn't exist
    response.send({ result: false, error: "user doesnt exist" });
    succeded = false;
    //console.log("user doesn't exist");
  } else {
    let count = await db.users(user);
    //console.log("users: " + count.rows[0].count);
    bcrypt.compare(password, p.rows[0].password.toString(), async (err, res) => {
      count = count.rows[0].count;
      const seed  = user + count;
      if (err) throw err;     
      if (res) {
          const token = jwt.sign({ seed }, jwtKey, {
          algorithm: 'HS256',
          expiresIn: jwtExpirySeconds
        });
        succeded = true;
        count = count += 1;
        await db.updateCount(count, user);
        this.token = token;
        let projects = await db.projects(user);
        let arr = []; //project arr
        for (var i = 0; i < projects.rows.length; i += 1) {
          arr.push(projects.rows[i]);
        }
        response.set('Content-Type', 'application/json')
        response.cookie('token', token, { maxAge: jwtExpirySeconds * 1000 })
        response.json({ result: true, user: user, token: token, projects: arr});
        users.addUser({
          name: user,
          token: token,
          }
        );
        users.printUsers();
        
      } else {    
        console.log("Incorrect password")   
        response.send({ result: false, error: "incorrect password" });
      }
    }); 
  }  
});

app.post('/logout', (req, res, next) => {
  console.log("logout");
  
  if (req.headers.authorization === this.token) {
    users.deleteToken(req.body.token);
    users.printUsers();
    res.send({success: true});
  } else {
    res.send({success: false});
  }
});

app.post('/class', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    var fclass = await db.class();
    res.set('Content-Type', 'application/json')
    res.send(fclass.rows);
  } else {
    console.log("invalid token");
    res.send({success: false});
  }
});

app.post('/faults', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    var faults = await db.faults(req.body.type);
    //console.log(faults.rows);
    res.set('Content-Type', 'application/json')
    res.send(faults.rows);
  } else {
    console.log("invalid token");
    res.send({success: false});
  }
});

app.post('/layer', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    var layer = req.body.project;
    var filter = req.body.filter;
    var geometry = await db.layer(layer, filter);
    res.set('Content-Type', 'application/json')
    res.send(geometry.rows);
  } else {
    console.log("Resource unavailable")
    next();
  }
  
});

app.post('/roads', async (req, res, next) => {
  console.log(req.body);
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  const code = req.body.code;
  if (result) {
    var layer = req.body.menu;
    var geometry = await db.road(code);
    //console.log(geometry.rows);
    res.set('Content-Type', 'application/json')
    res.send(geometry.rows);
  } else {
    console.log("Resource unavailable")
    next();
  }
  
});

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

async function  generatePassword(password, rounds) {
  await bcrypt.genSalt(rounds, function(err, salt) {
      if (err) throw err;
      bcrypt.hash(password, salt, function(err, hash) {
        console.log(hash);
        
      });
    });
}

module.exports = app;
