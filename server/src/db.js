'use strict'
const { Pool } = require('pg')

const connection = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'onsite',
    password: 'Glacier_7',
    port: 5432,
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
    console.log("connected to database on port: 5432");
});

module.exports = { 
    projects : (user) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description, date FROM projects WHERE client = $1::text AND active = true';
            connection.query(sql, [user], (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var project = resolve(result);
                return project;
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

    faults: (code) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT fault FROM faults WHERE class = '" + code + "' GROUP BY fault";
            //console.log(sql)
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var faults = resolve(result);
                //console.log(project);
                return faults;
            });
        });
    },

    road: (code) => { 
        return new Promise((resolve, reject) => {
            console.log("SELECT gid, assetroadi, carriagewa, fullroadna, tacode, ST_AsGeoJSON(geom) FROM roads WHERE tacode = '" + code + "'");
            connection.query("SELECT gid, assetroadi, carriagewa, fullroadna, tacode, ST_AsGeoJSON(geom) FROM roads WHERE tacode = '" + code + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                console.log(result);
                var geometry = resolve(result);
                return geometry;
            });
        });
    },

    layer: (layer, filter) => { 
        return new Promise((resolve, reject) => {
            console.log(filter.length);
            if (filter.length == 0) {
                
                connection.query("SELECT roadid, carriagewa, location, fault, size, priority, photoid, faulttime, ST_AsGeoJSON(geom) " 
                + "FROM faults WHERE project = '" + layer + "'", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var geometry = resolve(result);
                
                return geometry;
            }); 
            } else {
                var condition = "";
                for (var i = 0; i < filter.length; i += 1) {
                    if (i < filter.length - 1) {
                        condition += ("'" + filter[i] + "'" + ",");
                    } else {
                        condition += "'" + filter[i] + "'";
                    }
                }
                connection.query("SELECT roadid, carriagewa, location, fault, size, priority, photoid, faulttime, ST_AsGeoJSON(geom) " 
                + "FROM faults WHERE project = '" + layer + "' AND fault IN (" + condition + ")", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                var geometry = resolve(result);
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
                var p = resolve(results);
                //console.log(results);
                return p;
            });
        });
    }
}
