
import {React} from 'react';
import {Dropdown}  from 'react-bootstrap';

export default function(props) {
    //console.log(props)

    const onFaultChange = () => {
        //console.log("change")/
    }

    const isFaultChecked = (value) => {      
        if (props.items.includes(value)) {
            return true;
        } else {
            return false
        }
    }


    return (
        <Dropdown.Menu className="custommenu">
        {props.data.map((input, index) =>
          <div key={`${index}`}>
            <input
              key={`${index}`} 
              id={input.fault} 
              type="checkbox" 
              //checked={isFaultChecked(input.fault)} 
              //onClick={(e) => onFaultClick(input.fault)}
              onChange={onFaultChange}
              >
            </input>{" " + input.fault}<br></br>
          </div> 
          )}
        <Dropdown.Divider />
      </Dropdown.Menu>
    );
}