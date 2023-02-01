import React, { useState, createContext, useCallback, useMemo } from 'react';
export const AppContext = createContext(null);

export const AppContextProvider = ({children}) => {

    const MAP_CENTRE = {
      lat: -41.2728,
      lng: 173.2995,
    }

    const host = useMemo(() => {
      console.log(process.env.NODE_ENV)
        if (process.env.NODE_ENV === "development") {
            return "localhost:8443";
          } else if (process.env.NODE_ENV === "production") {
            return "osmium.nz";
            //return "localhost:8443"; (used for testing build)
          } else {
            return "localhost:8443";
          }
    }, []) 

    window.sessionStorage.setItem('osmiumhost', host);

    const [login, setLogin] = useState({user: "Login", token: null, host: host});
    const [gl, _setGL] = useState(null);
    const [leafletMap, _setLeafletMap] = useState(null);
    const [mapBoxKey, _setMapBoxKey] = useState(null);
    const [ratingActive, _setRatingActive] = useState(false);
    const [dataActive, _setDataActive] = useState(false);
    const [district, _setDistrict] = useState(null)
    const [mapMode, _setMapMode] = useState("map")
    const [projectMode, _setProjectMode] = useState(null)
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
  
    const setRatingActive = useCallback((isActive) => {
      _setRatingActive(isActive);
    }, [])

    const setDataActive = useCallback((isActive) => {
      _setDataActive(isActive);
    }, [])

    const setDistrict = useCallback((district) => {
      _setDistrict(district);
    }, [])

    const setMapMode = useCallback((mode) => {
      _setMapMode(mode);
    }, [])

    const setLeafletMap = useCallback((map) => {
      _setLeafletMap(map);
    }, [])

    const setProjectMode = useCallback((map) => {
      _setProjectMode(map);
    }, [])

    const values = {
        login,
        updateLogin,
        gl,
        setGL,
        leafletMap,
        setLeafletMap,
        ratingActive,
        setRatingActive,
        dataActive,
        setDataActive,
        hideLoader,
        showLoader,
        mapBoxKey,
        setMapBoxKey,
        district,
        setDistrict,
        mapMode,
        setMapMode,
        projectMode,
        setProjectMode,
        MAP_CENTRE,
    }

    return (
        <AppContext.Provider value={values}>{children}</AppContext.Provider>
    );

}