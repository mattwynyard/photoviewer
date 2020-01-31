'use strict'

let users = [];

let findUserToken = (token, name) => {
    //console.log(name);
    //console.log(token);
    //console.log(users.name);
    const result = users.find(user => user.token === token);
    //console.log(result);
    if (result === undefined) {
        //console.log("token not found");
        return false;
    }
    if (result.name === name) {
        //console.log("found token");
        return true;
    } else {
       // console.log("user not found");
        return false;
    }
};

let addUser = (user) => {
    //console.log(user);
    users.push(user);
    
};

let deleteToken = (token) => {
    users.splice(users.indexOf(token), 1);   
};

let printUsers = () => {
    // for( var i = 0; i < users.length; i += 1) {
    //     console.log(users[i]);
    //   }
    console.log(users);
}

exports.printUsers = printUsers;
exports.addUser = addUser;
exports.deleteToken = deleteToken;
exports.findUserToken = findUserToken;