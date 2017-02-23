/**
 * @fileoverview Utilities for setting up cube map for environment mapping and neccessary objects on HTML, adopted from CS 418 Discussion 5 Demo example
 * @author gluo2@illinois.com (Guanheng Luo)
 */

var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var imgLoaded = 0;

var cameraRotationRadians = 0;
var objRotationRadians = 0;

// Create a place to store teapot geometry
var objVertexPositionBuffer;

//Create a place to store normals for shading
var objVertexNormalBuffer;

// Create a place to store the triangles
var objTriIndexBuffer;

// flag to state if the object is loaded and set
var objLoaded = false;

// Create a place to store skybox geometry
var cubeVertexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

// cube map for environment mapping
var cubeTexture;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,9.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

//========================================== setup buffers section ===============================================

/**
 * Function to setup buffers for the object
 * @param {String} content The vertices and faces information of the object
 */
function setupObjBuffers(content){
  var lines = content.split("\n");
  var positions = [];
  var normals = [];
  var indexs = [];
 
  for ( var i = 0 ; i < lines.length ; i++ ) {
    var parts = lines[i].trimRight().split(' ');
    if ( parts.length > 0 ) {
      switch(parts[0]) {
        case 'v':  
            positions.push(parseFloat(parts[1]));
            positions.push(parseFloat(parts[2]));
            positions.push(parseFloat(parts[3]));
            normals.push(0);
            normals.push(0);
            normals.push(0);
          break;
        case 'f': 
            indexs.push(parseInt(parts[2]) - 1);
            indexs.push(parseInt(parts[3]) - 1);
            indexs.push(parseInt(parts[4]) - 1);
          break;
      }
    }
  }
    
  for(i = 0; i < indexs.length; i += 3){
      normalCalculator(normals, positions, indexs[i], indexs[i+1], indexs[i+2]);
  }

  normalizeNormal(normals);
    
  objVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);      
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  objVertexPositionBuffer.itemSize = 3;
  objVertexPositionBuffer.numItems = positions.length;

  // Specify normals to be able to do lighting calculations
  objVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals),
                  gl.STATIC_DRAW);
  objVertexNormalBuffer.itemSize = 3;
  objVertexNormalBuffer.numItems = normals.length;
    
  objTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objTriIndexBuffer);

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indexs), gl.STATIC_DRAW);
  
  objTriIndexBuffer.numItems = indexs.length;
    
  objLoaded = true;
}

//-------------------------------------------------------------------------
/**
 * Function to setup buffers for the cube (skybox)
 */
function setupCubeBuffers() {

  // Create a buffer for the cube's vertices.

  cubeVertexBuffer = gl.createBuffer();

  // Select the cubeVerticesBuffer as the one to apply vertex
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);

  // Now create an array of vertices for the cube.

  var vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.

  cubeTriIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  var cubeVertexIndices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23    // left
  ];

  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
}

//=================================================== draw objects section =====================================================

/**
 * Function to draw the object
 */
