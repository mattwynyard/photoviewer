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
        console.log(data)
    }, [data])

    useEffect(() => {
        if (show) {
            const options = {type: "footpath_rating", value: filter}
            let ratings = gl.gl.loadLines([], data, options);
        } else {
            
            gl.gl.glData.layers[0].geometry = [];
            gl.gl.redraw(gl.gl.glData, false);
            
        }
    }, [show])
    
    
   const changeCheck = (e, value) => {
        
        setShow(e.target.checked)
    }
         //this.delegate.glData.layers[0].geometry = [];
         //let glData = this.delegate.glData;
         //this.setState({active: false});
         //this.delegate.redraw(glData, false);
         //this.setState({active: true})
        //  this.setState(
        //    {filter: [value]},
        //    () => {
        //      let options = {type: "centreline", value: value}
        //      let centrelines = this.delegate.loadLines([], this.state.data, options);
        //      let glData = this.delegate.glData;
        //      glData.layers[0].geometry = centrelines.vertices;
        //      this.delegate.redraw(glData, false);
        //    });
        //}     

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