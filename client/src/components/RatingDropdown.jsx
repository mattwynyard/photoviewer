import { useEffect } from 'react';
import { React, useState } from 'react';
import {Dropdown}  from 'react-bootstrap';

export default function RatingDropdown(props) {

    const gl = null;
    const [menu, setMenu] = useState(["Grade"])
    

    useEffect(() => {

    }, [])

    const handleClick = (e, value) => {
        
    }
    
    if (props.project) {
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
                    onClick={(e) => handleClick(e, value)}
                    //   onChange={(e) => this.changeCheck(value)}
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