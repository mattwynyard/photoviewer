import React from 'react';
import {Dropdown}  from 'react-bootstrap';

export default function FilterDropdown(props) {
  /**
 * checks if each fault is checked by searching checkedFault array
 * @param {the dropdown} value 
 * * @param {the index of the fault within the dropdown} index 
 * @return {}
 */
  //   const isChecked = (input, filter) => {
  //   if (props.filter.includes(input)) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

    return (    
      <Dropdown 
        className="dropdown"
        key={props.value.code} 
        drop={'right'}  
        >                
        <Dropdown.Toggle variant="light" size="sm">
          <input
            key={props.value.code} 
            id={props.value.description} 
            type="checkbox" 
            checked={props.checked} 
            // onChange={(e) => this.changeActive(e)}
            onClick={(e) => props.onClick(e, props.value.code)}
            >
          </input>
          {props.value.description}         
        </Dropdown.Toggle>
        <Dropdown.Menu className="custommenu">
          {props.value.data.map((input, index) =>
            <div key={`${index}`}>
              <input
                key={`${index}`} 
                id={input} 
                type="checkbox" 
                // checked={this.isChecked(input, props.value.filter)} 
                // onClick={(e) => this.clickCheck(e, props.value, input)}
                // onChange={(e) => this.changeCheck(e)}
                >
              </input>{" " + input}<br></br>
            </div> 
            )}
          <Dropdown.Divider />
        </Dropdown.Menu>
      </Dropdown> 
    );
}