`config.json` contains all the tweakalble parameters of the game. As it is a JSON file, it's not possible to put comments in it. Theefore,
this `README` file will be used to list information about each entry of `config.json` (please update this file when you add entries to `config.json`).

`worldWidth`:      width of the game world, in pixels.  
`worldHeight`:     height of the game world, in pixels.  
`spriteWidth`:     width of the player and NPC sprites, in pixels. Should be updated if the size of the sprites changes.  
`spriteHeight`     height of the player and NPC sprites, in pixels. Should be updated if the size of the sprites changes.  
`cellWidth`:       width of the background cells, in pixels. Should be updated if cells of different size are used.  
`cellHeight`:      height of the background cells, in pixels. Should be updated if cells of different size are used.  
`spriteSpeed`:     the movement speed of a sprite (player or NPC), in pixels per second.  
`moveDelay`:       the minimum amount of time, in milliseconds, that should elapse between two movement instructions of a player.  
`chunkLength`:     length of the "chunks" used to decompose the trajectory of moving sprites for the collision detection algorithm (see `MovementManager.checkObstacles()`)  
`nbTriangles`:     number of triangle NPC in the game.    
`randomWalkWidth`:  width of the area within which the NPC will randomly move, in pixels.  
`randomWalkHeight`: height of the area within which the NPC will randomly move, in pixels.  
`minWalkDelay`:     minimum amount of time, in milliseconds, before a NPC performs a new random walk. 
`maxWalkDelay`:     maximum amount of time, in milliseconds, before a NPC performs a new random walk.
