/*
//================================ physics components =========================
var previousTime=0;

var escapedTime = 0;


//====== config ======
var enableSphereSphereCollision = true;
var initVelocityFactor = 10;
var drag = 0.7;
var gravity = 10;

var cubeSize = 10;
var sphereRadius = 1;

//=====================

var objectPositions = [];
var objectVelocities = [];
var objectColor = [];

// needs to be called at each frame and in initialization
function updateEscapedTime(){
    var currentTime = Date.now()/1000;
    var escapedTime = currentTime - previousTime;
    previousTime = currentTime;
}


// Check collision at each frame (TODO: use prediction to reduce such that collision does not need to be checked at every frame)
function collision(){
    for(i = 0; i < objectPositions.length; i++){
        sphereWallCollision(i);
        if(enableSphereSphereCollision)
            sphereSphereCollision(i);
    }
}

function sphereWallCollision(index){
    var position = objectPositions[index];
    for(i = 0; i < 3; i++){
        if(Math.abs(position[i])+sphereRadius >= cubeSize){
            objectVelocities[index][i] *= -1;            
        }
    }   
}

function sphereSphereCollision(index){
    
}


function updateParticles(escapedTime){
    for(i = 0; i < objectPositions.length; i++){
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

*/