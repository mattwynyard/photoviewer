import {React, useEffect, useState} from 'react';
import FilterMenu from './FilterMenu';
import {Dropdown}  from 'react-bootstrap';

export default function Filter(props) {

  const isClassChecked = (code) => {
    if (props.filter.map(value => value.code).includes(code)) {
      return true;
    } else {
        return false
    }
  }

  const findObject = (code) => {
    let filter = [...props.filter]
    const element = filter.find(element => element.code === code)
    if (element) {
      return [...element.data];
    } else {
      return [];
    }
  }

  const updateFilter = (code, newFilter) => {
    let filter = [...props.filter]
    const element = filter.find(element => element.code === code);
    if (element) {
      element.data = newFilter;
      props.update(filter)
    }
    
  }
  
  const onClassClick = (code) => {      
    if (props.filter.map(value => value.code).includes(code)) {
      let temp = [...props.filter]
      let arr = temp.filter(value => value.code !== code)
      props.update(arr)
    } else {
      let arr = [...props.store].filter(value => value.code === code)
      let temp = [...props.filter]
      temp.push(arr[0])
      props.update(temp)
    }
  }

    const onChange = () => {
        console.log("change")
    }

    const onFaultChange = () => {
        //console.log("change")
    }

    if (props.mode === "road" || props.mode === "footpath") {
        return(
          <div className="filter-group">
            {props.store.map((value) =>
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
                onClick={() => onClassClick(value.code)}
                >
              </input>
              {value.description}         
            </Dropdown.Toggle>
            <FilterMenu
              code={value.code}
              description={value.description}
              id={value.description} 
              data={value.data}
              filter={findObject(value.code)}
              update={updateFilter}
            />
          </Dropdown> 
            )}
        </div>
        );
    } else {
      return null;
    }
    
}