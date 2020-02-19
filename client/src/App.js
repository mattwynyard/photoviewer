import React from 'react';
import { Map, TileLayer, Marker, Polyline, Popup, ScaleControl, LayersControl, LayerGroup}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Modal, Button, Dropdown, Image, Form, Accordion, Card, Table, Pagination}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import CustomNav from './CustomNav.js';
import Cookies from 'js-cookie';
import './L.CanvasOverlay';
import Vector2D from './Vector2D';

function LatLongToPixelXY(latitude, longitude) {
  var pi_180 = Math.PI / 180.0;
  var pi_4 = Math.PI * 4;
  var sinLatitude = Math.sin(latitude * pi_180);
  var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
  var pixelX = ((longitude + 180) / 360) * 256;

  var pixel = { x: pixelX, y: pixelY };

  return pixel;
}

function translateMatrix(matrix, tx, ty) {
  // translation is in last column of matrix
  matrix[12] += matrix[0] * tx + matrix[4] * ty;
  matrix[13] += matrix[1] * tx + matrix[5] * ty;
  matrix[14] += matrix[2] * tx + matrix[6] * ty;
  matrix[15] += matrix[3] * tx + matrix[7] * ty;
}

function scaleMatrix(matrix, scaleX, scaleY) {
  // scaling x and y, which is just scaling first two columns of matrix
  matrix[0] *= scaleX;
  matrix[1] *= scaleX;
  matrix[2] *= scaleX;
  matrix[3] *= scaleX;

  matrix[4] *= scaleY;
  matrix[5] *= scaleY;
  matrix[6] *= scaleY;
  matrix[7] *= scaleY;
}

// Returns a random integer from 0 to range - 1.
function randomInt(range) {
  return Math.floor(Math.random() * range);
}


class App extends React.Component {

  constructor(props) {
    
    super(props);
    this.customNav = React.createRef();
    this.state = {
      location: {
        lat: -41.2728,
        lng: 173.2995,
      },
      high : true,
      med : true,
      low : true,
      priorities: [5, 4, 3], //todo fix for fulton hogan etc.
      host: this.getHost(),
      token: Cookies.get('token'),
      login: this.getUser(),
      loginModal: this.getLoginModal(this.getUser()),
      zIndex: 900,
      tileServer: "//api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=" + process.env.MAPBOX,
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
      user: this.getUser(),
      password: null,
      projectArr: this.getProjects(),
      faultClass: [],
      faultTypes: [],
      pageActive: 0,
      checkedFaults: [],
      checked: false,
      activeProject: null,
      activeLayers: [],
      clearDisabled: true,
      message: "",
      data: []

    };
    
  }

  getHost() {
    if (process.env.NODE_ENV === "development") {
      return "localhost:8443";
    } else if (process.env.NODE_ENV === "production") {
      return "osmium.nz";
    } else {
      return "localhost:8443";
    }
   }

  //  getProtocol() {
  //    console.log("secure: " + process.env.REACT_APP_SECURE);
  //    if (process.env.REACT_APP_SECURE === true) {
  //      return "https://";
  //    } else {
  //      return "http://";
  //     }
  //  }
  componentDidMount() {
    // Call our fetch function below once the component mounts
    this.customNav.current.setTitle(this.state.user);
    this.customNav.current.setOnClick(this.state.loginModal);
    this.callBackendAPI()
    .catch(err => alert(err));
  }

  getMiter(p0, p1, p2, thickness) {
    var p2p1 = Vector2D.subtract(p2, p1);
    var p1p0 = Vector2D.subtract(p1, p0);
    var y = p2p1.y * -1;
    var normal = new Vector2D(y, p2p1.x);
    var normalized = normal.normalize();
    p2p1.normalize();
    p1p0.normalize();
    var p2p1 = Vector2D.subtract(p2, p1);
    var tangent = Vector2D.add(p2p1, p1p0);    
    var nTangent = tangent.normalize();
    var y = nTangent.y * -1;
    var miter = new Vector2D(-nTangent.y, nTangent.x);
    var length = thickness / Vector2D.dot(miter, normalized);
    var l = miter.multiply(length);
    return new Vector2D(l.x, l.y);
  }

