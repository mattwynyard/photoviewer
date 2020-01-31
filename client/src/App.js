import React from 'react';
import { Map, TileLayer, Marker, Polyline, Popup, ScaleControl, LayersControl, LayerGroup}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Modal, Button, Image, Form, Dropdown, Table, Pagination}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
//import './api.js';
import Cookies from 'js-cookie';

class App extends React.Component {

  constructor(props) {
    
    //const osmURL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    //const mapBoxURL = "//api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWp3eW55YXJkIiwiYSI6ImNrM3Q5cDB5ZDAwbG0zZW82enhnamFoN3cifQ.6tHRp0DztZanCDTnEuZJlg";
    super(props);
    const user = this.getUser();
    const loginModal = this.getLoginModal(user);
    const projects =  this.getProjects();

    this.state = {
      location: {
        lat: -41.2728,
        lng: 173.2995,
      },
      host: this.getHost(),
      token: Cookies.get('token'),
      login: user,
      loginModal: loginModal,
      zIndex: 900,
      //tileServer: "//api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWp3eW55YXJkIiwiYSI6ImNrM3Q5cDB5ZDAwbG0zZW82enhnamFoN3cifQ.6tHRp0DztZanCDTnEuZJlg",
      osmThumbnail: "satellite64.png",
      mode: "map",
      zoom: 8,
      index: null,
      centreData: [],
      objData: [],
      fault: [],
      priority: [],
      sizes: [],
      photos: [],
      currentPhoto: null,
      currentFault: [],
      layers: [],
      bounds: {},
      icon: this.getCustomIcon(),
      show: false,
      showLogin: false,
      showContact: false,
      showTerms: false,
      showAbout: false,
      modalPhoto: null,
      popover: false,
      filterModal: false,
      activeSelection: "Fault Type",
      photourl: null,
      amazon: null,
      user: null,
      password: null,
      projectArr: projects,
      faultClass: [],
      faultTypes: [],
      pageActive: 0,
      checkedFaults: [],
      checked: false,
      activeProject: null,
      activeLayers: [],
      clearDisabled: true
    };
    
  }

  getHost() {
    if (process.env.NODE_ENV === "development") {
      return "localhost:5000";
    } else if (process.env.NODE_ENV === "production") {
      return "osmium.nz";
    } else {
      return "localhost:5000"
    }
   }

  componentDidMount() {
    // Call our fetch function below once the component mounts
    this.callBackendAPI()
    .catch(err => alert(err));
    console.log(process.env.NODE_ENV);
  }

  componentDidUpdate() {   
  }

  callBackendAPI = async () => {
    const response = await fetch('http://' + this.state.host + '/api'); 
    const body = await response.json();
    console.log(body.express);
    if (response.status !== 200) {
      alert(body);   
      throw Error(body.message) 
    }
    return body;
  };

  getProjects() {
    let cookie = Cookies.get('projects');
    if (cookie === undefined) {
      return [];
    } else {
      return JSON.parse(cookie);
    }    
  }
  /**
   * Checks if user has cookie. If not not logged in.
   * Returns username in cookie if found else 'Login'
   */
  getUser() {
    let cookie = Cookies.get('user');
    if (cookie === undefined) {
      return "Login";
    } else {
      return cookie;
    }    
  }

  getLoginModal(user) {
    if (user === "Login") {
      return (e) => this.clickLogin(e);
    } else {
      return (e) => this.logout(e);
    }
  }

  getCustomIcon(data, zoom) {
    //console.log("data" + data);
    let icon = null;
    const size = this.getSize(zoom);
    if (data === "5") {
      icon = L.icon({
      iconUrl: 'CameraSpringGreen_16px.png',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      });
    } else if (data === "4") {
      icon = L.icon({
      iconUrl: 'CameraOrange_16px.png',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      });      
    } else if (data === "3") {
      icon = L.icon({
      iconUrl: 'CameraLemon_16px.png',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      });
    } else  {
      icon = L.icon({
      iconUrl: 'CameraSpringGreen_16px.png',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      });
    }  
    return icon;
  }

