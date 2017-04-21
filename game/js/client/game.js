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
    ownSprite: null, // reference to the sprite of the player (the green one)
    allowMovement : true // set to false when panels are displayed
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
    // Load sprites ;Ideally most sprites should be combined in a texture atlas, but for development purposes it's more convenient to keep each sprite in a separate file
    game.load.image('grid','assets/sprites/grid.png');
    game.load.image('sprite','assets/sprites/sprite.png'); // sprite of own character
    game.load.image('bluesprite','assets/sprites/sprite_blue.png'); // sprite of other players
    game.load.spritesheet('9slice', 'assets/sprites/9slicefat.png',10,10); // tilesprite used to make the frame of the welcome panel
    game.load.spritesheet('close', 'assets/sprites/closesprite.png',20,20); // tilesprite used to make the frame of the welcome panel
    // Load data from Json files
    game.load.json('texts', 'assets/json/texts.json'); // All the texts appearing in the game (such as help, ...)
};

Game.create = function(){
    Game.players = {}; // list of Player objects, accessed by id
    Game.texts = game.cache.getJSON('texts'); // Fetches the data from the loaded json file

    // The next few lines create a few groups in which the different sprites of the game will be stored.
    // The order of the groups is important, as it determines the rendering order: if a group B is created
    // adter a group A, the sprites in B will render on top of A.
    Game.bgGroup = game.add.group(); // Rendering group for the background tiles
    Game.spritesGroup = game.add.group(); // Rendering group for the player sprites
    Game.UIGroup = game.add.group(); // Rendering group for user interface-related things (such as info panel, ...)

    Client.start();
};

Game.initializeGame = function(ownID,worldW,worldH,players){
    Game.ownPlayerID = ownID; // numerical id of the player's sprite
    console.log('your ID : '+ownID);

    game.world.bounds.setTo(0, 0, worldW, worldH); // set the dimensions of the game world to those received from the server
    game.camera.bounds = new Phaser.Rectangle(0,0,worldW,worldH); // set the limits in which the camera can move

    Game.createBackground(worldW,worldH);

    for(var i = 0; i < players.length; i++){
        Game.addNewPlayer(players[i].id,players[i].x,players[i].y);
    }

    Game.createInfoPanel(500,200); // Display the "how to play" instructions panel ; arguments are width and height
};

Game.createBackground = function(width,height){
    var bg = Game.bgGroup.add(game.add.tileSprite(0,0,width,height,'grid')); // add the grid background and let it cover the whole world
    bg.inputEnabled = true;
    bg.events.onInputDown.add(Game.handleClick,this);
};

Game.addNewPlayer = function(id,x,y){
    var texture = (id == Game.ownPlayerID ? 'sprite' : 'bluesprite'); // Each player sees his sprite as green and sees the other sprites as blue
    var sprite = Game.spritesGroup.add(new Player(x,y,texture));
    if(id == Game.ownPlayerID) {
        Game.ownSprite = sprite; // keep track of the player's sprite
        game.camera.follow(Game.ownSprite);
    }
    sprite.anchor.set(0.5); // make the coordinates of the sprite correspond to its center, not to the top left
    Game.players[id] = sprite;
};

Game.createInfoPanel = function(width,height){
    var x = (game.width - width)/2;
    var y = (game.height - height)/2;
    var panel = Game.UIGroup.add(new Panel(x,y,width,height,true)); // true = block movement while panel displayed
    panel.addText(Game.texts.howToPlay);
};

Game.handleClick = function(){
    if(!Game.allowMovement) return;
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

Game.setCursor = function(){
    game.canvas.style.cursor = 'pointer';
};

Game.update = function() {};