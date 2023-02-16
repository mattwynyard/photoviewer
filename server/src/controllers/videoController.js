const securityServices = require('../services/securityServices');
const videoServices = require('../services/videoServices');

const download = async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        const query = JSON.parse(req.query.query)
        const download = JSON.parse(req.query.download)
        const security = await securityServices.isAuthorized(query.user, query.project, req.headers.authorization);      
        if (security) {
            if (!query.project) {
                res.send({error: "No project selected"});
            } else {
                if (download) {
                    const data =  await videoServices.download(query);
                    res.send({response: "ok"})
                } else {
                    const result =  await videoServices.headDownload(query);
                    res.send(result);
                }
                
                
                
            }     
        } else {
            res.send({error: 'incorrect security credentials'});
        }
    } catch (err) {
        console.log(err)
        res.send({error: "unkown error"});
    }   
  };

const changeSide = async (req, res) => {
    res.set('Content-Type', 'application/json');
    
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            if (!req.query.project) {
                res.send({error: "No project selected"});
            } else {
                const data =  await videoServices.changeSide(req.query);
                res.send(data);
            }     
        } else {
            res.send({error: 'incorrect security credentials'});
        }
    } catch (err) {
        console.log(err)
        res.send({error: "unkown error"});
    }   
  };

const photos = async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            if (!req.query.project) {
                res.send({error: "No project selected"});
            } else {
                const photos =  await videoServices.photos(req.query);
                res.send(photos);
            }     
        } else {
            res.send({error: 'incorrect security credentials'});
        }
    } catch (err) {
        console.log(err)
        res.send({error: "unkown error"});
    }
    
  };

  const closestVideoPhoto = async (req, res) => {
    res.set('Content-Type', 'application/json');
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            if (!req.query.project) {
                res.send({error: "No project selected"});
            } else {
                const photo =  await videoServices.closestVideoPhoto(req.query);
                res.send(photo);
            }     
        } else {
            res.send({error: 'incorrect security credentials'});
        }
    } catch (err) {
        console.log(err)
        res.send({error: "unkown error"});
    }
    
  };

  module.exports = {
    download,
    changeSide,
    photos,
    closestVideoPhoto
}