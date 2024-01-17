import React from 'react';
import { Map as LMap, TileLayer, ScaleControl, LayerGroup, Marker, Polyline}  from 'react-leaflet';
import { Image }  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import './components/ToolsMenu.css';
import { Navigation } from './navigation/Navigation.js'
import './gl/L.CanvasOverlay';
import GLEngine from './gl/GLEngine.js';
import './PositionControl';
import PhotoModal from './photo/PhotoModal.js';
import VideoController from './video/VideoController.jsx';
import ArchivePhotoModal from './modals/ArchivePhotoModal.js';
import { calcGCDistance } from  './util.js';
import DataTable from "./data/DataTable.js"
import Filter from './filters/Filter.js';
import {FilterButton} from './filters/FilterButton.js';
import { apiRequest } from "./api/Api.js"
import { AppContext} from './context/AppContext';
import { DefectPopup } from './components/DefectPopup'
import { incrementPhoto, calculateDistance } from  './util.js';
import { LayerManager } from './layers/LayerManager';
import { store } from './state/store'
import { connect } from 'react-redux'
import { addLayer } from './state/reducers/layersSlice'
import { setClassName, setCentre } from './state/reducers/mapSlice'
import { setOpenDownload } from './state/reducers/downloadSlice'
import { setIsOpen } from './state/reducers/videoSlice';
import { leafletPolylineFromGeometry} from './model/photoCentreline';
import Location  from './theme/Location'
import { Downloader } from './video/Downloader';

const DIST_TOLERANCE = 20; //metres 
//const ERP_DIST_TOLERANCE = 0.00004;

const DefaultIcon = L.icon({
  iconUrl: './OpenCamera20px.png',
  iconSize: [16, 16],
  iconAnchor: [8, 8]
}); 
const dispatch = store.dispatch
class App extends React.Component {
  static contextType = AppContext;
  
  constructor(props) {

    super(props);
    this.state = JSON.parse(window.sessionStorage.getItem('state')) || {
      // ruler: false,
      // rulerOrigin: null,
      // rulerPolyline: null,
      // rulerDistance: 0,
      // showRuler: false,
      //priorityDropdown: null,
      showDownload: false,
      priorities: [], 
      filterPriorities: [],
      filterRMClass: [],
      rmclass: [], //immutable array for different rmclasses used for dropdown items
      inspections: [],
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      osmThumbnail: "satellite64.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank"> OpenStreetMap</a> contributors',
      thumbnailMode: "map",
      zoom: 8,
      centreData: [],
      priority: [],
      photos: [],
      archiveMarker: [],
      carMarker: [], //position of current image in video
      layers: [],
      show: false,
      showAdmin: false,
      modalPhoto: null,
      popover: false,
      photourl: null,
      filters: [],
      filterStore: [],
      activeProject: null,
      activeIndex: -1,
      bucket: null,
      message: "",
      selectedIndex: null,
      mouseclick: null,
      objGLData: [],
      glData: null,
      selectedGeometry: [],
      selectedCarriage: [],   
      search: null,
      toolsRadio: null,
      activeCarriage: null, //carriageway user has clicked on - leaflet polyline
      notificationKey: null, 
      filtered: false ,
      dataActive: false,
      showPhotoViewer: false,
      imageUrl: null,
      bearing: 0,
      mouseOverMap: false
    }; 
    this.search = React.createRef();
    this.photoModal = React.createRef();
    this.archivePhotoModal = React.createRef();
    this.videoModal = React.createRef();
    this.videoCard = React.createRef();
    this.toolsRef = React.createRef();
    this.searchRef = React.createRef();
    this.applyRef = React.createRef();
    this.notificationRef = React.createRef();
    this.vidPolyline = null;  
    this.selectedIndex = null;
   
  }
  /**
   * Retores mapbox token when browser refreshes as lost from context
   * @param {logged in user} user 
   * @returns {mapBox token}|
   */
  async restore (user) {
      if (!user) return
      const token = window.sessionStorage.getItem("token") 
      const host = window.sessionStorage.getItem("osmiumhost") 
      const mapbox = await apiRequest({user: user, token: token, host: host}, 
        {project: null, query: null}, "/mapbox");
      return mapbox
  }

