
import {React} from 'react';
import {Dropdown}  from 'react-bootstrap';

export default function(props) {
  console.log(props.filter)
  const isChecked = (code) => {
    if (props.filter.includes(code)) {
      return true;
    } else {
        return false
    }
  }

  const onClick = (e, code) => {
    let filter = [...props.filter]
    let index = filter.indexOf(e.target.id)
    if (index >= 0) {
      filter.splice(index, 1)
      props.update(code, filter)

    } else {
      filter.push(e.target.id)
      filter.sort();
      props.update(code, filter)
    }
    
  }

  const onChange = () => {

  }

    return (
        <Dropdown.Menu className="custommenu">
        {props.data.map((value, index) =>
          <div key={`${index}`}>
            <input
              key={`${index}`} 
              id={value} 
              type="checkbox" 
              checked={isChecked(value)} 
              onClick={(e) => onClick(e, props.code)}
              onChange={onChange}
              >
            </input>{" " + value}<br></br>
          </div> 
          )}
        <Dropdown.Divider />
      </Dropdown.Menu>
    );
}