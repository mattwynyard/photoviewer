'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const db = require('./db.js');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const app = express();
const users = require('./user.js');
const util = require('./util.js');
const fs = require('fs');
const { Server } = require("socket.io");
const proxy_port = process.env.PROXY_PORT;
const port = process.env.PORT;
const host = process.env.PROXY;
const environment = process.env.ENVIRONMENT;
// comment out create server code below when deploying to server
// server created in index.js

const dataController  = require('./controllers/dataController');
const securityController = require('./controllers/securityController');
const geometryController = require('./controllers/geometryController');
const videoController = require('./controllers/videoController');
const securityServices = require('./services/securityServices');
let server = null;

if(environment === 'production') {
  const http = require('http');
  server = http.createServer(app).listen(proxy_port, () => {
    console.log(`Listening: http://${host}:${proxy_port}`);
  })
} else {
  const https = require('https');
  const options = {
    key: fs.readFileSync('./server.key', 'utf8'),
    cert: fs.readFileSync('./server.cert', 'utf8')
  }
  server = https.createServer(options, app).listen(port, () => {
    console.log(`Listening: https://${host}:${port}`);
  });
}
const io = new Server(server, {
  cors: {
    origin: ["https://osmium.nz", "http://localhost:3000"],
    methods: ["GET", "HEAD"],
  },
  secure: true,

})
io.use(async (socket, next) => {
  try {
    const security = await securityServices.isAuthorized(socket.handshake.auth.user, 
      socket.handshake.query.project, socket.handshake.auth.token);
    if (!security) {
      socket.disconnect()
      next(new Error({error: "invalid credentials"}));
    } else {
      next()
    }
  } catch (err) {
    console.log(err)
  }
});
io.on('connection', async (socket) => {
  const uuid = uuidv4()
  socket.on('header', async query => {
    const header = await videoController.downloadHead(socket, query)
    socket.emit("header", {header: header, uuid: uuid})
  })
  socket.on('download', async (uuid) => {
    //console.log(uuid)
    const result = await videoController.download(socket, uuid)
    //console.log(result)
    socket.emit("end", result, uuid)
  })
  socket.on('delete', async (filename, uuid) => {
    const result = await videoController.cleanup(filename, uuid)
    socket.emit("cleanup", result)
  })

})
io.on('error', (err) => {
  console.log(err)
})

io.on('disconnect', () => {
  console.log("disconnect")
})

console.log("mode: " + environment);
app.use(cors());
app.use(helmet());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.json({limit: '50mb', extended: false, strict: true}));
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

app.post('/import', dataController.importer);

app.post('/login', securityController.login);

app.post('/logout', securityController.logout);

app.post('/mapbox', securityController.mapbox);

app.get('/closestcarriage', geometryController.closestCarriage);

app.get('/changeside', videoController.changeSide);

app.get('/photos', videoController.photos);

app.get('/closestvideophoto', videoController.closestVideoPhoto);

app.get('/download', videoController.downloadVideo);

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
                  res.send({success: true, type: 'insert'})
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
              
              res.send({success: true, type: 'delete'})
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
              res.send({success: true, type: 'update'})
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

app.post('/selectprojects', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    let result = await db.selectprojects(req.body.client);
    res.send({success: true, projects: result.rows})
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  }
});

app.post('/clients', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  if (result) {
    try {
      let clients = await db.clients();
      res.send({result: clients.rows});
    } catch (err) {
      console.log(err)
      res.send({error: err.detail});
    }
  } else {
    res.send({error: "Invalid token"});
}
});

app.post('/projects', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  res.set('Content-Type', 'application/json');
  if (result) {
    try {
      let projects = await db.projects(req.body.query.user);
      res.send({result: projects.rows});
    } catch (err) {
      res.send({error: err.detail});
    }
  } else {
      res.send({error: "Invalid token"});
  }
});

