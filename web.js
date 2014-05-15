var express = require('express');
var app = express();
var compress = require('compression')
var server = require('http').Server(app);
var io = require('socket.io').listen(server);
var swig  = require('swig');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

var adress = 'localhost';

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("ok");
});

app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/');

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!
app.use(bodyParser())

app.get('/', function (req, res) {
    res.render('index.html', {
            adress: adress
        });
});
app.use(compress());
app.use(express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket) {
    socket.join('Room');
    socket.emit('message', 'Vous êtes bien connecté !');

    // Quand le serveur reçoit un signal de type "message" du client    
    socket.on('message_from_web', function (message) {
        console.log('Un client web me parle ! Il me dit : ' + message);
        socket.broadcast.to('Room').emit('web_message', message) 
    });
    socket.on('message_from_arduino', function (message) {
        console.log('Un client arduino me parle ! Il me dit : ' + message);
        socket.broadcast.to('Room').emit('arduino_message', message) 
    });
});

server.listen(80);