  unsubscribe = store.subscribe(() => {
    const mode = store.getState().map.mode;
    if (mode === 'map') {
      if (this.vidPolyline) this.removePolyLine();
    }
  }
    
)

  async componentDidMount () {
    this.leafletMap = this.map.leafletElement;
    this.context.setLeafletMap(this.map.leafletElement);
    this.initializeGL();
    this.addEventListeners();
    if (this.state.dataActive) {
      this.setState({dataActive: false})
    }
    //this.archivePhotoModal.current.delegate(this);
    this.rulerPolyline = null;
    this.distance = 0;
    this.position = L.positionControl();
    this.leafletMap.addControl(this.position);
    this.position.updateHTML(this.context.MAP_CENTRE.lat, this.context.MAP_CENTRE.lng)
    L.Marker.prototype.options.icon = DefaultIcon;
    const user = window.sessionStorage.getItem("user") 
    const mapbox = await this.restore(user)
    if (mapbox) {
      this.context.setMapBoxKey(mapbox)
    }
    if (user) {
      if (user !== this.context.login.user) { //hack to deal with context not updating on browswer refresh
        this.removeLayer(this.props.activeLayer)
      } else {
        // if(this.state.objGLData.length !== 0) {
        //   const body = this.filterLayer(this.props.activeLayer, true);
        //   if (body) {
        //     body.then((body) => {
        //       this.addGLGeometry(body.points, body.lines, body.type, true);
        //     });
        //   }
        // }
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
        console.log("state write error")
      } 
    this.removeEventListeners(); 
    this.unsubscribe();
  }

  initializeGL() {
    this.GLEngine = new GLEngine(this.leafletMap); 
    this.GLEngine.setAppDelegate(this);
    this.context.setGL(this.GLEngine);
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
    if ( this.state.mouseOverMap && !this.state.dataActive) return;
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
      this.context.hideLoader();
    });
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

