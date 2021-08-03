import Vector2D from './Vector2D';
import {LatLongToPixelXY, scaleMatrix} from  './util.js';
import L from 'leaflet';
import './L.CanvasOverlay';
import {compileShader, createProgram, vshader, fshader, vshader300, fshader300} from './shaders.js'

const DUPLICATE_OFFSET = 0.00002;
const ALPHA = 1.0;
const VERTEX_SIZE = 10;

export default class GLEngine {
 
    constructor(leaflet) {
        this.leafletMap = leaflet;
        this.mouseClick = null;
        this.gl = null;
        this.glPoints = [];
        this.glLines = [];
        this.latlngs = [];
        this.webgl = 2;
        this.zoom = false;
        this.intializeGL();    
    }

  intializeGL() {
    if (this.gl == null) {
      this.glLayer = L.canvasOverlay()
      .addTo(this.leafletMap);
      this.canvas = this.glLayer.canvas();
      this.glLayer.canvas.width = this.canvas.width;
      this.glLayer.canvas.height = this.canvas.height;
    }
    this.gl = this.canvas.getContext('webgl2', { antialias: true }, {preserveDrawingBuffer: false}); 
    if (!this.gl) {
      this.gl = this.canvas.getContext('webgl', { antialias: true }, {preserveDrawingBuffer: false});
      this.webgl = 1;
      console.log("Cannot load webgl2.0 using webgl instead");
    }  
    if (!this.gl) {
      this.gl = this.canvas.getContext('experimental-webgl', { antialias: true }, {preserveDrawingBuffer: false});
      console.log("Cannot load webgl1.0 using experimental-webgl instead");
      this.webgl = 1;
    } 
    if (!this.gl) {
      let message = "Error: Failed to load webgl.\n Your browser may not support webgl - this web app will not work correctly.\n Please use a modern web browser."
      alert(message);
      this.webgl = 0;
    } else {
      this.glLayer.delegate(this); 
      this.addEventListeners();
      if (this.webgl === 2) {
        let vertexShader = compileShader(this.gl, vshader300, this.gl.VERTEX_SHADER);
        let fragmentShader = compileShader(this.gl, fshader300, this.gl.FRAGMENT_SHADER);
        this.program = createProgram(this.gl, vertexShader, fragmentShader);
      } else if (this.webgl === 1) {
        let vertexShader = compileShader(this.gl, vshader, this.gl.VERTEX_SHADER);
        let fragmentShader = compileShader(this.gl, fshader, this.gl.FRAGMENT_SHADER);
        this.program = createProgram(this.gl, vertexShader, fragmentShader);
      } else {
        //no webgl
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
        this.intializeGL();
    }, false);
  }

  setAppDelegate(delegate) {
      this.appDelegate = delegate;
  }

