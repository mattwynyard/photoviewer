import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix} from  './util.js';
import L, { LineUtil } from 'leaflet';
import './L.CanvasOverlay';
import {compileShader, createProgram, vshader, fshader} from './shaders.js'
import { NumberOutlined } from '@ant-design/icons';

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
        //console.log("Cannot load webgl2.0 using webgl instead");
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
    let vertexShader = compileShader(this.gl, vshader, this.gl.VERTEX_SHADER);
    let fragmentShader = compileShader(this.gl, fshader, this.gl.FRAGMENT_SHADER);
    this.program = createProgram(this.gl, vertexShader, fragmentShader);
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
    //console.log(verts)
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
        //console.log(index);
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
    //console.log(lines);
    console.log("redrawing..");
    this.glPoints = points;
    const numPoints = points.length;
    this.glLines = lines;
    this.glLayer.drawing(drawingOnCanvas); 
    let pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);  
        // -- WebGl program setup
    // let vertexShader = compileShader(this.gl, vshader, this.gl.VERTEX_SHADER);
    // let fragmentShader = compileShader(this.gl, fshader, this.gl.FRAGMENT_SHADER);
    // let program = createProgram(this.gl, vertexShader, fragmentShader);
    this.gl.useProgram(this.program);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA); //<---?
    this.gl.enable(this.gl.BLEND);
    // look up the locations for the inputs to our shaders.
    let u_matLoc = this.gl.getUniformLocation(this.program, "u_matrix");
    let u_eyepos = this.gl.getUniformLocation(this.program, "u_eyepos");
    let u_eyeposLow = this.gl.getUniformLocation(this.program, "u_eyepos_low");
    let colorLoc = this.gl.getAttribLocation(this.program, "a_color");
    let vertLoc = this.gl.getAttribLocation(this.program, "a_vertex");
    let vertLocLow = this.gl.getAttribLocation(this.program, "a_vertex_low");
    this.gl.aPointSize = this.gl.getAttribLocation(this.program, "a_pointSize");
    pixelsToWebGLMatrix.set([2 / this.canvas.width, 0, 0, 0, 0, -2 / this.canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
    // Set the matrix to some that makes 1 unit 1 pixel.
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix); 
    //console.log(lines.vertices)
    let verts = lines.vertices.concat(points);
    let vertBuffer = this.gl.createBuffer();
    verts = this.reColorPoints(verts);
    let numVertices = lines.vertices.length / 9;
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
      scaleMatrix(this.delegate.mapMatrix, scale, scale); //translation done in shader

      let u_matLoc = this.delegate.gl.getUniformLocation(this.delegate.program, "u_matrix");
      // -- attach matrix value to 'mapMatrix' uniform in shader
      this.delegate.gl.uniformMatrix4fv(u_matLoc, false, this.delegate.mapMatrix);
      this.delegate.gl.uniform3f(u_eyepos, pixelOffset.x, pixelOffset.y, 0.0);
      let offsetLow = {x: pixelOffset.x - Math.fround(pixelOffset.x), y: pixelOffset.y - Math.fround(pixelOffset.y)}
      this.delegate.gl.uniform3f(u_eyeposLow, offsetLow.x, offsetLow.y, 0.0);
      this.delegate.gl.drawArrays(this.delegate.gl.TRIANGLES, 0, numVertices); 
      //draw thin lines
      //let offset = 0;
      // for (var i = 0; i < lines.lengths.length; i += 1) {             
      //   let count = lines.lengths[i];
      //   this.delegate.gl.drawArrays(this.delegate.gl.LINE_STRIP, offset, count);
      //   offset += count;
      // }
      let offset  = numVertices * 9;
      this.delegate.gl.drawArrays(this.delegate.gl.POINTS, offset, numPoints);

      if (this.delegate.mouseClick !== null) {      
        let pixel = new Uint8Array(4);
        this.delegate.gl.readPixels(this.delegate.mouseClick.originalEvent.layerX, 
        this.delegate.canvas.height - this.delegate.mouseClick.originalEvent.layerY, 1, 1, this.delegate.gl.RGBA, this.delegate.gl.UNSIGNED_BYTE, pixel);
        console.log(pixel)
        let index = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
        this.delegate.mouseClick = null;
        this.delegate.appDelegate.setIndex(index);   
        this._redraw();
      }
    }
  }

  drawLines(data, type, priorities, pointCount) {
    const thickness = 0.000005;
    let glPoints = [];
    let lengths = [];
    
      for (let i = 0; i < data.length; i++) {
        if (data[i].id === "MDC_RD_0521_1692") {
          const linestring = JSON.parse(data[i].st_asgeojson);
          if (linestring !== null) {  
            let polyline = linestring.coordinates;
            let colors = this.setColors(data[i], type, priorities);
            if (polyline.length < 2) {
              console.log(polyline[i]);
              continue;
            } else {
              console.log(polyline)
              for(let i = 0; i < polyline.length; i++) {
                let a = ((i - 1) < 0) ? 0 : (i - 1);
                let b = i;
                let c = ((i + 1) >= polyline.length) ? polyline.length - 1 : (i + 1);
                let d = ((i + 2) >= polyline.length) ? polyline.length - 1 : (i + 2);
                let p0 = polyline[a];
                let p1 = polyline[b];
                let p2 = polyline[c];
                let p3 = polyline[d];
                if (p1 == p2)
                continue;
                const px0 = LatLongToPixelXY(p1, p0);
                const px1 = LatLongToPixelXY(p3, point1[0]);
                
                console.log("p0 " + p0 + "\np1 " + p1 + "\np2 " + p2 + "\np3 " + p3)
              }
          } 
        }    
      }
    }
    
    return {vertices: glPoints, lengths: lengths}
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
      const latlng = L.latLng(linestring.coordinates[0][1], linestring.coordinates[0][0]);
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

  buildPoints(data, type, priorities) {
    let faults = []; 
    let latlngs = [];
    let points = []; //TODO change to Float32Array to make selection faster
    let count = 0;
    let pointSet = new Set();
    for (let i = 0; i < data.length; i++) { //start at one index 0 will be black
      const position = JSON.parse(data[i].st_asgeojson);
      let colors = this.setColors(data[i], type, priorities);
      const lng = position.coordinates[0];
      const lat = position.coordinates[1];
      const latlng = L.latLng(lat, lng);
      latlngs.push(L.latLng(lat, lng));
      this.addToSet(pointSet, L.latLng(lat, lng));
      const pixel = LatLongToPixelXY(lat, lng);
      const pixelLow = { x: pixel.x - Math.fround(pixel.x), y: pixel.y - Math.fround(pixel.y) };
      const pixelHigh = {x: pixel.x, y: pixel.y};
      points.push(pixelHigh.x, pixelHigh.y, pixelLow.x, pixelLow.y, colors.r, colors.g, colors.b, colors.a, ++count);
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
      let fault = this.createFaultObject(data[i], type, latlng)
      faults.push(fault);         
    }
    return { faults: faults, points: points, count: count}
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
    // if (length > thickness * 1.5 || length < thickness * 0.5) {
    //   return new Vector2D(0, 0);
    // }
    let l = miter.multiply(length);
    return new Vector2D(l.x, l.y);  
  } 

    createFaultObject(data, type, latlng) {
      let id = data.id.split('_');
      let obj = {};
      if (type === "footpath") {   
        obj = {
          type: type,
          id: id[id.length - 1],
          roadid: data.roadid,
          footpathid: data.footpathid,
          roadname: data.roadname,        
          location: data.location,
          asset:  data.asset,
          fpsurface: data.type,
          fault: data.fault,
          cause: data.cause,
          width: data.width,
          length: data.length,
          grade: data.grade,
          photo: data.photoid,
          datetime: data.faulttime,
          latlng: latlng,
          status: data.status,
          datefixed: data.datefixed
        };
      } else {
        obj = {
          type: type,
          id: id[id.length - 1],
          roadid: data.roadid,
          carriage: data.carriage,
          inspection: data.inspection,
          location: data.location,
          class: data.class,
          fault: data.fault,
          repair: data.repair,
          comment: data.comment,
          width: data.width,
          length: data.length,
          priority: data.priority,
          photo: data.photoid,
          datetime: data.faulttime,
          latlng: latlng,
          status: data.status,
          datefixed: data.datefixed
        };
      }
      return obj;
    }

    setColors(geometry, type, priorities) {
      let colors = {r: null, b: null, g: null, a: null}
      let priority = null
      if (type === "road") {
        priority = geometry.priority;
      } else {
        priority = geometry.grade;
      }
      if (geometry.status === "active") {
        if(priority === priorities.high) {
          colors.r = 1.0;
          colors.g = 0.0;
          colors.b = 1.0;
          colors.a = 1.0;
        } else if(priority === priorities.med) {
          colors.r = 1.0;
          colors.g = 0.5;
          colors.b = 0.0;
          colors.a = 1.0;
        } else if (priority === priorities.low) {
          colors.r = 0.0;
          colors.g = 0.8;
          colors.b = 0.0;
          colors.a = 1.0;
        } else if (priority === 99) {
          colors.r = 0.0;
          colors.g = 0.0;
          colors.b = 1.0;
          colors.a = 1.0;
        } else {
          colors.r = 0.0;
          colors.g = 0.8;
          colors.b = 0.8;
          colors.a = 1.0;
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


    _drawLines(data, type, priorities, pointCount) {
      const thickness = 0.000005;
      let glPoints = [];
      let lengths = [];
      for (let i = 0; i < data.length; i++) {
        //if (data[i].id === "MDC_RD_0521_1692" || data[i].id === "MDC_RD_0521_1690") {
          const linestring = JSON.parse(data[i].st_asgeojson);
          if (linestring !== null) {  
            let line = linestring.coordinates;
            let colors = this.setColors(data[i], type, priorities);
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
              glPoints.push(vertex1High.x, vertex1High.y, vertex1Low.x, vertex1Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex4High.x, vertex4High.y, vertex4Low.x, vertex4Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);  
              //6 * 9 = 54 elements per two point line
          } else {
            for (let j = 0; j < line.length; j += 1) {
              if (j === 0) { //start of line
                const point0 = line[j];
                const point1 = line[j + 1];
                const point2 = line[j + 2];
                const pixel0 = LatLongToPixelXY(point0[1], point0[0]);
                const pixel1 = LatLongToPixelXY(point1[1], point1[0]);
                const pixel2 = LatLongToPixelXY(point2[1], point2[0]);
                let p0 = new Vector2D(pixel0.x, pixel0.y);
                let p1 = new Vector2D(pixel1.x, pixel1.y);
                let p2 = new Vector2D(pixel2.x, pixel2.y);
      
                let pixelLine = Vector2D.subtract(p1, p0);
                let normal = new Vector2D(-pixelLine.y, pixelLine.x)
                let normalized = normal.normalize();
  
                let vertex1 = Vector2D.subtract(p0, Vector2D.multiply(normalized,thickness));
                let vertex2 = Vector2D.add(p0, Vector2D.multiply(normalized,thickness));
      
                let miter = this.getMiter(p0, p1, p2, thickness);
                let vertex3 = Vector2D.subtract(p1, miter);
                let vertex4 = Vector2D.add(p1, miter);  
  
                //let l = Vector2D.subtract(a, b).length();
                const vertex1Low = { x: vertex1.x - Math.fround(vertex1.x), y: vertex1.y - Math.fround(vertex1.y) };
                const vertex1High = {x: vertex1.x, y: vertex1.y};
                const vertex2Low = { x: vertex2.x - Math.fround(vertex2.x), y: vertex2.y - Math.fround(vertex2.y) };
                const vertex2High = {x: vertex2.x, y: vertex2.y};
                const vertex3Low = { x: vertex3.x - Math.fround(vertex3.x), y: vertex3.y - Math.fround(vertex3.y) };
                const vertex3High = {x: vertex3.x, y: vertex3.y};
                const vertex4Low = { x: vertex4.x - Math.fround(vertex4.x), y: vertex4.y - Math.fround(vertex4.y) };
                const vertex4High = {x: vertex4.x, y: vertex4.y};
                glPoints.push(vertex1High.x, vertex1High.y, vertex1Low.x, vertex1Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex4High.x, vertex4High.y, vertex4Low.x, vertex4Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);  
            } else if (j === line.length - 2) {
                const point0 = line[j - 1];
                const point1 = line[j];
                const point2 = line[j + 1];
                const pixel0 = LatLongToPixelXY(point0[1], point0[0]);
                const pixel1 = LatLongToPixelXY(point1[1], point1[0]);
                const pixel2 = LatLongToPixelXY(point2[1], point2[0]);
                let p0 = new Vector2D(pixel0.x, pixel0.y);
                let p1 = new Vector2D(pixel1.x, pixel1.y);
                let p2 = new Vector2D(pixel2.x, pixel2.y);
                let miter1 = this.getMiter(p0, p1, p2, thickness);
  
                let vertex1 = Vector2D.add(p1, miter1);
                let vertex2 = Vector2D.subtract(p1,  miter1);
                let pixelLine = Vector2D.subtract(p2, p1);
                let normal = new Vector2D(-pixelLine.y, pixelLine.x)
                let normalized = normal.normalize();
                let vertex3 = Vector2D.subtract(p2, Vector2D.multiply(normalized,thickness));
                let vertex4 = Vector2D.add(p2, Vector2D.multiply(normalized,thickness));
                //let l = Vector2D.subtract(c, d).length();
                const vertex1Low = { x: vertex1.x - Math.fround(vertex1.x), y: vertex1.y - Math.fround(vertex1.y) };
                const vertex1High = {x: vertex1.x, y: vertex1.y};
                const vertex2Low = { x: vertex2.x - Math.fround(vertex2.x), y: vertex2.y - Math.fround(vertex2.y) };
                const vertex2High = {x: vertex2.x, y: vertex2.y};
                const vertex3Low = { x: vertex3.x - Math.fround(vertex3.x), y: vertex3.y - Math.fround(vertex3.y) };
                const vertex3High = {x: vertex3.x, y: vertex3.y};
                const vertex4Low = { x: vertex4.x - Math.fround(vertex4.x), y: vertex4.y - Math.fround(vertex4.y) };
                const vertex4High = {x: vertex4.x, y: vertex4.y};
                glPoints.push(vertex1High.x, vertex1High.y, vertex1Low.x, vertex1Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
                glPoints.push(vertex4High.x, vertex4High.y, vertex4Low.x, vertex4Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);  
                break;  
            } else {
              const point0 = line[j - 1];
              const point1 = line[j];
              const point2 = line[j + 1];
              const point3 = line[j + 2];
              const pixel0 = LatLongToPixelXY(point0[1], point0[0]);
              const pixel1 = LatLongToPixelXY(point1[1], point1[0]);
              const pixel2 = LatLongToPixelXY(point2[1], point2[0]);
              const pixel3 = LatLongToPixelXY(point3[1], point2[0]);
              let p0 = new Vector2D(pixel0.x, pixel0.y);
              let p1 = new Vector2D(pixel1.x, pixel1.y);
              let p2 = new Vector2D(pixel2.x, pixel2.y);
              let p3 = new Vector2D(pixel3.x, pixel3.y);
              //meter calc
              let miter1 = this.getMiter(p0, p1, p2, thickness);
              let miter2 = this.getMiter(p1, p2, p3, thickness);
  
              let vertex1 = Vector2D.add(p1, miter1);
              let vertex2 = Vector2D.subtract(p1,  miter1);
              let vertex3 = Vector2D.add(p2, miter2);
              let vertex4 = Vector2D.subtract(p2,  miter2);
              const vertex1Low = { x: vertex1.x - Math.fround(vertex1.x), y: vertex1.y - Math.fround(vertex1.y) };
              const vertex1High = {x: vertex1.x, y: vertex1.y};
              const vertex2Low = { x: vertex2.x - Math.fround(vertex2.x), y: vertex2.y - Math.fround(vertex2.y) };
              const vertex2High = {x: vertex2.x, y: vertex2.y};
              const vertex3Low = { x: vertex3.x - Math.fround(vertex3.x), y: vertex3.y - Math.fround(vertex3.y) };
              const vertex3High = {x: vertex3.x, y: vertex3.y};
              const vertex4Low = { x: vertex4.x - Math.fround(vertex4.x), y: vertex4.y - Math.fround(vertex4.y) };
              const vertex4High = {x: vertex4.x, y: vertex4.y};
  
              glPoints.push(vertex1High.x, vertex1High.y, vertex1Low.x, vertex1Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex2High.x, vertex2High.y, vertex2Low.x, vertex2Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex3High.x, vertex3High.y, vertex3Low.x, vertex3Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);
              glPoints.push(vertex4High.x, vertex4High.y, vertex4Low.x, vertex4Low.y, colors.r, colors.g, colors.b, colors.a, pointCount);  
            }
          }
          }
        }      
      }
      return {vertices: glPoints, lengths: lengths}
    }
};