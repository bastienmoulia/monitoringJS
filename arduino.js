var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io').listen(server);
var ioclient = require('socket.io-client');
var swig  = require('swig');
var bodyParser = require('body-parser');
var fs = require("fs");

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
    fs.readFile('adress.txt', 'UTF-8', function(error, content) {
        res.render('arduino.html', {
            adress: content
        });
    });
});
app.post('/adress', function(req, res) {
    console.log('New adress : ' + req.body.adress);
    fs.writeFileSync("adress.txt", req.body.adress, "UTF-8");
    res.redirect('/');
    startWebServer();
});

io.sockets.on('connection', function (socket) {
    socket.emit('message', 'Vous êtes bien connecté !');

    // Quand le serveur reçoit un signal de type "message" du client    
    socket.on('message', function (message) {
        console.log('Un client me parle ! Il me dit : ' + message);
        socketclient.emit('message_from_arduino', message);
    });	
});


startWebServer();
server.listen(8080);
var socketclient;
function startWebServer(){
    console.log('try to start communication with server');
    fs.readFile('adress.txt', 'UTF-8', function(error, content) {//verifier que la lecture du fichier ce fait bien sinon erreur
        socketclient = ioclient.connect(content, { port: 80 });
        socketclient.on('connect', function () { console.log("socket connected"); });

        socketclient.socket.on('connect_failed', function(){
            console.log('Connection Failed');
        });
        socketclient.socket.on('connect', function(){
            console.log('Connected');
        });
        socketclient.socket.on('disconnect', function () {
          console.log('Disconnected');
        });
        
        socketclient.on('message', function (message) {
            console.log('Un client me parle ! Il me dit : ' + message);
        });
        socketclient.on('web_message', function (message) {
            console.log('Message web : ' + message);
            if(message == 'active'){
                http.get("http://localhost/arduino/digital/13/1", function(res) {
                  console.log("Got response: " + res.statusCode);
                }).on('error', function(e) {
                  console.log("Got error: " + e.message);
                });
            }
            if(message == 'inactive'){
                http.get("http://localhost/arduino/digital/13/0", function(res) {
                  console.log("Got response: " + res.statusCode);
                }).on('error', function(e) {
                  console.log("Got error: " + e.message);
                });
            }
        });
        
        
    });
}