  /**
   * Checks points to see if a point is selected and colors red
   * else returns vertices
   * Also returns verts coloured by index number to establish which index user clicked
   * @param {the point data} data 
   * @returns vertices data as Float32 array
   */
  reColorPoints(verts) {
    if (this.mouseClick === null) {
      if (this.appDelegate.state.selectedIndex === null) {
        return verts;
      } else {
        for (let i = 0; i < verts.length; i += VERTEX_SIZE) {
          if (verts[i +  VERTEX_SIZE - 1] === this.appDelegate.state.selectedIndex) {
            verts[i + 5] = 1.0;
            verts[i + 6] = 0;
            verts[i + 7] = 0;
            verts[i + 8] = ALPHA;
          }
        }
      }   
    } else {
      for (let i = 0; i < verts.length; i += VERTEX_SIZE) {
        let index = verts[i +  VERTEX_SIZE - 1];
        //calculates r,g,b color from index
        let r = ((index & 0x000000FF) >>  0) / 255;
        let g = ((index & 0x0000FF00) >>  8) / 255;
        let b = ((index & 0x00FF0000) >> 16) / 255;
        verts[i + 5] = r;
        verts[i + 6] = g;
        verts[i + 7] = b;
        verts[i + 8] = ALPHA; //alpha
      }
    }
    return verts;
  }

  
  /**
   * 
   * @param {data object} data 
   * @param {zoom to on redraw} zoom 
   */
  redraw(data, zoom) {
    this.glData = data;
    this.zoom = zoom;
    this.glLayer.drawing(drawingOnCanvas); 
    let pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);  
    this.gl.useProgram(this.program);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); //<---?
    this.gl.enable(this.gl.BLEND);
    // uniforms.
    let u_matLoc = this.gl.getUniformLocation(this.program, "u_matrix");
    let u_eyepos = this.gl.getUniformLocation(this.program, "u_offset");
    let u_eyeposLow = this.gl.getUniformLocation(this.program, "u_offset_low");
    let thickness = this.gl.getUniformLocation(this.program, "u_thickness")
    //attributes
    let colorLoc = this.gl.getAttribLocation(this.program, "a_color");
    let vertLoc = this.gl.getAttribLocation(this.program, "a_vertex");
    let vertLocLow = this.gl.getAttribLocation(this.program, "a_vertex_low");
    let prevLoc = this.gl.getAttribLocation(this.program, "a_prev");
    let prevLocLow = this.gl.getAttribLocation(this.program, "a_prev_low");
    let nextLoc = this.gl.getAttribLocation(this.program, "a_next");
    let nextLocLow = this.gl.getAttribLocation(this.program, "a_next_low");

    this.gl.aPointSize = this.gl.getAttribLocation(this.program, "a_pointSize");
    pixelsToWebGLMatrix.set([2 / this.canvas.width, 0, 0, 0, 0, -2 / this.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    // Set the matrix to some that makes 1 unit 1 pixel.
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix); 
    this.gl.uniform1f(thickness, 0.0006); 
    let fverts = null; //faults
    let cverts = data.centre; //centrelines
    if (data.points.length !== 0) {
      fverts = data.lines.concat(data.points);
    } else {
      fverts = [...data.lines];
    }
    
    fverts = this.reColorPoints(fverts);
    let verts = cverts.concat(fverts);
    let numCentreVerts = data.centre.length / VERTEX_SIZE;
    let numLineVerts = data.lines.length / VERTEX_SIZE;
    let numPointVerts = data.points.length / VERTEX_SIZE;
    let vertArray = new Float32Array(verts);
    let fsize = vertArray.BYTES_PER_ELEMENT;
    let bytesVertex = fsize * VERTEX_SIZE;
    let vertBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(prevLoc, 3, this.gl.FLOAT, false, bytesVertex, 0); //0
    this.gl.enableVertexAttribArray(prevLoc);
    this.gl.vertexAttribPointer(prevLocLow, 2, this.gl.FLOAT, false, bytesVertex, fsize * 3);
    this.gl.enableVertexAttribArray(prevLocLow);
    this.gl.vertexAttribPointer(vertLoc, 3, this.gl.FLOAT, false, bytesVertex, 2 * bytesVertex); //64
    this.gl.enableVertexAttribArray(vertLoc);
    this.gl.vertexAttribPointer(vertLocLow, 2, this.gl.FLOAT, false, bytesVertex, 2 * bytesVertex + fsize * 3);
    this.gl.enableVertexAttribArray(vertLocLow);
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, bytesVertex, 2 * bytesVertex + fsize * 5);
    this.gl.enableVertexAttribArray(colorLoc);
    this.gl.vertexAttribPointer(nextLoc, 3, this.gl.FLOAT, false, bytesVertex, 4 * bytesVertex);
    this.gl.enableVertexAttribArray(nextLoc);
    this.gl.vertexAttribPointer(nextLocLow, 2, this.gl.FLOAT, false, bytesVertex, (4 * bytesVertex) + (fsize * 3));
    this.gl.enableVertexAttribArray(nextLocLow);
    if (zoom) {
      this.appDelegate.centreMap(this.latlngs);
    }
    this.glLayer.redraw();

    function drawingOnCanvas(canvasOverlay, params) {
      if (!this.delegate.gl)  {
        return;
      }
      this.delegate.gl.clearColor(0, 0, 0, 0);
      this.delegate.gl.clear(this.delegate.gl.COLOR_BUFFER_BIT);
      pixelsToWebGLMatrix.set([2 / params.canvas.width, 0, 0, 0, 0, -2 / params.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      this.delegate.gl.viewport(0, 0, params.canvas.width, params.canvas.height);
      let pointSize = Math.max(this._map.getZoom() - 8.0, 1.0);
      this.delegate.gl.vertexAttrib1f(this.delegate.gl.aPointSize, pointSize);
      // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
      this.delegate.mapMatrix.set(pixelsToWebGLMatrix);
      let bounds = this._map.getBounds();
      let topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
      let pixelOffset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
      // -- Scale to current zoom
      let scale = Math.pow(2, this._map.getZoom());
      //console.log(this._map.getZoom());
      scaleMatrix(this.delegate.mapMatrix, scale, scale); //translation done in shader
      let u_matLoc = this.delegate.gl.getUniformLocation(this.delegate.program, "u_matrix"); 
      // -- attach matrix value to 'mapMatrix' uniform in shader
      this.delegate.gl.uniformMatrix4fv(u_matLoc, false, this.delegate.mapMatrix);
      this.delegate.gl.uniform3f(u_eyepos, pixelOffset.x, pixelOffset.y, 0.0);
      let offsetLow = {x: pixelOffset.x - Math.fround(pixelOffset.x), y: pixelOffset.y - Math.fround(pixelOffset.y)}
      this.delegate.gl.uniform3f(u_eyeposLow, offsetLow.x, offsetLow.y, 0.0);
      this.delegate.setThickness(thickness, this._map.getZoom());
      let centreCount  = numCentreVerts - 4;
      let lineCount  = numLineVerts - 4;
      let pointCount = numPointVerts;
      if (centreCount > 0) {
        this.delegate.gl.drawArrays(this.delegate.gl.TRIANGLE_STRIP, 0, centreCount); //centrelines
      } 
      if (lineCount > 0) {
        this.delegate.gl.drawArrays(this.delegate.gl.TRIANGLE_STRIP, numCentreVerts, lineCount);
      } 
      if (numPointVerts !== 0) {
        this.delegate.gl.drawArrays(this.delegate.gl.POINTS, numCentreVerts + numLineVerts , pointCount); 
      }
      
      if (this.delegate.mouseClick !== null) {      
        let pixel = new Uint8Array(4);
        this.delegate.gl.readPixels(this.delegate.mouseClick.originalEvent.layerX, 
        this.delegate.canvas.height - this.delegate.mouseClick.originalEvent.layerY, 1, 1, this.delegate.gl.RGBA, this.delegate.gl.UNSIGNED_BYTE, pixel);
        let index = null;
        if (pixel[3] === 255) {
          index = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
        } else {
          index = 0; //deals with edge cases from anti-aliasing 
        }
        this.delegate.mouseClick = null;
        this.delegate.appDelegate.setIndex(index);   
        this._redraw();      
      }
    }   
  }

  loadLines(buffer, data, options) {
    let faults = [];
    let centre = [];
    let lengths = [];
    let count = options.count;
    for (let i = 0; i < data.length; i++) {
      const linestring = JSON.parse(data[i].st_asgeojson);
      if (data[i].id) {
        const latlng = L.latLng(linestring.coordinates[0][1], linestring.coordinates[0][0]);
        this.latlngs.push(latlng);
        if (linestring) {
          let colors = null;  
          let line = linestring.coordinates;
          if (options.type !== "centreline") {
            colors = this.setColors(data[i], options.type, options.priorities);
            ++count;
          } else {
            colors = this.setCentreColors(data[i], options.value);
            count = 0;
            
          }   
          lengths.push(line.length);
          for (let j = 0; j < line.length; j++) {
            const point = line[j];
            const lng = point[0];
            const lat = point[1];
            this.latlngs.push(L.latLng(lat, lng));
            const pixel = LatLongToPixelXY(point[1], point[0]);
            const pixelLow = { x: pixel.x - Math.fround(pixel.x), y: pixel.y - Math.fround(pixel.y) };
            const pixelHigh = {x: pixel.x, y: pixel.y};
            if (i !== 0 && j === 0) {
              buffer.push(pixelHigh.x, pixelHigh.y, 0.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count);
            }
            if (j === 0) {
              buffer.push(pixelHigh.x, pixelHigh.y, 0.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count);
              buffer.push(pixelHigh.x, pixelHigh.y, 1.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count);
            }
            buffer.push(pixelHigh.x, pixelHigh.y, 0.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count); 
            buffer.push(pixelHigh.x, pixelHigh.y, 1.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count); 

            if (j === line.length - 1) {
              buffer.push(pixelHigh.x, pixelHigh.y, 0.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count); 
              buffer.push(pixelHigh.x, pixelHigh.y, 0.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count);
            }
            if (i !== line.length - 1 && j === line.length - 1) {
              buffer.push(pixelHigh.x, pixelHigh.y, 0.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, count);
            }
          }
        }
        if (options.type === "centreline") {

        } else {
          let fault = this.createFaultObject(data[i], options.type, latlng)
          faults.push(fault); 
        }
        
      }    
    }
    if (options.type === "centreline") {
      return {vertices: buffer, lengths: lengths, centre: centre, count: count};
    } else {
      return {vertices: buffer, lengths: lengths, faults: faults, count: count};
    }
    
  }

  loadPoints(buffer, points, options) {
    let faults = []; 
    let count = options.count;
    let pointSet = new Set();
    for (let i = 0; i < points.length; i++) { //start at one index 0 will be black
      const position = JSON.parse(points[i].st_asgeojson);
      let colors = this.setColors(points[i], options.type, options.priorities);
      const lng = position.coordinates[0];
      const lat = position.coordinates[1];
      const latlng = L.latLng(lat, lng);
      this.latlngs.push(latlng);
      this.addToSet(pointSet, L.latLng(lat, lng));
      const pixel = LatLongToPixelXY(lat, lng);
      const pixelLow = { x: pixel.x - Math.fround(pixel.x), y: pixel.y - Math.fround(pixel.y) };
      const pixelHigh = {x: pixel.x, y: pixel.y};
      buffer.push(pixelHigh.x, pixelHigh.y, -1.0, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, ++count);
        // let bucket = data[i].inspection;
        // if (bucket != null) {
        //   let suffix = this.state.amazon.substring(this.state.amazon.length - 8,  this.state.amazon.length - 1);
        //   if (bucket !== suffix) {
        //     alpha = 0.5;
        //   }
        // }
        // if (this.state.login === "chbdc") {
        //   points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1, 1, 0, 1, ++count);
        // } else {
        //   points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0, 1, ++count);
        // }  
      let fault = this.createFaultObject(points[i], options.type, latlng)
      faults.push(fault);         
    }
    return { faults: faults, vertices: buffer, count: count}
  }

    /**
 * Loops through json objects and extracts fault information
 * Builds object containing fault information and calls redraw
 * @param {JSON array of fault objects received from db} data 
 * @param {String type of data ie. road or footpath} type
 */
     drawThinLines(data, type, priorities, pointCount) {
      let faults = [];
      let glPoints = [];
      let lengths = [];
      for (let i = 0; i < data.length; i++) {
        const linestring = JSON.parse(data[i].st_asgeojson);
        console.log(linestring)
        const latlng = L.latLng(linestring.coordinates[0][1], linestring.coordinates[0][0]);
        this.latlngs.push(latlng);
        if (linestring !== null) {
          ++pointCount;   
          let line = linestring.coordinates;
          let colors = this.setColors(data[i], type, priorities);
          lengths.push(line.length);
          for (let j = 0; j < line.length; j++) {
            const point = line[j];
            const lng = point[0];
            const lat = point[1];
            this.latlngs.push(L.latLng(lat, lng));
            const pixel = LatLongToPixelXY(point[1], point[0]);
            const pixelLow = { x: pixel.x - Math.fround(pixel.x), y: pixel.y - Math.fround(pixel.y) };
            const pixelHigh = {x: pixel.x, y: pixel.y};
            glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, pointCount); 
          }
        }
        let fault = this.createFaultObject(data[i], type, latlng)
        faults.push(fault);
      }
      return {vertices: glPoints, lengths: lengths, faults: faults};
    }

  setThickness(thickness, zoom) {
    if (zoom === 1) {        
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 2) {
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 3) {
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 4) {
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 5) {
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 6) {
        this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 7) {
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 8) {
      this.gl.uniform1f(thickness, 0.001);
    } else if (zoom === 9){
      this.gl.uniform1f(thickness, 0.0008);
    } else if (zoom === 10) {        
      this.gl.uniform1f(thickness, 0.0005);
    } else if (zoom === 11) {        
      this.gl.uniform1f(thickness, 0.0003);
    } else if (zoom === 12) {
      this.gl.uniform1f(thickness, 0.0002);
    } else if (zoom === 13) {
      this.gl.uniform1f(thickness, 0.00009);
    } else if (zoom === 14) {
      this.gl.uniform1f(thickness, 0.00006);
    } else if (zoom === 15) {
      this.gl.uniform1f(thickness, 0.00004);
    } else if (zoom === 16) {
      this.gl.uniform1f(thickness, 0.00002);
    } else if (zoom === 17) {
      this.gl.uniform1f(thickness, 0.000015);
    } else if (zoom === 18) {
      this.gl.uniform1f(thickness, 0.00001);
    } else if (zoom === 19) {
      this.gl.uniform1f(thickness, 0.000009);
    } else {
      this.gl.uniform1f(thickness, 0.000008);
    }
  }

  getMiter(p0, p1, p2, thickness) {
    let p2p1 = Vector2D.subtract(p2, p1);
    let p1p0 = Vector2D.subtract(p1, p0);
    let normal = new Vector2D(-p2p1.y, p2p1.x);
    let normalized = normal.normalize();
    p2p1.normalize();
    p1p0.normalize();
    p2p1 = Vector2D.subtract(p2, p1);
    let tangent = Vector2D.add(p2p1, p1p0);    
    let nTangent = tangent.normalize();
    let miter = new Vector2D(-nTangent.y, nTangent.x);
    let length = thickness / Vector2D.dot(miter, normalized);
    let l = miter.multiply(length);
    return new Vector2D(l.x, l.y);  
  } 

  createFaultObject(data, type, latlng) {
    let id = data.id.split('_');
    let width = null;
    let length = null;
    let starterp = null;
    let enderp = null;
    if (data.size) {
      let sizes = data.size.split('x');
      length = sizes[0];
      width = sizes[1];
    } else {
      length = data.length;
      width = data.width;
    }
    if (data.erp) {
      starterp = data.erp;
      enderp = null;
    } else {
      starterp = data.starterp;
      enderp = data.enderp;
    }
    
    let obj = {};
    if (type === "footpath") {   
      obj = {
        type: type,
        id: id[id.length - 1],
        roadid: data.roadid,
        footpathid: data.footpathid,
        roadname: data.roadname,  
        location: data.location, 
        position: data.position,     
        starterp: starterp,
        enderp: enderp,
        asset:  data.asset,
        fpsurface: data.type,
        fault: data.fault,
        cause: data.cause,
        width: width,
        length: length,
        count: data.count,
        grade: data.grade,
        photo: data.photoid,
        datetime: data.faulttime,
        latlng: latlng,
        status: data.status,
      };
    } else {
      obj = {
        type: type,
        id: id[id.length - 1],
        roadid: data.roadid,
        carriage: data.carriage,
        inspection: data.inspection,
        location: data.location,
        position: data.position, 
        class: data.class,
        starterp: starterp,
        enderp: enderp,
        fault: data.fault,
        repair: data.repair,
        width: data.width,
        length: data.length,
        count: data.count,
        priority: data.priority,
        photo: data.photoid,
        datetime: data.faulttime,
        latlng: latlng,
        status: data.status,
      };
    }
    return obj;
  }

  setCentreColors(data, value) {
    let colors = {r: null, g: null, b: null, a: null};
    let _alpha = 0.75;
    switch(value) {
      case 'Pavement':
        if (data.pavement.toUpperCase().replace(/\s/g, "") === 'UNSEALED') {
          colors.r = 1.0;
          colors.g = 0.5;
          colors.b = 0.0;
          colors.a = _alpha;
        } else if (data.pavement.toUpperCase().replace(/\s/g, "") === 'THINSURFACEFLEXIBLE') {
          colors.r = 0.0;
          colors.g = 0.5;
          colors.b = 0.5;
          colors.a = _alpha;
        }  else if (data.pavement.toUpperCase().replace(/\s/g, "") === 'BRIDGE') {
          colors.r = 0.0;
          colors.g = 0.0;
          colors.b = 0.8;
          colors.a = _alpha;
        } else if (data.pavement.toUpperCase().replace(/\s/g, "") === 'CONCRETE') {
          colors.r = 0.75;
          colors.g = 0.75;
          colors.b = 0.75;
          colors.a = _alpha;
        } else {
          colors.r = 0.0;
          colors.g = 0.0;
          colors.b = 0.8;
          colors.a = _alpha;
        }
      break;
    case 'Hierarchy':
      if (data.heirarchy.toUpperCase().replace(/\s/g, "") === 'LOCAL') {
        colors.r = 0.75;
        colors.g = 0.4;
        colors.b = 1.0;
        colors.a = _alpha;
      } else if (data.heirarchy.toUpperCase().replace(/\s/g, "") === 'DISTRIBUTOR') {
        colors.r = 0.0;
        colors.g = 0.5;
        colors.b = 0.5;
        colors.a = _alpha;
      }  else if (data.heirarchy.toUpperCase().replace(/\s/g, "") === 'ARTERIAL') {
        colors.r = 0.8;
        colors.g = 0.0;
        colors.b = 0.0;
        colors.a = _alpha;
      } else if (data.heirarchy.toUpperCase().replace(/\s/g, "") === 'ACCESSLOWVOL') {
        colors.r = 0.0;
        colors.g = 1.0;
        colors.b = 1.0;
        colors.a = _alpha;
      } else if (data.heirarchy.toUpperCase().replace(/\s/g, "") === 'STRATEGIC1') {
        colors.r = 0.0;
        colors.g = 0.0;
        colors.b = 0.8;
        colors.a = _alpha;
      } else if (data.heirarchy.toUpperCase().replace(/\s/g, "") === 'STRATEGIC2') {
        colors.r = 0.0;
        colors.g = 0.0;
        colors.b = 0.8;
        colors.a = _alpha;
      } else {
        colors.r = 0.25;
        colors.g = 0.25;
        colors.b = 0.25;
        colors.a = _alpha;      
      }
      break;
    case 'Zone':
      if (data.zone.toUpperCase().replace(/\s/g, "") === 'URBAN') {
        colors.r = 1.0;
        colors.g = 1.0;
        colors.b = 0.2;
        colors.a = _alpha;
      } else if (data.zone.toUpperCase().replace(/\s/g, "") === 'RURAL') {
        colors.r = 0.2;
        colors.g = 0.2;
        colors.b = 1.0;
        colors.a = _alpha;
      } else {
        colors.r = 0.25;
        colors.g = 0.25;
        colors.b = 0.25;
        colors.a = _alpha;
      }
      break;
      case 'Owner':
      if (data.owner.toUpperCase().replace(/\s/g, "") === 'CROWN') {
        colors.r = 1.0;
        colors.g = 1.0;
        colors.b = 0.2;
        colors.a = _alpha;
      } else if (data.owner.toUpperCase().replace(/\s/g, "") === 'LOCALAUTHORITY') {
        colors.r = 0.2;
        colors.g = 0.2;
        colors.b = 1.0;
        colors.a = _alpha;
      } else if (data.owner.toUpperCase().replace(/\s/g, "") === 'PRIVATE') {
        colors.r = 0.2;
        colors.g = 0.2;
        colors.b = 1.0;
        colors.a = _alpha;
      }
      else {
        colors.r = 0.25;
        colors.g = 0.25;
        colors.b = 0.25;
        colors.a = _alpha;
      }
      break;
    default:
      colors.r = 0.25;
      colors.g = 0.25;
      colors.b = 0.25;
      colors.a = _alpha;
  }
    return colors;
  }

    setColors(geometry, type, priorities) {
      let colors = {r: null, b: null, g: null, a: null}
      let priority = null;
      if (type === "road") {
        priority = geometry.priority;
      } else {
        priority = geometry.grade;
      }
      if (geometry.status === "active") {
        if(priority === priorities.high) { //magenta
          colors.r = 1.0;
          colors.g = 0.0;
          colors.b = 1.0;
          colors.a = ALPHA;
        } else if(priority === priorities.med) {
          colors.r = 1.0;
          colors.g = 0.5;
          colors.b = 0.0;
          colors.a = ALPHA;
        } else if (priority === priorities.low) {
          colors.r = 0.0;
          colors.g = 0.8;
          colors.b = 0.0;
          colors.a = ALPHA;
        } else if (priority === 99) {
          colors.r = 0.0;
          colors.g = 0.0;
          colors.b = 1.0;
          colors.a = ALPHA;
        } else {
          colors.r = 0.0;
          colors.g = 0.8;
          colors.b = 0.8;
          colors.a = ALPHA;
        }
      } else {
        colors.r = 0.5;
        colors.g = 0.5;
        colors.b = 0.5;
        colors.a = 0.8
      }
      return colors;
    }

    addToSet(set, latlng) {
      if (set.has(latlng.lat.toString() + latlng.lng.toString())) {
        let randomLat = Math.random() >= 0.5;
        let randomPlus = Math.random() >= 0.5;
        if (randomLat) {
          if (randomPlus) {
            latlng.lat += DUPLICATE_OFFSET;
          } else {
            latlng.lat -= DUPLICATE_OFFSET;
          }
        } else {
          if (randomPlus) {
            latlng.lng += DUPLICATE_OFFSET;
          } else {
            latlng.lng -= DUPLICATE_OFFSET;
          }
        }
        set.add(latlng.lat.toString() + latlng.lng.toString());
      } else {
        set.add(latlng.lat.toString() + latlng.lng.toString());
      }
    }

    minMaxLineSize() {
      const [minLineSize, maxLineSize] = this.gl.getParameter(this.gl.ALIASED_LINE_WIDTH_RANGE);
      return [minLineSize, maxLineSize];
    }

    minMaxPointSize() {
      const [minPointSize, maxPointSize] = this.gl.getParameter(this.gl.ALIASED_POINT_SIZE_RANGE);
      return [minPointSize, maxPointSize];
    }
};