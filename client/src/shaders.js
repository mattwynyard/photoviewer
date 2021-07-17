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
    // Create the shader object
    var shader = gl.createShader(shaderType);
    // Set the shader source code.
    gl.shaderSource(shader, shaderSource);
    // Compile the shader
    gl.compileShader(shader);
    // Check if it compiled
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
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
var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
let success = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!success) {
    alert("program failed to link:" + gl.getProgramInfoLog (program));
}
return program;
};

// inspired a lot by https://prideout.net/emulating-double-precision
// also https://faistos18.github.io/webGL_leaflet_precise_points you legend!

export let vshaderLine = 
`#version 300 es
in highp float;

in float a_pointSize;
in vec4 a_color;

in vec3 a_vertex;
in vec3 a_vertex_low;
in vec3 a_prev;
in vec3 a_prev_low;
in vec3 a_next;
in vec3 a_next_low;

uniform mat4 u_matrix;
uniform vec3 u_eyepos;
uniform vec3 u_eyepos_low;
uniform float thickness;

out vec4 v_color;

vec2 highPrescisionVertex(vec3 vertex, vec3 vertex_low) {
    vec3 t1 = vertex_low - u_eyepos_low;
    vec3 e = t1 - vertex_low;
    vec3 t2 = ((-u_eyepos_low - e) + (vertex_low - (t1 - e))) + vertex - u_eyepos;
    vec3 high_delta = t1 + t2;
    vec3 low_delta = t2 - (high_delta - t1);
    vec3 p = high_delta + low_delta;
    return p.xy;
}
void main() {

    vec2 prev = highPrescisionVertex(a_prev, a_prev_low);
    vec2 current = highPrescisionVertex(a_vertex, a_vertex_low);
    vec2 next = highPrescisionVertex(a_next, a_next_low);

    float index = a_vertex.z;
    vec2 direction;
	float length = 1.0;
    if (prev == current) {
		vec2 lineA = normalize(next - current);
		direction = vec2(-lineA.y, lineA.x);
	} else if (next == current) {
		vec2 lineA = normalize(current - prev);
		direction = vec2(-lineA.y, lineA.x);
	} else { // else use both segments and use a mither joint for the mesh
		vec2 lineA = normalize(current - prev);
		vec2 lineB = normalize(next - current);
		vec2 tangent = normalize(lineA + lineB);
		direction = vec2(-tangent.y, tangent.x);
		float d = dot(direction, vec2(-lineA.y, lineA.x));
		if (abs(d - 0.01) > 0.0) {
			length = 1.0 / d;
		} else {
			// run around in circles, screaming ;)
			//length = 1337.0;
		}		
	}
    length *= thickness * 0.5;
	vec2 ap = vec2(direction * thickness);
	vec2 result = current; 
	if (mod(index, 2.0) == 0.0) {
		result += ap;
	} else {
		result -= ap;
	}

    gl_Position = u_matrix * vec4(result, 0.0, 1.0);
    gl_PointSize =  a_pointSize;
    // pass the color to the fragment shader
    v_color = a_color;
}`

export let vshader300 = 
`#version 300 es
precision highp float;
uniform mat4 u_matrix;
uniform vec3 u_eyepos;
uniform vec3 u_eyepos_low;
in vec3 a_vertex;
in vec3 a_vertex_low;
in float a_pointSize;
in vec4 a_color;
out vec4 v_color;

void main() {

    vec3 t1 = a_vertex_low - u_eyepos_low;
    vec3 e = t1 - a_vertex_low;
    vec3 t2 = ((-u_eyepos_low - e) + (a_vertex_low - (t1 - e))) + a_vertex - u_eyepos;
    vec3 high_delta = t1 + t2;
    vec3 low_delta = t2 - (high_delta - t1);
    vec3 p = high_delta + low_delta;
    gl_Position = u_matrix * vec4(p, 1.0);
    gl_PointSize =  a_pointSize;
    // pass the color to the fragment shader
    v_color = a_color;
}`

export let fshader300 = 
`#version 300 es
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float; // highp is supported. floats have high precision
#else
precision mediump float; // highp is not supported. floats have medium precision
#endif
#endif 
//precision highp float;
in vec4 v_color;
out vec4 frag_color;

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
    frag_color = mix(vec4(0), v_color, t);
}`;

export let vshader = 
`
precision highp float;
uniform mat4 u_matrix;
uniform vec3 u_eyepos;
uniform vec3 u_eyepos_low;
attribute vec3 a_vertex;
attribute vec3 a_vertex_low;
attribute float a_pointSize;
attribute vec4 a_color;
varying vec4 v_color;

void main() {
vec3 t1 = a_vertex_low - u_eyepos_low;
vec3 e = t1 - a_vertex_low;
vec3 t2 = ((-u_eyepos_low - e) + (a_vertex_low - (t1 - e))) + a_vertex - u_eyepos;
vec3 high_delta = t1 + t2;
vec3 low_delta = t2 - (high_delta - t1);
vec3 p = high_delta + low_delta;
gl_Position = u_matrix * vec4(p, 1.0);
gl_PointSize =  a_pointSize;
// pass the color to the fragment shader
v_color = a_color;
}`

export let fshader = 
`
#ifdef GL_ES
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float; // highp is supported. floats have high precision
#else
precision mediump float; // highp is not supported. floats have medium precision
#endif
#endif 
//precision mediump float;
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