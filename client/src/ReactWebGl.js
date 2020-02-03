import React, {Component} from 'react';
import L from 'leaflet'
import { MapLayer } from 'react-leaflet'
import CanvasLayer from './canvas-layer'

export default class ReactWebgl extends MapLayer {
    constructor(props, context) {
        super(props, context);
        this.state = {
            onDrawLayer: function(info, bind_buffers) {
                let gl = this.gl
                let canvas = info.canvas
                let leafletMap = this.leafletMap
                let program = this.program
            }
        }
    }

    createLeafletElement(props) {
        const leafletMap = this.context.map
    
        L.canvasLayer = function() {
          return new CanvasLayer();
        };
    
        let cl = L.canvasLayer()
        var glLayer = cl.delegate(this).addTo(leafletMap);
        var canvas = glLayer._canvas
    
        var gl = canvas.getContext('experimental-webgl', {
          antialias: true
        }) || canvas.getContext('experimental-webgl')
        var program = gl.createProgram();
        var framebuffer = gl.createFramebuffer();
        this.state.pointArrayBuffer = gl.createBuffer()
        this.state.sizeArrayBuffer = gl.createBuffer()
        this.state.colorArrayBuffer = gl.createBuffer()
        this.state.colorArrayBufferOffScreen = gl.createBuffer()
        this.state.framebuffer = framebuffer
    
        canvas.addEventListener('click', function(ev) {
          let this_dupe = this
          doMouseOrClick(ev, canvas, gl, framebuffer, leafletMap, props, this_dupe, 'click')
        });
    
        canvas.addEventListener('mousemove', function(ev) {
          let this_dupe = this
          doMouseOrClick(ev, canvas, gl, framebuffer, props, leafletMap, this_dupe, 'mouse')
        });
        var vshaderText = '\nattribute vec4  worldCoord;' +
          'attribute vec4  color;' +
          'attribute float aPointSize;' +
          'varying vec4 vColor;' +
          'uniform mat4 mapMatrix;' +
          'void main() {\n' +
          'gl_Position = mapMatrix * worldCoord;' +
          'vColor = color;' +
          'gl_PointSize = aPointSize;' +
          '}'
    
        var fshaderText = 'precision mediump float;' +
          'varying vec4 vColor;' +
          'void main() {' +
          'gl_FragColor = vColor;' +
          '}'
        var _shaders = shaders(gl),
          vertexShader = _shaders.vertexShader,
          fragmentShader = _shaders.fragmentShader;
    
        function shaders(gl) {
          var vertexShader = gl.createShader(gl.VERTEX_SHADER);
          gl.shaderSource(vertexShader, vshaderText);
          gl.compileShader(vertexShader);
          var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
          gl.shaderSource(fragmentShader, fshaderText);
          gl.compileShader(fragmentShader);
    
          return {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader
          };
        }
    
        // link shaders to create our program
    
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
    
        this.state.gl = gl
        this.state.program = program
        this.state.leafletMap = leafletMap
        return cl
      }

    componentDidMount() {
        this.state.info.points = this.props.points
      // true is for whether to bind buffers
      this.state.onDrawLayer(this.state.info, true);
    }

    
    componentWillUnmount() {

    }


};