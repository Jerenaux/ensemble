/**
 * Created by Jerome on 03-05-17.
 */

var onServer = (typeof window === 'undefined');

var shared = {};

shared.computeCellCoordinates = function(x,y){ // return the coordinates of the cell corresponding of a pair of raw coordinates
    var cellWidth = (onServer ? gameServer.cellWidth : Game.cellWidth);
    var cellHeight = (onServer ? gameServer.cellHeight : Game.cellHeight);
    return {
        x: Math.floor(x/cellWidth),
        y: Math.floor(y/cellHeight)
    };
};

shared.sanitizeCoordinates = function(x,y){ // ensure that a pair of coordinates is not out of bounds ; coordinates in px
    var worldWidth = (onServer ? gameServer.worldWidth : game.world.width);
    var worldHeight = (onServer ? gameServer.worldHeight : game.world.height);
    return {
        x: shared.clamp(x,0,worldWidth),
        y: shared.clamp(y,0,worldHeight)
    };
};

shared.clamp = function(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
    return Math.max(min, Math.min(x, max));
};

if(onServer) module.exports.shared = shared;