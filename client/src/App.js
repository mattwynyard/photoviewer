import React from 'react';
import { Link } from "react-router-dom";
import { Map as LMap, TileLayer, Popup, ScaleControl, LayerGroup, Marker, Polyline}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Dropdown, InputGroup, FormControl, Modal, Button, Image, Form, Spinner, ToggleButtonGroup, ToggleButton}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import './ToolsMenu.css';
import CustomNav from './CustomNav.js';
import Cookies from 'js-cookie';
import './L.CanvasOverlay';
import GLEngine from './GLEngine.js';
import './PositionControl';
import './MediaPlayerControl';
import AntDrawer from './Drawer.js';
import DynamicDropdown from './DynamicDropdown.js';
import CustomModal from './CustomModal.js';
import PhotoModal from './PhotoModal.js';
import VideoCard from './VideoCard.js';
import ArchivePhotoModal from './ArchivePhotoModal.js';
import {pad, formatDate, calcGCDistance} from  './util.js';
import {SearchBar} from './components/searchBar.js'


const DIST_TOLERANCE = 20; //metres 

const DefaultIcon = L.icon({
  iconUrl: './OpenCamera20px.png',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}); 

class App extends React.Component {

  constructor(props) {
    super(props);
    this.customNav = React.createRef();
    this.menu = React.createRef();
    this.customModal = React.createRef();
    this.search = React.createRef();
    this.photoModal = React.createRef();
    this.archivePhotoModal = React.createRef();
    this.videoModal = React.createRef();
    this.videoCard = React.createRef();
    this.toolsRef = React.createRef();
    this.antdrawer = React.createRef();
    this.searchRef = React.createRef(this);
    this.glpoints = null;
    this.vidPolyline = null;
    this.state = {
      location: {
        lat: -41.2728,
        lng: 173.2995,
      },
      latitude: null,
      longtitude: null,
      high : true,
      med : true,
      low : true,
      admin : false,
      ruler: false,
      rulerOrigin: null,
      rulerPolyline: null,
      rulerDistance: 0,
      filter: [], //filter for db request
      priorityDropdown: null,
      priorityMode: "Priority", //whether we use priority or grade
      reverse: false,
      priorities: [], 
      ages: [],
      filterDropdowns: [],
      filterPriorities: [],
      filterAges: [],
      host: this.getHost(),
      token: Cookies.get('token'),
      login: this.getUser(),
      loginModal: this.getLoginModal(this.getUser()),
      zIndex: 900,
      key: process.env.REACT_APP_MAPBOX,
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      osmThumbnail: "satellite64.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
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
      archiveMarker: [],
      carMarker: [], //position of current image in video
      layers: [],
      bounds: {},
      show: false,
      showVideo: false,
      showRuler: false,
      showLogin: false,
      showContact: false,
      showTerms: false,
      showAbout: false,
      showAdmin: false,
      modalPhoto: null,
      popover: false,
      activeSelection: "Fault Type",
      photourl: null,
      amazon: null,
      user: this.getUser(),
      password: null,
      projects: this.getProjects(), //all foootpath and road projects for the user
      faultClass: [],
      activeProject: null,
      activeLayers: [], //layers displayed on the
      activeLayer: null, //the layer in focus
      bucket: null,
      clearDisabled: true,
      message: "",
      lineData: null,
      mouse: null,
      coordinates: null, //coordinates of clicked marker
      glpoints: null,
      selectedIndex: null,
      mouseclick: null,
      objGLData: [],
      selectedGeometry: [],
      selectedCarriage: [],
      photoArray: null,
      selectedStatus: null,
      projectMode: null, //the type of project being displayed footpath or road     
      newUser: null,
      newPassword: null,
      search: null,
      district: null,
      spinner: false,
      isArchive: false, //true when doing full photo search
      isVideo: false, //true when doing full photo search
      hasVideo: false,
      toolsRadio: null,
      activeCarriage: null, //carriageway user has clicked on - leaflet polyline
    };   
  }

  componentDidMount() {
    this.customNav.current.setTitle(this.state.user);
    this.customNav.current.setOnClick(this.state.loginModal);
    //L.DomEvent.disableClickPropagation(this.search.current);
    if (this.state.login === "Login") {
      this.callBackendAPI()
      .catch(err => alert(err));
    }
    this.leafletMap = this.map.leafletElement;
    this.initializeGL();
    this.addEventListeners(); 
    this.customModal.current.delegate(this);
    this.photoModal.current.delegate(this);
    this.archivePhotoModal.current.delegate(this);
    this.rulerPolyline = null;
    this.distance = 0;
    // if(this.glpoints !== null) {
    //   console.log(this.glpoints.length)
    //   this.GLEngine.redraw(this.glPoints, this.glLines, true);
    // } else {
    //   //console.log("not null");
    // }
    this.position = L.positionControl();
    this.leafletMap.addControl(this.position);
    this.geojsonLayer = L.geoJSON().addTo(this.leafletMap);
    this.imageoverlay = L.imageOverlay
    L.Marker.prototype.options.icon = DefaultIcon;
  }

  componentDidUpdate() {   

  }

  componentWillUnmount() {
    console.log("unmount");
    if(this.state.glpoints === null) {
      //console.log("null");
    } else {
      console.log("not null");
      this.glpoints = this.state.glpoints;
    }
   
  }

  initializeGL() {
    this.GLEngine = new GLEngine(this.leafletMap); 
    this.GLEngine.setAppDelegate(this);
  }
  
  /**
   * 
   * @param {int - calculates the index from r,g,b color} color 
   */
  getIndex(color) { 
    console.log(color)
    return color[0] + color[1] * 256 + color[2] * 256 * 256 + color[3] * 256 * 256 * 256;
  }

  /**
   * Called from drawing callback in L.CanvasOverlay by delegate
   * Sets the selected point and redraw
   * @param {the point the user selected} index 
   */
  setIndex(index) {
    if (index !== 0) {
      this.setState({selectedIndex: index});
      this.setState({selectedGeometry: [this.state.objGLData[index - 1]]}); 
      let bucket = this.getGLFault(index - 1, 'inspection');
      if (this.state.projectMode === "road") {
        if (bucket !== null) {
          let suffix= this.state.amazon.substring(this.state.amazon.length - 8,  this.state.amazon.length - 1);
          if (suffix !== bucket) {
            let prefix = this.state.amazon.substring(0, this.state.amazon.length - 8);
            console.log(prefix + bucket + "/")
            this.setState({amazon: prefix + bucket + "/"});
          }
        }
      } else {
      }    
    } else {//user selected screen only - no marker
      this.setState({selectedIndex: null});
      this.setState({selectedGeometry: []});
    }
    this.GLEngine.redraw(this.GLEngine.glPoints, this.GLEngine.glLines, false);
  }

 /**
 * Loops through json objects and extracts fault information
 * Builds object containing fault information and calls redraw
 * @param {JSON array of fault objects received from db} data 
 * @param {String type of data ie. road or footpath} type
 *  @param {Boolean zoom to extents when data loads} zoom
 */
  addGLGeometry(points, lines, type) {
    this.minMaxLine = this.GLEngine.minMaxLineSize();
    this.minMaxPoint = this.GLEngine.minMaxPointSize();
    const priorites = this.setPriorityObject();
    let glPoints = this.GLEngine.buildPoints(points, type, priorites); 
    //let glThinLines = this.GLEngine.drawThinLines(lines, type, priorites, glPoints.count);
    let glLines = this.GLEngine.drawLines(lines, type, priorites, glPoints.count);
    this.GLEngine.redraw(glPoints, glLines, true);
    // if (zoom) {
    //   this.centreMap(this.GLEngine.latlngs);
    // }
    let faults = glPoints.faults.concat(glLines.faults);
    this.setState({objGLData: faults});
    this.setState({glpoints: glPoints.points}); //Immutable reserve of original points
    this.setState({amazon: this.state.activeLayer.amazon});
    this.setState({spinner: false});
  }

