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
var Review = require('./Reviews');
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
                Movie.findOneAndUpdate({title: req.body.title}, {title: req.body.newTitle}, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Can not update Movie"});
                    }else{
                        res.status(200).json({success: true, message: "Updated movie title"});
                    }
                });
            }
            if (req.body.newYear){    
                Movie.findOneAndUpdate({title: req.body.title}, {year: req.body.newYear}, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Can not update Movie"});
                    }else{
                        res.status(200).json({success: true, message: "Updated movie year"});
                    }
                });
            }
            if (req.body.newGenre){    
                Movie.findOneAndUpdate({title: req.body.title}, {genre: req.body.newGenre}, function(err, movie) {
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
            Movie.findOneAndDelete({title: req.body.title}, function(err, movie) {
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
/*
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find({}, function(err, movies) {
            if(!req.body.title){
                res.json({Movie: movies});
            } else{
                Movie.find({ title: req.body.title }).select("title year genre actors").exec(function (err, movie) {
                if (err) {
                    return res.status(403).json({ success: false, message: "Error: Movie not found." });
                }
                if (movie && movie.length > 0) {
                    return res.status(200).json({ success: true, message: "Movie found.", movie: movie });
                } else {
                    return res.status(404).json({ success: false, message: "Error: No match" });
                }
                })
                if (req.body.reviews == true) {
                    Movie.aggregate().match({ title: req.body.title })
                    .lookup({ from: 'reviews', localField: 'title', foreignField: 'title', as: 'reviews' })
                    .addFields({avgRating: {$avg: "$reviews.score"}})
                    .exec((err, result) => {
                        if (err) {
                            return res.status(400).json({ success: false, message: err });
                        }
                        else {
                            if (result.length == 0) {
                                return res.status(400).json({ success: false, message: 'No reviews were found. ' });
                            }
                            else {
                                return res.status(200).json(result)
                            }
                        }
                    })
                }
            }
        })
    });
*/
router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        if (!req.body.title || !req.body.author || !req.body.review || !req.body.score) {
            res.json({success: false, message: "An entry requires a title, the year author, the review, and a score"});
        } else {
             Movie.findOne({ title: req.body.title }, (err, movie) => {
                if (err) {
                    return res.status(403).json({ success: false, message: "Error creating review" });
                } else {
                    if (!movie) {
                        return res.status(403).json({ success: false, message: "Unable to find movie title" });
                    } else {
                        var review = new Review();
                        review.title = req.body.title;
                        review.author = req.body.author;
                        review.review = req.body.review;
                        review.score = req.body.score;
                        review.save(function(err){
                            if (err) {
                                return res.json(err);
                            }
                            res.json({success: true, msg: 'Review saved.'});
                        })
                    }
                }
            });
        }
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.find({}, function(err, reviews) {
                res.json({Review: reviews});
        })
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


