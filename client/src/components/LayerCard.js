import {React, Fragment, useState, useEffect} from 'react';
import {Card}  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown.js';
import PriorityDropdown from './PriorityDropdown.js';
import "./LayerCard.css";
import {CustomSpinner} from '../components/Components.js'

export default function LayerCard(props) {
    
    // const [loading, setLoading] = useState(false);

    // useEffect(() => {
    //     console.log("loading" + loading)
    //     if (loading) {

    //         props.spin(true)

    //         props.setData(true)
    //     } else {
    //         props.setData(false) 
    //     }
    // }, [loading])

    const onDataChange = (e) => {
        props.setData(e.target.checked)   
        
    }

    if (props.layer) {
        return (
            <Fragment>
            <Card className='layercard' >
            <Card.Header className='layercard-title'>{props.layer !== null ? props.layer.description: ''}</Card.Header>
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
                <label>
                    <input 
                        type="checkbox" 
                        checked={props.checked}
                        onChange={(e) => onDataChange(e)}
                    />
                Data
                </label>
            </Card.Body>
            </Card>
             {/* <CustomSpinner 
             show={loading}
             >
           </CustomSpinner>  */}
           </Fragment>
        );
    } else {
        return null;
    }
    
}