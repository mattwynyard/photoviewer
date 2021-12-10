import React, { Fragment, useState } from 'react';
import {NavDropdown, Nav}  from 'react-bootstrap';
import Exportmodal from '../modals/ExportModal.js'
import './Navigation.css';
import { downloadCSV } from '../util.js';

export default function DataNav(props) {

    const [show, setshow] = useState(false)

    const handleClick = () => {
        setshow(true)
    }

    const download = (options) => {
        setshow(false);
        console.log(options);
        var data = [
            ['name1', 'city1', 'some other info'],
            ['name2', 'city2', 'more info']
          ];
          
          let csvContent = '';
          data.forEach(function(infoArray, index) {
            let dataString = infoArray.join(options.delimeter);
            csvContent += index < data.length ? dataString + '\n' : dataString;
          });
        downloadCSV(csvContent, 'dowload.csv', 'text/csv;encoding:utf-8');
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