function drawObj(){
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, objVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
  // Draw the cube.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objTriIndexBuffer);
  gl.drawElements(gl.TRIANGLES, objTriIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

//-------------------------------------------------------------------------
/**
 * Function to draw the cube (skybox)
 */
function drawCube(){

  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
    
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);
  // Draw the cube.

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeTriIndexBuffer);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

//======================================== Parameter to Shader Upload Section =========================

/**
 * Sends Modelview matrix to shader
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
/**
 * Sends light to world matrix to shader
 * @param {mat4} matrix the matrix corresponding to the model view matrix of the skybox
 */
function uploadLightWorldMatrixToShader(matrix) {
  gl.uniformMatrix4fv(shaderProgram.lwMatrixUniform, false, matrix);
}

//-------------------------------------------------------------------------
/**
 * Sends light to world matrix to shader
 */
function uploadCorrectionMatrixToShader() {
  var matrix = mat4.create();
  mat4.rotateY(matrix, matrix, cameraRotationRadians);
  mat4.invert(matrix, matrix);
  gl.uniformMatrix4fv(shaderProgram.ecMatrixUniform, false, matrix);
}

//-------------------------------------------------------------------------
/**
 * Sends projection matrix to shader
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
/**
 * Generates and sends the normal matrix to the shader
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
/**
 * Pushes matrix onto modelview matrix stack
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
/**
 * Pops matrix off of modelview matrix stack
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
/**
 * Sends projection/modelview matrices to shader
 * @param {int} flag indicator of if it is drawing the skybox (flag == 1)
 */
function setMatrixUniforms(flag) {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
    uploadCorrectionMatrixToShader();
    gl.uniform1i(shaderProgram.skyboxUniform, flag);
}

//----------------------------------------------------------------------------------
/**
 * Translates degrees to radians
 * @param {Number} degrees Degree input to function
 * @return {Number} The radians that correspond to the degree input
 */
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
/**
 * Creates a context for WebGL
 * @param {element} canvas WebGL canvas
 * @return {Object} WebGL context
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

//----------------------------------------------------------------------------------
/**
 * Loads Shaders
 * @param {string} id ID string for shader to load. Either vertex shader/fragment shader
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

//----------------------------------------------------------------------------------
/**
 * Compile Shaders
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

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    
  shaderProgram.skyboxUniform = gl.getUniformLocation(shaderProgram, "isSkybox");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");

  //Matrix to translate light position to world (skybox) coordinate
  shaderProgram.lwMatrixUniform = gl.getUniformLocation(shaderProgram, "uLWMatrix");
  shaderProgram.ecMatrixUniform = gl.getUniformLocation(shaderProgram, "uEnvCorrectionMatrix");
    
    
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}

//----------------------------------------------------------------------------------
/**
 * Upload point light information
 * @param {vec3} loc position of the light
 * @param {vec3} a ambient color of the light
 * @param {vec3} d diffuse color of the light
 * @param {vec3} s specular color of the light
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
/**
 * Setup buffers
 */
function setupBuffers() {
    readTextFile("teapot_0.obj", setupObjBuffers);
    setupCubeBuffers();
}

//----------------------------------------------------------------------------------
/**
 * Setup cube map for environment mapping
 */
function setupCubeMap() {
// TODO: Setup Cube Map
    cubeTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255]));
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, cubeTexture, "pos-x.png");
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, cubeTexture, "neg-x.png");
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, cubeTexture, "pos-y.png");
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, cubeTexture, "neg-y.png");
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, cubeTexture, "pos-z.png");
    loadCubeMapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, cubeTexture, "neg-z.png");

}

//----------------------------------------------------------------------------------
/**
 * Load image for one side of cube map
 * @param {gl} gl gl program
 * @param {target} target the target of the mapping
 * @param {texture} textrure the texture object of the target
 * @param {String} url link to the image
 */
function loadCubeMapFace(gl, target, texture, url){
// TODO: Onload call function
    var image = new Image();
    image.onload = function(){
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        imgLoaded += 1;
    }
    image.src = url;
}

//----------------------------------------------------------------------------------
/**
 * Draw function
 */
function draw() { 
  var transformVec = vec3.create();

  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // We'll use perspective 
  mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

  // We want to look down -z, so create a lookat point in that direction    
  vec3.add(viewPt, eyePt, viewDir);
  // Then generate the lookat matrix and initialize the MV matrix to that view
  mat4.lookAt(mvMatrix,eyePt,viewPt,up);    

  // TODO: set texture
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
  gl.uniform1i(shaderProgram.uCubeSampler,1);
    
  //move to Earth position    
  mvPushMatrix();   
  gl.enableVertexAttribArray(shaderProgram.aVertexTextureCoords); 

  mat4.rotateY(mvMatrix,mvMatrix,cameraRotationRadians);
  //Draw Skybox  
  mvPushMatrix();
  vec3.set(transformVec,10.0,10.0,10.0);
  mat4.scale(mvMatrix, mvMatrix,transformVec);    
  uploadLightWorldMatrixToShader(mvMatrix);
  setMatrixUniforms(1);
  drawCube();
  mvPopMatrix();

  //Draw Earth  
  mvPushMatrix();
  vec3.set(transformVec,1.0,1.0,1.0);
  mat4.scale(mvMatrix, mvMatrix,transformVec);    
  mat4.rotateY(mvMatrix, mvMatrix, objRotationRadians);
  vec3.set(transformVec, 0, -1.0, 0);
  mat4.translate(mvMatrix, mvMatrix, transformVec);
  setMatrixUniforms(0);
  uploadLightsToShader([0,0,5],[0.0,0.0,0.0],[0.1,0.0,0.0],[1.0,0.0,0.0]);
  if(objLoaded)
    drawObj();
  mvPopMatrix();
    
  mvPopMatrix();

}

