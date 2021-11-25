import {React} from 'react';
import FilterMenu from './FilterMenu';
import {Dropdown}  from 'react-bootstrap';

export default function Filter(props) {

  const isClassChecked = (code) => {
    let filter = [...props.filter]
    const element = filter.find(element => element.code === code)
    if (element.active) {
      return true;
    } else {
        return false
    }
  }

  /**
   * Finds filter object in filters array and returns copy of filter data
   * @param {string} code 
   * @returns array of current faults active
   */
  const findObjectData = (code) => {
    let filter = [...props.filter]
    const element = filter.find(element => element.code === code)
    if (element) {
      return [...element.data];
    } else {
      return [];
    }
  }

  /**
   * Callback passed to child menu to handle user clicks on individual faults
   * @param {string} code 
   * @param {array} newFilter 
   */
  const updateFilter = (code, newFilter) => {
    let filter = [...props.filter]
    const element = filter.find(element => element.code === code);
    if (element) {
      element.data = newFilter;
      props.update(filter)
    }  
  }
  
  /**
   * Selects or deselects class filter.
   * Fitler updated in parent calling update() callback
   * @param {String} code 
   * @returns 
   */
  const onClassClick = (code) => { 
    if (props.mode === "footpath") return;
    let filters = [...props.filter]
    let filter = filters.find(element => element.code === code) 
    if (filter.active) {
      filter.active = false;
      filter.data = [];
      props.update(filters)

    } else {
      filter.active = true;
      let object = props.store.find(element => element.code === code);
      let data = [...object.data];
      filter.data = data;
      props.update(filters)
    }
  }

  const onChange = () => {
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
            store={value.data}
            mode={props.mode}
            filter={findObjectData(value.code)}
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