app.post('/project', async (req, res) => {
  const result = users.findUserToken(req.headers.authorization, req.body.user);
  res.set('Content-Type', 'application/json');
  if(result) {
      if (req.body.type === "insert") {
        try {
          let q = await db.addProject(req.body); 
          if(q.rowCount === 1) {
            res.send({type: "insert", rows: q.rowCount});   
          } else {
            res.send({type: "error", rows: q.rowCount});  
          }
        } catch (err) {
          
          res.send({error: err.detail});
        }
      } else if (req.body.type === "delete") {
        try {
          let surface = await db.projecttype(req.body.code);
          let archive = await db.isArchive(req.body.code);
          let project = null
          if (surface.rowCount === 1) {
            let data = await db.deleteProjectData (req.body.code, surface.rows[0].surface, archive.rows[0].isarchive);
            if (!req.body.dataOnly) {
              project = await db.deleteProject(req.body.code);
            }
            res.send({type: "delete", rows: data.rowCount, parent: project ? project.rowCount : 0});          
          } else {
            res.send({type: "error", rows: data.rowCount, parent: project.rowCount});
          }
        } catch (err) {
          console.log(err)
          res.send({error: err.detail});
        }
      } else if (req.body.type === "update") {
        try {
          let project = {code: req.body.code, description: req.body.description, date: req.body.date, surface: req.body.surface, amazon: req.body.amazon, 
            public: req.body.public, priority: req.body.priority, reverse: req.body.reverse, video: req.body.video, ramm: req.body.ramm, 
            centreline: req.body.centreline, rmclass: req.body.rmclass, tacode: req.body.tacode};
          let result = await db.updateProject(project); 
          res.send({type: "update", rows: result.rowCount});     
        } catch (err) {
          console.log(err)
          res.send({error: err.detail});
        }
      }      
    } else {
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
          const view = util.getCentrelineView(req.body.user)
          if (view) {
            result = await db.closestCarriageFromView(view, req.body.project.code, req.body.lat, req.body.lng);
          } else {
            result = await db.closestCarriage(req.body.lat, req.body.lng, true);
          }
          
          data = result.rows[0];
        }
        
      } catch (err) {
        console.log(err);
        res.send({error: err});
      }
      if (result.rowCount !== 0) {
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
    
    let result = await db.roadLines(req.body.project);
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

app.post('/rating', async(req, res) => {
  let security = false;
  if (req.body.user === 'Login') {
    security = await db.isPublic(req.body.project.code);
  } else {
    security = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    if (req.body.project.surface === 'footpath') {
      let result = await db.footpathRating(req.body.user, req.body.project.code, req.body.filter);
      res.send({success: true, data: result.rows});
    } else {
      let result = await db.roadLines(req.body.project.code, req.body.filter);
      res.send({success: true, data: result.rows});
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
    security = await users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (security) {
    if (!req.body.project) {
      res.send({error: "No project selected"});
      return;
    } else {
      res.set('Content-Type', 'application/json');
      let result = null;
      let data = null;
      let newPhoto = null;
      try {
        const opposite = await db.oppositePhoto(req.body.carriageid, req.body.side, req.body.erp);
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

app.post('/archivedata', async(req, res) => {
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
      res.send({result: district});
    } catch (err) {
      res.set('Content-Type', 'application/json');
      res.send({error: err});
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
    let fclass = await db.class(req.body.user, project, archive);
    res.set('Content-Type', 'application/json')
    res.send(fclass.rows);
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  } 
});

/**
 * Gets fault classes from db
 * i.e. user clicked filter from menu
 * const FOOTPATH_FILTERS = ["Asset", "Fault", "Type", "Cause"];
 */
 app.post('/filterdata', async (req, res) => {
  let result = false;
  let project = req.body.project.code;
  let user = req.body.user;
  let token = req.headers.authorization;
  if (user === 'Login') {
    result = await db.isPublic(project);
  } else {
    result = users.findUserToken(token, user);
  }
  if (result) {
    try {
      let archive = req.body.project.isarchive;
      let faultData = null;
      let surface = req.body.project.surface;
   
      if (surface === "footpath") {
        faultData = [{code: "Asset", description: "Asset"}, {code:  "Fault", description: "Fault"} , 
        {code:  "Type", description: "Type"} , {code: "Cause", description: "Cause"}];
      } else {
        let fclass = await db.class(user, project, archive);
        faultData = fclass.rows;
      }
      for (let i = 0; i < faultData.length; i++) {
        if (surface === "road") {
          let faults = await db.faults(user, project, faultData[i].code, archive);
          faultData[i].data = faults.rows;
        } else {
            let faults = await db.footpathFilters(project, faultData[i].description, req.body.type, req.body.query);
            faultData[i].data = faults.rows;
        }    
      }
      console.log(faultData[0].data)
      res.set('Content-Type', 'application/json')
      res.send({result: faultData});
    } catch (error) {
      res.set('Content-Type', 'application/json')
      res.send({error: error});
    }
    
  } else {
    res.set('Content-Type', 'application/json');
    res.send({error: "Invalid token"});
  } 
});

app.post('/age', async (req, res) => { 
  let result = false;
  try {
    if (req.body.user === 'Login') {
      result = await db.isPublic(req.body.project);
    } else {
      result = users.findUserToken(req.headers.authorization, req.body.user);
    }
  
    if (result) {
      let project = req.body.project;
      let archive = await db.isArchive(project);
      let type = await db.projecttype(req.body.project);
      let result = await db.inspection(req.body.user, project, archive.rows[0].isarchive, type.rows[0]);
      res.set('Content-Type', 'application/json'); 
      res.send({result: result.rows});  
    } else {
      res.set('Content-Type', 'application/json');
      res.send({error: "Invalid token"});
    } 
  } catch (error) {
    res.set('Content-Type', 'application/json');
    res.send({error: error});
  }
  
});

app.post('/layerdropdowns', async (req, res) => { 
  let result = false;
  if (req.body.user === 'Login') {
    result = await db.isPublic(req.body.project.code);
  } else {
    result = users.findUserToken(req.headers.authorization, req.body.user);
  }
  if (result) {
    try {
      let project = req.body.project.code;
      let surface = req.body.project.surface;
      let archive = req.body.project.isarchive;
      let hasClass = req.body.project.rmclass;
      let rmclass = [];
      let priority = [];
      if (hasClass) {
        let result = await db.rmclass(project, req.body.user);
        let values = [];
        for (let i = 0; i < result.rows.length; i++) {
          let value = Object.values(result.rows[i]);
          values.push(value[0]);
        }
        rmclass = values;
      }
      if (surface === "footpath") {
        let result = await db.grade(project);
        for (let i = 0; i < result.rows.length; i++) {
          let value = Object.values(result.rows[i]);
          if (value[0] === '1' || value[0] === '2') {
            continue;
          } else {
            priority.push(value[0]);
          }
        }      
      } else {
        let result = await db.priority(req.body.user, project, archive); 
        for (let i = 0; i < result.rows.length; i++) {
          let value = Object.values(result.rows[i]);
          priority.push(value[0]);
        }       
      } 
      res.set('Content-Type', 'application/json'); 
      res.send({result: {priority: priority, rmclass: rmclass}});
    } catch (error) {
      res.set('Content-Type', 'application/json'); 
      res.send({error: error});
    }
        
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
    const user = req.body.user;
    let project = req.body.project;
    let filter = req.body.filter; //fix for zero length filter
    let priority = req.body.priority;
    let rclass = req.body.rmclass;
    let inspection = req.body.inspection;
    let isCompleted = false;
    let finalPoints = null;
    let finalLines = null;
    let options = {priority: [], status: []};
    let surface = req.body.surface;
    let archive = req.body.archive;
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
    if (surface === "footpath") { 
      const view = util.getFaultView(req.body.user)
      if (options.priority.length !== 0) {
        let geometry = await db.footpath(view, project, options, filter);
        activePoints = geometry.rows;
        activeLines = [];
      } 
      if (isCompleted) {
        let points = await db.footpathCompleted(view, project, filter);
        completedPoints = points.rows;
        completedLines = [];
      }
      finalPoints = activePoints.concat(completedPoints);
    } else if (surface === "road") {
        if (archive) {
          let points = await db.roadArchive(project, filter, options, inspection);
          activePoints = points.rows;
          activeLines = [];
          points = await db.roadArchiveCompleted(project, filter, inspection);
          completedPoints = points.rows;
          completedLines = [];
        } else {
          let points = await db.geometries(req.body.user, project, filter, options, inspection, rclass, "ST_Point", 'active');
          let lines = await db.geometries(req.body.user, project, filter, options, inspection, rclass, "ST_LineString", 'active');
          activePoints = points.rows;
          activeLines = lines.rows;
          if (options.status.length !== 0) {
            let points = await db.geometries(req.body.user, project, filter, options, inspection, rclass, "ST_Point", 'completed');
            let lines = await db.geometries(req.body.user, project, filter, options, inspection, rclass, "ST_LineString", 'completed');
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
    res.send({type: surface, points: finalPoints, lines: finalLines});
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

// app.post('/import', async (req, res) => {
//   const token = users.findUserToken(req.headers.authorization, req.body.user);
//   if(token) {
//     let project = req.body.project;
//     let staged = req.body.staged;
//     let surface = await db.projecttype(project);
//     let clientResult = await db.client(project);
//     let client = clientResult.rows[0].client;
//     if (client === 'asm') staged = true;
//     let rows = 0;
//     let errors = 0;
//     let inserted = 0;
//     if (surface.rows[0].surface === "road") {
     
//       for (let i = 1; i < req.body.data.length - 1; i++) {  
//         let data =  req.body.data[i];
//         rows++;
//         try {
//           let result = null;
//           if (!staged ) {
//             result = await db.import(data);
//             if(result.rowCount === 1) {
//               inserted++;
//             } else {
//               console.log(result)
//               errors++
//             }
//           } else { //staged
//             try {
//               result = await db.stagedImport(data, client);
//               if(result.rowCount === 1) {
//                 inserted++;
//               } else {
//                 console.log(result)
//                 errors++
//               }
//             } catch(err) {
//               console.log(err)
//             }
//           }
//         } catch(err) {
//           errors++;
//           console.log(err)
//           break;
//         }
//       }
//       res.send({rows: `Inserted ${inserted} of ${rows} records, errors: ${errors} rows failed to insert`});
//     } else {
//       let rows = 0;
//       let errors = 0;
//       let fatal = null;
//       for (let i = 1; i < req.body.data.length - 1; i++) {  
//         let data =  req.body.data[i];
//         try {
//           let result = await db.importFootpath(data);
//           if(result.rowCount === 1) {
//             rows++;
//           } else {
//             errors++;
//           }
//         } catch(err) {
//           errors++;
//           fatal = err;
//           break;
//         }   
//     }
//     if (fatal == null) {
//       res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"});
//     } else {
//       res.send({rows: "Inserted " + rows + " rows", error: fatal.detail});
//     }
    
//   }
 
//   } else {
//     res.set('Content-Type', 'application/json');
//     res.send({error: "Invalid token"});
//   }
// });

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
    await bcrypt.genSalt(10, (err, salt) => {
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
    await bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
  });
}
module.exports = app;