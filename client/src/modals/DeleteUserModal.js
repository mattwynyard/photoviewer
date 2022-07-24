import {Modal, Dropdown, Form, Button}  from 'react-bootstrap';

export function DeleteUserModal(props) {
    return (
        <Modal 
        show={props.props.show} 
        size={'md'} 
        centered={true}
        onHide={props.props.hide}
        >
        <Modal.Header>
            <Modal.Title>Delete User</Modal.Title>
            <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                    {props.props.mode}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                <Dropdown.Item
                    onClick={(e) => props.setMode("Insert")}
                    >
                    Insert
                </Dropdown.Item>
                </Dropdown.Menu>
                </Dropdown>
        </Modal.Header>
        <Modal.Body >	
            <Form>
            <Form.Group controlId="userName">
                <Form.Label>Username</Form.Label>
                <Form.Control 
                type="text" 
                placeholder="Enter username" 
                onChange={(e) => props.setClient(e.currentTarget.value)}
                >
                </Form.Control>
            </Form.Group>
            <Form.Text className= "message"></Form.Text>
            <Button 
                variant="primary" 
                onClick={(e) => props.updateUser('delete')}
                >
                Submit
            </Button>
            </Form>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
    </Modal>
    );
}