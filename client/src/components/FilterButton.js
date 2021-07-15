import React from 'react';
import {Button}  from 'react-bootstrap';

const FilterButton =React.forwardRef((props, ref) => {

    if(props.layer) {
        return (
          <Button
            ref={ref}
            className="applyButton" 
            variant="light" 
            size="sm"
            onClick={props.onClick}
            >Apply Filter
          </Button>
        );
      } else {
        return null;
      } 
});

export {FilterButton}
