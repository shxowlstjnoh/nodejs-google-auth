var express = require('express');
var parseurl = require('parseurl');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

var app = express();
var port = 3000;

app.use(
    session({
        secret: 'sdfa1212sdfe!@#2',
        resave: false,
        saveUninitialized: true,
        store: new FileStore(),
    })
);

app.get('/', function (req, res, next) {
    console.log(req.session);
    if (req.session.num === undefined) {
        req.session.num = 1;
    } else {
        req.session.num += 1;
    }
    res.send(`Views : ${req.session.num}`);
});

app.listen(port, function () {
    console.log(`Example app listening at http://localhost:${port}`);
});
