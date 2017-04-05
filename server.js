const http = require('http');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('./logger')('Media Server');

const RoomMedia = require('./media');

/**
 * Config express application.
 */
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cookieParser());
app.use(session({
    secret: '1234567890',
    saveUninitialized: true,
    resave: true
}));

// serve static resources
app.use(express.static('./www'));

// index page 
app.get('/', function (req, res) {
    res.render('index');
});

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found: ' + req.url);
    err.status = 404;
    next(err);
});


/**
 * Config signaling server;
 */
const port = process.env.PORT || 8123;
const server = http.Server(app);
const media = new RoomMedia();

// Bind room media to server
app.set('port', port);

media.listen(server);
server.listen(port, () => {
    logger.info('Server is running at: ', port);
});