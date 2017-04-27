
//var width = Math.min(Math.max(window.screen.width,window.screen.height),750);
var game = new Phaser.Game(750,400, Phaser.AUTO, document.getElementById('game'));
game.state.add('Game',Game);
game.state.start('Game');

