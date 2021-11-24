import React from 'react';
import { Map as LMap, TileLayer, ScaleControl, LayerGroup, Marker, Polyline}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Modal, Button, Image, Form}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import './ToolsMenu.css';
import CustomNav from './CustomNav.js';
import './L.CanvasOverlay';
import GLEngine from './GLEngine.js';
import './PositionControl';
import './MediaPlayerControl';
import AntDrawer from './Drawer.js';
import CustomModal from './CustomModal.js';
import PhotoModal from './PhotoModal.js';
import VideoCard from './VideoCard.js';
import ArchivePhotoModal from './ArchivePhotoModal.js';
import {pad, calcGCDistance} from  './util.js';
import SearchBar from './components/SearchBar.jsx'
import Modals from './Modals.js';
import LayerCard from './components/LayerCard.js';
import Filter from './components/Filter.js';
import {CustomSpinner, CustomLink, CustomPopup, LayerNav} from './components/Components.js'
import {FilterButton} from './components/FilterButton';
import Roadlines from './components/Roadlines';
import {Fetcher} from './components/Fetcher';
import { notification } from 'antd';
import _ from 'lodash';

const DIST_TOLERANCE = 20; //metres 
const DefaultIcon = L.icon({
  iconUrl: './OpenCamera20px.png',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}); 

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = JSON.parse(window.sessionStorage.getItem('state')) || {
      location: {
        lat: -41.2728,
        lng: 173.2995,
      },
      admin : false,
      ruler: false,
      rulerOrigin: null,
      rulerPolyline: null,
      rulerDistance: 0,
      priorityDropdown: null,
      priorityMode: "Priority", //whether we use priority or grade
      reverse: false,
      priorities: [], 
      filterPriorities: [],
      filterRMClass: [],
      rmclass: [], //immutable array for different rmclasses used for dropdown items
      inspections: [],
      host: null, //domain
      token: null, //security token
      login: null, //username
      zIndex: 900,
      mapBoxKey: null,
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      osmThumbnail: "satellite64.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      mode: "map",
      zoom: 8,
      centreData: [],
      priority: [],
      photos: [],
      archiveMarker: [],
      carMarker: [], //position of current image in video
      layers: [],
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
      photourl: null,
      projects: null, //all foootpath and road projects for the user
      filters: [],
      filterStore: [],
      activeProject: null,
      activeLayers: [], //layers displayed on the
      activeLayer: null, //the layer in focus
      bucket: null,
      message: "",
      selectedIndex: null,
      mouseclick: null,
      objGLData: [],
      selectedGeometry: [],
      selectedCarriage: [],
      photoArray: null,
      projectMode: null, //the type of project being displayed footpath or road     
      search: null,
      district: null,
      spinner: false,
      toolsRadio: null,
      activeCarriage: null, //carriageway user has clicked on - leaflet polyline
      notificationKey: null,    
    }; 
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
    this.searchRef = React.createRef();
    this.applyRef = React.createRef();
    this.roadLinesRef = React.createRef();
    this.notificationRef = React.createRef();
    this.filterRef = React.createRef();
    this.vidPolyline = null;  
  }

  componentDidMount() {
    let host = this.getHost();
    let user = this.getUser();
    let projects = this.getProjects();
    let token = window.sessionStorage.getItem('token');
    this.setState({
      host: host,
      token: token,
      login: user,
      projects: projects
    }, () => {
      if (this.state.login === "Login") {
        this.callBackendAPI()
      }
      this.customNav.current.setTitle(user);
      this.customNav.current.setOnClick(this.getLoginModal(user));   
    });
    this.leafletMap = this.map.leafletElement;
    this.initializeGL();
    this.addEventListeners(); 
    this.customModal.current.delegate(this);
    this.searchRef.current.setDelegate(this);
    this.archivePhotoModal.current.delegate(this);
    this.roadLinesRef.current.setDelegate(this.GLEngine);
    this.rulerPolyline = null;
    this.distance = 0;
    this.position = L.positionControl();
    this.leafletMap.addControl(this.position);
    L.Marker.prototype.options.icon = DefaultIcon;

    if(this.state.objGLData.length !== 0) {
      this.filterLayer(this.state.activeLayer, true);
    }      
  }

  componentWillUnmount() {
    window.sessionStorage.setItem('state', JSON.stringify(this.state));
    this.removeEventListeners(); 
  }

  initializeGL() {
    this.GLEngine = new GLEngine(this.leafletMap); 
    this.GLEngine.setAppDelegate(this);
  }

  centreMap = (latlngs) => {
    if (latlngs.length !== 0) {
        let bounds = L.latLngBounds(latlngs);
        this.leafletMap.fitBounds(bounds);
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
   * 
   * @param {int - calculates the index from r,g,b color} color 
   */
  getIndex(color) { 
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
    } else {//user selected screen only - no marker
      this.setState({selectedIndex: null});
      this.setState({selectedGeometry: []});
      this.GLEngine.redraw(this.GLEngine.glData, false);
    }
    this.GLEngine.redraw(this.GLEngine.glData, false);
  }

 /**
 * Loops through json objects and extracts fault information
 * Builds object containing fault information and calls redraw
 * @param {JSON array of fault objects received from db} data 
 * @param {String type of data ie. road or footpath} type
 *  @param {Boolean zoom to extents when data loads} zoom
 */
  addGLGeometry(points, lines, type, zoom) {
    const priorities = this.setPriorityObject();
    let options = {type: type, priorities: priorities, count: 0};
    let buffer = [];
    let glLines = this.GLEngine.loadLines(buffer, lines, options);
    options = {type: type, priorities: priorities, count: glLines.count};
    buffer = [];
    let glPoints = this.GLEngine.loadPoints(buffer, points, options); 
    let centreData = this.roadLinesRef.current.state.data;
    let value = this.roadLinesRef.current.state.filter[0]
    let vertCentre = []
    if (value) {
      let options = {type: "centreline", value: value}
      let data = this.GLEngine.loadLines([], centreData, options);
      vertCentre = data.vertices
    } 
    let glData = {
      layers: [{
        type: "line",
        geometry: vertCentre,
        z: 1
      }],
      faults: {
        points: glPoints.vertices,
        lines: glLines.vertices
      }
    }

    if (zoom) {
      this.GLEngine.redraw(glData, true);
    } else {
      this.GLEngine.redraw(glData, false);
    }
    let faults = glLines.faults.concat(glPoints.faults);
    this.setState({objGLData: faults});
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
    this.leafletMap.addEventListener('mousemove', (event) => {
      this.onMouseMove(event);
    });
    this.leafletMap.addEventListener('keydown', (event) => {
      this.onKeyPress(event.originalEvent);
    });
  }

  
  /**
     * adds various event listeners to the canvas
     */
  removeEventListeners() {
    this.leafletMap.removeEventListener('click', (event) => {
      this.clickLeafletMap(event);
    })
    this.leafletMap.removeEventListener('mousemove', (event) => {
      this.onMouseMove(event);
    });
    this.leafletMap.removeEventListener('keydown', (event) => {
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
  clickLeafletMap = async (e) => {
    let mode = this.antdrawer.current.getMode();
    switch(mode) {
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
      if (polyline === null) {
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
        if (!this.state.activeLayer) return;
        if (this.roadLinesRef.current.isActive()) {
          const login = {
            user: this.state.login, 
            project: this.state.activeLayer.code,
            token: this.state.token,

          }
          let address = this.state.host + "/carriageway";
          let query = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }
          let response = await Fetcher(address, login, query);
          let geometry = JSON.parse(response.data.geojson);
          let erp = {
            start: response.data.starterp,
            end: response.data.enderp
          }
          if (response.data.dist < 0.00004) { //distance tolerance
            let dist = this.roadLinesRef.current.erp(geometry, erp, e.latlng);
            if (this.state.notificationKey) {
              if (response.data.carriageid !== this.state.notificationKey.carriage) 
              notification.close(this.state.notificationKey.id);
            }
            let distance = dist.toFixed(); //string
            notification.open({
              className: "notification",
              key: response.data.id,
              message: <div><b>{response.data.roadname}</b><br></br><b>{"ERP " + distance + " m"}</b></div>,
              description: 
                <div><b>Road ID: {response.data.roadid}<br></br></b>
                  <b>Carriage ID: {`${response.data.carriageid}\n`}<br></br></b>
                  <b>Start: {`${response.data.starterp} m\t`}</b>
                  <b>End: {`${response.data.enderp}`}<br></br></b>
                  <b>Width: {`${response.data.width}`}<br></br></b>
                  <b><br></br></b>
                </div>,
              placement: 'bottomRight',
              duration: 10,
              onClose: () => {this.setState({notificationKey: null})},
            });
            let key = {id: response.data.id, carriage: response.data.carriageid}
            this.setState({notificationKey: key});
          }     
        }
        if (this.state.glData !== null) {
          this.setState({selectedIndex: null});
          this.setState({selectedGeometry: []});
          if (this.roadLinesRef.current.isActive()) {
            this.GLEngine.mouseClick = null;
          } else {
            this.GLEngine.mouseClick = e;
          }
          this.GLEngine.redraw(this.GLEngine.glData, false);     
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

  // getDistance() {
  //   return this.distance
  // }

  callBackendAPI = async () => {
    try {
      const response = await fetch("https://" + this.state.host + '/api'); 
      const body = await response.json();
      if (response.status !== 200) {
        alert(body);   
        throw Error(body.message) 
      } else {
          this.buildProjects(body.projects);  
        }
      return body;
    } catch(error) {
      alert(error);   
    } 
  }

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
    let project = window.sessionStorage.getItem('projects');
    if (!project) {
      return [];
    } else {
      return JSON.parse(project);
    }    
  }
  /**
   * Checks if user has cookie. If not not logged in.
   * Returns username in cookie if found else 'Login'
   */
  getUser() {
    let user = window.sessionStorage.getItem('user');
    if (!user) {
      return "Login";
    } else {
      return user;
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
        const map = this.leaflet;
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
      this.setState({url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=" 
      + this.state.mapBoxKey});
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
    this.photoModal.current.showModal(true, this.state.login, this.state.selectedGeometry, this.state.activeLayer.amazon);
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
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("user");
    window.sessionStorage.removeItem("projects");
    window.sessionStorage.removeItem("state");
    window.sessionStorage.removeItem("centrelines");
    this.customNav.current.setOnClick((e) => this.clickLogin(e));
    this.customNav.current.setTitle("Login");
    this.setState({
      activeProject: null,
      projects: [],
      login: "Login",
      priorities: [],
      objGLData: [],
      activeLayers: [],
      activeLayer: null,
      filterStore: [],
      rulerPoints: [],
      filters: [], 
      priorityDropdown: null, 
      filterPriorities: [],
      filterRMClass: [],
      rmclass: [],
      faultData: [],
      inspections: [],
      bucket: null,
      district: null,
      priorityMode: null,
      projectMode: null,
      token: null,
      mapBoxKey: null
    }, () => {
      let glData = null
      this.GLEngine.redraw(glData, false);
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
        obj.road.push(projects[i]);
      } else {
        obj.footpath.push(projects[i]);
      }
    }
    window.sessionStorage.setItem('projects', JSON.stringify(obj));
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
                      parent.videoCard.current.initialise(true, parent.state.projectMode, 
                        initialPhoto.data.side, direction, parent.state.activeLayer.amazon, parent.state.photoArray, i);
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
        let obj = {type: this.state.activeLayer.surface, address: body.data.address, 
          amazon: this.state.activeLayer.amazon, carriage: assetID, photo: body.data.photo, 
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
    let obj = {type: this.state.activeLayer.surface, address: body.data.address, 
      amazon: this.state.activeLayer.amazon, carriage: assetID, photo: body.data.photo, 
    roadid: body.data.roadid, side: body.data.side, erp: body.data.erp, lat: body.data.latitude, lng: body.data.longitude};
    this.archivePhotoModal.current.setArchiveModal(true, obj);
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
    try {
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
    } catch (error) {
      alert("server offline " + error);  
    } finally {
      this.reset();
    } 
  }

  async login(e) {  
    e.preventDefault();
    try {
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
        window.sessionStorage.setItem('token', body.token);
        window.sessionStorage.setItem('user', body.user);
        this.setState({login: body.user, token: body.token, showLogin: false, 
          message: "", mapBoxKey: process.env.REACT_APP_MAPBOX});   
        this.buildProjects(body.projects);   
        this.customNav.current.setTitle(body.user);
        this.customNav.current.setOnClick((e) => this.logout(e));   
        if(this.state.login === 'admin') {
          this.setState({admin: true});
        }
      } else {
        this.setState({message: "Username or password is incorrect!"});
      }
    } catch (error) {
      alert(error)
      this.setState({showLogin: false});
    }      
  }
  
  
  /**
   * checks if layer loaded if not adds layer to active layers
   * calls fetch layer
   * @param {event} e 
   * @param {string} type - the type of layer to load i.e. road or footpath
   */
  async loadLayer(e, mode) { 
    e.persist();
    let projectCode = e.target.attributes.code.value;
    let project = null;
    for(let i = 0; i < this.state.activeLayers.length; i ++) { //check if loaded
      if (this.state.activeLayers[i].code === e.target.attributes.code.value) {  //if found
        return;
      }
    }   
    if (mode === "road") {
      project = this.findProject(this.state.projects.road, projectCode);  
      if (!project) return;
    } else {
      project = this.findProject(this.state.projects.footpath, projectCode);  
      if (!project) return;
    } 
    let inspectionsBody = await this.requestInspections(projectCode, mode); //fix for footpaths
    let inspections = this.buildInspections(inspectionsBody)
    let district = await this.requestDistrict(projectCode); 
    let data = await this.requestFilterData(project);
    let storeData = await this.requestFilterData(project);
    let filters = this.buildFilter(data);
    let store = this.buildFilter(storeData);
    let layers = this.state.activeLayers;
    layers.push(project);
    let layerBody = await this.requestLayerDropdowns(project);
    let priorities = this.buildPriority(layerBody.priority, project.priority, project.ramm); 
    if (layerBody.rmclass) {
      this.setState({rmclass: layerBody.rmclass});
      this.setState({filterRMClass: layerBody.rmclass})  
    } 
    this.antdrawer.current.setVideo(this.state.hasVideo);      
    this.setState(() => ({
      filterPriorities: priorities.filter, 
      priorities: priorities.priorities,
      rmclass: layerBody.rmclass,
      filterRMClass: layerBody.rmclass,
      filterStore: store,
      filters: filters,
      activeLayer: project,
      activeLayers: layers,
      district: district,
      reverse: project.reverse,
      inspections: inspections,
      activeProject: projectCode,
      projectMode: mode,
      priorityMode: mode === "road" ? "Priority": "Grade",
      bucket: this.buildBucket(projectCode),
    }), async function() { 
      this.filterLayer(this.state.activeLayer, true); //fetch layer
      if (this.state.activeLayer.centreline) {
        let login = {token: this.state.token, user: this.state.login}
        this.roadLinesRef.current.loadCentrelines(projectCode, this.state.host, login); 
      }
    });
  }

  buildFilter(filters) {
    if (!filters) return {};
    filters.forEach(filter => {
      let data = filter.data.map(element => Object.values(element)[0]);
      data.sort()
      filter.data = data;
    });
     return filters;
  }

  findProject(projects, code) {
    for (let i = 0; i < projects.length; i++) { //find project
      if (projects[i].code === code) {  //if found
        return projects[i]
        }
    }
    return null;
  }

  async requestInspections(project, mode) {
    if (mode === 'footpath') return [];
    try {
      const response = await fetch('https://' + this.state.host + '/age', {
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
      });
      if(response.ok) {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          return body.result;            
        }     
      } else {
        console.log(response);

      }
    } catch (error) {
      alert(error)
    }
  }

  /**
   * Sets inspections array for use in filter
   * @param {*} ages JSON object inspection array
   */
   buildInspections(values) {
     if (!values) return;
    if (values.length === 0) {
      return [];
    } else {
      let inspections = [];
      for (let i = 0; i < values.length; i++) {
        let inspection = values[i].inspection; 
        if (inspection !== null) {
          inspections.push(inspection);       
        }          
      }
      return inspections;
    }   
  }

  async requestDistrict(project) {  
    let response = await fetch('https://' + this.state.host + '/district', {
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
    });
    if(!response.ok) {
      throw new Error(response.status);
    } else {
      const body = await response.json(); 
      if (body.error != null) {
        alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
        let e = document.createEvent("MouseEvent");
        await this.logout(e);
      } else { 
        return body.district
      }     
    }
  }

  async requestFilterData(project) {
    try {
      let response = await fetch('https://' + this.state.host + '/filterData', {
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
      });
      if(!response.ok) {
        throw new Error(response.status);
      } else {
        const body = await response.json(); 
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else { 
          return body;
        }     
      } 
    } catch (error) {
      alert(error)
    }
}

  async requestLayerDropdowns(project) {
    let response = await fetch('https://' + this.state.host + '/layerdropdowns', {
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
    });
    if(!response.ok) {
      throw new Error(response.status);
    } else {
      const body = await response.json(); 
      if (body.error != null) {
        alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
        let e = document.createEvent("MouseEvent");
        await this.logout(e);
      } else { 
        return body;
      }     
    } 
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

  buildPriority(priority, isPriority, ramm) {
    let priorities = [];
    let filter = [];
    for (let i = 0; i < priority.length; i++) {
      if (priority[i] === 99) {
        priorities.push("Signage");
        filter.push(99);
      } else {
        let mode = isPriority ? "Priority": "Grade";
        let number = priority[i]
        priorities.push(`${mode} ${number}`)
        filter.push(number);
      }
    }
    priorities.sort();
    if(ramm) {
      priorities.push("Programmed");
      filter.push(97);
    }
    priorities.push("Completed");
    filter.push(98);
    return ({filter: filter, priorities: priorities})
  }

  /**
   * 
   * @param {event} e  - the menu clicked
   */
  removeLayer(e) {
    window.sessionStorage.removeItem("state");
    window.sessionStorage.removeItem("centrelines");
    this.roadLinesRef.current.reset();
    let layers = this.state.activeLayers;
    for(var i = 0; i < layers.length; i += 1) {     
      if (e.target.attributes.code.value === layers[i].code) {
        layers.splice(i, 1);
        break;
      }
    }
    this.setState(
      {
        objGLData: [],
        priorities: [],
        //filterDropdowns: [],
        filterPriorities: [],
        filterRMClass: [],
        projectMode: null,
        filterStore: [],
        filter: [],
        rmclass: [],
        faultData: [],
        activeLayers: layers,
        inspections: [],
        bucket: null,
        activeProject: null,
        activeLayer: null,
        ages: layers,
        district: null}, () => {
          let glData = null;
          this.GLEngine.redraw(glData, false); 
        }
    );  
  }

  getBody(project) {
    let filter = []
    if (project.surface === "road") {
      this.state.filters.forEach(arr => {
        let data = arr.data
        filter = filter.concat(data);
      })
      return JSON.stringify({
        user: this.state.login,
        project: project.code,
        filter: filter,
        priority: this.state.filterPriorities,
        archive: project.isarchive,
        surface: project.surface,
        rmclass: this.state.filterRMClass,
        inspection: this.state.inspections,
      })   
    } else {
        return JSON.stringify({
          user: this.state.login,
          project: project.code,
          filter: this.state.filters,
          surface: project.surface,
          archive: project.isarchive,
          priority: this.state.filterPriorities,
          rmclass: this.state.filterRMClass,
          inspection: this.state.inspections,
        })
      }
         
  }

  async sendData(project, data, endpoint) {
    if (this.state.login !== "Login") {
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
              this.filterLayer(this.state.activeLayer, false);
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
  async filterLayer(project, zoom) {
    this.setState({spinner: true});
      let body = this.getBody(project);
      if (!body) return;
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
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            await this.addGLGeometry(body.points, body.lines, body.type, zoom);
          }     
        }
      });                
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
          console.log(body)
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            this.setState({faultData: body});
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

  async addNewProject(project) {
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
          code: project.code,
          client: project.client,
          description: project.description,
          date: project.date,
          tacode: project.tacode,
          amazon: project.amazon,
          surface: project.surface,
          public: project.public,
          priority: project.priority,
          reverse: project.reverse
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\n`);
        } else {
          if (body.success) {
            alert("Project: " + project.code + " created")
          } else {
            alert("Project: " + project.code + "  failed to create")
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

  updateFilter = (filter) => {
    this.setState({filters: filter})
  }

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

  selectLayer(e, index) {
    console.log(this.state.activeLayers[index]);
    this.setState({activeLayer: this.state.activeLayers[index]});
  }

  /**
   * Fires when user clicks apply button. 
   * @param {event} e 
   */
  clickApply(e) {
    e.preventDefault();
    if (e.target.innerHTML === "Apply Filter") {
      e.target.innerHTML = "Clear Filter";
      this.filterLayer(this.state.activeLayer, false);
    } else {
      e.target.innerHTML = "Apply Filter";
      let newFilter = [];
      this.state.filterStore.forEach((element) => {
        let object = {...element}
        object.data = [...element.data];
        newFilter.push(object);
      })
      this.setState({
        filters: newFilter
      }, () => {
        this.filterLayer(this.state.activeLayer, false);
      });  
    }
  }

    /**
   * callback for prioritydropdwon to update priority filter
   * @param {array} query 
   */
  updatePriority = (query) => {
    this.setState({filterPriorities: query}, () => {
      this.filterLayer(this.state.activeLayer, false);
    });
    
  }
  /**
   * callback for classdropdown to update class filter
   * @param {array} query 
   */
  updateRMClass = (query) => {
    this.setState({filterRMClass: query}, () => {
      this.filterLayer(this.state.activeLayer, false);
    });
    
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

  createProject = (project) => {
    this.addNewProject(project);
    this.customModal.current.setShow(false);
  }

  render() {
    const centre = [this.state.location.lat, this.state.location.lng];

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
              projects={this.getProjects()} 
              layers={this.state.activeLayers}
              user={this.state.login}
              removeLayer={(e) => this.removeLayer(e)} 
              loadRoadLayer={(e) => this.loadLayer(e, 'road')} 
              loadFootpathLayer={(e) => this.loadLayer(e, 'footpath')}
              addUser={(e) => this.addUser(e)} 
              addProject={(e) => this.addProject(e)} 
              importData={(e) => this.importData(e)} 
              >
            </LayerNav>
            <Nav>              
              <NavDropdown 
                className="navdropdown" 
                title="Data" 
                id="basic-nav-dropdown"
                >
                <CustomLink 
                  className="dropdownlink" 
                  endpoint="/data"
                  label="Table View"
                  style={{ textDecoration: 'none' }}
                  >
                 </CustomLink>      
              </NavDropdown>         
            </Nav>
            <Nav>
              <NavDropdown className="navdropdown" title="Report" id="basic-nav-dropdown">         
                <CustomLink 
                  className="dropdownlink" 
                  endpoint="/statistics"
                  label="Create Report"
                  data={this.state.objGLData}
                  login={this.customNav.current}
                  user={this.state.login}
                  activeLayer={this.state.activeLayer}
                  style={{ textDecoration: 'none' }}
                  >
                </CustomLink>       
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
            <SearchBar ref={this.searchRef} district={this.state.district}></SearchBar>
          </Navbar>         
        </div>   
        <div className="appcontainer">    
          <div className="panel">
            <div className="layers">
              <div className="layerstitle">
                <p>Layers</p>
              </div>
              <LayerCard
                layer={this.state.activeLayer}
                prioritytitle={this.state.priorityMode}
                priorityitems={this.state.priorities}
                prioritylogin={this.state.login}
                priorityreverse={this.state.reverse}
                priorityfilter={this.state.filterPriorities} 
                priorityonClick={this.updatePriority}
                classtitle={'RM Class'}
                classitems={this.state.rmclass ? this.state.rmclass: []}
                classlogin={this.state.login}
                classfilter={this.state.filterRMClass} 
                classonClick={this.updateRMClass}
              >               
              </LayerCard>
              <Roadlines
                className={"rating"}
                ref={this.roadLinesRef} 
                >
              </Roadlines> 
            </div>
            <hr className='sidebar-line'>
            </hr>
            <div className="filters">
              <div className="filterstitle">
                <p>Filters</p>
              </div>
                <Filter
                  filter={this.state.filters}
                  store={this.state.filterStore}
                  mode={this.state.projectMode}
                  update={this.updateFilter}
                />
                <FilterButton
                  className="apply-btn" 
                  ref={this.applyRef} 
                  layer={this.state.activeLayer} 
                  onClick={(e) => this.clickApply(e)}>  
                </FilterButton>
            </div>
          </div>   
   
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
              login={this.state.login}
              position={obj.latlng}
              src={this.state.activeLayer.amazon + obj.photo + ".jpg"} 
              amazon={this.state.activeLayer.amazon}
              onClick={(e) => this.clickImage(e)}>
            </CustomPopup>
            )}
          </LayerGroup>
          <Image 
            className="satellite" 
            src={this.state.osmThumbnail} 
            onClick={(e) => this.toogleMap(e)} 
            thumbnail={true}
          />

          <CustomSpinner show={this.state.spinner}>
      </CustomSpinner>
      </LMap >    
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
       <Modals
        type='terms'
        show={this.state.showTerms}
        onClick={(e)=> this.clickClose(e)} 
      />
      <Modals
        type='about'
        show={this.state.showAbout}
        onClick={(e)=> this.clickClose(e)} 
      />
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
      <PhotoModal
        ref={this.photoModal}
      >
      </PhotoModal>
      <ArchivePhotoModal
        ref={this.archivePhotoModal}
        show={this.state.show} 
        amazon={!this.state.activeLayer ? null: this.state.activeLayer}
        currentPhoto={this.state.currentPhoto}
        project={this.state.activeLayer}
      >
      </ArchivePhotoModal>
      </div> 
      </>
    );
  }
  
}
export default App;