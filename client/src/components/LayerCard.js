import {React} from 'react';
import {Card}  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown.js';
import PriorityDropdown from './PriorityDropdown.js';
import ModeDropdown from './ModeDropdown.js';
import "./LayerCard.css";

export default function LayerCard(props) {

    const box = document.querySelector('.layercard-input');

    const handleFocus = (e) => {
        if (!e.target.checked) {
            props.spin();
           
       }
       box.blur();
    }

    const handleChange = (e) => { 
        if (e.target.checked) {
            props.setDataActive(true);
            props.stopSpin();     
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
                    className="layercard-classDropdown"
                    title={props.classtitle}
                    items={props.classitems}
                    login={props.classlogin}
                    filter={props.classfilter} 
                    onClick={props.classonClick}
                    />
                    <ModeDropdown 
                        className="layercard-modeDropdown"
                        mode={props.mapMode}
                        setMode={props.setMapMode}
                        disabled={props.layer.hasvideo}
                    />
                    <div >
                        <input 
                            className="layercard-input"
                            type="checkbox" 
                            checked={props.dataChecked}
                            onChange={(e) => handleChange(e)}
                            onFocus={(e) => handleFocus(e)}

                        />
                        <label className="layercard-label">
                            Data
                        </label>
                    </div>
                </Card.Body>
            </Card>
        );
    } else {
        return null;
    }
    
}