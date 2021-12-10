import { React, useState, useReducer, useEffect} from 'react';
import {Modal, Button}  from 'react-bootstrap';
import "./ExportModal.css";

export default function ExportModal(props) {

    const types  = ["CSV (*.csv)", "geojson"];
    const delimeter = ["Comma", "Tab", "Vertical Bar"];
    const geometry = ["None", "WKT"];

    const [exportOptions, setExportOptions] = useState({});
    const AddFile = types.map(AddFile => AddFile);
    const AddDelimeter = delimeter.map(AddDelimeter => AddDelimeter);
    const AddGeometry = geometry.map(AddGeometry => AddGeometry);

    useEffect(() => {
        setExportOptions({file: "csv", delimeter: ",", geometry: null})
    }, []);

    const download = (e) => {
        e.preventDefault();
        props.download(exportOptions)
    }

    const handleChange = (value) => {
        if (value.file) {
            if (value.file === "CSV (*.csv)") {
                setExportOptions({file: 'csv', delimeter: exportOptions.delimeter, geometry: exportOptions.geometry});
                
            } else if (value.file === "geojson") {
                setExportOptions({file: 'geojson', delimeter: exportOptions.delimeter, geometry: exportOptions.geometry})
            }
        } else if (value.delimeter) {
            
            switch (value.delimeter) {
                case 'Comma':
                    setExportOptions({file: exportOptions.file, delimeter: ',', geometry: exportOptions.geometry});
                    break;
                case 'Tab':
                    setExportOptions({file: exportOptions.file, delimeter: '\t', geometry: exportOptions.geometry});
                    break
                case 'Vertical Bar':
                    setExportOptions({file: exportOptions.file, delimeter: '|', geometry: exportOptions.geometry});
                    break;
                default:
                    break;
            }
        } else if (value.geometry) {
            switch (value.geometry) {
                case 'None':
                    setExportOptions({file: exportOptions.file, delimeter: exportOptions.delimeter, geometry: null});
                    break;
                case 'WKT':
                    setExportOptions({file: exportOptions.file, delimeter: exportOptions.delimeter, geometry: 'wkt'});
                    break;
                default:
                    break;
            }
        } else {
            console.log(value)
        }
    }


    return (
      <Modal className="exportmodal"
        show={props.show} 
        size={'md'} 
        centered={true}
        onHide={props.closeModal}   
        >
        <Modal.Header>
          <Modal.Title><h2>Export</h2></Modal.Title>
        </Modal.Header>
        <Modal.Body >
            <div className="container">
                <label 
                    className={"label-filetype"}
                    htmlFor="filetype"
                >{"File Type:"}
                </label>
                <label
                    className={"label-delimeter"}
                    htmlFor="delimeter"
                >{"Delimeter Type:"}
                </label>
                <label
                    className={"label-geometry"}
                    htmlFor="geometry"
                >{"Geometry Type:"}
                </label>
                <select
                    className={"select-filetype"}
                    name="filetype"
                    id="filetype"
                    onChange={(e) => handleChange({file: types[e.target.value]})}
                >
                {
                    AddFile.map((ftype, key) => <option key={key} value={key}>{ftype}</option>)
                }
                </select>
                <select 
                    className={"select-delimeter"}
                    name="delimeter"
                    id="delimeter"
                    onChange={(e) => handleChange({delimeter: delimeter[e.target.value]})}
                >
                {
                    AddDelimeter.map((dtype, key) => <option key={key} value={key}>{dtype}</option>)
                }
                </select>
                <select 
                    className={"select-geometry"}
                    name="geometry"
                    id="geometry"
                    onChange={(e) => handleChange({geometry: geometry[e.target.value]})}
                >
                {
                    AddGeometry.map((dtype, key) => <option key={key} value={key}>{dtype}</option>)
                }
                </select>
            </div>		
		</Modal.Body>
        <Modal.Footer>
          <Button 
            variant="outline-dark" 
            type="button" 
            size='sm'
            id={props.id}
            onClick={(e) => download(e)}
            >
            {"Download"}
          </Button>
        </Modal.Footer>
      </Modal>
    );
}