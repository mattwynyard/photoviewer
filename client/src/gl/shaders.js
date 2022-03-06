/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
 export let compileShader = (gl, shaderSource, shaderType) => {
    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);
    let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        // Something went wrong during compilation; get the error
        alert("could not compile shader:" + gl.getShaderInfoLog(shader));
    }
    return shader;
};

/**
* Creates a program from 2 shaders.
*
* @param {!WebGLRenderingContext) gl The WebGL context.
* @param {!WebGLShader} vertexShader A vertex shader.
* @param {!WebGLShader} fragmentShader A fragment shader.
* @return {!WebGLProgram} A program.
*/
export let createProgram = (gl, vertexShader, fragmentShader) => {
// create a program.
let program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
let success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    alert("program failed to link:" + gl.getProgramInfoLog(program));
}
return program;
};

// inspired a lot by https://prideout.net/emulating-double-precision
// also https://faistos18.github.io/webGL_leaflet_precise_points

export let vshader300 = 
`#version 300 es
precision mediump float;
uniform mat4 u_matrix;
uniform vec3 u_offset;
uniform vec3 u_offset_low;
uniform float u_thickness;
in vec3 a_vertex;
in vec3 a_vertex_low;
in vec3 a_prev;
in vec3 a_prev_low;
in vec3 a_next;
in vec3 a_next_low;
in float a_pointSize;
in vec4 a_color;
out vec4 v_color;
out vec2 v_index;

vec2 highPrescisionVertex(vec2 vertex, vec2 vertex_low) {
    vec2 t1 = vertex_low.xy - u_offset_low.xy;
    vec2 e = t1 - vertex_low.xy;
    vec2 t2 = ((-u_offset_low.xy - e) + (vertex_low.xy - (t1 - e))) + vertex.xy - u_offset.xy;
    vec2 high_delta = t1 + t2;
    vec2 low_delta = t2 - (high_delta - t1);
    vec2 p = high_delta + low_delta;
    return p;
}
void main() {
    highp int index = int(a_vertex.z);
    vec2 curr = highPrescisionVertex(a_vertex.xy, a_vertex_low.xy);
    vec2 p;
    if (index < 0) { //point
        p = curr;
        gl_PointSize =  a_pointSize;
    } else { //line
        vec2 offset;
        vec2 prev = highPrescisionVertex(a_prev.xy, a_prev_low.xy);
        vec2 next = highPrescisionVertex(a_next.xy, a_next_low.xy);
        if (prev.xy == curr.xy) {
            vec2 line = normalize(next - curr);
            offset = vec2(-line.y, line.x) * u_thickness;
        } else if (curr.xy == next.xy) {
            vec2 line = normalize(curr - prev);
            offset = vec2(-line.y, line.x) * u_thickness;
        } 
        else {
            vec2 lineA = normalize(curr.xy - prev.xy);
            vec2 lineB = normalize(next.xy - curr.xy);
            vec2 tangent = normalize(lineA + lineB);
            vec2 miter = vec2(-tangent.y, tangent.x);
            vec2 normal =  vec2(-lineA.y, lineA.x);
            float length = u_thickness / dot(miter, normal); 
            offset = miter * length;
        }  
        if (index == 0) {
            p = curr + offset;
        } else {
            p = curr - offset;
        }
    }
    gl_Position = u_matrix * vec4(p, 0.0, 1.0);
    // pass the color to the fragment shader
    v_index = vec2(index, 0);
    v_color = a_color;
}`


export let fshader300 = 
`#version 300 es
precision mediump float; 
in vec4 v_color;
in vec2 v_index;
out vec4 frag_color;
void main() {
    highp int index = int(v_index[0]);
    if (index < 0) {
        float border = 0.05;
        float radius = 0.5;
        vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
        float dist = radius - sqrt(m.x * m.x + m.y * m.y);
        float t = 0.0;
        if (dist > border)
            t = 1.0;
            else if (dist > 0.0)
            t = dist / border;
            frag_color = mix(vec4(0), v_color, t);
    } else {
        frag_color = v_color;
    }
    
}`;

export let vshader = 
`
precision mediump float; // highp is not supported. floats have medium precision 
uniform mat4 u_matrix;
uniform vec3 u_offset;
uniform vec3 u_offset_low;
uniform float u_thickness;
attribute vec3 a_vertex;
attribute vec3 a_vertex_low;
attribute vec3 a_prev;
attribute vec3 a_prev_low;
attribute vec3 a_next;
attribute vec3 a_next_low;
attribute float a_pointSize;
attribute vec4 a_color;
varying vec4 v_color;
vec2 highPrescisionVertex(vec2 vertex, vec2 vertex_low) {
    vec2 t1 = vertex_low.xy - u_offset_low.xy;
    vec2 e = t1 - vertex_low.xy;
    vec2 t2 = ((-u_offset_low.xy - e) + (vertex_low.xy - (t1 - e))) + vertex.xy - u_offset.xy;
    vec2 high_delta = t1 + t2;
    vec2 low_delta = t2 - (high_delta - t1);
    vec2 p = high_delta + low_delta;
    return p;
}
void main() {
    highp int index = int(a_vertex.z);
    vec2 p;
    if (index < 0) { //point
        vec2 curr = highPrescisionVertex(a_vertex.xy, a_vertex_low.xy);
        p = curr;
        gl_PointSize =  a_pointSize;
    } else { //line
        vec2 prev = highPrescisionVertex(a_prev.xy, a_prev_low.xy);
        vec2 curr = highPrescisionVertex(a_vertex.xy, a_vertex_low.xy);
        vec2 next = highPrescisionVertex(a_next.xy, a_next_low.xy);
        vec2 offset;
        if (prev.xy == curr.xy) {
            vec2 line = normalize(next - curr);
            offset = vec2(-line.y, line.x) * u_thickness;
        } else if (curr.xy == next.xy) {
            vec2 line = normalize(curr - prev);
            offset = vec2(-line.y, line.x) * u_thickness;
        } 
        else {
            vec2 lineA = normalize(curr.xy - prev.xy);
            vec2 lineB = normalize(next.xy - curr.xy);
            vec2 tangent = normalize(lineA + lineB);
            vec2 miter = vec2(-tangent.y, tangent.x);
            vec2 normal =  vec2(-lineA.y, lineA.x);
            float length = u_thickness / dot(miter, normal); 
            offset = miter * length;
        }  
        if (index == 0) {
            p = curr + offset;
        } else {
            p = curr - offset;
        }
    }
    gl_Position = u_matrix * vec4(p, 0.0, 1.0);
    // pass the color to the fragment shader
    v_color = a_color;
}`

export let fshader = 
`
precision mediump float; // highp is not supported. floats have medium precision
varying vec4 v_color;
void main() {
float border = 0.05;
float radius = 0.5;
vec2 m = gl_PointCoord.xy - vec2(0.5, 0.5);
float dist = radius - sqrt(m.x * m.x + m.y * m.y);
//vec4 color1 = vec4(v_color[0], v_color[1], v_color[2], v_color[3]);
float t = 0.0;
if (dist > border)
    t = 1.0;
    else if (dist > 0.0)
    t = dist / border;
    gl_FragColor = mix(vec4(0), v_color, t);
}`;

export let fshaderSquare = 
`precision mediump float;
varying vec4 v_color;
void main() {
    gl_FragColor = v_color;  
}`;