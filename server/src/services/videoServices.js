const db = require('../db');
const util = require('../util');
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require('../s3Client.js');
const { Converter } = require("ffmpeg-stream");
const { createReadStream, createWriteStream } = require("fs")

const BUCKET= 'onsitenz';
const PREFIX = 'taranaki/roads/2022_10'

const download = async (query) => {
    const view = util.getPhotoView(query.project);
    const results = await db.getPhotoNames(query, view);
    const frames = results.rows;
    const converter = new Converter()
    const input = converter.createInputStream({f: 'image2pipe', r: 30})
    converter.createOutputToFile('out.mp4', {vcodec: 'libx264', pix_fmt: 'yuv420p'})


    for (const frame of frames) {
        const bucketParams = {
                Bucket: BUCKET,
                Key: `${PREFIX}/${frame.photo}.jpg`
            };
        const response = await s3Client.send(new GetObjectCommand(bucketParams))
        const stream = response.Body
       
        const ws = createWriteStream(`./temp/${frame.photo}.jpg`);
        stream.pipe(ws)

        stream.on('end', ()=>{
            
            console.log("finished")
        });
        stream.on('error', ()=>{
            
            console.log("error")
        });
        
    }
    // frames.map(frame => () => {
        
    //     new Promise( async (resolve, reject) => {
    //         const bucketParams = {
    //             Bucket: BUCKET,
    //             Key: `${PREFIX}/${frame.photo}.jpg`
    //         };
    //         try {  
    //             const response = await s3Client.send(new GetObjectCommand(bucketParams))
    //             const stream = response.Body  
    //             stream.on('end', resolve) // fulfill promise on frame end
    //             .on('error', reject) // reject promise on error
    //             .pipe(input, {end: false}) // pipe to converter, but don't end the input yet
    //         } catch (err) {
    //             console.log(err)
    //         }     
    //     })
            
    // })       
    // .reduce((prev, next) => prev.then(next), Promise.resolve())
    // .then (() => input.end())          
    // converter.run()

}

const getS3Object = async (params) => {
    const response = await s3Client.send(new GetObjectCommand(params))
    const stream = response.Body    
        return new Promise((resolve, reject) => {
            const chunks = []
            stream.on('data', chunk => chunks.push(chunk))
            stream.once('end', () => resolve(Buffer.concat(chunks)))
            stream.once('error', reject)
        })

}

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
    download,
    changeSide,
    photos,
    closestVideoPhoto
}