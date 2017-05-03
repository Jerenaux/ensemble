/**
 * Created by Jerome on 03-05-17.
 */

var onServer = (typeof window === 'undefined');

function computeCellCoordinates(x,y){ // return the coordinates of the cell corresponding of a pair of raw coordinates
    return {
        x: Math.floor(x/Game.cellWidth),
        y: Math.floor(y/Game.cellHeight)
    };
}

if(onServer) module.exports.computeCellCoordinates = computeCellCoordinates;