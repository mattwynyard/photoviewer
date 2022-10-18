import React from 'react';
const loginContext = React.createContext({user: "Login", token: null});

const glContext = React.createContext();

//const GLProvider = glContext.Provider
//const GLConsumer = glContext.Consumer

export { loginContext, glContext };