    let options = {type: type, render: "Fault", priorities: priorities, count: 0};
    let glLines = this.GLEngine.loadLines([], lines, options);
    if (!glLines) return;
    options = {type: type, priorities: priorities, count: glLines.count};
    let glPoints = this.GLEngine.loadPoints([], points, options); 
    const geom =  this.getLayerData();
    const glData = {
      layers: [{
        type: "line",
        geometry: geom,
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

  getLayerData() {
    if (!this.GLEngine.glData) return [];
    if (this.GLEngine.glData.length !== 0) {
      return this.GLEngine.glData.layers[0].geometry;
    } else {
      return [];
    }
  }

  setPriorityObject() {
    let obj = {}
    if (this.props.activeLayer.reverse) {
      obj.high = 5;
      obj.med = 4;
      obj.low = 3;
      obj.vlow = 2;
      obj.vvlow = 1;
    } else {
      obj.high = 1;
      obj.med = 2;
      obj.low = 3;
      obj.vlow = 2;
      obj.vvlow = 1;
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
    this.leafletMap.addEventListener('mouseover', (event) => {
      this.onMouseOverLeaflet(event)
    });
    this.leafletMap.addEventListener('mouseout', (event) => {
      this.onMouseOutLeaflet(event)
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
    this.leafletMap.removeEventListener('mouseover', (event) => {
      this.onMouseOverLeaflet(event)
    });
    this.leafletMap.removeEventListener('mouseout', (event) => {
      this.onMouseOutLeaflet(event)
    });
  }

  getPhotoBounds() {
    let mapBounds = this.leafletMap.getBounds();
    let southeast = mapBounds.getSouthEast();
    let center = this.leafletMap.getCenter();
    return L.latLngBounds(center, southeast);
  }

  onMouseOutLeaflet = () => {
    this.setState({mouseOverMap: false})
  }

  onMouseOverLeaflet = () => {
    this.setState({mouseOverMap: true})
  }

  /**
   * Handles click events on lealfet map
   * @param {event - the mouse event} e 
   */
  clickLeafletMap = async (e) => {
    switch(this.props.mapMode) {
      case 'map':
        if (!this.props.activeLayer) return;
        // if (this.context.ratingActive) {
        //    let body = {
        //     user: this.context.login.user,
        //     lat: e.latlng.lat,
        //     lng: e.latlng.lng,
        //     layer: this.props.activeLayer
        //   }
        //let response = await PostFetch(this.context.login.host + "/carriageway", this.context.login.token, body);
        //   let geometry = JSON.parse(response.data.geojson);
        //   let erp = {
        //     start: response.data.starterp,
        //     end: response.data.enderp
        //   }
        //   if (response.data.dist < ERP_DIST_TOLERANCE) { //distance tolerance
        //     let dist = this.roadLinesRef.current.erp(geometry, erp, e.latlng);
        //     if (this.state.notificationKey) {
        //       if (response.data.carriageid !== this.state.notificationKey.carriage) 
        //       notification.close(this.state.notificationKey.id);
        //     }
        //     let distance = dist.toFixed(); //string
        //     notification.open({
        //       className: "notification",
        //       key: response.data.id,
        //       message: <div><b>{response.data.roadname}</b><br></br><b>{"ERP " + distance + " m"}</b></div>,
        //       description: 
        //         <div><b>Road ID: {response.data.roadid}<br></br></b>
        //           <b>Carriage ID: {`${response.data.carriageid}\n`}<br></br></b>
        //           <b>Start: {`${response.data.starterp} m\t`}</b>
        //           <b>End: {`${response.data.enderp}`}<br></br></b>
        //           <b>Width: {`${response.data.width}`}<br></br></b>
        //           <b><br></br></b>
        //         </div>,
        //       placement: 'bottomRight',
        //       duration: 10,
        //       onClose: () => {this.setState({notificationKey: null})},
        //     });
        //     let key = {id: response.data.id, carriage: response.data.carriageid}
        //     this.setState({notificationKey: key});
        //   }     
        //} else {
        if (this.state.objGLData.length !== 0) {
          if (this.context.ratingActive === true) {
            this.GLEngine.mouseClick = null;
          } else {
          const click = {x: e.originalEvent.layerX, y: e.originalEvent.layerY}
          this.GLEngine.mouseClick = {...click};
          this.GLEngine.redraw(this.GLEngine.glData, false);     
          }
        //}       
        }
        break;
      case 'Street':
        this.getArhivePhoto(e);
        break;
      // case 'Ruler':
      //   let polyline = this.state.rulerPolyline;
      //   if (polyline === null) {
      //     let points = [];
      //     points.push(e.latlng);
      //     polyline = new L.polyline(points, {
      //       color: 'blue',
      //       weight: 4,
      //       opacity: 0.5 
      //       });
      //     polyline.addTo(this.leafletMap);
      //     this.setState({rulerPolyline: polyline});
      //   } else {
      //     let points = polyline.getLatLngs();
      //     points.push(e.latlng);
      //     polyline.setLatLngs(points);
      //   }
      //   break;
      case 'video':
        if(this.vidPolyline === null) { 
          const geometry = await this.getVideoGeometry(e)
          if (!geometry)  {
            alert("no geometry");
            return
          }
          if (geometry.error)  {
            alert(geometry.error);
            return
          } 
          if (calcGCDistance(geometry.data.dist) > 40) return
          this.vidPolyline = await this.playVideo(this.getPhotos, geometry); 
        } else {
          if (this.vidPolyline.options.color === "blue") {
            this.removePolyLine();
          } 
        }      
        break;
      default:
        break;
    }
  }

  removePolyLine = () => {
    if (this.vidPolyline) 
      this.vidPolyline.remove();
      this.vidPolyline = null;
      this.setState({carMarker: []});
  }

  getVideoGeometry = async (e) => {
    const query = {
      user: this.context.login.user,
      project: this.props.activeLayer.code,
      surface: this.props.activeLayer.surface,
      lat: e.latlng.lat,
      lng: e.latlng.lng
    }
    const body = await this.requestCarriage(query)
    if (body.error)  {
      alert(body.error);
      return null
    }
    return body
  }

  onMouseMove(e) {
    let lat = Math.round(e.latlng.lat * 100000) / 100000;
    let lng = Math.round(e.latlng.lng * 100000) / 100000;
    this.position.updateHTML(lat, lng);
    if (this.state.toolsRadio === 'ruler') {
      let polyline = this.state.rulerPolyline
      if (polyline !== null) {
        let points = polyline.getLatLngs();
        let distance = 0;
        if (points.length === 1) {
          points.push(e.latlng);
          polyline.setLatLngs(points);
          distance = calculateDistance(points);
        } else {
          points[points.length - 1] = e.latlng;
          polyline.setLatLngs(points);
          distance = calculateDistance(points);       
        }
        this.setState({rulerDistance: distance});
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
        const distance = calculateDistance(points);
        this.setState({rulerDistance: distance});
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

  /**
   * toogles between satellite and map view by swapping z-index
   * @param {the control} e 
   */
  toogleMap() {
    if (this.context.login.user === "Login") {
      return;
    }
    if (this.state.thumbnailMode === "map") {
      if (!this.context.mapBoxKey.mapBoxKey) return;
      this.setState({thumbnailMode: "sat"});
      this.setState({osmThumbnail: "map64.png"});

      this.setState({url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=" 
      + this.context.mapBoxKey.mapBoxKey});
      this.setState({attribution: 
        "&copy;<a href=https://www.mapbox.com/about/maps target=_blank>MapBox</a>&copy;<a href=https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors"})
    } else {
      this.setState({thumbnailMode: "map"});
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
    this.photoModal.current.showModal(true, this.context.login.user, this.state.selectedGeometry, 
      this.props.activeLayer.amazon, this.state.image);
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
    window.sessionStorage.removeItem("mapbox");
    this.context.setProjectMode(null)
    this.setState({
      activeProject: null,
      projects: [],
      priorities: [],
      objGLData: [],
      filterStore: [],
      rulerPoints: [],
      filters: [], 
      carMarker: [], 
      filterPriorities: [],
      filterRMClass: [],
      rmclass: [],
      faultData: [],
      inspections: [],
      bucket: null,
      dataActive: false,
    }, () => {
      this.leafletMap.invalidateSize(true);
      let glData = null
      this.GLEngine.redraw(glData, false);
    })
  }

  requestCarriage = async (query) => {
    const queryParams = new URLSearchParams(query)
    const response = await fetch(`https://${this.context.login.host}/closestcarriage?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        "authorization": this.context.login.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      }  
    });
    return await response.json();
  }

  async changeVideoPlayerOpen (isOpen) {
      await dispatch(setIsOpen(false))
      this.leafletMap.invalidateSize(isOpen);
  }

  /**
   * Get closest polyline to click and plots on map 
   * Starts movie of carriagway
   * @param {event} e 
   * @param {callback to calculate distance} distFunc 
   * @param {callback (this.getphotos) to get closest polyline to click} photoFunc - callback this.getPhotos 
   */
  async playVideo(photoFunc, geometry) {
    if (this.vidPolyline) return
    const settings = {
      color: 'blue',
      weight: 4,
      opacity: 0.5,
    }
    const vidPolyline = leafletPolylineFromGeometry(geometry, settings)
    vidPolyline.options.project = this.props.activeLayer;
    vidPolyline.options.login = this.context.login;
    vidPolyline.addTo(this.leafletMap);
    const parent = this;
    vidPolyline.options.parent = this;
    vidPolyline.on('click', async function (event) {
        if (this.options.color === 'red') { 
        const login = vidPolyline.options.login;
        const side = parent.videoCard.current.getSide();
        const request = {
          cwid: vidPolyline.options.cwid,
          latlng: event.latlng,
          project: vidPolyline.options.project.code,
          surface: vidPolyline.options.project.surface,
          login: login,
          side: side,
          tacode: vidPolyline.options.tacode
        }
        const photo = await parent.getVideoPhoto(request);
        parent.videoCard.current.refresh(photo.data);
      } else {
        this.setStyle({
          color: 'red',
          weight: 4
        });
        const login = vidPolyline.options.login;
        const direction = vidPolyline.options.direction;
        let initialSide = null;
        if (direction === 'Both') {
          initialSide = 'R'
          const request = {
            cwid: vidPolyline.options.cwid,
            side: initialSide, 
            project: vidPolyline.options.project.code,
            surface: vidPolyline.options.project.surface,
            tacode: vidPolyline.options.tacode
          }
          if (!this.options.photos) {
            const photos = await photoFunc(request, login);
            this.options.photos = photos.data;
          }
        } else {
          const request = {
            cwid: vidPolyline.options.cwid,
            side: null, 
            project: vidPolyline.options.project.code,
            surface: vidPolyline.options.project.surface,
            tacode: vidPolyline.options.tacode
          }
          if (!this.options.photos) {
            const photos = await photoFunc(request, login);
            this.options.photos = photos.data;
          }
        }
        if (this.options.photos.error) return
        const request = {
          cwid: vidPolyline.options.cwid,
          latlng: event.latlng,
          project: vidPolyline.options.project.code,
          surface: vidPolyline.options.project.surface,
          login: login,
          side: initialSide,
          tacode: vidPolyline.options.tacode
        }
        const photo = await parent.getVideoPhoto(request);             
        const index = this.options.photos.findIndex((element) => element.photo === photo.data.photo) 
        if (index === -1) {
          alert("error loading video - Not found")
        } else {
          const videoParameters = {
            mode: parent.context.projectMode,
            direction: direction,
            amazon: parent.props.activeLayer.amazon,
            photos: this.options.photos,
            startingIndex: index,
            interval: photo.data.interval
          }
          parent.videoCard.current.initialise(videoParameters, vidPolyline);    
          dispatch(setIsOpen(true));    
        }
      }         
    });
    return vidPolyline;  
  }

  /**
   * Delegate function for fetching new photos if user changes side 
   * Updates video cards data array
   * @param {left 'L' or right 'R' side of road} side 
   */
  async changeSide(currentPhoto) {
    const body = this.requestChangeSide(currentPhoto);
    body.then((data) => {
      this.videoCard.current.refresh(data.photo, data.data);
    });
  }

  /**
   * Returns photo name closest to user click 
   * @param {lat lng of user click} latlng 
   * @param {server} host 
   * @param {user login} login 
   */
  async getVideoPhoto(request) {
    const query = {
      user: request.login.user,
      project: request.project,
      lat: request.latlng.lat,
      lng: request.latlng.lng,
      side: request.side,
      surface: request.surface,
      cwid: request.cwid,
      tacode: request.tacode
    }
    const queryParams = new URLSearchParams(query)
    const response = await fetch(`https://${request.login.host}/closestvideophoto?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": request.login.token,       
      },

    });
    const body = await response.json();
    if (body.error) {
      alert(body.error);   
    } else {
      return body;
    }   
  }

  async getPhotos(request, login) {
    const query = {
      user: login.user,
      cwid: request.cwid,
      project: request.project,
      surface: request.surface,
      side: request.side,
      tacode: request.tacode
    }
    const queryParams = new URLSearchParams(query)
    const response = await fetch(`https://${login.host}/photos?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": login.token,       
      },
    });
    const body = await response.json();
    if (response.status !== 200) {
      alert(response.status + " " + response.statusText);  
      throw Error(body.message);   
    } else {
      return body;
    }   
  }

  async requestChangeSide(currentPhoto) {
    const query = {
      user: this.context.login.user,
      project: this.props.activeLayer.code,
      photo: JSON.stringify(currentPhoto)
    }
    const queryParams = new URLSearchParams(query)
      const response = await fetch(`https://${this.context.login.host}/changeside?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json', 
        "authorization": this.context.login.token,       
      },

    });
    const body = await response.json();
    if (body.error) {
      alert(response.status + " " + response.statusText);
      return   
    } else {
      return body;
    }   
  }

  /**
   * sends request for photo based in lat/lng of click
   * @param {the click event i.e} e 
   */
  async getArhivePhoto(e) {
    const response = await fetch("https://" + this.context.login.host + '/archive', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.context.login.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.context.login.user,
        project: this.props.activeLayer,
        lat: e.latlng.lat,
        lng: e.latlng.lng
      })
    });
    const body = await response.json();
    if (body.error == null) {
      let distance = calcGCDistance(body.data.dist);
      let assetID = null;
      if (this.props.activeLayer.surface === "footpath") {
        assetID = body.data.footpathid;
      } else {
        assetID = body.data.carriageway;
      }
      if (distance <= DIST_TOLERANCE) {
        let obj = {type: this.props.activeLayer.surface, address: body.data.address, 
          amazon: this.props.activeLayer.amazon, carriage: assetID, photo: body.data.photo, 
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
    const response = await fetch("https://" + this.context.login.host + '/archivedata', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        "authorization": this.context.login.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',        
      },
      body: JSON.stringify({
        user: this.context.login.user,
        project: this.props.activeLayer,
        photo: photo
      })
    });
    const body = await response.json();
    let assetID = null;
    if (body.error == null) {
      if (this.props.activeLayer.surface === "footpath") {
        assetID = body.data.footpathid;
      } else {
        assetID = body.data.carriageway;
      }
    let obj = {type: this.props.activeLayer.surface, address: body.data.address, 
      amazon: this.props.activeLayer.amazon, carriage: assetID, photo: body.data.photo, 
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

  loadLayer = async (project) => { 
    this.context.showLoader();    
    let projectCode = project.code;
    let inspections = null;
    let request = {project: project.code, query: null}
    let body = await apiRequest(this.context.login, request, "/age"); //fix for footpaths
    if(!body) return;
    if (!body.error) {
      inspections = this.buildInspections(body)
    } else {
      return;
    } 
    let district = await apiRequest(this.context.login, request, "/district");
    if (district.error) return;
    this.context.setDistrict(district);
    request = {project: project, query: null};
    const filter = await this.requestFilters(request)
    const filters = this.buildFilter(filter)
    const filterStore = this.buildFilter(JSON.parse(JSON.stringify(filter)));
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
      filterStore: filterStore,
      filters: filters,
      inspections: inspections,
      activeProject: projectCode,
      priorityMode: this.context.projectMode === "road" ? "Priority": "Grade",
      bucket: this.buildBucket(projectCode),
    }), async function() { 
      let body = await this.filterLayer(project); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, true);
    });
  }

  requestFilters = async (request) => {
  
    let filter = await apiRequest(this.context.login, request, "/filterdata");
    console.log(filter)
    if (filter.error) return;

    return filter
  }

    /**
   * Removes current active layer and restores to null state
   * @param {event} project  - the active project
   */
     removeLayer = () => {
      window.sessionStorage.removeItem("state");
      window.sessionStorage.removeItem("centrelines");
      this.setDataActive(false)
      this.setState(
        {
          objGLData: [],
          priorities: [],
          filterPriorities: [],
          filterRMClass: [],
          filterStore: [],
          filter: [],
          rmclass: [],
          faultData: [],
          inspections: [],
          bucket: null,
          activeProject: null,
          ages: null,
          video : false,
          isVideoOpen: false
          }, () => {
            let glData = null;
            this.GLEngine.redraw(glData, false); 
          }
      );  
    }

  buildFilter = (filters) => {
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
      await fetch('https://' + this.context.login.host + endpoint, {
      method: 'POST',
      headers: {
        "authorization": this.context.login.token,
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
          "authorization": this.context.login.token,
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
      let body = await this.filterLayer(this.props.activeLayer); //fetch layer
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
        let body = await this.filterLayer(this.props.activeLayer); //fetch layer
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
      let body = await this.filterLayer(this.props.activeLayer); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, false);
    });   
  }
  /**
   * callback for classdropdown to update class filter
   * @param {array} query 
   */
  updateRMClass = async (query) => {
    this.setState({filterRMClass: query}, async () => {
      let body = await this.filterLayer(this.props.activeLayer); //fetch layer
      this.addGLGeometry(body.points, body.lines, body.type, false);
    });
    
  }

  onImageError = (photo) => {
    this.setState({image: incrementPhoto(photo, -1)})
  }

  openDownload = (request) => {
    dispatch(setOpenDownload({show:true, request: request}))
  }

  render() {
    const centre = [this.props.centre.lat, this.props.centre.lng];
    return ( 
      <> 
        <Navigation 
          layers={this.props.activeLayers}
          remove={this.removeLayer}
          add={this.loadLayer}
          logout={this.logout}
          project={this.props.activeLayer}
          updateLogin={this.context.updateLogin}
          data={this.state.objGLData}
          centre={this.fitBounds}
          setDataActive={this.setDataActive} //-> data table
          >  
        </Navigation>   
        <div className="appcontainer">     
          <div className={(this.state.dataActive ||  this.props.isVideoOpen) ? "panel-reduced": "panel"}>
            <div className="layers">
              <div className="layerstitle">
                <p>{'Layers'}</p>
              </div> 
              <LayerManager
                prioritytitle={this.state.priorityMode}
                priorityitems={this.state.priorities}
                priorityfilter={this.state.filterPriorities} 
                classitems={this.state.rmclass ? this.state.rmclass: []}
                classfilter={this.state.filterRMClass} 
                setDataActive={this.setDataActive} //-> data table
                dataChecked={this.state.dataActive} //-> data table
                updatePriority={this.updatePriority}
                classonClick={this.updateRMClass}
                >
              </LayerManager>       
            </div>
            <div className="filters">
              <div className="filterstitle">
                <p>{'Filters'}</p>
              </div>
              <Filter
                filter={this.state.filters}
                store={this.state.filterStore}
                mode={this.props.activeLayer ? this.props.activeLayer.surface: null}
                update={this.updateFilter}
              />
              <FilterButton
                className="apply-btn" 
                ref={this.applyRef} 
                layer={this.props.activeLayer} 
                onClick={(e) => this.clickApply(e)}>  
              </FilterButton>
            </div>
          </div> 
          <div>
          <LMap        
              ref={(ref) => {this.map = ref;}}
              className={this.props.isVideoOpen ? "map-video": this.state.dataActive ? "map-reduced" : "map"}
              worldCopyJump={true}
              boxZoom={true}
              center={centre}
              zoom={this.state.zoom}
              doubleClickZoom={false}
              onPopupClose={this.closePopup}>
              <TileLayer className="mapLayer"
                attribution={this.state.attribution}
                url={this.state.url}
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
              {this.state.carMarker.map((marker, idx) =>
                <Location 
                  className='location' 
                  key={`marker-${idx}`} 
                  marker={marker} 
                  center = {this.leafletMap ? this.leafletMap.latLngToContainerPoint(marker.position[0]) : null}
                  map={this.leafletMap} 
                  style={{ zIndex: 1000 }}   />
              )}
              {this.state.selectedCarriage.map((position, idx) => 
                <Polyline
                  key={`marker-${idx}`} 
                  position={position}>
                </Polyline>
              )}
              
              <LayerGroup >
                {this.state.selectedGeometry.map((obj, index) =>   
                <DefectPopup 
                  key={`${index}`} 
                  data={obj}
                  login={this.context.login.user}
                  position={obj ? obj.latlng : null}
                  photo={this.props.activeLayer ? this.state.image: null} 
                  amazon={this.props.activeLayer ? this.props.activeLayer.amazon: null}
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
          <VideoController
            ref={this.videoCard}
            show={this.state.videoViewer} 
            parent={this}
            centre={this.centreMap} 
            project={this.props.activeLayer}
            clickDownload={this.openDownload}
          >
          </VideoController >
            <DataTable 
              className={this.state.dataActive ? "data-active": "data-inactive"}
              data={this.state.objGLData}
              simulate={this.simulateClick}
              centre={this.centreMap}
              surface={this.props.activeLayer ? this.props.activeLayer.surface: null}
          />  
          </div> 
          <Downloader
          />
        <PhotoModal
          ref={this.photoModal}
        >
        </PhotoModal>
        <ArchivePhotoModal
          ref={this.archivePhotoModal}
          show={this.state.show} 
          amazon={!this.props.activeLayer ? null: this.props.activeLayer}
          currentPhoto={this.state.currentPhoto}
          project={this.props.activeLayer}
        >
        </ArchivePhotoModal>
      </div> 
      </>
    );
  }
  
}

const mapStateToProps = state => ({
  activeLayer: state.layers.active,
  activeLayers: state.layers.layers,
  className: state.map.class,
  mapMode: state.map.mode,
  centre: state.map.centre,
  isVideoOpen: state.video.isOpen
})

const mapDispatchToProps = {
  addLayer,
  setClassName,
  setIsOpen,
  setCentre,
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);


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