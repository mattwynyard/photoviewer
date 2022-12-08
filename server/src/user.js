'use strict'

let users = [];

let findUserToken = async (token, name) => {
    const result = await users.find(user => user.token === token);
    if (!result) {
        return false;
    }
    if (result.name === name) {
        return true;
    } else {
        return false;
    }
};

let addUser = (user) => {
    users.push(user);   
};

let deleteToken = (token) => {
    users.splice(users.indexOf(token), 1);   
};

let printUsers = () => {
    console.log(users);
}

module.exports = {
    printUsers,
    addUser,
    deleteToken,
    findUserToken
}