var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

var previousTime=0;


//====== config ======
var enableSphereSphereCollision = true;
var initVelocityFactor = 10;
var initPositionFactor = 9;
var drag = 0.7;
var gravity = 10;

var cubeSize = 10;
var sphereRadius = 1;

//=====================

var objectPositions = [];
var objectVelocities = [];
var objectColor = [];

// Create a place to store sphere geometry
var sphereVertexPositionBuffer;

//Create a place to store normals for shading
var sphereVertexNormalBuffer;

// Create a place to store skybox geometry
var cubeVertexBuffer;

// Create a place to store the triangles
var cubeTriIndexBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,50.0);
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

//-------------------------------------------------------------------------
function setupSphereBuffers() {
    
    var sphereSoup=[];
    var sphereNormals=[];
    var numT=sphereFromSubdivision(6,sphereSoup,sphereNormals);
    console.log("Generated ", numT, " triangles"); 
    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereSoup), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = numT*3;
    console.log(sphereSoup.length/9);
    
    // Specify normals to be able to do lighting calculations
    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereNormals),
                  gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = numT*3;
    
    console.log("Normals ", sphereNormals.length/3);     
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

function drawObjects(){
    for(i=0; i < objectPositions.length; i++){
        var transformVec = vec3.create();
        // Set up material parameters    
        var ka = vec3.fromValues(0.0,0.0,0.0);
        var kd = objectColor[i];
        var ks = vec3.fromValues(0.4,0.4,0.0);
        mvPushMatrix();
        mat4.translate(mvMatrix, mvMatrix, objectPositions[i]);
        
        vec3.set(transformVec,sphereRadius,sphereRadius,sphereRadius);
        mat4.scale(mvMatrix, mvMatrix,transformVec);
              
        
        uploadMaterialToShader(ka,kd,ks, 1.0);
        setMatrixUniforms();
        drawSphere();
        mvPopMatrix();
    }
}

//-------------------------------------------------------------------------
function drawSphere(){
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           sphereVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
 gl.drawArrays(gl.TRIANGLES, 0, sphereVertexPositionBuffer.numItems);      
}

//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
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
  shaderProgram.uniformAlphaMatColorLoc = gl.getUniformLocation(shaderProgram, "uAlphaValue");
}


//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//-------------------------------------------------------------------------
function uploadMaterialToShader(a,d,s,c) {
  gl.uniform3fv(shaderProgram.uniformAmbientMatColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseMatColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularMatColorLoc, s);
  gl.uniform1f(shaderProgram.uniformAlphaMatColorLoc,c);
}


//----------------------------------------------------------------------------------
function setupBuffers() {
    setupCubeBuffers();
    setupSphereBuffers();     
}

//----------------------------------------------------------------------------------
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
 
    // Set up light parameters
    var Ia = vec3.fromValues(1.0,1.0,1.0);
    var Id = vec3.fromValues(1.0,1.0,1.0);
    var Is = vec3.fromValues(1.0,1.0,1.0);
    
    var lightPosEye4 = vec4.fromValues(0.0,0.0,100.0,1.0);
    lightPosEye4 = vec4.transformMat4(lightPosEye4,lightPosEye4,mvMatrix);
    //console.log(vec4.str(lightPosEye4))
    var lightPosEye = vec3.fromValues(lightPosEye4[0],lightPosEye4[1],lightPosEye4[2]);

    //draw opaque objects
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    uploadLightsToShader(lightPosEye,Ia,Id,Is);
    drawObjects();
    
    //draw cube (transparent)
    gl.depthMask(false);
    gl.enable(gl.BLEND); 
    
    // Set up material parameters    
    var ka = vec3.fromValues(0.0,0.0,0.0);
    var kd = vec3.fromValues(0.5,0.5,0.5);
    var ks = vec3.fromValues(0.0,0.0,0.0);
    mvPushMatrix();
    vec3.set(transformVec,cubeSize,cubeSize,cubeSize);
    mat4.scale(mvMatrix, mvMatrix,transformVec);
    uploadLightsToShader(lightPosEye,Ia,Id,Is);
    uploadMaterialToShader(ka,kd,ks, 0.1);
    setMatrixUniforms();
    drawCube();
    mvPopMatrix();
  
}

