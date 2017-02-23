/*
    The frame of the code is adopted from CS418 class example
    The functions: setupBuffers() and tick() are modified for this mp
*/

var gl;
var canvas;
var shaderProgram;

var vertexPositionBuffer;
var vertexColorBuffer;

var mvMatrix = mat4.create();
var rotAngle = 0;

// A helper funtion to update the transformation matrix in shader program
function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * A help funtion to convert degree into radian
 * @param degrees, the value to be convert in degree
 * @return the value in radian
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

/** 
 * A function to create a context for WebGL given a canvas object
 * @param canvas, the object that the context is created based on
 * @return context object that has been set up
 */
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

/**
 * A funtion to load and compile shader program from html file
 * @param id, the id of the script to be compiled
 * @return shader, the compiled shader function
 */
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

/**
 * A function to set up shaders for presenting the animation
 */
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  
}

/**
 * A funtion to set up vertex buffer and color buffer for shaders
 * and the buffers together will present a Illini Badge after being drawn
 */
function setupBuffers() {
  vertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    
  // An array to hold all the vertices of the badge
  // The vertices for the orange part of the badge are set up with sin() of a global variable
  // such that the coordinate of those vertices will change according to the global variable "rotAngle"
  // when setupBuffers() is called
  // note: the global variable will change over each frame such that the orange part will also perform
  // a non-affine transformation in the animation.
  var triangleVertices = [
      -0.90,  0.95,  0.0,
      -0.90,  0.65,  0.0,
      -0.70,  0.65,  0.0,
      
      -0.70,  0.65,  0.0,
      -0.35,  0.65,  0.0, 
      -0.90,  0.95,  0.0,
      
      -0.90,  0.95,  0.0,
      -0.35,  0.65,  0.0,
       0.35,  0.65,  0.0,
      
      -0.90,  0.95,  0.0,
       0.35,  0.65,  0.0,
       0.70,  0.65,  0.0,
      
      -0.90,  0.95,  0.0,
       0.70,  0.65,  0.0,
       0.90,  0.65,  0.0,
      
      -0.90,  0.95,  0.0,
       0.90,  0.65,  0.0,
       0.90,  0.95,  0.0,
    //------------------------------
      -0.70,  0.65,  0.0,
      -0.70, -0.30,  0.0,
      -0.35,  0.65,  0.0,
      
      -0.35,  0.65,  0.0,
      -0.70, -0.30,  0.0,
      -0.35,  0.40,  0.0,
      
      -0.35,  0.40,  0.0,
      -0.70, -0.30,  0.0,
      -0.35, -0.05,  0.0,
      
      -0.35, -0.30,  0.0,
      -0.35, -0.05,  0.0,
      -0.70, -0.30,  0.0,
      
      -0.35,  0.40,  0.0,
      -0.35, -0.05,  0.0,
      -0.20,  0.40,  0.0,
      
      -0.35, -0.05,  0.0,
      -0.20, -0.05,  0.0,
      -0.20,  0.40,  0.0,
      
       0.70, -0.30,  0.0,
       0.70,  0.65,  0.0,
       0.35,  0.65,  0.0,
      
       0.35,  0.65,  0.0,
       0.35,  0.40,  0.0,
       0.70, -0.30,  0.0,
      
       0.35,  0.40,  0.0,
       0.35, -0.05,  0.0,
       0.70, -0.30,  0.0,
      
       0.35, -0.30,  0.0,
       0.70, -0.30,  0.0,
       0.35, -0.05,  0.0,

       0.35, -0.05,  0.0,
       0.35,  0.40,  0.0,
       0.20,  0.40,  0.0,
      
       0.35, -0.05,  0.0,
       0.20,  0.40,  0.0,
       0.20, -0.05,  0.0,
      //-----------------------------
      -0.70+0.05*Math.sin(0.2*rotAngle), -0.35,  0.0,
      -0.58+0.05*Math.sin(0.2*rotAngle), -0.57,  0.0,
      -0.58+0.05*Math.sin(0.2*rotAngle), -0.35,  0.0,
      -0.58+0.05*Math.sin(0.2*rotAngle), -0.57,  0.0,
      -0.70+0.05*Math.sin(0.2*rotAngle), -0.35,  0.0,
      -0.70+0.05*Math.sin(0.2*rotAngle), -0.50,  0.0,
      
      -0.35+0.05*Math.sin(0.2*rotAngle+0.5), -0.35,  0.0,
      -0.47+0.05*Math.sin(0.2*rotAngle+0.5), -0.35,  0.0,
      -0.47+0.05*Math.sin(0.2*rotAngle+0.5), -0.63,  0.0,
      -0.35+0.05*Math.sin(0.2*rotAngle+0.5), -0.35,  0.0,
      -0.47+0.05*Math.sin(0.2*rotAngle+0.5), -0.63,  0.0,
      -0.35+0.05*Math.sin(0.2*rotAngle+0.5), -0.70,  0.0,
      
      -0.08+0.05*Math.sin(0.2*rotAngle+1.0), -0.35,  0.0,
      -0.22+0.05*Math.sin(0.2*rotAngle+1.0), -0.35,  0.0,
      -0.22+0.05*Math.sin(0.2*rotAngle+1.0), -0.75,  0.0,
      -0.08+0.05*Math.sin(0.2*rotAngle+1.0), -0.35,  0.0,
      -0.22+0.05*Math.sin(0.2*rotAngle+1.0), -0.75,  0.0,
      -0.08+0.05*Math.sin(0.2*rotAngle+1.0), -0.82,  0.0,
      
       0.70+0.05*Math.sin(0.2*rotAngle+1.5), -0.35,  0.0,
       0.58+0.05*Math.sin(0.2*rotAngle+1.5), -0.35,  0.0,
       0.58+0.05*Math.sin(0.2*rotAngle+1.5), -0.57,  0.0,
       0.70+0.05*Math.sin(0.2*rotAngle+1.5), -0.35,  0.0,
       0.58+0.05*Math.sin(0.2*rotAngle+1.5), -0.57,  0.0,
       0.70+0.05*Math.sin(0.2*rotAngle+1.5), -0.50,  0.0,
      
       0.47+0.05*Math.sin(0.2*rotAngle+2.0), -0.35,  0.0,
       0.35+0.05*Math.sin(0.2*rotAngle+2.0), -0.35,  0.0,
       0.47+0.05*Math.sin(0.2*rotAngle+2.0), -0.63,  0.0,
       0.47+0.05*Math.sin(0.2*rotAngle+2.0), -0.63,  0.0,
       0.35+0.05*Math.sin(0.2*rotAngle+2.0), -0.35,  0.0,
       0.35+0.05*Math.sin(0.2*rotAngle+2.0), -0.70,  0.0,
      
       0.22+0.05*Math.sin(0.2*rotAngle+2.5), -0.35,  0.0,
       0.08+0.05*Math.sin(0.2*rotAngle+2.5), -0.35,  0.0,
       0.22+0.05*Math.sin(0.2*rotAngle+2.5), -0.75,  0.0,
       0.22+0.05*Math.sin(0.2*rotAngle+2.5), -0.75,  0.0,
       0.08+0.05*Math.sin(0.2*rotAngle+2.5), -0.35,  0.0,
       0.08+0.05*Math.sin(0.2*rotAngle+2.5), -0.82,  0.0,
      
      
  ];
    
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.DYNAMIC_DRAW);
  vertexPositionBuffer.itemSize = 3;
  vertexPositionBuffer.numberOfItems = 90;
    
  vertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
    
  // An array to store RGBA information of color for each vertex
  // (0.075, 0.16, 0.3, 1.0) for navy blue
  // (0.9, 0.3, 0.2, 1.0) for orange
  var colors = [
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      0.075, 0.16, 0.3, 1.0,
      
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0,
      0.9, 0.3, 0.2, 1.0
    ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  vertexColorBuffer.itemSize = 4;
  vertexColorBuffer.numItems = 90;  
}

/**
 * A funtion to draw the image
 * note: it will be called for each frame to animate the image
 */
function draw() { 
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  
  mat4.identity(mvMatrix);
  mat4.rotateY(mvMatrix, mvMatrix, degToRad(rotAngle));  
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
                         vertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                            vertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
  
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, vertexPositionBuffer.numberOfItems);
}

/**
 * A function to change global variable "rotAngle" 
 * which the transformation matrix and coordinate of specific vertices depend on
 */
function animate() {   
        rotAngle= (rotAngle+1.0) % 360;
}

/**
 * A startup function for the animation
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupBuffers();
  setupShaders(); 
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * A funtion which will be called on every frame
 * it will call the draw() function to produce the image for current frame
 * and call animate() and setupBuffers() accordingly
 * the former is called to alter the global variable 
 * such that the image for next frame will be slightly different
 * and the later is called to update the vetex buffer based on the change from calling animate()
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
    setupBuffers();
}