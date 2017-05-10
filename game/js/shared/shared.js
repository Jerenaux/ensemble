/**
 * Created by Jerome on 03-05-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer){
    var fs = require('fs');
    var path = require('path');
}

var shared = {
    config : {} // stores parameters for the game
};

shared.readConfigFile = function(){
    if(!onServer) return;
    // Read config file
    var config = JSON.parse(fs.readFileSync(path.join(__dirname,'..','..','assets','json','config.json')).toString());
    Object.assign(shared.config,config);
    console.log('Config file read');
};

shared.computeCellCoordinates = function(x,y){ // return the coordinates of the cell corresponding of a pair of raw coordinates
    return {
        x: Math.floor(x/shared.config.cellWidth),
        y: Math.floor(y/shared.config.cellHeight)
    };
};

shared.isOutOfBounds = function(x,y) { // cell coordinates
    return (x < 0 || y < 0 || x > (shared.config.worldWidth/shared.config.cellWidth) || y > (shared.config.worldWidth/shared.config.cellHeight));
};

shared.sanitizeCoordinates = function(x,y){ // ensure that a pair of coordinates is not out of bounds ; coordinates in px
    return {
        x: shared.clamp(x,0,shared.config.worldWidth),
        y: shared.clamp(y,0,shared.config.worldHeight)
    };
};

shared.clamp = function(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
    return Math.max(min, Math.min(x, max));
};

if(onServer) module.exports.shared = shared;