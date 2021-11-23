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
                title={props.prioritytitle}
                items={props.priorityitems}
                reverse={props.priorityreverse}
                filter={props.priorityfilter} 
                onClick={props.priorityonClick}
                />
                <ClassDropdown
                title={props.classtitle}
                items={props.classitems}
                login={props.classlogin}
                filter={props.classfilter} 
                onClick={props.classonClick}
                />
            </Card.Body>
            </Card>
        );
    } else {
        return null;
    }
    
}