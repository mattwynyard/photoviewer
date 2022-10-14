import React from 'react';
const loginContext = React.createContext({user: "Login", token: null});

const glContext = React.createContext();

const glProvider = glContext.Provider
const glConsumer = glContext.Consumer

export { loginContext, glContext, glProvider, glConsumer };