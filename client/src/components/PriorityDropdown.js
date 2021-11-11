import { React} from 'react';
import {Dropdown}  from 'react-bootstrap';
import {CustomSVG} from './CustomSVG.js';

function parsePriority(id) {
    let priority = null
    if (id === "Signage") {
      priority = 99;
    } else if (id === "Completed") {
      priority = 98;
    } else if (id === "Programmed") {
      priority = 97;
    } else {
      let p = id.substring(id.length - 1, id.length)
      priority = parseInt(p);
    }
    return priority;
  }

  const onChange= () => {

  }

export default function PriorityDropdown(props) {

    const isChecked = (value, parse) => {
        let priority = null;
        if (parse) {
          priority = parsePriority(value);
        } else {
          priority = value;
        }
        if (props.filter.includes(priority)) {
          return true;
        } else {
          return false;
        }  
      }

    /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
   /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
    const onClick = (e, value) => {
        e.preventDefault();
        let query = [...props.filter]
        let parsedValue = parsePriority(value);
        if (query.length === 1) {
            if (query.includes(parsedValue)) {
                return;
            } else {
                query.push(parsedValue);
                props.onClick(query)
            }
        } else {
            if (query.includes(parsedValue)) {
                const index = query.indexOf(parsedValue);
                query.splice(index, 1);
            } else {
                query.push(parsedValue)
            }
            props.onClick(query)
        }   
    }

    // const clickPriority = (e) => {
    //     e.preventDefault();
    //     if(!props.layer) {
    //     return;
    //     }
    //     let query = props.filter;
    //     let priority = parsePriority(e.target.id);
    //     if (query.length === 1) {
    //     if (isPriorityChecked(priority, query , false)) {
    //         e.target.checked = true; 
    //     } else {
    //         query.push(priority);     
    //     }
    //     } else {
    //     if (isPriorityChecked(priority, query, false)) { 
    //         query.splice(query.indexOf(priority), 1 );
    //     } else {     
    //         query.push(priority);
    //     }
    //     }
    //     props.onClick(query)

    // }
        return (
            <Dropdown className="priority" drop='right'>
                <Dropdown.Toggle variant="light" size="sm" >
                    {props.title}
                </Dropdown.Toggle>
                <Dropdown.Menu className="custommenu">
                    {props.items.map((value, index) =>
                    <div 
                        key={`${index}`}
                        >
                        <CustomSVG 
                        login={props.login}
                        value={value}
                        reverse={props.reverse}
                        >
                        </CustomSVG>
                        <input
                            key={`${index}`} 
                            id={value} 
                            type="checkbox" 
                            checked={isChecked(value, true)} 
                            onChange={onChange} 
                            onClick={(e) => onClick(e, value)}>
                        </input>{" " + value}
                        <br></br>
                    </div> 
                    )}
                </Dropdown.Menu>
            </Dropdown>
        )
}