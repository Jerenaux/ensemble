/**
 * Created by Jerome on 02-05-17.
 */

function Block(x,y){
    Phaser.Sprite.call(this, game, x,y,'block');
    game.add.existing(this);
}

Block.prototype = Object.create(Phaser.Sprite.prototype);
Block.prototype.constructor = Block;
