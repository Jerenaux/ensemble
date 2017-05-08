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
    cellWidth: null, // dimensions of the cells of the grid (received from server and set in Game.initializeGame())
    cellHeight: null,
    ownPlayerID: -1, // identifier of the sprite of the player (the green one)
    ownSprite: null, // reference to the sprite of the player (the green one)
    initialized: false,
    allowAction : true // allows to move or drop blocks ; set to false when panels are displayed
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
    game.load.image('block', 'assets/sprites/block.png'); // image for blocks
    game.load.image('triangle', 'assets/sprites/triangle.png'); // image for triangle
    game.load.spritesheet('9slice', 'assets/sprites/9slicefat.png',10,10); // tilesprite used to make the frame of the welcome panel
    game.load.spritesheet('close', 'assets/sprites/closesprite.png',20,20); // spritesheet for close button
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
    Game.blocksGroup = game.add.group(); // Rendering group of blocks
    Game.spritesGroup = game.add.group(); // Rendering group for the player sprites
    Game.UIGroup = game.add.group(); // Rendering group for user interface-related things (such as info panel, ...)

    Client.start();
};

Game.initializeGame = function(ownID,worldW,worldH,cellW,cellH,players,triangles,blocks){
    Game.ownPlayerID = ownID; // numerical id of the player's sprite
    console.log('your ID : '+ownID);

    Game.cellWidth = cellW;
    Game.cellHeight = cellH;
    game.world.bounds.setTo(0, 0, worldW, worldH); // set the dimensions of the game world to those received from the server
    game.camera.bounds = new Phaser.Rectangle(0,0,worldW,worldH); // set the limits in which the camera can move

    Game.createBackground(worldW,worldH);

    for(var i = 0; i < players.length; i++){
        Game.addNewPlayer(players[i].id,players[i].x,players[i].y);
    }

    for(var i = 0; i < triangles.length; i++){
        Game.addNewTriangle(triangles[i].id,triangles[i].x,triangles[i].y);
    }

    for(var j = 0; j < blocks.length; j++){
        BlocksManager.addBlock(blocks[j].x, blocks[j].y);
    }

    Game.createInfoPanel(500,250); // Display the "how to play" instructions panel ; arguments are width and height
    Game.createNbConnectedInfo();

    Game.registerControls(); // declares in one single place all the actions available to the players
    Game.initialized = true;
    Client.emptyQueue(); // execute buffered server messages
};

Game.createBackground = function(width,height){
    Game.bg = Game.bgGroup.add(game.add.tileSprite(0,0,width,height,'grid')); // add the grid background and let it cover the whole world
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

Game.addNewTriangle = function(id,x,y){
    var sprite = Game.spritesGroup.add(new Player(x,y,'triangle'));
    sprite.anchor.set(0.5);
    Game.players[id] = sprite;
};

Game.createInfoPanel = function(width,height){
    var x = (game.width - width)/2;
    var y = (game.height - height)/2;
    var panel = Game.UIGroup.add(new Panel(x,y,width,height,true)); // true = block movement while panel displayed
    panel.addText(Game.texts.howToPlay);
};

Game.registerControls = function(){
    // Allow clicks on the background
    Game.bg.inputEnabled = true;
    Game.bg.events.onInputDown.add(MovementManager.moveAtClick,this);
    // register the enter key to drop blocks
    game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(BlocksManager.dropBlock, this);
    // register the arrows (the associated logic takes place Game.update())
    Game.arrows = game.input.keyboard.createCursorKeys();
    // register WASD key (regardless of actual keyboard layout) (the associated logic takes place Game.update())
    Game.WASD = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D)
    };
    // Note: if you register the spacebar at some point, don't forget to use addKeyCapture(), but this will conflict with typing in the submission forms!
};

// enable/disable key captures when the submission forms of the app (comments, features) lose/gain focus
Game.toggleGameControls = function(state){
    game.input.keyboard.enabled = state;
};

Game.removePlayer = function(id){
    Game.players[id].destroy();
    delete Game.players[id];
};

Game.setCursor = function(){
    game.canvas.style.cursor = 'pointer';
};

Game.createNbConnectedInfo = function(){
    Game.nbConnectedText = Game.UIGroup.add(game.add.text(670, 375, '0 players', {
        font: '16px pixel',
        fill: "#eeeeee"
    }));
    Game.nbConnectedText.fixedToCamera = true;
};

Game.updateNbConnected = function(nb){
    if(!Game.nbConnectedText) return;
    Game.nbConnectedText.text = nb+' player'+(nb > 1 ? 's' : '');
};

Game.isUpPressed = function(){
    return (Game.arrows.up.isDown || Game.WASD.up.isDown);
};

Game.isDownPressed = function(){
    return (Game.arrows.down.isDown || Game.WASD.down.isDown);
};

Game.isRightPressed = function(){
    return (Game.arrows.right.isDown || Game.WASD.right.isDown);
};

Game.isLeftPressed = function(){
    return (Game.arrows.left.isDown || Game.WASD.left.isDown);
};

Game.update = function() {
    if(!Game.initialized) return;
    if(Game.allowAction) MovementManager.moveByKeys(Game.computeKeysAngle());
};

Game.computeKeysAngle = function(){ // compute direction based on pressed directional keys
    var angle = null;
    if (Game.isUpPressed() && !Game.isRightPressed() && !Game.isLeftPressed()) { // go up
        angle = 90;
    }else if (Game.isUpPressed() && Game.isLeftPressed()) { // up left
        angle = 135;
    }else if (Game.isLeftPressed() && !Game.isUpPressed() && !Game.isDownPressed()) { // left
        angle = 180;
    }else if (Game.isLeftPressed() && Game.isDownPressed()) { // down left
        angle = 225;
    }else if (Game.isDownPressed() && !Game.isRightPressed() && !Game.isLeftPressed()) { // down
        angle = 270;
    }else if (Game.isDownPressed() && Game.isRightPressed()) { // down right
        angle = 315;
    }else if (Game.isRightPressed() && !Game.isDownPressed() && !Game.isUpPressed()) { // right
        angle = 0;
    }else if (Game.isUpPressed() && Game.isRightPressed()) { // up right
        angle = 45;
    }
    return angle;
};