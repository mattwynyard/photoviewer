import React, { useState} from 'react';
// import {Modal, Form, Button, Row}  from 'react-bootstrap';
// import CSVReader from 'react-csv-reader';
import './AdminModal.css';
import {InsertUserModal} from './InsertUserModal.js';
import {DeleteUserModal} from './DeleteUserModal.js';
import {UpdateUserModal} from './UpdateUserModal.js';
import {InsertProjectModal} from './InsertProjectModal.js';
import {DeleteProjectModal} from './DeleteProjectModal.js';
import {UpdateProjectModal} from './UpdateProjectModal.js';
import {ImportDataModal} from './ImportDataModal.js'
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
    const [amazon, setAmazon] = useState(null);
    const [tacode, setTAcode] = useState(null);
    const [isPriority, setIsPriority] = useState(true);
    const [isReverse, setIsReverse] = useState(false);
    const [hasVideo, setHasVideo] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [hasCentreline, setHasCentreline] = useState(false);
    const [hasRamm, setHasRamm] = useState(false);
    const [hasRMClass, setHasRMClass] = useState(false);
    const [data, setData] = useState(null);
    const [isStaged, setIsStaged] = useState(false);
    const [buttonDisabled, setButtonDisabled] = useState(true)
    const [deleteProjectDataOnly, setDeleteProjectDataOnly] = useState(false)
    const AddClient = clients.map(AddClient => AddClient);
    const AddProject = projects.map(AddProject => AddProject);

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
              if (result.error) {
                alert(result.rows + " " + result.error)   
              } else {
                  alert(result.rows)   
              }  
            }
          }).catch((error) => {
            console.log("error: " + error);
            alert(error);
          });
          props.hide();   
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
        props.setMode(mode);
        if (mode === "Update") {
            setButtonDisabled(true);
            getClients();
            getProjects(clients[0]);
        }     
    }

    const changeClient = async (index) => {
        setClient(clients[index]);
        let result = await getProjects(clients[index]);
        if (!result) {
            return;
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
            setTAcode(result.tacode);
        }           
    }

    const changeProject = (index) => {
        setProject(projects[index]);
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
            setTAcode(projects[index].tacode);
        }       
    }

    const getClients = async () => {
        if (props.login.user === "admin") {
            const clients = await apiRequest({user: props.login.user, token: props.login.token, host: props.login.host},
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
                return result[0];
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
        if (props.login.user !== "admin") return;
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
                code: type === 'update' ? project.code: project,
                dataOnly: type === 'delete' ? deleteProjectDataOnly: null,
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
                rmclass: hasRMClass,
                tacode: tacode

            })
          }).then(async (response) => {
            const body = await response.json();
            if (body.error != null) {
              alert(`Error: ${body.error}\n`);
            } else {
              if (body.type === "insert") {
                alert("Project: " + project + " created")
              } else if (body.type === "delete") {
                alert("Project: " + project + "  data rows: " + body.rows + " and " + body.parent + " header rows deleted\n ");
            } else if (body.type === "update") {
                alert("Project: " + project.code + " rows: " + body.rows + " updated")
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
          props.hide();
        }
      }

      const handleHide = () => {
        setProjects([]);
        setProject(null);
        setButtonDisabled(true);
        setMode('Insert');
        props.hide();
      }

      const handleCheckboxChange = (e) => {
        switch(e.currentTarget.id) {
            case 'public':
                if(e.currentTarget.checked) {
                    setIsPublic(true)
                } else {
                    setIsPublic(false)
                }
                break;
            case 'reverse':
                if(e.currentTarget.checked) {
                    setIsReverse(true)
                } else {
                    setIsReverse(false)
                }
                break;
            case 'priority':
                if(e.currentTarget.checked) {
                    setIsPriority(true)
                } else {
                    setIsPriority(false)
                }
                break;
            case 'video':
                if(e.currentTarget.checked) {
                    setHasVideo(true)
                } else {
                    setHasVideo(false)
                }
                break;
            case 'ramm':
                if(e.currentTarget.checked) {
                    setHasRamm(true)
                } else {
                    setHasRamm(false)
                }
                break;
            case 'centreline':
                if(e.currentTarget.checked) {
                    setHasCentreline(true)
                } else {
                    setHasCentreline(false)
                }
                break;
            case 'rmclass':
                if(e.currentTarget.checked) {
                    setHasRMClass(true)
                } else {
                    setHasRMClass(false)
                }
                break;
            case 'staged':
                if(e.currentTarget.checked) {
                    setIsStaged(true)
                } else {
                    setIsStaged(false)
                }
                break;
            default:

        }
        if(buttonDisabled) {
            setButtonDisabled(false);
        }
      }

      const handleTextChange = (e) => {
        switch(e.currentTarget.id) {
            case 'description':
                setDescription(e.currentTarget.value);
                break;
            case 'date':
                setDate(e.currentTarget.value);
                break;
            case 'surface':
                setSurface(e.currentTarget.value);
                break;
            case 'amazon':
                setAmazon(e.currentTarget.value);
                break
            case 'tacode':
                setTAcode(e.currentTarget.value);
                break;
            default:

        }
        if(buttonDisabled) {
            setButtonDisabled(false);
        }
      }

        if (props.table === 'user') {
            if(props.mode === 'Insert') {
                return (
                    <InsertUserModal 
                        props={props} 
                        setMode={setMode} 
                        setClient={setClient} 
                        setPassword={setPassword}
                        updateUser={updateUser}
                    />
                );
            } else if (props.mode === "Delete") {
                return (
                    <DeleteUserModal
                        props={props} 
                        setMode={setMode} 
                        setClient={setClient} 
                        updateUser={updateUser}
                    />
                );
            } else { //Update
               return (
                    <UpdateUserModal
                        props={props} 
                        setMode={setMode} 
                        setClient={setClient} 
                        setPassword={setPassword}
                        updateUser={updateUser}
                    />
                );
            }
        } else if (props.table === 'project') {
            if(props.mode === 'Insert') {
                return (
                    <InsertProjectModal
                    props={props} 
                    handleHide={handleHide}
                    setMode={setMode} 
                    setClient={setClient} 
                    setProject={setProject}
                    setDescription={setDescription}
                    setDate={setDate}
                    setSurface={setSurface}
                    setAmazon={setAmazon}
                    setTAcode={setTAcode}
                    setIsPublic={setIsPublic}
                    setIsReverse={setIsReverse}
                    setIsPriority={setIsPriority}
                    setHasVideo={setHasVideo}
                    setHasRamm={setHasRamm}
                    setHasCentreline={setHasCentreline}
                    setHasRMClass={setHasRMClass}
                    updateProject={updateProject}
                />
                );
            } else if(props.mode === 'Delete') {
                return (
                    <DeleteProjectModal
                    props={props} 
                    handleHide={handleHide}
                    setMode={setMode} 
                    setProject={setProject}
                    updateProject={updateProject}
                    setDeleteProjectDataOnly={setDeleteProjectDataOnly}
                    deleteProjectDataOnly={deleteProjectDataOnly}
                />
                );
            } else if(props.mode === 'Update') {
                return (
                    <UpdateProjectModal
                        props={props} 
                        project={project}
                        isPublic={isPublic}
                        isReverse={isReverse}
                        isPriority={isPriority}
                        hasRMClass={hasRMClass}
                        hasCentreline={hasCentreline}
                        hasRamm={hasRamm}
                        hasVideo={hasVideo}
                        handleHide={handleHide}
                        setMode={setMode}
                        changeClient={changeClient}
                        changeProject={changeProject}
                        AddClient={AddClient}
                        AddProject={AddProject}
                        handleTextChange={handleTextChange}
                        handleCheckboxChange={handleCheckboxChange}
                        updateProject={updateProject}
                        buttonDisabled={buttonDisabled}
                        updateProject={updateProject}
                    />
                );
            }
        } else {
            return (
                <ImportDataModal
                    props={props} 
                    project={project !== null ? project : ""}
                    setProject={setProject}
                    fileLoaded={fileLoaded}
                    handleCheckboxChange={handleCheckboxChange}
                    isStaged={isStaged}
                    handleImport={handleImport}
                />

            );
        }      
      }
