/*
Copyright (c) 2013, Eelco Cramer
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of 'The Netherlands Organisation for Applied Scientific Research TNO' nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var socketIO = require('socket.io');
var uuid = require('node-uuid');
var static = require('node-static');
var os = require('os');

//
// Create a node-static server instance to serve the './public' folder
//

var file = new(static.Server)('./client');

var server = require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        //
        // Serve files!
        //
        file.serve(request, response);
    }).resume();
});

// Create and configure socket.io 
//
var io = socketIO.listen(server, {log: false});

// configuration needed for Heroku hosting
if (os.platform() !== 'win32') {
    io.configure(function() {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
    });
}

var port = process.env.PORT || 8080;

server.listen(port);
console.log('Listening on port: ' + port);

// keeping track of connections
var sockets = {};

io.sockets.on('connection', function(socket) {
	var id;

	// determine an identifier that is unique for us.

	do {
		id = uuid.v4();
	} while (sockets[id]);

	// we have a unique identifier that can be sent to the client

	sockets[id] = socket;
	socket.emit('your-id', id);

	// remove references to the disconnected socket
	socket.on('disconnect', function() {
		sockets[socket] = undefined;
		delete sockets[socket];
	});

	// when a message is received forward it to the addressee
	socket.on('message', function(message) {
		if (sockets[message.to]) {
			sockets[message.to].emit('message', message);
		} else {
			socket.emit('disconnected', message.from);
		}
	});

	// when a listener logs on let the media streaming know about it
	socket.on('logon', function(message) {
		if (sockets[message.to]) {
			sockets[message.to].emit('logon', message);
		} else {
			socket.emit('error', 'Does not exsist at server.');
		}
	});

	socket.on('logoff', function(message) {
		if (sockets[message.to]) {
			sockets[message.to].emit('logoff', message);
		} else {
			socket.emit('error', 'Does not exsist at server.');
		}
	});
});