  /**
   * returns the current icon size when zoom level changes
   * @param {the current zoom level} zoom 
   */
  getSize(zoom) {
    if (zoom < 10) {
      return 4;
    } else if (zoom >= 10 && zoom <= 14) {
      return 10;
    } else if (zoom > 14 && zoom <= 16) {
      return 16;
    } else if  (zoom > 16 && zoom <= 18){
      return 20;
    } else {
      return 32;
    }
  }

  /**
   * Adds db data to various arrays and an object. Then sets state to point to arrays. 
   * @param {data retreived from database} data
   */

  async addMarkers(data) {
    let objData = [];
    for (var i = 0; i < data.length; i++) {
      let obj = {};
      const position = JSON.parse(data[i].st_asgeojson);
      const lng = position.coordinates[0];
      const lat = position.coordinates[1];
      let latlng = L.latLng(lat, lng);
      obj = {
        roadid: data[i].roadid,
        carriage: data[i].carriagewa,
        location: data[i].location,
        fault: data[i].fault,
        size: data[i].size,
        priority: data[i].priority,
        photo: data[i].photoid,
        datetime: data[i].faulttime,
        latlng: latlng
      };
      objData.push(obj);    
    }
    this.setState({objData: objData});
  }

  addCentrelines(data) {
    let lineData = [];
    console.log(data.length);
    for (var i = 0; i < data.length; i++) {
      const linestring = JSON.parse(data[i].st_asgeojson); 
      if(linestring !== null) {
        var points = [];
        var segment = linestring.coordinates[0];
        for (var j = 0; j < segment.length; j++) {
          var point = segment[j];
          let latlng = L.latLng(point[1], point[0]);
          points.push(latlng);
        }     
      }
      lineData.push(points);
    }
    this.setState({centreData: lineData});
  }

  /**
   * 
   * @param {the number to pad} n 
   * @param {the amount of pading} width 
   * @param {digit to pad out number with (default '0'} z 
   * @return {the padded number (string)}
   */
  pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

  //EVENTS
  /**
   * fires when user scrolls mousewheel
   * param - e the mouse event
   **/
  onZoom(e) {
    this.setState({zoom: e.target.getZoom()});
    this.setState({bounds: e.target.getBounds()});
  }

  /**
   * toogles between satellite and map view by swapping z-index
   * @param {the control} e 
   */
  toogleMap(e) {
    if (this.state.mode === "map") {
      this.setState({zIndex: 1000});
      this.setState({mode: "sat"});
      this.setState({osmThumbnail: "map64.png"});
    } else {
      this.setState({zIndex: 900});
      this.setState({mode: "map"});
      this.setState({osmThumbnail: "satellite64.png"})
    }
  }

  /**
   * Fired when user clciks photo on thubnail
   * @param {event} e 
   */
  clickImage(e) {    
    this.setState({show: true});
    let photo = this.getFault(this.state.index, 'photo');
    this.setState({currentPhoto: photo});
  }

  getPhoto(direction) {
    let photo = this.state.currentPhoto;
    let intSuffix = (parseInt(photo.slice(photo.length - 5, photo.length)));
    let n = null;
    if (direction === "prev") {
      n = intSuffix - 1;
    } else {
      n = intSuffix + 1;
    }
    let newSuffix = this.pad(n, 5);
    let prefix = photo.slice(0, photo.length - 5);
    let newPhoto = prefix + newSuffix;
    this.setState({currentPhoto: newPhoto});
    return newPhoto;
  }

  clickPrev(e) {
  const newPhoto = this.getPhoto("prev");
  console.log(newPhoto);
  this.setState({currentPhoto: newPhoto});
	const url = this.state.amazon + newPhoto + ".jpg";
  this.setState({photourl: url});
  }
  
  clickNext(e) {
  const newPhoto = this.getPhoto("next");
  this.setState({currentPhoto: newPhoto});
  const url = this.state.amazon + newPhoto + ".jpg";
	this.setState({photourl: url});
  }

