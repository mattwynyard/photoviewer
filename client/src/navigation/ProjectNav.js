
import React, {Fragment} from 'react';
import {Nav, NavDropdown, Dropdown}  from 'react-bootstrap';
import './Navigation.css';

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
    <NavDropdown as={Dropdown}
        className="menudropdown"
        title={props.title}
        disabled={props.disabled}
        drop="down"
        >
        {props.projects.map((value, index) => 
        <Fragment key={`${value.code}`}>
          <Dropdown.Item
              className="menuitem"
              key={`${value.code}`}
              index={index}
              type={props.type}
              disabled={isDisabled(props.type)}
              title={JSON.stringify(value)}
              onClick={props.layers.code !== value.code ? props.onClick : null}
              >
              {value.description + " " + value.date}
          </Dropdown.Item>
          < NavDropdown.Divider />
        </Fragment>               
        )}
    </NavDropdown> 
  );     
}

export default function ProjectNav(props) { 
  //console.log(props)
  if (props.projects) {
    if (props.login.user === "admin") {
      return (
        <Nav>       
          <NavDropdown className="navdropdown" title="Tools" id="basic-nav-dropdown">
            <NavDropdown.Item  
              className="adminitem"
              id="user" 
              title="Add New User" 
              onClick={props.onClick}>
              Manage User     
            </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item
              title="Add New Project" 
              className="adminitem"
              id="project"  
              onClick={props.onClick}>
              Manage Projects 
              </NavDropdown.Item>
              <NavDropdown.Divider /> 
            <NavDropdown.Item  
              title="Import" 
              id="import"
              className="adminitem" 
              onClick={props.onClick}>
              Import Data    
            </NavDropdown.Item>
            <NavDropdown.Divider />
          </NavDropdown>
        </Nav>
      );
      
    } else {
      return (
        <Nav
          >          
          <NavDropdown 
            title="Projects" 
            id="basic-nav-dropdown"
            disabled={props.disabled}
            >
            <CustomMenu
              key="1"
              title="Add Roading Layer"  
              type={'road'}
              disabled ={props.projects.road.length === 0 ? true: false} 
              projects={props.projects.road} 
              layers={props.layers} 
              onClick={props.onClick}
              />
              < NavDropdown.Divider /> 
            <CustomMenu 
              key="2"
              title="Add Footpath Layer" 
              type={'footpath'} 
              projects={props.projects.footpath}
              layers={props.layers} 
              disabled ={props.projects.footpath.length === 0 ? true: false} 
              onClick={props.onClick}
              />
            <NavDropdown.Divider />
            <CustomMenu
              key="3" 
              title="Remove Layer" 
              type={'remove'} 
              projects={props.layers}
              layers={{code: null}}
              disabled ={props.layers.length === 0 ? true: false} 
              onClick={props.onClick}
              />
          </NavDropdown>
        </Nav>
      );     
    }
    
  } else {
    return (
      <Nav>          
        <NavDropdown 
          title="Projects" 
          id="basic-nav-dropdown">
        </NavDropdown>        
    </Nav>
    );
  }
}
