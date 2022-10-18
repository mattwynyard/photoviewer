import React from 'react';
import { Map as LMap, TileLayer, ScaleControl, LayerGroup, Marker, Polyline}  from 'react-leaflet';
import {Image}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import './ToolsMenu.css';
import Navigation from './navigation/Navigation.js'
import './gl/L.CanvasOverlay';
import GLEngine from './gl/GLEngine.js';
import './PositionControl';
import './MediaPlayerControl';
import PhotoModal from './modals/PhotoModal.js';
import VideoCard from './video/VideoCard.js';
import ArchivePhotoModal from './modals/ArchivePhotoModal.js';
import {calcGCDistance} from  './util.js';
import DataTable from "./DataTable.js"
import Filter from './components/Filter.js';
import {FilterButton} from './components/FilterButton.js';
import Roadlines from './components/Roadlines';
import {Fetcher} from './api/Fetcher';
import { notification } from 'antd';
import { apiRequest } from "./api/Api.js"
import { loginContext} from './login/loginContext';
import { DefectPopup } from './components/DefectPopup'
import { incrementPhoto } from  './util.js';
import { LayerManager } from './layers/LayerManager';

const DIST_TOLERANCE = 20; //metres 
const ERP_DIST_TOLERANCE = 0.00004;
const MAP_CENTRE = {
  lat: -41.2728,
  lng: 173.2995,
}
const DefaultIcon = L.icon({
  iconUrl: './OpenCamera20px.png',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}); 

class App extends React.Component {
  static contextType = loginContext;

  constructor(props) {
    super(props);
    this.state = JSON.parse(window.sessionStorage.getItem('state')) || {
      location: MAP_CENTRE,
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
      zIndex: 900,
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      osmThumbnail: "satellite64.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank"> OpenStreetMap</a> contributors',
      mode: "map", //for satellite thumbnail
      mapMode: "map",
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
      showAdmin: false,
      modalPhoto: null,
      popover: false,
      photourl: null,
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
      glData: null,
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
      filtered: false ,
      dataActive: false,
      mapBoxKey: null,
      showPhotoViewer: false,
      imageUrl: null
    }; 
    this.customModal = React.createRef();
    this.search = React.createRef();
    this.photoModal = React.createRef();
    this.archivePhotoModal = React.createRef();
    this.videoModal = React.createRef();
    this.videoCard = React.createRef();
    this.toolsRef = React.createRef();
    this.searchRef = React.createRef();
    this.applyRef = React.createRef();
    this.roadLinesRef = React.createRef();
    this.notificationRef = React.createRef();
    this.popupRef = React.createRef();
    this.vidPolyline = null;  
    this.selectedIndex = null;
  }

  componentDidMount () {
    this.leafletMap = this.map.leafletElement;
    this.initializeGL();
    this.addEventListeners();
    if (this.state.dataActive) {
      this.setDataActive(false)
    }
    this.archivePhotoModal.current.delegate(this);
    this.roadLinesRef.current.setDelegate(this.GLEngine);
    this.rulerPolyline = null;
    this.distance = 0;
    this.position = L.positionControl();
    this.leafletMap.addControl(this.position);
    this.position.updateHTML(MAP_CENTRE.lat, MAP_CENTRE.lng)
    L.Marker.prototype.options.icon = DefaultIcon;
    let user = window.sessionStorage.getItem("user") 
    if (user) {
      if (user !== this.context.login.user) { //hack to deal with context not updating on browswer refresh
        this.removeLayer(this.state.activeLayer)
      } else {
        if(this.state.objGLData.length !== 0) {
          if (this.state.activeLayer.centreline) {
            this.roadLinesRef.current.loadCentrelines(this.state.activeLayer.code); 
          }
          let body = this.filterLayer(this.state.activeLayer, true);
          if (body) {
            body.then((body) => {
              this.addGLGeometry(body.points, body.lines, body.type, true);
            });
          }
        }
      }
    } 
    if (this.state.filtered) {
      this.applyRef.current.innerHTML = "Clear Filter"
    } 
    this.context.hideLoader();      
  }

