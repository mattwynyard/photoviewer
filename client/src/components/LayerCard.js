import {React} from 'react';
import {Card}  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown.js';
import PriorityDropdown from './PriorityDropdown.js';
import "./LayerCard.css";

export default function LayerCard(props) {

    const handleChange = (e) => { 
        if (e.target.checked) {
            props.setDataActive(true);    
        } else {
            props.setDataActive(false);
        }      
    }

    if (props.layer) {
        return (
            <Card className='layercard' >
                <Card.Header className='layercard-title'>
                    {props.layer !== null ? props.layer.description: ''}
                </Card.Header>
                <Card.Body className='layercard-body'>
                    <PriorityDropdown
                    className="layercard-priorityDropdown"
                    title={props.prioritytitle}
                    items={props.priorityitems}
                    reverse={props.priorityreverse}
                    filter={props.priorityfilter} 
                    onClick={props.priorityonClick}
                    />
                    <ClassDropdown 
                    className="layercard-priorityDropdown"
                    title={props.classtitle}
                    items={props.classitems}
                    login={props.classlogin}
                    filter={props.classfilter} 
                    onClick={props.classonClick}
                    />
                    <label className="layercard-data">
                        <input 
                            type="checkbox" 
                            checked={props.checked}
                            onChange={(e) => handleChange(e)}
                        />
                    Data
                    </label>
                    {/* <label className={"warning"}><b>Experimental version:</b> <br></br> 
                        Data load slow at present <br></br> 
                        Please clear session storage in browser and refresh if application crashes.
                    </label> */}
                </Card.Body>
            </Card>
        );
    } else {
        return null;
    }
    
}