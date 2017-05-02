
//var width = Math.min(Math.max(window.screen.width,window.screen.height),750);
var game = new Phaser.Game(750,400, Phaser.AUTO, document.getElementById('game'));
game.state.add('Game',Game);
game.state.start('Game');

$(document).ready(function()
{
    $('[data-toggle="popover"]').popover(); // enable the Boostrap popover elements
    // Associate toggleGameControls events to all text-related inputs, to avoid conflit between game controls and typing text
    $('input[type=text], textarea').focus(function(){Game.toggleGameControls(false);});
    $('input[type=text], textarea').blur(function(){Game.toggleGameControls(true);});
});