  clickMarker(e) {
    let marker = e.target;
    const index = marker.options.index;
    this.setState({index: index});
    this.setState({popover: true});
  }

  clearCache() {
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('projects');
    this.setState({login: "Login"});
    this.setState({loginModal: (e) => this.clickLogin(e)});
    this.setState({activeProject: null})
    this.setState({projectArr: []});
    this.setState({checkedFaults: []});
    this.setState({objData: []});
  }

  async logout(e) {
    const response = await fetch('http://' + this.state.host + '/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
      })
    });
    const body = await response.json();
    //console.log(response);
    if (response.status !== 200) {
      throw Error(body.message) 
    } 
    this.clearCache();
    //this.render();
  }

  async login(e) {
    this.setState({showLogin: false});
    const response = await fetch('http://' + this.state.host + '/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.userInput.value,
        key: this.passwordInput.value
      })
    });
    const body = await response.json();
    console.log(body);
    if (response.status !== 200) {
      throw Error(body.message) 
    } 
    
    if (body.result) {
      console.log("Login succeded");
      Cookies.set('token', body.token, { expires: 7 })
      Cookies.set('user', body.user, { expires: 7 })
      this.setState({login: body.user});
      this.setState({token: body.token});
      this.setState({loginModal: (e) => this.logout(e)}); 
      //console.log(body.projects);     
      this.buildProjects(body.projects);   
    } else {
      console.log("Login failed");
    }  
  }

  buildProjects(projects) {
    
    let prj = []
    for(var i = 0; i < projects.length; i += 1) {
      prj.push(projects[i]);
    }
    console.log(prj);
    Cookies.set('projects', JSON.stringify(prj), { expires: 7 })
    this.setState({projectArr: prj});
  }

  /**
   * 
   * @param {event} e 
   */
  loadLayer(e) {
    this.setState({activeProject: e.target.attributes.code.value});
    for (var i = 0; i < this.state.projectArr.length; i += 1) {
      if (this.state.projectArr[i].code === e.target.attributes.code.value) {
        let project = {code: this.state.projectArr[i].code, description: this.state.projectArr[i].description, date: this.state.projectArr[i].date}
        this.setState({amazon: this.state.projectArr[i].amazon});
        this.state.activeLayers.push(project);
      }
    }
    this.filterLayer(e.target.attributes.code.value);  
    
  }

  removeLayer(e) {
    console.log(e.target.attributes.code.value);
    console.log(this.state.activeLayers);
    let layers = this.state.activeLayers;
    for(var i = 0; i < layers.length; i += 1) {
     
      if (e.target.attributes.code.value === layers[i].code) {
        console.log(layers[i]);
        layers.splice(i, 1);
        break;
      }
     
    }
    //TODO clear the filter
    this.setState({activeLayers: layers});
  }


  async filterLayer(project) {
    if (this.state.login !== "Login") {
      const response = await fetch('http://' + this.state.host + '/layer', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.checkedFaults   
      })
    })
    if (response.status !== 200) {
      console.log(response.status);
    } 
    const body = await response.json();
    await this.addMarkers(body);
    } else {
      
    }    
  }

  submitFilter(e) {
    this.setState({filterModal: false});
    this.filterLayer(this.state.activeProject);

  }

  async loadCentreline(e) {
    if (this.state.login !== "Login") {
        const response = await fetch('http://' + this.state.host + '/roads', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: "900",
          menu: e.target.id,
          user: this.state.login
        })
      })
      if (response.status !== 200) {
        console.log(response.status);
      } 
      const body = await response.json();
      await this.addCentrelines(body);
    } else {
      
    }    
  }

  async loadFilters() {
    if (this.state.login !== "Login") {
      const response = await fetch('http://' + this.state.host + '/class', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login
        })
      })
      if (response.status !== 200) {
        console.log(response.status);
      } 
      const classes = await response.json();
      this.setState({faultClass: classes});
      this.getFaultTypes(this.state.faultClass[0].code);
    }
  }

  async getFaultTypes(cls) {
    //console.log("type: " + cls);
    if (this.state.login !== "Login") {
      const response = await fetch('http://' + this.state.host + '/faults', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login,
          type: cls
        })
      })
      if (response.status !== 200) {
        console.log(response.status);
      } 
      const faults = await response.json();
      faults.map(obj => obj["type"] = cls)
      //console.log(faults);
      this.setState({faultTypes: faults});
    }
  }

  clickLogin(e) {
    this.setState({showLogin: true});   
  }

  clickAbout(e) {
    this.setState({showAbout: true});  
  }

  clickTerms(e) {
    this.setState({showTerms: true});  
  }

  clickContact(e) {
    this.setState({showContact: true});  
  }

  clickClose(e) {
    this.setState({showContact: false});
    this.setState({showAbout: false});    
    this.setState({showTerms: false});    
  }

  clickPage(index) {
    this.setState({pageActive: index});
    this.getFaultTypes(this.state.faultClass[index].code);
  }

  changeCheck(e) {
    //if checked true we are adding values to arr
    let arr = this.state.checkedFaults;
    if (e.target.checked) {
      arr.push(e.target.id);                
    } else {
      for (var i = 0; i < arr.length; i += 1) {
        if (e.target.id === arr[i]) {
          arr.splice(i, 1);
          break;
        }
      }
    }  
    this.setState({checkedFaults: arr});
  }

