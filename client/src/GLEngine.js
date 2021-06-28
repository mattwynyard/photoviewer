import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix} from  './util.js';
import L from 'leaflet';
import './L.CanvasOverlay';

const DUPLICATE_OFFSET = 0.00002;

export default class GLEngine {
 
    constructor(leaflet) {
        this.leafletMap = leaflet;
        this.mouseClick = null;
        this.gl = null;
        this.glPoints = [];
        this.glLines = [];
        this.latlngs = [];
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
        console.log("Cannot load webgl2.0 using webgl instead");
    }  
    if (!this.gl) {
      this.gl = this.canvas.getContext('experimental-webgl', { antialias: true }, {preserveDrawingBuffer: false});
      console.log("Cannot load webgl1.0 using experimental-webgl instead");
    } 
    if (!this.gl) {
      alert("Error: Failed to load webgl.\n" + "Your browser may not support webgl - this web app will not work correctly.\n" + "Please use a modern web browser.")
    } 
    this.glLayer.delegate(this); 
    this.addEventListeners();
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

  readPixel() {
    if (this.mouseClick !== null) {      
      let pixel = new Uint8Array(4);
      this.gl.readPixels(this.mouseClick.originalEvent.layerX, 
      this.canvas.height - this.mouseClick.originalEvent.layerY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixel);
      let index = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
      this.mouseClick = null;
      this.appDelegate.setIndex(index);   
      return true;   
    } else {
      return false;
    }
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
        for (let i = 0; i < verts.length; i += 9) {
          if (verts[i + 8] === this.appDelegate.state.selectedIndex) {
            verts[i + 4] = 1.0;
            verts[i + 5] = 0;
            verts[i + 6] = 0;
            verts[i + 7] = 1.0;
          }
        }
      }   
    } else {
      for (let i = 0; i < verts.length; i += 9) {
        let index = verts[i + 8];
        //calculates r,g,b color from index
        let r = ((index & 0x000000FF) >>  0) / 255;
        let g = ((index & 0x0000FF00) >>  8) / 255;
        let b = ((index & 0x00FF0000) >> 16) / 255;
        verts[i + 4] = r;
        verts[i + 5] = g;
        verts[i + 6] = b;
        verts[i + 7] = 1.0; //alpha
      }
    }
    return verts;
  }

  redraw(points, lines) {
    console.log(lines);
    console.log("redrawing..");
    this.glPoints = points;
    const numPoints = points.length;
    this.glLines = lines;
    this.glLayer.drawing(drawingOnCanvas); 
    let pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);  
        // -- WebGl setup
    let vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertexShader, document.getElementById('vshader').text);
    this.gl.compileShader(vertexShader);
    let fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    //let length = this.state.activeLayers.length - 1;
    this.gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
    this.gl.compileShader(fragmentShader);
    // link shaders to create our program
    let program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    this.gl.useProgram(program);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.BLEND);
    // look up the locations for the inputs to our shaders.
    let u_matLoc = this.gl.getUniformLocation(program, "u_matrix");
    let u_eyepos = this.gl.getUniformLocation(program, "u_eyepos");
    let u_eyeposLow = this.gl.getUniformLocation(program, "u_eyepos_low");
    let colorLoc = this.gl.getAttribLocation(program, "a_color");
    let vertLoc = this.gl.getAttribLocation(program, "a_vertex");
    let vertLocLow = this.gl.getAttribLocation(program, "a_vertex_low");
    //let colorLoc = this.gl.getAttribLocation(program, "a_color");
    //let vertLoc = this.gl.getAttribLocation(program, "a_vertex");
    this.gl.aPointSize = this.gl.getAttribLocation(program, "a_pointSize");
    pixelsToWebGLMatrix.set([2 / this.canvas.width, 0, 0, 0, 0, -2 / this.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    // Set the matrix to some that makes 1 unit 1 pixel.
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix); 
    let thickness = 0.00001;
    console.log(lines.vertices)
    let verts = lines.vertices.concat(points);
    let vertBuffer = this.gl.createBuffer();
    verts = this.reColorPoints(verts);
    let numLines = lines.vertices.length / 9;
    console.log(numLines)
    let vertArray = new Float32Array(verts);
    let fsize = vertArray.BYTES_PER_ELEMENT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize * 9, 0);
    this.gl.enableVertexAttribArray(vertLoc);
    this.gl.vertexAttribPointer(vertLocLow, 2, this.gl.FLOAT, false, fsize * 9, fsize * 2);
    this.gl.enableVertexAttribArray(vertLocLow);
    // -- offset for color buffer
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, fsize * 9, fsize * 4);
    this.gl.enableVertexAttribArray(colorLoc);
    this.glLayer.redraw();

    function drawingOnCanvas(canvasOverlay, params) {
      if (this.delegate.gl == null)  {
        return;
      }
      this.delegate.gl.clearColor(0, 0, 0, 0);
      this.delegate.gl.clear(this.delegate.gl.COLOR_BUFFER_BIT);
      pixelsToWebGLMatrix.set([2 / params.canvas.width, 0, 0, 0, 0, -2 / params.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
      this.delegate.gl.viewport(0, 0, params.canvas.width, params.canvas.height);
      let pointSize = Math.max(this._map.getZoom() - 7.0, 1.0);
      this.delegate.gl.vertexAttrib1f(this.delegate.gl.aPointSize, pointSize);
      // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
      this.delegate.mapMatrix.set(pixelsToWebGLMatrix);
      let bounds = this._map.getBounds();
      let topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
      let pixelOffset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
      // -- Scale to current zoom
      var scale = Math.pow(2, this._map.getZoom());
      scaleMatrix(this.delegate.mapMatrix, scale, scale);
      //translateMatrix(this.delegate.mapMatrix, -offset.x, -offset.y);
      let u_matLoc = this.delegate.gl.getUniformLocation(program, "u_matrix");
      // -- attach matrix value to 'mapMatrix' uniform in shader
      this.delegate.gl.uniformMatrix4fv(u_matLoc, false, this.delegate.mapMatrix);
      this.delegate.gl.uniform3f(u_eyepos, pixelOffset.x, pixelOffset.y, 0.0);
      let offsetLow = {x: pixelOffset.x - Math.fround(pixelOffset.x), y: pixelOffset.y - Math.fround(pixelOffset.y)}
      this.delegate.gl.uniform3f(u_eyeposLow, offsetLow.x, offsetLow.y, 0.0);
      let offset = 0;
      // for (var i = 0; i < numLines; i++) {
      // let count = lines.lengths[i];
      //   this.delegate.gl.drawArrays(this.delegate.gl.TRIANGLES, offset, count * 3); 
      //   offset += 9; 
      // }

      //draw thin lines
      for (var i = 0; i < lines.lengths.length; i += 1) {             
        let count = lines.lengths[i];
        this.delegate.gl.drawArrays(this.delegate.gl.LINE_STRIP, offset, count);
        offset += count;
      } 
      this.delegate.gl.drawArrays(this.delegate.gl.POINTS, offset, numPoints);
      if (!this.delegate.readPixel()) {
        this._redraw();   
      }    
    }
  }

  /**
 * Loops through json objects and extracts fault information
 * Builds object containing fault information and calls redraw
 * @param {JSON array of fault objects received from db} data 
 * @param {String type of data ie. road or footpath} type
 */
  drawThinLines(data, type, priorities) {
    let faults = [];
    let glPoints = [];
    let lengths = [];
    let alpha = 0.9; 
    for (let i = 0; i < data.length; i++) {
      //if (data[i].id === "MDC_RD_0521_1742") {
        const linestring = JSON.parse(data[i].st_asgeojson);
        const priority = data[i].priority;
        if (linestring !== null) {  
          let line = linestring.coordinates;
          lengths.push(line.length);
          for (let j = 0; j < line.length; j++) {
            const point = line[j];
            const lng = point[0];
            const lat = point[1];
            this.latlngs.push(L.latLng(lat, lng));
            const pixel = LatLongToPixelXY(point[1], point[0]);
            const pixelLow = { x: pixel.x - Math.fround(pixel.x), y: pixel.y - Math.fround(pixel.y) };
            const pixelHigh = {x: pixel.x, y: pixel.y};
            if (type === "road") {
              if (data[i].status === "active") { //road
                if(priority === priorities.high) {
                  glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1.0, 0, 1.0, alpha, i + 1); 
                } else if (priority === priorities.med) {
                  glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1.0, 0.5, 0, alpha, i + 1);
                } else if (priority === priorities.low) {
                  glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0, alpha, i + 1);
                } else if (priority === 99) {
                  glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0, 1, alpha, i + 1);
                } else {
                  glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0, alpha, i + 1);
                }
              } else {
                glPoints.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0.5, 0.5, 0.5, 0.8, alpha, i + 1);
              } 
            } else { //footpath

            }
          } 
        }
        let id = data[i].id.split('_');
        let obj = {
            type: type,
            id: id[id.length - 1],
            roadid: data[i].roadid,
            carriage: data[i].carriageway,
            inspection: data[i].inspection,
            location: data[i].location,
            class: data[i].class,
            fault: data[i].fault,
            repair: data[i].repair,
            comment: data[i].comment,
            size: data[i].size,
            priority: data[i].priority,
            photo: data[i].photoid,
            datetime: data[i].faulttime,
            //latlng: L.latLng(lat, lng),
            status: data[i].status,
            datefixed: data[i].datefixed
          };
        faults.push(obj)
    }
    return {vertices: glPoints, lengths: lengths};
  }

  drawLines(data, type, priorities) {
    const thickness = 0.00001;
    let glPoints = [];
    let lengths = [];
    let alpha = 0.9; 
    for (let i = 0; i < data.length; i++) {
      const linestring = JSON.parse(data[i].st_asgeojson);
      const priority = data[i].priority;
      if (linestring !== null) {  
        let line = linestring.coordinates;
        if (line.length < 2) {
          console.log(line[i]);
          continue;
        } else if (line.length === 2 ) {
          lengths.push(line.length);
          const point0 = line[0];
          const point1 = line[1];
          const pixel0 = LatLongToPixelXY(point0[1], point0[0]);
          const pixel1 = LatLongToPixelXY(point1[1], point1[0]);
          const p0 = new Vector2D(pixel0.x, pixel0.y);
          const p1 = new Vector2D(pixel1.x, pixel1.y);
          const pixelLine = Vector2D.subtract(p1, p0);
          const normal = new Vector2D(-pixelLine.y, pixelLine.x)
          const normalized = normal.normalize();
          const vertex1 = Vector2D.subtract(p0, Vector2D.multiply(normalized, thickness));
          const vertex2 = Vector2D.add(p0,  Vector2D.multiply(normalized, thickness));
          const vertex3 = Vector2D.subtract(p1, Vector2D.multiply(normalized, thickness));
          const vertex4 =  Vector2D.add(p1, Vector2D.multiply(normalized, thickness));
          const l = Vector2D.subtract(vertex1, vertex2).length(); //<thickness of line
          //console.log("thickness " + l);
          const vertex1Low = { x: vertex1.x - Math.fround(vertex1.x), y: vertex1.y - Math.fround(vertex1.y) };
          const vertex1High = {x: vertex1.x, y: vertex1.y};
          const vertex2Low = { x: vertex2.x - Math.fround(vertex2.x), y: vertex2.y - Math.fround(vertex2.y) };
          const vertex2High = {x: vertex2.x, y: vertex2.y};
          const vertex3Low = { x: vertex3.x - Math.fround(vertex3.x), y: vertex3.y - Math.fround(vertex3.y) };
          const vertex3High = {x: vertex3.x, y: vertex3.y};
          const vertex4Low = { x: vertex4.x - Math.fround(vertex4.x), y: vertex4.y - Math.fround(vertex4.y) };
          const vertex4High = {x: vertex4.x, y: vertex4.y};
          
          glPoints.push(vertex1High.x, vertex1High.y, vertex1Low.x, vertex1Low.y, 1.0, 0, 1.0, alpha, i + 1);
          glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, 1.0, 0, 1.0, alpha, i + 1);
          glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, 1.0, 0, 1.0, alpha, i + 1);
          glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, 1.0, 0, 1.0, alpha, i + 1);
          glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, 1.0, 0, 1.0, alpha, i + 1);
          glPoints.push(vertex4High.x, vertex4High.y, vertex4Low.x, vertex4Low.y, 1.0, 0, 1.0, alpha, i + 1);  
          //6 * 9 = 54 elements per two point line
        } else {
          
        }
        
      }      
    }
    return {vertices: glPoints, lengths: lengths}
  }

  buildPoints(data, type, priorities) {
    let obj = {}; //return
    let faults = []; 
    let latlngs = [];
    let points = []; //TODO change to Float32Array to make selection faster

    let pointSet = new Set();
    for (let i = 0; i < data.length; i++) { //start at one index 0 will be black
      const position = JSON.parse(data[i].st_asgeojson);
      const lng = position.coordinates[0];
      const lat = position.coordinates[1];
      this.latlngs.push(L.latLng(lat, lng));
      this.addToSet(pointSet, L.latLng(lat, lng));
      const pixel = LatLongToPixelXY(lat, lng);
      const pixelLow = { x: pixel.x - Math.fround(pixel.x), y: pixel.y - Math.fround(pixel.y) };
      const pixelHigh = {x: pixel.x, y: pixel.y};
      let alpha = 0.9;
      if (type === "road") {
        // let bucket = data[i].inspection;
        // if (bucket != null) {
        //   let suffix = this.state.amazon.substring(this.state.amazon.length - 8,  this.state.amazon.length - 1);
        //   if (bucket !== suffix) {
        //     alpha = 0.5;
        //   }
        // }
        if (data[i].status === "active") { //road
          if(data[i].priority === priorities.high) {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1.0, 0, 1.0, alpha, i + 1);
          } else if (data[i].priority === priorities.med) {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1.0, 0.5, 0, alpha, i + 1);
          } else if (data[i].grade === priorities.low) {
            if (this.state.login === "chbdc") {
              points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1, 1, 0, 1, i + 1);
            } else {
              points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0, 1, i + 1);
            }        
          } else if (data[i].priority === 99) {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0, 1, alpha, i + 1);
          } else {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0, alpha, i + 1);
          }
        } else {
          points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0.5, 0.5, 0.5, 0.8, i + 1);
        }
      } else {
        if (data[i].status === "active") { //footpath
          if(data[i].grade === priorities.high) {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1.0, 0, 1.0, 1, i + 1);
          } else if (data[i].grade === priorities.med) {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1.0, 0.5, 0, 1, i + 1);
          } else if (data[i].grade === priorities.low) {
            if (this.state.login === "chbdc") {
              points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 1, 1, 0, 1, i + 1);
            } else {
              points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0, 1, i + 1);
            }
            
          } else {
            points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0, 0.8, 0.8, 1, i + 1);
          }
        } else {
          points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, 0.5, 0.5, 0.5, 0.8, i + 1);
        }  
      }    
      if (type === "footpath") {   
        let id = data[i].id.split('_');
        obj = {
          type: type,
          id: id[id.length - 1],
          roadid: data[i].roadid,
          footpathid: data[i].footpathid,
          roadname: data[i].roadname,        
          location: data[i].location,
          asset:  data[i].asset,
          fpsurface: data[i].type,
          fault: data[i].fault,
          cause: data[i].cause,
          size: data[i].size,
          grade: data[i].grade,
          photo: data[i].photoid,
          datetime: data[i].faulttime,
          latlng: L.latLng(lat, lng),
          status: data[i].status,
          datefixed: data[i].datefixed
        };
      } else {
        let id = data[i].id.split('_');
        obj = {
          type: type,
          id: id[id.length - 1],
          roadid: data[i].roadid,
          carriage: data[i].carriageway,
          inspection: data[i].inspection,
          location: data[i].location,
          class: data[i].class,
          fault: data[i].fault,
          repair: data[i].repair,
          comment: data[i].comment,
          size: data[i].size,
          priority: data[i].priority,
          photo: data[i].photoid,
          datetime: data[i].faulttime,
          latlng: L.latLng(lat, lng),
          status: data[i].status,
          datefixed: data[i].datefixed
        };
      }   
      faults.push(obj);          
    }
    return {
      faults: faults,
      points: points
    }
  }

  buildVertices(lines, points, thickness) {
    for (let i = 0; i < lines.length; i += 1) {
      let red = 0;
      let green = 0;
      let blue = 1;  
      for (let j = 0; j < lines[i].segment.length; j += 1) {
        if (lines[i].segment.length < 2) {
          console.log(lines[i]);
          continue;
        }
        if(lines[i].segment.length === 2 ) {
          const pixel0 = {x: lines[i].segment[0].x, y: lines[i].segment[0].y};   
          const pixel1 = {x: lines[i].segment[1].x, y: lines[i].segment[1].y};
          if (pixel0.x === pixel1.x || pixel0.y === pixel1.y) {
            continue;
          }
          let p0 = new Vector2D(pixel0.x, pixel0.y);
          let p1 = new Vector2D(pixel1.x, pixel1.y);
          let line = Vector2D.subtract(p1, p0);
          let normal = new Vector2D(-line.y, line.x)
          let normalized = normal.normalize();
          let a = Vector2D.subtract(p0, Vector2D.multiply(normalized, thickness));
          let b = Vector2D.add(p0,  Vector2D.multiply(normalized, thickness));
          let c = Vector2D.subtract(p1, Vector2D.multiply(normalized, thickness));
          let d =  Vector2D.add(p1, Vector2D.multiply(normalized, thickness));
          let l = Vector2D.subtract(a, b).length();
          if (l > thickness * 2.1) {
            console.log(l);
          }
          points.push(a.x, a.y, red, green, blue, 1, 1);
          points.push(b.x, b.y, red, green, blue, 1, 1);
          points.push(c.x, c.y, red, green, blue, 1, 1);
          points.push(c.x, c.y, red, green, blue, 1, 1); 
          points.push(d.x, d.y, red, green, blue, 1, 1);
          points.push(b.x, b.y, red, green, blue, 1, 1);
          continue;
        } else {
          if (j === 0) {
            const pixel0 = {x: lines[i].segment[j].x, y: lines[i].segment[j].y};
            const pixel1 = {x: lines[i].segment[j + 1].x, y: lines[i].segment[j + 1].y};
            const pixel2 = {x: lines[i].segment[j + 2].x, y: lines[i].segment[j + 2].y};
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
            points.push(a.x, a.y, red, green, blue, 1, 1);
            points.push(b.x, b.y, red, green, blue, 1, 1);
            points.push(c.x, c.y, red, green, blue, 1, 1);
            points.push(c.x, c.y, red, green, blue, 1, 1); 
            points.push(d.x, d.y, red, green, blue, 1, 1);
            points.push(b.x, b.y, red, green, blue, 1, 1);
            } else if (j === lines[i].segment.length - 2) {
            const pixel0 = {x: lines[i].segment[j -1].x, y: lines[i].segment[j -1].y};
            const pixel1 = {x: lines[i].segment[j].x, y: lines[i].segment[j].y};
            const pixel2 = {x: lines[i].segment[j + 1].x, y: lines[i].segment[j + 1].y};
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
            points.push(a.x, a.y, red, green, blue, 1, 1);
            points.push(b.x, b.y, red, green, blue, 1, 1);
            points.push(c.x, c.y, red, green, blue, 1, 1);
            points.push(c.x, c.y, red, green, blue, 1, 1); 
            points.push(d.x, d.y, red, green, blue, 1, 1);
            points.push(a.x, a.y, red, green, blue, 1, 1);
            break;  
            } else {
            const pixel0 = {x: lines[i].segment[j -1].x, y: lines[i].segment[j -1].y};
            const pixel1 = {x: lines[i].segment[j].x, y: lines[i].segment[j].y};
            const pixel2 = {x: lines[i].segment[j + 1].x, y: lines[i].segment[j + 1].y};
            const pixel3 = {x: lines[i].segment[j + 2].x, y: lines[i].segment[j + 2].y};
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
            points.push(a.x, a.y, red, green, blue, 1, 1);
            points.push(b.x, b.y, red, green, blue, 1, 1);
            points.push(c.x, c.y, red, green, blue, 1, 1);
            points.push(c.x, c.y, red, green, blue, 1, 1);
            points.push(d.x, d.y, red, green, blue, 1, 1);
            points.push(b.x, b.y, red, green, blue, 1, 1);
          }
        }
      }
    }
    return points;
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