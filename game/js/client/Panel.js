/**
 * Created by Jerome on 21-04-17.
 */

function Panel(x,y,width,height,blockMovement){
    // blockMovement: should movements be disabled while the panel is displayed
    // The panel is made from a 9 slice image. A 9 slice is a squared image which is sliced
    // in nine slices (4 corners, 4 sides and the center). By scaling the sides and
    // the middle, the initial image can be scaled to any rectangular dimensions without distortions.
    Phaser.Sprite.call(this, game, x,y); // Create a container with no texture
    game.add.existing(this);
    if(blockMovement) Game.allowMovement = false;
    this.fixedToCamera = true;
    this.blockMovement = blockMovement;

    // Define a few parameters
    var sliceSize = 10; // The 9slice image is split in 9 square areas of sliceSize*sliceSize pixels
    this.centerWidth = width; // width of the central area, used to know the space available for text

    // Create, position and scale all 9 parts of the 9 slice
    this.addChild(game.add.sprite(0,0, '9slice',0)); // Top left corner
    this.addChild(game.add.tileSprite(sliceSize,0,width,sliceSize, '9slice',1)); // top side
    this.addChild(game.add.sprite(sliceSize+width,0, '9slice',2)); // top right corner

    this.addChild(game.add.tileSprite(0,sliceSize,sliceSize,height, '9slice',3)); // left side
    this.addChild(game.add.tileSprite(sliceSize,sliceSize,width,height, '9slice',4)); // center
    this.addChild(game.add.tileSprite(sliceSize+width,sliceSize,sliceSize,height, '9slice',5)); // right side

    this.addChild(game.add.sprite(0,sliceSize+height, '9slice',6)); // bottom left corner
    this.addChild(game.add.tileSprite(sliceSize,sliceSize+height,width,sliceSize, '9slice',7)); // bottom side
    this.addChild(game.add.sprite(sliceSize+width,sliceSize+height, '9slice',8)); // bottom right corner

    this.setFadeOutTween();
    this.makeCloseButton(width); // send the width to use as x coordinate
}

Panel.prototype = Object.create(Phaser.Sprite.prototype);
Panel.prototype.constructor = Panel;

Panel.prototype.setFadeOutTween = function(){
    var speedCoef = 0.3;
    this.hideTween = game.add.tween(this);
    this.hideTween.to({alpha: 0}, Phaser.Timer.SECOND*speedCoef);
    this.hideTween.onComplete.add(this.close,this);
};

Panel.prototype.makeCloseButton = function(x){
    var closeBtn = this.addChild(game.add.button(x,0, 'close',function(){
        this.hideTween.start(); // when clicking, start the fade-out tween
    }, this, 1, 0,1));
    closeBtn.anchor.set(0,0.5);
    // The following is required to make sure the cursor remains in 'pointer' mode
    closeBtn.events.onInputOut.add(Game.setCursor,this);
    closeBtn.events.onDestroy.add(function() {
        setTimeout(Game.setCursor, 10);
    },this);
};

Panel.prototype.close = function(){
    if(this.blockMovement) Game.allowMovement = true; // re-allow movement upon closing panel
    this.destroy();
};

Panel.prototype.addText = function(text){
    var txtPadding = 20; // How many pixels of padding to add to the text
    this.textHolder = this.addChild(game.add.text(20,20, text, {
        font: '18px pixel',
        fill: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        wordWrap: true,
        wordWrapWidth: this.centerWidth - (txtPadding*2)
    }));
};