/***************************TGIJ.js***************************************
* Created on: 7-24-2013
* Revised on: 7-24-2013
* Author: Juan Cortez
* 8x8 Bi-Color LED Matrix (http://www.adafruit.com/products/902)
* Input: None
* Output: Outputs the initials, T.G.I.J.
* Note: i2c-dev Library can be found in the following website: https://github.com/korevec/node-i2c
*******************************************************************************/ 
// Library used to configure i2c commands
var i2c = require('i2c');
var address = [0x70,0x71,0x72,0x73];  // Address of the 4 8x8 Matrices are found from 0x70-0x73
var wire = new i2c(address[0], {device: '/dev/i2c-1'}); // Points to the i2c address

// Global Variables used throughout program
var a=0;
var b=0;
var brightnessArray = [0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7]; // E0(dimmest), E7(brightest) 

/* Change the brightness level from 0(dimmest)-7(brightest)*/
var brightness = brightnessArray[7];                    // Brightness level from 0(dimmest)-7(brightest)
 
/* Main Program */
setup();                                                // Sets up all the 8x8 Matrices
var green = {};  
var red = [0x7E,0x7E,0x18,0x18,0x18,0x18,0x18,0x58];   
var wire = new i2c(address[0], {device: '/dev/i2c-1'}); // Points to the i2c address
writeLED();                                             // T. Initial
var green = [0x38,0x3C,0x26,0x06,0x76,0x66,0x3C,0xB0];  
var red = {};   
var wire = new i2c(address[1], {device: '/dev/i2c-1'}); // Points to the i2c address
writeLED();                                             // G. Initial
var green = {}; 
var red = [0x7E,0x7E,0x18,0x18,0x18,0x18,0x7E,0xFE];   
var wire = new i2c(address[2], {device: '/dev/i2c-1'}); // Points to the i2c address
writeLED();                                             // I. Initial
var green = [0x60,0x60,0x60,0x60,0x64,0x6C,0x7C,0xB8];  
var red = [0x60,0x60,0x60,0x60,0x64,0x6C,0x7C,0xB8];     
var wire = new i2c(address[3], {device: '/dev/i2c-1'}); // Points to the i2c address
writeLED();                                             // J. Initial 
 
//Setup and turn on the 8x8 Bi-Color LED Matrices
function setup(){    
 for(var i=0; i<4; i++){
    var wire = new i2c(address[i], {device: '/dev/i2c-1'}); // Points to the i2c address
    wire.writeBytes(0x21, 0x00);            // 8x8 Bi-Color LED Matrix Set-up
    wire.writeBytes(0x81, 0x00);            // Display on and no blinking
    wire.writeBytes(brightness, 0x00);      // Configures the brightness
   }
}

// Writes the data to the 8x8 Matrix
function writeLED(){
    wire.writeBytes(0x00, [green[a], red[b]], a++, b++);    // Row 1
    wire.writeBytes(0x02, [green[a], red[b]], a++, b++);    // Row 2
    wire.writeBytes(0x04, [green[a], red[b]], a++, b++);    // Row 3
    wire.writeBytes(0x06, [green[a], red[b]], a++, b++);    // Row 4
    wire.writeBytes(0x08, [green[a], red[b]], a++, b++);    // Row 5
    wire.writeBytes(0x0A, [green[a], red[b]], a++, b++);    // Row 6
    wire.writeBytes(0x0C, [green[a], red[b]], a++, b++);    // Row 7
    wire.writeBytes(0x0E, [green[a], red[b]], a++, b++);    // Row 8
    a=0;                                                    // Reset 'a' variable
    b=0;                                                    // Reset 'b' variable
}
