import { React } from 'react';
import { Card }  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown';
import PriorityDropdown from './PriorityDropdown';
import RatingDropdown from './RatingDropdown';

import './LayerCard.css';

function LayerCard(props) {

    const box = document.querySelector('.layercard-datainput');

    const handleFocus = (e) => {
        box.blur();
        props.spin();      
    }

    const handleDataChange = (e) => { 

        if (e.target.checked) {
            props.spin();   
            props.setDataActive(true);
            //props.stopSpin();     
        } else {
            // 
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

    const handleRatingChange = (isChecked) => {
        
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
                    filter={props.priorityfilter} 
                    onClick={props.priorityonClick}
                    layer={props.layer}
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
                    layer={props.layer}
                    changeCheck={handleRatingChange}
                />
                <div className="layercard-datainput">
                    <input 
                        type="checkbox" 
                        checked={props.dataChecked}
                        onChange={(e) => handleDataChange(e)}
                        onFocus={(e) => handleFocus(e)}
                    />
                    <label className="layercard-label">
                        <span>{"Data"}</span>
                    </label>
                </div>
                <div>
                    <input 
                        className="layercard-videoinput"
                        type="checkbox" 
                        checked={props.mapMode === "video"}
                        onChange={(e) => handleVideoChange(e)}
                        disabled={!props.layer.hasvideo}
                    />
                    <label className="layercard-label">
                        <span>{"Video"}</span>
                    </label>
                </div>
            </Card.Body>
        </Card>
    ); 
}

export { LayerCard }