  setPriorityObject() {
    let obj = {}
    if (this.state.reverse) {
      obj.high = 5;
      obj.med = 4;
      obj.low = 3;
    } else {
      obj.high = 1;
      obj.med = 2;
      obj.low = 3;
    }
    return obj;
  }

  /**
   * adds various event listeners to the canvas
   */
  addEventListeners() {
    this.leafletMap.addEventListener('click', (event) => {
      this.clickLeafletMap(event);
    })
    // this.leafletMap.addEventListener('dblclick', (event) => {
    //   this.dblClickLeafletMap(event);
    // });
    this.leafletMap.addEventListener('mousemove', (event) => {
      this.onMouseMove(event);
    });
    this.leafletMap.addEventListener('keydown', (event) => {
      this.onKeyPress(event.originalEvent);
    });
   
  }

  getPhotoBounds() {
    let mapBounds = this.leafletMap.getBounds();
    let southeast = mapBounds.getSouthEast();
    let center = this.leafletMap.getCenter();
    return L.latLngBounds(center, southeast);
  }

  /**
   * Handles click events on lealfet map
   * @param {event - the mouse event} e 
   */
  clickLeafletMap(e) {
    switch(this.antdrawer.current.getMode()) {
      case 'Video':
        if(this.vidPolyline === null) {  
          this.vidPolyline = this.getCarriage(e, calcGCDistance, this.getPhotos); 
          this.vidPolyline.then((line) => {
            this.setState({activeCarriage: line})
          });
        } else {
          this.vidPolyline.then((line) => {
            if (line === null) {
              this.vidPolyline = null;
              this.setState({activeCarriage: null});
            } else {
              if(line.options.color === "blue") {
                line.remove();
                this.vidPolyline = null;
                this.setState({activeCarriage: null})
                this.setState({carMarker: []});
              }
            }           
          });
        }      
        break;
      case 'Street':
        this.getArhivePhoto(e);
        break;
      case 'Ruler':
        let polyline = this.state.rulerPolyline;
      if (polyline == null) {
        let points = [];
        points.push(e.latlng);
        polyline = new L.polyline(points, {
          color: 'blue',
          weight: 4,
          opacity: 0.5 
          });
        polyline.addTo(this.leafletMap);
        this.setState({rulerPolyline: polyline});
      } else {
        let points = polyline.getLatLngs();
        points.push(e.latlng);
        polyline.setLatLngs(points);
      }
        break;
      case 'Map':
        console.log("map")
      if (this.state.glpoints !== null) {
        if (this.state.selectedCarriage !== null) {
        }
        this.setState({selectedIndex: null});
        this.setState({selectedGeometry: []});
        this.GLEngine.mouseClick = e;
        this.GLEngine.redraw(this.GLEngine.glPoints, this.GLEngine.glLines, false);
        console.log("redraw");
      }
        break;
      default:
        break;
    }
  }

  onMouseMove(e) {
    let lat = Math.round(e.latlng.lat * 100000) / 100000;
    let lng = Math.round(e.latlng.lng * 100000) / 100000;
    this.position.updateHTML(lat, lng);
    if (this.state.toolsRadio === 'ruler') {
      let polyline = this.state.rulerPolyline
      if (polyline !== null) {
        let points = polyline.getLatLngs();
        
        if (points.length === 1) {
          points.push(e.latlng);
          polyline.setLatLngs(points);
          this.calculateDistance(points);
        } else {
          points[points.length - 1] = e.latlng;
          polyline.setLatLngs(points);
          this.calculateDistance(points);
        }
      }   
    }
  }
  
  onKeyPress(e) {
    if (e.key === "x" || e.key === "X") {
      this.setState({ruler: false});
      let polyline = this.state.rulerPolyline;
      if (polyline !== null) {
        let points = polyline.getLatLngs();
        //console.log(points);
        points.pop();
        //console.log(points);
        polyline.setLatLngs(points);
        this.calculateDistance(points);
      }
    } else if (e.key === "Delete") {
      let polyline = this.state.rulerPolyline;
      if (polyline !== null) {
        let points = polyline.getLatLngs();
        if (points.length > 2) {
          points.splice(points.length - 2, 1);
        }
        polyline.setLatLngs(points);
      }
    } else if (e.key === "Escape") {
      let polyline = this.state.rulerPolyline;
      if (polyline !== null) {
        polyline.removeFrom(this.leafletMap);
        this.setState({rulerPolyline: null});
        this.setState({rulerDistance: 0});
      }   
    } else {
      //console.log(e.key);
    }
  }

  calculateDistance(points) {
    const R = 6371 * 1000; // metres
    let metres = 0;
    for (let i = 0; i < points.length - 1; i++) {
      let lat1 = points[i].lat * Math.PI/180; //in radians
      let lat2 = points[i + 1].lat * Math.PI/180;
      let lng1 = points[i].lng * Math.PI/180; //in radians
      let lng2 = points[i + 1].lng * Math.PI/180;
      let deltaLat = (lat2-lat1);
      let deltaLng = (lng2-lng1);
      let a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      let d = R * c; // in metres
      metres += d;
    }
    let total = Number((metres).toFixed(0));
    this.setState({rulerDistance: total});
  }

  getDistance() {
    return this.distance
  }

  callBackendAPI = async () => {
    const response = await fetch("https://" + this.state.host + '/api'); 
    const body = await response.json();
    if (response.status !== 200) {
      alert(body);   
      throw Error(body.message) 
    } else {
        this.buildProjects(body.projects);  
      }
    return body; 
  };

