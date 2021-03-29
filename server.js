/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        if (!req.body.title || !req.body.year || !req.body.genre || !req.body.actors || req.body.actors < 3) {
            res.json({success: false, message: "An entry requires a title, the year released, the genre, and 3 actors"});
        } else {
            var movie = new Movie();

            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            movie.save(function(err){
            if (err) {
                return res.json(err);
                }
            res.json({success: true, msg: 'Movie saved.'});
            })
        }
    })
    .put(authJwtController.isAuthenticated, function(req, res) {
        if(!req.body.title){
            res.json({success:false, message: "Please provide a title to update"});
        }else{
            if (req.body.newTitle){    
                Movie.findOneAndUpdate(req.body.title, req.body.newTitle, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Can not update Movie"});
                    }else{
                        res.status(200).json({success: true, message: "Updated movie title"});
                    }
                });
            }
            if (req.body.newYear){    
                Movie.findOneAndUpdate(req.body.year, req.body.newYear, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Can not update Movie"});
                    }else{
                        res.status(200).json({success: true, message: "Updated movie year"});
                    }
                });
            }
            if (req.body.newGenre){    
                Movie.findOneAndUpdate(req.body.genre, req.body.newGenre, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Can not update Movie"});
                    }else{
                        res.status(200).json({success: true, message: "Updated movie genre"});
                    }
                });
            }
        }
    })
    .delete(authJwtController.isAuthenticated, function(req, res) {
        if(!req.body.title){
            res.json({success:false, message: "Please provide a title to delete"});
        }else{
            Movie.findOneAndDelete(req.body.title, function(err, movie) {
                if(err){
                    res.status(403).json({success:false, message: "Error: Could not delete"});
                }else if(!movie){
                    res.status(403).json({success: false, message: "Error: Movie not found"});
                }else {
                    res.status(200).json({success: true, message: "Movie deleted"});
                }
            })
            }

    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find({}, function(err, movies) {
            res.json({Movie: movies});
        })
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


