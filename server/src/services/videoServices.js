const db = require('../db');
const util = require('../util');

const changeSide = async (query) => {
    try {
        const view = util.getPhotoView(query.project);
        const photo = JSON.parse(query.photo)
        const geojson = JSON.parse(photo.st_asgeojson)
        const side = util.changeSide(photo.side)
        const body = {
            cwid: photo.cwid,
            lat: geojson.coordinates[1],
            lng: geojson.coordinates[0],
            side: side,
            tacode: photo.tacode
        }  
        try {
            const opposite = await db.closestVideoPhoto(view, body);
            if (opposite.rows === 0) return {error: "no photo found"}
            const newPhoto = opposite.rows[0];
            const arrayBody = {
                cwid: photo.cwid,
                side: side,
                tacode: photo.tacode
            }
            const result = await db.getPhotos(arrayBody, view);
            if (result.rows === 0) return {error: "no photo array empty"}
            return {photo: newPhoto, data: result.rows};
        } catch (err) {
            console.log(err);
            return {error: err};
        }
        
    } catch (err) {
        console.log(err)
        return {error: "parsing/unknown error"}
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