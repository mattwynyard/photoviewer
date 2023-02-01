'use strict'
require('dotenv').config();
const util = require('./util.js');

function buildQuery(arr) {
    let query = ""; 
    for (var i = 0; i < arr.length; i += 1) {
        if (i < arr.length - 1) {
            query += ("'" + arr[i] + "'" + ",");
        } else {
            query += "'" + arr[i] + "'";
        }
    }
    return query;
}

function buildIntQuery(arr) {
    if (arr.length == 0) return 'NULL'
    let query = ""; 
    for (var i = 0; i < arr.length; i += 1) {
        if (i < arr.length - 1) {
            query += (arr[i] + ",");
        } else {
            query += arr[i]
        }
    }
    return query;
}

function monthToNumeric(month) {
    switch (month) {
        case 'jan':
            return '01';
        case 'feb':
            return '02';
        case 'mar':
            return '03';
        case 'apr':
            return '04';
        case 'may':
            return '05';
        case 'jun':
            return '06';
        case 'jul':
            return '07';
        case 'aug':
            return '08';
        case 'sep':
            return '09';
        case 'oct':
            return '10';
        case 'nov':
            return '11';
        case 'dec':
            return '12'
        default:
            return new Error("Incorrect month format")
    }
}

function parseInteger(x) {
    let n = parseInt(x)
    if (Number.isNaN(n)) {
        return 'NULL';
    } else {
        return n;
    }
}

function parseString(s) { 

    if (s.indexOf('\'') >= 0) {
        let index = s.indexOf('\'');
        let str = s.substring(0, index) + s.substring(index + 1, s.length);
        return parseString(str);
    } else {
        return "'" + s + "'";
    }
}

