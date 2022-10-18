import { React, useContext  } from 'react';
import { Card }  from 'react-bootstrap';
import ClassDropdown from '../components/ClassDropdown.js';
import PriorityDropdown from '../components/PriorityDropdown.js';
import RatingDropdown from '../components/RatingDropdown';
import { loginContext } from '../login/loginContext'
import './LayerCard.css';

function LayerCard(props) {
    const { gl } = useContext(loginContext);
    const box = document.querySelector('.layercard-datainput');

    const handleFocus = (e) => {
        if (!e.target.checked) {
            props.spin();       
       }
       box.blur();
    }

    const handleDataChange = (e) => { 
        if (e.target.checked) {
            props.setDataActive(true);
            props.stopSpin();     
        } else {
            props.setDataActive(false);
        }  
    }

    const handleVideoChange = (e) => {
        if (e.target.checked) {
            props.setMapMode("video");
        } else {
            props.setMapMode("map");
        }
    }

    const handleRatingChange = (e) => {
        if (e.target.checked) {
            
        } else {

        }
    }
       
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
                <RatingDropdown 
                    className="layercard-ratingDropdown"
                    project={"test"}
                />
                <div >
                    <input 
                        className="layercard-datainput"
                        type="checkbox" 
                        checked={props.dataChecked}
                        onChange={(e) => handleDataChange(e)}
                        onFocus={(e) => handleFocus(e)}
                    />
                    <label className="layercard-label">
                        Data
                    </label>
                </div>
                <div >
                    <input 
                        className="layercard-videoinput"
                        type="checkbox" 
                        checked={props.mapMode === "video"}
                        onChange={(e) => handleVideoChange(e)}
                        disabled={!props.layer.hasvideo}
                    />
                    <label className="layercard-label">
                        Video Mode
                    </label>
                </div>
            </Card.Body>
        </Card>
    ); 
}

export { LayerCard }