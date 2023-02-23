const securityServices = require('../services/securityServices');
const videoServices = require('../services/videoServices');

const VIDEO_PATH = './temp/video/'

const downloadHead = async (socket, query) => {
    const result =  await videoServices.headerDownload(socket, query);
    console.log(result)
    return result
}

const download = async (socket) => {
    const result = await videoServices.download(socket);
    return result
}

const deleteVideo = async (query) => {
    await videoServices.deleteVideo(`${VIDEO_PATH}/${query}`);
}

const downloadVideo = async (req, res) => {
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            res.download(`${VIDEO_PATH}/${req.query.filename}`)
        } else {
            res.send({error: 'incorrect security credentials'});
        }
    } catch (err) {
        res.send({error: err});
    }
}


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
    deleteVideo,
    downloadHead,
    download,
    downloadVideo,
    changeSide,
    photos,
    closestVideoPhoto
}