import {Modal, Dropdown, Form, Button}  from 'react-bootstrap';

export function DeleteProjectModal(props) {
    return (
        <Modal 
        show={props.props.show} 
        size={'lg'} 
        centered={true}
        onHide={() => props.handleHide()}
        >
        <Modal.Header>
            <Modal.Title>Delete Project</Modal.Title>  
            <Dropdown className="dropdownproject">
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    {props.props.mode}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                <Dropdown.Item
                    onClick={(e) => props.setMode("Insert")}
                    >
                    Insert
                </Dropdown.Item>
                <Dropdown.Item
                    onClick={(e) => props.setMode("Update")}
                    >
                    Update
                </Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>	
            
        </Modal.Header>
        <Modal.Body >
            <Form className="delete-project-form">
                <Form.Label className="label">Project Code:</Form.Label>
                <Form.Control 
                    type="text" 
                    size='sm'
                    placeholder="Enter project code" 
                    onChange={(e) => props.setProject(e.currentTarget.value)}
                >
                </Form.Control>
                <Form.Label className="label">Delete Project Data Only:</Form.Label>
                <Form.Control 
                    className="checkbox" 
                    type="checkbox" 
                    size='sm'
                    checked={props.deleteProjectDataOnly}
                    onChange={(e) => props.deleteProjectDataOnly ? props.setDeleteProjectDataOnly(false) : props.setDeleteProjectDataOnly(true)}
                >
                </Form.Control>
            
            </Form>
            <Button 
                variant="primary" 
                onClick={(e) => props.updateProject('delete')}>
                Delete
            </Button>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
    </Modal>
    );
}