//----------------------------------------------------------------------------------
function animate() {
    //current time in second
    var currentTime = Date.now()/1000;
    var escapedTime = currentTime - previousTime;
    previousTime = currentTime;
    
    updateParticles(escapedTime);
    collision();
}

//----------------------------------------------------------------------------------
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  setupShaders();
  setupBuffers();
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  for(var i = 0; i < 10; i++)
    addSphere();

  previousTime = Date.now()/1000;
  tick();
}

//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    draw();
    animate();
}

//================================ physics components =========================

// Check collision at each frame (TODO: use prediction to reduce such that collision does not need to be checked at every frame)
function collision(){
    for(var i = 0; i < objectPositions.length; i++){
        //console.log(i);
        sphereWallCollision(i);
        if(enableSphereSphereCollision)
            sphereSphereCollision(i);
    }
}

function sphereWallCollision(index){
    var position = objectPositions[index];
    //console.log(position);
    for(var i = 0; i < 3; i++){
        if(Math.abs(position[i])+sphereRadius >= cubeSize){
            objectVelocities[index][i] *= -1;            
        }
    }   
}

// using O(n^2) way to check for sphere-sphere collision (TODO: use a more efficient way)
function sphereSphereCollision(index){
    var positionBuffer = vec3.create();
    var velocityBuffer = vec3.create();
    for(i = index+1; i < objectPositions.length; i++){
        var distance = vec3.distance(objectPositions[i],objectPositions[index]);
        if(distance <=2*sphereRadius){
            /*
            var positionA = objectPositions[i];
            var positionB = objectPositions[index];
            var velocityA = objectVelocities[i];
            var velocityB = objectVelocities[index];
            vec3.sub(velocityBuffer, velocityA, velocityB);
            vec3.sub(positionBuffer, positionA, positionB);
            vec3.normalize(positionBuffer, positionBuffer);
            var closingSpeed = -1 * vec3.dot(velocityBuffer, positionBuffer);
            vec3.scale(velocityA, positionBuffer, closingSpeed * drag);
            vec3.scale(velocityB, positionBuffer, -1 * closingSpeed * drag);
            vec3.add(objectVelocities[i], objectVelocities[i], velocityA);
            vec3.add(objectVelocities[index], objectVelocities[index], velocityB);
            */
            var velocity = objectVelocities[i];
            objectVelocities[i] = objectVelocities[index];
            objectVelocities[index] = velocity;
            vec3.scale(objectVelocities[i], objectVelocities[i], 1);
            vec3.scale(objectVelocities[index], objectVelocities[index], 1);
        }
    }
}


function updateParticles(escapedTime){
    for(var i = 0; i < objectPositions.length; i++){
        objectPositions[i][0] = objectPositions[i][0] + objectVelocities[i][0] * escapedTime;
        objectPositions[i][1] = objectPositions[i][1] + objectVelocities[i][1] * escapedTime;
        objectPositions[i][2] = objectPositions[i][2] + objectVelocities[i][2] * escapedTime;

        objectVelocities[i][0] = objectVelocities[i][0] * Math.pow(drag, escapedTime);
        
        // hack on net force calculation (TODO:real solution)
        if(objectPositions[i][1]-sphereRadius > -1 * cubeSize)
            objectVelocities[i][1] = objectVelocities[i][1] * Math.pow(drag, escapedTime) -gravity * escapedTime;
        else
            objectVelocities[i][1] = objectVelocities[i][1] * Math.pow(drag, escapedTime);
        objectVelocities[i][2] = objectVelocities[i][2] * Math.pow(drag, escapedTime);

        //console.log(objectVelocities[i]);
        //console.log(objectPositions[i]);
    }
}

function addSphere(){
    var position = vec3.fromValues(_normalizeRandom()*initPositionFactor,_normalizeRandom()*initPositionFactor,_normalizeRandom()*initPositionFactor);
    var velocity = vec3.fromValues(_normalizeRandom()*initVelocityFactor,_normalizeRandom()*initVelocityFactor,_normalizeRandom()*initVelocityFactor);
    var color = vec3.fromValues(Math.random(),Math.random(),Math.random());
    
    objectPositions.push(position);
    objectVelocities.push(velocity);
    objectColor.push(color);
    
    console.log(position);
    console.log(velocity);
}

function _normalizeRandom(){
    return (Math.random()*2-1);
}