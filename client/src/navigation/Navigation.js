import React, { useState, useContext, useEffect, useCallback, Fragment } from 'react';
import { useDispatch } from 'react-redux'
import { addLayer, removeLayer } from '../state/reducers/layersSlice'
import {Navbar, Nav, NavDropdown, Container}  from 'react-bootstrap';
import './Navigation.css';
import { AppContext } from '../context/AppContext';
import LoginNav from '../login/LoginNav.jsx';
import LoginModal from '../login/LoginModal.jsx'
import {LoginFetch, apiRequest} from '../api/Api.js';
import { ProjectNav } from './ProjectNav.js';
import DataNav from "./DataNav.js";
import Modals from '../modals/Modals.js';
import AdminModal from '../modals/AdminModal.jsx';
import {CustomLink} from "../components/Components.jsx";
import SearchBar from './SearchBar.js'

export const Navigation = (props) => {
  const dispatch = useDispatch()
  const [show, setShow] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminTable, setAdminTable] = useState('user');
  const [adminMode, setAdminMode] = useState('Insert');
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [localLogin, setLocalLogin] = useState({user: "Login", token: null})
  const [projects, setProjects] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const {login, updateLogin, setMapBoxKey, district, setProjectMode, projectMode } = useContext(AppContext);

  const showModal = () => {
    setShow(true)
  }
  //const layers = useSelector((state) => state.layers)

  const clickLogin = async (user, password) => {
    setLoginError("")
    const body = await LoginFetch(login.host + '/login', "", {user: user, key: password});
    if (body.login) {
      const mapbox = await apiRequest({user: body.user, token: body.token, host: login.host}, {project: null, query: null}, "/mapbox");
      setMapBoxKey(mapbox);
      window.sessionStorage.setItem('token', body.token);
      window.sessionStorage.setItem('user', body.user);
      updateLogin(body.user, body.token);
      setLocalLogin({user: body.user, token: body.token})
      buildProjects(body.projects)
      setIsLoggedIn(true)
      setShow(false); 
    } else {
      setLoginError("Username or password is incorrect!")
    }
  }

  const clickLogout = async (e) => {
    e.preventDefault();
    setIsLoggedIn(false)
    setLocalLogin({user: "Login", token: null})
    setProjects(null);  ;
    props.logout();
  }

  useEffect(() => {
    updateLogin(localLogin.user, localLogin.token);
  }, [localLogin, updateLogin]);

  useEffect(() => {
     let host =  window.sessionStorage.getItem("osmiumhost");
     let user =  window.sessionStorage.getItem("user");
     const callBackendAPI = async () => {
      try {
        const response = await fetch("https://" + host + '/api'); 
        const body = await response.json();
        if (response.status !== 200) {
          alert(body);   
          throw Error(body.message) 
        } else {
          buildProjects(body.projects);  
          }
      } catch(error) {
        alert(`Error: ${error.message} \nThe server maybe offline`);
      }
    }
    if (user) {

        let token = window.sessionStorage.getItem("token");
        let item = window.sessionStorage.getItem("projects");
        let _projects = JSON.parse(item);
        setLocalLogin({user: user, token: token})
        setIsLoggedIn(true)
        setProjects(_projects)  
    } else {
      callBackendAPI();     
    }
  }, []); 

  const clickClose = (e) => {
    e.preventDefault();
    if (e.target.id === 'about') {
      setShowAbout(false)   
    } else if(e.target.id === 'terms') {
      setShowTerms(false)
    }    
  }

  const clickAbout = (e) => {
    e.preventDefault();
    setShowAbout(true)
  }

  const clickTerms = (e) => {
    e.preventDefault();
    setShowTerms(true)
  }

  const buildProjects = (projects) => {    
    let obj = {road : [], footpath: []}
    for(let i = 0; i < projects.length; i += 1) {
      if (projects[i].surface === "road") {
        obj.road.push(projects[i]);
      } else {
        obj.footpath.push(projects[i]);
      }
    }
    window.sessionStorage.setItem('projects', JSON.stringify(obj));
    setProjects(obj);
  }

  const handleClick = useCallback((type, project) => { 
    if (type === 'remove') { 
      dispatch(removeLayer(project))
      setProjectMode(null)
      props.remove(project);      
    } else {
      props.add(project)
      setProjectMode(type)
      dispatch(addLayer(project))
    } 
  }, [])

  // Admin
  const handleAdminClick = (e) => {
    setShowAdmin(true)
    setAdminTable(e.currentTarget.id)
  }

  const hideAdmin = () => {
    setShowAdmin(false)
  }

  const setMode = (mode) => {
    setAdminMode(mode);
  }

  return (
    <Fragment>
      <Navbar 
        className="navbar"
        bg="light" 
        expand="sm"> 
        <Container fluid>
          <Navbar.Brand >
            <img
              src="logo.png"
              width="122"
              height="58"
              className="d-inline-block align-top"
              alt="logo"
              />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="responsive-navbar-nav" />
          <Navbar.Collapse className={"navbar-collapse"} id="responsive-navbar-nav">
            <ProjectNav
              login={login}
              projects={projects ? projects : null} 
              onClick={login.user !== 'admin' ? handleClick : handleAdminClick}
              disabled = {projects === null ? true: false}
            />
                       
          <DataNav 
            title="Data" 
            layers={props.layers}
            id="basic-nav-dropdown"
            disabled={props.data.length === 0 ? true: false}
            data={props.data}
            >
          </DataNav>         
          
          <Nav>
            <NavDropdown 
            title="Report" 
            id="basic-nav-dropdown"
            disabled = {props.data.length === 0 ? true: false}
            >
              <CustomLink 
                className="dropdownlink" 
                endpoint="/statistics"
                label="Create Report"
                data={props.data}
                project={props.project}
                  >
              </CustomLink>               
            </NavDropdown>   
          </Nav>
          <Nav>
            <NavDropdown 
              title="Help" 
              id="basic-nav-dropdown">
              <NavDropdown.Item
                className="menudropdown" 
                onClick={(e) => clickTerms(e)} 
                >Terms of Use
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item 
                className="menudropdown" 
                onClick={(e) => clickAbout(e)} 
              >About</NavDropdown.Item>             
            </NavDropdown>         
          </Nav>
          <SearchBar centre={props.centre} district={district}></SearchBar> 
          <LoginNav 
            user={login.user} 
            onClick={isLoggedIn ? clickLogout: showModal}
            >
          </LoginNav>
        </Navbar.Collapse>
        </Container>
        <LoginModal show={show} error={loginError} onClick={clickLogin}></LoginModal>
      </Navbar> 
      <AdminModal
        login={login}
        show={showAdmin}
        table={adminTable}
        mode={adminMode}
        setMode={setMode}
        hide={hideAdmin}
      >
      </AdminModal>
      <Modals
        id='about'
        show={showAbout}
        onClick={(e) => clickClose(e)} 
      />
      <Modals
        id='terms'
        show={showTerms}
        onClick={(e)=> clickClose(e)} 
      />
    </Fragment>      
  );
}