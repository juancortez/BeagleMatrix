/***************************BeagleMatrix.js***************************************
* Created on: 7-11-2013
* Revised on: 7-25-2013
* Author: Juan Cortez
* 8x8 Bi-Color LED Matrix (http://www.adafruit.com/products/902)
* Analog 2-axis thumb joystick(http://www.adafruit.com/products/512)
* Input: Analog Thumb Joystick
* Output: Outputs values to the 8x8 Bi-Color LED Matrix
* This program features a game where you can move a cursor on 4 8x8 matrices with the main objective
* of acquiring points and at the same time, avoiding the red dots or exceeding the bounds of the game.
* Every time you acquire a point, you will gain 10 points and the cursor will move faster.
* Note: i2c-dev Library can be found in the following website: https://github.com/korevec/node-i2c
*******************************************************************************/ 
// Libraries used to configure i2c commands and analogRead
var i2c = require('i2c');
var address = [0x70,0x71,0x72,0x73]; // Addresses of the 8x8 Bi-Color Matrices
var b = require('bonescript');
var highScore = '/media/BEAGLEBONE/highscore.txt';
//b.writeTextFile(highScore, 0);                     // Create the text file (ONLY RUN THIS ONCE) 

// Global Variables used throughout program
var posx=0;
var posy=0;
var enemyX = new Array(8); 
var enemyY= new Array(8);
var quadrantLocation =0;
var empty={};
var time=330;
var enemies = 8;
var pointX=0;
var pointY=0;
var points=0;
var location=0;

//Clears the LED Matrix, spawns enemies, points, cursor, and begins game
for(var i=0; i<address.length; i++){
var wire = new i2c(address[i], {device: '/dev/i2c-1'}); // Points to the i2c address
setup();
clearLED();
spawnEnemies();
}
var wire = new i2c(address[0], {device: '/dev/i2c-1'}); // Points to the i2c address
spawnCursor();
location = spawnPoints();
var timing = setInterval(gameStart, time);   // Updates the (x,y) coordinates every 'time' amount of milliseconds 

//Setup and turn on all four 8x8 Bi-Color LED Matrix
function setup(){
wire.writeBytes(0x21, 0x00); // 8x8 Bi-Color LED Matrix Set-up
wire.writeBytes(0x81, 0x00); // Display on and no blinking
wire.writeBytes(0xE7, 0x00); // Configures the brightness
} 

//Checks the (x,y) coordinates every 'time' amount of milliseconds
function gameStart(){
var posx=checkX();
var posy=checkY();
wire = checkBounds();
checkEnemy();
checkPoints();
} 

// Returns a random number from 0-3
function randomI2C(){
 var random = Math.floor((Math.random()*4));
 return random;
} 
 
/*********************************************************
* Functions used to check the (x,y) coordinates of the   *
* cursor and move the cursor along the (x,y) axis.       *
*********************************************************/
/*Checks the x coordinates and updates the LED Matrix
If the analog value is >0.9 it moves right, if its <0.1 it moves left */
function checkX() {
var xCoord;
xCoord=b.analogRead('P9_36');
    if(xCoord > 0.95){
       if(posy === pointY && wire.address === location){
           wire.writeBytes(posy*2, [0]); 
           posx+=1;
           wire.writeBytes(posy*2, [Math.pow(2,posx)+Math.pow(2,pointX)]);
       }
       else{
         posx+=1;
         wire.writeBytes(posy*2, [Math.pow(2,posx)]); 
       }
    }
    if(xCoord < 0.05){
         if(posy === pointY && wire.address === location){
             wire.writeBytes(posy*2, [0]); 
             posx -=1;
             wire.writeBytes(posy*2, [Math.pow(2,posx)+Math.pow(2,pointX)]);
         }
         else{
         posx -=1;
         wire.writeBytes(posy*2, [Math.pow(2,posx)]);
         }
    }
    return posx;
}    

/*Checks the y coordinates and updates the LED Matrix
If the analog value is <0.1 it moves down, if its >0.9 it moves up. */
function checkY() {
var yCoord;
yCoord = b.analogRead('P9_38');
 if(yCoord<0.05){
     clearY(); // Delete trailing cursor
     posy+=1;
     final = fix();
     wire.writeBytes(posy*2, [Math.pow(2,posx)+final]); // Updates cursor
 }
 if(yCoord>0.95){ 
    clearY(); // Delete trailing cursor
     posy-=1;
     var final = fix();
     wire.writeBytes(posy*2, [Math.pow(2,posx)+final]); // Updates cursor
 }
return posy;
}   

// Function used to clear the old cursor
function clearY(){
    var buf = wire.readBytes(posy*2,2);
    var cursor = Math.pow(2,posx);
    if(buf[0] === cursor){
        wire.writeBytes(posy*2, [0]); 
    }
    else{
        wire.writeBytes(posy*2, [buf[0]-cursor]);
    }
} 

// Isolates "point bits" 
function fix(){
    var result=0;
    var buf = wire.readBytes(posy*2,2);
    var position = Math.pow(2,posx);
    if(buf[0] === position){
     return 0;   
    }
    result = position ^ (buf[0]+position);
    return result;
}

/*************************************************************
* Functions used to check for enemy blocks, and point values *
*************************************************************/ 
// Checks to see if cursor hit a red block
function checkEnemy(){
    var red = wire.readBytes((posy*2)+1,2);
    var green = wire.readBytes(posy*2,2);
    if(red[0] === green[0]){
        b.readTextFile(highScore,printScore);  
   }
} 

