import { useEffect, useContext} from 'react';
import { React, useState } from 'react';
import {Dropdown}  from 'react-bootstrap';
import { loginContext } from '../login/loginContext';
import { PostFetch } from '../api/Fetcher';
import {CustomSVG} from '../components/CustomSVG.js';

export default function RatingDropdown(props) {
    const { gl, login, hideLoader, showLoader } = useContext(loginContext);
    const [menu, setMenu] = useState(null);
    const [filter, setFilter] = useState([]);
    const [data, setData] = useState([]);
    const [active, setActive] = useState(false);
    const defaultTitle = "Rating";
    
    useEffect(() => {
        const body = {user: login.user, project: props.layer, filter: filter}
        showLoader();
        const response = PostFetch(login.host + "/rating", login.token, body);
        response.then((res) => {
            if (res.success) {
                setData(res.data);
                console.log(data)
            }
            hideLoader();
        })
    }, [filter, PostFetch])
    

    useEffect(() => {
        console.log(filter)
    }, [])

    useEffect(() => {
        if (props.menu) setMenu(props.menu)
        if (active) {
            const options = {type: props.layer.surface === "road" ? "road_rating" : "footpath_rating", value: defaultTitle}
            let ratings = gl.gl.loadLines([], data, options);
            gl.gl.glData.layers[0].geometry = ratings.vertices;
            gl.gl.redraw(gl.gl.glData, false);
        } else {
            if (data.length !== 0) {
                gl.gl.glData.layers[0].geometry = [];
                gl.gl.redraw(gl.gl.glData, false);
            }     
        }
    }, [data])
    
    
   const changeCheck = (e, value) => {
    if (value === defaultTitle) {
        if (e.target.checked) {
            const filter = []
            menu.map(item => {
                const s = item.replace(defaultTitle, '').replace(/\s/g, '');
                filter.push(s)
            })
            setFilter(filter)
            setActive(true)
        } else {
            setFilter([])
            setActive(false)
        }
        setActive(e.target.checked)
    } else {
        if (!active) return;
            const copy = [...filter]
        if (!e.target.checked) {
            if (filter.length <= 1) return;
            const index = copy.indexOf(value.replace(defaultTitle, '').replace(/\s/g, ''));
            if (index > -1) { 
                copy.splice(index, 1);
                setFilter([...copy])
            }
        } else {
           copy.push(value.replace(defaultTitle, '').replace(/\s/g, ''))
           setFilter(copy)
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
                        >
                        </input>
                        <span>{"Rating"}</span>          
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="centrelinemenu">
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