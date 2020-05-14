import React from 'react';
import { Map as LMap, TileLayer, Popup, ScaleControl, LayersControl, LayerGroup}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Dropdown, Modal, Button, Image, Form, Table, Pagination, ListGroup, Card}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import CustomNav from './CustomNav.js';
import CustomButtons from './CustomButtons.js';
import Cookies from 'js-cookie';
import './L.CanvasOverlay';
import './PositionControl';
import DynamicDropdown from './DynamicDropdown.js';
//import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix, pad} from  './util.js'

class App extends React.Component {

  constructor(props) {
    super(props);
    this.customNav = React.createRef();
    this.menu = React.createRef();
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
      notFilter: [], //filter for db request
      priorityDropdown: null,
      priorityMode: "Grade",
      priorities: [], 
      filterDropdowns: [],
      filterPriorities: [],
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
      layers: [],
      bounds: {},
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
      user: this.getUser(),
      password: null,
      projects: this.getProjects(), //all foootpath and road projects for the user
      faultClass: [],
      faultTypes: [],
      pageActive: 0, //tab on filter model selected
      checkedFaults: [],
      checked: false,
      activeProject: null,
      activeLayers: [], //layers displayed on the
      activeLayer: null, //the layer in focus
      clearDisabled: true,
      message: "",
      lineData: null,
      mouse: null,
      coordinates: null, //coordinates of clicked marker
      glpoints: null,
      selectedIndex: null,
      mouseclick: null,
      objGLData: [],
      selectedGLMarker: [],
      projectMode: null, //the type of project being displayed footpath or road
      
      
    };   
  }

  componentDidMount() {
    // Call our fetch function below once the component mounts
    this.customNav.current.setTitle(this.state.user);
    this.customNav.current.setOnClick(this.state.loginModal);
    this.callBackendAPI()
    .catch(err => alert(err));
    //this.setPriorities();
    this.initializeGL();
  }

  componentDidUpdate() {   

  }

  initializeGL() {
    this.leafletMap = this.map.leafletElement;
    if (this.gl == null) {
      this.glLayer = L.canvasOverlay()
      .addTo(this.leafletMap);
      this.canvas = this.glLayer.canvas();
      this.glLayer.canvas.width = this.canvas.width;
      this.glLayer.canvas.height = this.canvas.height;
      this.gl = this.canvas.getContext('webgl', { antialias: true }, {preserveDrawingBuffer: false}); 
      if (!this.gl) {
        this.gl = this.canvas.getContext('experimental-webgl', { antialias: true }, {preserveDrawingBuffer: false});
        console.log("Cannot load webgl1.0 using experimental-webgl instead");
      }     
      this.glLayer.delegate(this);
 
      this.position = L.positionControl();
      this.leafletMap.addControl(this.position);
      this.addEventListeners();
      
    }  
  }

  /**
   * Fires when user clicks on map.
   * Redraws gl points when user selects point
   * @param {event - the mouse event} e 
   */
  clickCanvas(e) {
    if (this.state.glpoints !== null) {
      this.setState({selectedIndex: null});
      this.setState({selectedGLMarker: []});
      this.setState({mouseclick: e})
      this.redraw(this.state.glpoints);
    }
  }

  clickMap(e) {
    if (this.state.glpoints !== null) {
      this.setState({selectedIndex: null});
      this.setState({selectedGLMarker: []});
      this.setState({mouseclick: e})
      this.redraw(this.state.glpoints);
    }
  }

  /**
   * 
   * @param {int - calculates the index from r,g,b color} color 
   */
  getIndex(color) { 
    return color[0] + color[1] * 256 + color[2] * 256 * 256;
  }

  /**
   * Called from drawing callback in L.CanvasOverlay by delegate
   * Sets the selected point and redraw
   * @param {the point the user selected} index 
   */
  setIndex(index) {
    if (index !== 0) {
      this.setState({selectedIndex: index});
      this.setState({selectedGLMarker: [this.state.objGLData[index - 1]]}); //0 is black ie the screen
      
      
    } else {//user selected screen only - no marker
      this.setState({selectedIndex: null});
      this.setState({selectedGLMarker: []});
    }
    this.redraw(this.state.glpoints);
  }

  reColorPoints(data) {
    let verts = new Float32Array(data);
    if (this.state.mouseclick === null) {
      if (this.state.selectedIndex === null) {
        return verts;
      } else {
        //TODO
        for (let i = 0; i < verts.length; i += 7) {
          if (verts[i + 6] === this.state.selectedIndex) {
            verts[i + 2] = 1.0;
            verts[i + 3] = 0;
            verts[i + 4] = 0;
          }
        }
      }
      
    } else {
      for (let i = 0; i < verts.length; i += 7) {
        let index = verts[i + 6];
        //calculates r,g,b color from index
        let r = ((index & 0x000000FF) >>>  0) / 255;
        let g = ((index & 0x0000FF00) >>>  8) / 255;
        let b = ((index & 0x00FF0000) >>> 16) / 255;
        verts[i + 2] = r;
        verts[i + 3] = g;
        verts[i + 4] = b;
      }
    }
    return verts;
  }

  redraw(data) {

    this.glLayer.drawing(drawingOnCanvas); 
    let pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);
    
        // -- WebGl setup
    let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, document.getElementById('vshader').text);
    this.gl.compileShader(vertexShader);
    let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    let length = this.state.activeLayers.length - 1;
    if (this.state.activeLayers[length].surface === "footpath") {
      this.gl.shaderSource(fragmentShader, document.getElementById('fshader-square').text);
    } else {
      this.gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
    }
    this.gl.compileShader(fragmentShader);
    // link shaders to create our program
    let program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
  // ----------------------------
    // look up the locations for the inputs to our shaders.
    var u_matLoc = this.gl.getUniformLocation(program, "u_matrix");
    var colorLoc = this.gl.getAttribLocation(program, "a_color");
    var vertLoc = this.gl.getAttribLocation(program, "a_vertex");
    this.gl.aPointSize = this.gl.getAttribLocation(program, "a_pointSize");
    // Set the matrix to some that makes 1 unit 1 pixel.
    pixelsToWebGLMatrix.set([2 / this.canvas.width, 0, 0, 0, 0, -2 / this.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix); 
 
    var numPoints = data.length / 7 ; //[lat, lng, r, g, b, a, id]
    let vertBuffer = this.gl.createBuffer();
    //let vertArray = new Float32Array(verts);
    let vertArray = this.reColorPoints(data);
    let fsize = vertArray.BYTES_PER_ELEMENT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize*7, 0);
    this.gl.enableVertexAttribArray(vertLoc);
    // -- offset for color buffer
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, true, fsize*7, fsize*2);
    this.gl.enableVertexAttribArray(colorLoc);
    this.glLayer.redraw();

    function drawingOnCanvas(canvasOverlay, params) {
      if (this.delegate.gl == null)  {
        return;
      }
      this.delegate.gl.clearColor(0, 0, 0, 0);
      this.delegate.gl.clear(this.delegate.gl.COLOR_BUFFER_BIT);
      let pixelsToWebGLMatrix = new Float32Array(16);
      pixelsToWebGLMatrix.set([2 / params.canvas.width, 0, 0, 0, 0, -2 / params.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      this.delegate.gl.viewport(0, 0, params.canvas.width, params.canvas.height);
      var pointSize = Math.max(this._map.getZoom() - 6.0, 1.0);
      this.delegate.gl.vertexAttrib1f(this.delegate.gl.aPointSize, pointSize);
      // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
      this.delegate.mapMatrix.set(pixelsToWebGLMatrix);
      var bounds = this._map.getBounds();
      var topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
      var offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
      // -- Scale to current zoom
      var scale = Math.pow(2, this._map.getZoom());
      scaleMatrix(this.delegate.mapMatrix, scale, scale);
      translateMatrix(this.delegate.mapMatrix, -offset.x, -offset.y);
      let u_matLoc = this.delegate.gl.getUniformLocation(program, "u_matrix");
      // -- attach matrix value to 'mapMatrix' uniform in shader
      this.delegate.gl.uniformMatrix4fv(u_matLoc, false, this.delegate.mapMatrix);
      this.delegate.gl.drawArrays(this.delegate.gl.POINTS, 0, numPoints);
      if (this.delegate.state.mouseclick !== null) {
        
        let pixel = new Uint8Array(4);
        this.delegate.gl.readPixels(this.delegate.state.mouseclick.originalEvent.layerX, 
          this.canvas.height - this.delegate.state.mouseclick.originalEvent.layerY, 1, 1, this.delegate.gl.RGBA, this.delegate.gl.UNSIGNED_BYTE, pixel);
        let index = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
        this.delegate.setState({mouseclick: null})
        this.delegate.setIndex(index);
        this._redraw();
      }         
    }
  }

  /**
   * adds various event listeners to the canvas
   */
  addEventListeners() {
    this.canvas.addEventListener("webglcontextlost", function(event) {
      event.preventDefault();
      console.log("CRASH--recovering GL")
    }, false);
    this.canvas.addEventListener("webglcontextrestored", function(event) {
    this.gl = this.canvas.getContext('webgl', { antialias: true });
    }, false);
    this.leafletMap.addEventListener('mousemove', (event) => {
      this.onMouseMove(event);
    });
  }

  onMouseMove(e) {
    let lat = Math.round(e.latlng.lat * 100000) / 100000;
    let lng = Math.round(e.latlng.lng * 100000) / 100000;
    this.position.updateHTML(lat, lng);
  }

  callBackendAPI = async () => {
    //console.log("calling api...");
    const response = await fetch("https://" + this.state.host + '/api'); 
    const body = await response.json();
    if (response.status !== 200) {
      alert(body);   
      throw Error(body.message) 
    } else {
      console.log(body.express);
    }
    return body;
  };

  /**
   * Gets the devlopment or production host 
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
   * 
   * @param {array of late lngs} latlngs 
   */
  centreMap(latlngs) {
    if (latlngs.length !== 0) {
      let bounds = L.latLngBounds(latlngs);
      if (bounds.getNorthEast() !== bounds.getSouthWest()) {
        const map = this.map.leafletElement;
        map.fitBounds(bounds);
      }    
    } else {
      return;
    }
  }
/**
 * Loops through json objects and extracts fault information
 * Builds object containing fault information and calls redraw
 * @param {JSON array of fault objects received from db} data 
 * @param {String type of data ie. road or footpath} type
 */
  addGLMarkers(project, data, type, zoomTo) {
    let obj = {};
    let faults = [];
    let latlngs = [];
    let points = []; //TODO change to Float32Array to make selection faster
    let high = null;
    let med = null;
    if(this.state.login === "downer" || this.state.login === "odc") {
      high = "5";
      med = "4";
    } else {
      high = "1";
      med = "2";
    }
    for (var i = 1; i < data.length; i++) { //start at one index 0 will be black
      const position = JSON.parse(data[i].st_asgeojson);
      const lng = position.coordinates[0];
      const lat = position.coordinates[1];
      let latlng = L.latLng(lat, lng);
      let point = LatLongToPixelXY(lat, lng);
      if (type === "road") {
        if(data[i].priority === high) {
          points.push(point.x, point.y, 1.0, 0, 1.0, 1.0, i);
        } else if (data[i].priority === med) {
          points.push(point.x, point.y, 1.0, 0.5, 0, 1.0, i);
        } else if (data[i].priority === "99") {
          points.push(point.x, point.y, 0, 0, 1, 1.0, i);
        } else {
          points.push(point.x, point.y, 0, 0.8, 0, 1.0, i);
        }
      } else {
        if(data[i].grade === high) {
          points.push(point.x, point.y, 1.0, 0, 1.0, 1, i);
        } else if (data[i].grade === med) {
          points.push(point.x, point.y, 1.0, 0.5, 0, 1, i);
        } else {
          points.push(point.x, point.y, 0, 0.8, 0, 1, i);
        }
      }    
      latlngs.push(latlng);
      if (type === "footpath") {
        obj = {
          type: type,
          roadid: data[i].roadid,
          footapthid: data[i].footpathid,
          roadname: data[i].roadname,
          location: data[i].location,
          asset:  data[i].asset,
          fault: data[i].fault,
          cause: data[i].cause,
          size: data[i].size,
          grade: data[i].grade,
          photo: data[i].photoid,
          datetime: data[i].faulttime,
          latlng: latlng
        };
      } else {
        obj = {
          type: type,
          roadid: data[i].roadid,
          carriage: data[i].carriagewa,
          location: data[i].location,
          fault: data[i].fault,
          repair: data[i].repair,
          comment: data[i].comment,
          size: data[i].size,
          priority: data[i].priority,
          photo: data[i].photoid,
          datetime: data[i].faulttime,
          latlng: latlng
        };
      }   
      faults.push(obj);          
    }
    if (zoomTo) {
      this.centreMap(latlngs);
    }

    this.setState({objGLData: faults});
    this.setState({glpoints: points}); //Immutable reserve of original points
    this.redraw(points, null);
  }

  addCentrelines(data) {
    let lines = [];
    //let pointBefore = 0;
    //let pointAfter = 0;
    for (var i = 0; i < data.length; i++) {
      const linestring = JSON.parse(data[i].st_asgeojson);
      const rcClass = data[i].onrcclass; 
      if(linestring !== null) {       
        let segment = linestring.coordinates[0];
        var points = [];
        //let pixelSegment = null; 
        for (let j = 0; j < segment.length; j++) {
          let point = segment[j];
          let xy = LatLongToPixelXY(point[1], point[0]);     
          points.push(xy);
        }
        //pointBefore += points.length;
        if (points.length > 2) {
          //pixelSegment = RDP(points, 0.00000000001); //Douglas-Peckam simplify line
          let seg = {segment: points, class: rcClass};
          lines.push(seg);
          //pointAfter += points.length;
        }  else {
          let seg = {segment: points, class: rcClass};
          lines.push(seg);
          //pointAfter += points.length;
        }           
      }       
    } 
    this.setState({lineData: lines});  
    this.redraw(lines, null);
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
      this.setState({selectedGLMarker: []});
      this.setIndex(0); //simulate user click black screen
    } 
  }

  /**
   * Fired when user clciks photo on thumbnail
   * @param {event} e 
   */
  clickImage(e) {   
    this.setState({show: true});
    let photo = this.getGLFault(this.state.selectedIndex - 1, 'photo');
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
    let newSuffix = pad(n, 5);
    let prefix = photo.slice(0, photo.length - 5);
    let newPhoto = prefix + newSuffix;
    this.setState({currentPhoto: newPhoto});
    return newPhoto;
  }

  clickPrev(e) {
  const newPhoto = this.getPhoto("prev");
  this.setState({currentPhoto: newPhoto});
  const url = this.state.amazon + newPhoto + ".jpg";
  //console.log(url);
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
    this.setState({activeProject: null});
    this.setState({projects: []});
    this.setState({checkedFaults: []});
    this.setState({objData: []});
    this.setState({login: "Login"});
    this.setState({priorites: []});
    this.setState({checkboxes: []});
    this.setState({objGLData: null});
    this.setState({glpoints: []});
    this.rebuildFilters();
    this.redraw([]);
    this.setState({activeLayers: []});
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
      if (this.state.login === 'asm') {
        this.setState({priorityMode: "Priority"});
      }
    } else {
      this.setState({message: "Username or password is incorrect!"});
    }      
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
    Cookies.set('projects', JSON.stringify(obj), { expires: 7 })
    this.setState({projects: obj});
  }
  /**
   * checks if layer loaded if not adds layer to active layers
   * calls fetch layer
   * @param {event} e 
   * @param {string} type - the type of layer to load i.e. road or footpath
   */
  async loadLayer(e, type) { 
    e.persist();
    this.setState({projectMode: type})
    for(let i = 0; i < this.state.activeLayers.length; i += 1) { //check if loaded
      if (this.state.activeLayers[i].code === e.target.attributes.code.value) {  //if found
        return;
      }
    }
    let projects = null;
    let project = e.target.attributes.code.value; 
    if (type === "road") {
      projects = this.state.projects.road;
      await this.loadFilters(project);
      let dynamicDropdowns = [];
      for (let i = 0; i < this.state.faultClass.length; i++) {
        let dropdown = new DynamicDropdown(this.state.faultClass[i].description);
        dropdown.setCode(this.state.faultClass[i].code);
        let result = await this.requestFaults(project, this.state.faultClass[i].code);
        dropdown.setData(result);
        dropdown.setChecked();
        console.log(result);
        dynamicDropdowns.push(dropdown);
      }
      this.setState({filterDropdowns: dynamicDropdowns});
    } else {
      projects = this.state.projects.footpath;
      let dynamicDropdowns = [];
      let filters = ["Asset", "Zone", "Type", "Cause"];
      for (let i = 0; i < filters.length; i++) {
        let dropdown = new DynamicDropdown(filters[i]);
        let result = await this.requestDropdown(project, filters[i]);
        dropdown.setData(result);
        dynamicDropdowns.push(dropdown);
      }
      this.setState({filterDropdowns: dynamicDropdowns});
    }
    let layers = this.state.activeLayers;
    for (let i = 0; i < projects.length; i++) { //find project
      if (projects[i].code === e.target.attributes.code.value) {  //if found
        let project = {code: projects[i].code, description: projects[i].description, amazon: projects[i].amazon, 
          date: projects[i].date, surface: projects[i].surface, visible: true} //build project object
        this.setState({amazon: projects[i].amazon});
        layers.push(project);
        this.setState({activeLayer: project});
        break;
        }
    }
    await this.requestPriority(project);
    this.setState({activeLayers: layers});
    this.setState({activeProject: e.target.attributes.code.value});
    this.filterLayer(project, true); //fetch layer  
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
    if (this.state.login !== "Login") {
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
    }
    return result;
  }

  async requestPriority(project) {
    if (this.state.login !== "Login") {
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
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            console.log(body);
            this.buildPriority(body.priority);      
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }); 
    }
  }

  buildPriority(priority) {
    let arr = [];
    let arrb = [];
    for (let i = 0; i < priority.length; i++) {
      if (priority[i] === "99") {
        arr.push("Signage");
        arrb.push("99");
      } else {
        arr.push(this.state.priorityMode + " " + priority[i]);
        arrb.push(priority[i]);
      }
    }
    arr.sort();
    this.setState({filterPriorities: arrb});
    this.setState({priorities: arr});
  }

  rebuildFilters() {
    if (this.state.activeLayers.length === 0) {
      this.setState({prioritiesIndexed: []}); //immutable
      this.setState({priorities: []});
      this.setState({assets: []});//these hold values for building dynamic query
      this.setState({zones: []});
      this.setState({types: []});
      this.setState({causes: []});
      this.setState({priorityCheckboxes: []}); //these hold values for building menus
      this.setState({assetCheckboxes: []});
      this.setState({zoneCheckboxes: []});
      this.setState({typeCheckboxes: []});
      this.setState({causeCheckboxes: []});
      this.setState({filterDropdowns: []});
    }
  }

  /**
   * 
   * @param {event} e  - the menu clicked
   */
  removeLayer(e) {
    this.setState({objGLData: null});
    this.setState({glpoints: []});
    this.rebuildFilters();
    this.redraw([]);
    let layers = this.state.activeLayers;
    for(var i = 0; i < layers.length; i += 1) {     
      if (e.target.attributes.code.value === layers[i].code) {
        layers.splice(i, 1);
        break;
      }
    }
    //TODO clear the filter
    this.setState({activeLayers: layers});
    
  }

