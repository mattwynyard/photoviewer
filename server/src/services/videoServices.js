const db = require('../db');
const util = require('../util');
const { GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require('../s3Client.js');
const { createWriteStream, unlink } = require('fs')
const ffmpeg = require('fluent-ffmpeg');
const Jimp = require('jimp') ;

const FILE_PREFIX = 'image'
const BUCKET= 'onsitenz';
const PREFIX = 'taranaki/roads/2022_10'

const stitch = async (socket, options) => {
    socket.emit("stitch")
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
        // .on('progress', function(progress) {
        //     socket.emit("progress", progress)
        //     console.log('Processing: ' + progress.percent + '% done');
        // })
        .on('stderr', function(stderrLine) {
            //console.log('Stderr output: ' + stderrLine);
        })
        .on('end', () => {
            const token = options.outputFilepath.split('/').pop()
            resolve(token)
        })
        .on('error', (error) => {
            socket.emit("error", error)
            reject(new Error(error))
        });
    });
}

const label = async () => {
    try {
                    
        console.log("read")
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
        const image = await Jimp.read(`./temp/images/${frame.photo}.jpg`)
        const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
        image.print(font, 10, 10, `${labelRoad}`);
        image.print(font, 10, 30, `${labelCwid}`);
        image.print(font, 10, 50, `${labelSide}`);
        image.print(font, 10, 70, `${labelErp} m`);
        image.print(font, 10, 90, `${labelDateTime}`);
        
        await image.writeAsync(`./temp/images/${FILE_PREFIX}${index}.jpg`)
        console.log("write")
        // await unlink(`./temp/images/${frame.photo}.jpg`, (err) => {
        //     if (err) {
        //     console.error(err)
        //     }
        // })
    } catch (err) {
        console.log(err)
    }
}

const writeLabel = (prefix, label) => {
    if (prefix) return `${prefix} ${label}`
    return `${label.toString()}`
}

const deleteVideo = async (query) => {
    await unlink(query, (err) => {
        if (err) {
            console.error(err)
            return err
        }})
        return false
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
                Key: `${PREFIX}/${frame.photo}.jpg`
            };
        const response = await s3Client.send(new HeadObjectCommand(bucketParams))
        bytes += response.ContentLength
        count += 1
        socket.emit('head', {count: count, length: frames.length})
    }
    return ({bytes: bytes, count: results.rowCount, minERP: minMax.rows[0].min, maxERP: minMax.rows[0].max})
}

const writeImageFromS3 = async(frame, index) => {
    return new Promise(async (resolve, reject) => {
        let size = 0
        const bucketParams = {
            Bucket: BUCKET,
            Key: `${PREFIX}/${frame.photo}.jpg`
        };   
        const response = await s3Client.send(new GetObjectCommand(bucketParams))
        const stream = response.Body
        //const ws = await createWriteStream(`./temp/images/${frame.photo}.jpg`);  
        const ws = await createWriteStream(`./temp/images/${FILE_PREFIX}${index}.jpg`);  
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
    })
}

const download = async (socket) => {
    const view = util.getPhotoView(socket.handshake.query.project);
    const results = await db.getPhotoNames(socket.handshake.query, view);
    const frames = results.rows;
    const label = {
        side: socket.handshake.query.side,
        name: socket.handshake.query.label,
        cwid: socket.handshake.query.cwid   
    }
    let minERP = Number.MAX_SAFE_INTEGER;
    let maxERP = Number.MIN_SAFE_INTEGER;
    try {
        for (let i = 0; i < frames.length; i++) {
            const index = String(i).padStart(4, "0")
            const size = await writeImageFromS3(frames[i], index)
            label.datetime = util.dateToISOString(new Date(frames[i].datetime))
            const labelRoad = writeLabel(null, label.name)
            const labelCwid = writeLabel('carriage:', label.cwid)
            const labelSide = writeLabel('side: ', label.side === 'L' ? 'Left' : 'Right')
            const labelDateTime = writeLabel(null, label.datetime)
            const labelErp = writeLabel('erp:', label.erp)
            const image = await Jimp.read(`./temp/images/${FILE_PREFIX}${index}.jpg`)
            const font = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
            image.print(font, 10, 10, `${labelRoad}`);
            image.print(font, 10, 30, `${labelCwid}`);
            image.print(font, 10, 50, `${labelSide}`);
            image.print(font, 10, 70, `${labelErp} m`);
            image.print(font, 10, 90, `${labelDateTime}`);
            await image.writeAsync(`./temp/images/${FILE_PREFIX}${index}.jpg`)
            socket.emit("photo", size)
        }    
    } catch (err) {
        console.log(err)
    } 
    return {
        frameRate: 2,
        //duration: frames / 2,
        outputFilepath: `./temp/video/${label.name}_${label.cwid}_${label.side}_${minERP}_${maxERP}.mp4`,
        inputFilepath: './temp/images/image%04d.jpg'
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
    deleteVideo,
    headerDownload,
    stitch,
    download,
    changeSide,
    photos,
    closestVideoPhoto
}