/**
 * To support network Socket
 * 
 * !WARN! UNDER WORKING (FEASIBILITY TEST).
 * 
 * add settings in manifest.json
 * ```
 *   "permissions": ["system.network"],
 *   "sockets": {
 *      "tcpServer" : {
 *          "listen": ["*"]
 *      }
 *   },
 * ```
 * 
 * 
 * author: Steve <steve@lemoncloud.io>
 * date : 2018-08-31
 *
 * Copyright (C) 2018 LemonCloud Co Ltd. - All Rights Reserved.
 */
//! Main Function Body
(function (window) {
    const NS = 'SC';

    const chrome = window.chrome;
    if (!chrome) throw new Error('chrome is required!');

    //! socker-io standalone.
    if (typeof io != 'undefined')
    {
        // var io = require('socket.io')();
        // io.on('connection', function(client){});
        // io.listen(3000);        
    }

    if (true){
        chrome.sockets.tcpServer.create({}, function(info){
            chrome.sockets.tcpServer.listen(info.socketId, 'localhost', 2000, function(result){
                _inf(NS, '! socket.res =', result);
            });
        });
    }

    if (false) {
        // see https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/webserver
        var socket = chrome.socket || chrome.experimental.socket;
        // Create a socket and convert it to a server socket.
        socket.create("tcp", {}, function (_socketInfo) {
            socketInfo = _socketInfo;  // Cache globally [eek]
            socket.listen(socketInfo.socketId, "127.0.0.1", 8080, 20, function (result) {
                _inf(NS, '! socket.res =', result);
                //Accept the first response
                socket.accept(socketInfo.socketId, onAccept);
            });
        });

        // Create an onAccept handler that is triggered for an incomming request.
        var onAccept = function (acceptInfo) {
            // This is a request that the system is processing.
            // Read the data.
            socket.read(acceptInfo.socketId, function (readInfo) {
                // Parse the request.
                var data = arrayBufferToString(readInfo.data);
                // We only want to handle get requests
                if (data.indexOf("GET ") == 0) {
                    // we can only deal with GET requests
                    var uriEnd = data.indexOf(" ", 4);
                    if (uriEnd < 0) { /* throw a wobbler */ return; }
                    var uri = data.substring(4, uriEnd);
                    var file = filesMap[uri];  // pick out the file we want to server
                    if (!!file == false) { /* File does not exist */ return; }
                    write200Response(acceptInfo.socketId, file);
                } else {
                    // Throw an error
                    socket.destroy(acceptInfo.socketId);
                    // We need to say that we can accept another incoming request.
                    socket.accept(socketInfo.socketId, onAccept);
                }
            });
        };

        // Write the response back to the client.
        var write200Response = function (socketId, file) {
            var contentType = (file.type === "") ? "text/plain" : file.type;
            var contentLength = file.size;

            // Create an ArrayBuffer for the HTTP response.
            var header = stringToUint8Array("HTTP/1.0 200 OK\nContent-length: " + file.size + "\nContent-type:" + contentType + "\n\n");

            var outputBuffer = new ArrayBuffer(header.byteLength + file.size);
            var view = new Uint8Array(outputBuffer)
            view.set(header, 0);
            // Read the file from the filesystem.
            var fileReader = new FileReader();
            fileReader.onload = function (e) {
                view.set(new Uint8Array(e.target.result), header.byteLength);
                // Write it out to the client that made the request
                socket.write(socketId, outputBuffer, function (writeInfo) {
                    // Kill the client socket
                    socket.destroy(socketId);
                    // We need to say that we can accept another incoming request.
                    socket.accept(socketInfo.socketId, onAccept);
                });
            }
        }
    }

})(window||global);