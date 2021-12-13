import {React, useEffect, useState} from 'react';
import { Switch, Route, BrowserRouter as Router} from 'react-router-dom';
import App from './App.js';
import Report from './Report.js';
import { loginContext } from './login/loginContext';

const Main = () => {
  let host = null 
  if (process.env.NODE_ENV === "development") {
    host = "localhost:8443";
  } else if (process.env.NODE_ENV === "production") {
    host = "osmium.nz";
  } else {
    host = "localhost:8443";
  }
  window.sessionStorage.setItem('osmiumhost', host);
  const [login, setLogin] = useState({user: "Login", token: null, host: host});
  const updateLogin = (user, token) => {
    setLogin({user: user, token: token, host: host});
  }
  return (
      <Router>
        <Switch> {/* The Switch decides which component to show based on the current URL.*/}
          <loginContext.Provider value={{login, updateLogin}}>
            <Route exact path='/' component={App}></Route>
            <Route exact path='/statistics' component={Report}></Route>
            {/* <Route exact path='/data' component={Data}></Route> */}
          </loginContext.Provider>
        </Switch>
    </Router>
  );
}
export default Main;