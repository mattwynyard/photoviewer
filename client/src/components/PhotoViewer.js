import React, { useState, useEffect } from 'react';
import {Modal, Button}  from 'react-bootstrap';
import {pad} from  './util.js'

function PhotoViewer(props, ref) {

    const [show, setShow] = useState(false);
    const [selectedGLMarker] = useState([props.marker]);
    const [amazon] = useState(props.amazon);

    return (
        <div>
            
        </div>
    );
}

export default PhotoViewer;