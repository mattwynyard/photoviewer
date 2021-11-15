import {React, useEffect, useState} from 'react';
//import FilterDropdown from './FilterDropdown';
import {Dropdown}  from 'react-bootstrap';

export default function Filter(props) {

    const [filter, setFilter] = useState([])

    const isClassChecked = (value) => {
        if (props.classes.includes(value)) {
            return true;
        } else {
            return false
        }
    }

    const isFaultChecked = (value) => {      
        if (props.faults.includes(value)) {
            return true;
        } else {
            return false
        }
    }

    const onChange = () => {
        //console.log("change")
    }

    const onFaultChange = () => {
        //console.log("change")
    }

    const onFaultClick = (value) => {

        let filter = [...props.faults]
        if (filter.includes(value)) {
            const index = filter.indexOf(value);
            filter.splice(index, 1);
        } else {
            filter.push(value);
        }
        props.update(props.classes, filter)    
    }

    const onClassClick = (value) => {
        let faults = value.data.map(data => data.fault)
        let filter = [...props.faults]
        let query = [...props.classes]
        if (query.length === 1) {
            if (query.includes(value.code)) {
                return;
            } else {          
                query.push(value.code)
                faults.forEach(fault => filter.push(fault))
            }
        } else {
            if (query.includes(value.code)) {
                const index = query.indexOf(value.code);
                query.splice(index, 1);
                faults.forEach((fault) => {
                    const index = filter.indexOf(fault);
                    filter.splice(index, 1)
                })
            } else {
                query.push(value.code);
                faults.forEach(fault => filter.push(fault))
            }
        }
        console.log(filter.length)
        props.update(query, filter)      
    }

    return(
        <div className="filter-group">
            {props.values.map((value) =>
            <Dropdown 
            className="dropdown"
            key={value.code} 
            drop={'right'}  
            >                
            <Dropdown.Toggle variant="light" size="sm">
              <input
                key={value.code} 
                id={value.description} 
                type="checkbox" 
                checked={isClassChecked(value.code)} 
                onChange={onChange}
                onClick={() => onClassClick(value)}
                >
              </input>
              {value.description}         
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu">
              {value.data.map((input, index) =>
                <div key={`${index}`}>
                  <input
                    key={`${index}`} 
                    id={input.fault} 
                    type="checkbox" 
                    checked={isFaultChecked(input.fault)} 
                    onClick={(e) => onFaultClick(input.fault)}
                    onChange={onFaultChange}
                    >
                  </input>{" " + input.fault}<br></br>
                </div> 
                )}
              <Dropdown.Divider />
            </Dropdown.Menu>
          </Dropdown> 
            )}
        </div>
    );
}