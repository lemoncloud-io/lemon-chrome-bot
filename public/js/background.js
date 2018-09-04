chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('message =', message);
    console.log('sender =', sender);            // {id: "cddemoiidgdpbclgfjgflmphkiajkifh", url: "https://github.com/meeeejin/srtmacro/blob/master/manifest.json", tab: {…}, frameId: 0}
    var sid = sender && sender.id || '';
    var $tab = sender && sender.tab || {};

    // // Messages from content scripts should have sender.tab set
    // if (sender.tab) {
    //     var tabId = sender.tab.id;
    //     if (tabId in connections) {
    //         connections[tabId].postMessage(request);
    //     } else {
    //         console.log("Tab not found in connection list.");
    //     }
    // } else {
    //     console.log("sender.tab not defined.");
    // }

    // if (0 && $tab.id){
    //     doSendMessage($tab.id)
    // } else if (sendResponse){
    //     setTimeout(function(){
    //         sendResponse({text: 'hello sender!'})
    //     }, 2000);
    //     return true;
    // }
});

//! for dev-tool: add `"devtools_page": "devtools.html",` in manifest.json
var connections = {};
chrome.runtime.onConnect.addListener(function (port) {
    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(function (request) {
        console.log('incoming message from dev tools page');
        // Register initial connection
        if (request.name == 'init') {
            connections[request.tabId] = port;
            port.onDisconnect.addListener(function () {
                delete connections[request.tabId];
            });
            return;
        }
    });
});

function doSendMessage(tid, message){
    message = message || {content: "message"};
    console.log('send['+tid+'] =', message);
    chrome.tabs.sendMessage(tid, message, function(response) {
        if(response) {
            console.log('! tab['+tid+'].res =', response);
        }
    });    
}

/**
 * class: WebSocketClient
 * - auto reconnect
 * - see https://github.com/websockets/ws/wiki/Websocket-client-implementation-for-auto-reconnect
 */
function WebSocketClient($param){
    console.log('WebSocketClient()... param=', $param);
    $param = $param||{};
    this.id = $param.id||'WSC';
    this.name = $param.name||'bot';
	this.number = 0;	// Message number
	this.autoReconnectInterval = 5*1000;	// ms
}
WebSocketClient.prototype.open = function(url){
    console.log('open().......');
    var thiz = this;
	thiz.url = url;
    // thiz.instance = typeof io != 'undefined' ? io(url) : new WebSocket(url);
    thiz.instance = new WebSocket(url);
    var onopen = function(e){
        // console.log('!onopen =', e);
		thiz.onopen();
    }
	var onmessage = function(e, data){
        // console.log('!onmessage =', arguments);
        data = data === undefined ? e.data||'' : data;
		thiz.onmessage(data);
    }
    var onclose = function(e){
        console.log('!onclose =', e);
		switch (e){
		case 1000:	// CLOSE_NORMAL
			console.log("WebSocket: closed");
			break;
		default:	// Abnormal closure
            thiz.reconnect(e);
			break;
		}
		thiz.onclose(e);
    }
    var onerror = function(e){
        console.log('!onerror =', e);
		switch (e.code){
		case 'ECONNREFUSED':
            thiz.reconnect(e);
			break;
		default:
            thiz.onerror(e);
			break;
		}
	}
    
    if (thiz.instance.on)
    {
        thiz.instance.on('open', onopen);
        thiz.instance.on('message', onmessage); 
        thiz.instance.on('close', onclose);
        thiz.instance.on('error', onerror);
    }

    thiz.instance.onopen = onopen;
    thiz.instance.onmessage = onmessage;
	thiz.instance.onclose = onclose;
	thiz.instance.onerror = onerror;
}
WebSocketClient.prototype.send = function(data, option){
	try{
        data = typeof data == 'object' ? JSON.stringify(data) : data;
		this.instance.send(data, option);
	}catch (e){
		this.instance.emit('error', e);
	}
}
WebSocketClient.prototype.reconnect = function(e){
	console.log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
	var thiz = this;
    thiz.instance.removeAllListeners && thiz.instance.removeAllListeners();
	setTimeout(function(){
		console.log("WebSocketClient: reconnecting...");
		thiz.open(thiz.url);
	}, thiz.autoReconnectInterval);
}

WebSocketClient.prototype.onmessage = function (message){
    try{
        if (message && typeof message == 'string'){
            if (message.startsWith('{') || message.startsWith('[')){
                var msg = JSON.parse(message);
                var cmd = msg.cmd||'';
                var param = msg.param||msg;
                this.oncommand(cmd, param);
            } else {
                this.oncommand('msg', message);
            }
        } else {
            this.oncommand('msg', message);
        }
    }catch(e){
        console.error('!ERR =', e);
    }
}

WebSocketClient.prototype.onopen = function(e){
    console.log("WebSocketClient: open!");
    var thiz = this;
    thiz.send({cmd:'hello', did: 'chrome', name:thiz.name||'null', IP:'127.0.0.1'});
}

WebSocketClient.prototype.onerror = function(e){
    console.log("WebSocketClient: error!");
    console.log('> error =', e);
}
WebSocketClient.prototype.onclose = function(e){
    console.log("WebSocketClient: closed!");	
    console.log('> close =', e);
}
WebSocketClient.prototype.oncommand = function(cmd, msg){
    // console.log("WebSocketClient: command!", arguments);
    console.log('WebSocketClient: command!');
    console.log('> cmd =', cmd, ', msg=', msg);
}


//! socket-client.
if(WebSocketClient)
{
    console.log('! WebSocketClient()..');
    var $WSC = new WebSocketClient();
    const WS_URL = 'ws://localhost:8080';

    //! open to server
    $WSC.open(WS_URL);
}
