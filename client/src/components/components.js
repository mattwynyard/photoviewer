import React from 'react';

import {Spinner, Image, NavDropdown}  from 'react-bootstrap';
import {Popup}  from 'react-leaflet';

const CustomMenu = (props) => {
    if (typeof props.projects === 'undefined' || props.projects.length === 0) {
        return (  
          null  
          );
    } else {  
      return (        
        <NavDropdown title={props.title} className="navdropdownitem" drop="right">
          {props.projects.map((value, index) =>  
              <NavDropdown.Item className="navdropdownitem"
              key={`${index}`}
              index={index}
              title={value.code}
              code={value.code}
              onClick={props.onClick}>
              {value.description + " " + value.date}
            </NavDropdown.Item>             
          )}
          <NavDropdown.Divider />
        </NavDropdown>
        );
    }
  }

const CustomPopup = (props) => {
    let src = null;
    if (props.login === "asu") {
      src = `${props.amazon}${props.data.inspection}/${props.data.photo}.jpg` ;
    } else {
      src = props.src;
    }

    let location = props.data.location;
    if (props.data.type === "footpath") {
      location = props.data.roadname;
    }
    return (
      <Popup className="popup" position={props.position}>
        <div>
          <p className="faulttext">
          <b>{"ID: "}</b>{props.data.id}<br></br>
            <b>{"Type: "}</b>{props.data.fault}<br></br>
            <b>{"Location: "}</b>{location}<br></br>
            <b>{"Date: "}</b>{props.data.datetime} 
          </p>
          <div>
            <Image className="thumbnail" 
              src={src}
              onClick={props.onClick} 
              thumbnail={true}>
            </Image >
          </div>          
        </div>
      </Popup>  
    );      
  }

const CustomSpinner = (props) => {
    if (props.show) {
      return(
        <div className="spinner">
          <Spinner
          animation="border"
          variant="secondary"
          size="lg"
          role="status"
          ></Spinner>
          <p>Loading...</p>
        </div>
      );
    } else {
      return(
        null
      );    
    }  
  }

  const CustomLink = (props) => {
    if (props.endpoint === "/data") {
      return (null);
    }
    if (props.activeLayer === null) {
      return(null);
    } else {
      return (
        <Link 
          className="dropdownlink" 
          to={{
            pathname: props.endpoint,
            login: props.login,
            user: props.user,
            data: props.data,
            project: props.activeLayer
          }}
          style={{ textDecoration: 'none' }}
          >{props.label}
        </Link>
      );
    }      
  }

  export {CustomSpinner, CustomPopup, CustomMenu}