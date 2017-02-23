/**
 * @fileoverview Utilities for setting up environment and generating the terrain on HTML, adopted from CS 418 HelloTerrain example
 * @author gluo2@illinois.com (Guanheng Luo)
 */

var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create quaternion for rotation
var rotationalQuaternion = quat.create();

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];


/**
 * Function to set up buffer related to terrain and bind those buffer with shader program to be able to generate the terrain later
 */
function setupTerrainBuffers() {
    
    var vTerrain=[];
    var cTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var gridN=128;
    
    // call the function to fill out the buffer arrays with data related to vertices in the terrain
    var numT = terrainFromIteration(gridN, -1,1,-1,1, vTerrain, cTerrain, fTerrain, nTerrain);
    console.log("Generated ", numT, " triangles"); 
    
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
     // Specify colors to be able to do lighting calculations
    tVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cTerrain),
                  gl.STATIC_DRAW);
    tVertexColorBuffer.itemSize = 3;
    tVertexColorBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges for debug purpose and will not be used in actual webpage
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
    
     
}

/**
 * Function to bind the buffer array corresponding to vertices of terrain to shader program and draw the terrain
 */
function drawTerrain(){
    gl.polygonOffset(0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                           gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);  
    
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           tVertexColorBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
    
    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

/**
 * Function to bind the buffer array corresponding to vertices of edges to shader program and draw the edges
 */
function drawTerrainEdges(){
    gl.polygonOffset(1,1);
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                           gl.FLOAT, false, 0, 0);

    // Bind normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
    // Bind color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           tVertexColorBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
    
    //Draw 
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
    gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

/**
 * Function to upload the matrix for model transformation to shader program
 */
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

/**
 * Function to upload the matrix for projection distortion to shader program
 */
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

/**
 * Function to upload the normal matrix for viewing transformation to shader program
 */
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

/**
 * Function to push a matrix into matrix stack for hierarchical modeling
 */
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


/**
 * Function to pop a matrix out of matrix stack for hierarchical modeling
 */
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

/**
 * Function to call other functions to upload related matrices
 */
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

/**
 * Function to translate degree into radian
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Function to create a WebGL context
 * @param {canvas} canvas object to create context from
 * @return {context} created context object
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
 * Function to read the shader script from html file and compile it
 * @param {string} id The id of content to be loaded from html file
 * @return {shader} the shader program, null otherwise
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
 * Function to generate a shader program and link relative variables with parameters in the shader program
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
    
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    shaderProgram.uniformAmbientMatColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientMatColor");  
  shaderProgram.uniformDiffuseMatColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseMatColor");
  shaderProgram.uniformSpecularMatColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularMatColor");
}


/**
 * Function to upload data of light source into shader program
 * @param {vec3} loc The location of the light source
 * @param {vec3} a The ambient color of the light
 * @param {vec3} d The diffuse color of the light
 * @param {vec3} s The specular color of the light
 */
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

/**
 * Function to upload lighting data of specific material into shader program
 * @param {vec3} a The ambient color of the material
 * @param {vec3} d The diffuse color of the material
 * @param {vec3} s The specular color of the material
 */
function uploadMaterialToShader(a,d,s) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
}

/**
 * Function to set up the buffers
 */
function setupBuffers() {
    setupTerrainBuffers();
}

/**
 * Function to draw the scene
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
 
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,0.0,0.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-90));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(0));     
    setMatrixUniforms();

    uploadLightsToShader([0,1,1],[1.0,1.0,1.0],[1.0,1.0,1.0],[1.0,1.0,1.0]);
    uploadMaterialToShader([0,0,0],[1.0, 0.5, 0.0],[0.1, 0.05,0.0]);
    drawTerrain();
/*
    uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
    uploadMaterialToShader([0,0,0],[0.0, 0.0, 0.0],[0.0, 0.0,0.0]);
    drawTerrainEdges();
  */  
    mvPopMatrix();
  
}

/**
 * Function to upload the eye position and eye's up vector and look at vector 
 * based on retational quaternion which will be set according to user input
 */
function animate() {
   vec3.transformQuat(viewDir, viewDir, rotationalQuaternion);
   vec3.transformQuat(up,up, rotationalQuaternion);
   vec3.add(eyePt, eyePt, vec3.mul(vec3.create(),viewDir, vec3.fromValues(0.001, 0.001, 0.001)));
}

/**
 * Function to start the process of setting up environment and drawing the scene frame by frame
 */
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

/**
 * Function which will be called on every frame to handle user input and to draw the scene
 */
function tick() {
    requestAnimFrame(tick);
    draw();
    handleKeys();
    animate();
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
    var newQuaternion = quat.create();
    rotationalQuaternion = quat.create();
    if (currentlyPressedKeys[33]) {
      // Page Up
      quat.setAxisAngle(newQuaternion, viewDir, degToRad(-1));
        quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
    }
    if (currentlyPressedKeys[34]) {
      // Page Down
      quat.setAxisAngle(newQuaternion, viewDir, degToRad(1));
        quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
    }
    if (currentlyPressedKeys[37]) {
      // Left cursor key
      quat.setAxisAngle(newQuaternion, up, degToRad(1));
        quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
    }
    if (currentlyPressedKeys[39]) {
      // Right cursor key
      quat.setAxisAngle(newQuaternion, up, degToRad(-1));
        quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
    }
    if (currentlyPressedKeys[38]) {
      // Up cursor key
      quat.setAxisAngle(newQuaternion, vec3.cross(vec3.create(),viewDir, up), degToRad(1));
        quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
    }
    if (currentlyPressedKeys[40]) {
      // Down cursor key
      quat.setAxisAngle(newQuaternion, vec3.cross(vec3.create(),viewDir, up), degToRad(-1));
        quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
    }
    //quat.mul(rotationalQuaternion, newQuaternion, rotationalQuaternion);
  }