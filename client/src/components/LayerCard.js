import React from 'react';
import {Card}  from 'react-bootstrap';
import ClassDropdown from './ClassDropdown.js';
import PriorityDropdown from './PriorityDropdown.js';

export default function LayerCard(props) {

    // prioritylayer={this.state.activeLayer}
    //             prioritytitle={this.state.priorityMode}
    //             priorityitems={this.state.priorities}
    //             prioritylogin={this.state.login}
    //             priorityreverse={this.state.reverse}
    //             priorityfilter={this.state.filterPriorities} 
    //             priorityonClick={this.updatePriority}
    //             cardlayer={this.state.activeLayer}
    //             cardtitle={'RM Class'}
    //             carditems={this.state.rmclass}
    //             cardlogin={this.state.login}
    //             cardfilter={this.state.filterRMClass} 
    //             cardonClick={this.updateRMClass}
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