var io = require('socket.io').listen(8000);

// io.sockets.on('connection', function (socket) {
// 	socket.on('set name', function (name) {
// 		sockets[name] = socket;
// 	});

// 	socket.on('private message', function(from, to, msg) {
// 		console.log('Received message from ' + from + ' to ' + to + '.');
// 		var destination = sockets[to];

// 		if (destination) {
// 			socket.emit('private message', { from: from, msg: msg });
// 		}
// 	});
// });

io.of('/server').on('connection', function(socket) {
	socket.on('msg', function(data) {
		console.log('received: ' + JSON.stringify(data));
		io.of('/client').emit('msg', data);
	});
});

io.of('/client').on('connection', function(socket) {
	socket.on('msg', function(data) {
		console.log('received: ' + JSON.stringify(data));
		io.of('/server').emit('msg', data);
	});
});