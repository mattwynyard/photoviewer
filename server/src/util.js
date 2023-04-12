const { readdir, unlink } = require('fs');
const path = require('path');

const dateToISOString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth()).padStart(2, '0')
    const day = String(date.getDay()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const getCentrelineView = (user) => {
    let view = null;
    switch (user) {
        case 'tsd':
            view = 'tsd_centreline';
            break;
        case 'gdc':
            view = 'gdc_centreline';
            break;
        default:
            view = null      
    }
    return view;
}

const getFaultView = (user) => {
    let view = null;
    switch (user) {
        case 'tsd':
            view = 'tsd_faults';
            break;
        case 'gdc':
            view = 'gdc_faults';
            break;
        case 'swdc':
            view = 'swdc_fp_faults';
            break;
        case 'kdc':
            view = 'kdc_fp_faults';
            break;
        case 'ncc':
            view = 'ncc_fp_faults';
            break;
        case 'fndc':
            view = 'fndc_fp_faults';
            break;
        case 'wgdc':
            view = 'wgdc_fp_faults';
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
        case 'GDC_RD_0819':
            view = 'gdc_rd_0819_photos';
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

const wait = async (ms) => {
    console.log('start timer');
    await new Promise(resolve => setTimeout(resolve, ms));
    console.log('after 1 second');
  }

module.exports = {
    wait,
    dateToISOString,
    deleteFiles,
    getCentrelineView,
    getPhotoView,
    changeSide,
    getFaultView
}
