import React from 'react';
import { Switch, Route, BrowserRouter as Router} from 'react-router-dom';
import App from './App.js';
import Report from './Report.js';
import { AppContextProvider } from './context/AppContext';

const Main = () => {

  return (
      <Router>
        <Switch> {/* The Switch decides which component to show based on the current URL.*/}
          <AppContextProvider>
          {/* <AppContext.Provider value={{login, updateLogin, hideLoader, showLoader, setGL, ratingActive, setRatingActive, gl}}> */}
            <Route 
              exact path='/'
              component={App}>
            </Route>
            <Route exact path='/statistics' 
              component={Report}>
            </Route>
          </AppContextProvider>
          {/* </AppContext.Provider> */}
        </Switch>
    </Router>
  );
}
export default Main;