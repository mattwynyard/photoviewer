import { useEffect, useContext} from 'react';
import { React, useState } from 'react';
import { Dropdown }  from 'react-bootstrap';
import { AppContext } from '../context/AppContext';
import { PostFetch } from '../api/Fetcher';
import {CustomSVG} from '../components/CustomSVG.js';

export default function RatingDropdown(props) {
    const { gl, login, hideLoader, showLoader, setRatingActive } = useContext(AppContext);
    const [menu, setMenu] = useState(null);
    const [filter, setFilter] = useState([]);
    const [data, setData] = useState([]);
    const [active, setActive] = useState(false);
    const [layer, setLayer] = useState(null);
    const defaultTitle = "Rating";

    useEffect(() => {
        if (!props.layer.centreline) return;
        setLayer(props.layer)
        if (props.layer.surface === 'road') {
            setMenu(["Structural Rating", "Surface Rating", "Drainage Rating"]);
        } else if (props.layer.surface === 'footpath') {
            setMenu(["Rating 1", "Rating 2", "Rating 3", "Rating 4", "Rating 5"]);
        }
    }, [props.layer])

    useEffect(() => {
        setRatingActive(active)
    }, [active, setRatingActive])
    
    useEffect(() => {
        if (!layer) return;
        const body = {user: login.user, project: layer, filter: filter}
        showLoader();
        const response = PostFetch(login.host + "/rating", login.token, body);
        response.then((res) => {
            if (res.success) {
                setData(res.data);
            }
            hideLoader();
        })
    }, [filter, login, layer, showLoader, hideLoader])


    // const getLayerData = () => {
    //     if (!gl.gl.GLEngine.glData) return [];
    //     if (gl.gl.GLEngine.glData.length != 0) {
    //       return gl.gl.GLEngine.glData.layers[0].geometry;
    //     } else {
    //       return [];
    //     }
    //   }

    useEffect(() => {
        if (!layer) return;
        
        if (active) {
            if (layer.surface === "road") {
                const options = {type: filter[0], render: defaultTitle}
                let ratings = gl.gl.loadLines([], data, options);
                gl.gl.glData.layers[0].geometry = ratings.vertices;
                gl.gl.redraw(gl.gl.glData, false);
            } else {
                const options = {type: "footpath", render: defaultTitle}
                let ratings = gl.gl.loadLines([], data, options);
                gl.gl.glData.layers[0].geometry = ratings.vertices;
                gl.gl.redraw(gl.gl.glData, false);
            }
            
        } 
        else {
            if (data.length !== 0) {
                if (!gl.gl.glData || gl.gl.glData.length === 0) return;
                gl.gl.glData.layers[0].geometry = [];
                gl.gl.redraw(gl.gl.glData, false);
            }     
        }
    }, [data, active, layer, gl, filter])
    
    
   const changeCheck = (e, value) => {
    if (value === defaultTitle) { //root
        if (e.target.checked) {
            const filter = []
            if (layer.surface === "footpath") {
                menu.forEach(item => {
                    const s = item.replace(defaultTitle, '').replace(/\s/g, '');
                    filter.push(s)
                })
            } else {
                const s = menu[0].replace(defaultTitle, '').replace(/\s/g, '');
                filter.push(s) 
            }
           
            setFilter(filter)
            setActive(true)
        } else {
            setFilter([])
            setActive(false)
        }
    } else { //child
        const _filter = [...filter]
        if (!e.target.checked) {
            if (filter.length <= 1) {
                setActive(false) 
            }
            const index = _filter.indexOf(value.replace(defaultTitle, '').replace(/\s/g, ''));
            if (index > -1) { 
                _filter.splice(index, 1);
                setFilter([..._filter])
            }
        } else {
            if (filter.length < 1) {
                setActive(true) 
            }
            if (layer.surface === "road") {
                const f = []
                f.push(value.replace(defaultTitle, '').replace(/\s/g, ''))
                setFilter(f)
            } else {
                _filter.push(value.replace(defaultTitle, '').replace(/\s/g, ''))
                setFilter(_filter)
            }
            
        }    
    }    
    }

    if (menu && props.layer.centreline) {
        return (
            <div className={props.className}>
                <Dropdown className="centreline"  drop={'end'}>
                    <Dropdown.Toggle variant="light" size="sm" >
                        <input
                            type="checkbox" 
                            onChange={(e) => changeCheck(e, defaultTitle)}
                            checked={active}
                        >
                        </input>
                        <span>{defaultTitle}</span>          
                    </Dropdown.Toggle>
                    <Dropdown.Menu 
                        className="centrelinemenu"
                        style={{ margin: 0 }}
                        >
                        {menu.map((value, index) =>
                        <div key={`${index}`}>
                            <input
                            key={`${index}`} 
                            id={value}
                            checked={filter.includes(value.replace(defaultTitle, '').replace(/\s/g, ''))} 
                            type="checkbox" 
                            onChange={(e) => changeCheck(e, value)}
                            >
                            </input>
                            <span>{" " + value}</span>
                            <CustomSVG 
                                value={value}
                                reverse={props.layer.reverse}
                                >
                            </CustomSVG>
                        </div> 
                    )}
                    </Dropdown.Menu>
                </Dropdown>   
            </div>              
        );
    } else {
        return null
    }
}