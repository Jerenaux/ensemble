/**
 * Created by Jerome on 10-04-17.
 */

var Client = {};
Client.socket = io.connect();

// Sending stuff to server

Client.start = function(){
    Client.socket.emit('newplayer'); // notify the server of the arrival of a new player
};

Client.sendClick = function(x,y){
  Client.socket.emit('click',{x:x,y:y}); // notify the server of a click
};

Client.sendBlock = function(x,y){
    Client.socket.emit('block',{x:x,y:y}); // notify the server of a new block
};

// Getting stuff from server

Client.socket.on('newplayer',function(data){ // the client is notified of the arrival of a new player
    Game.addNewPlayer(data.id,data.x,data.y);
});

Client.socket.on('init',function(data){ // the client receives the data to initialize the game
    Game.initializeGame(data.ownID,data.worldWidth,data.worldHeight,data.cellWidth,data.cellHeight,data.players,data.blocks);
});

Client.socket.on('move',function(data){ // the client is notified of another player moving
    Game.movePlayer(data.id,data.x,data.y);
});

Client.socket.on('block',function(data){ // the client is notified of a new block
    Game.addBlock(data.x,data.y);
});

Client.socket.on('remove',function(id){ // the client is  notified that a player has left
    Game.removePlayer(id);
});