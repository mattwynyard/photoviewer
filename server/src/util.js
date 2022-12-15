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

module.exports = {
    getCentrelineView,
    getPhotoView,
    changeSide,
    getFaultView
}
