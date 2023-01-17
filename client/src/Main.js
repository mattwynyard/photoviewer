import React from 'react';
import { Switch, Route, BrowserRouter as Router} from 'react-router-dom';
import App from './App.js';
import Report from './Report.js';
import { AppContextProvider } from './context/AppContext';
import { store } from './state/store'
import { Provider } from 'react-redux'

const Main = () => {

  return (
      <Router>
        <Switch> 
          <Provider store={store}>
            <AppContextProvider >
              <Route 
                exact path='/'
                component={App}>
              </Route>
              <Route exact path='/statistics' 
                component={Report}>
              </Route>
            </AppContextProvider>
          </Provider>
        </Switch>
      </Router>
  );
}
export default Main;