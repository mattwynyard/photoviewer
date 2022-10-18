import { useEffect, useContext, useMemo} from 'react';
import { React, useState } from 'react';
import {Dropdown}  from 'react-bootstrap';
import { loginContext } from '../login/loginContext'
import { PostFetch } from '../api/Fetcher'

export default function RatingDropdown(props) {
    const { gl, login } = useContext(loginContext);
    const [menu, setMenu] = useState(["Grade"]);
    const [filter, setFilter] = useState([]);
    const [data, setData] = useState([]);
    const [show, setShow] = useState(false);


    useEffect(() => {
        const body = {user: login.user, project: props.layer}
        const response = PostFetch(login.host + "/rating", login.token, body);
        response.then((res) => {
            if (res.success) {
                setData(res.data);
            }
        })
    }, [PostFetch])

    useEffect(() => {
        //console.log(data)
    }, [data])

    useEffect(() => {
        if (show) {
            const options = {type: "footpath_rating", value: "Grade"}
            let ratings = gl.gl.loadLines([], data, options);
            gl.gl.glData.layers[0].geometry = ratings.vertices;
            gl.gl.redraw(gl.gl.glData, false);
            console.log(ratings)
        } else {
            if (data.length !== 0) {
                gl.gl.glData.layers[0].geometry = [];
                gl.gl.redraw(gl.gl.glData, false);
            }     
        }
    }, [show])
    
    
   const changeCheck = (e, value) => {
        setShow(e.target.checked)
        setFilter(value)
    }    

    if (props.layer) {
        return (
            <Dropdown className="centreline"  drop={'end'}>
            <Dropdown.Toggle variant="light" size="sm" >
                Rating
            </Dropdown.Toggle>
                <Dropdown.Menu className="centrelinemenu">
                    {menu.map((value, index) =>
                    <div key={`${index}`}>
                        <input
                        key={`${index}`} 
                        id={value} 
                        type="checkbox" 
                        //   checked={this.isChecked(value)}
                        //onClick={(e) => handleClick(e, value)}
                        onChange={(e) => changeCheck(e, value)}
                        >
                        </input>{" " + value}<br></br>
                    </div> 
                )}
                </Dropdown.Menu>
            </Dropdown>           
        );
    } else {
        return null
    }
}