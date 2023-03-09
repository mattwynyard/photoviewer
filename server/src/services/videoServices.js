const db = require('../db');
const util = require('../util');
const { mkdir } = require('fs');
const path = require('path');
const { GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require('../s3Client.js');
const { createWriteStream, unlink, rm } = require('fs')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
const Jimp = require('jimp') ;

const FILE_PREFIX = 'image'
const BUCKET= 'onsitenz';
let PREFIX = null

//todo move prefix to db
const prefix = (amazon) => {
    if(!amazon) return
    const tokens = amazon.split('/')
    return `${tokens[tokens.length - 4]}/${tokens[tokens.length - 3]}/${tokens[tokens.length - 2]}`
}

const stitch = async (socket, options) => {
    socket.emit("stitch")
    return await new Promise((resolve, reject) => {
        ffmpeg()
        .input(options.inputFilepath)
        .inputOptions([
        `-framerate ${options.frameRate}`,
        ])
        .videoCodec('libx264')
        .outputOptions([
        '-pix_fmt yuv420p',
        ])
        .fps(options.frameRate)
        .saveToFile(options.outputFilepath)
        .on('progress', (progress) => {
            socket.emit("progress", progress)
            console.log('Processing: ' + progress.percent + '% done');
        })
        .on('stderr', (stderrLine) => {
            //console.log('Stderr output: ' + stderrLine);
        })
        .on('end', () => {
            const token = options.outputFilepath.split('/').pop()
            resolve(token)
        })
        .on('error', (error) => {
            console.log(error)
            //socket.emit("error", error)
            reject()
        });
    });
}

const writeLabel = (prefix, label) => {
    if (prefix) return `${prefix} ${label}`
    return `${label.toString()}`
}

const deleteVideo = async (query) => {
    await unlink(query, (err) => {
        if (err) {
            console.error(err)
        }})
}

const headerDownload = async (socket, query) => {
    const view = util.getPhotoView(query.project);
    const minMax = await db.getMinMaxErp(query, view);
    const results = await db.getPhotoNames(query, view);
    const frames = results.rows;
    count = 0;
    socket.emit('head', {count: count, length: frames.length})
    let bytes = 0;
    for (const frame of frames) {
        const bucketParams = {
                Bucket: BUCKET,
                Key: `${prefix(query.amazon)}/${frame.photo}.jpg`
            };
        try {
            const response = await s3Client.send(new HeadObjectCommand(bucketParams))
            bytes += response.ContentLength
            count += 1
            socket.emit('head', {count: count, length: frames.length})
            
        } catch (err) {
            console.log(err)
        }    
    }
    return ({bytes: bytes, found: count, total: results.rowCount, minERP: minMax.rows[0].min, maxERP: minMax.rows[0].max})
}

const writeImageFromS3 = async(frame, index, uuid, amazon) => {
    return new Promise(async (resolve, reject) => {
        let size = 0
        const bucketParams = {
            Bucket: BUCKET,
            Key: `${prefix(amazon)}/${frame.photo}.jpg`
        };
        try {
            const response = await s3Client.send(new GetObjectCommand(bucketParams))
            const stream = response.Body 
            const ws = await createWriteStream(`./temp/${uuid}/images/${FILE_PREFIX}${index}.jpg`);  
            stream.pipe(ws)
    
            stream.on('error', (err) => {
                console.log(`error: ${err}`)
                reject(0)
            }); 
            stream.on('data', (chunk) => {
                size += chunk.length
            });
            stream.on('end', () => {
            }); 
            ws.on('close', async () => {
                resolve(size)
            })
        } catch (err) {
           console.log(err) 
           resolve(0)        
        }

    })
}

const deleteDirectory = async (directory) => {
    await rm(directory, { recursive: true }, (error) => {
        // if any error
        if (error) {
          console.error(error);
          return false;
        }
      
        return true
      });
}

const createDirectory = async (uuid) => {
    try {
        const fs = require('fs').promises;
        await fs.mkdir(`./temp/${uuid}/`, (err) => {
            console.log(err)
            return false
        })
        await fs.mkdir(`./temp/${uuid}/images/`, (err) => {
            console.log(err)
            return false
        })
        await fs.mkdir(`./temp/${uuid}/videos/`, (err) => {
            console.log(err)
            return false
        })
        return true  
    } catch (err) {
        console.log(err)
        return false
    }
}  

const download = async (socket, uuid) => {
    const view = util.getPhotoView(socket.handshake.query.project);
    const results = await db.getPhotoNames(socket.handshake.query, view);
    const frames = results.rows;
    
    
    let minERP = Number.MAX_SAFE_INTEGER;
    let maxERP = Number.MIN_SAFE_INTEGER;
    const label = {
        side: socket.handshake.query.side,
        name: socket.handshake.query.label,
        cwid: socket.handshake.query.cwid, 
    }
    for (let i = 0; i < frames.length; i++) {
        try {
            const json = JSON.parse(frames[i].st_asgeojson)
            const index = String(i).padStart(4, "0")
            const size = await writeImageFromS3(frames[i], index, uuid, socket.handshake.query.amazon)
            if (frames[i].erp < minERP) minERP = frames[i].erp
            if (frames[i].erp > maxERP) maxERP = frames[i].erp
            label.datetime = util.dateToISOString(new Date(frames[i].datetime))
            const labelRoad = writeLabel(null, label.name)
            const labelCwid = writeLabel('carriage:', label.cwid)
            const labelSide = writeLabel('side: ', label.side === 'L' ? 'Left' : 'Right')
            const labelDateTime = writeLabel(null, label.datetime)
            const labelErp = writeLabel('erp:', frames[i].erp)
            const labelLat = writeLabel('latitude:', json.coordinates[1])
            const labelLng = writeLabel('longitude:', json.coordinates[0])
            const image = await Jimp.read(`./temp/${uuid}/images/${FILE_PREFIX}${index}.jpg`)
            const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            image.print(font, 10, 10, `${labelRoad}`);
            image.print(font, 10, 30, `${labelCwid}`);
            image.print(font, 10, 50, `${labelSide}`);
            image.print(font, 10, 70, `${labelErp} m`);
            image.print(font, 10, 90, `${labelLat}`);
            image.print(font, 10, 110, `${labelLng}`);
            image.print(font, 10, 130, `${labelDateTime}`);
            await image.writeAsync(`./temp/${uuid}/images/${FILE_PREFIX}${index}.jpg`)
            socket.emit("photo", size)
        } catch (err) {
            console.log(err)
        }
    }
    return {
        frameRate: 2,
        //duration: frames / 2,
        outputFilepath: `./temp/${uuid}/videos/${label.name}_${label.cwid}_${label.side}_${minERP}_${maxERP}.mp4`,
        inputFilepath: `./temp/${uuid}/images/image%04d.jpg`
    }       
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
    deleteDirectory,
    deleteVideo,
    createDirectory,
    headerDownload,
    stitch,
    download,
    changeSide,
    photos,
    closestVideoPhoto
}