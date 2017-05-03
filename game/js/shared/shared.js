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

if(onServer) module.exports.shared = shared;