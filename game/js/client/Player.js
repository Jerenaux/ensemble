/**
 * Created by Jerome on 19-04-17.
 */

function Player(x,y,key){
    // key is a string indicating the atlas to use as texture
    Phaser.Sprite.call(this, game, x,y,key); // Call to constructor of parent
    game.add.existing(this);

    // Here is an example of the kind of events Phaser natively listens to
    /*this.events.onKilled.add(function(player){
        // do sometuing
    },this);*/
}

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;