  redraw(data, map) {
    const leafletMap = this.map.leafletElement;
    this.glLayer = L.canvasOverlay()
                        .drawing(drawingOnCanvas)
                       .addTo(leafletMap);
    this.canvas = this.glLayer.canvas();
    this.glLayer.canvas.width = this.canvas.width;
    this.glLayer.canvas.height = this.canvas.height;
    this.gl = this.canvas.getContext('webgl', { antialias: true });
    this.addEventListeners(); //handle lost gl context
    var pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);
        // -- WebGl setup
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, document.getElementById('vshader').text);
    this.gl.compileShader(vertexShader);
    var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
    this.gl.compileShader(fragmentShader);

    // link shaders to create our program
    var program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
  //  gl.disable(gl.DEPTH_TEST);
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
    // -- data
   
    let verts = [];
    let thickness = 0.0001;
    for (var i = 0; i < data.length; i += 1) {
      console.log(data[i]);
      if(data[i].length < 3 ) {
        //console.log(data[i]);
        continue;
      }
      
      for (var j = 0; j < data[i].length; j += 1) {
        let r = Math.random();
        let g = Math.random();
        let b = Math.random();
      if (j === 0) {
        const pixel0 = LatLongToPixelXY(data[i][j][0], data[i][j][1]);
        const pixel1 = LatLongToPixelXY(data[i][j + 1][0], data[i][j + 1][1]);
        const pixel2 = LatLongToPixelXY(data[i][j + 2][0], data[i][j + 2][1]);
        let p0 = new Vector2D(pixel0.x, pixel0.y);
        let p1 = new Vector2D(pixel1.x, pixel1.y);
        let line = Vector2D.subtract(p1, p0);
        let normal = new Vector2D(-line.y, line.x)
        let normalized = normal.normalize();
        let a = p0.subtract(normalized.multiply(thickness));
        normal = new Vector2D(-line.y, line.x);
        normalized = normal.normalize();
        p0 = new Vector2D(pixel0.x, pixel0.y);
        let b = p0.add(normalized.multiply(thickness));

        p0 = new Vector2D(pixel0.x, pixel0.y);
        p1 = new Vector2D(pixel1.x, pixel1.y);
        let p2 = new Vector2D(pixel2.x, pixel2.y);

        let miter = this.getMiter(p0, p1, p2, thickness);
        p1 = new Vector2D(pixel1.x, pixel1.y);
        let c = p1.subtract(miter);
        p1 = new Vector2D(pixel1.x, pixel1.y);
        let d = p1.add(miter);
        // var r = Math.random();
        // var g = Math.random();
        // var b = Math.random();
        //console.log(a);
        //console.log(b);
        //console.log(c);
        //console.log(d);
        verts.push(a.x, a.y, r, g, b);
        verts.push(b.x, b.y, r, g, b);
        verts.push(c.x, c.y, r, g, b);
        verts.push(c.x, c.y, r, g, b); 
        verts.push(d.x, d.y, r, g, b);
        verts.push(b.x, b.y, r, g, b);

       } else if (j === data[i].length - 2) {

        var pixel0 = LatLongToPixelXY(data[i][j + 1][0], data[i][j + 1][1]);
        var pixel1 = LatLongToPixelXY(data[i][j][0], data[i][j][1]);
        var pixel2 = LatLongToPixelXY(data[i][j - 1][0], data[i][j - 1][1]);
        let p0 = new Vector2D(pixel0.x, pixel0.y);
        let p1 = new Vector2D(pixel1.x, pixel1.y);
        var line = p1.subtract(p0);
        var normal = new Vector2D(-line.y, line.x)
        var normalized = normal.normalize();
        var a = p0.subtract(normalized.multiply(thickness));
        var normal = new Vector2D(-line.y, line.x);
        var normalized = normal.normalize();
        p0 = new Vector2D(pixel0.x, pixel0.y);
        let b = p0.add(normalized.multiply(thickness));

        p0 = new Vector2D(pixel0.x, pixel0.y);
        p1 = new Vector2D(pixel1.x, pixel1.y);
        let p2 = new Vector2D(pixel2.x, pixel2.y);

        var miter = this.getMiter(p0, p1, p2, thickness);

        p1 = new Vector2D(pixel1.x, pixel1.y);
        var c = p1.subtract(miter);
        p1 = new Vector2D(pixel1.x, pixel1.y);
        var d = p1.add(miter);
        //console.log(a);
        //console.log(b);
        //console.log(c);
        //console.log(d);
        
        verts.push(a.x, a.y, r, g, b);
        verts.push(b.x, b.y, r, g, b);
        verts.push(c.x, c.y, r, g, b);
        verts.push(c.x, c.y, r, g, b); 
        verts.push(d.x, d.y, r, g, b);
        verts.push(b.x, b.y, r, g, b);
        //console.log("end");
        break;

       } else {
        //console.log("middle");
        const pixel0 = LatLongToPixelXY(data[i][j -1][0], data[i][j -1][1]);
        const pixel1 = LatLongToPixelXY(data[i][j][0], data[i][j][1]);
        const pixel2 = LatLongToPixelXY(data[i][j + 1][0], data[i][j + 1][1]);
        const pixel3 = LatLongToPixelXY(data[i][j + 2][0], data[i][j + 2][1]);
        var p0 = new Vector2D(pixel0.x, pixel0.y);
        var p1 = new Vector2D(pixel1.x, pixel1.y);
        var p2 = new Vector2D(pixel2.x, pixel2.y);
        var p3 = new Vector2D(pixel3.x, pixel3.y);
        //meter calc

        var miter1 = this.getMiter(p0, p1, p2, thickness);
        var p1 = new Vector2D(pixel1.x, pixel1.y);
        var p2 = new Vector2D(pixel2.x, pixel2.y);
        var p3 = new Vector2D(pixel3.x, pixel3.y);
        var miter2 = this.getMiter(p1, p2, p3, thickness);

        var v1 = new Vector2D(pixel1.x, pixel1.y);
        var v2 = new Vector2D(pixel2.x, pixel2.y);
        var c = Vector2D.add(v1, miter1);
        var d = Vector2D.subtract(v1,  miter1);
        var e = Vector2D.add(v2, miter2);
        var f = Vector2D.subtract(v2,  miter2);
        // var r = Math.random();
        // var g = Math.random();
        // var b = Math.random();
        verts.push(c.x, c.y, r, g, b);
        verts.push(d.x, d.y, r, g, b);
        verts.push(e.x, e.y, r, g, b);
        verts.push(e.x, e.y, r, g, b);
        verts.push(f.x, f.y, r, g, b);
        verts.push(d.x, d.y, r, g, b);

        //console.log(a);
        //console.log(b);
        //console.log(c);
        //console.log(d);

      }
    }
  }
    //console.log(verts);
    var vertBuffer = this.gl.createBuffer();
    var vertArray = new Float32Array(verts);
    var fsize = vertArray.BYTES_PER_ELEMENT;

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false,fsize*5,0);
    this.gl.enableVertexAttribArray(vertLoc);
    // -- offset for color buffer
    this.gl.vertexAttribPointer(colorLoc, 3, this.gl.FLOAT, false, fsize*5, fsize*2);
    this.gl.enableVertexAttribArray(colorLoc);
    this.glLayer.gl = this.gl; //set gl in canvas
    this.glLayer.mapMatrix = this.mapMatrix; //set matrix in canvas
    this.glLayer.redraw();

    function drawingOnCanvas(canvasOverlay, params) {
      if (params.gl == null)  {
        return;
      }
      params.gl.clear(this.gl.COLOR_BUFFER_BIT);
      var pixelsToWebGLMatrix = new Float32Array(16);
      pixelsToWebGLMatrix.set([2 / params.canvas.width, 0, 0, 0, 0, -2 / params.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      params.gl.viewport(0, 0, params.canvas.width, params.canvas.height);
      var pointSize = Math.max(leafletMap.getZoom() - 4.0, 1.0);
      params.gl.vertexAttrib1f(params.gl.aPointSize, pointSize);
      // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
      params.mapMatrix.set(pixelsToWebGLMatrix);
      var bounds = leafletMap.getBounds();
      var topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
      var offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
      // -- Scale to current zoom
      var scale = Math.pow(2, leafletMap.getZoom());
      scaleMatrix(params.mapMatrix, scale, scale);
      translateMatrix(params.mapMatrix, -offset.x, -offset.y);
      var u_matLoc = params.gl.getUniformLocation(program, "u_matrix");
      // -- attach matrix value to 'mapMatrix' uniform in shader
      params.gl.uniformMatrix4fv(u_matLoc, false, params.mapMatrix);
      var pointer = 0;
      for (var i = 0; i < data.length; i += 1) {
        //console.log(map[i]);
        var numPoints = (data[i].length - 1) * 6;
        //console.log(numPoints);
        params.gl.drawArrays(params.gl.TRIANGLES, pointer, numPoints);
        pointer += numPoints;
      }
      //console.log(leafletMap.getZoom());
      //console.log(pointer);
    }
  }

  

  componentDidUpdate() {  
    
  }

  addEventListeners() {
    this.canvas.addEventListener("webglcontextlost", function(event) {
      event.preventDefault();
      console.log("CRASH--recovering GL")
    }, false);
    this.canvas.addEventListener(
    "webglcontextrestored", function(event) {
    this.gl = this.canvas.getContext('webgl', { antialias: true });
    }, false);
  }

  callBackendAPI = async () => {
    //console.log("calling api...");
    const response = await fetch("https://" + this.state.host + '/api'); 
    const body = await response.json();
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
    let icon = null;
    const size = this.getSize(zoom);
    if (data === "5") {
      icon = L.icon({
      iconUrl: 'CameraRed_16px.png',
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
    let latLngs = [];
    for (var i = 0; i < data.length; i++) {
      let obj = {};
      const position = JSON.parse(data[i].st_asgeojson);
      const lng = position.coordinates[0];
      const lat = position.coordinates[1];
      let latlng = L.latLng(lat, lng);
      latLngs.push(latlng);
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
    if (latLngs.length !== 0) {
      let bounds = L.latLngBounds(latLngs);
      if (bounds.getNorthEast() !== bounds.getSouthWest()) {
        const map = this.map.leafletElement;
        map.fitBounds(bounds);
      }    
    }
    this.setState({objData: objData});
  }

  addCentrelines(data) {
    let lineData = [];
    //console.log(data.length);
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
      //console.log(lineData);
      lineData.push(points);
    }
    var lines = [];
    var dataMap = []; //array to keep track of lengths of segments
    lineData.map((d, i) => {
      var segment = [];
      lineData[i].map((n, j) => {
        
        var coord = [n.lat, n.lng];
        //console.log(coord);
        segment.push(coord);
      });
      if (i % 1 == 0) {
        lines.push(segment);
        dataMap.push(lineData[i].length);
      }
      
    });
    //let staticData = [[-36.917365206, 174.643535046],[-36.917493086, 174.644253555],[-36.917500885, 174.644287904],[-36.917505374, 174.644315907],
    //[-36.917509427, 174.644365589],[-36.91750806, 174.64442263],[-36.917501645, 174.644471941],[-36.917489289, 174.644523863]];
    //let staticData = [[-36.917365206, 174.643535046],[-36.917509427, 174.644365589],[-36.917489289, 174.644523863]];
    this.redraw([lines[9000]], dataMap[9000]);
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
   * Fired when user clciks photo on thumbnail
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

  /**
   * resets to null state when user logouts
   */
  reset() {
    
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('projects');
    this.customNav.current.setOnClick((e) => this.clickLogin(e));
    this.customNav.current.setTitle("Login");
    this.setState({activeProject: null})
    this.setState({projectArr: []});
    this.setState({checkedFaults: []});
    this.setState({objData: []});
    this.setState({activeLayers: []});
    this.setState({login: "Login"});
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
      throw Error(body.message) 
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
    //console.log(body);
    if (response.status !== 200) {
      throw Error(body.message) 
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
      this.setState({message: ""})
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
    let prj = []
    for(var i = 0; i < projects.length; i += 1) {
      prj.push(projects[i]);
    }
    Cookies.set('projects', JSON.stringify(prj), { expires: 7 })
    this.setState({projectArr: prj});
  }

  /**
   * checks if layer loaded if not adds layer to active layers
   * calls fetch layer
   * @param {event} e 
   */
  loadLayer(e) {   
    for(var i = 0; i < this.state.activeLayers.length; i += 1) { //check if loaded
      if (this.state.activeLayers[i].code === e.target.attributes.code.value) {  //if found
        return;
      }
    }
    this.setState({activeProject: e.target.attributes.code.value});
    for (var i = 0; i < this.state.projectArr.length; i += 1) { //find project
      if (this.state.projectArr[i].code === e.target.attributes.code.value) {  //if found
        let project = {code: this.state.projectArr[i].code, description: this.state.projectArr[i].description, date: this.state.projectArr[i].date}
        this.setState({amazon: this.state.projectArr[i].amazon});
        this.state.activeLayers.push(project);
      }
    }
    this.filterLayer(e.target.attributes.code.value);     
  }

  removeLayer(e) {
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
 * 
 * @param {String} project data to fetch
 */
  async filterLayer(project) {
    //console.log(this.state.priorities);
    if (this.state.login !== "Login") {
      const response = await fetch('https://' + this.state.host + '/layer', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: this.state.login,
        project: project,
        filter: this.state.checkedFaults,
        priority: this.state.priorities,
      })
    }).catch(() => {
      console.log("error");
      return;
    });
    if (typeof response !== "undefined" && response.status === 200) {
      const body = await response.json();  
      await this.addMarkers(body);
    } else {     
    }    
  }    
}

submitFilter(e) {
  this.setState({filterModal: false});
  this.filterLayer(this.state.activeProject);

}

async loadCentreline(e) {
  if (this.state.login !== "Login") {
      const response = await fetch('https://' + this.state.host + '/roads', {
      method: 'POST',
      headers: {
        "authorization": this.state.token,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: "076",
        menu: e.target.id,
        user: this.state.login
      })
    })
    if (response.status !== 200) {
      console.log(response.status);
    } 
    const body = await response.json();
    //console.log(body);
    await this.addCentrelines(body);
  } else {
    
  }    
}

  async loadFilters() {
    if (this.state.login !== "Login") {
      const response = await fetch('https://' + this.state.host + '/class', {
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
    if (this.state.login !== "Login") {
      const response = await fetch('https://' + this.state.host + '/faults', {
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

  clickPriority(e) {
    this.setState({index: null});
  let priQuery = this.state.priorities
    switch(e.target.id) {
      case "5":
        if (e.target.checked) {
          priQuery.push(5);
        } else {      
          priQuery.splice(priQuery.indexOf(5), 1 );
        }
        break;
      case "4":
        if (e.target.checked) {
          priQuery.push(4);
        } else {      
          priQuery.splice(priQuery.indexOf(4), 1 );
        }
        break;
      case "3":
        if (e.target.checked) {
          priQuery.push(3);
        } else {      
          priQuery.splice(priQuery.indexOf(3), 1 );
        }
        break;
      default:
        // code block
    }
    this.setState({priorities: priQuery})
    this.filterLayer(this.state.activeProject);
    //console.log(this.state.priorities)
  }

  /**
   * clear checked fault array 
   * @param {the button} e 
   */
  clearFilter(e) {
    this.setState({checkedFaults: []});
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

  render() {

    const centre = [this.state.location.lat, this.state.location.lng];
    const { fault } = this.state.fault;
    const { photo } = this.state.photos;  
    //const ref = React.createRef();

    const CustomTile = function CustomTile (props) {
        return (
            <TileLayer className="mapLayer"
            attribution="&amp;copy <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors and Chat location by Iconika from the Noun Project"
            url={"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
          />
      );
    }

    const LayerNav = function LayerNav(props) {
      if (props.layers.length > 0) {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
            <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} onClick={props.loadLayer}/>
            <NavDropdown.Divider />
            {/* <NavDropdown.Item className="navdropdownitem" href="#centreline" onClick={(e) => this.removeLayer(e)}>Remove Layer </NavDropdown.Item>
            <NavDropdown.Divider /> */}
            <CustomMenu title="Remove Layer" className="navdropdownitem" projects={props.layers} onClick={props.removeLayer}/>
            <NavDropdown.Divider />
            <NavDropdown.Item className="navdropdownitem" href="#centreline" onClick={props.addCentreline}>Add centreline </NavDropdown.Item>
            <NavDropdown.Divider />
            <NavDropdown.Item className="navdropdownitem" href="#filter"  onClick={props.clickFilter}>Filter Layer</NavDropdown.Item>
          </NavDropdown>
        </Nav>
        );
      } else {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
            <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} layers={props.layers} onClick={props.loadLayer}/>
            {/* <NavDropdown.Divider />
            <NavDropdown.Item title="Remove Layer" className="navdropdownitem" href="#centreline" onClick={(e) => this.removeLayer(e)}>Remove layer</NavDropdown.Item> */}
            {/* <NavDropdown.Divider />
            <NavDropdown.Item className="navdropdownitem" href="#filter"  onClick={(e) => this.clickFilter(e)}>Filter Layer</NavDropdown.Item> */}
          </NavDropdown>
        </Nav>
        );
      }
    }
    const CustomMenu = function(props) {
      if (typeof props.projects === 'undefined' || props.projects.length === 0) {
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
              <LayerNav project={this.state.activeProject} projects={this.state.projectArr} layers={this.state.activeLayers} 
                        removeLayer={(e) => this.removeLayer(e)} loadLayer={(e) => this.loadLayer(e)} 
                        addCentreline={(e) => this.loadCentreline(e)} clickFilter={(e) => this.clickFilter(e)}></LayerNav>
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
            <CustomNav ref={this.customNav} className="navdropdown"/>
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
            zIndex={998}
          />
          <ScaleControl/>
          <Accordion className="priority">
            <Card>
              <Accordion.Toggle className ="btn btn-secondary dropdown-toggle" as={Button} variant="light" eventKey="0">
                Priority
              </Accordion.Toggle>           
              <Accordion.Collapse eventKey="0">
                <Card.Body>
                  <input id="5" type="checkbox" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Priority 5<br></br>
                <input type="checkbox" id="4" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Priority 4<br></br>
                <input type="checkbox" id="3" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Priority 3</Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
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
                  riseOnHover={true}
                  onClick={(e) => this.clickMarker(e)}				  
                  >
                  <Popup className="popup">
                  <div>
                    <p className="faulttext">
                      <b>{"Type: "}</b> {this.getFault(index, 'fault')} <br></br> <b>{"Priority: "} </b> 
                      {this.getFault(index, 'priority')} <br></br><b>{"Location: "} </b> {this.getFault(index, 'location')}
                    </p>
                    <div>
                    <Image className="thumbnail" 
                      src={this.state.amazon + this.getFault(index, 'photo') + ".jpg"} 
                      photo={photo} 
                      onClick={(e) => this.clickImage(e)} 
                      thumbnail={true}></Image >
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
            weight={2}
            color={this.getColor()}
            smoothFactor={5}
            positions={latlngs}>
          </Polyline>
          )}      
      </Map >     
      </div>
      {/*filter modal */}
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
            <Form.Control type="text" placeholder="Enter username" ref={user => this.userInput = user} />
          </Form.Group>
          <Form.Text className= "message">{this.state.message}</Form.Text>
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

      {/*photo modal */}    
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

