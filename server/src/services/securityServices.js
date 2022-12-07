const db = require('../db');
const bcrypt = require('bcrypt');
const users = require('../user.js');
const jwt = require('jsonwebtoken');
const jwtKey = process.env.KEY;
const jwtExpirySeconds = 10000;

const login = async (user, password) => {
    const p = await db.password(user);
    if (p.rows.length == 0) { //user doesn't exist
        return { login: false, error: "user doesnt exist" };
    } else {
        const match = await bcrypt.compare(password, p.rows[0].password.toString());
        if (match) {
            let count = await db.users(user);
            count = count.rows[0].count;
            const seed  = user + count; 
            const token = jwt.sign({ seed }, jwtKey, {
                algorithm: 'HS256',
                expiresIn: jwtExpirySeconds
                });
                count = count += 1;
                await db.updateCount(count, user);
                const projects = await db.projects(user);
                const arr = []; //project arr
                for (var i = 0; i < projects.rows.length; i += 1) {
                    arr.push(projects.rows[i]);
                }
                users.addUser({
                    name: user,
                    token: token,         
                    }
                ); 
            return { login: true, user: user, token: token, projects: arr};   
        } else {
            return { login: false, error: "incorrect password" };
        }
    }
};

const isAuthorized = async (user, project, token) => {
    if (user === 'Login') {
        return await db.isPublic(project);
    } else {
        return users.findUserToken(token, user);
    }
}

const logout = async (user, token) => {

    const result = users.findUserToken(token, user);
    if (result ) {
        users.deleteToken(token);
    }
    return result;
}

const mapbox = async (user, token) => {
    if (user === 'Login') {
        return false;
    } else {
        return await users.findUserToken(token, user);
    }
}

module.exports = {
    login,
    logout,
    isAuthorized,
    mapbox
}


  