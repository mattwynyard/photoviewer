import React from 'react';
import { Link } from "react-router-dom";
import {Spinner, Image, NavDropdown, Nav}  from 'react-bootstrap';
import {Popup}  from 'react-leaflet';

const LayerNav = (props) => { 
  if (props.user === 'admin') {
    return (
      <Nav>       
      <NavDropdown className="navdropdown" title="Tools" id="basic-nav-dropdown">
        <NavDropdown.Item  
          className="adminitem" 
          title="Add New User" 
          onClick={props.addUser}>
          Manage User     
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item
          title="Add New Project" 
          className="adminitem" 
          onClick={props.addProject}>
          Manage Projects 
          </NavDropdown.Item>
          <NavDropdown.Divider /> 
        <NavDropdown.Item  
          title="Import" 
          className="adminitem" 
          projects={props.layers} 
          admin={props.admin}
          onClick={props.importData}>
          Import Data    
        </NavDropdown.Item>
        <NavDropdown.Divider />
      </NavDropdown>
    </Nav>
    );
  } else {
    if (props.layers.length > 0) {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Projects" id="basic-nav-dropdown">
            <CustomMenu 
              title="Add Roading Layer" 
              className="navdropdownitem" 
              type={'road'} 
              projects={props.projects.road} 
              onClick={props.loadLayer}/>
              <NavDropdown.Divider />
            <CustomMenu 
              title="Add Footpath Layer" 
              className="navdropdownitem" 
              type={'footpath'} 
              projects={props.projects.footpath} 
              onClick={props.loadFootpathLayer}/>
              <NavDropdown.Divider />
            <CustomMenu 
              title="Remove Layer" 
              className="navdropdownitem" 
              projects={props.layers} 
              onClick={props.removeLayer}/>
          </NavDropdown>
        </Nav>
        );     
    } else {
      return (
        <Nav>          
        <NavDropdown className="navdropdown" title="Projects" id="basic-nav-dropdown">
          <CustomMenu 
            title="Add Roading Layer" 
            className="navdropdownitem" 
            type={'road'} 
            projects={props.projects.road} 
            layers={props.layers} 
            onClick={props.loadRoadLayer}/>
          <CustomMenu 
            title="Add Footpath Layer" 
            className="navdropdownitem" 
            type={'footpath'}
            projects={props.projects.footpath} 
            layers={props.layers} 
            onClick={props.loadFootpathLayer}/>
        </NavDropdown>        
      </Nav>
      );
    }
  }      
}

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
    if (!props.project) {
      return(null);
    } else {
      return (
        <Link 
          className="dropdownlink" 
          to={{
            pathname: props.endpoint,
            data: props.data,
            mode: props.project.surface,
          }}
          style={{ textDecoration: 'none' }}
          >{props.label}
        </Link>
      );
    }      
  }

  export {CustomSpinner, CustomLink, CustomPopup, CustomMenu, LayerNav}
