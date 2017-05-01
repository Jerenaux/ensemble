var io = require('../../../server.js').io;
var BlocksManager = require('./BlocksManager.js').BlocksManager;
var math = require('mathjs');

gameServer = {
    lastPlayerID : 0,
    worldWidth: 2250, //px
    worldHeight: 1200, //px
    spriteWidth: 32,//px
    spriteHeight: 32, //px
    cellWidth: 40, // dimensions in px of cells of the grid
    cellHeight: 40
};

gameServer.initialize = function(){
    BlocksManager.getBlocksFromDB();
    console.log('Initialized');
};

io.on('connection',function(socket){
    socket.on('newplayer',function(){
        socket.player = gameServer.generatePlayer(); // Creates a new player object and stores it in the socket
        socket.emit('init',gameServer.generateInitPacket(socket.player.id)); // send back an initialization packet
        socket.broadcast.emit('newplayer',{
            player: socket.player,
            nbConnected: gameServer.getNbConnected()
        }); // notify the other players of the arrival of a new player

        socket.on('click',function(data){ // a player wished to move ; data.x and data.y are in px
            // Update player position and if it's ok, notify everybody of the change in coordinates
            if(gameServer.movePlayer(socket.player,data.x,data.y)) io.emit('move',socket.player);
        });

        socket.on('block',function(){ // a player wishes to drop a block
            var cell = gameServer.computeCellCoordinates(socket.player.x,socket.player.y);
            BlocksManager.addBlock(cell.x,cell.y);
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
        if(player) players.push(player);
    });
    return players;
};

gameServer.generatePlayer = function(){ // Create a new player object
    var startingPosition = gameServer.getStartingPosition();
    //gameServer.makeRoom(startingPosition); // Ensure the player doesn't start on an occupied cell or surrounded by obstacles
    return {
        id: gameServer.lastPlayerID++,
        x: startingPosition.x,
        y: startingPosition.y
    };
};

gameServer.getStartingPosition = function(){
    return {
        x: math.randomInt(gameServer.spriteWidth/2,gameServer.worldWidth-gameServer.spriteWidth),
        y: math.randomInt(gameServer.spriteHeight/2,gameServer.worldHeight-gameServer.spriteHeight)
    };
};

gameServer.generateInitPacket = function(id){ // Generate an object with a few initialization parameters for the client
  return {
        worldWidth: gameServer.worldWidth,
        worldHeight: gameServer.worldHeight,
        cellWidth: gameServer.cellWidth,
        cellHeight: gameServer.cellHeight,
        players: gameServer.getAllPlayers(),
        blocks: BlocksManager.listBlocks(),
        ownID: id,
        nbConnected: gameServer.getNbConnected()
  };
};

gameServer.movePlayer = function(player,x,y){ // returns true for success
    // Coordinates are in px
    var coordinates = gameServer.sanitizeCoordinates(x,y);
    var endPosition = gameServer.checkObstacles(player.x,player.y,coordinates.x,coordinates.y); // check for obstacles on the path
    player.x = endPosition.x;
    player.y = endPosition.y;
    return true;
};

gameServer.sanitizeCoordinates = function(x,y){ // ensure that a pair of coordinates is not out of bounds ; coordinates in px
    return {
        x: gameServer.clamp(x,gameServer.spriteWidth/2,gameServer.worldWidth-gameServer.spriteWidth),
        y: gameServer.clamp(y,gameServer.spriteHeight/2,gameServer.worldHeight-gameServer.spriteHeight)
    };
};

gameServer.checkObstacles = function(startx,starty,endx,endy){ // coordinates in px
    // Coarse algorithm to check if an obstacle is on the trajectory (straight line from start to end coordinates).
    // It does so by splitting the path in chunks of 20 pixels, and check if the corresponding cell has a block or not.
    // If yes, returns the end coordinates in case of "hitting" the obstacle; if no, return the intended end coordinates.
    var chunkLength = 20; // The smaller, the more precise the algorithm, but 20 seems to do a good job (for a cell size of 40)
    var startCell = gameServer.computeCellCoordinates(startx,starty);
    var angle = gameServer.computeAngle(startx,starty,endx,endy); // angle in radians
    var speedX = Math.cos(angle);
    var speedY = -Math.sin(angle);
    var dist = gameServer.euclideanDistance(startx,starty,endx,endy);
    // Split the path in chunks
    var nbChunks = Math.round(dist/chunkLength);
    var tmpx = startx;
    var tmpy = starty;
    for(var i = 0; i < nbChunks; i++){
        tmpx += speedX*chunkLength;
        tmpy += speedY*chunkLength;
        var cell = gameServer.computeCellCoordinates(tmpx,tmpy);
        if(cell.x == startCell.x && cell.y == startCell.y) continue; // ignore obstacles on starting cell
        if(BlocksManager.isBlockAt(cell.x,cell.y)) { // If obstacle, step back and return
            return {
                x: tmpx - speedX*chunkLength,
                y: tmpy - speedY*chunkLength
            }
        }
    }
    // No obstacle found, return intended end coordinates
    return {
        x: endx,
        y: endy
    }
};

gameServer.computeAngle = function(x1,y1,x2,y2){ // return angle between points, in radians
    return -(math.atan2(y2-y1, x2-x1));//*(180/Math.PI));
};

gameServer.euclideanDistance = function(x1,y1,x2,y2){
    return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
};

gameServer.clamp = function(x,min,max){ // restricts a value to a given interval (return the value unchanged if within the interval
    return Math.max(min, Math.min(x, max));
};

gameServer.computeCellCoordinates = function(x,y){ // return the coordinates of the cell corresponding of a pair of raw coordinates
    return {
        x: Math.floor(x/gameServer.cellWidth),
        y: Math.floor(y/gameServer.cellHeight)
    };
};

gameServer.getNbConnected = function(){
    return Object.keys(io.sockets.connected).length;
};

module.exports.gameServer = gameServer;