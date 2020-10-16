const express = require("express");
const bodyParser = require("body-parser");
const ejs = require ("ejs");
const mongoose = require ("mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
extended: true
}));

mongoose.connect("mongodb://localhost:27017/noticeDB", {useNewUrlParser: true, useUnifiedTopology: true});

app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/user", function(req, res){
    res.render("user");
});

app.get("/split", function(req, res) {
    res.render("split");
});



app.listen(3000, function () {
    console.log("Server started on port 3000");
});