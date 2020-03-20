import React from 'react';
import { Map, TileLayer, Marker, Polyline, Popup, ScaleControl, LayersControl, LayerGroup}  from 'react-leaflet';
import {Navbar, Nav, NavDropdown, Modal, Button, Image, Form, Accordion, Card, Table, Pagination}  from 'react-bootstrap';
import L from 'leaflet';
import './App.css';
import CustomNav from './CustomNav.js';
import Cookies from 'js-cookie';
import './L.CanvasOverlay';
import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix, pad, getColor} from  './util.js'

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
      priorities: [1, 2, 3, 99], //todo fix for fulton hogan etc.
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
      lineData: null,
      mouse: null,
      coordinates: null //coordinates of clicked marker
    };   
  }

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

  componentDidMount() {
    // Call our fetch function below once the component mounts
    this.customNav.current.setTitle(this.state.user);
    this.customNav.current.setOnClick(this.state.loginModal);
    this.callBackendAPI()
    .catch(err => alert(err));
  }

  getMiter(p0, p1, p2, thickness) {
    let p2p1 = Vector2D.subtract(p2, p1);
    let p1p0 = Vector2D.subtract(p1, p0);
    let y = p2p1.y * -1;
    let normal = new Vector2D(y, p2p1.x);
    let normalized = normal.normalize();
    p2p1.normalize();
    p1p0.normalize();
    p2p1 = Vector2D.subtract(p2, p1);
    let tangent = Vector2D.add(p2p1, p1p0);    
    let nTangent = tangent.normalize();
    y = nTangent.y * -1;
    let miter = new Vector2D(-nTangent.y, nTangent.x);
    let length = thickness / Vector2D.dot(miter, normalized);
    if (length > thickness * 1.5 || length < thickness * 0.5) {
      return new Vector2D(0, 0);
    }
    let l = miter.multiply(length);
    return new Vector2D(l.x, l.y);
  
  }

  clickCanvas(e) {
    const position = this.map.leafletElement.mouseEventToLatLng(e);
    let coordinate = LatLongToPixelXY(position.lat, position.lng);
    //console.log(coordinate);
    if (this.state.lines !== null) {
      this.redraw(this.state.lineData, coordinate);
    }
  }

  redraw(data, mouseclick) {
    console.log("drawing")
    const leafletMap = this.map.leafletElement;
    if (this.gl == null) {
      this.glLayer = L.canvasOverlay()
      //.drawing(drawingOnCanvas)
      .addTo(leafletMap);
    this.canvas = this.glLayer.canvas();
    
    this.glLayer.canvas.width = this.canvas.width;
    this.glLayer.canvas.height = this.canvas.height;
    this.gl = this.canvas.getContext('webgl', { antialias: true }, {preserveDrawingBuffer: true});
    this.addEventListeners(); //handle lost gl context
    }
    
    this.glLayer.drawing(drawingOnCanvas);
   
    
    let pixelsToWebGLMatrix = new Float32Array(16);
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
    if (mouseclick !== null) {
      let pixel = new Uint8Array(4);
      console.log(mouseclick.y)
      let mouseclick_y = this.canvas.height - mouseclick.y;
      this.gl.readPixels(mouseclick.x, mouseclick_y, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
      console.log(pixel);
    }
   
    // -- data
    let verts = [];
    let zoom = leafletMap.getZoom();
    let thickness = null;
    //console.log(zoom);
    thickness = (1 / zoom) * 0.005
    if (zoom < 10) {
      thickness = (1 / zoom) * 0.004;
    } else if (zoom === 10) {
      thickness =  (1 / zoom) * 0.0035;
    } else if (zoom === 11) {
      thickness =  (1 / zoom) * 0.003
    } else if (zoom === 12) {
      thickness =  (1 / zoom) * 0.0025
    } else if (zoom === 13) {
      thickness =  (1 / zoom) * 0.002
    } else if (zoom === 14) {
      thickness =  (1 / zoom) * 0.0015
    } else if (zoom === 15) {
      thickness =  (1 / zoom) * 0.001
    } else {
      thickness =  (1 / zoom) * 0.0008
    }
  //console.log(thickness);
    for (let i = 0; i < data.length; i += 1) {
      let red = null;
      let green = null;
      let blue = null;
      if (mouseclick === null) {
        if (data[i].class === "Access") { //blue
        red = 0;
        green = 0;
        blue = 1;
        } else if (data[i].class === "Arterial") { //red
          red = 1;
          green = 0;
          blue = 0;
        } else if (data[i].class === "Primary Collector") { //orange
          red = 1;
          green = 0.5;
          blue = 0;
        } else if (data[i].class === "Low Volume") { //green
          red = 0;
          green = 1;
          blue = 0;
        } else if (data[i].class === "Secondary Collector") { //yellow
          red = 1;
          green = 1;
          blue = 0;
        }
        else if (data[i].class === "Regional") { //black
          red = 0;
          green = 0;
          blue = 0;
        }
        else if (data[i].class === "National") { //white
          red = 1;
          green = 1;
          blue = 1;
        }
        else { //null
          red = 1;
          green = 0;
          blue = 1;
        }
      } else {
        red = ((i & 0x000000FF) >>>  0) / 255;
        green = ((i & 0x0000FF00) >>>  8) / 255;
        blue = ((i & 0x00FF0000) >>> 16) / 255;
      }      
      for (var j = 0; j < data[i].segment.length; j += 1) {
        
        if (data[i].segment.length < 2) {
          console.log(data[i]);
          continue;
        }
        if(data[i].segment.length < 3 ) {
          //console.log(data[i]);
          const pixel0 = {x: data[i].segment[0].x, y: data[i].segment[0].y};   
          const pixel1 = {x: data[i].segment[1].x, y: data[i].segment[1].y};
          if (pixel0.x === pixel1.x || pixel0.y === pixel1.y) {
            //console.log(data[i]);
            continue;
          }
          let p0 = new Vector2D(pixel0.x, pixel0.y);
          let p1 = new Vector2D(pixel1.x, pixel1.y);
          let line = Vector2D.subtract(p1, p0);
          let normal = new Vector2D(-line.y, line.x)
          let normalized = normal.normalize();
          let a = Vector2D.subtract(p0, Vector2D.multiply(normalized,thickness));
          let b = Vector2D.add(p0,  Vector2D.multiply(normalized,thickness));
          let c = Vector2D.subtract(p1, Vector2D.multiply(normalized,thickness));
          let d =  Vector2D.add(p1, Vector2D.multiply(normalized,thickness));
          let l = Vector2D.subtract(a, b).length();
          if (l > thickness * 2.1) {
            console.log(l);
          }
          verts.push(a.x, a.y, red, green, blue);
          verts.push(b.x, b.y, red, green, blue);
          verts.push(c.x, c.y, red, green, blue);
          verts.push(c.x, c.y, red, green, blue); 
          verts.push(d.x, d.y, red, green, blue);
          verts.push(b.x, b.y, red, green, blue);
          continue;
        } else {
          if (j === 0) {
            const pixel0 = {x: data[i].segment[j].x, y: data[i].segment[j].y};
            const pixel1 = {x: data[i].segment[j + 1].x, y: data[i].segment[j + 1].y};
            const pixel2 = {x: data[i].segment[j + 2].x, y: data[i].segment[j + 2].y};
            let p0 = new Vector2D(pixel0.x, pixel0.y);
            let p1 = new Vector2D(pixel1.x, pixel1.y);
            let p2 = new Vector2D(pixel2.x, pixel2.y);
    
            let line = Vector2D.subtract(p1, p0);
            let normal = new Vector2D(-line.y, line.x)
            let normalized = normal.normalize();
            let a = Vector2D.subtract(p0, Vector2D.multiply(normalized,thickness));
            let b = Vector2D.add(p0, Vector2D.multiply(normalized,thickness));

            let miter = this.getMiter(p0, p1, p2, thickness);
            if (miter.x === 0 && miter.y === 0) {
              continue;
            }
            let c = Vector2D.subtract(p1, miter);
            let d = Vector2D.add(p1, miter);  
            let l = Vector2D.subtract(a, b).length();
            if (l > thickness * 2) {
              //console.log(l);
            }
            verts.push(a.x, a.y, red, green, blue);
            verts.push(b.x, b.y, red, green, blue);
            verts.push(c.x, c.y, red, green, blue);
            verts.push(c.x, c.y, red, green, blue); 
            verts.push(d.x, d.y, red, green, blue);
            verts.push(b.x, b.y, red, green, blue);

            } else if (j === data[i].segment.length - 2) {
            const pixel0 = {x: data[i].segment[j -1].x, y: data[i].segment[j -1].y};
            const pixel1 = {x: data[i].segment[j].x, y: data[i].segment[j].y};
            const pixel2 = {x: data[i].segment[j + 1].x, y: data[i].segment[j + 1].y};
            let p0 = new Vector2D(pixel0.x, pixel0.y);
            let p1 = new Vector2D(pixel1.x, pixel1.y);
            let p2 = new Vector2D(pixel2.x, pixel2.y);
            let miter1 = this.getMiter(p0, p1, p2, thickness);
            if (miter1.x === 0 && miter1.y === 0) {
              break;
            }
            let a = Vector2D.add(p1, miter1);
            let b = Vector2D.subtract(p1,  miter1);
            let line = Vector2D.subtract(p2, p1);
            let normal = new Vector2D(-line.y, line.x)
            let normalized = normal.normalize();
            let c = Vector2D.subtract(p2, Vector2D.multiply(normalized,thickness));
            let d = Vector2D.add(p2, Vector2D.multiply(normalized,thickness));
            let l = Vector2D.subtract(c, d).length();
            if (l > thickness * 2.1) {
              console.log(l);
            }
            verts.push(a.x, a.y, red, green, blue);
            verts.push(b.x, b.y, red, green, blue);
            verts.push(c.x, c.y, red, green, blue);
            verts.push(c.x, c.y, red, green, blue); 
            verts.push(d.x, d.y, red, green, blue);
            verts.push(a.x, a.y, red, green, blue);
            break;  
            } else {
            //console.log("middle");
            const pixel0 = {x: data[i].segment[j -1].x, y: data[i].segment[j -1].y};
            const pixel1 = {x: data[i].segment[j].x, y: data[i].segment[j].y};
            const pixel2 = {x: data[i].segment[j + 1].x, y: data[i].segment[j + 1].y};
            const pixel3 = {x: data[i].segment[j + 2].x, y: data[i].segment[j + 2].y};
            let p0 = new Vector2D(pixel0.x, pixel0.y);
            let p1 = new Vector2D(pixel1.x, pixel1.y);
            let p2 = new Vector2D(pixel2.x, pixel2.y);
            let p3 = new Vector2D(pixel3.x, pixel3.y);
            //meter calc
            let miter1 = this.getMiter(p0, p1, p2, thickness);
            if (miter1.x === 0 && miter1.y === 0) {
              continue;
            }
            p1 = new Vector2D(pixel1.x, pixel1.y);
            p2 = new Vector2D(pixel2.x, pixel2.y);
            p3 = new Vector2D(pixel3.x, pixel3.y);
            let miter2 = this.getMiter(p1, p2, p3, thickness);
            if (miter2.x === 0 && miter2.y === 0) {
              continue;
            }
            let a = Vector2D.add(p1, miter1);
            let b = Vector2D.subtract(p1,  miter1);
            let c = Vector2D.add(p2, miter2);
            let d = Vector2D.subtract(p2,  miter2);
            verts.push(a.x, a.y, red, green, blue);
            verts.push(b.x, b.y, red, green, blue);
            verts.push(c.x, c.y, red, green, blue);
            verts.push(c.x, c.y, red, green, blue);
            verts.push(d.x, d.y, red, green, blue);
            verts.push(b.x, b.y, red, green, blue);
          }
        }
      }
    }
      //console.log(verts);
      var vertBuffer = this.gl.createBuffer();
      var vertArray = new Float32Array(verts);
      var fsize = vertArray.BYTES_PER_ELEMENT;

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
      this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
      this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize*5, 0);
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
        let numPoints = 0;
        let pointer = 0;
        for (var i = 0; i < data.length; i += 1) {
          numPoints = (data[i].segment.length - 1) * 6;
          params.gl.drawArrays(params.gl.TRIANGLES, pointer, numPoints);
          pointer += numPoints;
        }    
      }
    }

  componentDidUpdate() {   
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
    this.canvas.addEventListener("click", (event) => {
      this.clickCanvas(event)
    });
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
    if (data === "1") {
      icon = L.icon({
      iconUrl: 'CameraRed_16px.png',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      });
    } else if (data === "2") {
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
        repair: data[i].repair,
        comment: data[i].comment,
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
    let lines = [];
    let pointBefore = 0;
    let pointAfter = 0;
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
        pointBefore += points.length;
        if (points.length > 2) {
          //pixelSegment = RDP(points, 0.00000000001); //Douglas-Peckam simplify line
          let seg = {segment: points, class: rcClass};
          lines.push(seg);
          pointAfter += points.length;
        }  else {
          let seg = {segment: points, class: rcClass};
          lines.push(seg);
          pointAfter += points.length;
        }           
      } 
      
    } 
    this.setState({lineData: lines});  
    console.log("before: " + pointBefore);
    console.log("after: " + pointAfter);
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
      this.setState({url: "https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/tiles/{z}/{x}/{y}?access_token=" + this.state.key});
      this.setState({attribution: "&copy;<a href=https://www.mapbox.com/about/maps target=_blank>MapBox</a>&copy;<a href=https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors"})
    } else {
      this.setState({zIndex: 900});
      this.setState({mode: "map"});
      this.setState({osmThumbnail: "satellite64.png"});
      this.setState({url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"});
      this.setState({attribution: '&copy; <a href="https://www.openstreetmap.org/copyright target=_blank>OpenStreetMap</a> contributors'})
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
    //console.log(body);
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
    for(let i = 0; i < this.state.activeLayers.length; i += 1) { //check if loaded
      if (this.state.activeLayers[i].code === e.target.attributes.code.value) {  //if found
        return;
      }
    }
    this.setState({activeProject: e.target.attributes.code.value});
    for (let i = 0; i < this.state.projectArr.length; i += 1) { //find project
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
 * Fetches marker data from server using priority and filter
 * @param {String} project data to fetch
 */
  async filterLayer(project) {
    //console.log(this.state.priorities);
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
        filter: this.state.checkedFaults,
        priority: this.state.priorities,
      })
    }).then(async (response) => {
      if(!response.ok) {
        throw new Error(response.status);
      }
      else {
        const body = await response.json(); 
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession may have expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          await this.addMarkers(body);
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
    this.filterLayer(this.state.activeProject);
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
          alert(`Error: ${body.error}\nSession may have expired - user will have to login again`);
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

  async loadFilters() {
    if (this.state.login !== "Login") {
      await fetch('https://' + this.state.host + '/class', {
        method: 'POST',
        headers: {
          "authorization": this.state.token,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: this.state.login
        })
      }).then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}\nSession may have expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          this.setState({faultClass: body});
          this.getFaultTypes(this.state.faultClass[0].code);
        }   
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      }) 
    }
  }

  async getFaultTypes(cls) {
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
          type: cls
        })
      })
      .then(async (response) => {
        const body = await response.json();
        if (body.error != null) {
          alert(`Error: ${body.error}'\n'Session may have expired - user will have to login again`);
          let e = document.createEvent("MouseEvent");
          await this.logout(e);
        } else {
          body.map(obj => obj["type"] = cls)
          this.setState({faultTypes: body});
        }  
      })
      .catch((error) => {
        console.log("error: " + error);
        alert(error);
        return;
      })    
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
   * Adds or removes priorities to array for db query
   * @param {the button clicked} e 
   */
  clickPriority(e) {
    if (this.state.login !== "Login") {
      return;
    }
    this.setState({index: null});
    let priQuery = this.state.priorities;
    switch(e.target.id) {
      case "1":
        if (e.target.checked) {
          priQuery.push(1);
        } else {      
          priQuery.splice(priQuery.indexOf(1), 1 );
        }
        break;
      case "2":
        if (e.target.checked) {
          priQuery.push(2);
        } else {      
          priQuery.splice(priQuery.indexOf(2), 1 );
        }
        break;
      case "3":
        if (e.target.checked) {
          priQuery.push(3);
        } else {      
          priQuery.splice(priQuery.indexOf(3), 1 );
        }
        break;
      case "99":
      if (e.target.checked) {
        priQuery.push(99);
      } else {      
        priQuery.splice(priQuery.indexOf(99), 1 );
      }
      break;
    default:
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
    this.setState({show: false});
  }

  render() {

    const centre = [this.state.location.lat, this.state.location.lng];
    const { fault } = this.state.fault;
    const LayerNav = function LayerNav(props) {
      if (props.layers.length > 0) {
        return (
          <Nav>          
          <NavDropdown className="navdropdown" title="Layers" id="basic-nav-dropdown">
            <CustomMenu title="Add Layer" className="navdropdownitem" projects={props.projects} onClick={props.loadLayer}/>
            <NavDropdown.Divider />
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

    const CustomTable = function(props) {
      if(props.priority === "99") {
        return (
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                  <b>{"Type: "}</b> {props.fault} <br></br> 
                  <b>{"Location: "} </b> {props.location}<br></br>
                  <b>{"Lat: "}</b>{props.latlng.lat}<b>{" Lng: "}</b>{props.latlng.lng}
              </div>
              <div className="col-md-6">
                <b>{"Repair: "}</b>{props.repair}<br></br> 
                <b>{"Sign Code: "}</b>{props.comment}<br></br> 
                <b>{"DateTime: "} </b> {props.datetime}
              </div>
            </div>
          </div>	 
        );
      } else {
        return (
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                  <b>{"Type: "}</b> {props.fault} <br></br> 
                  <b>{"Priority: "} </b> {props.priority} <br></br>
                  <b>{"Location: "} </b> {props.location}<br></br>
                  <b>{"Lat: "}</b>{props.latlng.lat}<b>{" Lng: "}</b>{props.latlng.lng + "  "}  
                  <Button variant="outline-secondary" 
                   size="sm" 
                   onClick={props.copy} 
                   active >Copy
                   </Button>
              </div>
              <div className="col-md-6">
                <b>{"Repair: "}</b>{props.repair} <br></br> 
                <b>{"Size: "}</b> {props.size} m<br></br> 
                <b>{"DateTime: "} </b> {props.datetime}
              </div>
            </div>
          </div>	 
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
          worldCopyJump={true}
          boxZoom={true}
          center={centre}
          zoom={this.state.zoom}
          onZoom={(e) => this.onZoom(e)}>
          <TileLayer className="mapLayer"
            attribution={this.state.attribution}
            url={this.state.url}
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
                  <input id="1" type="checkbox" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Priority 1<br></br>
                  <input type="checkbox" id="2" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Priority 2<br></br>
                  <input type="checkbox" id="3" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Priority 3<br></br>
                  <input type="checkbox" id="99" defaultChecked onClick={(e) => this.clickPriority(e)}></input> Signage
                </Card.Body>  
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
                  priority={obj.priority}
                  photo={this.state.amazon + this.getFault(index, 'photo') + ".jpg"} 
                  position={obj.latlng} 
                  icon={this.getCustomIcon(this.getFault(index, 'priority'), this.state.zoom)}
                  draggable={false} 
                  riseOnHover={true}
                  onClick={(e) => this.clickMarker(e)}				  
                  >
                  <Popup className="popup">
                    <div>
                      <p className="faulttext">
                        <b>{"Type: "}</b>{obj.fault}<br></br>
                        <b>{"Location: "}</b>{obj.location}<br></br>
                        <b>{"Date: "}</b>{obj.datetime} 
                      </p>
                      <div>
                        <Image className="thumbnail" 
                          src={this.state.amazon + this.getFault(index, 'photo') + ".jpg"} 
                          onClick={(e) => this.clickImage(e)} 
                          thumbnail={true}>
                        </Image >
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
            color={getColor()}
            smoothFactor={5}
            positions={latlngs}>
          </Polyline>
          )}      
      </Map >     
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
      <Modal dialogClassName={"photoModal"} show={this.state.show} size='xl' centered={true}>
        <Modal.Body className="photoBody">	
            <Image className="photo" src={this.state.amazon + this.state.currentPhoto + ".jpg"} data={fault}></Image >        
		    </Modal.Body >
        <Modal.Footer>
          <CustomTable  fault={this.getFault(this.state.index, 'fault')}
                        priority={this.getFault(this.state.index, 'priority')}
                        location={this.getFault(this.state.index, 'location')}
                        size={this.getFault(this.state.index, 'size')}
                        datetime={this.getFault(this.state.index, 'datetime')}
                        repair={this.getFault(this.state.index, 'repair')}
                        comment={this.getFault(this.state.index, 'comment')}
                        latlng={this.getFault(this.state.index, 'latlng')}
                        copy={(e) => this.copyToClipboard(e, this.getFault(this.state.index, 'latlng'))}
                        >
          </CustomTable >
          <Button className="prev" onClick={(e) => this.clickPrev(e)}> 
            Previous 
          </Button>   
          <Button className="next" variant="primary" onClick={(e) => this.clickNext(e)}>
            Next  
          </Button>
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

