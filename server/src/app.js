'use strict';
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db.js');
const bodyParser = require('body-parser');
const axios = require('axios');
const bcrypt = require('bcrypt');
const app = express();
const users = require('./user.js');
const jwt = require('jsonwebtoken');
const jwtKey = process.env.KEY;
const jwtExpirySeconds = 10000;
const fs = require('fs');
const https = require('https');
const http = require('http');
const { debug } = require('console');
const port = process.env.PROXY_PORT;
const host = process.env.PROXY;
const environment = process.env.ENVIRONMENT;
const rammURL = "https://map-auea.ramm.com/v2/mapping/settingdata/1/31dc372b-4473-4d5c-945a-d6c53f60a657/?format=geojson&projection=nztm&forcePoint=false&description=Road%20Survey%20Results"


// comment out create server code below when deploying to server
// server created in index.js
const options = {
  key: fs.readFileSync('./server.key', 'utf8'),
  cert: fs.readFileSync('./server.cert', 'utf8')
}
console.log("mode: " + environment);
if(environment === 'production') {
  let hostname = "localhost";
 http.createServer(function(req, res) {
  }).listen(port, hostname, () => {
      console.log(`Listening: http://${hostname}:${port}`);
   });
} else {
  https.createServer(options, app).listen(port, () => {
    console.log(`Listening: https://${host}:${port}`);
    });
}

const requestStatus = async () => {
  let values = "";
  axios.get(rammURL)
  .then( async (response) => {
    let data = response.data.features;
    let count = 0; 
    for (let i = 0; i < data.length; i++) {
      let status = data[i].properties.fault_status;
      let id = "'" + "MDC_RD_0521_" + String(data[i].properties.supplier_fault_id).padStart(5, '0') + "'";
      if (status.toLowerCase() === "programmed") {
        values += "(" + id + ", 'programmed'), ";
        count++;
      } else if (status.toLowerCase().includes("completed")) {
        values += "(" + id + ", 'completed'), ";
        count++;
      } else if (status.toLowerCase() === "no action required") {
        values += "(" + id + ", 'no action required'), ";
        count++;
      } else {

      }
      if (i === data.length - 1) {
        values = values.substring(0, values.length - 2)
      }
    }

    let res = await db.updateStatus(values);
  })
  .catch(error => {
    console.log(error);
  });
  
}

app.use(cors());
app.use(morgan('dev'));
app.use(helmet());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json({limit: '50mb', extended: false}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))
// Parse JSON bodies (as sent by API clients)


app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

app.get('/api', async (req, res) => {
  let result = await db.public();
  res.send({ projects: result });
});

app.post('/login', async (request, response) => {
  requestStatus();
  let password = request.body.key;
  let user = request.body.user;
  let p = await db.password(user);
  if (p.rows.length == 0) { //user doesn't exist
    response.send({ result: false, error: "user doesnt exist" });
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
        //succeded = true;
        count = count += 1;
        await db.updateCount(count, user);
        this.token = token;
        let projects = await db.projects(user);
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
        response.send({ result: false, error: "incorrect password" });
      }
    }); 
  }  
});

app.post('/logout', (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    users.deleteToken(req.body.token);
    res.send({success: true});
  } else {
    res.set('Content-Type', 'application/json');
    res.send({success: false});
    
    //res.send({error: "Invalid token"});
  }
});

app.post('/user', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
    if (result) {
      try {
        if (req.body.type === "insert") {
          let salt = genSalt(req.body.password);
          salt.then(function(result) {
            let hash = genHash(req.body.password, result.salt);
            hash.then(async function(result) {
              try {
                let q = await db.addUser(req.body.client, result);
                if(q.rowCount === 1) {
                  res.send({success: true})
                } else {
                  res.send({success: false, error: q})
                }
              } catch(err) {
                res.send({error: err.err.detail})
              }
            })
          });
        } else if (req.body.type === "delete") {
          try {
            let q = await db.deleteUser(req.body.client);
            if(q.rowCount === 1) {
              res.send({success: true})
            } else {
              res.send({success: false})
            }
          } catch(err) {
            res.send({error: err.err.detail})
          }
        } else {
          try {
            let q = await db.updateUser(req.body.client);
            if(q.rowCount === 1) {
              res.send({success: true})
            } else {
              res.send({success: false})
            }
          } catch(err) {
            res.send({error: err.err.detail})
          }
        }
        
      } catch (err) {
        res.send({error: err});
        next(err);
      }
    } else {
      res.set('Content-Type', 'application/json');
      res.send({error: "Invalid token"});
    }
});