/**
 * checks if each fault is checked by searching checkedFault array
 * @param {the id of the checkbox i.e. fault type} value 
 * @return {}
 */
  isChecked(value) {
    for (var i = 0; i < this.state.checkedFaults.length; i += 1) {
      if (value === this.state.checkedFaults[i]) {
        return true;
      }     
    }
    return false;
  }

  /**
   * called when photoviewer closed
   */
  closeModal() {
    this.setState({show: false});
    this.setState({popover: false});
  }

  clickFilter(e) {
    this.setState({index: null});
    this.setState({filterModal: true});
    this.loadFilters();
  }

  /**
   * clear checked fault array 
   * @param {the button} e 
   */
  clearFilter(e) {
    this.setState({checkedFaults: []});
  }

  // setDisplay(e) {
  //   if(e.target.id === "priority") {
  //     this.setState({activeSelection: "Priority"});
  //   } else {
  //     this.setState({activeSelection: "Fault Type"});
  //   }
  // }

  /**
   * returns a random hex color
   */
  getColor() {
    return '#' +  Math.random().toString(16).substr(-6);
  }
/**
 * gets the requested attribute from the fault object array
 * @param {the index of marker} index 
 * @param {the property of the fault} attribute 
 */
  getFault(index, attribute) {
    //console.log(index);
    if (this.state.objData.length !== 0 && index !== null) {
      switch(attribute) {
        case "fault":
          return  this.state.objData[index].fault;
        case "priority":        
          return  this.state.objData[index].priority;
        case "location":
          return  this.state.objData[index].location;
        case "size":
          return  this.state.objData[index].size;
        case "datetime":
          return  this.state.objData[index].datetime;
        case "photo":
          return  this.state.objData[index].photo;
        default:
          return null;
      }
    } else {
      return null;
    }
  }

  tableLoad(e) {
    console.log(e.target);
  }

  closePhotoModal(e) {
   
    this.setState({show: false});
  }

  clickGroup(e) {
    console.log("click");
  }
  //RENDER

  render() {
    //console.log("render");
    const centre = [this.state.location.lat, this.state.location.lng];
    const { fault } = this.state.fault;
    const { photo } = this.state.photos;  

    const CustomTile = function CustomTile (props) {
        return (
            <TileLayer className="mapLayer"
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors and Chat location by Iconika from the Noun Project"
            url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />
      );
    }
    const CustomNav = function customNav(props) {    
      if (props.title === 'Login') {
        return (
          <Nav className="ml-auto">
            <Nav.Link  id="Login" href="#login" onClick={props.onClick}>{props.title} </Nav.Link>
          </Nav>);
      } else {
        return(
        <Nav className="ml-auto"><NavDropdown className="navdropdown" title={props.title} id="basic-nav-dropdown">
          <NavDropdown.Item className="navdropdownitem" href="#login"  onClick={props.onClick}>Logout</NavDropdown.Item>
        </NavDropdown></Nav>);
      }
    }

    const LayerNav = function LayerNav(props) {
      const loadLayer = props.loadLayer;
      const clickFilter = props.clickFilter;
      const removeLayer= props.removeLayer;
      if (props.project !== null) {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
            <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} onClick={loadLayer}/>
            <NavDropdown.Divider />
            {/* <NavDropdown.Item className="navdropdownitem" href="#centreline" onClick={(e) => this.removeLayer(e)}>Remove Layer </NavDropdown.Item>
            <NavDropdown.Divider /> */}
            <CustomMenu title="Remove Layer" className="navdropdownitem" projects={props.layers} onClick={removeLayer}/>
            <NavDropdown.Divider />
            <NavDropdown.Item className="navdropdownitem" href="#centreline" onClick={(e) => this.loadCentreline(e)}>Add centreline </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item className="navdropdownitem" href="#filter"  onClick={(e) => clickFilter(e)}>Filter Layer</NavDropdown.Item>
          </NavDropdown>
        </Nav>
        );
      } else {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
            <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} onClick={(e) => loadLayer(e)}/>
            <NavDropdown.Divider />
            <NavDropdown.Item title="Remove Layer" className="navdropdownitem" href="#centreline" onClick={(e) => this.removeLayer(e)}>Remove layer</NavDropdown.Item>
            {/* <NavDropdown.Divider />
            <NavDropdown.Item className="navdropdownitem" href="#filter"  onClick={(e) => this.clickFilter(e)}>Filter Layer</NavDropdown.Item> */}
          </NavDropdown>
        </Nav>
        );
      }
    }

    const CustomMenu = function(props) {
      const p = props.projects;
      const loadLayer = props.onClick;
      if (p === undefined) {
        //console.log("Projects" + p);
        return ( 
          <NavDropdown.Item title={props.title} className="dropdownitem">Add Layers
          </NavDropdown.Item>
          );
      } else if(p.length === 0) {
        return ( 
          <NavDropdown.Item title={props.title} className="dropdownitem">Add Layers
          </NavDropdown.Item>
          );  
      } else {  
        return (        
          <NavDropdown title={props.title} className="navdropdownitem" drop="right">
          {props.projects.map((value, index) =>      
            <NavDropdown.Item className="navdropdownitem"
              key={`${index}`}
              index={index}
              title={value.code}
              code={value.code}
              onClick={props.onClick}>
                {value.description + " " + value.date}
            </NavDropdown.Item>
          )}
          <NavDropdown.Divider />
          </NavDropdown>
          );
      }
    }

    return (   
      <>     
        <div>
          <Navbar bg="light" expand="lg"> 
            <Navbar.Brand href="#home">
            <img
                src="logo.png"
                width="122"
                height="58"
                className="d-inline-block align-top"
                alt="logo"
              />
              </Navbar.Brand>
              <LayerNav project={this.state.activeProject} projects={this.state.projectArr} layers={this.state.activeLayers} removeLayer={(e) => this.removeLayer(e)} loadLayer={(e) => this.loadLayer(e)} clickFilter={(e) => this.clickFilter(e)}></LayerNav>
            <Nav>
              <NavDropdown className="navdropdown" title="Help" id="basic-nav-dropdown">
                <NavDropdown.Item className="navdropdownitem" href="#terms" onClick={(e) => this.clickTerms(e)} >Terms of Use</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" href="#contact" onClick={(e) => this.clickContact(e)} >Contact</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" id="Documentation" href="#documentation" onClick={(e) => this.documentation(e)}>Documentation</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item className="navdropdownitem" href="#about" onClick={(e) => this.clickAbout(e)} >About</NavDropdown.Item>             
              </NavDropdown>         
            </Nav>
            <CustomNav className="navdropdown" title={this.state.login} onClick={this.state.loginModal} />
          </Navbar>         
        </div>      
        <div className="map">
        <Map       
          ref={(ref) => { this.map = ref; }}
          className="map"
          fault={fault}
          photo={photo}
          worldCopyJump={true}
          boxZoom={true}
          center={centre}
          zoom={this.state.zoom}
          onZoom={(e) => this.onZoom(e)}>
          <TileLayer className="mapLayer"
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors and Chat location by Iconika from the Noun Project"
            url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
            zIndex={999}
          />
          {/* <NavDropdown className="displaytype" id="dropdown-basic-button" title={this.state.activeSelection}>
            <Dropdown.Item id="priority" href="#filterpriority" onClick={(e) => this.setDisplay(e)}>Priority</Dropdown.Item>
            <Dropdown.Item id="type" href="#filtertype" onClick={(e) => this.setDisplay(e)}>Fault type</Dropdown.Item>
          </NavDropdown> */}
          <ScaleControl/>
          <Image className="satellite" src={this.state.osmThumbnail} onClick={(e) => this.toogleMap(e)} thumbnail={true}/>
          <LayersControl position="topright">
          {this.state.activeLayers.map((layer, index) => 
            <LayersControl.Overlay  key={`${index}`} checked name={layer.description + " " + layer.date}>
              <LayerGroup >
              {this.state.objData.map((obj, index) =>          
                <Marker 
                  key={`${index}`}
                  index={index}
                  data={fault}
                  photo={photo}
                  position={obj.latlng} 
                  icon={this.getCustomIcon(this.getFault(index, 'priority'), this.state.zoom)}
                  draggable={false} 
                  onClick={(e) => this.clickMarker(e)}				  
                  >
                  <Popup className="popup">
                  <div>
                    <p className="faulttext">
                      <b>{"Type: "}</b> {this.getFault(index, 'fault')} <br></br> <b>{"Priority: "} </b> {this.getFault(index, 'priority')} <br></br><b>{"Location: "} </b> {this.getFault(index, 'location')}
                    </p>
                    <div>
                    <Image className="thumbnail" src={this.state.amazon + this.getFault(index, 'photo') + ".jpg"} photo={photo} onClick={(e) => this.clickImage(e)} thumbnail={true}></Image >
                    </div>          
                  </div>
                  </Popup>  
                </Marker>
                )}     
              </LayerGroup>
            </LayersControl.Overlay>
          )}
          </LayersControl>
          {this.state.centreData.map((latlngs, index) => 
          <Polyline 
            key={`${index}`}
            weight={3}
            //color={'blue'} 
            color={this.getColor()}
            smoothFactor={3}
            positions={latlngs}>
          </Polyline>
          )}        
      </Map>   
      </div>
      <Modal className="filterModal" show={this.state.filterModal} size={'lg'} centered={true}>
        <Modal.Header>
          <Modal.Title>Filter</Modal.Title><br></br>
          <Pagination size="sm">
            {this.state.faultClass.map((value, index) =>        
              <Pagination.Item  key={`${index}`} className={"page-item"} active={index === this.state.pageActive} onClick={() => this.clickPage(index)}>{value.description}
              </Pagination.Item>          
            )}
          </Pagination>
        </Modal.Header>
        <Modal.Body >	
        <Table size="sm" striped bordered hover>
          <thead>
          </thead> 
          <tbody>      
          {this.state.faultTypes.map((value, index) => 
            <tr className='tablerow' key={`${index}`}>
                <td>                   
                <input type="checkbox" id={value.fault} checked={this.isChecked(value.fault)} onChange={(e) => this.changeCheck(e)}/> {value.fault}
                </td>
            </tr>
          )}
          </tbody>
          </Table>
		    </Modal.Body>
        <Modal.Footer>
        <div><Button className="clear" variant="primary" type="submit" onClick={(e) => this.clearFilter(e)}>
            Clear Filter
          </Button>
          </div>
          <div><Button className="submit" variant="primary" type="submit" onClick={(e) => this.submitFilter(e)}>
            Filter
          </Button>
          </div>
          
        </Modal.Footer>
      </Modal>

      <Modal className="termsModal" show={this.state.showTerms} size={'md'} centered={true}>
        <Modal.Header>
          <Modal.Title><h2>Road Inspection Viewer</h2></Modal.Title>
        </Modal.Header>
        <Modal.Body >	
          By using this software you confirm you have read and agreed to the Onsite Developments Ltd. <a href={"https://osmium.nz/?#terms"}> Click for terms of use.</a><br></br>
          All data on this site from Land Information New Zealand is made available under a Creative Commons Attribution Licence.<br></br>
          <span >&copy; 2019 Onsite Developments Ltd. All rights reserved.</span><br></br>
		    </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" type="submit" onClick={(e) => this.clickClose(e)}>
              Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal className="aboutModal" show={this.state.showAbout} size={'md'} centered={true}>
        <Modal.Header>
          <Modal.Title><h2>About</h2> </Modal.Title>
        </Modal.Header>
        <Modal.Body >	
          <b>Road Inspection Version 1.0</b><br></br>
          Relased: 12/01/2020<br></br>
          Company: Onsite Developments Ltd.<br></br>
          Software Developer: Matt Wynyard <br></br>
          <img src="logo192.png" alt="React logo"width="24" height="24"/> React: 16.12.0<br></br>
          <img src="bootstrap.png" alt="Bottstrap logo" width="24" height="24"/> Bootstrap: 4.4.0<br></br>
          <img src="leafletlogo.png" alt="Leaflet logo" width="60" height="16"/>Leaflet: 1.6.0<br></br>
          <img src="reactbootstrap.png" alt="React-Bootstrap logo" width="24" height="24"/>React-bootstrap: 1.0.0-beta.16<br></br>
          React-leaflet: 2.6.0<br></br>
		    </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size='sm' type="submit" onClick={(e) => this.clickClose(e)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={this.state.showLogin} size={'sm'} centered={true}>
        <Modal.Header>
          <Modal.Title><img src="padlock.png" alt="padlock" width="42" height="42"/> Login </Modal.Title>
        </Modal.Header>
        <Modal.Body >	
        <Form>
          <Form.Group controlId="userName">
            <Form.Label>Username</Form.Label>
            <Form.Control type="text" placeholder="Enter username" ref={user => this.userInput = user} />
          </Form.Group>

          <Form.Group controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" ref={key=> this.passwordInput = key}/>
          </Form.Group>
          <Button variant="primary" type="submit" onClick={(e) => this.login(e)}>
            Submit
          </Button>
        </Form>	
		    </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      
      <Modal show={this.state.show} size={'xl'} >
        <Modal.Body className="photoBody">	
        <div className="container">
              <div className="row">
              <div className="col-md-6">
                  <b>{"Type: "}</b> {this.getFault(this.state.index, 'fault')} <br></br> <b>{"Priority: "} </b> {this.getFault(this.state.index, 'priority')} <br></br><b>{"Location: "} </b> {this.getFault(this.state.index, 'priority')}
              </div>
              <div className="col-md-6">
                <b>{"Size: "}</b> {this.getFault(this.state.index, 'size')} <br></br> <b>{"DateTime: "} </b> {this.getFault(this.state.index, 'datetime')}
              </div>
              </div>
            </div>	
		      <Image className="photo" src={this.state.amazon + this.state.currentPhoto + ".jpg"} data={fault} onClick={(e) => this.clickImage(e)} thumbnail></Image >		
		    </Modal.Body >
        <Modal.Footer>
		      <Button className="prev" onClick={(e) => this.clickPrev(e)}> 
            Previous
          </Button>
          <Button variant="primary" onClick={(e) => this.closePhotoModal(e)}>
            Close
          </Button>
          <Button className="next" variant="primary" onClick={(e) => this.clickNext(e)}>
            Next
          </Button>
        </Modal.Footer>
      </Modal>
      <div className="footer">
      </div>
      </>
    );
  }
}
export default App;

