import React from 'react';
import ReactDOM from 'react-dom';

import 'leaflet/dist/leaflet.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Main from './Main.js';
import './index.css';

import * as serviceWorker from './serviceWorker';

const loader = document.querySelector('.loader');
const loading = document.querySelector('.loading');
// if you want to show the loader when React loads data again
const showLoader = () => {
    loader.classList.remove('loader--hide');
    loading.classList.remove('loading--hide');
}

const hideLoader = () => {
    loader.classList.add('loader--hide');
    loading.classList.add('loading--hide');
}

ReactDOM.render((
        <Main
            hideLoader={hideLoader}
            showLoader={showLoader} 
         />
    ), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
//registerServiceWorker();