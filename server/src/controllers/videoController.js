const securityServices = require('../services/securityServices');
const videoServices= require('../services/videoServices');

const changeSide = async (req, res) => {
    res.set('Content-Type', 'application/json');
    
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            if (!req.query.project) {
                res.send({error: "No project selected"});
            } else {
                const photo =  await videoServices.changeSide(req.query);
                res.send(carriage);
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
    changeSide,
    photos,
    closestVideoPhoto
}