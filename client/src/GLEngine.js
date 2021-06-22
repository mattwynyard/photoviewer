import Vector2D from './Vector2D';
import {LatLongToPixelXY, translateMatrix, scaleMatrix} from  './util.js';
import L from 'leaflet';
import './L.CanvasOverlay';



export default class GLEngine {
 
    constructor(leaflet) {
        this.leafletMap = leaflet;
        this.mouseClick = null;
        this.gl = null;
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
        for (let i = 0; i < verts.length; i += 7) {
          if (verts[i + 6] === this.appDelegate.state.selectedIndex) {
            verts[i + 2] = 1.0;
            verts[i + 3] = 0;
            verts[i + 4] = 0;
            verts[i + 5] = 1.0;
          }
        }
      }   
    } else {
      for (let i = 0; i < verts.length; i += 7) {
        let index = verts[i + 6];
        //calculates r,g,b color from index
        let r = ((index & 0x000000FF) >>  0) / 255;
        let g = ((index & 0x0000FF00) >>  8) / 255;
        let b = ((index & 0x00FF0000) >> 16) / 255;
        verts[i + 2] = r;
        verts[i + 3] = g;
        verts[i + 4] = b;
        verts[i + 5] = 1.0; //alpha
      }
    }
    return verts;
  }

  redraw(points, lines) {
    console.log("redrawing.." + lines)
    this.glpoints = points;
    this.gllines = lines;
    this.glLayer.drawing(drawingOnCanvas); 
    let pixelsToWebGLMatrix = new Float32Array(16);
    this.mapMatrix = new Float32Array(16);  
        // -- WebGl setup
    const [minSize, maxSize] = this.gl.getParameter(this.gl.ALIASED_LINE_WIDTH_RANGE);
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
    let colorLoc = this.gl.getAttribLocation(program, "a_color");
    let vertLoc = this.gl.getAttribLocation(program, "a_vertex");
    this.gl.aPointSize = this.gl.getAttribLocation(program, "a_pointSize");
    // Set the matrix to some that makes 1 unit 1 pixel.
    //this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    //this.gl.uniformMatrix4fv(u_matLoc, false, pixelsToWebGLMatrix); 
    let vertBuffer = this.gl.createBuffer();
    //let numPoints = points.length / 7 ; //[lat, lng, r, g, b, a, id]
    let thickness = 0.00001;
    //let vertArray = this.reColorPoints(new Float32Array(points));
    //let vertArray = new Float32Array(this.buildVertices(lines, [], thickness));
    let vertices = this.buildLines(lines, []);
    console.log(vertices);
    let vertArray = new Float32Array(vertices.length);
    for (let i = 0; i < vertices.length; i++) {
      //vertArray[i] = Math.fround(vertices[i]);
      vertArray[i] = vertices[i];

    }
    //let vertArray = new Float32Array(vertices);
    
    console.log(vertArray);
    let fsize = vertArray.BYTES_PER_ELEMENT;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertArray, this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(vertLoc, 2, this.gl.FLOAT, false, fsize*7, 0);
    this.gl.enableVertexAttribArray(vertLoc);
    // -- offset for color buffer
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, fsize*7, fsize*2);
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
      let pointSize = Math.max(this._map.getZoom() - 6.0, 1.0);
      this.delegate.gl.vertexAttrib1f(this.delegate.gl.aPointSize, pointSize);
      // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
      this.delegate.mapMatrix.set(pixelsToWebGLMatrix);
      let bounds = this._map.getBounds();
      let topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());
      let offset = LatLongToPixelXY(topLeft.lat, topLeft.lng);
      // -- Scale to current zoom
      var scale = Math.pow(2, this._map.getZoom());
      scaleMatrix(this.delegate.mapMatrix, scale, scale);
      translateMatrix(this.delegate.mapMatrix, -offset.x, -offset.y);
      let u_matLoc = this.delegate.gl.getUniformLocation(program, "u_matrix");
      // -- attach matrix value to 'mapMatrix' uniform in shader
      this.delegate.gl.uniformMatrix4fv(u_matLoc, false, this.delegate.mapMatrix);
      //this.delegate.gl.drawArrays(this.delegate.gl.POINTS, 0, numPoints);
      let pointer = 0;
      for (var i = 0; i < lines.length - 1; i += 1) {             
        //let numPoints = (lines[i].segment.length - 1) * 6;
        let numPoints = (lines[i].segment.length) * 2;
        //this.delegate.gl.drawArrays(this.delegate.gl.TRIANGLES, pointer, numPoints);
        this.delegate.gl.drawArrays(this.delegate.gl.LINES, pointer, numPoints);
        pointer += numPoints;
    } 
      // if (this.delegate.mouseClick !== null) {      
      //   let pixel = new Uint8Array(4);
      //   this.delegate.gl.readPixels(this.delegate.mouseClick.originalEvent.layerX, 
      //   this.canvas.height - this.delegate.mouseClick.originalEvent.layerY, 1, 1, this.delegate.gl.RGBA, this.delegate.gl.UNSIGNED_BYTE, pixel);
      //   let index = pixel[0] + pixel[1] * 256 + pixel[2] * 256 * 256;
      //   this.delegate.mouseClick = null;
      //   this.delegate.appDelegate.setIndex(index);
      //   this._redraw();
      // }        
    }
}

buildLines(lines, points) {
  console.log(lines);
  let red = 0;
  let green = 0;
  let blue = 1;  
  for (let i = 0; i < lines.length; i += 1) {
    //for (let j = 0; j < lines[i].segment.length; j += 1) {
      if (lines[i].segment.length < 2) {
        console.log(lines[i]);
        continue;
      }
      if(lines[i].segment.length == 2 ) {
        const point0 = {x: lines[i].segment[0].x, y: lines[i].segment[0].y};   
        const point1 = {x: lines[i].segment[1].x, y: lines[i].segment[1].y};
        // if (point0.x === point1.x || point0.y === point1.y) {
        //   continue;
        // }
        points.push(point0.x, point0.y, red, green, blue, 1, 1);
        points.push(point1.x, point1.y, red, green, blue, 1, 1);
      }
    //}
  }
  return points;
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
      if(lines[i].segment.length >= 2 ) {
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

};