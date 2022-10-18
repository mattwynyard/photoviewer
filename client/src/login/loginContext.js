import React from 'react';
const loginContext = React.createContext({user: "Login", token: null});

const glContext = React.createContext();

export { loginContext };