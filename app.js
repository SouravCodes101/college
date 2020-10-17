require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require ("ejs");
const mongoose = require ("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/noticeDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    roll: String,
    password: String,
    notice: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
 
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/college",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/adminRegister", function(req, res){
    res.render("adminRegister");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

  app.get("/auth/google/college", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect notice.
    res.redirect("secrets");
  }); 

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/loginUser", function(req, res){
    res.render("loginUser");
});


app.get("/split", function(req, res) {
    res.render("split");
});

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()) {
        User.find({"notice": {$ne: null}}, function(err, foundUsers){
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secrets", {usersWithNotices: foundUsers});
                }
            }
        } );
    } else {
        res.redirect("/split");
    }

  
});

app.get("/secretsAdmin", function(req, res){
    if (req.isAuthenticated()) {
        User.find({"notice": {$ne: null}}, function(err, foundUsers){
            if (err) {
                console.log(err);
            } else {
                if (foundUsers) {
                    res.render("secretsAdmin", {usersWithNotices: foundUsers});
                }
            }
        } );
    } else {
        res.redirect("/login");
    }

  
});

app.get("/submit", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res) {
    const submittedNotice = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
        if (err) {
            console.log(err);
        } else {
             if (foundUser) {
                 foundUser.notice = submittedNotice;
                 foundUser.save(function(){
                     res.redirect("/secretsAdmin");
                 });
             }
        }
    });
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

app.post("/", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");   
            });
        }
    });

});

app.post("/adminRegister", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.redirect("/adminRegister");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secretsAdmin");
            });
        }
    });
    
});

app.post("/login", function(req, res) {
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secretsAdmin");   
            });
        }
    })

});

app.post("/loginUser", function(req, res) {
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");   
            });
        }
    })

});



app.listen(3000, function () {
    console.log("Server started on port 3000");
});