//const dataServices = require('../services/dataServices');
const users = require('../user.js');
const db = require('../db.js');

const importer = async (req, res) => {
    const token = users.findUserToken(req.headers.authorization, req.body.user);
    if(token) {
      let project = req.body.project;
      let staged = req.body.staged;
      let surface = await db.projecttype(project);
      let clientResult = await db.client(project);
      let client = clientResult.rows[0].client;
      if (client === 'asm' || client === 'fhsu') staged = true;
      let rows = 0;
      let errors = 0;
      let inserted = 0;
      if (surface.rows[0].surface === "road") {
       
        for (let i = 1; i < req.body.data.length - 1; i++) {  
          let data =  req.body.data[i];
          rows++;
          try {
            let result = null;
            if (!staged ) {
              result = await db.import(data);
              if(result.rowCount === 1) {
                inserted++;
              } else {
                console.log(result)
                errors++
              }
            } else { //staged
              try {
                result = await db.stagedImport(data, client);
                if(result.rowCount === 1) {
                  inserted++;
                } else {
                  console.log(result)
                  errors++
                }
              } catch(err) {
                console.log(err)
              }
            }
          } catch(err) {
            errors++;
            console.log(err)
            break;
          }
        }
        res.send({rows: `Inserted ${inserted} of ${rows} records, errors: ${errors} rows failed to insert`});
      } else {
        let rows = 0;
        let errors = 0;
        let fatal = null;
        for (let i = 1; i < req.body.data.length - 1; i++) {  
          let data =  req.body.data[i];
          try {
            let result = await db.importFootpath(data);
            if(result.rowCount === 1) {
              rows++;
            } else {
              errors++;
            }
          } catch(err) {
            errors++;
            fatal = err;
            break;
          }   
      }
      if (fatal == null) {
        res.send({rows: "Inserted " + rows + " rows", errors: errors + " rows failed to insert"});
      } else {
        res.send({rows: "Inserted " + rows + " rows", error: fatal.detail});
      }
      
    }
   
    } else {
      res.set('Content-Type', 'application/json');
      res.send({error: "Invalid token"});
    }
  };

module.exports = {
    importer
}