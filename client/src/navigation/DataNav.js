import React, { Fragment, useState } from 'react';
import {NavDropdown, Nav}  from 'react-bootstrap';
import Exportmodal from '../modals/ExportModal.js'
import './Navigation.css';

export default function DataNav(props) {

    const [show, setshow] = useState(false)

    const handleClick = () => {
        setshow(true)
    }

    const download = (options) => {

    }

    const closeModal = (e) => {
        console.log("close")
        setshow(false)
    }

    return (
        <Fragment>
        <Nav
        > 
            <NavDropdown 
                title={props.title}
                disabled={props.disabled}
                >
                <NavDropdown.Item
                    className="menudropdown"
                    onClick={handleClick}
                >{"Export"}
                </NavDropdown.Item> 
                <NavDropdown.Divider /> 
                <NavDropdown.Item
                    className="menuitem"
                    disabled={true}
                >{"Import"}
                </NavDropdown.Item>                  
            </NavDropdown> 
        </Nav>
        <Exportmodal
            show={show}
            download={download}
            closeModal={closeModal}
            />
        </Fragment>
    );
}