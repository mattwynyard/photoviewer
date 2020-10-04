import React from 'react';
import { Switch, Route, BrowserRouter as Router} from 'react-router-dom';

import App from './App.js';
import Report from './Report.js'

const Main = () => {
  return (
      <Router>
        <Switch> {/* The Switch decides which component to show based on the current URL.*/}
            <Route exact path='/' component={App}></Route>
            <Route exact path='/statistics' component={Report}></Route>
        </Switch>
    </Router>
  );
}

export default Main;