import React, { useState, useContext, useEffect, Fragment } from 'react';
import {Navbar, Nav, NavDropdown}  from 'react-bootstrap';
import './Navigation.css';
import { loginContext} from '../login/loginContext.js';
import LoginNav from '../login/LoginNav.js';
import LoginModal from '../login/LoginModal.js'
import PostFetch from '../api/PostFetch.js';
import ProjectNav from './ProjectNav.js';
import Modals from '../modals/Modals.js';
import {CustomLink} from "../components/Components.js";
import SearchBar from './SearchBar.js'

export default function Navigation(props) {
  const [show, setShow] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projects, setProjects] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [project, setProject] = useState(null);
  const {login, updateLogin} = useContext(loginContext);


  const showModal = () => {
    setShow(true)
  }

  const clickLogin = async (user, password) => {
    let body = await PostFetch(login.host + '/login', "", {user: user, key: password});
    if (body.result) {
      window.sessionStorage.setItem('token', body.token);
      window.sessionStorage.setItem('user', body.user);
      updateLogin(body.user, body.token);
      buildProjects(body.projects)
      setIsLoggedIn(true)
      setShow(false); 
    } else {
      setLoginError("Username or password is incorrect!")
    }
  }

  const clickLogout = async (e) => {
    e.preventDefault();
    //let body = await PostFetch(login.host + '/logout', login.token, {user: login.user});
    setIsLoggedIn(false)
    updateLogin("Login", null)
    setProjects(null);  ;
    props.logout();
  }

  /**
   * Gets the development or production host 
   * @return {string} the host name
   */
  useEffect(() => {
    /**
     * calls to server to get public projects onload
     */
     let token = window.sessionStorage.getItem("token");
     let user =  window.sessionStorage.getItem("user");
     const callBackendAPI = async () => {
      try {
        const response = await fetch("https://" + login.host + '/api'); 
        const body = await response.json();
        if (response.status !== 200) {
          alert(body);   
          throw Error(body.message) 
        } else {
          buildProjects(body.projects);  
          }
      } catch(error) {
        alert(error)
      }
    }
    if (user) {
        let item = window.sessionStorage.getItem("projects");
        let _projects = JSON.parse(item);
        updateLogin(user, token)
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
    for(var i = 0; i < projects.length; i += 1) {
      if (projects[i].surface === "road") {
        obj.road.push(projects[i]);
      } else {
        obj.footpath.push(projects[i]);
      }
    }
    window.sessionStorage.setItem('projects', JSON.stringify(obj));
    setProjects(obj);
  }

  const handleClick = (e) => {
    let projectMode = e.target.type;
    let project = JSON.parse(e.target.title);
    if (projectMode === 'remove') {
      setProject(null)    
      props.remove(project);
       
    } else {
      setProject(project)
      props.add(projectMode, project)
    } 
  }

  return (
    <Fragment>
      <Navbar 
        bg="light" 
        expand="sm" 
        className='navbar'>      
        <Navbar.Brand >
          <img
            src="logo.png"
            width="122"
            height="58"
            className="d-inline-block align-top"
            alt="logo"
            />
        </Navbar.Brand>
        <ProjectNav
          projects={projects} 
          layers={props.layers}
          onClick={handleClick}
          disabled = {projects === null ? true: false}
        />
        <Nav fill={true} justify={true}>              
          <NavDropdown 
            className="navdropdown" 
            title="Data" 
            id="basic-nav-dropdown"
            disabled = {props.data.length === 0 ? true: false}
            >
          </NavDropdown>         
          </Nav>
          <Nav>
            <NavDropdown 
            className="navdropdown" 
            title="Report" 
            id="basic-nav-dropdown"
            disabled = {props.data.length === 0 ? true: false}
            >
              <CustomLink 
                  className="dropdownlink" 
                  endpoint="/statistics"
                  label="Create Report"
                  data={props.data}
                  mode={props.mode}
                  project={project}
                  style={{ textDecoration: 'none' }}
                  >
                </CustomLink>               
            </NavDropdown>   
          </Nav>
          <Nav>
            <NavDropdown className="navdropdown" title="Help" id="basic-nav-dropdown">
              <NavDropdown.Item className="navdropdownitem" onClick={(e) => clickTerms(e)} >Terms of Use</NavDropdown.Item>
              <NavDropdown.Divider />
              {/* <NavDropdown.Item className="navdropdownitem" onClick={(e) => clickContact(e)} >Contact</NavDropdown.Item>
              <NavDropdown.Divider /> */}
              {/* <NavDropdown.Item className="navdropdownitem" id="Documentation" onClick={(e) => this.documentation(e)}>Documentation</NavDropdown.Item>
              <NavDropdown.Divider /> */}
              <NavDropdown.Item className="navdropdownitem" onClick={(e) => clickAbout(e)} >About</NavDropdown.Item>             
            </NavDropdown>         
          </Nav>
            <SearchBar centre={props.centre} district={props.district}></SearchBar>

          
        <LoginNav user={login.user} onClick={isLoggedIn ? clickLogout: showModal}></LoginNav>
      </Navbar>
      <LoginModal show={show} error={loginError} onClick={clickLogin}></LoginModal>
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