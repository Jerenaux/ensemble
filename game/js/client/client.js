/**
 * Created by Jerome on 10-04-17.
 */

var Client = {
    movementHistory: [] // keep track of the 'move' events sent to the server
};
Client.socket = io.connect();

// Sending stuff to server

Client.start = function(){
    Client.socket.emit('newplayer'); // notify the server of the arrival of a new player
};

Client.sendMovement = function(x,y){
    var data = {x:x,y:y};
    Client.movementHistory.push({x:x,y:y});
    if(Client.movementHistory.length > 10) Client.movementHistory.shift(); // Keep only the last 10 records
    Client.socket.emit('move',data); // notify the server of a movement
};

Client.sendBlock = function(){
    Client.socket.emit('block'); // notify the server of a new block
};

// Getting stuff from server

Client.socket.on('newplayer',function(data){ // the client is notified of the arrival of a new player
    Game.addNewPlayer(data.player.id,data.player.x,data.player.y);
    Game.updateNbConnected(data.nbConnected);
});

Client.socket.on('init',function(data){ // the client receives the data to initialize the game
    Game.initializeGame(data.ownID,data.worldWidth,data.worldHeight,data.cellWidth,data.cellHeight,data.players,data.blocks);
    Game.updateNbConnected(data.nbConnected);
});

Client.socket.on('move',function(data){ // the client is notified of another player moving
    Game.movePlayer(data.id,data.x,data.y);
});

Client.socket.on('block',function(data){ // the client is notified of a new block
    BlocksManager.addBlock(data.x,data.y);
});

Client.socket.on('removeBlock',function(data){ // the client is notified of a block being removed
    BlocksManager.removeBlock(data.x,data.y);
});

Client.socket.on('remove',function(data){ // the client is  notified that a player has left
    Game.removePlayer(data.id);
    Game.updateNbConnected(data.nbConnected);
});