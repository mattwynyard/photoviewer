import React from 'react';
import {NavDropdown, Nav}  from 'react-bootstrap';
import './Navigation.css';

export default function DataNav(props) {

    return (
        <Nav
            fill={true} 
            justify={true}
        > 
            <NavDropdown 
                title={props.title}
                disabled={props.disabled}
                >
                <NavDropdown
                    className='nav-item' 
                    title={"Export"} 
                    drop={"end"} 
                >
                    <NavDropdown.Item 
                       className='nav-item' 

                    >{"CSV"}
                    </NavDropdown.Item> 
                </NavDropdown> 
                <NavDropdown.Divider /> 
                <NavDropdown
                
                    title={"Import"} 
                    drop={"right"}  
                >
                </NavDropdown>                  
            </NavDropdown> 
        </Nav>
    );
}