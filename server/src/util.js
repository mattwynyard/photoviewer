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
    changeSide
}
