/**
 * Created by Jerome on 01-05-17.
 */

var onServer = (typeof window === 'undefined');

if(onServer) {
    var server = require('../../../server.js').server;
    var io = require('../../../server.js').io; // socket.io object
    var SpaceMap = require('./SpaceMap.js').SpaceMap;
}

// Object responsible for managing the addition and removal of blocks, and keeping the clients and database up to date
BlocksManager = {
    blocks: new SpaceMap() // spaceMap storing the block object located at given coordinates, e.g. blockObject = blocks[x][y]; (the block object is a Block() on the client, an empty object {} on the server)
};

BlocksManager.getBlocksFromDB = function(){
    if(!onServer) return;
    server.db.collection('blocks').find({}).toArray(function(err,blocks){
        if(err) throw err;
        BlocksManager.blocks.fromList(blocks);
        console.log('blocks loaded');
    });
};

BlocksManager.listBlocks = function(){ // returns a list of all the blocks
    return BlocksManager.blocks.toList();
};

// Adds a new block to the BlocksManager's spaceMap and if needed, to the database and broadcast to clients
BlocksManager.addBlock = function(x,y){ // return true for success, false otherwise ; coordinates in cells, not px
    if(BlocksManager.isBlockAt(x,y)) return; // cannot put a block if there is one already
    var block = {};
    if(onServer) {
        BlocksManager.insertBlockIntoDB(x, y);
        BlocksManager.emitBlock(x, y);
    }else{
        block = Game.blocksGroup.add(new Block(x*Game.cellWidth,y*Game.cellHeight));
    }
    BlocksManager.insertBlockIntoSpaceMap(x,y,block);
};

// check if a block can be dropped at this position, and if yes inform the server
BlocksManager.dropBlock = function(){
    if(!Game.allowAction) return;
    // compute the coordinates of the current cell
    var cell = computeCellCoordinates(Game.ownSprite.x,Game.ownSprite.y);
    if(BlocksManager.isBlockAt(cell.x,cell.y)) return; // don't drop a block if there is one already
    Client.sendBlock();
};

BlocksManager.removeBlock = function(x,y){
    if(!BlocksManager.isBlockAt(x,y)) return;
    if(onServer) {
        BlocksManager.removeBlockFromDB(x, y);
        BlocksManager.emitRemoval(x, y);
    }else{
        var block = Game.blocks.get(x,y);
        if(block) block.destroy();
    }
    BlocksManager.removeBlockFromSpaceMap(x,y);
};

BlocksManager.makeRoom = function(x,y){ // Remove all blocks around a given position
    // Free the starting cell
    BlocksManager.removeBlock(x,y);
    // Iterate over all adjacent cells
    var adj = [[-1,0],[0,-1],[1,0],[1,0],[0,1],[0,1],[-1,0],[-1,0]];
    for(var c = 0; c < adj.length; c++) {
        x += adj[c][0];
        y += adj[c][1];
        BlocksManager.removeBlock(x,y);
    }
};

BlocksManager.insertBlockIntoSpaceMap = function(x,y,block){
    BlocksManager.blocks.add(x,y,block);
};

BlocksManager.removeBlockFromSpaceMap = function(x,y){
    BlocksManager.blocks.delete(x,y);
};

BlocksManager.insertBlockIntoDB = function(x,y){
    if(!onServer) return;
    var blockDoc = {
        x: x,
        y: y,
        value: BlocksManager.blockValue //  x,y,value format used by SpaceMap to (de)serialize to/from lists
    };
    server.db.collection('blocks').insertOne(blockDoc,function(err){if(err) throw err;});
};

BlocksManager.removeBlockFromDB = function(x,y){
    if(!onServer) return;
    server.db.collection('blocks').remove({
        "x":x,
        "y":y
    },function(err){if(err) throw err;});
};

BlocksManager.emitBlock = function(x,y){
    if(!onServer) return;
    io.emit('block',{
        x:x,
        y:y
    });
};

BlocksManager.emitRemoval = function(x,y){
    if(!onServer) return;
    io.emit('removeBlock',{
        x:x,
        y:y
    });
};

// returns true if there is a block on the given cell
BlocksManager.isBlockAt = function(x,y){  // x and y in cell coordinates, not px
    return (BlocksManager.blocks.get(x,y) !== null); // a SpaceMap returns null when nothing found at given coordinates
};

if(onServer) module.exports.BlocksManager = BlocksManager;