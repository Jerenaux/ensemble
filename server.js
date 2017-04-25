var express = require('express');
var fs = require('fs');
var app = express();
var bodyParser = require("body-parser");
var server = require('http').Server(app);
var mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var io = require('socket.io').listen(server);
var nodemailer = require('nodemailer');

app.use('/css',express.static(__dirname + '/app/css'));
app.use('/game',express.static(__dirname + '/game/js'));
app.use('/assets',express.static(__dirname + '/game/assets'));
app.use('/app',express.static(__dirname + '/app'));
app.use('/ctrl',express.static(__dirname + '/app/controllers'));
app.use('/views',express.static(__dirname + '/app/views'));
app.use('/images',express.static(__dirname + '/app/images'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Simple code to keep app awake on Heroku
var http = require("http");
setInterval(function() {
    http.get("http://projectensemble.herokuapp.com");
}, 1000*60*20); // every 20 minutes

app.get('/',function(req,res){
    res.sendFile(__dirname+'/app/index.html');
});

//mongoHost = 'localhost:27017';
//mongoDBName = 'ensemble';

server.listen(process.env.PORT || 8081,function(){
    mongo.connect(process.env.MONGODB_URI,function(err,db){
        if(err) throw(err);
        server.db = db;
        console.log('Connection to db established');
    });
    console.log('Listening on '+server.address().port);
});

// Handles submission of a new feature
app.post('/api/newfeature', function(req, res) {
    console.log(req.body);
    var doc = req.body;
    if(doc.desc === undefined) { // no content in the description
        res.status(400).end();
        return;
    }
    doc.stamp = Date.now();
    doc.upvotes = 0;
    doc.downvotes = 0;
    if(doc.username !== undefined) doc.username = doc.username.substring(0,30); // Limit username length to 30 characters
    if(doc.twitter != undefined) doc.twitter = doc.twitter.substring(0,20); // Limit twitter handle length to 20 characters
    doc.desc = doc.desc.substring(0,500); // Limit description to 500 characters

    server.db.collection('features').insertOne(doc,function(err){
        if(err) {
            res.status(500).end();
            throw err;
        }else {
            res.status(201).end();
        }
    });
});

// Request for the list of submitted features
app.get('/api/features',function(req,res){
    server.db.collection('features').find({}).toArray(function(err,docs){
        if(err) {
            res.status(500).end();
            throw err;
        }else {
            if(docs.length == 0){
                res.status(204).end();
            }else {
                res.status(200).send(docs).end();
            }
        }
    });
});

//  Whenever someone votes, his IP and the ID of the feature for which the vote was cast are combined, and stored
//  together with the timestamp of the vote. No vote for the same IP/ID pair is allowed within a certain time interval.
//  Obviously this is not the strongest defense against multi-vote, but it's good enough at the moment.
app.voteLog = {};

app.post('/api/vote', function(req, res) {
    var doc = req.body;
    if(!app.voteAllowed(req.ip,doc.id)){// Check if no vote was cast for the given IP/ID pair in the interval
        res.status(403).end();
        return;
    }

    var action = {};
    if(doc.change == 1){ // upvote
        action['$inc'] = {upvotes:1};
    }else if(doc.change == -1){ // downvote
        action['$inc'] = {downvotes:1};
    }else{ // unknwon action
        res.status(400).end();
        return;
    }

    server.db.collection('features').updateOne(
        {_id: new ObjectId(doc.id)},
        action,
        function(err){
            if(err) {
                res.status(500).end();
                throw err;
            }else {
                res.status(200).end();
            }
        }
    );
});

app.voteAllowed = function(ip,id){
    var hash = id+'-'+ip; // simple "hash" that concatenates the feature id with the ip address
    if(!app.voteLog.hasOwnProperty(hash) || (Date.now() - app.voteLog[hash]) > 1000*60*6*2) {
        app.voteLog[hash] = Date.now();
        return true;
    }
    return false;
};

var multipartyMiddleware = require('connect-multiparty')(); // Needed to access req.body.files

app.mailTransporter = nodemailer.createTransport({ // transporter used to send the artworks by e-mail
    service: 'gmail',
    auth: {
        //user: 'dynetisgames@gmail.com',
        //pass: 'dynetisgames2017'
        user: process.env.dynetisMailAddress,
        pass: process.env.dynetisMailPassword
    },
    tls: { rejectUnauthorized: false }
});

// Handles artwork submissions
app.post('/api/newart', multipartyMiddleware,function(req,res){
    var filePath = req.files.file.path;
    if (!fs.existsSync(filePath)) {
        res.status(404).end();
        return;
    }
    var text = (req.body.comment || 'No comment');
    if(req.body.username) text += "\n\n By "+req.body.username;
    if(req.body.email) text += " ("+req.body.email+")";
    mailOptions = {
        from: req.body.email || process.env.dynetisMailAddress,
        to: process.env.adminAddress,
        subject: 'New art submission for the Ensemble project',
        text: text,
        attachments: [{
            filename: req.files.file.name,
            path: filePath
        }]
    };
    app.mailTransporter.sendMail(mailOptions, function(err) {
        if (err) {
            console.log(err);
            res.status(500).end();
        }
        res.status(200).end()
    });
});

module.exports.io = io;
module.exports.server = server;

require('./game/js/server/gameserver.js');