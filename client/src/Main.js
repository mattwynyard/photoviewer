import React from 'react';
import { Switch, Route, BrowserRouter as Router} from 'react-router-dom';
import App from './App.js';
import Report from './Report.js';
import { AppContextProvider } from './context/AppContext';


const Main = () => {

  return (
      <Router>
        <Switch> 
          <AppContextProvider>
            <Route 
              exact path='/'
              component={App}>
            </Route>
            <Route exact path='/statistics' 
              component={Report}>
            </Route>
          </AppContextProvider>
        </Switch>
      </Router>
  );
}
export default Main;