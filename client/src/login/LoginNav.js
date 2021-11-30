import React from 'react';
import {Nav, NavDropdown}  from 'react-bootstrap';

export default function LoginNav(props) {

    if (props.user === 'Login') {
        return (
            <Nav className="ml-auto">
                <Nav.Link  id="Login" onClick={props.onClick}>{props.user} </Nav.Link>
            </Nav>);
    } else {
        return (
            <Nav className="ml-auto">
                <NavDropdown 
                    className="navdropdown" 
                    title={props.user} 
                    id="basic-nav-dropdown">
                    <NavDropdown.Item 
                        className="navdropdownitem" 
                        onClick={props.onClick}
                        >Logout
                    </NavDropdown.Item>
                </NavDropdown>
            </Nav>
        );
    }
}