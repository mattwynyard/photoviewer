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

connection.on('error', error => {
    console.log(error);
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

    priority: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT priority FROM faults WHERE project = '" + project + "' GROUP BY priority";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var priority = resolve(result);
                return priority;
            });
        });
    },

    age: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT inspection FROM faults WHERE project = '" + project + "' GROUP BY inspection";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var priority = resolve(result);
                return priority;
            });
        });
    },

    filters: (project, parameter) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT " + parameter + " FROM footpath WHERE project = '" + project + "' GROUP BY " + parameter + "";
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

    classes: ()=> {
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

    class: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT code, description FROM assetclass WHERE code IN (SELECT class FROM faults WHERE project = '" + project + "' GROUP BY class) ORDER BY priority";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let classes = resolve(result);
                //console.log(project);
                return classes;
            });
        });
    },

    usernames: () => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT username FROM users";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let clients = resolve(result);
                return clients;    
            });
        });
    },

    selectprojects: (client) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT * FROM projects WHERE client = '" + client + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let clients = resolve(result);
                return clients;    
            });
        });
    },

    //DEPRECIATED
    faults: (project, code) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT fault FROM faults WHERE project = '" + project + "' AND class = '" + code + "' GROUP BY fault";
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
                let geometry = resolve(result);
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
                connection.query("UPDATE projects SET filtercount = filtercount + " + 1 + ", lastfilter = now() WHERE code = '" + layer + "'", (err, result) => {
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

    footpath: (project, priority, assets, faults, types, causes) => {
        let _priority = buildQuery(priority);
        let _assets = buildQuery(assets);
        let _faults = buildQuery(faults);
        let _types = buildQuery(types);
        let _causes = buildQuery(causes);
        let sql = "SELECT footpathid, roadname, roadid, position, erp, asset, fault, cause, size, grade, faulttime, photoid, ST_AsGeoJSON(geom) " 
        + "FROM footpath WHERE project = '" + project + "' AND grade IN (" + _priority + ") AND asset IN (" + _assets + ") AND fault IN (" + _faults + ") "
        + "AND type IN (" + _types + ") AND cause IN (" + _causes + ")";
        return new Promise((resolve, reject) => {
                connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
            });
        });
    },

    layer: (layer, filter, priority) => { 
        let codes = buildQuery(priority);
        return new Promise((resolve, reject) => {
            
            if (filter.length == 0) {
                connection.query("SELECT roadid, carriagewa, location, fault, repair, priority, comment, size, inspection, photoid, faulttime, ST_AsGeoJSON(geom) " 
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
                connection.query("SELECT roadid, carriagewa, location, fault, repair, priority, comment, size, inspection, photoid, faulttime, ST_AsGeoJSON(geom) " 
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

    addUser: (user, password) => {
        return new Promise((resolve, reject) => {
            let sql = "INSERT INTO users(username, password, created, count, lastlogin, filtercount, lastfilter) VALUES ('"
             + user + "', '" + password + "', now(), 0, now(), 0, now())";

            connection.query(sql, (err, results) => {
                if (err) reject({ type: 'SQL', err});
                resolve(results);
            });
        })
    },

    deleteUser: (user) => {
        return new Promise((resolve, reject) => {
            let sql = "DELETE FROM users WHERE username= '" + user + "'";
            connection.query(sql, (err, results) => {
                if (err) reject({ type: 'SQL', err});
                resolve(results);
            });
        })
    },

    // deleteProject: (user) => {
    //     return new Promise((resolve, reject) => {
    //         let sql = "DELETE FROM users WHERE username= '" + user + "'";
    //         connection.query(sql, (err, results) => {
    //             if (err) reject({ type: 'SQL', err});
    //             resolve(results);
    //         });
    //     })
    // },

    addProject: (body) => {
        console.log(body);
        return new Promise((resolve, reject) => {
            let sql = "INSERT INTO projects(" +
                "code, client, description, date, tacode, active, amazon, layercount, layermodified, filtercount, lastfilter, surface)" +
                "VALUES ('" + body.code + "', '" + body.client + "', '" + body.description + "', '" + body.date + "', '" + body.tacode + 
                "', true, '" + body.amazon + "', 0, now(), 0, now(), '" + body.surface + "')";

            connection.query(sql, (err, results) => {
                if (err) reject({ type: 'SQL', err});
                resolve(results);
            });
        })
    },

    updateCount: (count, user) => {
        return new Promise((resolve, reject) => {
            let sql = "UPDATE users SET count = " + count + " WHERE username = '" + user + "'";
            connection.query(sql, (err, results) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let p = resolve(results);
                return p;
            });
        });
    }

}
