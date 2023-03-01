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
        const exportData = [];
        const header = [...Object.keys(props.data[0])];
        const latlngIndex = Object.keys(props.data[0]).findIndex(element => element === 'latlng');
        header.splice(latlngIndex, 1);
        const geometryIndex = Object.keys(props.data[0]).findIndex(element => element === 'geometry');
        
        if (!options.geometry) {
            header.splice(geometryIndex - 1, 1);
        }
        const photoIndex = Object.keys(props.data[0]).findIndex(element => element === 'photo');  
        header.shift();
        exportData.push(header);
        props.data.forEach((row) => {
            let dataRow = Object.values(row);
            let geometry = dataRow[geometryIndex];
            let wkt = null;
            let data = [...dataRow];
            if (options.geometry) {
                wkt = geojsonToWkt(geometry);
                data[geometryIndex] = wkt;
                data.splice(latlngIndex, 1);
            } else {
                data.splice(latlngIndex, 1);
                data.splice(geometryIndex - 1, 1);
            }
            let photo = data[photoIndex];
            data[photoIndex] = props.layers[0].amazon + photo + ".jpg"
            data.shift();
            exportData.push(data)
        });  
          let csvContent = '';
          exportData.forEach((infoArray, index) => {
            let dataString = infoArray.join(options.delimeter);
            csvContent += index < exportData.length ? dataString + '\n' : dataString;
          });
          const fileName = props.layers[0].description + "-" + props.layers[0].date;
        downloadCSV(csvContent, fileName, 'text/csv;encoding:utf-8');
    }

    const closeModal = () => {
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