  componentWillUnmount() {
      try { 
        window.sessionStorage.setItem('state', JSON.stringify(this.state));
      } catch {
  
      } 
    this.removeEventListeners(); 
  }

  setMapBox = (token) => {
    this.setState({mapBoxKey: token})
  }

  setMapMode = (mode) => {
    this.setState({mapMode: mode})
  }

  initializeGL() {
    this.GLEngine = new GLEngine(this.leafletMap); 
    this.GLEngine.setAppDelegate(this);
    this.context.setGL(this.GLEngine);
  }

  getGl() {;
    return this.GLEngine;
  }

      /**
   * Called when data layer is loaded
   * @param {array of late lngs} latlngs 
   */
  fitBounds = (latlngs) => {
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

  centreMap = (lat, lng, zoom) => {
    if (!lat || !lng) return;
    const latlng = new L.LatLng(lat, lng)
    this.leafletMap.invalidateSize(true);
    this.leafletMap.setView(latlng, zoom); 
  }

  simulateClick = (index) => {
    this.setIndex(index);
  }

  setDataActive = (isActive) => {
    this.setState({dataActive: isActive}, () => {
      this.leafletMap.invalidateSize(true);
    });
    //this.context.hideLoader();
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
      this.selectedIndex = index;
      this.setState({selectedGeometry: [this.state.objGLData[index - 1]]});
      const selectedMarker = [this.state.objGLData[index - 1]];
      this.setState({image: selectedMarker[0].photo})
      this.GLEngine.redraw(this.GLEngine.glData, false);
    } else {//user selected screen only - no marker
      this.selectedIndex = null;
      this.setState({selectedGeometry: []});
      this.GLEngine.redraw(this.GLEngine.glData, false);
    } 
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
    if (!glLines) return;
    options = {type: type, priorities: priorities, count: glLines.count};
    buffer = [];
    let glPoints = this.GLEngine.loadPoints(buffer, points, options); 
    let centreData = []
    let value = null
    if (this.roadLinesRef.current) {
      centreData = this.roadLinesRef.current.state.data;
      value = this.roadLinesRef.current.state.filter[0]
    }
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
    this.context.hideLoader();
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
    switch(this.state.mapMode) {
      case 'map':
        if (!this.state.activeLayer) return;
        if (this.roadLinesRef.current.isActive()) {
          let query = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }
          let response = await Fetcher(this.context.login, this.state.activeLayer.code, query);
          let geometry = JSON.parse(response.data.geojson);
          let erp = {
            start: response.data.starterp,
            end: response.data.enderp
          }
          if (response.data.dist < ERP_DIST_TOLERANCE) { //distance tolerance
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
        if (this.state.objGLData.length !== 0) {
          if (this.roadLinesRef.current.isActive()) {
            this.GLEngine.mouseClick = null;
          } else {
            const click = {x: e.originalEvent.layerX, y: e.originalEvent.layerY}
            this.GLEngine.mouseClick = {...click};
          }
          this.GLEngine.redraw(this.GLEngine.glData, false);     
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
      case 'video':
      if(this.vidPolyline === null) {  
        this.vidPolyline = this.getCarriage(e, calcGCDistance, this.getPhotos); 
        this.vidPolyline.then((line) => {
          if (line) {
            this.setState({activeCarriage: line})
          }
          
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
        points.pop();
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
      return;
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

  /**
   * toogles between satellite and map view by swapping z-index
   * @param {the control} e 
   */
  toogleMap(e) {
    if (this.context.login.user === "Login") {
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

  closePopup = () => {
    if (!this.state.show) {
      this.setState({selectedGeometry: []}, () => {
        this.setIndex(0);
      });   
    } 
  }

  /**
   * Fired when user clciks photo on thumbnail
   * @param {event} e 
   */
  clickImage = () => { 
    this.photoModal.current.showModal(true, this.context.login.user, this.state.selectedGeometry, this.state.activeLayer.amazon, this.state.image);
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
    this.roadLinesRef.current.reset();
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
      mapBoxKey: null,
      dataActive: false,
      mapMode: "map"
    }, () => {
      this.leafletMap.invalidateSize(true);
      let glData = null
      this.GLEngine.redraw(glData, false);
    })
  }

  /**
   * Get closest polyline to click and plots on map 
   * Starts movie of carriagway
   * @param {event} e 
   * @param {callback to calculate distance} distFunc 
   * @param {callback (this.getphotos) to get closest polyline to click} photoFunc 
   */
  async getCarriage(e, distFunc, photoFunc) {
    const response = await fetch("https://" + this.context.login.host + '/carriage', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.context.login.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.context.login.user,
        project: this.state.activeLayer,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      })
    });
    let vidPolyline = null;
    const body = await response.json();
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
          project: this.state.activeLayer,
          login: this.context.login
        }).addTo(this.leafletMap);
        let parent = this;
        vidPolyline.on('click', function (e) {
          if (parent.state.video) {
            let login = vidPolyline.options.login;
            let project = vidPolyline.options.project;
            let side = parent.videoCard.current.getSide();
            let photo = parent.getVideoPhoto(e.latlng, project, login, side);
            photo.then((data) => {
              parent.videoCard.current.search(data.data.photo);
            });
          } else {
            this.setStyle({
              color: 'red',
              weight: 4
            });
            let carriage = vidPolyline.options.carriageid;
            let project = vidPolyline.options.project;
            let login = vidPolyline.options.login;
            let direction = vidPolyline.options.direction;
            let body = null;
            if (direction === 'B') {
              body = photoFunc(carriage, 'L', project, login);
            } else {
              body = photoFunc(carriage, null, project, login);
            }
            parent.setState({video: true});
            body.then((data) => {
              let photo = null;
              if (data.side === null) {
                photo = parent.getVideoPhoto(e.latlng, project, login, null);
              } else {
                photo = parent.getVideoPhoto(e.latlng, project, login, 'L');
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
    let body = this.updatePhoto(carriageid, erp, side, this.state.activeLayer, this.state.activeCarriage.options.login);
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
  async getVideoPhoto(latlng, project, login, side) {
    const response = await fetch('https://' + login.host + '/archive', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
      body: JSON.stringify({
        user: login.user,
        project: project,
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

  async getPhotos(carriageid, side, project, login) {
    const response = await fetch('https://' + login.host + '/photos', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
      body: JSON.stringify({
        user: login.user,
        project: project,
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

  async updatePhoto(carriageid, erp, side, project, login) {
    const response = await fetch('https://' + login.host + '/changeSide', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
      body: JSON.stringify({
        user: login.user,
        project: project,
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
    const response = await fetch("https://" + this.state.host + '/archive', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.context.login.user,
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
        user: this.context.login.user,
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

  logout = () => {
    this.reset();
  }

  /**
   * checks if layer loaded if not adds layer to active layers
   * calls fetch layer
   * @param {event} e 
   * @param {string} type - the type of layer to load i.e. road or footpath
   */
  loadLayer = async (mode, project) => {  
    this.context.showLoader();    
    let projectCode = project.code;
    let inspections = null;
    let request = {project: project.code, query: null}
    //if (mode === "road") {
      let body = await apiRequest(this.context.login, request, "/age"); //fix for footpaths
      if(!body) return;
      if (!body.error) {
        inspections = this.buildInspections(body)
      } else {
        return;
      } 
    // } else {
    //   inspections = [];
    // }
    let district = await apiRequest(this.context.login, request, "/district");
    if (district.error) return; 
    request = {project: project, query: null}
    let filter = await apiRequest(this.context.login, request, "/filterData");
    if (filter.error) return; 
    let storeFilter = await apiRequest(this.context.login, request, "/filterData");
    if (storeFilter.error) return; 
    let filters = await this.buildFilter(filter);
    let store = await this.buildFilter(storeFilter);
    let layers = this.state.activeLayers;
    layers.push(project);
    let layerBody = await apiRequest(this.context.login, request, "/layerdropdowns");
    let priorities = this.buildPriority(layerBody.priority, project.priority, project.ramm); 
    if (layerBody.rmclass) {
      this.setState({rmclass: layerBody.rmclass});
      this.setState({filterRMClass: layerBody.rmclass})  
    }     
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
      let body = await this.filterLayer(project); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, true);
      if (project.centreline) {
        this.roadLinesRef.current.loadCentrelines(projectCode); 
      }
     
      
    });
  }

    /**
   * Removes current active layer and restores to null state
   * @param {event} project  - the active project
   */
     removeLayer = (project) => {
      window.sessionStorage.removeItem("state");
      window.sessionStorage.removeItem("centrelines");
      this.setDataActive(false)
      this.roadLinesRef.current.reset();
      let layers = this.state.activeLayers;
      for(var i = 0; i < layers.length; i += 1) {     
        if (project.code === layers[i].code) {
          layers.splice(i, 1);
          break;
        }
      }
      this.setState(
        {
          objGLData: [],
          priorities: [],
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
          mapMode: "map",
          district: null }, () => {
            let glData = null;
            this.GLEngine.redraw(glData, false); 
          }
      );  
    }

  buildFilter = async (filters) => {
    if (!filters) return {};
    filters.forEach(filter => {
      let data = filter.data.map(element => Object.values(element)[0]);
      data.sort()
      filter.data = data;
      filter.active = true;
    });
     return filters;
  }

  /**
   * Sets inspections array for use in filter
   * @param {*} ages JSON object inspection array
   */
   buildInspections = (values) => {
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

  /**
   * Sets default bucket suffix for the project
   * @param {the current project} project 
   */
  buildBucket = (project) => {
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

  buildPriority = (priority, isPriority, ramm) => {
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

  getBody = (project, user) => {
    let filter = []
    if (project.surface === "road") {
      this.state.filters.forEach(arr => {
        let data = arr.data
        filter = filter.concat(data);
      })
      return JSON.stringify({
        user: user,
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
          user: this.context.login.user,
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
    if (this.context.login.user !== "Login") {
      await fetch('https://' + this.state.host + endpoint, {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.context.login.user,
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
              let body = await this.filterLayer(project); //fetch layer
              this.addGLGeometry(body.points, body.lines, body.type, false);
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
  filterLayer = async (project) => {
    this.context.showLoader();
    const body = this.getBody(project, this.context.login.user);
    if (!body) return;
    try {
      const response = await fetch('https://' + this.context.login.host + '/layer', {
        method: 'POST',
        headers: {
          "authorization": this.context.login.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
      },
      body: body
      });
     
      if(!response.ok) {
        throw new Error(response.status);
      } else {
        const body = await response.json();
        if (body.error != null) {
          alert(body.error);
          return body;
        } else {
          return body;
        }     
      }    
    } catch (error) {
      console.error(error);
    }
                
  }

  async loadCentreline(e) {
    if (this.context.login.user !== "Login") {
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
          user: this.context.login.user
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

  updateFilter = (filter) => {
    let html = this.applyRef.current.innerHTML
    if (this.state.filtered && html === "Clear Filter") {
      this.applyRef.current.innerHTML = "Apply Filter"
    }
    this.setState({filters: filter})
  }

  /**
   * Fires when user clicks apply button. 
   * @param {event} e 
   */
  clickApply = async (e) => {
    e.preventDefault();
    if (e.target.innerHTML === "Apply Filter") {
      e.target.innerHTML = "Clear Filter";
      this.setState({filtered: true})
      let body = await this.filterLayer(this.state.activeLayer); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, false);
    } else {
      e.target.innerHTML = "Apply Filter";
      let newFilter = [];
      this.state.filterStore.forEach((element) => {
        let object = {...element}
        object.data = [...element.data];
        newFilter.push(object);
      })
      this.setState({
        filtered: false,
        filters: newFilter
      }, async () => {
        let body = await this.filterLayer(this.state.activeLayer); //fetch layer
        this.addGLGeometry(body.points, body.lines, body.type, false);
      });  
    }
  }

    /**
   * callback for prioritydropdwon to update priority filter
   * @param {array} query 
   */
  updatePriority = (query) => {
    this.setState({filterPriorities: query}, async () => {
      let body = await this.filterLayer(this.state.activeLayer); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, false);
    });   
  }
  /**
   * callback for classdropdown to update class filter
   * @param {array} query 
   */
  updateRMClass = async (query) => {
    this.setState({filterRMClass: query}, async () => {
      let body = await this.filterLayer(this.state.activeLayer); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, false);
    });
    
  }

  onImageError = (photo) => {
    this.setState({image: incrementPhoto(photo, -1)})
  }

  render() {
    const centre = [this.state.location.lat, this.state.location.lng];
    return ( 
      <> 
        <Navigation 
          layers={this.state.activeLayers}
          remove={this.removeLayer}
          add={this.loadLayer}
          logout={this.logout}
          project={this.state.activeLayer}
          updateLogin={this.context.updateLogin}
          data={this.state.objGLData}
          centre={this.fitBounds}
          district={this.state.district}
          setDataActive={this.setDataActive} //-> data table
          mapbox={this.setMapBox}
          >  
        </Navigation>   
        <div className="appcontainer">     
          <div className="panel">
            <div className="layers">
              <div className="layerstitle">
                <p>Layers</p>
              </div> 
                <LayerManager
                  layer={this.state.activeLayer}
                  prioritytitle={this.state.priorityMode}
                  priorityitems={this.state.priorities}
                  priorityfilter={this.state.filterPriorities} 
                  classitems={this.state.rmclass ? this.state.rmclass: []}
                  classfilter={this.state.filterRMClass} 
                  setDataActive={this.setDataActive} //-> data table
                  setMapMode={this.state.setMapMode}
                  mapMode={this.state.mapMode}
                  dataChecked={this.state.dataActive} //-> data table
                  updatePriority={this.updatePriority}
                  classonClick={this.updateRMClass}
                  priorityreverse={this.state.reverse}
                  >
                </LayerManager>        
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
                  mode={this.state.activeLayer ? this.state.activeLayer.surface: null}
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
            className={this.state.dataActive ? "map-reduced": "map"}
            worldCopyJump={true}
            boxZoom={true}
            center={centre}
            zoom={this.state.zoom}
            doubleClickZoom={false}
            onPopupClose={this.closePopup}>
            <TileLayer className="mapLayer"
              attribution={this.state.attribution}
              url={this.state.url}
              zIndex={998}
              maxNativeZoom={19}
              maxZoom={22}
            />
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
              <DefectPopup 
                key={`${index}`} 
                data={obj}
                login={this.context.login.user}
                position={obj.latlng}
                photo={this.state.activeLayer ? this.state.image: null} 
                amazon={this.state.activeLayer ? this.state.activeLayer.amazon: null}
                onClick={this.clickImage}
                onError={() => this.onImageError(obj.photo)}
                >
              </DefectPopup>
              )}
            </LayerGroup>
            <Image 
              className="satellite" 
              src={this.state.osmThumbnail} 
              onClick={(e) => this.toogleMap(e)} 
              thumbnail={true}
            />
        </LMap >
        <DataTable 
          className={this.state.dataActive ? "data-active": "data-inactive"}
          data={this.state.objGLData}
          simulate={this.simulateClick}
          centre={this.centreMap}
          surface={this.state.activeLayer ? this.state.activeLayer.surface: null}
        />  
        <PhotoModal
          ref={this.photoModal}
        >
        </PhotoModal>
      {/* <Photoviewer
        show={this.state.showPhotoViewer}
      >
      </Photoviewer> */}
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