/*
 * Author: Jerome Renaux
 * E-mail: jerome.renaux@gmail.com
 */

/*
* Game is the main state object. States are Phaser objects used to compartmentalize the code of the game according to the
* different states the game can be in, e.g. starting screen, main game, game over scree, ...
* Each state object will be populated by Phaser-specific properties, but can contain custom ones as well, as exemplified below.
* For the moment, Ensemble only needs one main game state. The states are declared in game/js/client/main.js.
* */
var Game = {
    spriteSpeed : 1, // "speed" at which the player sprites will travel, in msec/px
    lastClick : 0, // timestamp of the last time the player clicked the map
    clickDelay: 100, //ms before allowing a new click,
    ownPlayerID: -1, // identifier of the sprite of the player (the green one)
    ownSprite: null // reference to the sprite of the player (the green one)
};

/**
 * Several methods are automatically called by Phaser in the course of the game. Phaser will look for them in the state
 * object of the current state, therefore they are added to our Game object. These methods are:
 * Game.init(): called at the very beginning of the game, to initialize a few parameters.
 * Game.preload(): automatically called after init(), used to load the assets of the game.
 * Game.create(): called once preload() is done. Use to set up the game and possibly already display things, like the map (if any).
 * Game.update(): the main update loop of the game, called once per frame. Can be used to update the state of the players,
 * check for collisions, etc. In the case of Ensemble, the movements are taken care of by a tween, so Phaser takes care of the
 * updates and the rendering under the hood. Therefore, there is not much to see in update() yet, apart from listening to
 * mouse clicks or taps.
 */

Game.init = function(){
    game.stage.disableVisibilityChange = true; // The game will keep running even when the window is not active
    game.scale.pageAlignHorizontally = true;
};

Game.preload = function() {
    game.load.image('grid','assets/sprites/grid.png');
    game.load.image('sprite','assets/sprites/sprite.png'); // sprite of own character
    game.load.image('bluesprite','assets/sprites/sprite_blue.png'); // sprite of other players
};

Game.create = function(){
    Game.players = {}; // list of Player objects, accessed by id
    Client.start();
};

Game.initializeGame = function(ownID,worldW,worldH,players){
    Game.ownPlayerID = ownID; // numerical id of the player's sprite
    console.log('your ID : '+ownID);
    game.world.bounds.setTo(0, 0, worldW, worldH); // set the dimensions of the game world to those received from the server
    game.camera.bounds = new Phaser.Rectangle(0,0,worldW,worldH); // set the limits in which the camera can move
    game.add.tileSprite(0,0,worldW,worldH,'grid'); // add the grid background and let it cover the whole world
    for(var i = 0; i < players.length; i++){
        Game.addNewPlayer(players[i].id,players[i].x,players[i].y);
    }
};

Game.addNewPlayer = function(id,x,y){
    var texture = (id == Game.ownPlayerID ? 'sprite' : 'bluesprite'); // Each player sees his sprite as green and sees the other sprites as blue
    var sprite = new Player(x,y,texture);
    if(id == Game.ownPlayerID) {
        Game.ownSprite = sprite; // keep track of the player's sprite
        game.camera.follow(Game.ownSprite);
    }
    sprite.anchor.set(0.5); // make the coordinates of the sprite correspond to its center, not to the top left
    Game.players[id] = sprite;
};

Game.handleClick = function(){
    if(Date.now() - Game.lastClick < Game.clickDelay) return; // prevent rapid firing
    Game.lastClick = Date.now();
    Client.sendClick(game.input.worldX,game.input.worldY);
};

Game.movePlayer = function(id,x,y){
    var player = Game.players[id];
    var distance = Phaser.Math.distance(player.x,player.y,x,y);
    // The following tweens a sprite linearly from its current position to the received (x,y) coordinates
    var tween = game.add.tween(player);
    var duration = distance*Game.spriteSpeed;
    tween.to({x:x,y:y}, duration);
    tween.start();
};

Game.removePlayer = function(id){
    Game.players[id].destroy();
    delete Game.players[id];
};

Game.update = function() {
    if (game.input.activePointer.isDown) Game.handleClick(); // Reacts to mouse clicks or screen taps
};