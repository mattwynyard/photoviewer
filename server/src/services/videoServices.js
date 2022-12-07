const db = require('../db');
const util = require('../util');

const changeSide = async (query) => {
    try {
        const view = util.getPhotoView(query.project);    
        let result = null;
        let data = null;
        let newPhoto = null;
        try {
            const opposite = await db.oppositePhoto(view, query);
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
        
    } catch (err) {
        console.log(err)
        return {error: "database error"}
    }   
};

const photos = async (query) => {
    let result = null;
    try {
        if (query.surface === 'footpath') {
            result = await db.getFPPhotos(query.cwid, query.project); //todo
        } else {
            const view = util.getPhotoView(query.project)
            result = await db.getPhotos(query, view);
        }
    } catch (err) {
        console.log(err);
        return {error: "database error"};
    }
    if (result.rowCount != 0) {
        return {data: result.rows};
    } else {
        return {error: "No photos found"};
    }
} 

const closestVideoPhoto = async (query) => {
    try {
        if (query.surface === "road") {
          const view = util.getPhotoView(query.project)
          const result = await db.closestVideoPhoto(view, query);
          if (result.rowCount === 1) {
            return {data: result.rows[0]};
          } else {
            return {error: "No photo found"};
          }          
        } else {
            return;
        //   const result = await db.archiveFPPhoto(req.body.project.code, req.body.lat, req.body.lng); //todo
        //   data = result.rows[0];
        //   fdata = formatData(data);
        //   if (result.rowCount != 0) {
        //     res.send({success: true, data:  result.rows[0]});
        //   } else {
        //     res.send({success: false, data: null});
        //   }
        }        
    } catch (err) {
        console.log(err);
        return {error: "database error"};
    }
} 


module.exports = {
    changeSide,
    photos,
    closestVideoPhoto
}