app.post('/usernames', async (req, res) => {
 
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if(result) {
    let result = await db.usernames(req.body.client);
    let arr = [];
    for (let i = 0; i < result.rows.length; i++) {
      if(result.rows[i].username !== "admin") {
        arr.push(result.rows[i].username);
      }

    }
    res.send({success: true, usernames: arr})
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/selectprojects', async (req, res, next) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let result = await db.selectprojects(req.body.client);
    res.send({success: true, projects: result.rows})
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/project', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if(result) {
      if (req.body.type === "insert") {
        try {
          let q = await db.addProject(req.body);    
          if(q.rowCount === 1) {
            res.send({success: true})
          } else {
            res.send({success: false})
          }
        } catch (err) {
          res.set('Content-Type', 'application/json');
          res.send({error: err.err.detail});
        }
      } else {
        try {
          let surface = await db.projecttype(req.body.project);
          if (surface.rowCount === 1) {
            let result = await db.deleteProjectData (req.body.project, surface.rows[0].surface);
            let parent = false;
            if (req.body.parent) {
              let q = await db.deleteProject(req.body.project);
              if(q.rowCount === 1) {
                parent = true;
              } 
            }
            res.set('Content-Type', 'application/json');
            res.send({rows: "Deleted " + result.rowCount + " rows", parent: parent});
            
          } else {
            res.set('Content-Type', 'application/json');
            res.send({rows: "Project not found", parent: false});
          }
        } catch (err) {
          console.log(err)
          res.set('Content-Type', 'application/json');
          res.send({error: err.err.detail});
        }
      }     
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
    
});

app.post('/view', async(req, res) => {
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project.code);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    res.set('Content-Type', 'application/json');
    try {
      let result = await db.buildView(req.body.project.code);
      res.send({success: true});
    } catch (err) {
      console.log(err);
      res.send({error: err});
    }
    
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/carriageway', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project.code);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    if (req.body.project.code === null) {
      res.send({error: "No project selected"});
    } else {
      res.set('Content-Type', 'application/json');
      let result = null;
      let data = null;
      try {      
          result = await db.closestCarriage(req.body.query.lat, req.body.query.lng, false);
          data = result.rows[0];      
      } catch (err) {
        console.log(err);
        res.send({error: err});
      }
      if (result.rowCount != 0) {
        res.send({success: true, data: data});
      } else {
        res.send({success: false, data: null});
      }
    } 
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

/**
 * Finds closest carraigeway or footpath to mouse click
 * 
 */
app.post('/carriage', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project.code);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {

    if (req.body.project.code === null) {
      res.send({error: "No project selected"});
    } else {
      res.set('Content-Type', 'application/json');
      let result = null;
      let data = null;
      try {
        if (req.body.project.surface === 'footpath') {
          result = await db.closestFootpath(req.body.lat, req.body.lng);
          data = result.rows[0];
        } else {
          result = await db.closestCarriage(req.body.lat, req.body.lng, true); //<--true if using archive table
          data = result.rows[0];
        }
        
      } catch (err) {
        console.log(err);
        res.send({error: err});
      }
      if (result.rowCount != 0) {
        res.send({success: true, data: data});
      } else {
        res.send({success: false, data: null});
      }
    } 
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/centrelines', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    //need hasRating? data query 
    let result = await db.roadLines(req.body.project);
    //let result = await db.rating(req.body.project);
    //console.log(result)
    if (result.rowCount != 0) {
      res.send({success: true, data: result.rows});
    } else {
      res.send({success: false, data: []});
    }
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

/**
 * endpoint for returning carriage rating data
 */
app.post('/rating', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    let result = await db.rating(req.body.project);
    //console.log(result)
    if (result.rowCount != 0) {
      res.send({success: true, data: result.rows});
    } else {
      res.send({success: false, data: []});
    }
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/photos', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project.code);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    if (req.body.project.code === null) {
      res.send({error: "No project selected"});
    } else {
      res.set('Content-Type', 'application/json');
      let result = null;
      let data = null;
      let side = null;
      try {
        if (req.body.side === null) {
          if (req.body.project.surface === 'footpath') {
            result = await db.getFPPhotos(req.body.carriageid, req.body.project.code);
          } else {
            result = await db.getPhotos(req.body.carriageid, null);
          }
          
        } else {
          side = req.body.side;
          result = await db.getPhotos(req.body.carriageid, side);
        }
        data = result.rows;
      } catch (err) {
        console.log(err);
        res.send({error: err});
      }
      if (result.rowCount != 0) {
        res.send({success: true, data: data, side: side});
      } else {
        res.send({success: false, data: null});
      }
    } 
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/changeSide', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project.code);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    if (req.body.project.code === null) {
      res.send({error: "No project selected"});
    } else {
      res.set('Content-Type', 'application/json');
      let result = null;
      let data = null;
      let newPhoto = null;
      try {
        let opposite = await db.oppositePhoto(req.body.carriageid, req.body.side, req.body.erp);
        newPhoto = opposite.rows[0];
        result = await db.getPhotos(req.body.carriageid, req.body.side);
        data = result.rows;
      } catch (err) {
        console.log(err);
        res.send({error: err});
      }
      if (result.rowCount != 0) {
        res.send({success: true, data: data, newPhoto: newPhoto});
      } else {
        res.send({success: false, data: null});
      }
    } 
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});


