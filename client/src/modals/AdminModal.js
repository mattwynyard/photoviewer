import React, { useState} from 'react';
import {Modal, Dropdown, Form, Button, Row, Col, DropdownButton, Container}  from 'react-bootstrap';
import CSVReader from 'react-csv-reader';

export default function AdminModal(props) {

    
    const [user, setUser] = useState(null);
    const [password, setPassword] = useState(null);
    const [project, setProject] = useState(null);
    const [description, setDescription] = useState(null);
    const [date, setDate] = useState(null);
    const [surface, setSurface] = useState(null);
    const [ta, setTA] = useState(null);
    const [amazon, setAmazon] = useState(null);
    const [isPriority, setIsPriority] = useState(true);
    const [isReverse, setIsReverse] = useState(true);
    const [isPublic, setIsPublic] = useState(false);
    const [data, setData] = useState(null);

    const sendData = async (project, data, endpoint) => {
        if (props.login.user !== "Login") {
          await fetch('https://' + props.login.host + endpoint, {
          method: 'POST',
          headers: {
            "authorization": props.login.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: props.login.user,
            data: data,
            project: project
          })
          }).then(async (response) => {
            if(!response.ok) {
              throw new Error(response.status);
            } else {
              const result = await response.json();
              console.log(result)     
            }
          }).catch((error) => {
            console.log("error: " + error);
            alert(error);
            return;
          });   
        }    
      }

    const fileLoaded = (data, info) => {
        setData(data)
    }

    const handleImport = (e) => {
        console.log(props)
        if (!project) alert("No project specified")
    }

    const updateUser = async (type) => {
        if (props.login.user === "admin") {
          await fetch('https://' + props.login.host + '/user', {
            method: 'POST',
            headers: {
              "authorization": props.login.token,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: type,
              user: props.login.user,
              client: user,
              password: password
            })
          }).then(async (response) => {
            const body = await response.json();
            console.log(body)
            if (body.error != null) {
              alert(`Error: ${body.error}\n`);
            } else {
              if (body.success) {
                  if (body.type === 'insert') {
                    alert("User: " + user + " created")
                  } else if (body.type === 'delete') {
                    alert("User: " + user + " deleted")
                  } else if (body.type === 'update') {
                    alert("User: " + user + " updated")
                  }
              } else {
                if (body.type === 'insert') {
                    alert("User: " + user + " failed to insert")
                  } else if (body.type === 'delete') {
                    alert("User: " + user + " failed to delete")
                  } else if (body.type === 'update') {
                    alert("User: " + user + " failed to update")
                  }
                
              }
            }   
          })
          .catch((error) => {
            console.log("error: " + error);
            alert(error);
            return;
          });
        }
      }

      const updateProject = async (type, parameters) => {
        if (props.login.user !== "admin") {
          await fetch('https://' + this.state.host + '/project', {
            method: 'POST',
            headers: {
              "authorization": this.state.token,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user: props.login.user,
              type: type,
              code: project,
              client: user,
              description: description,
              date: date,
              tacode: ta,
              amazon: amazon,
              surface: surface
            })
          }).then(async (response) => {
            const body = await response.json();
            if (body.error != null) {
              alert(`Error: ${body.error}\n`);
            } else {
              if (body.success) {
                alert("Project: " + project + " created")
              } else {
                alert("Project: " + project + "  failed to create")
              }
            }   
          })
          .catch((error) => {
            console.log("error: " + error);
            alert(error);
            return;
          });
        }
      }
    

        if (props.table === 'user') {
            if(props.mode === 'Insert') {
                return (
                    <Modal 
                        show={props.show} 
                        size={'md'} 
                        centered={true}
                        onHide={props.hide}
                        >
                    <Modal.Header>
                        <Modal.Title>Add New User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
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
                            onChange={(e) => setUser(e.currentTarget.value)}
                            >
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>           
                            <Form.Control 
                            type="password" 
                            placeholder="Password"
                            onChange={(e) => setPassword(e.currentTarget.value)} 
                            ></Form.Control>
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            onClick={(e) => updateUser('insert', user, password)}
                            >
                            Submit
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else if (props.mode === "Delete") {
                return (
                    <Modal 
                    show={props.show} 
                    size={'md'} 
                    centered={true}
                    onHide={props.hide}
                    >
                    <Modal.Header>
                        <Modal.Title>Delete User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
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
                            onChange={(e) => setUser(e.currentTarget.value)}
                            >
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Button 
                            variant="primary" 
                            onClick={(e) => updateUser('delete')}
                            >
                            Submit
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else { //Update
               return (
                    <Modal 
                    show={props.show} 
                    size={'md'} 
                    centered={true}
                    onHide={props.hide}
                    >
                    <Modal.Header>
                        <Modal.Title>Update User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
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
                            onChange={(e) => setUser(e.currentTarget.value)}
                            >
                            </Form.Control>
                        </Form.Group>
                        <Form.Text className= "message"></Form.Text>
                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>           
                            <Form.Control 
                            type="password" 
                            placeholder="Password" 
                            onChange={(e) => setPassword(e.currentTarget.value)} 
                            >
                            </Form.Control>
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            onClick={(e) => updateUser('update')}
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
        } else if (props.table === 'project') {
            if(props.mode === 'Insert') {
                return (
                    <Modal 
                    show={props.show} 
                    size={'lg'} 
                    centered={true}
                    onHide={props.hide}
                    >
                    <Modal.Header>
                        <div>
                            <Modal.Title>Add New Project</Modal.Title>
                        </div>     
                        <Dropdown className="dropdownproject">
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
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
                        <Container className="container">
                            <Row>
                                <Form.Group xs={6} md={8} as={Col} controlId="code">
                                    <Form.Label className="label">Project Code:</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="project code eg ASU_0921" 
                                            onChange={(e) => e.currentTarget.checked ? setProject(true) : setProject(false)}
                                        >
                                        </Form.Control>
                                </Form.Group>
                                <Form.Group as={Col} controlId="public">
                                    <Form.Label className="label">Public:</Form.Label>
                                        <Form.Control 
                                            className="checkbox"
                                            type="checkbox" 
                                            size='sm'
                                            checked={isPublic} 
                                            onChange={(e) => e.currentTarget.checked ? setIsPublic(true) : setIsPublic(false)}
                                        >
                                        </Form.Control>
                                </Form.Group>  
                            </Row>
                            <Row>
                                <Form.Group xs={6} md={8} as={Col} controlId="client">
                                    <Form.Label className="label">Client:</Form.Label>           
                                    <Form.Control 
                                        type="text" 
                                        size='sm'
                                        placeholder="client login code eg: asu" 
                                        onChange={(e) => setUser(e.currentTarget.value)}
                                    >
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group as={Col} controlId="priority">
                                    <Form.Label className="label">Priority:</Form.Label>
                                        <Form.Control
                                            className="checkbox" 
                                            type="checkbox" 
                                            size='sm'
                                            checked={isPriority}
                                            onChange={(e) => e.currentTarget.checked ? setIsPriority(true) : setIsPriority(false)}
                                        >
                                        </Form.Control>
                                </Form.Group>    
                            </Row>
                            <Row>
                                <Form.Group xs={6} md={8} as={Col} controlId="description">
                                    <Form.Label className="label">Description:</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        size='sm'
                                        placeholder="Enter project description" 
                                        onChange={(e) => setDescription(e.currentTarget.value)}
                                    >
                                    </Form.Control>
                                </Form.Group>
                                <Form.Group as={Col} controlId="priority">
                                <Form.Label className="label">Reverse:</Form.Label>
                                    <Form.Control
                                        className="checkbox" 
                                        type="checkbox" 
                                        size='sm'
                                        checked={isReverse}
                                        onChange={(e) => e.currentTarget.checked ? setIsReverse(true) : setIsReverse(false)}
                                    >
                                    </Form.Control>
                                </Form.Group>
                            </Row>
                            <Row>
                                <Form.Group xs={6} md={8} as={Col} controlId="date">
                                    <Form.Label className="label">Date:</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        size='sm'
                                        placeholder="Enter date (MMM yyyy)" 
                                        onChange={(e) => setDate(e.currentTarget.value)}
                                    >
                                    </Form.Control>
                                </Form.Group>
                            </Row>
                            <Row>
                                <Form.Group xs={6} md={8} as={Col} controlId="surface">
                                    <Form.Label className="label">Surface:</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        size='sm'
                                        placeholder="Enter surface (road/footpath)" 
                                        onChange={(e) => setSurface(e.currentTarget.value)}
                                    >
                                    </Form.Control>
                                </Form.Group>
                            </Row>
                            <Row>
                                <Form.Group xs={6} md={8} as={Col} controlId="amazon">
                                    <Form.Label className="label">Amazon URL:</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        size='sm'
                                        placeholder="Enter amazon url" 
                                        onChange={(e) => setAmazon(e.currentTarget.value)}
                                    >
                                    </Form.Control>
                                </Form.Group>
                            </Row>
                        <Button 
                                variant="primary" 
                                onClick={(e) => updateProject('insert')}
                            >
                            Submit
                        </Button>
                        </Container>
                        </Form>
                        
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else if(props.mode === 'Delete') {
                return (
                    <Modal 
                    show={props.show} 
                    size={'lg'} 
                    centered={true}
                    onHide={props.hide}
                    >
                    <Modal.Header>
                        <Modal.Title>Delete Project</Modal.Title>  
                        <Dropdown className="dropdownproject">
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
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
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            } else {
                return (
                    <Modal 
                    show={props.show} 
                    size={'lg'} 
                    centered={true}
                    onHide={props.hide}
                    >
                    <Modal.Header>
                        <div>
                            <Modal.Title>Delete Project Data</Modal.Title>
                        </div>     
                        <Dropdown className="dropdownproject">
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
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
                        <DropdownButton className="dropdownclient" title={this.state.currentUser}>
                            {this.state.usernames.map((value, index) =>
                            <Dropdown.Item 
                                key={`${index}`}
                                onClick={(e) => this.changeUser(e, value)}
                                >
                                {value}
                            </Dropdown.Item>
                            )}
                        </DropdownButton>	
                        <Form.Group controlId="code">
                            <Form.Label></Form.Label>
                            <Form.Control 
                            type="text" 
                            placeholder="Enter Project" 
                            onChange={(e) => this.changeProject(e)}>
                            </Form.Control>
                        </Form.Group>
                        <Button 
                            variant="primary" 
                            onClick={(e) => this.deleteProject(e)}>
                            Delete
                        </Button>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                    </Modal.Footer>
                </Modal>
                );
            }
        } else {
            return (
                <Modal 
                    show={props.show} 
                    size={'md'} 
                    centered={true} 
                    onHide={props.hide}
                    >
                <Modal.Header>
                    <div>
                        <Modal.Title>Import Data</Modal.Title>
                    </div>     
                </Modal.Header>
                <Modal.Body >
                    <Form>
                        <Form.Group controlId="project">
                            <Form.Label>Project</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Enter Project Code"
                                onChange={(e) => setProject(e.currentTarget.value)}
                                disabled={props.disabled}
                                value={props.project}>
                            </Form.Control>
                        </Form.Group>
                    </Form>
                    <CSVReader
                        cssClass="csv-reader-input"
                        label="Select CSV to import.  "
                        onFileLoaded={(data, fileInfo) => fileLoaded(data, fileInfo)}
                        inputStyle={{color: 'black'}}
                    />
                    <Button 
                        variant="primary" 
                        onClick={(e) => handleImport(e)}>
                            Import
                        </Button>
                </Modal.Body>
                <Modal.Footer>
                </Modal.Footer>
            </Modal>
            );
        }
    
}