/**
 * Fetches marker data from server using priority and filter
 * @param {String} project data to fetch
 */
  async filterLayer(project, zoomTo) {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/layer', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.notFilter,
        priority: this.state.filterPriorities,
      })
      }).then(async (response) => {
        if(!response.ok) {
          throw new Error(response.status);
        } else {
          const body = await response.json();
          //console.log(body);
          if (body.error != null) {
            alert(`Error: ${body.error}\nSession has expired - user will have to login again`);
            let e = document.createEvent("MouseEvent");
            await this.logout(e);
          } else {
            if (body.type === "road") {
              await this.addGLMarkers(project, body.geometry, body.type, zoomTo);
            } else {
              await this.addGLMarkers(project, body.geometry, body.type, zoomTo);
            }
          }     
        }
      }).catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      });   
    }    
  }

  submitFilter(e) {
    this.setState({filterModal: false});
    this.setState({pageActive: 0});
    this.filterLayer(this.state.activeProject, false);
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
    if (this.state.login !== "Login") {
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
            //this.getFaultTypes(this.state.faultClass[0].code);
          }   
        })
        .catch((error) => {
          console.log("error: " + error);
          alert(error);
          return;
        }) 
       
      }
    }      
  }

  getArray(value) {
    if (value === "Asset") {
      return this.state.assetCheckboxes;
    } else if (value === "Zone") {
      return this.state.zoneCheckboxes;
    } else if (value === "Priority") {
      return this.state.priorityCheckboxes;
    } else if (value === "Cause") {
      return this.state.causeCheckboxes;
    } else { //type
      return this.state.typeCheckboxes;
    }
  }

  getQueryArray(value) {
    if (value === 0) {
      return this.state.assets;
    } else if (value === 1) {
      return this.state.zones;
    } else if (value === 2) {
      return this.state.types;
    } else {
      return this.state.causes;
    }
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

  clickPage(index) {
    this.setState({pageActive: index});
    this.getFaultTypes(this.state.faultClass[index].code);
  }

  /**
   * adds or removes fault to array  which keeps track of which faults are checked in the filter modal
   * @param {the button click event} e 
   */
  clickCheck(e, value) {
    //if checked true we are adding values to arr
    console.log(value);
    if (e.target.checked) {;
      //arr.push(e.target.id);
      value.setUnChecked(e.target.id);  
    }              
    // } else {
    //   for (var i = 0; i < arr.length; i += 1) {
    //     if (e.target.id === arr[i]) {
    //       arr.splice(i, 1);
    //       break;
    //     }
    //   }
    // }  
  }

  changeCheck(e) {

  }

/**
 * checks if each fault is checked by searching checkedFault array
 * @param {the dropdown} value 
 * * @param {the index of the fault within the dropdown} index 
 * @return {}
 */
  isUnChecked(value, index) {
    return !value.isUnChecked(value.data.result[index]);
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

  clickMenu(e, menu) {
    if (this.state.login === "Login") {
      return;
    }
    let checkbox = e.target;
    if (menu.length === 1) {
      if (e.target.checked) {
        menu.push(checkbox.id);
      } else {
        e.target.checked = true;      
      }
    } else {
      if (checkbox.checked) {
        menu.push(checkbox.id);
      } else {      
        menu.splice(menu.indexOf(checkbox.id), 1 );
      }
    }  
    //console.log(menu);
    this.filterLayer(this.state.activeProject, false);
  }

  clickDropdownInput(e) {
    console.log("click")
  }

  clickFilterBox(e, index) {
    let checkbox = e.target;
    console.log(checkbox)
    console.log(this.state.filterDropdowns[index].name);
    let filter = this.state.notFilter
    if (e.target.checked) {
      filter.splice(filter.indexOf(checkbox.id), 1 );
      
    } else {
      filter.push(checkbox.id);
    }
    this.setState({notFilter: filter});
    console.log(this.state.notFilter);
  }

  /**
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
  clickPriority(e) {
    if (this.state.login === "Login") {
      return;
    }
    let query = this.state.filterPriorities;
    let priority = null;
    if (e.target.id === "Signage") {
      priority = "99"
    } else {
      priority = e.target.id.substring(e.target.id.length - 1, e.target.id.length);
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
  /**
   * clear checked fault array 
   * @param {the button} e 
   */
  clearFilter(e) {
    this.setState({checkedFaults: []});
  }
  /**
   * select all faults on filter page
   */
  selectAll() {
    let arr = []
    this.state.faultTypes.map((value) => {
      return arr.push(value.fault);
    });
    this.setState({checkedFaults: arr});  
  } 
/**
 * gets the requested attribute from the fault object array
 * @param {the index of marker} index 
 * @param {the property of the fault} attribute 
 */
  getFault(index, attribute) {
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
        case "repair":
            return  this.state.objData[index].repair;
        case "comment":
            return  this.state.objData[index].comment;
        case "latlng":
            return  this.state.objData[index].latlng;
        default:
          return null;
      }
    } else {
      return null;
    }
  }

  /**
 * gets the requested attribute from the fault object array
 * @param {the index of marker} index 
 * @param {the property of the fault} attribute 
 */