function parseDateTime(dateTime) { 
    let dateformat = /^([0-9]{4})-([0-1][0-9])-([0-3][0-9])\s([0-1][0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if(dateTime.match(dateformat)) //yyyy-mm-dd HH:mm:ss
    {   
        return "'" + dateTime + "'";
    }
    dateformat = /^(((0[1-9]|[12]\d|3[01])[\/](0[13578]|1[02])[\/]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((0[1-9]|[12]\d|30)[\/](0[13456789]|1[012])[\/]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((0[1-9]|1\d|2[0-8])[\/](02)[\/]((19|[2-9]\d)\d{2})\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm))|((29)[\/](02)[\/]((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))\s(0[0-9]|1[0-2]):(0[0-9]|[1-59]\d):(0[0-9]|[1-59]\d)\s(AM|am|PM|pm)))$/;
    if (dateTime.match(dateformat)) { //dd/mm/yyyy hh:mm:ss AM|PM
        return "'" + dateTime + "'"; //d/mm/yyyy not working
    } 
    dateformat = /^(0?[1-9]|[12][0-9]|3[01])-(jan|Jan|JAN|feb|Feb|FEB|mar|Mar|MAR|apr|Apr|APR|may|May|MAY|jun|Jun|JUN|jul|Jul|JUL|aug|Aug|AUG|sep|Sep|SEP|oct|Oct|OCT|nov|Nov|NOV|dec|Dec|DEC)-(19|20)\d\d\s([0-1][0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if (dateTime.match(dateformat)) { //dd-MMM-yyyy HH:mm:ss
        const dt = dateTime.split(" ");
        const date = dt[0];
        const time = dt[1];
        const [day, month, year] = date.split('-');
        const monthNumeric = monthToNumeric(month.toLowerCase());
        const timestamp =  `${year}-${monthNumeric}-${day} ${time}`;
        return "'" + timestamp + "'"; 
    }
    dateformat = /^([1-9]|([012][0-9])|(3[01]))\/([0]{0,1}[1-9]|1[012])\/\d\d\d\d\s([0-1]?[0-9]|2?[0-3]):([0-5]\d)$/;
    if (dateTime.match(dateformat)) {
        const dt = dateTime.split(" ");
        const date = dt[0];
        const time = dt[1];
        const [day, month, year] = date.split('/');
        const timestamp =  `${year}-${month}-${day} ${time}:00`;
        return "'" + timestamp + "'";
    }
    return "'NULL'";
    }
    
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }


function parseDate(date) {
    
    let dateFormat = /^(0?[1-9]|[12][0-9]|3[01])[\/](0?[1-9]|1[012])[\/]\d{4}$/; //dd/mm/yyyy
    if(date.match(dateFormat))
    {   
        const [day, month, year] = date.split('/')
        return "'" + `${year}-${month}-${day}` + "'";
    }
    //dateFormat = /^\d{1,2}-[a-zA-Z]{3}-\d{4}$/;
    dateFormat = /^\d{1,2}-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\-\d{2,4}$/; //d-MMM-yy or dd-MMM-yy or d-MMM-yyyy or dd-MMM-yyyy
    if(date.match(dateFormat))
    {   
        let [day, month, year] = date.split('-')
        if (day.length === 1) {
            day = pad(day, 2)
        }
        if (year.length === 2) {
            year = pad(year, 3, '0');
            year = pad(year, 4, '2');
        }
        

        let monthNumeric = monthToNumeric(month.toLowerCase());
        return "'" + `${year}-${monthNumeric}-${day}` + "'";
    }
    dateFormat = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/;
    if(date.match(dateFormat))
    {   
        return "'" + date + "'";
    }
    dateFormat = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/;
    if(date.match(dateFormat))
    {   
        return "'" + date + "'";
    }
    dateFormat = /^((?:19|20)\d\d)[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/;
    if(date.match(dateFormat))
    {   
        return "'" + date + "'";
    }
}

const { Pool } = require('pg');

const connection = new Pool({
    user: process.env.USER_NAME,
    host: process.env.HOST,
    database: process.env.DB,
    password: process.env.PASSWORD,
    port: process.env.DBPORT,
    max: 20,
    connectionTimeoutMillis: 10000,
})
connection.connect(function(err) {
    if (err) {
        console.log(err);
        throw err;
    }
});
connection.on('connect', () => {
    console.log("connected to database on port: " + process.env.DBPORT);
});

connection.on('error', error => {
    console.log(error);
    throw err;
});

const getTable = (user) => {
    let table = null;
    switch (user) {
        case 'asu':
            table = 'asufaults';
            break;
        case 'asm':
            table = 'asmfaults';
            break;
        case 'tsd':
            table = 'tsd_faults';
            break;
        default:
            table = 'roadfaults'      
    }
    return table;
}



module.exports = { 

    isPublic : (project) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT public FROM projects WHERE code = $1::text';
            connection.query(sql, [project], (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let projects = resolve(result.rows[0].public);
                return projects;
            });
        });
    },

    public : () => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description, date, amazon, surface, public, priority, reverse, hasvideo, isarchive, centreline, rating FROM projects WHERE public = true AND active = true';
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let projects = resolve(result.rows);
                return projects;
            });
        });
    },
    projects : (user) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT code, description, date, tacode, amazon, surface, public, priority, reverse, hasvideo, isarchive, centreline, ' 
            + 'ramm, rmclass, rating, active FROM projects WHERE client = $1::text';
            connection.query(sql, [user], (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let project = resolve(result)
                return project;
            });
        });
    },

    updateProject: (project) => {
        let sql = `UPDATE public.projects SET description='${project.description}', date='${project.date}', 
            amazon='${project.amazon}', layermodified=now(), public=${project.public}, priority=${project.priority}, 
            reverse=${project.reverse}, hasvideo=${project.video},centreline=${project.centreline}, 
            ramm=${project.ramm}, rmclass=${project.rmclass}, tacode='${project.tacode}' WHERE code='${project.code}'`;
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let project = resolve(result);
                return project;
            });
        });
    },

    clients : () => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT username FROM users';
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let users = resolve(result);
                return users;
            });
        });
    },

    urls: () => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT username, ramm FROM users WHERE ramm IS NOT NULL';
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let urls = resolve(result);
                return urls;
            });
        });
    },

    settings : (project) => {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT priority, reverse, hasvideo, isarchive, centreline, ramm, rmclass, rating FROM projects WHERE code = $1::text';
            connection.query(sql, [project], (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let project = resolve(result);
                return project;
            });
        });
    },

    priority: (user, project, archive) => {
        let sql = null;
        let table = getTable(user)
        if (archive) {
            sql = "SELECT priority FROM carriageways WHERE project = '" + project + "' GROUP BY priority";
        } else {
            sql = `SELECT priority FROM ${table} WHERE project = '${project}' GROUP BY priority`;
        }
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            });
        });
    },

    grade: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT grade FROM footpaths WHERE project = '" + project + "' GROUP BY grade ORDER BY grade";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let grade = resolve(result);
                return grade;
            });
        });
    },

    updateStatus: (project, values) => {
        //let table = user === 'asu' ? 'asufaults' : 'roadfaults'
        let sql = "UPDATE roadfaults as t SET status = c.status from (values " + values + ") as c(id, status) where t.project = '" + project + "' and c.id = t.id";
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
            let res = resolve(result);
            return res;
            });
        });
    },

    importFootpath: (data) => {
        data[0] = parseString(data[0]); //id
        data[1] = parseString(data[1]); //project
        data[2] = parseInteger(data[2]); //footpathid
        data[3] = parseString(data[3]); //roadname
        data[4] = parseInteger(data[4]); //roadid
        data[5] = parseString(data[5]); //area
        data[6] = parseString(data[6]); //displacement
        data[7] = parseString(data[7]); //position
        data[8] = parseInteger(data[8]); //erp
        data[9] = parseString(data[9]); //side
        data[10] = parseString(data[10]); //asset
        data[11] = parseString(data[11]);//zone
        data[12] = parseString(data[12]); //type
        data[13] = parseString(data[13]); //fault
        data[14] = parseString(data[14]); //cause
        data[15] = parseString(data[15]); //size
        data[16] = parseFloat(data[16]); //length
        data[17] = parseFloat(data[17]); //width
        data[18] = parseInteger(data[18]); //grade
        data[19] = parseString(data[19]); //comment
        data[20] = parseString(data[20]); //inspection
        data[21] = parseFloat(data[21]); //latitude
        data[22] = parseFloat(data[22]); //longitude
        data[23] = parseDateTime(data[23]); //faulttime
        data[24] = parseString(data[24]); //inspector
        data[25] = parseInteger(data[25]); //seq
        data[26] = parseString(data[26]); //photoid
        data[27] = parseString(data[27]); //status
        let sql = null; 
            sql = "INSERT INTO footpaths(id, project, footpathid, roadname, roadid, area, displacement, position, erp, side, asset, zone, type, " +
                    "fault, cause, size, length, width, grade, comment, inspection, latitude, longitude, faulttime, inspector, seq, photoid, "
                    + "status, geom) "
             + "VALUES (" + data + ", ST_MakePoint(" + data[22] + "," + data[21] + "));"
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            }); 
        });
    },

    import: (data) => {
        data[0] = parseString(data[0]); //id
        data[1] = parseString(data[1]); //project
        data[2] = parseString(data[2]); //roadid
        data[3] = parseString(data[3]); //carriage
        data[4] = parseString(data[4]); //location
        data[5] = parseInteger(data[5]); //starterp
        data[6] = parseInteger(data[6]); //enderp
        data[7] = parseString(data[7]); //side
        data[8] = parseString(data[8]);  //position
        data[9] = parseString(data[9]); //class
        data[10] = parseString(data[10]); //fault
        data[11] = parseString(data[11]); //repair
        if (data[12] === '0') {
            data[12] = 99; //priority
        } else {
            data[12] = parseInteger(data[12]); //priority
        }
        data[13] = parseString(data[13]); //comment
        data[14] = parseInteger(data[14]); //length
        data[15] = parseInteger(data[15]); //width
        data[16] = parseInteger(data[16]); //count
        data[17] = parseDateTime(data[17]); //faulttime
        data[18] = parseString(data[18]); //inspector
        data[19] = parseString(data[19]); //inspection
        data[20] = parseInteger(data[20]); //seq
        data[21] = parseString(data[21]); //photoid
        data[22] = parseString(data[22]); //status
        data[23] = parseString(data[23]); //wkt

        let sql = "INSERT INTO roadfaults (id, project, roadid, carriage, location, starterp, enderp, side, position, class, fault, repair, "
        + "priority, comment, length, width, count, faulttime, inspector, inspection, seq, photoid, status, wkt, geom) "
        + " VALUES (" + data + ", ST_GeomFromText(" + data[23] + "));"

        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    return reject(err);
                } else {
                    let priority = resolve(result);
                    return priority;
                }        
            });
        });
    },

    stagedImport: (data, client) => {
        let table =null;
        if (client === 'asm') {
            table = 'asmfaults'
        } else if (client = 'asu') {
            table = 'asufaults'
        } else {
            return;
        }
        data[0] = parseString(data[0]); //id
        data[1] = parseString(data[1]); //project
        data[2] = parseString(data[2]); //rclass
        data[3] = parseString(data[3]); //roadid
        data[4] = parseString(data[4]); //carriage
        data[5] = parseString(data[5]); //location
        data[6] = parseInteger(data[6]); //starterp
        data[7] = parseInteger(data[7]); //enderp
        data[8] = parseString(data[8]); //side
        data[9] = parseString(data[9]);  //position
        data[10] = parseString(data[10]); //class
        data[11] = parseString(data[11]); //fault
        data[12] = parseString(data[12]); //repair
        data[13] = parseInteger(data[13]); //priority
        data[14] = parseString(data[14]); //comment
        data[15] = parseInteger(data[15]); //length
        data[16] = parseInteger(data[16]); //width
        data[17] = parseInteger(data[17]); //count
        data[18] = parseDateTime(data[18]); //faulttime
        data[19] = parseString(data[19]); //inspector
        data[20] = parseString(data[20]); //inspection
        data[21] = parseInteger(data[21]); //seq
        data[22] = parseString(data[22]); //photoid
        data[23] = parseString(data[23]); //status
        data[24] = parseString(data[24]); //wkt
        let sql = "INSERT INTO " + table + " (id, project, rclass, roadid, carriage, location, starterp, enderp, side, position, class, fault, repair, "
        + "priority, comment, length, width, count, faulttime, inspector, inspection, seq, photoid, status, wkt, geom) "
        + " VALUES (" + data + ", ST_GeomFromText(" + data[24] + "));"

        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    return reject(err);
                } else {
                    let results = resolve(result);
                    return results;
                }        
            });
        });
    },

    district: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT description FROM tacode where code = (select tacode from projects where code = '" + project + "')";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                } 
                let district = resolve(result);
                return district;
            });
        });  
    },

    client: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT client FROM projects WHERE code = '" + project + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let client = resolve(result);       
                return client;
            });
        });
    },

    isArchive: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT isarchive FROM projects WHERE code = '" + project + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let isArchive = resolve(result);
                return isArchive;
            });
        });
    },

    inspection: (user, project, isArchive ,type) => {
        let sql = null;
        let table = getTable(user);
        
        if (type.surface === 'footpath') {
            sql = "SELECT inspection FROM footpaths WHERE project = '" + project + "' GROUP BY inspection";
        } else {
            if (isArchive) {
                sql = "SELECT inspection FROM carriageways WHERE project = '" + project + "' GROUP BY inspection";
            } else {
                sql = `SELECT inspection FROM ${table} WHERE project = '${project}' GROUP BY inspection`;
            }
        }       
        return new Promise((resolve, reject) => {
                    
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let inspection = resolve(result);
                return inspection;
            });
        });
    },

    class: (user, project, isArchive) => {
        let sql = null;
        let table = getTable(user)
        if (isArchive) {
            sql = "SELECT code, description FROM assetclass WHERE code IN "
            + "(SELECT class FROM carriageways WHERE project = '" + project + "' GROUP BY class) ORDER BY priority";
        } else {
            sql = `SELECT code, description FROM assetclass WHERE code IN (SELECT class FROM ${table}
                WHERE project = '${project}' GROUP BY class) ORDER BY priority`
        }
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let classes = resolve(result);
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

    faults: (user, project, code, archive) => {
        
        return new Promise((resolve, reject) => {
            let sql = null;
            let table = getTable(user)
            if (archive) {
                sql = "SELECT fault FROM carriageways WHERE project = '" + project + "' AND class = '" + code + "' GROUP BY fault";
            } else {
                sql = `SELECT fault FROM ${table} WHERE project = '${project}' AND class = '${code}' GROUP BY fault`;
            }
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

    footpathFaults: (project, parameter) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT " + parameter + " FROM footpaths WHERE project = '" + project + "' GROUP BY " + parameter + "";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let type = resolve(result);
                return type;
            });
        });
    },

    buildView: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "CREATE OR REPLACE VIEW temp AS SELECT photo, roadid, erp, carriageway, side, latitude, longitude, geom FROM photos WHERE project = '" + project + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let view = resolve(result);
                return view;
            });
        });
    },

    closestCarriageFromView: (view, project, lat, lng) => {
        const sql = `SELECT r.cwid, r.roadid, r.startm, r.endm, r.pavement, r.class, r.zone, r.hierarchy, r.lanes, r.direction,
            r.width, r.owner, r.controller, r.label, r.roadtype, r.town, r.tacode,
            ST_AsGeoJSON(ST_SetSRID(geom, 4326)) as geojson, ST_Distance(ST_SetSRID(geom, 4326), ST_SetSRID(ST_MakePoint(${lng}, ${lat}),4326))
            AS dist FROM ${view} as r WHERE project= '${project}' ORDER BY ST_SetSRID(geom, 4326) <->
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}),4326) LIMIT 1`; 
        return new Promise((resolve, reject) => {
          
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let carriage = resolve(result);
                return carriage;
            });
        });
    },

    closestCarriage: (lat, lng, isArchive) => {
        return new Promise((resolve, reject) => {
            let sql = null;
            if (isArchive) {
                sql = "SELECT r.id, r.roadid, r.direction, r.label, ST_AsGeoJSON(geom) as geojson, ST_Distance(geom, " 
            + "ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326)) AS dist FROM centrelinecw as r ORDER BY geom <-> "
            + "ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326) LIMIT 1";
            } else {
                sql = "SELECT r.id, r.roadid, r.carriageid, r.starterp, r.enderp, r.roadname, r.pavement, r.owner, r.heirarchy, r.zone, r.width, "
                + "ST_AsGeoJSON(geom) as geojson, ST_Distance(geom, ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326)) "
                + "AS dist FROM roadlines as r ORDER BY geom <-> "
            + "ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326) LIMIT 1";
            }           
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let carriage = resolve(result);
                return carriage;
            });
        });
    },

    closestFootpath: (lat, lng) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT r.id, r.roadid, r.side, r.label, ST_AsGeoJSON(geom) as geojson, ST_Distance(geom, ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326)) AS dist FROM centrelinefp as r ORDER BY geom <-> ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326) LIMIT 1";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let carriage = resolve(result);
                return carriage;
            });
        });
    },

    getPhotos: (body, view) => {
        let sql = null
        if (body.side === null) {
            sql = `SELECT photo, erp, side, bearing, velocity, satellites, pdop, interval, inspector, datetime, cwid, tacode, ST_AsGeoJSON(geom) from ${view} 
                    WHERE cwid = ${body.cwid} and tacode = ${body.tacode} ORDER BY photo ASC`;
        } else {
            sql = `SELECT photo, erp, side, bearing, velocity, satellites, pdop, interval, inspector, datetime, cwid, tacode, ST_AsGeoJSON(geom) from ${view} 
            WHERE cwid = ${body.cwid} and side = '${body.side}' and tacode = '${body.tacode}' ORDER BY photo ASC`;
        }
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let photos = resolve(result);
                return photos;
            });
        });
    },

    getFPPhotos: (id, project) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT photo, footpathid, erp, roadid, side, address, latitude, longitude from fpphotos WHERE footpathid = '" + id + "' and project = '" + project + "' ORDER BY photo";

            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let photos = resolve(result);
                return photos;
            });
        });
    },

    oppositePhoto: (view, query) => {
        const sql = `SELECT photo, erp from ${view} WHERE cwid = '${query.cwid}' 
        and side = '${query.side}' ORDER BY ABS(erp - ${query.erp})`;
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let side = resolve(result);
                return side;
            });
        });
    },

    minERP: (carriageid) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT MIN(erp) from photos WHERE carriageway = '" + carriageid + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let min = resolve(result);
                return min;
            });
        });
    },

    side: (carriageid, erp) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT side from photos WHERE carriageway = '" + carriageid + "' and erp = '" + erp + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let side = resolve(result);
                return side;
            });
        });
    },


    archivePhoto: (project, lat, lng) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT photo, roadid, erp, carriageway, side, latitude, longitude, geom <-> ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326) AS dist FROM photos WHERE project = '" + project + "' ORDER BY dist LIMIT 1";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let photo = resolve(result);
                return photo;
            });
        });
    },

    closestVideoPhoto: (view, body) => {
        const sql = `SELECT photo, erp, side, bearing, velocity, satellites, pdop, interval, inspector, datetime, cwid, tacode, ST_AsGeoJSON(geom),
        geom <-> ST_SetSRID(ST_MakePoint(${body.lng}, ${body.lat}),4326) AS dist 
        FROM ${view} 
        WHERE side = '${body.side}' and tacode= '${body.tacode}' and cwid=${body.cwid}
        ORDER BY dist LIMIT 1`;
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let photo = resolve(result);
                return photo;
            });
        });
    },

    archiveFPPhoto: (project, lat, lng) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT photo, roadid, erp, footpathid, side, latitude, longitude, geom <-> ST_SetSRID(ST_MakePoint(" + lng + "," + lat + "),4326) AS dist, address FROM fpphotos WHERE project = '" + project + "' ORDER BY dist LIMIT 1";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let photo = resolve(result);
                return photo;
            });
        });
    },

    archiveData: (project, photo) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT photo, roadid, erp, carriageway, side, latitude, longitude FROM photos WHERE photo = '" + photo + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let data = resolve(result);
                return data;
            });
        });
    },

    archiveFPData: (project, photo) => {
        return new Promise((resolve, reject) => {
            let sql = "SELECT photo, roadid, erp, footpathid, side, latitude, longitude, house, street, suburb, town, ramm FROM fpphotos WHERE photo = '" + photo + "'";
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let data = resolve(result);
                return data;
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

    roadLines: (project, filter) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT l.id, l.project, l.roadid, l.carriageid, l.roadname, l.starterp, l.enderp, l.startname, l.endname, "
            + "l.lanes, l.pavement, l.owner, l.heirarchy, l.zone, l.direction, CAST (l.width AS DOUBLE PRECISION), CAST (r.structural AS DOUBLE PRECISION), "
            + "CAST (r.surface AS DOUBLE PRECISION), CAST (r.drainage AS DOUBLE PRECISION), ST_AsGeoJSON(l.geom) "
            + "FROM roadlines as l, rating as r WHERE r.project = '" + project + "' and r.id = l.id", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let data = resolve(result);
                return data;
            });
        });
    },

    footpathRating: (user, project, filter) => {
        const _filter  = buildIntQuery(filter)
        const sql = `SELECT * FROM public.vw_${user}_fpcl WHERE project = '${project}' AND grade IN (${_filter})`
        
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
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

    hasClass: (project) => {
        return new Promise((resolve, reject) => {
            connection.query("SELECT rmclass FROM projects WHERE code = '" + project + "'", (err, result) => {
            if (err) {
                console.error('Error executing query', err.stack)
                return reject(err);
            }
            let rmclass = resolve(result);          
            return rmclass;
            }); 
        });

    },

    rmclass: (project, user) => {
        let table = getTable(user)
        let sql = `SELECT rclass FROM ${table} WHERE project = '${project}' GROUP BY rclass ORDER BY rclass ASC`;
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let priority = resolve(result);
                return priority;
            });
        });
    },

    footpath: (table, project, options, filter) => {
        let assets = filter.find(object => object.code === "Asset");
        let faults = filter.find(object => object.code === "Fault")
        let types = filter.find(object => object.code === "Type")
        let causes = filter.find(object => object.code === "Cause")
        let _priority = buildQuery(options.priority);
        let _assets = buildQuery(assets.data);
        let _faults = buildQuery(faults.data);
        let _types = buildQuery(types.data);
        let _causes = buildQuery(causes.data);
        let sql = `SELECT id, footpathid, roadname, roadid, position, erp, inspection, side, asset, type, 
            fault, cause, size, grade, faulttime, status, datefixed, photoid, ST_AsGeoJSON(geom) 
            FROM ${table} 
            WHERE project = '${project}' AND grade IN (${_priority}) AND asset 
            IN (${_assets}) AND fault IN (${_faults})
            AND type IN (${_types}) AND cause IN (${_causes}) AND  status = 'active'`
         
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

    footpathCompleted: (table, project, filter) => {
        let assets = filter.find(object => object.code === "Asset");
        let faults = filter.find(object => object.code === "Fault")
        let types = filter.find(object => object.code === "Type")
        let causes = filter.find(object => object.code === "Cause")
        let _assets = buildQuery(assets.data);
        let _faults = buildQuery(faults.data);
        let _types = buildQuery(types.data);
        let _causes = buildQuery(causes.data);
        let sql = `SELECT id, footpathid, roadname, roadid, position, erp, side, asset, fault, cause, 
            size, grade, faulttime, status, datefixed, photoid, ST_AsGeoJSON(geom)
            FROM ${table} 
            WHERE project = '${project}' AND asset IN (${_assets}) AND fault IN (${_faults})
            AND type IN (${_types}) AND cause IN (${_causes}) AND  status = 'completed'`
            
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

    roadArchive: (layer, filter, options, inspection) => { 
        let codes = null;
        if (options.priority.length !== 0) {
            codes = buildQuery(options.priority);
        }
        let qAge = buildQuery(inspection);
        let sql = null;
        if (inspection.length === 0) {
            sql = "SELECT seq, id, roadid, carriageway, location, position, class, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
            + "FROM carriageways WHERE project = '" + layer + "' AND priority IN (" + codes + ") AND  status = 'active' ORDER BY seq ASC"
        }  else if (filter.length == 0) {
            sql = "SELECT seq, id, roadid, carriageway, location, position, class, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
            + "FROM carriageways WHERE project = '" + layer + "' AND priority IN (" + codes + ") AND inspection IN (" + qAge + ") AND  status = 'active' ORDER BY seq ASC"
        } else {
            let condition = buildQuery(filter);
            sql = "SELECT id, roadid, carriageway, location, position, class, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND fault IN (" + condition + ") AND priority IN (" + codes + ") AND inspection IN (" + qAge + ") AND  status = 'active'"
        }
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

    /**
     * 
     * @param {project code} layer 
     * @param {array of faults to filter for} filter 
     * @param {array of priorities} priority 
     * @param {inspection date} inspection 
     * @param {'active' or 'completed'} status
     * @returns 
     */
    geometries: (user, layer, filter, options, inspection, rclass, type, status) => { 
        let pCodes = null;
        let qOptions = null;
        let rmclass = null;
        let table = getTable(user)
        if (options.priority.length !== 0) {
            pCodes = buildQuery(options.priority);
        }
        if (options.status.length !== 0) {
            qOptions = buildQuery(options.status)
        } 
        let qAge = buildQuery(inspection);
        if (rclass) {
            rmclass = buildQuery(rclass)
        }
        return new Promise((resolve, reject) => {
            if (filter.length == 0) {
                let sql = null;
                if (rmclass) {
                    if (status === 'active') {
                        sql = `SELECT seq, id, rclass, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid, 
                        faulttime, status, ST_AsGeoJSON(geom)
                        FROM ${table} WHERE project = '${layer}' AND priority IN (${pCodes}) AND  ST_GeometryType(geom) = '${type}'
                        AND inspection IN (${qAge}) AND rclass IN (${rmclass}) AND status = 'active' ORDER BY seq ASC`; 
                    } else {
                        sql = `SELECT seq, id, rclass, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid, 
                        faulttime, status, ST_AsGeoJSON(geom)
                        FROM ${table} WHERE project = '${layer}' AND status IN (${qOptions}) AND ST_GeometryType(geom) = '${type}'
                        AND inspection IN (${qAge}) AND rclass IN (${rmclass}) ORDER BY seq ASC`;
                    }
                } else {
                    if (status === 'active') {
                        sql = `SELECT seq, id, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid, 
                        faulttime, status, ST_AsGeoJSON(geom)
                        FROM ${table} WHERE project = '${layer}' AND priority IN (${pCodes}) AND  ST_GeometryType(geom) = '${type}'
                        AND inspection IN (${qAge}) AND status = 'active' ORDER BY seq ASC`; 
                    } else {
                        sql = `SELECT seq, id, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid, 
                        faulttime, status, ST_AsGeoJSON(geom)
                        FROM ${table} WHERE project = '${layer}' AND status IN (${qOptions}) AND ST_GeometryType(geom) = '${type}'
                        AND inspection IN (${qAge}) ORDER BY seq ASC`;
                    }
                }
                
                connection.query(sql, (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
                });
            } else {
                let sql = null;
                let condition = buildQuery(filter);
                if (rmclass) {
                    if (status === 'active') {
                        sql = `SELECT seq, id, rclass, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid,
                        faulttime, status, ST_AsGeoJSON(geom) FROM ${table} WHERE project = '${layer}' AND fault IN (${condition})
                        AND priority IN (${pCodes}) AND rclass IN (${rmclass}) AND inspection IN (${qAge}) AND status = 'active' AND  ST_GeometryType(geom) = '${type}' ORDER BY seq ASC`;
                    } else {
                        sql = `SELECT seq, id, rclass, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid, 
                        faulttime, status, ST_AsGeoJSON(geom) FROM ${table} WHERE project = '${layer}' AND fault IN (${condition})
                        AND inspection IN (${qAge}) AND rclass IN (${rmclass}) AND status != 'active' AND ST_GeometryType(geom) = '${type}' ORDER BY seq ASC`;
                    }
                } else {
                    if (status === 'active') {
                        sql = `SELECT seq, id, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid,
                        faulttime, status, ST_AsGeoJSON(geom) FROM ${table} WHERE project = '${layer}' AND fault IN (${condition})
                        AND priority IN (${pCodes}) AND inspection IN (${qAge}) AND  status = 'active' AND  ST_GeometryType(geom) = '${type}' ORDER BY seq ASC`;
                    } else {
                        sql = `SELECT seq, id, roadid, carriage, location, position, starterp, enderp, side, class, fault, repair, priority, length, width, count, inspection, photoid, 
                        faulttime, status, ST_AsGeoJSON(geom) FROM ${table} WHERE project = '${layer}' AND fault IN (${condition})
                        AND inspection IN (${qAge}) AND status != 'active' AND ST_GeometryType(geom) = '${type}' ORDER BY seq ASC`;
                    }
                }
                
                connection.query(sql, (err, result) => {
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

    roadArchiveCompleted: (layer, filter, inspection) => { 
        let qAge = buildQuery(inspection);
        return new Promise((resolve, reject) => {
            if (inspection.length === 0) {
                connection.query("SELECT seq, id, roadid, carriageway, location, position, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND  status = 'completed' ORDER BY seq ASC", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
                }); 
            }  else if (filter.length == 0) {
                connection.query("SELECT seq, id, roadid, carriageway, location, position, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND inspection IN (" + qAge + ") AND  status = 'completed' ORDER BY seq ASC", (err, result) => {
                if (err) {
                    console.error('Error executing query', err.stack)
                    return reject(err);
                }
                let geometry = resolve(result);          
                return geometry;
                }); 
            } else {
                let condition = buildQuery(filter);
                connection.query("SELECT seq, id, roadid, carriageway, location, position, fault, repair, priority, comment, size, inspection, photoid, faulttime, status, datefixed, ST_AsGeoJSON(geom) " 
                + "FROM carriageways WHERE project = '" + layer + "' AND fault IN (" + condition + ") AND inspection IN (" + qAge + ") AND  status = 'completed' ORDER BY seq ASC", (err, result) => {
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

    deleteProject: (project) => {
        return new Promise((resolve, reject) => {
            let sql = "DELETE FROM projects WHERE code= '" + project + "'";
            connection.query(sql, (err, results) => {
                if (err)  {
                    console.log(err);
                    reject({ type: 'SQL', err});
                } else {
                    resolve(results);
                }
                
            });
        })
    },

    deleteProjectData: (project, surface, isArchive) => {
        let sql = null;
            if (surface === "road") {
                if (isArchive) {
                    sql = "DELETE FROM carriageways WHERE project= '" + project + "'";
                } else {
                    sql = "DELETE FROM roadfaults WHERE project= '" + project + "'";
                }    
            } else if (surface === "footpath") {
                sql = "DELETE FROM footpaths WHERE project= '" + project + "'";
            } else {
                throw "surface not found";
            }
        return new Promise((resolve, reject) => {
            
            connection.query(sql, (err, results) => {
                if (err)  {
                    console.log(err);
                    reject({ type: 'SQL', err});
                } else {
                    resolve(results);
                }
                
            });
        })
    },

    addProject: (body) => {
        const tacode = parseInteger(body.tacode);
        let sql = "INSERT INTO projects(" +
                "code, client, description, date, tacode, active, amazon, layercount, layermodified, " +
                "filtercount, lastfilter, surface, public, priority, reverse, hasvideo, centreline, ramm, rmclass)" +
                " VALUES ('" + body.code + "', '" + body.client + "', '" + body.description + "', '" + body.date +   
                "', " + tacode +  ", true, '" + body.amazon + "', 0, now(), 0, now(), '" + body.surface + "', " + 
                body.public + ", " + body.priority + ", " + body.reverse + ", " + body.video + ", " + body.centreline + 
                ", " + body.ramm + ", " + body.rmclass + ")";
        return new Promise((resolve, reject) => {
            connection.query(sql, (err, results) => {
                if (err) {
                    reject({ type: 'SQL', err});
                } else {
                    resolve(results);
                }
                
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