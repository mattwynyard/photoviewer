'use strict'

let users = [];

let findUserToken = (token, name) => {
    //console.log(name);
    //console.log(token);
    //console.log(users.name);
    const result = users.find(user => user.name === name)
    if (result === undefined) {
        return false;
    }
    if (result.token === token) {
        return true;
    } else {
        return false;
    }
    //console.log("Result: " + result.token);
};

let addUser = (user) => {
    users.push(user);
    
};

let deleteUser = (user) => {
    users.splice(users.indexOf(user), 1);   
};

let printUsers = () => {
    // for( var i = 0; i < users.length; i += 1) {
    //     console.log(users[i]);
    //   }
    console.log(users);
}

exports.printUsers = printUsers;
exports.addUser = addUser;
exports.deleteUser = deleteUser;
exports.findUserToken = findUserToken;