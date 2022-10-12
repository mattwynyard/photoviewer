import  { React, useState } from 'react';
import {Popup}  from 'react-leaflet';
import { Image }  from 'react-bootstrap';
import { useEffect } from 'react';

const CustomPopup = (props) => {

    const [prefix, setPrefix] = useState(null);
    
    useEffect(() => {  
        if (props.login === "asu" || props.login === "asm") {
            setPrefix(`${props.amazon}${props.data.inspection}/`);
          } else if (props.data.type === 'footpath') {
            if (props.data.asset.toLowerCase() === "kerb & channel") {
                setPrefix(`${props.amazon}kerbs/${props.data.inspection}/`);
            } else {
                setPrefix(`${props.amazon}footpaths/${props.data.inspection}/`);
            }
          } else {
            setPrefix(`${props.amazon}${props.data.inspection}/`);
          }
    }, [])

    if (props.photo) {
      return (
        <Popup className="popup" position={props.position} closeOnClick closeButton={false}>
          <div>
            <p className="faulttext">
            <b>{"ID: "}</b>{props.data.id}<br></br>
              <b>{"Type: "}</b>{props.data.fault}<br></br>
              <b>{"Location: "}</b>c{props.data.type === 'footpath' ? props.data.roadname: props.data.location}<br></br>
              <b>{"Date: "}</b>{props.data.datetime} 
            </p>
            <div>
              <Image className="thumbnail" 
                src={`${prefix}${props.photo}.jpg`}
                onClick={props.onClick} 
                thumbnail={true}
                onError={props.onError}
                >
              </Image >
            </div>          
          </div>
        </Popup>  
        );      
      } else {
        return null;
      }    
    }

    export { CustomPopup }
  