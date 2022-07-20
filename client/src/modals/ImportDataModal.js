import {Modal, Form, Button, Row}  from 'react-bootstrap';
import CSVReader from 'react-csv-reader';

export function ImportDataModal(props) {

    return (
        <Modal 
            show={props.props.show} 
            size={'md'} 
            centered={true} 
            onHide={props.props.hide}
            >
            <Modal.Header>
                <div>
                    <Modal.Title>Import Data</Modal.Title>
                </div>     
            </Modal.Header>
            <Modal.Body >
                <Form className='import-form'>
                    <Form.Group xs={7} md={8} as={Row}  controlId="import">
                        <Form.Label>Project</Form.Label>
                        <Form.Control 
                            type="text" 
                            placeholder="Enter Project Code"
                            onChange={(e) => props.setProject(e.currentTarget.value)}
                            //disabled={props.disabled}
                            value={props.project}>
                        </Form.Control>
                        <label className={"label-staged"} 
                                htmlFor="staged">
                                    {"Staged: "}
                            </label>
                            <input 
                                type={"checkbox"} 
                                id={"staged"} 
                                name={"staged"}
                                size='sm'
                                checked={props.isStaged} 
                                onChange={(e) => props.handleCheckboxChange(e)}
                            ></input>
                    </Form.Group>
                </Form>
                <CSVReader
                    cssClass="csv-reader-input"
                    label="Select CSV to import.  "
                    onFileLoaded={(data, fileInfo) => props.fileLoaded(data, fileInfo)}
                    inputStyle={{color: 'black'}}
                />
                <Button 
                    variant="primary" 
                    onClick={(e) => props.handleImport(e)}>
                        Import
                </Button>
            </Modal.Body>
        </Modal>
    );
}