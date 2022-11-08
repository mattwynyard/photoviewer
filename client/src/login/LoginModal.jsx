import React, { useState } from 'react'
import {Modal, Button, Form}  from 'react-bootstrap';

export default function LoginModal(props) {

    const [user, setUser] = useState(null)
    const [password, setPassword] = useState(null)

    const submitHandler = (e) => {
        e.preventDefault();
        props.onClick(user, password);
    }

    const changeUser = (e) => {
        setUser(e.target.value)
    }

    const changePassword = (e) => {
        setPassword(e.target.value)
    }

  return (
    <Modal show={props.show} size={'sm'} centered={true}>
        <Modal.Header>
            <Modal.Title><img src="padlock.png" alt="padlock" width="42" height="42"/> Login </Modal.Title>
        </Modal.Header>
        <Modal.Body >	
        <Form>
            <Form.Group controlId="userName">
            <Form.Label>Username</Form.Label>
            <Form.Control 
                type="text" 
                placeholder="Enter username"
                onChange={changeUser}
                />
            </Form.Group>
            <Form.Text className= "message">{props.error}</Form.Text>
            <Form.Group controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>           
            <Form.Control 
                type="password" 
                placeholder="Password"
                onChange={changePassword}
            />
            </Form.Group>
            <Button 
                variant="primary" 
                type="submit" 
                onClick={submitHandler}
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