import React, { useState, createContext, useCallback, useMemo } from 'react';
export const AppContext = createContext(null);

export const AppContextProvider = ({children}) => {

    const MAP_CENTRE = {
      lat: -41.2728,
      lng: 173.2995,
    }

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
    const [mapBoxKey, _setMapBoxKey] = useState(null);
    const [ratingActive, _setRatingActive] = useState(false);
    const [district, _setDistrict] = useState(null)
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

    const setMapBoxKey = useCallback((token) => {
        _setMapBoxKey({mapBoxKey: token})
      }, [])
    
    const updateLogin = useCallback((user, token) => {
      setLogin({user: user, token: token, host: host});
    }, [host])
  
    const setGL = useCallback((_gl) => {
      _setGL({gl: _gl});
    }, [])
  
    const setRatingActive = useCallback((active) => {
      _setRatingActive(active);
    }, [])

    const setDistrict = useCallback((district) => {
      _setDistrict(district);
    }, [])

    const values = {
        login,
        updateLogin,
        gl,
        setGL,
        ratingActive,
        setRatingActive,
        hideLoader,
        showLoader,
        mapBoxKey,
        setMapBoxKey,
        district,
        setDistrict,
        MAP_CENTRE
    }

    return (
        <AppContext.Provider value={values}>{children}</AppContext.Provider>
    );

}