import React from 'react';
import ReactDOM from 'react-dom';

import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from './Main.js';
import './index.css';
import { store } from './state/store'
import { Provider } from 'react-redux'

import * as serviceWorker from './serviceWorker';

ReactDOM.render((
    <Provider store={store}>
        <Main
         />
    </Provider>
    ), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
//registerServiceWorker();