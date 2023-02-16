const db = require('../db');
const util = require('../util');
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require('../s3Client.js');
const { createWriteStream, unlink } = require('fs')
const ffmpeg = require('fluent-ffmpeg');
const Jimp = require('jimp') ;
//const path = require("path");

const BUCKET= 'onsitenz';
const PREFIX = 'taranaki/roads/2022_10'

const stitch = async ( options ) => {
    await new Promise((resolve, reject) => {
        ffmpeg()
        .input(options.inputFilepath)
        .inputOptions([
        `-framerate ${options.frameRate}`,
        ])
        .videoCodec('libx264')
        .outputOptions([
        '-pix_fmt yuv420p',
        ])
        .noAudio()
        .fps(options.frameRate)
        .saveToFile(options.outputFilepath)
        .on('progress', function(progress) {
            console.log('Processing: ' + progress.percent + '% done');
        })
        .on('stderr', function(stderrLine) {
            console.log('Stderr output: ' + stderrLine);
        })
        .on('end', () => {
            resolve()
        })
        .on('error', (error) => reject(new Error(error)));
    });
}

const writeLabel = (prefix, label) => {
    if (prefix) return `${prefix} ${label}`
    return `${label.toString()}`
}

const headDownload = async (query) => {
    const view = util.getPhotoView(query.project);
    const results = await db.getPhotoNames(query, view);
    const frames = results.rows;
    let minERP = Number.MAX_SAFE_INTEGER;
    let maxERP = Number.MIN_SAFE_INTEGER;
    for (const frame of frames) {
        if (frame.erp < minERP) minERP = frame.erp
        if (frame.erp > maxERP) maxERP = frame.erp
    }
    return ({length: frames.length, minERP: minERP, maxERP: maxERP})
}

const download = async (query) => {
    const view = util.getPhotoView(query.project);
    const results = await db.getPhotoNames(query, view);
    const frames = results.rows;
    let counter = 0;
    const label = {
        side: query.side,
        name: query.label,
        cwid: query.cwid   
    }
    let minERP = Number.MAX_SAFE_INTEGER;
    let maxERP = Number.MIN_SAFE_INTEGER;
    const FILE_PREFIX = 'image'
    for (const frame of frames) {
        //download
        const bucketParams = {
                Bucket: BUCKET,
                Key: `${PREFIX}/${frame.photo}.jpg`
            };
          
        const response = await s3Client.send(new GetObjectCommand(bucketParams))
        const stream = response.Body
        const ws = createWriteStream(`./temp/images/${frame.photo}.jpg`);
        stream.pipe(ws)
        stream.on('error', (err) => {
            console.log(`error: ${err}`)
        });

        //write label
        label.erp = frame.erp
        if (frame.erp < minERP) minERP = frame.erp
        if (frame.erp > maxERP) maxERP = frame.erp
        label.datetime = util.dateToISOString(new Date(frame.datetime))
        const labelRoad = writeLabel(null, label.name)
        const labelCwid = writeLabel('carriage:', label.cwid)
        const labelSide = writeLabel('side: ', label.side === 'L' ? 'Left' : 'Right')
        const labelDateTime = writeLabel(null, label.datetime)
        const labelErp = writeLabel('erp:', label.erp)
        const index = String(counter).padStart(4, "0")

        //save file
        ws.on('close', async () => {
            console.log(`./temp/images/${frame.photo}.jpg`)
            const image = await Jimp.read(`./temp/images/${frame.photo}.jpg`)
            const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            image.print(font, 10, 10, `${labelRoad}`);
            image.print(font, 10, 30, `${labelCwid}`);
            image.print(font, 10, 50, `${labelSide}`);
            image.print(font, 10, 70, `${labelErp} m`);
            image.print(font, 10, 90, `${labelDateTime}`);
            await image.writeAsync(`./temp/images/${FILE_PREFIX}${index}.jpg`);
            await unlink(`./temp/images/${frame.photo}.jpg`, (err) => {
                if (err) {
                  console.error(err)
                  return
                }})
        })
        counter++;  
    }
    const options = {
        frameRate: 2,
        //duration: frames / 2,
        outputFilepath: `./temp/video/${label.name}_${label.cwid}_${label.side}_${minERP}_${maxERP}.mp4`,
        inputFilepath: './temp/images/image%04d.jpg'
    }
    await stitch(options)
    util.deleteFiles('./temp/images');
}


const getS3ObjectBuffer = async (params) => {
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
    headDownload,
    download,
    changeSide,
    photos,
    closestVideoPhoto
}