  /**
   * Gets the development or production host 
   * @return {string} the host name
   */
  getHost() {
    if (process.env.NODE_ENV === "development") {
      return "localhost:8443";
    } else if (process.env.NODE_ENV === "production") {
      return "osmium.nz";
    } else {
      return "localhost:8443";
    }
   }

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
  /**
   * Called when data layer is loaded
   * @param {array of late lngs} latlngs 
   */
  centreMap(latlngs) {
      if (latlngs.length !== 0) {
        let bounds = L.latLngBounds(latlngs);
        const map = this.map.leafletElement;
        map.fitBounds(bounds);
      } else {
        return;
      }
      let textbox = document.getElementById("search");
      if (this.state.search !== null) {
        textbox.value = "";
        this.setState({search: null});
      }
  }

  
  /**
   * toogles between satellite and map view by swapping z-index
   * @param {the control} e 
   */
  toogleMap(e) {
    if (this.state.login === "Login") {
      return;
    }
    if (this.state.mode === "map") {
      this.setState({zIndex: 1000});
      this.setState({mode: "sat"});
      this.setState({osmThumbnail: "map64.png"});
      //this.setState({url: "https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.pngraw?access_token=" + this.state.key});
      this.setState({url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=" + this.state.key});
      this.setState({attribution: 
        "&copy;<a href=https://www.mapbox.com/about/maps target=_blank>MapBox</a>&copy;<a href=https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors"})
    } else {
      this.setState({zIndex: 900});
      this.setState({mode: "map"});
      this.setState({osmThumbnail: "satellite64.png"});
      this.setState({url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"});
      this.setState({attribution: '&copy; <a href="https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors'})
    }
  }

  closePopup(e) {
    if (!this.state.show) {
      this.setState({selectedGeometry: []});
      this.setIndex(0); //simulate user click black screen
    } 
  }

  /**
   * Fired when user clciks photo on thumbnail
   * @param {event} e 
   */
  clickImage(e) {   
    let photo = this.getGLFault(this.state.selectedIndex - 1, 'photo');
    this.setState({currentPhoto: photo});
    this.photoModal.current.setModal(true, this.state.selectedGeometry, this.state.amazon, photo, this.state.login);
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
    let newSuffix = pad(n, 5);
    let prefix = photo.slice(0, photo.length - 5);
    let newPhoto = prefix + newSuffix;
    this.setState({currentPhoto: newPhoto});
    return newPhoto;
  }

  
  /**
   * resets to null state when user logouts
   */
  reset() {
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('projects');
    this.customNav.current.setOnClick((e) => this.clickLogin(e));
    this.customNav.current.setTitle("Login");
    this.setState({
      activeProject: null,
      projects: [],
      objData: [],
      login: "Login",
      priorites: [],
      objGLData: null,
      glpoints: [],
      activeLayers: [],
      activeLayer: null,
      filterDropdowns: [],
      ages: [],
      rulerPoints: [],
      filter: [], //filter for db request
      priorityDropdown: null, 
      filterPriorities: [],
      filterAges: [],
    }, function() {
      this.GLEngine.redraw([], [], false);
    })
  }

  /**
   * loops through project array received from db and sets
   * project array in the state. Sets project cookie
   * @param {Array} projects 
   */
  buildProjects(projects) {    
    let obj = {road : [], footpath: []}
    for(var i = 0; i < projects.length; i += 1) {
      if (projects[i].surface === "road") {
        //console.log(projects[i])
        obj.road.push(projects[i]);
      } else {
        obj.footpath.push(projects[i]);
      }
    }
    Cookies.set('projects', JSON.stringify(obj), { expires: 7 })
    this.setState({projects: obj});
  }

  /**
   * Get closest polyline to click and plots on map 
   * Starts movie of carriagway
   * @param {event} e 
   * @param {callback to calculate distance} distFunc 
   * @param {callback (this.getphotos) to get closest polyline to click} photoFunc 
   */
  async getCarriage(e, distFunc, photoFunc) {
    const response = await fetch("https://" + this.state.host + '/carriage', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
        project: this.state.activeLayer,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      })
    });
    let vidPolyline = null;
    const body = await response.json();
    //console.log(body);
    if (body.error == null) {
      let geojson = JSON.parse(body.data.geojson);
      let dist = distFunc(body.data.dist);
      if (dist < 40) {
        let latlngs = geojson.coordinates;
        let coords = [];
        latlngs.forEach( (coord) => {
          let latlng = [coord[1], coord[0]];
          coords.push(latlng);
        });
      
        vidPolyline = L.polyline(coords, {
          roadid: body.data.roadid,
          carriageid: body.data.id,
          direction: body.data.direction,
          label: body.data.label,
          color: 'blue',
          weight: 4,
          opacity: 0.5,
          host: this.state.host,
          login: {login: this.state.login, project: this.state.activeLayer, token: this.state.token}
        }).addTo(this.leafletMap);
        let parent = this;
        vidPolyline.on('click', function (e) {
          if (parent.state.video) {
            let host = vidPolyline.options.host;
            let login = vidPolyline.options.login;
            let side = parent.videoCard.current.getSide();
            let photo = parent.getVideoPhoto(e.latlng, host, login, side);
            photo.then((data) => {
              parent.videoCard.current.search(data.data.photo);
            });
          } else {
            this.setStyle({
              color: 'red',
              weight: 4
            });
            let carriage = vidPolyline.options.carriageid;
            let host = vidPolyline.options.host;
            let login = vidPolyline.options.login;
            let direction = vidPolyline.options.direction;
            let body = null;
            if (direction === 'B') {
              body = photoFunc(carriage, 'L', host, login);
            } else {
              body = photoFunc(carriage, null, host, login);
            }
            parent.setState({video: true});
            body.then((data) => {
              let photo = null;
              if (data.side === null) {
                photo = parent.getVideoPhoto(e.latlng, host, login, null);
              } else {
                photo = parent.getVideoPhoto(e.latlng, host, login, 'L');
              }
                        
              photo.then((initialPhoto) => {
                let found = false;
                if (data.data != null) {
                  for (let i = 0; i < data.data.length; i++) {
                    if(initialPhoto.data.photo === data.data[i].photo) {
                      parent.setState({photoArray: data.data});
                      parent.videoCard.current.initialise(true, parent.state.projectMode, initialPhoto.data.side, direction, parent.state.amazon, parent.state.photoArray, i);
                      found = true;
                      break;
                    }   
                  }
                }
                
                if (!found) {
                  alert("error loading video - Not found")
                }
              });
              
            });
          }         
        });
        return vidPolyline;  
      } else {
        return null;
      }
    } else {
      alert(response.status + " " + body.error); 
    }   
  }

  /**
   * Delegate function for fetching new photos if user changes side 
   * Updates video cards data array
   * @param {the id of the carriagway} carriageid 
   * @param {left 'L' or right 'R' side of road} side 
   */
  async changeSide(carriageid, erp, side) {
    let body = this.changeSides(carriageid, erp, side, this.state.host, this.state.activeCarriage.options.login);
    body.then((data) => {
      this.setState({photoArray: data.data});
      this.videoCard.current.refresh(data.data, data.newPhoto, side);
    });
  }

  /**
   * Returns photo name closest to user click 
   * @param {lat lng of user click} latlng 
   * @param {server} host 
   * @param {user login} login 
   */
  async getVideoPhoto(latlng, host, login, side) {
    const response = await fetch('https://' + host + '/archive', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
      body: JSON.stringify({
        user: login.login,
        project: login.project,
        lat: latlng.lat,
        lng: latlng.lng,
        side: side
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    } else {
      return body;
    }   
  }


  async getPhotos(carriageid, side, host, login) {
    const response = await fetch('https://' + host + '/photos', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
      body: JSON.stringify({
        user: login.login,
        project: login.project,
        carriageid: carriageid,
        side: side
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    } else {
      return body;
    }   
  }

  async changeSides(carriageid, erp, side, host, login) {
    const response = await fetch('https://' + host + '/changeSide', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
      body: JSON.stringify({
        user: login.login,
        project: login.project,
        carriageid: carriageid,
        side: side,
        erp: erp
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    } else {
      return body;
    }   
  }

  /**
   * sends request for photo based in lat/lng of click
   * @param {the click event i.e} e 
   */
  async getArhivePhoto(e) {
    //e.preventDefault();
    const response = await fetch("https://" + this.state.host + '/archive', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
        project: this.state.activeLayer,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      })
    });
    const body = await response.json();
    if (body.error == null) {
      let distance = calcGCDistance(body.data.dist);
      let assetID = null;
      if (this.state.activeLayer.surface === "footpath") {
        assetID = body.data.footpathid;
      } else {
        assetID = body.data.carriageway;
      }
      if (distance <= DIST_TOLERANCE) {
        let obj = {type: this.state.activeLayer.surface, address: body.data.address, amazon: this.state.amazon, carriage: assetID, photo: body.data.photo, 
        roadid: body.data.roadid, side: body.data.side, erp: body.data.erp, lat: body.data.latitude, lng: body.data.longitude};
        this.archivePhotoModal.current.setArchiveModal(true, obj);
        let arr = this.state.archiveMarker;
        let point = L.latLng(body.data.latitude, body.data.longitude);
        arr.push(point);
        this.setState({archiveMarker: arr});
      }
    } else {
      alert(response.status + " " + body.error); 
    }   
  }

  /**
   * sends request for photo based on
   * @param {the click event i.e} e 
   */
  async getArchiveData(photo) {
    const response = await fetch("https://" + this.state.host + '/archiveData', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
        project: this.state.activeLayer,
        photo: photo
      })
    });
    const body = await response.json();
    let assetID = null;
    if (body.error == null) {
      if (this.state.activeLayer.surface === "footpath") {
        assetID = body.data.footpathid;
      } else {
        assetID = body.data.carriageway;
      }
    let obj = {type: this.state.activeLayer.surface, address: body.data.address, amazon: this.state.amazon, carriage: assetID, photo: body.data.photo, 
    roadid: body.data.roadid, side: body.data.side, erp: body.data.erp, lat: body.data.latitude, lng: body.data.longitude};
    this.archivePhotoModal.current.setArchiveModal(true, obj);

    //this.reverseLookup(body.data); 
    let arr = this.state.archiveMarker;
    let point = L.latLng(body.data.latitude, body.data.longitude);
    arr.push(point);
    this.setState({archiveMarker: arr}); 
  } else {
    alert(response.status + " " + body.error); 
  }
}

  async logout(e) {
    e.preventDefault();
    const response = await fetch("https://" + this.state.host + '/logout', {
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
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);    
    } 
    this.reset();  
  }

  async login(e) {  
    e.preventDefault();
    const response = await fetch('https://' + this.state.host + '/login', {
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
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    }  
    if (body.result) {
      Cookies.set('token', body.token, { expires: 7 });
      Cookies.set('user', body.user, { expires: 7 });
      this.setState({login: body.user});
      this.setState({token: body.token}); 
      this.buildProjects(body.projects);   
      this.customNav.current.setTitle(body.user);
      this.customNav.current.setOnClick((e) => this.logout(e));
      this.setState({showLogin: false});
      this.setState({message: ""});
      if(this.state.login === 'admin') {
        this.setState({admin: true});
      }
    } else {
      this.setState({message: "Username or password is incorrect!"});
    }      
  }
  

  async getDistrict(project) {  
    await fetch('https://' + this.state.host + '/district', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json(); 
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else { 
            this.setState({district: body.district})
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }); 
  }
  /**
   * checks if layer loaded if not adds layer to active layers
   * calls fetch layer
   * @param {event} e 
   * @param {string} type - the type of layer to load i.e. road or footpath
   */
  async loadLayer(e, type) { 
    e.persist();
    this.setState({projectMode: type});
    for(let i = 0; i < this.state.activeLayers.length; i += 1) { //check if loaded
      if (this.state.activeLayers[i].code === e.target.attributes.code.value) {  //if found
        return;
      }
    }
    let projects = null;
    let project = e.target.attributes.code.value;   
    let dynamicDropdowns = [];
    await this.getSettings(project);
    this.antdrawer.current.setVideo(this.state.hasVideo);
    if (type === "road") {
      projects = this.state.projects.road;
      await this.loadFilters(project);    
      for (let i = 0; i < this.state.faultClass.length; i++) {
        let dropdown = new DynamicDropdown(this.state.faultClass[i].description);
        dropdown.setCode(this.state.faultClass[i].code);
        let result = await this.requestFaults(project, this.state.faultClass[i].code);
        dropdown.setData(result);
        dropdown.initialiseFilter();     
        dynamicDropdowns.push(dropdown);
      }
      this.rebuildFilter();
      await this.getDistrict(project);
    } else {
      projects = this.state.projects.footpath;
      this.setState({priorityMode: "Grade"});
      let filters = ["Asset", "Fault", "Type", "Cause"];
      for (let i = 0; i < filters.length; i++) {
        let dropdown = new DynamicDropdown(filters[i]);
        let result = await this.requestDropdown(project, filters[i]);
        //console.log(result);
        if (result != null) {
          dropdown.setData(result);
        }
        dropdown.initialiseFilter();    
        dynamicDropdowns.push(dropdown);
      }
      await this.getDistrict(project);
    }
    let layers = this.state.activeLayers;
    for (let i = 0; i < projects.length; i++) { //find project
      if (projects[i].code === e.target.attributes.code.value) {  //if found
        let project = {code: projects[i].code, description: projects[i].description, amazon: projects[i].amazon, 
          date: projects[i].date, surface: projects[i].surface, visible: true} //build project object
        this.setState({amazon: projects[i].amazon});
        layers.push(project);
        this.setState({activeLayer: project});
        //await this.buildView(project);
        break;
        }
    }
    this.setState(() => ({
      filterDropdowns: dynamicDropdowns,
      activeLayers: layers,
      activeProject: e.target.attributes.code.value,
      bucket: this.buildBucket(project)
    }), async function() { 
      await this.requestPriority(project);
      if (type === "road") {
        await this.requestAge(project); 
      }
      this.filterLayer(project, true); //fetch layer  
    });
  }

  async getSettings(project) {
    const response = await fetch("https://" + this.state.host + '/settings', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
      
      })
    });
    const body = await response.json();
    if (body.priority) {
      this.setState({priorityMode: "Priority"});
    } else {
      this.setState({priorityMode: "Grade"});
    }
    if (body.reverse) {
      this.setState({reverse: true});
    } else {
      this.setState({reverse: false});
    }
    if (body.video) {
      this.setState({hasVideo: true});
    } else {
      this.setState({hasVideo: false});
    }
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);    
    } 
  }

  async buildView(project) {
    const response = await fetch("https://" + this.state.host + '/view', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
      
      })
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);    
    } 
  }

  async requestDropdown(project, code) {
    let result = null
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/dropdown', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        code: code
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            result = body;   
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
    return result;
  }

  async requestFaults(project, code) {
    let result = null
    //if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/faults', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        code: code
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            result = body;     
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    //}
    return result;
  }

  async requestAge(project) {
      await fetch('https://' + this.state.host + '/age', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            this.buildAge(body.result);              
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }); 
    //}
  }

  async requestPriority(project) {
    //if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/priority', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          console.log(body);
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            this.buildPriority(body.priority);      
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }); 
    //}
  }

  buildAge(ages) {
    let arr = [];
    let arrb = [];
    if (ages[0].inspection === null) {
      let filter = [];
      this.setState({filterAges: filter});
      return;
    }
    for (let i = 0; i < ages.length; i++) {
      let inspection = ages[i].inspection; 
      if (inspection !== null) {
        arrb.push(inspection);       
        if(inspection === this.state.bucket ) {
          arr.push(formatDate(inspection));  
        } else {
          arr.push("pre-" + formatDate(this.state.bucket));  
        }
      }          
    }
    this.setState({filterAges: arrb})
    this.setState({ages: arr});
  }

  /**
   * Sets default bucket suffix for the project
   * @param {the current project} project 
   */
  buildBucket(project) {
    let bucket = project.split("_")[2];
    let month = bucket.substring(0, 2);
    let year = null;
    if (bucket.length === 4) {
      year = "20" + bucket.substring(2, 4)
    } else {
      year = bucket.substring(2, bucket.length);
    }
    return year + "_" + month;
  }

  buildPriority(priority) {
    let arr = [];
    let arrb = [];
    for (let i = 0; i < priority.length; i++) {
      if (priority[i] === 99) {
        arr.push("Signage");
        arrb.push(99);
      } else {
        arr.push(this.state.priorityMode + " " + priority[i])
        arrb.push(priority[i]);
      }
    }
    arr.sort();
    arr.push("Completed");
    arrb.push(98);
    this.setState({filterPriorities: arrb});
    this.setState({priorities: arr});
  }

  /**
   * 
   * @param {event} e  - the menu clicked
   */
  removeLayer(e) {
    this.setState({objGLData: null});
    this.setState({glpoints: []});
    this.GLEngine.redraw([], [], false);
    let layers = this.state.activeLayers;
    for(var i = 0; i < layers.length; i += 1) {     
      if (e.target.attributes.code.value === layers[i].code) {
        layers.splice(i, 1);
        break;
      }
    }
    //TODO clear the filter
    this.setState({priorities: []});
    this.setState({filter: []});
    this.setState({filterDropdowns: []})
    this.setState({filterPriorities: []})
    this.setState({activeLayers: layers}); 
    this.setState({activeLayer: null}); 
    this.setState({ages: layers}); 
    this.setState({district: null});    
  }

  getBody(project) {
    if (this.state.projectMode === "road") {
      return JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.filter,
        priority: this.state.filterPriorities,
        inspection: this.state.filterAges
      })   
    } else {
      let filterObj = [];

      for (let i = 0; i <  this.state.filterDropdowns.length; i++) {
        let obj = {name: this.state.filterDropdowns[i].name, filter: this.state.filterDropdowns[i].filter}
        filterObj.push(obj)
      }
      if (filterObj.length !==0) {
        return JSON.stringify({
          user: this.state.login,
          project: project,
          filter: this.state.filter,
          //TODO temp hack should be dymnic array to hold footpath filters
          priority: this.state.filterPriorities,
          assets: this.state.filterDropdowns[0].filter,
          faults: this.state.filterDropdowns[1].filter,
          types: this.state.filterDropdowns[2].filter,
          causes: this.state.filterDropdowns[3].filter})
      }
    }     
  }

  async sendData(project, data, endpoint) {
    if (this.state.login !== "Login") {
      console.log('https://' + this.state.host + endpoint);
      await fetch('https://' + this.state.host + endpoint, {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        data: data,
        project: project
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const result = await response.json();
          if (response.error != null) {
            alert(`Error: ${response.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {    
            if (endpoint === '/update') {
              this.filterLayer(this.state.activeProject, false);
            }
            alert(result.rows + '\n' + result.errors);
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });   
    }    
  }

/**
 * Fetches marker data from server using priority and filter
 * @param {String} project data to fetch
 */
  async filterLayer(project) {
    this.setState({spinner: true});
      let body = this.getBody(project);
      if (typeof body !== 'undefined') {
        await fetch('https://' + this.state.host + '/layer', {
          method: 'POST',
          headers: {
            "authorization": this.state.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: body
          }).then(async (response) => {
            if(!response.ok) {
              throw new Error(response.status);
            } else {
              const body = await response.json();
              console.log(body);
              if (body.error != null) {
                alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
                let e = document.createEvent("MouseEvent");
                await this.logout(e);
              } else {
                await this.addGLGeometry(body.points, body.lines, body.type);
              }     
            }
          }).catch((error) => {
            console.log("error: " + error);
            //alert(error);
            return;
          });   
        }    
      //}
      
  }

  async loadCentreline(e) {
    if (this.state.login !== "Login") {
        await fetch('https://' + this.state.host + '/roads', {
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
      .then(async(response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);  
        } else {
          await this.addCentrelines(body);   
        }
      })
      .catch((error) => {
      console.log("error: " + error);
      alert(error);
      return;
    });   
    }
  }

  async loadFilters(project) {
      if (this.state.projectMode === "footpath") {
        return;
      } else {
        await fetch('https://' + this.state.host + '/class', {
          method: 'POST',
          headers: {
            "authorization": this.state.token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: this.state.login,
            project: project
          })
        }).then(async (response) => {
          const body = await response.json();
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            this.setState({faultClass: body});
          }   
        })
        .catch((error) => {
          console.log("error: " + error);
          alert(error);
          return;
        }) 
       
      } 
  }

  async addNewUser(client, password) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/user', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "insert",
          user: this.state.login,
          client: client,
          password: password
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("User: " + client + " created")
          } else {
            alert("User: " + client + " failed to create")
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

  getClient = async () => {
    console.log("get client")
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/usernames', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "select",
          user: this.state.login,
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            console.log(body);
            this.customModal.current.setUsernames(body.usernames);
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

  selectProjects = async (client) => {
    console.log("get projects")
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/selectprojects', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "select",
          client: client,
          user: this.state.login,
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            console.log(body);
            //this.customModal.current.setUsernames(body.usernames);
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

  async deleteCurrentUser(client) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/user', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "delete",
          user: this.state.login,
          client: client,
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("User: " + client + " deleted")
          } else {
            alert("User: " + client + " not found")
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

  async deleteCurrentProject(project, parent) {
    console.log(project);
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/project', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login,
          type: "delete",
          project: project,
          parent: parent
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.parent) {
            alert(body.rows +  '\n Parent project deleted')
          }
            alert(body.rows)
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });
    }
  }

  async addNewProject(code, client, description, date, tacode, amazon, surface) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/project', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login,
          type: "insert",
          code: code,
          client: client,
          description: description,
          date: date,
          tacode: tacode,
          amazon: amazon,
          surface: surface
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("Project: " + code + " created")
          } else {
            alert("Project: " + code + "  failed to create")
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

  async updateStatusAsync(marker, status, date) {
    if (date === "") {
      date = null;
    }
    if (status === "active") {
      date = null;
    }
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/status', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login,
          project: this.state.activeProject,
          status: status,
          marker: marker,
          date: date
        })
      }).then(async (response) => {
        const body = await response.json();
        console.log(body);
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.rows != null) {
            this.filterLayer(this.state.activeProject);
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

  /**
   * Shows modal to update fault status
   * @param {event} e 
   */
  // clickUpdateFaultStatus(e) {
    
  //   if (this.state.activeLayers.length > 0) {
  //     this.customModal.current.setState({name: 'import'});
  //     this.customModal.current.setProject(this.state.activeLayers[0].code);
  //     this.customModal.current.setShow(true);
  //   } else {
  //     //Todo add alert
  //   }
    
  // }

  clickLogin(e) {
    e.preventDefault();
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

  /**
   * adds or removes fault to array  which keeps track of which faults are checked in the filter modal
   * @param {event} e 
   */
  clickCheck(e, value) {
    //if checked true we are adding values to arr
    if (value.filter.length <= 1 && e.target.checked) {
      return;
    }
    value.updateFilter(e.target.id, e.target.checked); 
    if (!e.target.checked) {
      value.setActive(true);
    }
    this.rebuildFilter();
  }

  clickActive(e, index) {
    e.target.checked ? this.state.filterDropdowns[index].setActive(false) : this.state.filterDropdowns[index].setActive(true);

  }

/**
 * checks if each fault is checked by searching checkedFault array
 * @param {the dropdown} value 
 * * @param {the index of the fault within the dropdown} index 
 * @return {}
 */
  isChecked(value, index) {
    return value.isChecked(value.data.result[index]);
  }

  isActive(value, index) {
    return this.state.filterDropdowns[index].isActive();
  }

  changeActive(e, index) {
    console.log(e.target);
  }

  /**
   * Copies the lat lng from photo modal to users clipboard
   * @param {*} e button lcick event
   * @param {*} latlng Leaflet latlng object
   */
  copyToClipboard(e, latlng) {
    e.preventDefault();
    const position = latlng.lat + " " + latlng.lng
    navigator.clipboard.writeText(position);
  }

  

  changeLayer(e) {
    console.log("redraw");
  }

  selectLayer(e, index) {
    console.log(this.state.activeLayers[index]);
    this.setState({activeLayer: this.state.activeLayers[index]});
  }
/**
 * Clears all the checkboxes and filter for that dropdown
 * @param {event} e 
 * @param {DynmaicDropdown} value 
 */
  onClear(e, value) {
    value.clearFilter();
  }

  /**
   * Checks is dropdown box is checked or unchecked
   * @param {DynmaicDropdown} value 
   */
  isInputActive(value) {
    return value.active
  }

  /**
 * Selects all the checkboxes and filter for that dropdown
 * @param {event} e 
 * @param {DynmaicDropdown} value 
 */
  onSelect(e, value) {
    value.initialiseFilter();
  }

  /**
   * Fires when user clicks apply button. 
   * @param {event} e 
   */
  clickApply(e) {
    this.filterLayer(this.state.activeProject, false);
  }

  clickSelect(e, value) {
    if (e.target.checked) {
      this.onClear(e, value);
      value.setActive(false);
    } else {
      this.onSelect(e, value);
      value.setActive(true);
    }
    this.rebuildFilter();
  }

  rebuildFilter() {
    let filter = [];
    for (let i = 0; i < this.state.filterDropdowns.length; i++) {
      for (let j = 0; j < this.state.filterDropdowns[i].filter.length; j++) {
        filter.push(this.state.filterDropdowns[i].filter[j]);
      }
    }
    this.setState({filter: filter})
  }

  clickAges(e, index) {
    let query = this.state.filterAges;
    let date = null;
    if (index === 1) {
      console.log(e.target.id);
      date = this.state.bucket;
    } else {
      date = '2020_02';
    }
    if (query.length === 1) {
      if (e.target.checked) {
        query.push(date);
      } else {
        e.target.checked = true; 
      }
    } else {
      if (e.target.checked) {
        query.push(date);
      } else {
        query.splice(query.indexOf(date), 1 );
      }
    }
    this.filterLayer(this.state.activeProject); //fetch layer  
  }

  /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
  clickPriority(e) {
    let query = this.state.filterPriorities;
    let priority = null;
    if (e.target.id === "Signage") {
      priority = 99;
    } else if (e.target.id === "Completed") {
      priority = 98;
    } else {
      let p = e.target.id.substring(e.target.id.length - 1, e.target.id.length)
      priority = parseInt(p);
    }
    if (query.length === 1) {
      if (e.target.checked) {
        query.push(priority);
      } else {
        e.target.checked = true;      
      }
    } else {
      if (e.target.checked) {
        query.push(priority);
      } else {     
        query.splice(query.indexOf(priority), 1 );
      }
    }
    this.setState({filterPriorities: query})
    this.filterLayer(this.state.activeProject, false);
  }

  clickRuler(e) {
    this.setState({ruler: true});
  }

  clickArchive(e) {
    if (this.state.isArchive) {
      this.setState({archiveMarker: []});
      this.setState({isArchive: false});
    } else {
      this.setState({isArchive: true});
    }
  }

  clickVideo() {
    console.log(this.state.isVideo);
    if (this.state.isVideo) {
      this.setState({isVideo: false});
    } else {
      this.setState({isVideo: true});
    }
    console.log(this.state.isVideo);
  }

  /**
   * Called from ToolsMenu component when user changes radio button
   * @param {radio button clicked} value 
   */
  clickToolsRadio(value) {
    console.log(value);
    this.setState({toolsRadio: value});
  }

  /**
   * Called when using opens or closes tools dropdown
   * @param {true/false} isOpen 
   */
  toggleTools(isOpen) {    
    if (!isOpen) {
      console.log(this.state.toolsRadio);
      this.setState({toolsRadio: null});
      if (this.state.rulerPolyline != null) {
        this.state.rulerPolyline.removeFrom(this.leafletMap);
        
        this.setState({rulerPolyline: null});
        this.setState({showRuler: false});
        this.setState({rulerDistance: 0});
        this.setState({ruler: false});
      }
    }
  }

  // async reverseLookup(data) {
  //   console.log(data);
  //   const response = await fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=" + data.latitude + "&lon=" 
  //    + data.longitude + "&addressdetails=1", {
  //     method: 'GET',
  //     credentials: 'same-origin',
  //     headers: {
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json',        
  //     },
  //   });  
  // }

  /**
   * Updates the string to searched
   * @param {event} e 
   */
  changeSearch(e) {
    this.setState({search: e.target.value});
  }

  /**
   * Breaks user input string into tokens on space character
   * Sends get request to nominatim server. Centres map on bounding box from response
   * @param {event} e - search button click
   */
  async clickSearch(e) {
    e.preventDefault();
    let tokens = null
    if (this.state.search !== null) {
      tokens = this.state.search.split(" ");
    }
    if(!tokens) return;
    let searchString = "";
    for (let i = 0; i < tokens.length; i++) {
      if (i !== tokens.length - 1) {
        searchString += tokens[i] + "+";
      } else {
        searchString += tokens[i];
      }
    }
    if (this.state.district !== null) {
      searchString += "," + this.state.district
    }
    const response = await fetch("https://nominatim.openstreetmap.org/search?q=" + searchString + "&countrycodes=nz&format=json&addressdetails=1", {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);    
    } 
    if (body.length !== 0) {
      if (body[0] !== "undefined" || body[0] !== "") {
        let latlng1 = L.latLng(parseFloat(body[0].boundingbox[0]), parseFloat(body[0].boundingbox[2]));
        let latlng2 = L.latLng(parseFloat(body[0].boundingbox[1]), parseFloat(body[0].boundingbox[3]));
        this.centreMap([latlng1, latlng2])
      }
    }
    
  }


  /**
 * gets the requested attribute from the fault object array
 * @param {the index of marker} index 
 * @param {the property of the fault} attribute 
 */
getGLFault(index, attribute) {
  if (this.state.selectedGeometry.length !== 0 && index !== null) {
    switch(attribute) {
      case "type":
        return  this.state.objGLData[index].type;
      case "fault":
        return  this.state.objGLData[index].fault;
      case "priority":        
        return  this.state.objGLData[index].priority;
      case "inspection":        
        return  this.state.objGLData[index].inspection;
      case "location":
        return  this.state.objGLData[index].location;
      case "width":
        return  this.state.objGLData[index].width;
      case "length":
        return  this.state.objGLData[index].length;
      case "datetime":
        return  this.state.objGLData[index].datetime;
      case "photo":
        return  this.state.objGLData[index].photo;
      case "repair":
          return  this.state.objGLData[index].repair;
      case "comment":
          return  this.state.objGLData[index].comment;
      case "latlng":
          return  this.state.objGLData[index].latlng;
      default:
        return this.state.objGLData[index]
    }
  } else {
    return null;
  }
}

// Admin

addUser(e) {
  this.customModal.current.setShow(true);
  this.customModal.current.setState({name: 'user'});
}

addProject(e) {
  this.customModal.current.setState({name: 'project'});
  this.customModal.current.setShow(true);

}

importData(e) {
  this.customModal.current.setState({name: 'import'});
  this.customModal.current.setShow(true);
}

fileLoaded(project, data, status) {
  this.customModal.current.setShow(false);
  if (status) {
    this.sendData(project, data, '/update');
  } else {
    this.sendData(project, data, '/import');
  }
}


createUser = (name, password) => {
  this.addNewUser(name, password);
  this.customModal.current.setShow(false);

}

deleteUser = (name) => {
  this.deleteCurrentUser(name);
  this.customModal.current.setShow(false);

}

deleteProject = (project, parent) => {
  console.log("delete")
  this.deleteCurrentProject(project, parent);
  this.customModal.current.setShow(false);

}

createProject = (code, client, description, date, tacode, amazon, surface) => {
  this.addNewProject(code, client, description, date, tacode, amazon, surface);
  this.customModal.current.setShow(false);

}

updateStatus(marker, status) {
  this.updateStatusAsync(marker, status);
}

  render() {
    const centre = [this.state.location.lat, this.state.location.lng];
    let mode = this.state.projectMode; 
    
    
    const LayerNav = function LayerNav(props) { 
      if (props.user === 'admin') {
        return (
          <Nav>       
          <NavDropdown className="navdropdown" title="Tools" id="basic-nav-dropdown">
              <NavDropdown.Item  
              className="adminitem" 
                title="Add New User" 
                onClick={props.addUser}>
              Manage User     
              </NavDropdown.Item>
              <NavDropdown.Divider />
            <NavDropdown.Item
              title="Add New Project" 
              className="adminitem" 
              onClick={props.addProject}>
              Manage Projects 
              </NavDropdown.Item>
              <NavDropdown.Divider /> 
            <NavDropdown.Item  
              title="Import" 
              className="adminitem" 
              projects={props.layers} 
              admin={props.admin}
              onClick={props.importData}>
              Import Data    
            </NavDropdown.Item>
            <NavDropdown.Divider />
          </NavDropdown>
        </Nav>
        );
      } else {
        if (props.layers.length > 0) {
          if(mode === "road") {
            return (
              <Nav>          
              <NavDropdown className="navdropdown" title="Projects" id="basic-nav-dropdown">
                <CustomMenu 
                  title="Add Roading Layer" 
                  className="navdropdownitem" 
                  type={'road'} 
                  projects={props.projects.road} 
                  onClick={props.loadLayer}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Add Footpath Layer" 
                  className="navdropdownitem" 
                  type={'footpath'} 
                  projects={props.projects.footpath} 
                  onClick={props.loadFootpathLayer}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Remove Layer" 
                  className="navdropdownitem" 
                  projects={props.layers} 
                  onClick={props.removeLayer}/>
                <NavDropdown.Divider />
              </NavDropdown>
            </Nav>
            );
          } else {
            return (
              <Nav>          
              <NavDropdown className="navdropdown" title="Projects" id="basic-nav-dropdown">
                <CustomMenu 
                  title="Add Roading Layer" 
                  className="navdropdownitem" 
                  type={'road'} 
                  projects={props.projects.road} 
                  onClick={props.loadLayer}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Add Footpath Layer" 
                  className="navdropdownitem" 
                  type={'footpath'} 
                  projects={props.projects.footpath} 
                  onClick={props.loadFootpathLayer}/>
                <NavDropdown.Divider />
                <CustomMenu 
                  title="Remove Layer" 
                  className="navdropdownitem" 
                  projects={props.layers} 
                  onClick={props.removeLayer}/>
                <NavDropdown.Divider />
              </NavDropdown>
            </Nav>
            );
          }
          
        } else {
          return (
            <Nav>          
            <NavDropdown className="navdropdown" title="Projects" id="basic-nav-dropdown">
              <CustomMenu 
                title="Add Roading Layer" 
                className="navdropdownitem" 
                type={'road'} 
                projects={props.projects.road} 
                layers={props.layers} 
                onClick={props.loadRoadLayer}/>
              <NavDropdown.Divider/>
              <CustomMenu 
                title="Add Footpath Layer" 
                className="navdropdownitem" 
                type={'footpath'}
                projects={props.projects.footpath} 
                layers={props.layers} 
                onClick={props.loadFootpathLayer}/>
            </NavDropdown>        
          </Nav>
          );
        }
      }
      
    }
    const CustomMenu = (props) => {
      if (typeof props.projects === 'undefined' || props.projects.length === 0) {
          return (  
            null  
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
              <NavDropdown.Divider />
            </NavDropdown.Item>
          )}
          </NavDropdown>
          );
      }
    }

    const CustomPopup = (props) => {
      let location = props.data.location;
      if (props.data.type === "footpath") {
        location = props.data.roadname;
      }
      return (
        <Popup className="popup" position={props.position}>
          <div>
            <p className="faulttext">
            <b>{"ID: "}</b>{props.data.id}<br></br>
              <b>{"Type: "}</b>{props.data.fault}<br></br>
              <b>{"Location: "}</b>{location}<br></br>
              <b>{"Date: "}</b>{props.data.datetime} 
            </p>
            <div>
              <Image className="thumbnail" 
                src={props.src}
                onClick={props.onClick} 
                thumbnail={true}>
              </Image >
            </div>          
          </div>
        </Popup>  
      );      
    }

    const CustomSVG = (props) => {
      if (!props.reverse) {
        if (props.value === "Grade 1" || props.value === "Priority 1") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="magenta" fill="magenta">
              <circle cx="5" cy="5" r="3" />
            </svg>
            );
        } else if (props.value === "Grade 2" || props.value === "Priority 2") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="darkorange" fill="darkorange">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Grade 3" || props.value === "Priority 3") {
          if (props.login === "chbdc") {
            return ( 
              <svg viewBox="1 1 10 10" x="16" width="16" stroke="yellow" fill="yellow">
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          } else {
            return ( 
              <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          }
        } else if (props.value === "Grade 5" || props.value === "Priority 5") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="rgb(0,204,204)" fill="rgb(0,204,204)">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Signage") {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="blue" fill="blue">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Completed") {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="grey" fill="grey" opacity="0.8">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          if (props.value === props.bucket) {
            return (
              <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} fill={props.color}>
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          } else {
            return (
              <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} opacity="0.4" fill={props.color}>
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          }
          
        }

      } else {
        if (props.value === "Grade 5" || props.value === "Priority 5") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="magenta" fill="magenta">
              <circle cx="5" cy="5" r="3" />
            </svg>
            );
        } else if (props.value === "Grade 4" || props.value === "Priority 4") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="darkorange" fill="darkorange">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Grade 3" || props.value === "Priority 3") {
          if (props.login === "chbdc") {
            return ( 
              <svg viewBox="1 1 10 10" x="16" width="16" stroke="yellow" fill="yellow">
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          } else {
            return ( 
              <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          }
          
        } else if (props.value === "Grade 2" || props.value === "Priority 2") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Grade 1" || props.value === "Priority 1") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="rgb(0,204,204)" fill="rgb(0,204,204)">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Signage") {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="blue" fill="blue">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else if (props.value === "Completed") {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="grey" fill="grey" opacity="0.8">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          if (props.value === props.bucket) {
            return (
              <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} fill={props.color}>
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          } else {
            return (
              <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} opacity="0.4" fill={props.color}>
                <circle cx="5" cy="5" r="3" />
              </svg>
            );
          }
          
        }
      }   
    }

    const CustomSpinner = (props) => {
      if (props.show) {
        return(
          <div className="spinner">
          <Spinner
          as="span"
          animation="border"
          variant="secondary"
          size="lg"
          role="status"
          ></Spinner>
          <p>Loading...</p>
          </div>
        );
      } else {
        return(
          null
        );    
      }  
    }

    const CustomLink = (props) => {
      if (this.state.activeLayer === null) {
        return(null);
      } else {
        return (
          <Link 
            className="dropdownlink" 
            to={{
              pathname: props.endpoint,
              login: this.customNav.current,
              user: this.state.user,
              data: this.state.objGLData,
              project: this.state.activeLayer
            }}
            style={{ textDecoration: 'none' }}
            >{props.label}
          </Link>
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
            <LayerNav 
              project={this.state.activeProject} 
              projects={this.state.projects} 
              layers={this.state.activeLayers}
              user={this.state.login}
              removeLayer={(e) => this.removeLayer(e)} 
              loadRoadLayer={(e) => this.loadLayer(e, 'road')} 
              loadFootpathLayer={(e) => this.loadLayer(e, 'footpath')}
              addCentreline={(e) => this.loadCentreline(e)} 
              addUser={(e) => this.addUser(e)} 
              addProject={(e) => this.addProject(e)} 
              importData={(e) => this.importData(e)} 
              >
            </LayerNav>
            <Nav>              
              <NavDropdown className="navdropdown" title="Data" id="basic-nav-dropdown">
              <CustomLink 
                  className="dropdownlink" 
                  endpoint="/data"
                  label="Table View"
                  style={{ textDecoration: 'none' }}
                  >
                 </CustomLink>
                   <NavDropdown.Divider />         
              </NavDropdown>         
            </Nav>
            <Nav>
            <NavDropdown className="navdropdown" title="Report" id="basic-nav-dropdown">  
              <NavDropdown.Divider />         
                <CustomLink 
                  className="dropdownlink" 
                  endpoint="/statistics"
                  label="Create Report"
                  style={{ textDecoration: 'none' }}
                  >
                 </CustomLink>
              {/* </NavDropdown.Item>  */}
                <NavDropdown.Divider />         
                </NavDropdown>   
            </Nav>
            <Nav>
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
          </Navbar>         
        </div>      
        <div className="map">      
        <LMap        
          ref={(ref) => {this.map = ref;}}
          className="map"
          worldCopyJump={true}
          boxZoom={true}
          center={centre}
          zoom={this.state.zoom}
          doubleClickZoom={false}
          onPopupClose={(e) => this.closePopup(e)}>
          <TileLayer className="mapLayer"
            attribution={this.state.attribution}
            url={this.state.url}
            zIndex={998}
            maxNativeZoom={19}
            maxZoom={22}
          />
          <AntDrawer ref={this.antdrawer} video={this.state.hasVideo}>
          </AntDrawer>
          <ScaleControl className="scale"/>
          <CustomSpinner show={this.state.spinner}>
          </CustomSpinner>;
         
          
          <Dropdown
            className="Priority">
          <Dropdown.Toggle variant="light" size="sm" >
              {this.state.priorityMode}
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu">
            {this.state.priorities.map((value, index) =>
                <div key={`${index}`}>
                 <CustomSVG 
                 login={this.state.login}
                 value={value}
                 reverse={this.state.reverse}
                 >
                 </CustomSVG>
                  <input
                    key={`${index}`} 
                    id={value} 
                    type="checkbox" 
                    defaultChecked 
                    onClick={(e) => this.clickPriority(e)}>
                  </input>{" " + value}
                  <br></br>
                </div> 
                )}
            </Dropdown.Menu>
          </Dropdown>
          <Dropdown
            className="Age">
          <Dropdown.Toggle variant="light" size="sm" >
              Inspection Date
            </Dropdown.Toggle>
            <Dropdown.Menu className="agemenu">
            {this.state.ages.map((value, index) =>
                <div key={`${index}`}>
                 <CustomSVG
                  login={this.state.login}
                  value={value}
                  color={"magenta"}
                  bucket={formatDate(this.state.bucket)}>
                 </CustomSVG>
                 <CustomSVG 
                  login={this.state.login}
                  value={value}
                  color={"darkorange"}
                  bucket={formatDate(this.state.bucket)}>
                 </CustomSVG>
                 <CustomSVG 
                  login={this.state.login}
                  value={value}
                  color={"limegreen"}
                  bucket={formatDate(this.state.bucket)}>
                </CustomSVG>
                <CustomSVG 
                  login={this.state.login}
                  value={value}
                  color={"blue"}
                  bucket={formatDate(this.state.bucket)}> 
                 </CustomSVG>
                  <input
                    key={`${index}`} 
                    id={value} 
                    type="checkbox" 
                    defaultChecked 
                    onClick={(e) => this.clickAges(e, index)}>
                  </input>{" " + value}
                  <br></br>
                </div> 
                )}
            </Dropdown.Menu>
          </Dropdown>
          <div className="btn-group">
          {this.state.filterDropdowns.map((value, indexNo) =>
            <Dropdown 
              className="button"
              key={`${indexNo}`}     
              >                
              <Dropdown.Toggle variant="light" size="sm">
                <input
                  key={`${indexNo}`} 
                  id={value} 
                  type="checkbox" 
                  checked={this.isInputActive(value)} 
                  onChange={(e) => this.changeActive(e, indexNo)}
                  onClick={(e) => this.clickSelect(e, value)}
                  >
                </input>
                {value.name}         
              </Dropdown.Toggle>
              <Dropdown.Menu className="custommenu">
                {value.data.result.map((input, index) =>
                  <div key={`${index}`}>
                    <input
                      key={`${index}`} 
                      id={input} 
                      type="checkbox" 
                      checked={this.isChecked(value, index)} 
                      
                      onClick={(e) => this.clickCheck(e, value)}
                      onChange={(e) => this.changeCheck(e)}
                      >
                    </input>{" " + input}<br></br>
                  </div> 
                  )}
                <Dropdown.Divider />
              </Dropdown.Menu>
            </Dropdown>
          )}
          </div>
          {this.state.archiveMarker.map((position, idx) =>
            <Marker 
              key={`marker-${idx}`} 
              position={position}>

            </Marker>
          )}
          {this.state.carMarker.map((position, idx) =>
            <Marker 
              key={`marker-${idx}`} 
              position={position}>

            </Marker>
          )}
          {this.state.selectedCarriage.map((position, idx) =>
            <Polyline
              key={`marker-${idx}`} 
              position={position}>

            </Polyline>
          )}
          {/* <Image 
            className="satellite" 
            src={this.state.osmThumbnail} 
            onClick={(e) => this.toogleMap(e)} 
            thumbnail={true}
          /> */}

          <VideoCard
            ref={this.videoCard}
            show={this.state.showVideo} 
            parent={this}
          >
          </VideoCard>
          
          <LayerGroup >
            {this.state.selectedGeometry.map((obj, index) =>  
            <CustomPopup 
              key={`${index}`} 
              data={obj}
              position={obj.latlng}
              src={this.state.amazon + obj.photo + ".jpg"} 
              onClick={(e) => this.clickImage(e)}>
            </CustomPopup>
            )}
          </LayerGroup>
          {/* <Button 
            className="applyButton" 
            variant="light" 
            size="sm"
            onClick={(e) => this.clickApply(e)}
            >Apply Filter
          </Button> */}
         {/* <SearchBar ref={this.searchRef} parentRef={this.searchRef}></SearchBar> */}
          {/* <div ref={this.search}>
          <InputGroup 
            className="search">
            <FormControl 
              className="search"
              id="search"
              placeholder="Search"
              onChange={(e) => this.changeSearch(e)}
            />
            <InputGroup.Append>
              <Button className="searchButton" variant="light">
                <img 
                  className="searchicon" 
                  src="search.png" 
                  alt="magnifying glass" 
                  width="24" 
                  height="24"
                  onClick={(e) => this.clickSearch(e)}>
                </img>
              </Button>
            </InputGroup.Append>
          </InputGroup>
          </div>     */}
      </LMap >    
      </div>
      {/* taken button out of map component */}
      <Button 
        className="applyButton" 
        variant="light" 
        size="sm"
        onClick={(e) => this.clickApply(e)}
        >Apply Filter
      </Button>
      <Image 
            className="satellite" 
            src={this.state.osmThumbnail} 
            onClick={(e) => this.toogleMap(e)} 
            thumbnail={true}
          />
       {/* admin modal     */}
       <CustomModal 
        name={'user'}
        show={this.state.showAdmin} 
        ref={this.customModal}
        token={this.state.token}
        host={this.state.host}
        callbackUser={this.createUser} //insert user
        callbackDeleteUser={this.deleteUser}
        callbackProject={this.createProject}
        callbackDeleteProject={this.deleteProject}
        callbackImportData={this.importData}
        callbackGetClient={this.getClient}
        callbackGetProjects={this.selectProjects}
        >
       </CustomModal>
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
          <Button 
            variant="primary" 
            type="submit" 
            onClick={(e) => this.clickClose(e)}>
              Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal 
        className="aboutModal" 
        show={this.state.showAbout} 
        size={'md'} centered={true}>
        <Modal.Header>
          <Modal.Title><h2>About</h2> </Modal.Title>
        </Modal.Header>
        <Modal.Body >	
          <b>Road Inspection Version 1.3 (beta)</b><br></br>
          Relased: 23/04/2020<br></br>
          Company: Onsite Developments Ltd.<br></br>
          Software Developer: Matt Wynyard <br></br>
          <img src="logo192.png" alt="React logo"width="24" height="24"/> React: 16.12.0<br></br>
          <img src="webgl.png" alt="WebGL logo" width="60" height="24"/> WebGL: 2.0<br></br>
          <img src="bootstrap.png" alt="Bootstrap logo" width="24" height="24"/> Bootstrap: 4.4.0<br></br>
          <img src="leafletlogo.png" alt="Leaflet logo" width="60" height="16"/> Leaflet: 1.6.0<br></br>
          <img src="reactbootstrap.png" alt="React-Bootstrap logo" width="24" height="24"/> React-bootstrap: 1.3.0<br></br>
          React-leaflet: 2.6.0<br></br>
		    </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" size='sm' type="submit" onClick={(e) => this.clickClose(e)}>
            Close
          </Button>
        </Modal.Footer>
      {/* login modal     */}
      </Modal>
      <Modal show={this.state.showLogin} size={'sm'} centered={true}>
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
              ref={user => this.userInput = user} />
          </Form.Group>
          <Form.Text className= "message">{this.state.message}</Form.Text>
          <Form.Group controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>           
            <Form.Control 
              type="password" 
              placeholder="Password" 
              ref={(key=> this.passwordInput = key)}/>
          </Form.Group>
          <Button 
            variant="primary" 
            type="submit" 
            onClick={(e) => this.login(e)}>
            Submit
          </Button>
        </Form>
		    </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
      {/*photo modal */}    
      <PhotoModal
        ref={this.photoModal}
        show={this.state.show} 
        marker={this.state.selectedGeometry}
        amazon={this.state.amazon}
        currentPhoto={this.state.currentPhoto}
        callbackUpdateStatus={this.updateStatus}
      >
      </PhotoModal>
      
      <ArchivePhotoModal
        ref={this.archivePhotoModal}
        show={this.state.show} 
        amazon={this.state.amazon}
        currentPhoto={this.state.currentPhoto}
        project={this.state.activeLayer}
      >
      </ArchivePhotoModal>
      </>
    );
  }
  
}
export default App;