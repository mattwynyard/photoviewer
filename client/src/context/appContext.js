import React, { useState, createContext, useCallback, useMemo } from 'react';
export const AppContext = createContext(null);

export const AppContextProvider = ({children}) => {

    const host = useMemo(() => {
        if (process.env.NODE_ENV === "development") {
            return "localhost:8443";
          } else if (process.env.NODE_ENV === "production") {
            return "osmium.nz";
          } else {
            return "localhost:8443";
          }
    }, []) 

    window.sessionStorage.setItem('osmiumhost', host);

    const [login, setLogin] = useState({user: "Login", token: null, host: host});
    const [gl, _setGL] = useState(null);
    const [ratingActive, _setRatingActive] = useState(false);
    const loader = document.querySelector('.loader');
    const loading = document.querySelector('.loading');

    const showLoader = () => {
        loader.classList.remove('loader--hide');
        loading.classList.remove('loading--hide');
    }

    const hideLoader = () => {
        loader.classList.add('loader--hide');
        loading.classList.add('loading--hide');
    }
    
    const updateLogin = useCallback((user, token) => {
      setLogin({user: user, token: token, host: host});
    }, [host])
  
    const setGL = useCallback((_gl) => {
      _setGL({gl: _gl});
    }, [])
  
    const setRatingActive = useCallback((active) => {
      _setRatingActive(active);
    }, [])

    const values = {
        login,
        updateLogin,
        gl,
        setGL,
        ratingActive,
        setRatingActive,
        hideLoader,
        showLoader

    }

    return (
        <AppContext.Provider value={values}>{children}</AppContext.Provider>
    );

}