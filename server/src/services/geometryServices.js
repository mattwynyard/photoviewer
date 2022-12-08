const db = require('../db');
const util = require('../util');

const closestCarriage = async (query) => {
    let result = null;
    try {
        if (query.surface === 'road') {
            const view = util.getCentrelineView(query.user);
            if (view) {
                result = await db.closestCarriageFromView(view, query.project, query.lat, query.lng);
            } else {
                result = await db.closestCarriage(query.lat, query.lng, true);
            }
        } else if (query.surface === 'footpath') {
            result = await db.closestFootpath(query.lat, query.lng);
        } else {
            return {error: 'surface does not exist'}
        }
        if (result.rows[0]) {
            return {data: result.rows[0]}
        } else {
            return {error: 'carriageway/footpath not found'}
        }
    } catch (err) {
        console.log(err)
        return {error: "database error"}
    }
    
};

module.exports = {
    closestCarriage
}