/**
 * Created by Jerome on 08-05-17.
 */

// Class for the Server-side representation of players

var math = require('mathjs');
var gameServer = require('./gameserver.js').gameServer;
var shared = require('../shared/shared.js').shared;
var BlocksManager = require('../shared/BlocksManager.js').BlocksManager;

function Player(npc){
    var startingPosition = this.getStartingPosition();
    if(!npc) { // Ensure the player doesn't start on an occupied cell or surrounded by obstacles
        var cell = shared.computeCellCoordinates(startingPosition.x,startingPosition.y);
        BlocksManager.makeRoom(cell.x,cell.y);
    }
    this.id = gameServer.lastPlayerID++;
    this.x = startingPosition.x;
    this.y = startingPosition.y;
}

Player.prototype.getStartingPosition = function(){
    return {
        x: math.randomInt(0,shared.config.worldWidth),
        y: math.randomInt(0,shared.config.worldHeight)
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
