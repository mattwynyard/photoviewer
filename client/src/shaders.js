/**
 * Creates and compiles a shader.
 *
 * @param {!WebGLRenderingContext} gl The WebGL Context.
 * @param {string} shaderSource The GLSL source code for the shader.
 * @param {number} shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
export function compileShader(gl, shaderSource, shaderType) {
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
        throw "could not compile shader:" + gl.getShaderInfoLog(shader);
    }

    return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param {!WebGLRenderingContext) gl The WebGL context.
 * @param {!WebGLShader} vertexShader A vertex shader.
 * @param {!WebGLShader} fragmentShader A fragment shader.
 * @return {!WebGLProgram} A program.
 */
export function createProgram(gl, vertexShader, fragmentShader) {
    // create a program.
    var program = gl.createProgram();

    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    // link the program.
    gl.linkProgram(program);

    // Check if it linked.
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        // something went wrong with the link
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
    }

    return program;
};

export let vshader = 
    `precision highp float;
    uniform mat4 u_matrix;
    uniform vec3 u_eyepos;
    uniform vec3 u_eyepos_low;
    attribute vec3 a_vertex;
    attribute vec3 a_vertex_low;
    attribute float a_pointSize;
    attribute vec4 a_color;
    varying vec4 v_color;

    void main() {
    // inspired a lot by https://prideout.net/emulating-double-precision
    // also https://faistos18.github.io/webGL_leaflet_precise_points you legend!
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
    `precision mediump float;
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
    }`

export let fshaderSquare = 
    `precision mediump float;
    varying vec4 v_color;
    void main() {
    gl_FragColor = v_color;  
    }`