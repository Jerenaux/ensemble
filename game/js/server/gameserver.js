var io = require('../../../server.js').io;
var shared = require('../shared/shared.js').shared;

gameServer = {
    lastPlayerID : 0,
    worldWidth: 2250, //px
    worldHeight: 1200, //px
    spriteWidth: 32,//px
    spriteHeight: 32, //px
    cellWidth: 40, // dimensions in px of cells of the grid
    cellHeight: 40,
    nbTriangles: 5,
    triangles: []
};

gameServer.initialize = function(){
    BlocksManager.getBlocksFromDB();
    gameServer.generateTriangles();
    console.log('Initialized');
};

io.on('connection',function(socket){
    socket.on('newplayer',function(){
        socket.player = new Player(false); // Creates a new player object and stores it in the socket ; false = not an NPC
        socket.emit('init',gameServer.generateInitPacket(socket.player.id)); // send back an initialization packet
        socket.broadcast.emit('newplayer',{
            player: socket.player.getNutshell(),
            nbConnected: gameServer.getNbConnected()
        }); // notify the other players of the arrival of a new player

        socket.on('move',function(data){ // a player wished to move ; data.x and data.y are in px
            MovementManager.movePlayer(socket.player,data.x,data.y);
        });

        socket.on('block',function(){ // a player wishes to drop a block
            var cell = shared.computeCellCoordinates(socket.player.x,socket.player.y);
            BlocksManager.addBlock(cell.x,cell.y);
            // If there is no block on that cell after calling addBlock(), it means the drop was refused for some reason,
            // but since it was already executed on the client, it has to be reversed
            if(!BlocksManager.isBlockAt(cell.x,cell.y)) socket.emit('removeBlock',{x:cell.x,y:cell.y});
        });

        socket.on('disconnect',function(){
            io.emit('remove',{
                id:socket.player.id,
                nbConnected: gameServer.getNbConnected()
            });
        });
    });
});

gameServer.getAllPlayers = function(){ // Iterate over the connected clients to list the players
    var players = [];
    Object.keys(io.sockets.connected).forEach(function(socketID){
        var player = io.sockets.connected[socketID].player;
        if(player) players.push(player.getNutshell());
    });
    return players;
};

gameServer.getAllTriangles = function(){
  return gameServer.triangles.map(function(triangle){
      return triangle.getNutshell();
  });
};

gameServer.generateInitPacket = function(id){ // Generate an object with a few initialization parameters for the client
  return {
        worldWidth: gameServer.worldWidth,
        worldHeight: gameServer.worldHeight,
        cellWidth: gameServer.cellWidth,
        cellHeight: gameServer.cellHeight,
        players: gameServer.getAllPlayers(),
        triangles: gameServer.getAllTriangles(),
        blocks: BlocksManager.listBlocks(),
        ownID: id,
        nbConnected: gameServer.getNbConnected()
  };
};

gameServer.getNbConnected = function(){
    return Object.keys(io.sockets.connected).length;
};

gameServer.generateTriangles = function(){
    for(var i = 0; i < gameServer.nbTriangles; i++){
        gameServer.triangles.push(new Player(true)); //Triangles handled using the same class as Players at the moment ; true = NPC
    }
};

module.exports.gameServer = gameServer;

var Player = require('./Player.js').Player;
var BlocksManager = require('./../shared/BlocksManager.js').BlocksManager;
var MovementManager = require('./../shared/MovementManager.js').MovementManager;