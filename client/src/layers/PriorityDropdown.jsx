import { React, useState } from 'react';
import { Dropdown }  from 'react-bootstrap';
import { CustomSVG } from '../components/CustomSVG.js';

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
    //console.log(props)
    const [rootChecked, setRootChecked] = useState(true)

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

    const onRootChange = (e) => {
      //console.log(e.target.checked)
      if (!e.target.checked) {
        props.onClick([])
      } else {
        const filter = []
        props.items.map((item) => {
          filter.push(parsePriority(item));
          
        });
        props.onClick(filter)
      }
      
      setRootChecked(!rootChecked)
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
    
    return (
      <div className={props.className}>
        <Dropdown drop='end'>
            <Dropdown.Toggle variant="light" size="sm" >
              <input
                type="checkbox" 
                checked={rootChecked}
                onChange={onRootChange}
              >
              </input>
              <span>{props.title}</span> 
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu" style={{ margin: 0 }}>
                {props.items.map((value, index) =>
                <div 
                    key={`${index}`}
                    >
                    <CustomSVG 
                      login={props.login}
                      value={value}
                      reverse={props.layer.reverse}
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
      </div>
    );
}