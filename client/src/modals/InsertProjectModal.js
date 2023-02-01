import React from 'react';
import {Modal, Dropdown, Form, Button, Container, Col}  from 'react-bootstrap';

export function InsertProjectModal(props) {

    return (
        <Modal 
            show={props.props.show} 
            size={'lg'} 
            centered={true}
            onHide={() => props.handleHide()}
            >
            <Modal.Header>
                <div>
                    <Modal.Title>Add New Project</Modal.Title>
                </div>     
                <Dropdown className="dropdownproject">
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                        {props.props.mode}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item
                            onClick={() => props.setMode("Delete")}
                            >
                            Delete
                        </Dropdown.Item>
                        <Dropdown.Item
                            onClick={() => props.setMode("Update")}
                            >
                            Update
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>	
            </Modal.Header>
            <Modal.Body >
                <Form>
                <Container className="container">
                        <Form.Group xs={6} md={8} as={Col} controlId="code">
                            <Form.Label className="label">Project Code:</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    size='sm'
                                    placeholder="project code eg ASU_0921" 
                                    onChange={(e) => props.setProject(e.currentTarget.value)}
                                >
                                </Form.Control>
                            <Form.Label className="label">Client:</Form.Label>           
                            <Form.Control 
                                type="text" 
                                size='sm'
                                placeholder="client login code eg: asu" 
                                onChange={(e) => props.setClient(e.currentTarget.value)}
                            >
                            </Form.Control>
                            <Form.Label className="label">Description:</Form.Label>
                            <Form.Control 
                                type="text" 
                                size='sm'
                                placeholder="Enter project description" 
                                onChange={(e) => props.setDescription(e.currentTarget.value)}
                            >
                            </Form.Control>
                            <Form.Label className="label">Date:</Form.Label>
                            <Form.Control 
                                type="text" 
                                size='sm'
                                placeholder="Enter date (MMM yyyy)" 
                                onChange={(e) => props.setDate(e.currentTarget.value)}
                            >
                            </Form.Control>
                            <Form.Label className="label">Surface:</Form.Label>
                            <Form.Control 
                                type="text" 
                                size='sm'
                                placeholder="Enter surface (road/footpath)" 
                                onChange={(e) => props.setSurface(e.currentTarget.value)}
                            >
                            </Form.Control>
                            <Form.Label className="label">Amazon URL:</Form.Label>
                            <Form.Control 
                                type="text" 
                                size='sm'
                                placeholder="Enter amazon url" 
                                onChange={(e) => props.setAmazon(e.currentTarget.value)}
                            >
                            </Form.Control>
                            <Form.Label className="label">Territorial Authority Code:</Form.Label>
                            <Form.Control 
                                type="text" 
                                size='sm'
                                placeholder="TA code" 
                                onChange={(e) => props.setTAcode(e.currentTarget.value)}
                            >
                            </Form.Control>
                        </Form.Group>                                   
                        <Form.Group xs={6} md={8} as={Col} controlId="public">
                            <Form.Label className="label">Public:</Form.Label>
                                <Form.Control 
                                    className="checkbox"
                                    type="checkbox" 
                                    size='sm'
                                    checked={props.isPublic} 
                                    onChange={(e) => e.currentTarget.checked ? props.setIsPublic(true) : props.setIsPublic(false)}
                                >
                                </Form.Control>        
                        <Form.Label className="label">Reverse:</Form.Label>
                            <Form.Control
                                className="checkbox" 
                                type="checkbox" 
                                size='sm'
                                checked={props.isReverse}
                                onChange={(e) => e.currentTarget.checked ? props.setIsReverse(true) : props.setIsReverse(false)}
                            >
                            </Form.Control>
                            <Form.Label className="label">Priority:</Form.Label>
                                <Form.Control
                                    className="checkbox" 
                                    type="checkbox" 
                                    size='sm'
                                    checked={props.isPriority}
                                    onChange={(e) => e.currentTarget.checked ? props.setIsPriority(true) : props.setIsPriority(false)}
                                >
                                </Form.Control>
                        <Form.Label className="label">Video:</Form.Label>
                            <Form.Control
                                className="checkbox" 
                                type="checkbox" 
                                size='sm'
                                checked={props.hasVideo}
                                onChange={(e) => e.currentTarget.checked ? props.setHasVideo(true) : props.setHasVideo(false)}
                            >
                            </Form.Control>
                        <Form.Label className="label">RAMM:</Form.Label>
                            <Form.Control
                                className="checkbox" 
                                type="checkbox" 
                                size='sm'
                                checked={props.hasRamm}
                                onChange={(e) => e.currentTarget.checked ? props.setHasRamm(true) : props.setHasRamm(false)}
                            >
                            </Form.Control>
                        <Form.Label className="label">Centreline:</Form.Label>
                            <Form.Control
                                className="checkbox" 
                                type="checkbox" 
                                size='sm'
                                checked={props.hasCentreline}
                                onChange={(e) => e.currentTarget.checked ? props.setHasCentreline(true) : props.setHasCentreline(false)}
                            >
                            </Form.Control>
                        <Form.Label className="label">RM Class:</Form.Label>
                            <Form.Control
                                className="checkbox" 
                                type="checkbox" 
                                size='sm'
                                checked={props.hasRMClass}
                                onChange={(e) => e.currentTarget.checked ? props.setHasRMClass(true) : props.setHasRMClass(false)}
                            >
                            </Form.Control>
                        <Button 
                            variant="primary" 
                            onClick={() => props.updateProject('insert')}
                        >
                        Submit
                    </Button>
                    </Form.Group>     
                </Container>
                </Form>                         
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
        );
}

