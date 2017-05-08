/**
 * Created by Jerome on 08-05-17.
 */

// Class for the Server-side representation of players

var math = require('mathjs');
var gameServer = require('./gameserver.js').gameServer;
var shared = require('../shared/shared.js').shared;
var BlocksManager = require('../shared/BlocksManager.js').BlocksManager;
var MovementManager = require('../shared/MovementManager.js').MovementManager;

function Player(npc){
    var startingPosition = this.getStartingPosition();
    if(!npc) { // Ensure the player doesn't start on an occupied cell or surrounded by obstacles
        var cell = shared.computeCellCoordinates(startingPosition.x,startingPosition.y);
        BlocksManager.makeRoom(cell.x,cell.y);
    }
    this.id = gameServer.lastPlayerID++;
    this.x = startingPosition.x;
    this.y = startingPosition.y;
    if(npc) this.randomWalk();
}

Player.prototype.getStartingPosition = function(){
    return {
        x: math.randomInt(0,gameServer.worldWidth),
        y: math.randomInt(0,gameServer.worldHeight)
    };
};

// Goes to random coordinates and repeat after a random delay
Player.prototype.randomWalk = function(){
    var destination = this.getRandomCoordinates(200,200);
    MovementManager.movePlayer(this,destination.x,destination.y);
    var delay = math.randomInt(500,2500);
    setTimeout(this.randomWalk.bind(this),delay);
};

// Returns a pair of random coordinates restricted to the neighborhood of the player (defined by maxWidth and maxHeight)
Player.prototype.getRandomCoordinates = function(maxWidth,maxHeight){ // dimensions in the area in which to generate random coordinates
    return {
        x: this.x + Math.round(math.random(-1,1)*maxWidth),
        y: this.y + Math.round(math.random(-1,1)*maxHeight)
    };
};


// Returns a bare-bones object (a 'nutshell') for sending over the network, containing only the fields that may be needed for the clients
Player.prototype.getNutshell = function(){
    return {
        id: this.id,
        x: this.x,
        y: this.y
    }
};

module.exports.Player = Player;
