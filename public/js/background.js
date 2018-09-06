/**
 * Background Worker
 *
 * 
 * author: Steve <steve@lemoncloud.io>
 * date : 2018-08-31
 *
 * Copyright (C) 2018 LemonCloud Co Ltd. - All Rights Reserved.
 */
//! Main Function Body
(function (window) {
    const NS = 'BG';

    const chrome = window.chrome;
    if (!chrome) throw new Error('chrome is required!');

    //! message via content.js
    const TAB_MAP = {};
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
        message = message || {};
        sender = sender || {};
        _inf(NS, '! onMessage()... ');
        _log(NS, '> message =', message);           // {type, id, ...}
        // _log(NS, '> sender =', sender);             // {id: "cddemoiidgdpbclgfjgflmphkiajkifh", url: "https://github.com/meeeejin/srtmacro/blob/master/manifest.json", tab: {…}, frameId: 0}
        const type  = message.type||'';
        const sid   = sender.id || '';
        const url   = sender.url || '';
        const fid   = sender.frameId || 0;             // if exists, then it must be internal frame like iframe.
        const $tab  = sender.tab || {};
        const tid   = $tab.id || 0;                    // starts from 1
        _log(NS, '>> sender-id =', sid);
        _log(NS, '>> tab-id =', tid, ', frame-id=', fid);

        if (false){;
        } else if (type == 'document.ready'){
            if (!fid) TAB_MAP[tid] = {sid, url, fid, tid};
            sendResponse({type:'ready', frameId: fid, tabId: tid})
        } else if (type == 'window.unload'){
            if (!fid) delete TAB_MAP[tid];
        }
    });
    
    //! hello() to test.
    window.hello = function(name){
        name = name||'hello!'
        _log(NS, `hello ${name}!`);
        const tid = 2;
        return chrome.tabs.sendMessage(tid, {cmd: name}, {frameId:0}, function(res) {
            res && _inf(NS, '! tab['+tid+'].res =', res);
        });
    }

    //! navigate to url.
    window.navigate = function(url, tid){
        tid = tid||2;
        _log(NS, 'tab['+tid+'].url :=', url);
        return chrome.tabs.update(tid, {url}, function(tab) {
            _log(NS, '>> updated.tab =', tab);
        });    
    }

    //! main service object.
    window.$LEM = {
        tid: 2,                     // default tab-id.
        //- send message to content, then get-back result.
        sendMessage: function(id, cmd, data){
            return new Promise((resolve, reject)=>{
                id = id||this.tid;         //TODO - define target-id. (currently as tab-id yet)
                const tid = id;
                _log(NS, '> tab['+tid+'].send =', {cmd, data});
                chrome.tabs.sendMessage(tid, {cmd, data}, {frameId:0}, function(res) {
                    _log(NS, '> tab['+tid+'].res =', res);
                    //! process Promised 
                    if (res && res instanceof Promise){
                        _log(NS, '>> promised! res=', res);
                        return res
                        .then(_ => resolve(_))
                        .catch(e => reject(e))
                    }
                    //! normal process.
                    res = res||{};
                    const err = res.error;
                    const data = res.data;
                    err && _err(NS, '! tab['+tid+'].error =', err);
                    !err && _inf(NS, '! tab['+tid+'].data =', data);
                    return err ? reject(err) : resolve(data);
                })
            })
        },
        // hi()         ex: `$LEM.hi('hoho')`
        hi: function(name, id = 0){
            return this.sendMessage(id, 'hi', {name})
        },
        // evaluate()   
        // ex: `$LEM.eval('document.location')`. 
        // ex: `$LEM.eval('ADMIN.openProfile()')`. 
        eval: function(text, id = 0){
            return this.sendMessage(id, 'eval', {text})
        },
    }

    // //! for dev-tool: add `"devtools_page": "devtools.html",` in manifest.json
    // var connections = {};
    // chrome.runtime.onConnect.addListener(function (port) {
    //     // Listen to messages sent from the DevTools page
    //     port.onMessage.addListener(function (request) {
    //         console.log('incoming message from dev tools page');
    //         // Register initial connection
    //         if (request.name == 'init') {
    //             connections[request.tabId] = port;
    //             port.onDisconnect.addListener(function () {
    //                 delete connections[request.tabId];
    //             });
    //             return;
    //         }
    //     });
    // });

    /**
     * class: WebSocketClient
     * - auto reconnect
     * - see https://github.com/websockets/ws/wiki/Websocket-client-implementation-for-auto-reconnect
     */
    function WebSocketClient($param){
        _inf('WebSocketClient()... ');
        $param && _log('> param =', $param);
        $param = $param||{};
        this.id = $param.id||'WSC';
        this.name = $param.name||'chrome-bot';
        this.number = 0;	// Message number
        this.autoReconnectInterval = 5*1000;	// ms
        this.handlers = {};
    }
    WebSocketClient.prototype.open = function(url){
        _log('open().......');
        var thiz = this;
        thiz.url = url;
        thiz.instance = new WebSocket(url);
        var onopen = function(){
            thiz.onopen();
        }
        var onmessage = function(e, data){
            data = data === undefined ? e.data||'' : data;
            thiz.onmessage(data);
        }
        var onclose = function(e){
            _log('!onclose =', e);
            switch (e){
            case 1000:	// CLOSE_NORMAL
                _log("WebSocket: closed");
                break;
            default:	// Abnormal closure
                thiz.reconnect(e);
                break;
            }
            thiz.onclose(e);
        }
        var onerror = function(e){
            _err('!onerror =', e);
            switch (e && e.code){
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
        _log(`WebSocketClient: retry in ${this.autoReconnectInterval}ms`,e);
        var thiz = this;
        thiz.instance.removeAllListeners && thiz.instance.removeAllListeners();
        setTimeout(function(){
            _log("WebSocketClient: reconnecting...");
            thiz.open(thiz.url);
        }, thiz.autoReconnectInterval);
    }

    WebSocketClient.prototype.onmessage = function (message){
        try{
            if (message && typeof message == 'string'){
                if (message.startsWith('{') || message.startsWith('[')){
                    var $msg = JSON.parse(message);
                    var cmd = $msg.cmd||'';
                    var param = $msg.param||$msg.data||{};
                    _inf('! onmessage. $msg=', $msg);
                    this.oncommand(cmd, param, $msg);
                } else {
                    this.oncommand('msg', message);
                }
            } else {
                this.oncommand('msg', message);
            }
        }catch(e){
            _err('!ERR =', e);
        }
    }

    WebSocketClient.prototype.onopen = function(e){
        _log("WebSocketClient: open!");
        var thiz = this;
        thiz.send({cmd: 'hello', did: 'chrome', name:thiz.name, id: thiz.id});
    }
    WebSocketClient.prototype.onerror = function(e){
        _log("WebSocketClient: error!");
        _log('> error =', e);
    }
    WebSocketClient.prototype.onclose = function(e){
        _log("WebSocketClient: closed!");	
        _log('> close =', e);
    }
    WebSocketClient.prototype.oncommand = function(cmd, msg, $msg){
        _log('WebSocketClient: oncommand!');
        _log('> cmd =', cmd, ', msg=', msg);
        const thiz = this;
        const sendResponse = (res)=>{
            res.id  = $msg&&$msg.id||0;
            res.cmd = 'resp';           //WARN! must be 'resp'.
            _inf(NS, '>> handle['+res.cmd+'/'+res.id+'].send =', res);
            thiz.send(res);
        }
        //! decode by cmd, and send response.
        const handler = cmd && thiz.handlers[cmd] || null;
        handler && (()=>{
            const res = {error:null, data:null};
            try {
                const ret = handler(msg, $msg);
                if (ret && ret instanceof Promise){
                    return ret
                    .then(_ => {
                        // _inf(NS, '>> handle['+cmd+'].res =', _);
                        res.data = _;
                        return res;
                    })
                    .catch(e => {
                        _err(NS, '>> handle['+cmd+'].err =', e);
                        res.error = e;
                        return res;
                    })
                    .then(res => {
                        // _log(NS, '>> handle['+cmd+'].send =', res);
                        sendResponse(res)
                    })
                }
                res.data = ret;
            } catch(e) {
                _err(NS, '>> handle.ERR!=', e);
                res.error = e;
            }
            sendResponse(res);
        })();        
    }
    WebSocketClient.prototype.setHandler = function(cmd, callback){
        if (typeof callback != 'function') throw new Error('Invalid type:'+(typeof callback));
        this.handlers[cmd] = callback;
    }

    //////////////////////////////////////////
    //! create socket-client.
    if(WebSocketClient)
    {
        _log(NS, '! WebSocketClient()..');
        const $WSC = new WebSocketClient();

        //TODO - read url via configuration.
        const WS_URL = 'ws://localhost:8080';
        $WSC.open(WS_URL);

        //! common handler.
        $WSC.setHandler('hi', function(data){
            return new Promise((resolve, reject)=>{
                setTimeout(()=>{
                    resolve({name:'chrome'})
                }, 0);
            })
        })
        $WSC.setHandler('eval', function(data){
            return $LEM.eval(data);
        })
    }


})(window||global);
