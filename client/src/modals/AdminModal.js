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
    const [isReverse, setIsReverse] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [hasCentreline, setHasCentreline] = useState(false);
    const [hasRamm, setHasRamm] = useState(false);
    const [hasRMClass, setHasRMClass] = useState(false);
    const [data, setData] = useState(null);
    const [isStaged, setIsStaged] = useState(false);

    const sendData = async (endpoint) => {
        if (props.login.user === "admin") {
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
            project: project,
            staged: isStaged
          })
          }).then(async (response) => {
            if(!response.ok) {
              throw new Error(response.status);
            } else {
              const result = await response.json();
              alert(result.rows)     
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
        if (!project) {
            alert("No project specified");
            return;
        }
        sendData("/import");
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
        if (props.login.user === "admin") {
          await fetch('https://' + props.login.host + '/project', {
            method: 'POST',
            headers: {
              "authorization": props.login.token,
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: props.login.user,
                type: type,
                code: project,
                client: user,
                description: description ? description : null,
                date: date ? date : null,
                amazon: amazon ? amazon : null,
                surface: surface,
                public: isPublic,
                priority: isPriority,
                reverse: isReverse,
                video: hasVideo,
                ramm: hasRamm,
                centreline: hasCentreline,
                rmclass: hasRMClass

            })
          }).then(async (response) => {
            const body = await response.json();
            if (body.error != null) {
              alert(`Error: ${body.error}\n`);
            } else {
              if (body.type === "insert") {
                alert("Project: " + project + " created")
              } else if (body.type === "delete") {
                alert("Project: " + project + "rows: " + body.rows + " deleted")
              } else {
                alert("Project: " + project + "  failed")
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

      switch (props.table) {
        case 'user':
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
            case 'project':
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
                                    <Form.Group xs={6} md={8} as={Col} controlId="code">
                                        <Form.Label className="label">Project Code:</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                size='sm'
                                                placeholder="project code eg ASU_0921" 
                                                onChange={(e) => setProject(e.currentTarget.value)}
                                            >
                                            </Form.Control>
                                        <Form.Label className="label">Client:</Form.Label>           
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="client login code eg: asu" 
                                            onChange={(e) => setUser(e.currentTarget.value)}
                                        >
                                        </Form.Control>
                                        <Form.Label className="label">Description:</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="Enter project description" 
                                            onChange={(e) => setDescription(e.currentTarget.value)}
                                        >
                                        </Form.Control>
                                        <Form.Label className="label">Date:</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="Enter date (MMM yyyy)" 
                                            onChange={(e) => setDate(e.currentTarget.value)}
                                        >
                                        </Form.Control>
                                        <Form.Label className="label">Surface:</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="Enter surface (road/footpath)" 
                                            onChange={(e) => setSurface(e.currentTarget.value)}
                                        >
                                        </Form.Control>
                                        <Form.Label className="label">Amazon URL:</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="Enter amazon url" 
                                            onChange={(e) => setAmazon(e.currentTarget.value)}
                                        >
                                        </Form.Control>
                                    </Form.Group>
                                    
                                    <Form.Group xs={6} md={8} as={Col} controlId="public">
                                        <Form.Label className="label">Public:</Form.Label>
                                            <Form.Control 
                                                className="checkbox"
                                                type="checkbox" 
                                                size='sm'
                                                checked={isPublic} 
                                                onChange={(e) => e.currentTarget.checked ? setIsPublic(true) : setIsPublic(false)}
                                            >
                                            </Form.Control>
                                   
                                    <Form.Label className="label">Reverse:</Form.Label>
                                        <Form.Control
                                            className="checkbox" 
                                            type="checkbox" 
                                            size='sm'
                                            checked={isReverse}
                                            onChange={(e) => e.currentTarget.checked ? setIsReverse(true) : setIsReverse(false)}
                                        >
                                        </Form.Control>
                                        <Form.Label className="label">Priority:</Form.Label>
                                            <Form.Control
                                                className="checkbox" 
                                                type="checkbox" 
                                                size='sm'
                                                checked={isPriority}
                                                onChange={(e) => e.currentTarget.checked ? setIsPriority(true) : setIsPriority(false)}
                                            >
                                            </Form.Control>
  
                                    <Form.Label className="label">Video:</Form.Label>
                                        <Form.Control
                                            className="checkbox" 
                                            type="checkbox" 
                                            size='sm'
                                            checked={hasVideo}
                                            onChange={(e) => e.currentTarget.checked ? setHasVideo(true) : setHasVideo(false)}
                                        >
                                        </Form.Control>
                                    <Form.Label className="label">RAMM:</Form.Label>
                                        <Form.Control
                                            className="checkbox" 
                                            type="checkbox" 
                                            size='sm'
                                            checked={hasRamm}
                                            onChange={(e) => e.currentTarget.checked ? setHasRamm(true) : setHasRamm(false)}
                                        >
                                        </Form.Control>
                                    <Form.Label className="label">Centreline:</Form.Label>
                                        <Form.Control
                                            className="checkbox" 
                                            type="checkbox" 
                                            size='sm'
                                            checked={hasCentreline}
                                            onChange={(e) => e.currentTarget.checked ? setHasCentreline(true) : setHasCentreline(false)}
                                        >
                                        </Form.Control>
                                    <Form.Label className="label">RM Class:</Form.Label>
                                        <Form.Control
                                            className="checkbox" 
                                            type="checkbox" 
                                            size='sm'
                                            checked={hasRMClass}
                                            onChange={(e) => e.currentTarget.checked ? setHasRMClass(true) : setHasRMClass(false)}
                                        >
                                        </Form.Control>
                                    <Button 
                                        variant="primary" 
                                        onClick={(e) => updateProject('insert')}
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
                            <Form.Label className="label">Project Code:</Form.Label>
                                <Form.Control 
                                    type="text" 
                                    size='sm'
                                    placeholder="Enter project code" 
                                    onChange={(e) => setProject(e.currentTarget.value)}
                                >
                                </Form.Control>
                            </Form>
                            <Button 
                                variant="primary" 
                                onClick={(e) => updateProject('delete')}>
                                Delete
                            </Button>
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
        default:
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
                        <Form.Group xs={7} md={8} as={Row}  controlId="import">
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