var socketIO = require('socket.io');
var uuid = require('node-uuid');
var static = require('node-static');

//
// Create a node-static server instance to serve the './public' folder
//
var file = new(static.Server)('../client');

var server = require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
});

var io = socketIO.listen(server);

server.listen(8080);

var sockets = {};

io.sockets.on('connection', function(socket) {
	var id;

	do {
		id = uuid.v4();
	} while (sockets[id]);

	// we have a unique identifier that can be sent to the client

	sockets[id] = socket;
	socket.emit('your-id', id);

	socket.on('disconnect', function() {
		sockets[socket] = undefined;
	});

	socket.on('message', function(message) {
		if (sockets[message.to]) {
			sockets[message.to].emit('message', message);
		} else {
			socket.emit('disconnected', message.from);
		}
	});

	socket.on('logon', function(message) {
		if (sockets[message.to]) {
			sockets[message.to].emit('logon', message);
		} else {
			socket.emit('error', 'Does not exsist at server.');
		}
	});
});


