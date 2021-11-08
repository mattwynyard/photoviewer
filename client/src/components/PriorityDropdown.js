import { React} from 'react';
import {Dropdown}  from 'react-bootstrap';
import {CustomSVG} from './CustomSVG.js'

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

    const isPriorityChecked = (value, filter, parse) => {
        let priority = null;
        if (parse) {
          priority = parsePriority(value);
        } else {
          priority = value;
        }
        if (filter.includes(priority)) {
          return true;
        } else {
          return false;
        }  
      }

        /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
  const clickPriority = (e) => {
      e.preventDefault();
    if(!props.layer) {
      return;
    }
    let query = props.filter;
    let priority = parsePriority(e.target.id);
    if (query.length === 1) {
      if (isPriorityChecked(priority, query , false)) {
        e.target.checked = true; 
      } else {
        query.push(priority);     
      }
    } else {
      if (isPriorityChecked(priority, query, false)) { 
        query.splice(query.indexOf(priority), 1 );
      } else {     
        query.push(priority);
      }
    }
    props.onClick(query)

  }

    return (
        <Dropdown className="priority" drop='right'>
            <Dropdown.Toggle variant="light" size="sm" >
                {props.title}
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu">
                {props.priorities.map((value, index) =>
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
                        checked={isPriorityChecked(value, props.filter, true)} 
                        onChange={onChange} 
                        onClick={clickPriority}>
                    </input>{" " + value}
                    <br></br>
                </div> 
                )}
            </Dropdown.Menu>
        </Dropdown>
    )
}