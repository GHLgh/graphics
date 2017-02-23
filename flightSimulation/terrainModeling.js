/**
 * @fileoverview Utilities for generating vertices and setting up buffer arrays for terrain, adopted from CS 418 HelloTerrain example
 * @author gluo2@illinois.com (Guanheng Luo)
 */ 

/**
 * Function to generate a terrain and feed various terrain data into corresponding array
 * @param {int} n The number of grids for the terrain
 * @param {int} minX The minimal x value of vertices in the terrain
 * @param {int} maxX The maximal x value of vertices in the terrain
 * @param {int} minY The minimal y value of vertices in the terrain
 * @param {int} maxY The maximal y value of vertices in the terrain
 * @param {Array} vertexArray The array to store position of each vertex in the terrain
 * @param {Array} colorArray The array to store color of each vertex in the terrain
 * @param {Array} faceArray The array to store index of vertices of each triangle in the terrain
 * @param {Array} normalArray The array to store normal of each vertex in the terrain
 */
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, colorArray, faceArray,normalArray)
{
    var deltaX=(maxX-minX)/n;
    var deltaY=(maxY-minY)/n;
    var heightArray = [];
    
    //initialize for diamondSqaureAlgorithm
    for(var i=0; i <= n; i++){
        heightArrayRow = [];
        for(var j=0; j <=n ;j++){
            heightArrayRow.push(-1);
        }
        heightArray.push(heightArrayRow);
    }
    //array, num of vertices, mid_x, mid_y
    heightArray[0][0] = 0.01;//Math.random();
    heightArray[n][n] = 0;//Math.random();
    heightArray[0][n] = 0.01;//Math.random();
    heightArray[n][0] = -0.01;//Math.random();
    diamondSquareAlgorithm(heightArray, n+1, Math.floor((n+1)/2), Math.floor((n+1)/2),0);
    
    for(var i=0;i<=n;i++)
       for(var j=0;j<=n;j++)
       {
           vertexArray.push(minX+deltaX*j);
           vertexArray.push(minY+deltaY*i);
           vertexArray.push(heightArray[j][i]-0.25); //factor out some stuff
           if(heightArray[j][i] < 0.0){
               colorArray.push(0.1);
               colorArray.push(0.6);
               colorArray.push(0.2);
           }
           else if(heightArray[j][i] >= 0.0 && heightArray[j][i] < 0.01){
               colorArray.push(0.6);
               colorArray.push(0.8);
               colorArray.push(0.1);
           }
           else if(heightArray[j][i] >= 0.01 && heightArray[j][i] < 0.03){
               colorArray.push(1.0);
               colorArray.push(0.5);
               colorArray.push(0.0);
           }
           else if(heightArray[j][i] >= 0.03){
               colorArray.push(1.0);
               colorArray.push(1.0);
               colorArray.push(1.0);
           }
           
           normalArray.push(0);
           normalArray.push(0);
           normalArray.push(0);
       }

    var numT=0;
    for(var i=0;i<n;i++)
       for(var j=0;j<n;j++)
       {
           var vid = i*(n+1) + j;
           faceArray.push(vid);
           faceArray.push(vid+1);
           faceArray.push(vid+n+1);
           
           normalCalculator(normalArray, vertexArray, vid, vid+1, vid+n+1);
           
           faceArray.push(vid+1);
           faceArray.push(vid+1+n+1);
           faceArray.push(vid+n+1);
           
           normalCalculator(normalArray, vertexArray, vid+1, vid+1+n+1, vid+n+1);
           
           numT+=2;
       }
    
    normalizeNormal(normalArray);
    
    return numT;
}

/**
 * Helper function to normalize each normal in normal array
 * @param {Array} normalArray The array storing the normal of each vertex in the terrain
 */
