/*
Copyright (c) 2022, Eelco Cramer
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of 'The Netherlands Organisation for Applied Scientific Research TNO' nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import  { Server, Socket, serve, ConnInfo, staticFiles } from "./deps.ts";

const serveFiles = (req: Request) => staticFiles('client')({
    request: req,
    respondWith: (r: Response) => r
})

const io = new Server();
const ioHandler = io.handler()

const handler = (req: Request, connInfo: ConnInfo) => {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/socket.io")) {
        return ioHandler(req, connInfo);
    } else {
        return serveFiles(req);
    }
}

const sockets = new Map<string, Socket>();

io.on("connection", (socket) => {
    let id: string;

    // determine an identifier that is unique for us.

    do {
        id = crypto.randomUUID();
    } while (sockets.has(id));

    // we have a unique identifier that can be sent to the client

    sockets.set(id, socket);
    socket.emit('your-id', id);

    // remove references to the disconnected socket
    socket.on('disconnect', function() {
        sockets.delete(id)
    });

    // when a message is received forward it to the addressee
    socket.on('message', function(message) {
        if (sockets.has(message.to)) {
            sockets.get(message.to)?.emit('message', message);
        } else {
            socket.emit('disconnected', message.from);
        }
    });

    // when a listener logs on let the media streaming know about it
    socket.on('logon', function(message) {
        if (sockets.has(message.to)) {
            sockets.get(message.to)?.emit('logon', message);
        } else {
            socket.emit('error', 'Does not exsist at server.');
        }
    });

    socket.on('logoff', function(message) {
        if (sockets.has(message.to)) {
            sockets.get(message.to)?.emit('logoff', message);
        } else {
            socket.emit('error', 'Does not exsist at server.');
        }
    });

});

await serve(handler, { port: 8080 });
