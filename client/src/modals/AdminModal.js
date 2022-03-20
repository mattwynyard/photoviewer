import React, { useEffect, useState} from 'react';
import {Modal, Dropdown, Form, Button, Row, Col, Container}  from 'react-bootstrap';
import CSVReader from 'react-csv-reader';
import './AdminModal.css';
import {apiRequest} from '../api/Api.js';


export default function AdminModal(props) {
    const [password, setPassword] = useState(null);
    const [project, setProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [client, setClient] = useState(null);
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

    const AddClient = clients.map(AddClient => AddClient);
    const AddProject = projects.map(AddProject => AddProject);

    // useEffect(() => {
    //     getClients();
    //     getProjects(clients[0]);
        
    // }, []);

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

    const setMode = (mode) => {
        props.setMode(mode)
        if (mode === "Update") {
            getClients();
            getProjects(clients[0]);
        }     
    }

    const changeClient = async (index) => {
        setClient(clients[index]);
        let result = await getProjects(clients[index]);
        if (!result) {
            console.log(result)
            //refreshUI(0);
        } else {
            setDescription(result.description);
            setDate(result.date);
            setSurface(result.surface);  
            setAmazon(result.amazon); 
            setIsPublic(result.public);
            setIsReverse(result.reverse);
            setIsPriority(result.priority);
            setHasVideo(result.hasvideo);
            setHasRamm(result.ramm);
            setHasCentreline(result.centreline);
            setHasRMClass(result.rmclass);
        }
           
    }

    const changeProject = (index) => {
        setProject(projects[index]);
        console.log(projects[index])
        refreshUI(index);      
    }

    const refreshUI = (index) => {
        if (projects) {
            setDescription(projects[index].description);
            setDate(projects[index].date);
            setSurface(projects[index].surface);  
            setAmazon(projects[index].amazon); 
            setIsPublic(projects[index].public);
            setIsReverse(projects[index].reverse);
            setIsPriority(projects[index].priority);
            setHasVideo(projects[index].hasvideo);
            setHasRamm(projects[index].ramm);
            setHasCentreline(projects[index].centreline);
            setHasRMClass(projects[index].rmclass);
        }
        
    }

    const getClients = async () => {
        if (props.login.user === "admin") {
            let clients = await apiRequest({user: props.login.user, token: props.login.token, host: props.login.host},
                 {project: null, query: null}, "/clients");
            setClients(clients.map((client) => client.username).sort());
          }
    }

    const getProjects = async (client) => {
        if (props.login.user === "admin") {
            let result = await apiRequest({user: props.login.user, token: props.login.token, host: props.login.host},
                {project: null, query: {user: client}}, "/projects");
            setProjects(result.map((project) => project));
            if (result.length === 0) {
                setProject(null);
                return null;
            } else {
                setProject(result[0]);
                return result[0]
            }
          }
         
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
              client: client,
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
                    alert("User: " + client + " created")
                  } else if (body.type === 'delete') {
                    alert("User: " + client + " deleted")
                  } else if (body.type === 'update') {
                    alert("User: " + client + " updated")
                  }
              } else {
                if (body.type === 'insert') {
                    alert("User: " + client + " failed to insert")
                  } else if (body.type === 'delete') {
                    alert("User: " + client + " failed to delete")
                  } else if (body.type === 'update') {
                    alert("User: " + client + " failed to update")
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

      const updateProject = async (type) => {
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
                client: client,
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

      const handleHide = () => {
        setProjects([]);
        setProject(null);
        props.hide();
      }

      switch (props.table) {
        case 'user':
            if(props.mode === 'Insert') {
                return (
                    <Modal 
                        show={props.show} 
                        size={'md'} 
                        centered={true}
                        onHide={props.onHide}
                        >
                    <Modal.Header>
                        <Modal.Title>Add New User</Modal.Title>
                        <Dropdown>
                            <Dropdown.Toggle variant="success" id="dropdown-basic">
                                {props.mode}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                            <Dropdown.Item
                                onClick={(e) => setMode("Delete")}
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
                            onChange={(e) => setClient(e.currentTarget.value)}
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
                            onClick={(e) => updateUser('insert', client, password)}
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
                                onClick={(e) => setMode("Insert")}
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
                            onChange={(e) => setClient(e.currentTarget.value)}
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
                                onClick={(e) => setMode("Insert")}
                                >
                                Insert
                            </Dropdown.Item>
                            <Dropdown.Item
                                onClick={(e) => setMode("Delete")}
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
                            onChange={(e) => setClient(e.currentTarget.value)}
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
                                        onClick={(e) => setMode("Delete")}
                                        >
                                        Delete
                                    </Dropdown.Item>
                                    <Dropdown.Item
                                        onClick={(e) => setMode("Update")}
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
                                                onChange={(e) => setProject(e.currentTarget.value)}
                                            >
                                            </Form.Control>
                                        <Form.Label className="label">Client:</Form.Label>           
                                        <Form.Control 
                                            type="text" 
                                            size='sm'
                                            placeholder="client login code eg: asu" 
                                            onChange={(e) => setClient(e.currentTarget.value)}
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
                                    onClick={(e) => setMode("Insert")}
                                    >
                                    Insert
                                </Dropdown.Item>
                                <Dropdown.Item
                                    onClick={(e) => setMode("Update")}
                                    >
                                    Update
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
                } else if(props.mode === 'Update') {
                    return (
                        <Modal 
                        show={props.show} 
                        size={'lg'} 
                        centered={true}
                        onHide={() => handleHide()}
                        >
                        <Modal.Header>
                            <div>
                                <Modal.Title>Update Project </Modal.Title>
                            </div>     
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
                        {/* <Form> */}
                            <div className="container">
                                <label className={"label-client"} 
                                    htmlFor="client">
                                        {"Client:"}
                                </label>
                                <select 
                                className={"select-client"}
                                name="client"
                                id="client"
                                onChange = {(e) => changeClient(e.currentTarget.value)}
                                >
                                {
                                    AddClient.map((client, key) => <option key={key} value={key}>{client}</option>)
                                }
                                </select>
                                <label className={"label-project"} 
                                    htmlFor="project">
                                        {"Project:"}
                                </label>
                                <select 
                                className={"select-project"}
                                name="project"
                                id="project"
                                onChange={(e) => changeProject(e.currentTarget.value)}
                                >
                                {
                                    AddProject.map((project, key) => <option key={key} value={key}>{project.code}</option>)
                                }
                                </select>
                                <label className={"label-description"} 
                                    htmlFor="description">
                                        {"Description:"}
                                </label>
                                <input 
                                    type={"text"} 
                                    id={"description"} 
                                    name={"description"}
                                    size='sm'
                                    placeholder={project === null ? "" : project.description} 
                                    onChange={(e) => setDescription(e.currentTarget.value)}
                                ></input>
                                <label className={"label-date"} 
                                    htmlFor="date">
                                        {"Date:"}
                                </label>
                                <input 
                                    type={"text"} 
                                    id={"date"} 
                                    name={"date"}
                                    size='sm'
                                    placeholder={project === null ? "" : project.date} 
                                    onChange={(e) => setDate(e.currentTarget.value)}
                                ></input>
                                <label className={"label-surface"} 
                                    htmlFor="surface">
                                        {"Surface:"}
                                </label>
                                <input 
                                    type={"text"} 
                                    id={"surface"} 
                                    name={"surface"}
                                    size='sm'
                                    placeholder={project === null ? "" : project.surface} 
                                    onChange={(e) => setDate(e.currentTarget.value)}
                                ></input>
                                <label className={"label-amazon"} 
                                    htmlFor="amazon">
                                        {"Amazon:"}
                                </label>
                                <input 
                                    type={"text"} 
                                    id={"amazon"} 
                                    name={"amazon"}
                                    size='sm'
                                    placeholder={project === null ? "" : project.amazon} 
                                    onChange={(e) => setAmazon(e.currentTarget.value)}
                                ></input>
                                <label className={"label-public"} 
                                    htmlFor="public">
                                        {"Public:"}
                                </label>
                                <input 
                                    type={"checkbox"} 
                                    id={"public"} 
                                    name={"public"}
                                    size='sm'
                                    checked={project ? isPublic : false} 
                                    onClick={(e) => e.currentTarget.checked ? setIsPublic(false) : setIsPublic(true)}
                                    //onChange={(e) => e.currentTarget.checked ? setIsPublic(true) : setIsPublic(false)}
                                ></input>
                                <label className={"label-reverse"} 
                                    htmlFor="reverse">
                                        {"Reverse:"}
                                </label>
                                <input 

                                    type={"checkbox"} 
                                    id={"reverse"} 
                                    name={"reverse"}
                                    size='sm'
                                    checked={project ? isReverse : false} 
                                    onChange={(e) => e.currentTarget.checked ? setIsReverse(true) : setIsReverse(false)}
                                ></input>
                                <label className={"label-priority"} 
                                    htmlFor="priority">
                                        {"Priority:"}
                                </label>
                                <input 
                                    type={"checkbox"} 
                                    id={"priority"} 
                                    name={"priority"}
                                    size='sm'
                                    checked={project ? isPriority : false} 
                                    onChange={(e) => e.currentTarget.checked ? setIsPriority(true) : setIsPriority(false)}
                                ></input>
                                <label className={"label-video"} 
                                    htmlFor="video">
                                        {"Video:"}
                                </label>
                                <input 
                                    type={"checkbox"} 
                                    id={"video"} 
                                    name={"video"}
                                    size='sm'
                                    checked={project ? hasVideo : false} 
                                    onChange={(e) => e.currentTarget.checked ? setHasVideo(true) : setHasVideo(false)}
                                ></input>
                                <label className={"label-ramm"} 
                                    htmlFor="ramm">
                                        {"Ramm:"}
                                </label>
                                <input 
                                    type={"checkbox"} 
                                    id={"ramm"} 
                                    name={"ramm"}
                                    size='sm'
                                    checked={project ? hasRamm : false} 
                                    onChange={(e) => e.currentTarget.checked ? setHasRamm(true) : setHasRamm(false)}
                                ></input>
                                <label className={"label-centreline"} 
                                    htmlFor="centreline">
                                        {"Centreline:"}
                                </label>
                                <input 
                                    type={"checkbox"} 
                                    id={"centreline"} 
                                    name={"centreline"}
                                    size='sm'
                                    checked={project ? hasCentreline : false} 
                                    onChange={(e) => e.currentTarget.checked ? setHasCentreline(true) : setHasCentreline(false)}
                                ></input>
                                <label className={"label-rmclass"} 
                                    htmlFor="rmclass">
                                        {"RM Class:"}
                                </label>
                                <input 
                                    type={"checkbox"} 
                                    id={"rmclass"} 
                                    name={"rmclass"}
                                    size='sm'
                                    checked={project ? hasRMClass : false} 
                                    onChange={(e) => e.currentTarget.checked ? setHasRMClass(true) : setHasRMClass(false)}
                                ></input>
                                <input 
                                    type={"button"} 
                                    size='sm'
                                    value={"submit"}
                                    onClick={(e) => updateProject('update')}
                                ></input>
                            </div>
                        
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