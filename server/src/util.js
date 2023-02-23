const { readdir, unlink } = require('fs');
const path = require('path');

const getCentrelineView = (user) => {
    let view = null;
    switch (user) {
        case 'tsd':
            view = 'tsd_centreline';
            break;
        default:
            view = null      
    }
    return view;
}

const dateToISOString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth()).padStart(2, '0')
    const day = String(date.getDay()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const getFaultView = (user) => {
    let view = null;
    switch (user) {
        case 'tsd':
            view = 'tsd_faults';
            break;
        case 'swdc':
            view = 'vw_swdc_fp';
        break;
        case 'ncc':
            view = 'vw_ncc_fp';
        break;
        default:
            view = 'footpaths'      
    }
    return view;
}

const getPhotoView = (project) => {
    let view = null;
    switch (project) {
        case 'TSD_RD_1022':
            view = 'tsd_rd_1022_photos';
            break;
        default:
            view = null      
    }
    return view;
}

const changeSide = (side) => {
    if (side === 'L') {
        return 'R'
    } else if (side === 'R') {
        return 'L'
    } else {
        return null
    }
}

const deleteFiles = (directory) => {
    readdir(directory, (err, files) => {
        if (err) console.log(err);
        for (const file of files) {
            unlink(path.join(directory, file), (err) => {
            if (err) console.log(err);
          });
        }
      });
}

module.exports = {
    dateToISOString,
    deleteFiles,
    getCentrelineView,
    getPhotoView,
    changeSide,
    getFaultView
}