function normalizeNormal(normalArray){
    for(var i = 0; i < normalArray.length; i += 3){
        var normalized = vec3.fromValues(normalArray[i],normalArray[i+1],normalArray[i]+2);
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

/**
 * Function will be called recurrsively to generate the height of vertices in the terrain based on diamond-square algorithm
 * @param {Array} heightArray The array to store height information of each vertex in the terrain
 * @param {int} numOfVertices The number of vertice involved in current iteration
 * @param {int} midX The x index of the middle point in current iteration
 * @param {int} midY The y index of the middle point in current iteration
 * @param {int} numOfIteration The number of iteration
 */
function diamondSquareAlgorithm(heightArray, numOfVertices, midX, midY, numOfIteration){
    var halfOfVertices = Math.floor(numOfVertices/2);
    //console.log(numOfVertices);
    var avgHeight = (heightArray[midX-halfOfVertices][midY-halfOfVertices] 
                                   + heightArray[midX-halfOfVertices][midY+halfOfVertices] 
                                   + heightArray[midX+halfOfVertices][midY-halfOfVertices]
                                   + heightArray[midX+halfOfVertices][midY+halfOfVertices])/4.0;
    
        
    if(numOfVertices <= 1){
        heightArray[midX][midY] = avgHeight + cRandom(numOfIteration);
        return;
    }
    else{
        heightArray[midX][midY] = avgHeight + cRandom(numOfIteration);
        heightArray[midX][midY+halfOfVertices] = avgHeight + cRandom(numOfIteration);
        heightArray[midX][midY-halfOfVertices] = avgHeight + cRandom(numOfIteration);
        heightArray[midX-halfOfVertices][midY] = avgHeight + cRandom(numOfIteration);
        heightArray[midX+halfOfVertices][midY] = avgHeight + cRandom(numOfIteration);
        var nextNumOfVertices = Math.floor((numOfVertices)/2);
        if(nextNumOfVertices != 1)
            nextNumOfVertices += 1;
        diamondSquareAlgorithm(heightArray, nextNumOfVertices, midX - Math.floor(nextNumOfVertices/2), midY - Math.floor(nextNumOfVertices/2),numOfIteration+1);
        diamondSquareAlgorithm(heightArray, nextNumOfVertices, midX - Math.floor(nextNumOfVertices/2), midY + Math.floor(nextNumOfVertices/2),numOfIteration+1);
        diamondSquareAlgorithm(heightArray, nextNumOfVertices, midX + Math.floor(nextNumOfVertices/2), midY - Math.floor(nextNumOfVertices/2),numOfIteration+1);
        diamondSquareAlgorithm(heightArray, nextNumOfVertices, midX + Math.floor(nextNumOfVertices/2), midY + Math.floor(nextNumOfVertices/2),numOfIteration+1);
    }
}

/**
 * Helper function to calculate the height of a vectex based on adjacent vertices in a diamond shape
 * @param {Array} heightArray The array to store height information of each vertex in the terrain
 * @param {int} midX The x index of the vertex to be calculated
 * @param {int} midY The y index of the vertex to be calculated
 * @param {int} distance The distance in index that the adjacent vertices of the vertex to be calculated
 */
function calculateDiamondHeight(heightArray, midX, midY, distance){
    totalHeight = 0;
    count = 0.0;
    if(midX-distance >= 0){
        totalHeight += heightArray[midX-distance][midY];
        count += 1.0;
    }
    if(midX+distance < heightArray.length){
        totalHeight += heightArray[midX+distance][midY];
        count += 1.0;
    }
    if(midY-distance >= 0){
        totalHeight += heightArray[midX][midY-distance];
        count += 1.0;
    }
    if(midY+distance < heightArray[0].length){
        totalHeight += heightArray[midX][midY+distance];
        count += 1.0;
    }
    return totalHeight/count;
}

/**
 * Helper function to generating a random number
 * @param {int} factor The value to influence the magnitude of the random number
 * @return {int} The random number generated
 */
function cRandom(factor){
    if(Math.random() > 0.45)
        return -1 * Math.random() * 0.1 / Math.pow(2, factor);
    else
        return Math.random() * 0.15 / Math.pow(2, factor);
}

/**
 * Function to generate lines from triangles in the terrain and feed into line array
 * @param {Array} faceArray The array storing index of vertices for each triangle in the terrain
 * @param {Array} lineArray The array to store the index of vertices to generate a line
 */
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//-------------------------------------------------------------------------

