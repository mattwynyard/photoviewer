import React from 'react';
import {Nav, NavDropdown}  from 'react-bootstrap';

const CustomMenu = (props) => {

  const isDisabled = (type) => {
    if (props.layers.length === 0) {
      if (type === "remove") {
        return true;
      } else {
        return false;
      } 
    } else {
      if (type === "remove") {
      return false;
      } else {
        return true;
      }
    }
  }

  return ( 
    <NavDropdown 
        title={props.title}
        className="navdropdownitem"
        disabled={props.disabled}
        drop="right">
        {props.projects.map((value, index) =>  
        <NavDropdown.Item 
            className='nav-item'
            key={`${value.code}`}
            index={index}
            type={props.type}
            disabled={isDisabled(props.type)}
            title={JSON.stringify(value)}
            onClick={props.layers.code !== value.code ? props.onClick : null}
            >
            {value.description + " " + value.date}
        </NavDropdown.Item>             
        )}
    </NavDropdown> 
  );     
}

export default function ProjectNav(props) { 
  if (props.projects) {
    return (
      <Nav>          
      <NavDropdown 
          className="navdropdown" 
          title="Projects" 
          id="basic-nav-dropdown"
          disabled={props.disabled}
          >
        <CustomMenu 
          title="Add Roading Layer" 
          className="navdropdownitem" 
          type={'road'}
          disabled ={props.projects.road.length === 0 ? true: false} 
          projects={props.projects.road} 
          layers={props.layers} 
          onClick={props.onClick}
          />
          <NavDropdown.Divider /> 
        <CustomMenu 
          title="Add Footpath Layer" 
          className="navdropdownitem" 
          type={'footpath'} 
          projects={props.projects.footpath}
          layers={props.layers} 
          disabled ={props.projects.footpath.length === 0 ? true: false} 
          onClick={props.onClick}
          />
          <NavDropdown.Divider />
        <CustomMenu 
          title="Remove Layer" 
          className="navdropdownitem"
          type={'remove'} 
          projects={props.layers}
          layers={{code: null}}
          disabled ={props.layers.length === 0 ? true: false} 
          onClick={props.onClick}
          />
        </NavDropdown>
      </Nav>
    );     
  } else {
    return (
      <Nav>          
      <NavDropdown 
        className="navdropdown" 
        title="Projects" 
        id="basic-nav-dropdown">
      </NavDropdown>        
    </Nav>
    );
  }
}