app.post('/archive', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project.code);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    if (req.body.project.code === null) {
      res.send({error: "No project selected"});
    } else {
      res.set('Content-Type', 'application/json');
      try {
        let surface = req.body.project.surface;
        let result = null;
        let data = null; 
        let fdata = null;
        
        if (surface === "road") {
          if (req.body.side !== null) {
            result = await db.archiveVideoPhoto(req.body.project.code, req.body.lat, req.body.lng, req.body.side);
          } else {
            result = await db.archivePhoto(req.body.project.code, req.body.lat, req.body.lng);
          }
          data = result.rows[0];     
          if (result.rowCount !== 0) {
            fdata = formatData(data);
          }       
        } else {
          result = await db.archiveFPPhoto(req.body.project.code, req.body.lat, req.body.lng);
          data = result.rows[0];
          fdata = formatData(data);
        }   
        if (result.rowCount != 0) {
          res.send({success: true, data: fdata});
        } else {
          res.send({success: false, data: null});
        }
      } catch (err) {
        console.log(err);
        res.send({error: err});
      }
    } 
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/archiveData', async(req, res) => {
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project.code);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    res.set('Content-Type', 'application/json');
    try {
      let result = null;
      let data = null;
      let fdata = null;
      if(req.body.project.surface === "footpath") {
        result = await db.archiveFPData(req.body.project.code, req.body.photo);
        data = result.rows[0];
        fdata = formatData(data);
      } else {
        result = await db.archiveData(req.body.project.code, req.body.photo);
        data = result.rows[0];
        fdata = formatData(data);
      }
      if (result.rowCount != 0) {
        res.send({success: true, data: fdata});
      } else {
        res.send({success: false, data: null});
      }
    } catch (err) {
      console.log(err);
      res.send({error: err});
    }
    
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/district', async (req, res) => {
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }

  if (result) {
    try {
      let result = await db.district(req.body.project);
      let district = result.rows[0].description;
      res.set('Content-Type', 'application/json');
      res.send({success: true, district: district});
    } catch (err) {
      res.set('Content-Type', 'application/json');
      res.send({success: false});
    }
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});
/**
 * Gets fault classes from db
 * i.e. user clicked filter from menu
 */
app.post('/class', async (req, res) => {
  let result = false;
  let project = req.body.project
  if (req.body.user === 'Login') {
    result = await db.isPublic(project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let isArchive = await db.isArchive(project); 
    let archive = isArchive.rows[0].isarchive
    let fclass = await db.class(project, archive);
    res.set('Content-Type', 'application/json')
    res.send(fclass.rows);
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  } 
});
  
/**
 * gets faults for specific class
 * 
 */
app.post('/faults', async (req, res) => {
  let result = false;
  let project = req.body.project;
  if (req.body.user === 'Login') {
    result = await db.isPublic(project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let isarchive = await db.isArchive(project); 
    let archive = isarchive.rows[0].isarchive
    let faults = await db.faults(project, req.body.code, archive);
    let result = [];
    for (let i = 0; i < faults.rows.length; i++) {
      result.push(faults.rows[i].fault)
    }
    res.set('Content-Type', 'application/json')
    res.send({result: result});
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  } 
});

app.post('/age', async (req, res) => { 
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let project = req.body.project;
    let archive = await db.isArchive(project);
    let result = await db.inspection(project, archive.rows[0].isarchive);
    res.set('Content-Type', 'application/json'); 
    res.send({result: result.rows});  
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
} 
});

app.post('/settings', async (req, res) => { 
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let project = req.body.project;
    let result = await db.settings(project);
    res.set('Content-Type', 'application/json'); 
    res.send({priority: result.rows[0].priority, reverse: result.rows[0].reverse, video: result.rows[0].hasvideo, 
      centreline: result.rows[0].centreline, ramm: result.rows[0].ramm});  
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
} 
});

