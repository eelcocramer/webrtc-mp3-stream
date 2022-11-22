# Stream MP3s without uploading it to any server using HTML5 JavaScript APIs

The code in this repository demonstrates how mp3s can be streamed between web browsers using `WebAudio` and `WebRTC` APIs.

## DEMO

A live demonstration is available at [deno.dev](https://webrtc-mp3-stream.deno.dev).

## REQUIREMENTS

To run the demo you need to have [deno](https://deno.land/) installed.

## RUNNING THE DEMO YOURSELF

Install and run this demo by:

1. Cloning the repository: `git clone https://github.com/eelcocramer/webrtc-mp3-stream.git`
2. Running the web server: `deno run --allow-net --allow-read main.ts`
3. Opening the demo in the browser: [http://localhost:8080/index.html](http://localhost:8080/index.html)

> Note that the web server only services the `HTML` and `JavaScript` content and is involved by negotiating the `webRTC` connection. The audio streaming itself is done peer-to-peer directly between the browsers involved.

## LICENSE

This module is available under a [FreeBSD license](http://opensource.org/licenses/BSD-3-Clause), see the [LICENSE file](https://github.com/eelcocramer/webrtc-mp3-stream/blob/master/LICENSE.md) for details.
