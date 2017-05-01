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
    if(BlocksManager.isBlockAt(x,y)) return false; // cannot put a block if there is one already
    BlocksManager.insertBlockIntoSpaceMap(x,y);
    BlocksManager.insertBlockIntoDB(x,y);
    BlocksManager.emitBlock(x,y);
    return true;
};

BlocksManager.insertBlockIntoSpaceMap = function(x,y){
    BlocksManager.blocks.add(x,y,BlocksManager.blockValue);
};

BlocksManager.insertBlockIntoDB = function(x,y){
    var blockDoc = {
        x: x,
        y: y,
        value: BlocksManager.blockValue //  x,y,value format used by SpaceMap to (de)serialize to/from lists
    };
    server.db.collection('blocks').insertOne(blockDoc,function(err){if(err) throw err;});
};

BlocksManager.emitBlock = function(x,y){
    io.emit('block',{
        x:x,
        y:y
    });
};

// returns true if there is a block on the given cell
BlocksManager.isBlockAt = function(x,y){  // x and y in cell coordinates, not px
    return BlocksManager.blocks.get(x,y) == BlocksManager.blockValue;
};

module.exports.BlocksManager = BlocksManager;