app.post('/priority', async (req, res) => { 
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let project = req.body.project;
    let surface = await db.projecttype(project);
    let archive = await db.isArchive(project); 
    if (surface.rows[0].surface === "footpath") {
      let result = await db.filters(project, "grade", archive.rows[0].isarchive);
      let grade = []
      for (let i = 0; i < result.rows.length; i++) {
        let value = Object.values(result.rows[i]);
        if (value[0] === '1' || value[0] === '2') {
          continue;
        } else {
          grade.push(value[0]);
        }
      }
      res.set('Content-Type', 'application/json'); 
      res.send({priority: grade});        
    } else {
      let result = await db.priority(project, archive.rows[0].isarchive);
      let priority = [];
      for (let i = 0; i < result.rows.length; i++) {
        let value = Object.values(result.rows[i]);
        priority.push(value[0]);
      }
      res.set('Content-Type', 'application/json'); 
      res.send({priority: priority});        
    }    
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
} 
});

app.post('/dropdown', async (req, res) => { 
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let project = req.body.project;
    let code = req.body.code;
    let data = await db.filters(project, code);
    let result = [];
    for (let i = 0; i < data.rows.length; i++) {
      let value = Object.values(data.rows[i]);
      result.push(value[0]);
    }
    res.set('Content-Type', 'application/json');
    res.send({result: result});   
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
} 
});
/**
 * gets faults for specfic filter (project - fault type - priority)
 * from db
 */
app.post('/layer', async (req, res) => {
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    let project = req.body.project;
    let filter = req.body.filter;
    let priority = req.body.priority;
    let inspection = req.body.inspection;
    let faults = req.body.faults;
    let assets = req.body.assets;;
    let types = req.body.types;
    let causes = req.body.causes;
    let isCompleted = false;
    let finalPoints = null;
    let finalLines = null;
    let options = {priority: [], status: []};
    let surface = await db.projecttype(project);
    let isarchive = await db.isArchive(project); 
    let archive = isarchive.rows[0].isarchive;
    for (let i = 0; i < priority.length; i++) {
      if (priority[i] === 98) {
        options.status.push("completed");
        isCompleted = true;
      } 
      else if (priority[i] === 97) {
        options.status.push("programmed")
      } else {
        options.priority.push(priority[i])
      }
    }
    let activePoints = [];
    let activeLines = [];
    let completedPoints = [];
    let completedLines = [];
    if (surface.rows[0].surface === "footpath") { ///**** FIX FOOTPATH QUERY */
      if (options.priority.length !== 0) {
        let geometry = await db.footpath(project, options, assets, faults, types, causes);
        activePoints = geometry.rows;
        activeLines = [];
      } 
      if (isCompleted) {
        let points = await db.footpathCompleted(project, assets, faults, types, causes);
        completedPoints = points.rows;
        completedLines = [];
      }
      finalPoints = activePoints.concat(completedPoints);
    } else if (surface.rows[0].surface === "road") {
        if (archive) {
          let points = await db.road(project, filter, options, inspection);
          activePoints = points.rows;
          activeLines = [];
          points = await db.roadCompleted(project, filter, inspection);
          completedPoints = points.rows;
          completedLines = [];
        } else {
          let points = await db.geometries(project, filter, options, inspection, "ST_Point", 'active');
          let lines = await db.geometries(project, filter, options, inspection, "ST_LineString", 'active');
          activePoints = points.rows;
          activeLines = lines.rows;
          if (options.status.length !== 0) {
            let points = await db.geometries(project, filter, options, inspection, "ST_Point", 'completed');
            let lines = await db.geometries(project, filter, options, inspection, "ST_LineString", 'completed');
            completedPoints = points.rows;
            completedLines = lines.rows; 
          }  
        }      
    } else {
      res.send({error: "Layer not found"});
    }  
    finalPoints = activePoints.concat(completedPoints);
    finalLines = activeLines.concat(completedLines);
    
    res.set('Content-Type', 'application/json');
    res.send({type: surface.rows[0].surface, points: finalPoints, lines: finalLines});
  } else {
    res.send({error: "Invalid token"});
  } 
});
/**
 * gets centrelines for specfic ta code
 */
