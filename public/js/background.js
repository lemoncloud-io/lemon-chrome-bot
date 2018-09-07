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

    //! hello() to test.
    window.hello = function(name, tid, fid){
        name = name||'hello!'
        tid = tid||2;
        fid = fid||0;
        _log(NS, `hello ${name} @ ${tid}/${fid}`);
        return chrome.tabs.sendMessage(tid, {cmd: name}, {frameId:fid}, function(res) {
            _inf(NS, '> tab['+tid+'/'+fid+'].res =', res);
        });
    }

    /**
     * Configuration Storage
     */
    const $CONF = {
        _storage: localStorage||{},
        set : function(name, val){
            this._storage.setItem(name, val);
        },
        get : function(name, def){
            const val = this._storage.getItem(name);
            return val === undefined || val === null ? def : val;
        },
    }

    /**
     * TAB Manager
     * - lookup by tab-id.
     */
    const $TAB_MGR = {
        TAB_MAP : {},
        //! message via content.js
        onMessage : function(message, sender, sendResponse) {
            const thiz = this;
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
                // if root window, fid should 0
                if (!fid) {
                    thiz.TAB_MAP[tid] = {sid, url, fid, tid, frames:{}};
                } else {
                    const tab = thiz.TAB_MAP[tid];
                    if (tab && tab.frames) tab.frames[fid] = {sid, url, fid, tid};
                }
                // send back current info.
                sendResponse({type:'ready', frameId: fid, tabId: tid})
            } else if (type == 'window.unload'){
                if (!fid) delete thiz.TAB_MAP[tid];
            }
            return true;
        },
        query : function(url){
            const thiz = this;
            _log(NS, '> query.url =', url);
            url = url||'';
            const list = Object.keys(thiz.TAB_MAP).reduce((L, tid)=>{
                const tab = thiz.TAB_MAP[tid];
                if (!tab) return L;
                if (!url || (tab.url && tab.url.indexOf(url) >=0)){
                    L.push(tab);
                }
                return L;
            }, [])
            return {list};
        },
    }
        
    /**
     * Main Service Object
     */
    const $LEM = {
        _tid: 2,                     // default tab-id.
        //- send message to content, then get-back result.
        sendMessage: function(id, cmd, data, fid){
            fid = _$.N(fid, 0);
            return new Promise((resolve, reject)=>{
                id = id||this._tid;         //TODO - define target-id. (currently as tab-id yet)
                const tid = id;
                _log(NS, '> tab['+tid+'/'+fid+'].send =', {cmd, data});
                chrome.tabs.sendMessage(tid, {cmd, data}, {frameId: fid}, function(res) {
                    _log(NS, '> tab['+tid+'/'+fid+'].res =', res);
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
                    err && _err(NS, '! tab['+tid+'/'+fid+'].error =', err);
                    !err && _inf(NS, '! tab['+tid+'/'+fid+'].data =', data);
                    return err ? reject(err) : resolve(data);
                })
            })
        },
        //! hi()         ex: `$LEM.hi('hoho')`
        hi: function(name, id = 0){
            return this.sendMessage(id, 'hi', {name})
        },
        //! set/get of tid. (if id = 0, returns current)
        tid: function(id){
            id = _$.N(id, 0);
            if (id) {
                this._tid = id;
                $CONF.set('tid', id);
            }
            return this._tid;
        },
        listTabs: function(url){
            return $TAB_MGR.query(url);
        },
        //! evaluate()   
        // ex: `$LEM.eval('document.location')`. 
        // ex: `$LEM.eval('ADMIN.openProfile()')`. 
        eval: function(text, tid = 0, fid = 0){
            return this.sendMessage(tid, 'eval', {text}, fid)
        },
        //! navigate to url.
        navigate : function(url, tid = 0){
            tid = tid || this._tid;
            _inf(NS, '! tab['+tid+'].url :=', url);
            const param = typeof url == 'string' ? {url: url} : url;
            return chrome.tabs.update(tid, param, function(tab) {
                _log(NS, '>> updated.tab =', tab);
            });
        },
    }

    //! do initialize.
    if (true)
    {
        // message listener.
        chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
            return $TAB_MGR.onMessage(message, sender, sendResponse);
        });

        // initial tab-id.
        const tid = $CONF.get('tid');
        $LEM._tid = _$.N(tid, 2);
        _inf(NS, '! inited. tid :=', $LEM.tid());
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


    /**
     * 
     * 
     * @param {*} message {cmd,param/data,tid?,fid?}
     */
    WebSocketClient.prototype.onmessage = function (message){
        try{
            const $msg = (()=>{
                if (typeof message == 'string' && message.startsWith('{') && message.endsWith('}')){
                    return JSON.parse(message);
                }
                return {cmd:'msg', message: message}
            })();
            const cmd     = $msg.cmd||'';                    // command type
            const param   = $msg.param||$msg.data||{};       // message payload.
            const tid     = _$.N($msg.tid, 0);               // tab-id
            const fid     = _$.N($msg.fid, 0);               // frame-id
            this.oncommand(cmd, param, tid, fid, $msg);
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
    WebSocketClient.prototype.oncommand = function(cmd, msg, tid, fid, $msg){
        _log('WebSocketClient: oncommand!');
        _log('> cmd =', cmd, ', msg=', msg, (tid||fid) ? '@'+tid+'/'+fid:'');
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
                const ret = handler(msg, tid, fid);
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
    const $WSC = (()=>{
        if(!WebSocketClient) return null;
        const wsc = new WebSocketClient();

        const WS_URL = $CONF.get('ws.url', 'ws://localhost:8080');
        _log(NS, '! WebSocketClient.open :=', WS_URL);
        WS_URL && wsc.open(WS_URL);

        return wsc;
    })();

    //! common client handler.
    if($WSC)
    {
        //! test promised
        $WSC.setHandler('hi', function(data, tid, fid){
            return new Promise((resolve, reject)=>{
                setTimeout(()=>{
                    resolve({name:'chrome'})
                }, 0);
            })
        })
        //! tid(tab-id).
        $WSC.setHandler('tid', function(data){
            return $LEM.tid(data);
        })
        //! eval(text) in injected.js.
        $WSC.setHandler('eval', function(data, tid, fid){
            return $LEM.eval(data, tid, fid);
        })
        //! navigate to url
        $WSC.setHandler('navigate', function(data, tid){
            return $LEM.navigate(data, tid);
        })
    }
    
    //! export to public.
    window.$LEM = $LEM;

})(window||global);
