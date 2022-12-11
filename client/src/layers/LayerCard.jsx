import { React, useContext, useCallback, useMemo } from 'react';
import { Card }  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown';
import PriorityDropdown from './PriorityDropdown';
import RatingDropdown from './RatingDropdown';
import { AppContext } from '../context/AppContext';

import './LayerCard.css';

function LayerCard(props) {

    const box = document.querySelector('.layercard-datainput');
    const { mapMode, setMapMode, showLoader } = useContext(AppContext);

    const handleFocus = () => {
        box.blur();
        showLoader();      
    }

    const handleDataChange = useCallback((e) => { 
        if (e.target.checked) {
            showLoader();   
            props.setDataActive(true);    
        } else {
            props.setDataActive(false);
        }  
    }, [showLoader, props])

    const handleVideoChange = useCallback((e) => {
        if (e.target.checked) {
            setMapMode("video");
        } else {
            setMapMode("map");
        }
    }, [setMapMode])

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
                        checked={mapMode === "video"}
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