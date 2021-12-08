import React from 'react';
import {NavDropdown, Nav, Dropdown}  from 'react-bootstrap';
import './Navigation.css';

export default function DataNav(props) {

    return (
        <Nav
        > 
            <NavDropdown 
                
                title={props.title}
                disabled={props.disabled}
                >
                <NavDropdown as={Dropdown}
                    className="menudropdown"
                    title={"Export"} 
                >
                    <NavDropdown.Item 
                        className="menuitem"

                    >{"CSV"}
                    </NavDropdown.Item> 
                </NavDropdown> 
                <NavDropdown.Divider /> 
                <NavDropdown
                    className="menuitem"
                    title={"Import"}  
                >
                </NavDropdown>                  
            </NavDropdown> 
        </Nav>
    );
}