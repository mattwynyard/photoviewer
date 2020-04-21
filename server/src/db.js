'use strict'
require('dotenv').config();

function buildQuery(arr) {
    var query = ""; //priority codes
    for (var i = 0; i < arr.length; i += 1) {
        if (i < arr.length - 1) {
            query += ("'" + arr[i] + "'" + ",");
        } else {
            query += "'" + arr[i] + "'";
        }
    }
    return query;
}
const { Pool } = require('pg');

const connection = new Pool({
    user: process.env.USER_NAME,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    max: 20,
    connectionTimeoutMillis: 2000,
})
connection.connect(function(err) {
    if (err) {
        console.log(err);
        throw err;
    }
});
connection.on('connect', () => {
    console.log("connected to database on port: " + process.env.PORT);
});

module.exports = { 
    projects : (user) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description, date, amazon, surface FROM projects WHERE client = $1::text AND active = true';
            connection.query(sql, [user], (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let project = resolve(result);
               
                return project;
            });
        });
    },

    grade: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT grade FROM footpath WHERE project = '" + project + "' GROUP BY grade";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var grade = resolve(result);
                return grade;
            });
        });
    },

    asset: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT asset FROM footpath WHERE project = '" + project + "' GROUP BY asset";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var asset = resolve(result);
                return asset;
            });
        });
    },

    zone: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT zone FROM footpath WHERE project = '" + project + "' GROUP BY zone";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var zone = resolve(result);
                return zone;
            });
        });
    },

    type: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT type FROM footpath WHERE project = '" + project + "' GROUP BY type";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var type = resolve(result);
                return type;
            });
        });
    },

    class: () => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description FROM assetclass WHERE code IN (SELECT class FROM faults GROUP BY class) ORDER BY priority';
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var classes = resolve(result);
                //console.log(project);
                return classes;
            });
        });
    },

    //DEPRECIATED
    faults: (code) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT fault FROM faults WHERE class = '" + code + "' GROUP BY fault";
            //console.log(sql)
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let faults = resolve(result);
                return faults;
            });
        });
    },

    road: (code) => { 
        return new Promise((resolve, reject) => {
            connection.query("SELECT gid, assetroadi, carriagewa, fullroadna, onrcclass, tacode, ST_AsGeoJSON(geom) FROM roads WHERE tacode = '" + code + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var geometry = resolve(result);
                return geometry;
            });
        });
    },

    updateLayerCount: (layer) => {
        return new Promise((resolve, reject) => { 
            try {
                connection.query("UPDATE projects SET layercount = layercount +"   + 1 + ", layermodified = now() WHERE code = '" + layer + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack);
                    return reject(err);
                }
                let results = resolve(result);
                return results; 
                });
            } catch (error) {
                return reject(error);
            }       
        });
    },

    updateFilterCount: (layer) => {
        return new Promise((resolve, reject) => {
            try {
                connection.query("UPDATE projects SET filtercount = filtercount + "   + 1 + ", lastfilter = now() WHERE code = '" + layer + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack);
                    return reject(err);
                }
                let results = resolve(result);
                return results; 
                });
            } catch (error) {
                return reject(error);
            }          
        });
    },

    projecttype: (project) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT surface FROM projects WHERE code = '" + project + "'", (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack)
                return reject(err);
            }
            let surface = resolve(result);          
            return surface;
            }); 
        });

    },

    client: (project) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT client FROM projects WHERE code = '" + project + "'", (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack)
                return reject(err);
            }
            let surface = resolve(result);          
            return surface;
            }); 
        });

    },

    footpath: (project, filter, priority) => {
        let codes = buildQuery(priority);
        return new Promise((resolve, reject) => {
            if (filter.length == 0) {
                connection.query("SELECT footpathid, roadname, roadid, position, erp, asset, fault, cause, size, grade, faulttime, photoid, ST_AsGeoJSON(geom) " 
                + "FROM footpath WHERE project = '" + project + "' AND grade IN (" + codes + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
            });
            } else {
                let condition = buildQuery(filter);
            }
        });
    },

    layer: (layer, filter, priority) => { 
        let codes = buildQuery(priority);
        return new Promise((resolve, reject) => {
            
            if (filter.length == 0) {
                connection.query("SELECT roadid, carriagewa, location, fault, repair, comment, size, priority, photoid, faulttime, ST_AsGeoJSON(geom) " 
                + "FROM faults WHERE project = '" + layer + "' AND priority IN (" + codes + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
            }); 
            } else {
                let condition = buildQuery(filter);
                connection.query("SELECT roadid, carriagewa, location, fault, repair, size, priority, comment, photoid, faulttime, ST_AsGeoJSON(geom) " 
                + "FROM faults WHERE project = '" + layer + "' AND fault IN (" + condition + ") AND priority IN (" + codes + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);
                return geometry;
                });
            }
            
        });
    },

    password: (username) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT password FROM users WHERE username = $1::text';
            connection.query(sql, [username], (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);    
                return p;
            });
        });
    },

    users: (username) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT count FROM users WHERE username = $1::text';
            connection.query(sql, [username], (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);
                //console.log(results);
                return p;
            });
        });
    },

    updateCount: (count, user) => {
        return new Promise((resolve, reject) => {
            let sql = "UPDATE users SET count = " + count + " WHERE username = '" + user + "'";
            //console.log(sql);
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);
                //console.log(results);
                return p;
            });
        });
    }

}
