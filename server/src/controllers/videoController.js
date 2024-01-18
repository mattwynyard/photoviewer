const securityServices = require('../services/securityServices');
const videoServices = require('../services/videoServices');
const { deleteFiles } = require('../util');

//const VIDEO_PATH = './temp/video/'

const downloadHead = async (socket, query) => {
    const result =  await videoServices.headerDownload(socket, query);
    return result
}

const download = async (socket, uuid) => {
    const result = await videoServices.createDirectory(uuid)
    if (!result) {
        console.log("error creating directory")
        return null
    }
    const options = await videoServices.download(socket, uuid);
    if (options) {
        const path = await videoServices.stitch(socket, options);
        try {
            deleteFiles(`./temp/${uuid}/images`);
        } catch (err) {
            console.log(err) ////error deleting
        }
        if (path) {
            return {video: path, uuid: uuid}
        } else {
            deleteFiles(`./temp/${uuid}/images`);
            return null //error stitching
        }
    } else {
        deleteFiles(`./temp/${uuid}/images`);
        return null //error downloading
    }
}

const cleanup = async (filename, uuid) => {
    const result = await videoServices.deleteDirectory(`./temp/${uuid}`);
    return result
}

const downloadVideo = async (req, res) => {
    try {
        const security = await securityServices.isAuthorized(req.query.user, req.query.project, req.headers.authorization);      
        if (security) {
            res.download(`./temp/${req.query.uuid}/videos/${req.query.filename}`)
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
    cleanup,
    downloadHead,
    download,
    downloadVideo,
    changeSide,
    photos,
    closestVideoPhoto
}