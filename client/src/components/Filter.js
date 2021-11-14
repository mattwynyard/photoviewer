import {React, useEffect, useState} from 'react';
import FilterDropdown from './FilterDropdown';

export default function Filter(props) {
    // console.log(props.classes)
    const [filter, setFilter] = useState([]) 
    
    const isChecked = (value) => {
        if (props.classes.includes(value)) {
            return true;
        } else {
            return false
        }
    }

    const onChange = () => {
    }

    const onClick = (e, value) => {
        e.preventDefault();
        let query = [...props.classes]
        console.log(query)
        if (query.length === 1) {
            if (query.includes(value)) {
                return;
            } else {          
                
            }
        } else {
            if (query.includes(value)) {
                const index = query.indexOf(value);
                query.splice(index, 1);
                //setFilter(query)
            } else {
                query.push(value)
            }
        }
        setFilter(query)
        
    }

    return(
        <div className="filter-group">
            {props.values.map((value) =>
            <FilterDropdown
                value={value}
                key={value.code}
                checked={isChecked(value.code)}
                onChange={onchange}
                onClick={onClick}
                />
            )}
        </div>
    );
}