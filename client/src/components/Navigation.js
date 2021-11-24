import React, { useState, useContext, useEffect, Fragment } from 'react';
import {Navbar, Nav, NavDropdown}  from 'react-bootstrap';
import './Navigation.css';
import { loginContext} from '../loginContext';
import LoginNav from './LoginNav.js';
import LoginModal from './LoginModal'
import PostFetch from './PostFetch';
import ProjectNav from './ProjectNav';

// const CustomLink = (props) => {
//   if (props.endpoint === "/data") { //turn off data
//     return (null);
//   }
//   if (this.state.activeLayer === null) { //no gl data
//     return(null);
//   } else {
//     return (
//       <Link 
//         className="dropdownlink" 
//         to={{
//           pathname: props.endpoint,
//           login: this.customNav.current,
//           user: this.state.login,
//           data: this.state.objGLData,
//           project: this.state.activeLayer
//         }}
//         style={{ textDecoration: 'none' }}
//         >{props.label}
//       </Link>
//     );
//   }      
// }

{/* <Nav>
              <NavDropdown className="navdropdown" title="Help" id="basic-nav-dropdown">
                <NavDropdown.Item className="navdropdownitem" onClick={(e) => this.clickTerms(e)} >Terms of Use</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" onClick={(e) => this.clickContact(e)} >Contact</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" id="Documentation" onClick={(e) => this.documentation(e)}>Documentation</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" onClick={(e) => this.clickAbout(e)} >About</NavDropdown.Item>             
              </NavDropdown>         
            </Nav>
            <CustomNav ref={this.customNav} className="navdropdown"/>
            <SearchBar ref={this.searchRef} district={this.state.district}></SearchBar> */}

export default function Navigation(props) {
  const [show, setShow] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projects, setProjects] = useState(null);
  //const [layers] = useState(props.layers);
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
    let body = await PostFetch(login.host + '/logout', login.token, {user: login.user});
    setIsLoggedIn(false)
    updateLogin("Login", null)
    setProjects(null)  
    props.logout()
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("user");
    window.sessionStorage.removeItem("projects");
  }

  
  
  /**
   * Gets the development or production host 
   * @return {string} the host name
   */
  useEffect(() => {
    console.log("render")
    /**
     * calls to server to get public projects onload
     */

     const callBackendAPI = async () => {
      const response = await fetch("https://" + login.host + '/api'); 
      const body = await response.json();
      if (response.status !== 200) {
        alert(body);   
        throw Error(body.message) 
      } else {
        buildProjects(body.projects);  
        }
    };
    
    let token = window.sessionStorage.getItem("token");
    let user =  window.sessionStorage.getItem("user");
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

  

  // useEffect(() => {
  //   console.log(layers)
  // }, [layers]); 

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
    let type = e.target.type;
    let project = JSON.parse(e.target.title);
    if (type === 'remove') {
      props.setLayers("remove", project)
    } else {
      props.setLayers("add", project)
    } 
  }

  // const removeLayer = (project) => {
  //   if (props.layers.length <= 0) return;
  //   for(let i = 0; i < props.layers.length; i++) {
  //     if (props.layers[i].code === project.code) {
  //       let _layers = [...props.layers]
  //       _layers.splice(i, 1)
        
  //     }
  //   }
  // }

  // const addLayer = (project) => {
  //   for(let i = 0; i < props.layers.length; i++) {
  //     if (props.layers[i].code === project.code) return;
  //   }
  //   let _layers = [...props.layers]
  //   _layers.push(project);
  //   console.log(_layers)
  //   props.setLayers(_layers, "add", project)
  // }

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
            disabled = {props.data === null ? true: false}
            >
            {/* <CustomLink 
              className="dropdownlink" 
              endpoint="/data"
              label="Table View"
              style={{ textDecoration: 'none' }}
              >
              </CustomLink>       */}
          </NavDropdown>         
          </Nav>
          <Nav>
            <NavDropdown 
            className="navdropdown" 
            title="Report" 
            id="basic-nav-dropdown"
            disabled = {props.data === null ? true: false}
            >         
                {/* <CustomLink 
                  className="dropdownlink" 
                  endpoint="/statistics"
                  label="Create Report"
                  style={{ textDecoration: 'none' }}
                  >
                </CustomLink>      */}
              </NavDropdown>   
          </Nav>
        <LoginNav user={login.user} onClick={isLoggedIn ? clickLogout: showModal}></LoginNav>
      </Navbar>
      <LoginModal show={show} error={loginError} onClick={clickLogin}></LoginModal>
    </Fragment>      
  );
}