getGLFault(index, attribute) {
  if (this.state.selectedGLMarker.length !== 0 && index !== null) {
    switch(attribute) {
      case "type":
        return  this.state.objGLData[index].type;
      case "fault":
        return  this.state.objGLData[index].fault;
      case "priority":        
        return  this.state.objGLData[index].priority;
      case "location":
        return  this.state.objGLData[index].location;
      case "size":
        return  this.state.objGLData[index].size;
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

  closePhotoModal(e) {
    e.preventDefault();
    this.setState({show: false});
    
  }

  clickLayer() {

    console.log("click");
  }

  hideLayer(e, index) {
    this.state.activeLayers[index].visible ? this.state.activeLayers[index].visible = false: this.state.activeLayers[index].visible = true

    //console.log(this.state.activeLayers[index]);
  }

  changeLayer(e) {
    console.log("redraw");
  }

  selectLayer(e, index) {
    console.log(this.state.activeLayers[index]);
    this.setState({activeLayer: this.state.activeLayers[index]});
  }

  onClear(e) {
    console.log("click");
  }

  onSelect(e, index) {

    console.log(e);
  }

  testClick(e) {
    console.log("click")
  }

  render() {

    const centre = [this.state.location.lat, this.state.location.lng];
    const { fault } = this.state.fault;
    let mode = this.state.projectMode; 
    const LayerNav = function LayerNav(props) { 
      if (props.layers.length > 0) {
        if(mode === "road") {
          return (
            <Nav>          
            <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
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
              {/* <NavDropdown.Divider />
              <NavDropdown.Item className="navdropdownitem" onClick={props.addCentreline}>Add centreline </NavDropdown.Item> */}
              <NavDropdown.Divider />
              <NavDropdown.Item className="navdropdownitem" onClick={props.clickFilter}>Filter Layer</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          );
        } else {
          return (
            <Nav>          
            <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
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
          <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
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
    const CustomMenu = function(props) {
      if (typeof props.projects === 'undefined' || props.projects.length === 0) {
          return (  
            <div></div>  
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

    const CustomPopup = function(props) {
      let location = props.data.location;
      if (props.data.type === "footpath") {
        location = props.data.roadname;
      }
      return (
        <Popup className="popup" position={props.position}>
          <div>
            <p className="faulttext">
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

    const CustomTable = function(props) {
      if(props.obj.type === "road") {
        return (
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                  <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                  <b>{"Location: "} </b> {props.obj.location}<br></br>
                  <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng}
              </div>
              <div className="col-md-6">
                <b>{"Repair: "}</b>{props.obj.repair}<br></br> 
                <b>{"Sign Code: "}</b>{props.obj.comment}<br></br> 
                <b>{"DateTime: "} </b> {props.obj.datetime}
              </div>
            </div>
          </div>	 
        );
      } else if(props.obj.type === "footpath") {
        return (
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                  <b>{"Type: "}</b> {props.obj.fault} <br></br> 
                  <b>{"Priority: "} </b> {props.obj.grade} <br></br>
                  <b>{"Location: "} </b> {props.obj.roadname}<br></br>
                  <b>{"Lat: "}</b>{props.obj.latlng.lat}<b>{" Lng: "}</b>{props.obj.latlng.lng + "  "}  
                  <Button variant="outline-secondary" 
                   size="sm" 
                   onClick={props.copy} 
                   active >Copy
                   </Button>
              </div>
              <div className="col-md-6">
                <b>{"Cause: "}</b>{props.obj.cause} <br></br> 
                <b>{"Size: "}</b> {props.obj.size} m<br></br> 
                <b>{"DateTime: "} </b> {props.obj.datetime}
              </div>
            </div>
          </div>	 
        );
      }    
    }

    const CustomInput = function(props) {
      if (props.mode === "road") {
        return (
          <input
            key={`${props.index}`} 
            id={props.value} 
            type="checkbox" 
            defaultChecked
            onClick={props.onClick}
          >
          </input>
        );
      } else {
        return(<div></div>)
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
                removeLayer={(e) => this.removeLayer(e)} 
                loadRoadLayer={(e) => this.loadLayer(e, 'road')} 
                loadFootpathLayer={(e) => this.loadLayer(e, 'footpath')}
                addCentreline={(e) => this.loadCentreline(e)} 
                clickFilter={(e) => this.clickFilter(e)}>
              </LayerNav>
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
          ref={(ref) => { this.map = ref; }}
          className="map"
          worldCopyJump={true}
          boxZoom={true}
          center={centre}
          zoom={this.state.zoom}
          onClick={(e) => this.clickMap(e)}
          onZoom={(e) => this.onZoom(e)}
          onPopupClose={(e) => this.closePopup(e)}>
          <TileLayer className="mapLayer"
            attribution={this.state.attribution}
            url={this.state.url}
            zIndex={998}
          />
          <ScaleControl className="scale"/>

          <Dropdown
            className="Priority">
          <Dropdown.Toggle variant="light" size="sm" >
              {this.state.priorityMode}
            </Dropdown.Toggle>
            <Dropdown.Menu className="custommenu">
            {this.state.priorities.map((value, index) =>
                <div key={`${index}`}>
                  <input
                    key={`${index}`} 
                    id={value} 
                    type="checkbox" 
                    defaultChecked 
                    onClick={(e) => this.clickPriority(e)}>
                  </input>{" " + value}<br></br>
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
                {value.name}
              </Dropdown.Toggle>
              <Dropdown.Menu className="custommenu">
                {value.data.result.map((input, index) =>
                  <div key={`${index}`}>
                    <input
                      key={`${index}`} 
                      id={input} 
                      type="checkbox" 
                      checked={this.isUnChecked(value, index)} 
                      onChange={(e) => this.changeCheck(e)}
                      onClick={(e) => this.clickCheck(e, value)}
                      >
                    </input>{" " + input}<br></br>
                  </div> 
                  )}
                <Dropdown.Divider />
                <CustomButtons 
                  length={value.data.result.length} 
                  index={indexNo} 
                  onClear={(e) => this.onClear(e)}
                  onSelect={(e) => this.onSelect(e)}
                  >
                </CustomButtons>
              </Dropdown.Menu>
            </Dropdown>
          )}
          </div>
          <Image 
            className="satellite" 
            src={this.state.osmThumbnail} 
            onClick={(e) => this.toogleMap(e)} 
            thumbnail={true}/>
            <LayerGroup >
            {this.state.selectedGLMarker.map((obj, index) =>  
            <CustomPopup 
              key={`${index}`} 
              data={obj}
              position={obj.latlng}
              src={this.state.amazon + obj.photo + ".jpg"} 
              onClick={(e) => this.clickImage(e)}>
            </CustomPopup>
            )}
            </LayerGroup>
          <Dropdown 
            className="layers" 
            >
            <Dropdown.Toggle variant="light" size="sm" >
              Layers
            </Dropdown.Toggle>
            <Dropdown.Menu className="layermenu">
            {this.state.activeLayers.map((value, index) => 
            //  <Dropdown.Item className="layermenu" key={`${index}`} >
              <div className="layeritem" key={`${index}`}
              onClick={(e) => this.selectLayer(e, index)}
              >
                <input
                  key={`${index}`} 
                  id={value.code} 
                  type="checkbox"
                  onClick={(e) => this.hideLayer(e, index)}
                  onChange={(e) => this.changeLayer(e)}
                  checked={value.visible}>
                </input>{" " + value.description + " " + value.date}<br></br>
              </div> 
                // </Dropdown.Item>     
            )}
            </Dropdown.Menu>
          </Dropdown>
      </LMap >  
      
      </div>
      {/*filter modal */}
      <Modal 
        className="filterModal" 
        show={this.state.filterModal} 
        size={'lg'} centered={true}>
        <Modal.Header>
          <Modal.Title>Filter</Modal.Title><br></br>
          <Pagination size="sm">
            {this.state.faultClass.map((value, index) =>        
              <Pagination.Item  
                key={`${index}`} 
                id={value} className={"page-item"} 
                active={index === this.state.pageActive} 
                onClick={() => this.clickPage(index)}>{value.description}
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
              <input type="checkbox" id={value.fault} 
              checked={this.isChecked(value.fault)} 
              onChange={(e) => this.changeCheck(e)}/> {value.fault}        
              </td>
              <td>
              </td>
            </tr>
          )}
          </tbody>
          </Table>
		    </Modal.Body>
        <Modal.Footer>
          <div>
            <Button className="clear" variant="primary" type="submit" onClick={(e) => this.clearFilter(e)}>
              Clear Filter
            </Button>
          </div>
          <div>
            <Button className="select" variant="primary" type="submit" onClick={() => this.selectAll()}>
              Select All
            </Button>
          </div>
          <div>
            <Button className="submit" variant="primary" type="submit" onClick={(e) => this.submitFilter(e)}>
              Filter
            </Button>
          </div>       
        </Modal.Footer>
      </Modal>
          {/*help nav */}
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
          <b>Road Inspection Version 1.2</b><br></br>
          Relased: 23/04/2020<br></br>
          Company: Onsite Developments Ltd.<br></br>
          Software Developer: Matt Wynyard <br></br>
          <img src="logo192.png" alt="React logo"width="24" height="24"/> React: 16.12.0<br></br>
          <img src="webgl.png" alt="WebGL logo" width="60" height="24"/> WebGL: 1.0<br></br>
          <img src="bootstrap.png" alt="Bootstrap logo" width="24" height="24"/> Bootstrap: 4.4.0<br></br>
          <img src="leafletlogo.png" alt="Leaflet logo" width="60" height="16"/> Leaflet: 1.6.0<br></br>
          <img src="reactbootstrap.png" alt="React-Bootstrap logo" width="24" height="24"/> React-bootstrap: 1.0.0-beta.16<br></br>
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
              ref={key=> this.passwordInput = key}/>
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
      <Modal dialogClassName={"photoModal"} show={this.state.show} size='xl' centered={true}>
        <Modal.Body className="photoBody">	
          <div className="container">
          {this.state.selectedGLMarker.map((obj, index) => 
            <img
              key={`${index}`}  
              className="photo" 
              src={this.state.amazon + this.state.currentPhoto + ".jpg"} 
              data={fault}>
            </img>
          )}
            <img 
              className="leftArrow" 
              src={"leftArrow_128.png"} 
              onClick={(e) => this.clickPrev(e)}/> 
            <img 
              className="rightArrow" 
              src={"rightArrow_128.png"} 
              onClick={(e) => this.clickNext(e)}/>
          </div>
		    </Modal.Body >
        <Modal.Footer>
        {this.state.selectedGLMarker.map((obj, index) =>  
          <CustomTable
          key={`${index}`}  
          obj={this.getGLFault(this.state.selectedIndex - 1, null)}
            //TODO copy not working
            copy={(e) => this.copyToClipboard(e, () => this.getGLFault('latlng'))}>       
          </CustomTable >
          )}
          <Button variant="primary" onClick={(e) => this.closePhotoModal(e)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      </>
    );
  }
}
export default App;

