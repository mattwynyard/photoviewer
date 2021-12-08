import React from 'react';
import {Dropdown}  from 'react-bootstrap';

export default function ClassDropdown(props) {

    const isChecked = (value) => {
        if (props.filter.includes(value)) {
          return true;
        } else {
          return false;
        }  
      }

      const onChange = () => {
      }

    /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
    const onClick = (e, value) => {
        e.preventDefault();
        let query = [...props.filter]
        if (query.length === 1) {
            if (query.includes(value)) {
                return;
            } else {
                query.push(value);
                props.onClick(query)
            }
        } else {
            if (query.includes(value)) {
                const index = query.indexOf(value);
                query.splice(index, 1);
            } else {
                query.push(value)
            }
            props.onClick(query)
        }   
    }

    if (props.items.length > 0) {
        return (
            <Dropdown className="RMClass" drop='end'>
                <Dropdown.Toggle variant="light" size="sm" >
                    {props.title}
                </Dropdown.Toggle>
                <Dropdown.Menu className="custommenu">
                    {props.items.map((value, index) =>
                    <div 
                        key={`${index}`}
                        >
                        <input
                            key={`${index}`} 
                            id={value} 
                            type="checkbox" 
                            checked={isChecked(value)} 
                            onChange={onChange} 
                            onClick={(e) => onClick(e, value)}
                            >
                        </input>{" " + value}
                        <br></br>
                    </div> 
                    )}
                </Dropdown.Menu>
            </Dropdown>
        )
    } else {
        return null;
    }      
}