app.post('/roads', async (req, res) => {
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  let code = req.body.code;
  if (result) {
    let layer = req.body.menu;
    let geometry = await db.road(code);
    res.set('Content-Type', 'application/json');
    res.send(geometry.rows);
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
} 
});

app.post('/update', async (req, res) => {
  const token = users.findUserToken(req.headers.authorization, req.body.user);
  if (token) {
    let result = await db.projecttype(req.body.project);
    let surface = result.rows[0].surface;
    let rows = 0;
    let errors = 0;
    for (let i = 1; i < req.body.data.length; i++) { //skip header
      let id = req.body.data[i][0];
      let status = "completed"
      let date = req.body.data[i][1];
      let notes = req.body.data[i][2];
      let newDate = formatDate(date);
      if (newDate === 'error') {
        errors++;
        break;
      } else {
        result = await db.updateStatus(req.body.project, surface, id, status, newDate, notes);
        if(result.rowCount === 1) {
          rows += result.rowCount;
        } else {
          errors++;
        }
      }  
    }  
    res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"})
  }else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
} 
});

app.post('/status', async (req, res) => {
  const token = users.findUserToken(req.headers.authorization, req.body.user);
  if (token) {
    let id = req.body.marker[0].id;
    let project = req.body.project;
    let status = req.body.status;
    let date = req.body.date;
    let result = await db.projecttype(project);
    let surface = result.rows[0].surface;
    result = await db.updateStatus(project, surface, id, status, date);
    if(result.rowCount === 1) {
      res.set('Content-Type', 'application/json');
      res.send({rows: "Updated 1 row"});
    } else {
      res.set('Content-Type', 'application/json');
      res.send({error: "failed to update"});
    }
  }else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  } 
});

app.post('/gps', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send({ express: 'Server online' });
});

app.post('/import', async (req, res) => {
  const token = users.findUserToken(req.headers.authorization, req.body.user);
  if(token) {
    let project = req.body.project;
    let surface = await db.projecttype(project);
    if (surface.rows[0].surface === "road") {
      let rows = 0;
      let errors = 0;
      for (let i = 1; i < req.body.data.length; i++) {  
        let data =  req.body.data[i];
        if (data[0] === '') {
          continue;
        }
        try {
          let result = await db.import(data);
          if(result.rowCount === 1) {
            rows++;
          } else {
            errors++
          }
        } catch(err) {
          errors++
          //console.log(err);
        }
      } 
      res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"})
    } else {
      let rows = 0;
      let errors = 0;
      for (let i = 1; i < req.body.data.length - 1; i++) {  
        let data =  req.body.data[i];
        try {
        let result = await db.importFootpath(data);
        if(result.rowCount === 1) {
          rows++;
        } else {
          errors++
        }
      } catch(err) {
        errors++
        //console.log(err);
      }   
    }
    res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"})
  }
 
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

//builds address for photo 
function formatData(data) {
  let address = buildAddress([data.house, data.street, data.suburb, data.town]);
  let obj = {photo: data.photo, roadid: data.roadid, erp: data.erp, footpathid: data.footpathid, 
    side: data.side, latitude: data.latitude, longitude: data.longitude, dist: data.dist, address: address, ramm: data.ramm};
  return obj;
}

function buildAddress(data) {
  let address = "";
  data.forEach(element => {
    if(element != null) {
      address += element + " ";
    }
  });
  return address;
}
function formatDate(date) {
  let tokens = null;
    try {
      tokens = date.split('/');
    } catch (err) {
        return 'error'; 
      }
  return tokens[2] + '-' + tokens[1] + '-' + tokens[0];

}

function genSalt() {
  return new Promise(async (resolve, reject) => {
    await bcrypt.genSalt(10, function(err, salt) {
      if (err) {
        reject(err);
      } else {
        resolve({
          salt: salt
        });
      }
    });
  });
}

async function genHash(password, salt) {
    return new Promise(async (resolve, reject) => {
    await bcrypt.hash(password, salt, async function(err, hash) {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
  });
}
module.exports = app;