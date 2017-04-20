# Project Ensemble

Project Ensemble is an experiment in *crowd design*, where players, developers and artists collaborate to collectively design a browser-based multiplayer online game.

For a detailed description of the project, visit [the website]().

## Tour of the code

`server.js` is the starting point of the Node app and is located at the root of the repository. It includes all the necessary modules
and handles the interactions with the app.

### Game-related code

All files related to the game itself are located in the `game` directory. `assets` contains the images, sounds, JSON files, etc. used in the game.
`js` containts the source code, split into `client` and `server`-related code.

For the client, `game.js` is where the main logic is located. This file often references the `Client` object, which is defined in `client.js`
and acts as the interface between the game and the server (if you contribute, please put all interactions involving Socket.io in `client.js`).
For the server, the main logic is located in `gameserver.js`.

As the codebase grows, the code should be split into "classes" as much as possible, located in their own js files in the `game` folder.
`Player.js` is one such example.

### App-related code

"App" refers to the web page, the voting interface, the forms to suggest features and submit art, etc. The app-relate code is
located in the `app` directory. As the app was made with AngularJS,
the code is mostly distributed in terms of `views` (the HTML templates of what should be displayed, including `index.html`) and `controllers` (the logic that
controls the behavior of the views). This organization is controlled in `app.js`

