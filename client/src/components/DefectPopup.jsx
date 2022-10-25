import  { React, useState } from 'react';
import { Popup }  from 'react-leaflet';
import { Image }  from 'react-bootstrap';
import { useEffect } from 'react';


//not working yet
const Thumbnail = ({amazon, data, login, photo, onError, onClick}) => {
  if (login === "asu" || login === "asm") {
    return (<Image 
              className="thumbnail" 
              src={`${amazon}${data.inspection}/${photo}.jpg`}
              onClick={onClick} 
              thumbnail={true}
              onError={onError}
                >
              </Image >
            );
      }
  if ((data.type === 'footpath')) {
    if (data.asset.toLowerCase() === "kerb & channel") {
      return (
        <Image 
          className="thumbnail" 
          src={`${amazon}kerbs/${data.inspection}/${photo}.jpg`}
          onClick={onClick} 
          thumbnail={true}
          onError={onError}
          >
        </Image >
      );
    } else {
      return (
        <Image 
          className="thumbnail" 
          src={`${amazon}footpaths/${data.inspection}/${photo}.jpg`}
          onClick={onClick} 
          thumbnail={true}
          onError={onError}
          >
        </Image >
      );
    }
  }
  return (
    <Image 
      className="thumbnail" 
      src={`${amazon}/${photo}.jpg`}
      onClick={onClick} 
      thumbnail={true}
      onError={onError}
      >
    </Image >
  );
}

const DefectPopup = (props) => {

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
            setPrefix(`${props.amazon}`);
          }
    }, [])

    if (props.photo) {
      return (
        <Popup className="popup" position={props.position} closeOnClick closeButton={false}>
          <div>
            <p className="faulttext">
            <b>{"ID: "}</b>{props.data.id}<br></br>
              <b>{"Type: "}</b>{props.data.fault}<br></br>
              <b>{"Location: "}</b>{props.data.type === 'footpath' ? props.data.location: props.data.roadname}<br></br>
              <b>{"Date: "}</b>{props.data.datetime} 
            </p>
            <div>
              {/* <Thumbnail
                amazon={props.amazon}
                data={props.data}
                login={props.login}
                onError={props.onError}
                onClick={props.onClick}
                photo={props.photo}
              /> */}
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

    export { DefectPopup }
  