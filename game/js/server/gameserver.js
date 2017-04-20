var io = require('../../../server.js').io;
//var server = require('../../server.js').server;

gameServer = {
    lastPlayerID : 0,
    worldWidth: 2250, //px
    worldHeight: 1200, //px
    spriteWidth: 32,//px
    spriteHeight: 32 //px
};

io.on('connection',function(socket){
    socket.on('newplayer',function(){
        socket.player = gameServer.generatePlayer(); // Creates a new player object and stores it in the socket
        socket.emit('init',gameServer.generateInitPacket(socket.player.id)); // send back an initialization packet
        socket.broadcast.emit('newplayer',socket.player); // notify the other players of the arrival of a new player

        socket.on('click',function(data){ // Update player position based on click information
            var coordinates = gameServer.sanitizeCoordinates(data.x,data.y);
            socket.player.x = coordinates.x;
            socket.player.y = coordinates.y;
            io.emit('move',socket.player); // notify everybody of the change in coordinates
        });

        socket.on('disconnect',function(){
            io.emit('remove',socket.player.id);
        });
    });
});

gameServer.getAllPlayers = function(){ // Iterate over the connected clients to list the players
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player);
    });
    return players;
};

gameServer.generatePlayer = function(){ // Create a new player object
    return {
        id: gameServer.lastPlayerID++,
        x: gameServer.randomInt(gameServer.spriteWidth/2,gameServer.worldWidth-gameServer.spriteWidth),
        y: gameServer.randomInt(gameServer.spriteHeight/2,gameServer.worldHeight-gameServer.spriteHeight)
    };
};

gameServer.generateInitPacket = function(id){ // Generate an object with a few initialization parameters for the client
  return {
        worldWidth: gameServer.worldWidth,
        worldHeight: gameServer.worldHeight,
        players: gameServer.getAllPlayers(),
        ownID: id
  };
};

gameServer.randomInt = function(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
};

gameServer.clamp = function(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
  return Math.max(min, Math.min(x, max));
};

gameServer.sanitizeCoordinates = function(x,y){ // ensure that a pair of coordinates is not out of bounds
    return {
        x: gameServer.clamp(x,gameServer.spriteWidth/2,gameServer.worldWidth-gameServer.spriteWidth),
        y: gameServer.clamp(y,gameServer.spriteHeight/2,gameServer.worldHeight-gameServer.spriteHeight)
    };
};