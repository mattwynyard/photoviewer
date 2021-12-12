import React, { Fragment, useState } from 'react';
import {NavDropdown, Nav}  from 'react-bootstrap';
import Exportmodal from '../modals/ExportModal.js'
import './Navigation.css';
import { downloadCSV, geojsonToWkt } from '../util.js';

export default function DataNav(props) {

    const [show, setshow] = useState(false)
    const handleClick = () => {
        setshow(true)
    }

    const download = (options) => {
        setshow(false);
        let exportData = [];
        const header = Object.keys(props.data[0]);
        const headerCopy = [...header]
        const latlngIndex = Object.keys(props.data[0]).findIndex(element => element === 'latlng');
        headerCopy.splice(latlngIndex, 1);
        headerCopy.shift();
        const geometryIndex = Object.keys(props.data[0]).findIndex(element => element === 'geometry');
        exportData.push([headerCopy]);
        props.data.forEach((row) => {
            let dataRow = Object.values(row);
            let geometry = dataRow[geometryIndex];
            const wkt = geojsonToWkt(geometry);
            let data = [...dataRow];
            data[geometryIndex] = wkt;
            data.splice(latlngIndex, 1);
            data.shift();
            exportData.push(data)
        });
        
          
          let csvContent = '';
          exportData.forEach((infoArray, index) => {
            let dataString = infoArray.join(options.delimeter);
            csvContent += index < exportData.length ? dataString + '\n' : dataString;
          });
        downloadCSV(csvContent, 'dowload.csv', 'text/csv;encoding:utf-8');
    }

    const closeModal = (e) => {
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