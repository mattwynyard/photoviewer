'use strict';
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db.js');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const users = require('./user.js');
const jwt = require('jsonwebtoken');
const jwtKey = process.env.KEY;
const jwtExpirySeconds = 300;

const fs = require('fs');
const https = require('https');
const http = require('http');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;
const environment = process.env.ENVIRONMENT;


//comment out create server code below when deploying to server
//server created in index.js
console.log("mode: " + environment);
if(environment === 'production') {
  let hostname = "localhost";
 http.createServer(function(req, res) {
  }).listen(port, hostname, () => {
      console.log(`Listening: http://${hostname}:${port}`);
   });
} else {
  const options = {
    key: fs.readFileSync('./server.key', 'utf8'),
    cert: fs.readFileSync('./server.cert', 'utf8')
  }
  https.createServer(options, app).listen(port, () => {
    console.log(`Listening: https://${host}:${port}`);
    });
}

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: false }))
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  next();
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
    console.log("user doesn't exist");
  } else {
    let count = await db.users(user);
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
        //console.log(projects);
        let arr = []; //project arr
        for (var i = 0; i < projects.rows.length; i += 1) {
          arr.push(projects.rows[i]);
        }
        response.set('Content-Type', 'application/json');
        response.cookie('token', token, { maxAge: jwtExpirySeconds * 1000 });
        response.json({ result: true, user: user, token: token, projects: arr});
        users.addUser({
          name: user,
          token: token,
          }
        );
      } else {    
        console.log("Incorrect password");   
        response.send({ result: false, error: "incorrect password" });
      }
    }); 
  }  
});

app.post('/logout', (req, res, next) => {
  if (req.headers.authorization === this.token) {
    users.deleteToken(req.body.token);
    res.send({success: true});
  } else {
    res.send({success: false});
  }
});
/**
 * Gets fault classes from db
 * i.e. user clicked filter from menu
 */
app.post('/class', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    var fclass = await db.class();
    res.set('Content-Type', 'application/json')
    res.send(fclass.rows);
  } else {
    res.send({error: "Invalid token"});
    console.log("invalid token");
  }
});
/**
 * ****** DEPRECIATED ***********
 * gets faults for specific class
 * 
 */
app.post('/faults', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    var faults = await db.faults(req.body.type);
    //console.log(faults.rows);
    res.set('Content-Type', 'application/json')
    res.send(faults.rows);
  } else {
    res.send({error: "Invalid token"});
    console.log("invalid token");
  }
});

app.post('/dropdown', async (req, res) => {
  
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let project = req.body.project;
    let surface = await db.projecttype(project);
    if (surface.rows[0].surface === "footpath") {
      let grade = await db.grade(project);
      let asset = await db.asset(project);
      let zone = await db.zone(project);
      let type = await db.type(project);
      res.set('Content-Type', 'application/json');
      res.send({priority: grade.rows, asset: asset.rows, zone: zone.rows, type: type.rows});
    } else {

    }
       
  }
});
/**
 * gets faults for specfic filter (project - fault type - priority)
 * from db
 */
app.post('/layer', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let project = req.body.project;
    let filter = req.body.filter;
    let priority = req.body.priority;
    let geometry = null;
    let surface = await db.projecttype(project);
    console.log(filter);
    if (surface.rows[0].surface === "footpath") {
      geometry = await db.footpath(project, filter, priority);

    } else if (surface.rows[0].surface === "road") {
      geometry = await db.layer(project, filter, priority);
    } else {
      res.send({error: "Layer not found"});
    }
    if (filter.length === 0) {
      await db.updateLayerCount(project);
    } else {
      await db.updateFilterCount(project);
    }  
    res.set('Content-Type', 'application/json')
    res.send({type: surface.rows[0].surface, geometry: geometry.rows});
  } else {
    res.send({error: "Invalid token"});
    console.log("invalid token");
  } 
});
/**
 * gets centrelines for specfic ta code
 */
app.post('/roads', async (req, res, next) => {
  //console.log(req.body);
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  const code = req.body.code;
  if (result) {
    var layer = req.body.menu;
    var geometry = await db.road(code);
    //console.log(geometry.rows);
    res.set('Content-Type', 'application/json');
    res.send(geometry.rows);
  } else {
    console.log("Resource unavailable")

  }  
});

app.post('/gps', (req, res, next) => {
  console.log(req.body);
  res.set('Content-Type', 'application/json');
  res.send({ express: 'Server online' });
});

async function  generatePassword(password, rounds) {
  await bcrypt.genSalt(rounds, function(err, salt) {
      if (err) throw err;
      bcrypt.hash(password, salt, function(err, hash) {
        console.log(hash);     
      });
    });
}
module.exports = app;