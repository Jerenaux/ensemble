/**
 * Created by Jerome on 01-05-17.
 */
var server = require('../../../server.js').server;
var io = require('../../../server.js').io; // socket.io object
var SpaceMap = require('../SpaceMap.js').SpaceMap;

// Object responsible for managing the addition and removal of blocks, and keeping the clients and database up to date
BlocksManager = {
    blockValue: 1, // value used to represent if a block is there or not, in the SpaceMap and the database
    blocks: new SpaceMap() // spaceMap storing `blockValue` if a block is at given coordinates, e.g. isThereABlock = blocks[x][y];
};

BlocksManager.getBlocksFromDB = function(){
    server.db.collection('blocks').find({}).toArray(function(err,blocks){
        if(err) throw err;
        BlocksManager.blocks.fromList(blocks);
        console.log('blocks loaded');
    });
};

BlocksManager.listBlocks = function(){ // returns a list of all the blocks
    return BlocksManager.blocks.toList();
};

BlocksManager.addBlock = function(x,y){ // return true for success, false otherwise ; coordinates in cells, not px
    if(BlocksManager.isBlockAt(x,y)) return; // cannot put a block if there is one already
    BlocksManager.insertBlockIntoSpaceMap(x,y);
    BlocksManager.insertBlockIntoDB(x,y);
    BlocksManager.emitBlock(x,y);
};

BlocksManager.removeBlock = function(x,y){
    if(!BlocksManager.isBlockAt(x,y)) return;
    BlocksManager.removeBlockFromSpaceMap(x,y);
    BlocksManager.removeBlockFromDB(x,y);
    BlocksManager.emitRemoval(x,y);
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

BlocksManager.insertBlockIntoSpaceMap = function(x,y){
    BlocksManager.blocks.add(x,y,BlocksManager.blockValue);
};

BlocksManager.removeBlockFromSpaceMap = function(x,y){
    BlocksManager.blocks.delete(x,y);
};

BlocksManager.insertBlockIntoDB = function(x,y){
    var blockDoc = {
        x: x,
        y: y,
        value: BlocksManager.blockValue //  x,y,value format used by SpaceMap to (de)serialize to/from lists
    };
    server.db.collection('blocks').insertOne(blockDoc,function(err){if(err) throw err;});
};

BlocksManager.removeBlockFromDB = function(x,y){
    server.db.collection('blocks').remove({
        "x":x,
        "y":y
    },function(err){if(err) throw err;});
};

BlocksManager.emitBlock = function(x,y){
    io.emit('block',{
        x:x,
        y:y
    });
};

BlocksManager.emitRemoval = function(x,y){
    io.emit('removeBlock',{
        x:x,
        y:y
    });
};

// returns true if there is a block on the given cell
BlocksManager.isBlockAt = function(x,y){  // x and y in cell coordinates, not px
    return BlocksManager.blocks.get(x,y) == BlocksManager.blockValue;
};

module.exports.BlocksManager = BlocksManager;