// Checks to see if cursor hit a point value
function checkPoints(){
    if(posx === pointX && posy === pointY && wire.address === location){
        points += 10;
        console.log(points + " points.");
        spawnEnemies();
        spawnPoints();
        wire.writeBytes(posy*2, [Math.pow(2,posx)]);
        clearInterval(timing);
        time = time-10;
        timing = setInterval(gameStart, time);
    } 
} 

/**************************************************************************
Checks the bounds of the game and moves cursor from quadrant to quadrant. 
                      ----------------
                     |   Q0  |  Q1    |
                     | - - - | - - -  |
                     |   Q2  |  Q3    |
                       ----------------   
*************************************************************************/
function checkBounds(){
    if(posx >7 && wire.address === 112){
         wire = new i2c(address[1], {device: '/dev/i2c-1'}); // Q0 to Q1 
         posx=0;
         checkQuadrant(wire);
    }
    if(posx > 7 && wire.address === 114){
        wire = new i2c(address[3], {device: '/dev/i2c-1'}); // Q2 to Q3
        posx=0;
        checkQuadrant(wire);
    }
    if(posx <0 && wire.address === 113){
        wire = new i2c(address[0], {device: '/dev/i2c-1'}); // Q1 to Q0
        posx=7;
        checkQuadrant(wire);
    }
     if(posx <0 && wire.address === 115){
        wire = new i2c(address[2], {device: '/dev/i2c-1'}); // Q3 to Q2
        posx=7;
        checkQuadrant(wire);
    }
    if(posy>7 && wire.address === 112){
        wire = new i2c(address[2], {device: '/dev/i2c-1'}); // Q0 to Q2
        posy=0;
        checkQuadrant(wire);
    }
    if(posy>7 && wire.address === 113){
        wire = new i2c(address[3], {device: '/dev/i2c-1'}); // Q1 to Q3
        posy=0;
        checkQuadrant(wire);
    }
    if(posy<0 && wire.address === 114){
        wire = new i2c(address[0], {device: '/dev/i2c-1'}); // Q2 to Q0  
        posy=7;
        checkQuadrant(wire);
    }
    if(posy<0 && wire.address === 115){
        wire = new i2c(address[1], {device: '/dev/i2c-1'}); // Q3 to Q1 
        posy=7;
        checkQuadrant(wire);
    }
    if(posx <0 && wire.address === 112 || posy <0 && wire.address===112){
        b.readTextFile(highScore,printScore);
    }
    if(posx >7 && wire.address === 113 || posy <0 && wire.address===113){
        b.readTextFile(highScore,printScore);
    }
    if(posx <0 && wire.address === 114 || posy >7 && wire.address===114){
        b.readTextFile(highScore,printScore);
    }
    if(posx >7 && wire.address === 115 || posy >7 && wire.address===115){
        b.readTextFile(highScore,printScore);
    }
    return wire;   
} 

// Checks which quadrant the cursor and points are in
function checkQuadrant(){
    if(posy === pointY && wire.address === location){
         wire.writeBytes(posy*2, [Math.pow(2,posx)+Math.pow(2,pointX)]);
       }
       else{
           wire.writeBytes(posy*2, [Math.pow(2,posx)]);
           }
}
/********************************************************
* Functions used to clear LED Matrix,                   *
* spawn points, red blocks, and playing cursor.         *
********************************************************/ 
// Clears the LED Matrix
function clearLED(){
 for(var i=0; i<16; i+=2){
wire.writeBytes(i, [empty, empty]);  
    }   
}

// Randomly spawns a point value on the 8x8 Matrix
function spawnPoints(){
pointX=Math.floor((Math.random()*7)+1);
pointY=Math.floor((Math.random()*7)+1);
quadrantLocation = Math.floor((Math.random()*4)+1);
quadrantLocation = quadrantLocation % 4; 
var wire = new i2c(address[quadrantLocation], {device: '/dev/i2c-1'}); // Points to the i2c address
var red = wire.readBytes((pointY*2)+1,2);
var temp = Math.pow(2,pointX);
 if(red[0] === temp){
  spawnPoints();   
 }
var wire = new i2c(address[quadrantLocation], {device: '/dev/i2c-1'}); // Points to the i2c address
wire.writeBytes(pointY*2, [Math.pow(2,pointX)]);
location = wire.address;
return location;
} 

// Randomly spawns 8 red blocks on the 8x8 matrix
function spawnEnemies(){
    for(var i=0;i<enemies;i++){
enemyX=Math.floor((Math.random()*7)+1);
enemyY=i;
   
 if(enemyX == posx && enemyY == posy){
 spawnEnemies();   
}
wire.writeBytes((enemyY*2)+1, [Math.pow(2,enemyX)]);
    }
}
    
// Randomly spawns cursor on the playing field
function spawnCursor(){
posy=Math.floor((Math.random()*6)+1);
wire.writeBytes(posy*2, [Math.pow(2,posx)]); 
} 

/**********************************************************
* Calculates the final score and determines whether or not*
* the user has exceeded the All-Time high score.          *
**********************************************************/ 
// Prints the score and checks to see what the all time high score is
function printScore(x){
 var score=0;
 score = x.data;
  console.log("\n********Game Over********");
 console.log("All-Time High Score: " + score);
 console.log("Tommy, Your Current Score: " + points);
 if (points > score){
  console.log("Tommy! You have the new all time score with " + points + " points!"); 
  b.writeTextFile(highScore, points);
  console.log("\n*************************");
     process.exit(1);
 }
 console.log("\n*************************");
   process.exit(1); 
}
