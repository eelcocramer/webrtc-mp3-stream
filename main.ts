/*
Copyright (c) 2022, Eelco Cramer
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of 'The Netherlands Organisation for Applied Scientific Research TNO' nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

import { Server } from "https://deno.land/x/socket_io@0.2.0/mod.ts";
import { serve } from "https://deno.land/std@0.165.0/http/server.ts";
import staticFiles from "https://deno.land/x/static_files@1.1.6/mod.ts";
import * as log from "https://deno.land/std@0.150.0/log/mod.ts";

const serveFiles = (req: Request) => staticFiles('client')({
    request: req,
    respondWith: (r: Response) => r
})

const io = new Server();
const ioHandler = io.handler()

const handler = (req, connInfo) => {
    const url = new URL(req.url);

    if (url.pathname.startsWith("/socket.io")) {
        return ioHandler(req, connInfo);
    } else {
        return serveFiles(req);
    }
}

let sockets = [];

io.on("connection", (socket) => {
    var id;

    // determine an identifier that is unique for us.

    do {
        id = crypto.randomUUID();
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

await serve(handler, { port: '8080' });