//----------------------------------------------------------------------------------
/**
 * animate function to upload parameter
 */
function animate() {
    handleKeys();
}

//----------------------------------------------------------------------------------
/**
 * Program entry
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupCubeMap();
  setupBuffers();
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
/**
 * Function which will be called on every frame to handle user input and to draw the scene
 */
function tick() {
    requestAnimFrame(tick);
    if(imgLoaded == 6 && objLoaded){
        draw();
        animate();
    }
}

//===================================== Helper Functions ==================================================

/**
 * Gets a file from the server for processing on the client side.
 *
 * @param  file A string that is the name of the file to get
 * @param  callbackFunction The name of function (NOT a string) that will receive a string holding the file
 *         contents.
 *
 */
function readTextFile(file, callbackFunction)
{
    console.log("reading "+ file);
    var rawFile = new XMLHttpRequest();
    var allText = [];
    rawFile.open("GET", file, true);
    
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                 callbackFunction(rawFile.responseText);
                 console.log("Got text file!");
                 
            }
        }
    }
    rawFile.send(null);
}

/**
 * Helper function to normalize each normal in normal array
 * @param {Array} normalArray The array storing the normal of each vertex in the terrain
 */
function normalizeNormal(normalArray){
    for(var i = 0; i < normalArray.length; i += 3){
        var normalized = vec3.fromValues(normalArray[i],normalArray[i+1],normalArray[i+2]);
        vec3.normalize(normalized, normalized);
        normalArray[i] = normalized[0];
        normalArray[i+1] = normalized[1];
        normalArray[i+2] = normalized[2];
    }
}

/**
 * Helper function to calculate the normal for a triangle in the terrain and feed it into normal array
 * @param {Array} normalArray The array to store the normal of vertices
 * @param {Array} vertexArray The array storing the position of vertices
 * @param {int} pointIndex1 The value of one of the vertex in the triangle
 * @param {int} pointIndex2 The value of one of the vertex in the triangle
 * @param {int} pointIndex3 The value of one of the vertex in the triangle
 */
function normalCalculator(normalArray, vertexArray, pointIndex1, pointIndex2, pointIndex3){
    var vector1 = vec3.fromValues(vertexArray[3*pointIndex1],vertexArray[3*pointIndex1+1],vertexArray[3*pointIndex1+2]); 
    var vector2 = vec3.fromValues(vertexArray[3*pointIndex2],vertexArray[3*pointIndex2+1],vertexArray[3*pointIndex2+2]); 
    var vector3 = vec3.fromValues(vertexArray[3*pointIndex3],vertexArray[3*pointIndex3+1],vertexArray[3*pointIndex3+2]);
    
    var vectorU = vec3.create();
    var vectorV = vec3.create();
    var normal = vec3.create();

    vec3.sub(vectorU, vector2, vector1);
    vec3.sub(vectorV, vector3, vector1);
    vec3.cross(normal, vectorU, vectorV);
    vec3.normalize(normal, normal);
    
    normalArray[3*pointIndex1] += normal[0];
    normalArray[3*pointIndex1+1] += normal[1];
    normalArray[3*pointIndex1+2] += normal[2];
    
    normalArray[3*pointIndex2] += normal[0];
    normalArray[3*pointIndex2+1] += normal[1];
    normalArray[3*pointIndex2+2] += normal[2];
    
    normalArray[3*pointIndex3] += normal[0];
    normalArray[3*pointIndex3+1] += normal[1];
    normalArray[3*pointIndex3+2] += normal[2];
}

var currentlyPressedKeys = {};

/**
 * Function called when a key down input is detected to set up variables for handling user input
 */
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

/**
 * Function called when a key up input is detected to set up variables for handling user input
 */
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

/**
 * Function to generate quaternion that will apply to eye's up vector and look at vector based on user input it receives
 */
function handleKeys() {
    if (currentlyPressedKeys[33]) {
      // Page Up
      objRotationRadians -= 0.01;
    }
    if (currentlyPressedKeys[34]) {
      // Page Down
      objRotationRadians += 0.01;    
    }
    if (currentlyPressedKeys[37]) {
      // Left cursor key
      cameraRotationRadians -= 0.01;

    }
    if (currentlyPressedKeys[39]) {
      // Right cursor key
      cameraRotationRadians += 0.01;
    }
  }