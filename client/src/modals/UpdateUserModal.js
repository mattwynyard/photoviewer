import {Modal, Dropdown, Form, Button}  from 'react-bootstrap';

export function UpdateUserModal(props) {

    return (
    <Modal 
        show={props.props.show} 
        size={'md'} 
        centered={true}
        onHide={props.props.hide}
        >
        <Modal.Header>
            <Modal.Title>Update User</Modal.Title>
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
                <Dropdown.Item
                    onClick={(e) => props.setMode("Delete")}
                    >
                    Delete
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
            <Form.Group controlId="formBasicPassword">
                <Form.Label>Password</Form.Label>           
                <Form.Control 
                type="password" 
                placeholder="Password" 
                onChange={(e) => props.setPassword(e.currentTarget.value)} 
                >
                </Form.Control>
            </Form.Group>
            <Button 
                variant="primary" 
                onClick={(e) => props.updateUser('update')}
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