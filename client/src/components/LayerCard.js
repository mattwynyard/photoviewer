import React from 'react';
import {Card}  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown.js';
import PriorityDropdown from './PriorityDropdown.js';

export default function LayerCard(props) {

    if (props.layer) {
        return (
            <Card className='layercard' >
            <Card.Header className='layercard-title'>{props.layer !== null ? props.layer.description: ''}</Card.Header>
            <Card.Body className='layercard-body'>
                <PriorityDropdown
                // layer={props.prioritylayer}
                title={props.prioritytitle}
                items={props.priorityitems}
                reverse={props.priorityreverse}
                filter={props.priorityfilter} 
                onClick={props.priorityonClick}
                />
                <ClassDropdown
                // layer={props.classlayer}
                title={props.classtitle}
                items={props.classitems}
                login={props.classlogin}
                filter={props.classfilter} 
                onClick={props.classonClick}
                />
                {/* <Roadlines
                className={"rating"}
                ref={this.roadLinesRef} >
                </Roadlines>  */}
            </Card.Body>
            </Card>
        );
    } else {
        return null;
    }
    
}