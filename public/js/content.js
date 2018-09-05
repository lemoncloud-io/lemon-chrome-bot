/**
 * Content script
 * - chrome extension's main content script.
 * 
 * Will be loaded at `document_end`.
 * 
 * 
 * 
 * 
 * author: Steve <steve@lemoncloud.io>
 * date : 2018-08-31
 *
 * Copyright (C) 2018 LemonCloud Co Ltd. - All Rights Reserved.
 */
function injectJs(srcFile, id) {
    var scr = document.createElement('script');
    scr.src = srcFile;
    if (id) scr.id = id;
    document.getElementsByTagName('head')[0].appendChild(scr);
}

//! Main Function Body
(function (window) {
    const NS = 'CN';
    const thiz = {};   

    _log(NS, 'INFO! --------------- loading.');
    _log(NS, '> href =', location && location.href || 'N/A');

    //! prepare ID of self.
    const ID = 11*10000 + Math.floor(Math.random()*10000);
    _log(NS, '> ID =', ID);

    //! load bootloader before document.ready.
    injectJs(chrome.extension.getURL('js/bootloader.js'));

    // DO ON DUCEMENT.READY()
    $(document).ready(function() {
        _log(NS, 'lemon ready!');
        _log(NS, '> loc=', document.location.href);
    
        //! load injected script. (do expose command)
        injectJs(chrome.extension.getURL('js/injected.js'), ID);

        //! send ready.
        const msg = {type: 'document.ready', id: ID, href: location.href};
        chrome.runtime.sendMessage(msg, function(res) { 
            _inf(NS, '! cont.res =', res);
            if (res && res.type == 'ready'){
                delete res.type;
                Object.assign(thiz, res);
            }
        });
    })
    //! send unload.
    $(window).on('unload', function(){
        _log(NS, '! window.unload..');
        const msg = {type: 'window.unload', id: ID, href: location.href};
        chrome.runtime.sendMessage(msg);
    });

    // message via background.js
    const MSG_HANLDER = {
        HANDLERS: {},
        setMessageHandle: function(cmd, callback){
            if (typeof callback == 'function'){
                this.HANDLERS[cmd] = callback;
            } else {
                throw new Error('Invalid type:'+(typeof callback));
            }
        },
    };
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {  
        message = message ||{};
        sender = sender ||{};
        _inf(NS, 'chrome.onMessage()...');
        _log(NS, '> message =', message);
        _log(NS, '> sender =', sender);

        const cmd   = message.cmd||'';
        const sid   = sender.id || '';

        //! decode by cmd, and send response.
        const handler = cmd && MSG_HANLDER.HANDLERS[cmd] || null;
        handler && (()=>{
            const res = {error:null, data:null};
            try {
                const ret = handler(message.data, message);
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
            sendResponse(res)
        })();

        //WARN! - should return 'true' for asynchronious response.
        return true;
    });
    
    // internal message broker to communicate with injected.js.
    const MSG_BROKER = {
        ID : NS+ID,                             // unique id
        MAGIC_KEY : '#lemon-content',           // magic-key used for response verification.
        NEXT_ID : 1,                            // internal message-count.
        HANDLERS : {},                          // map to handler for cmd.
        _CALLBACK : {},                         // callback handler.
        onMessage: function(event){
            // Only accept messages from same frame
            // if (!event || event.source !== window)    return;
            const message = event.data || {};
            // _log(NS, '> message@'+(this.ID)+' =', message);

            //! Only if valid message type from injected.
            if (!message.mkey || !message.source) return;

            const id = message.id||0;
            const cmd = message.cmd||'';
            _inf(NS, '! message@'+(this.ID)+'/'+cmd+'/'+id+' =', message);

            const _parse_data = (data)=>{
                if (!data) return data;
                if (typeof data == 'string' && data.startsWith('{') && data.endsWith('}')) return JSON.parse(data);
                if (typeof data == 'string' && data.startsWith('[') && data.endsWith(']')) return JSON.parse(data);
                return data;
            }

            //! For response message.
            if (message.target === this.ID && message.mkey === this.MAGIC_KEY)
            {
                _log(NS, '>> cb.cmd =', cmd);
                const cb = this._CALLBACK[id];
                this._CALLBACK[id] = undefined;
                const err = message.error;
                const data = _parse_data(message.data);
                if (cb) cb(err, data);
            }
            //! For receiving message via injected.js (target must be "" or ID)
            else if ((!message.target || message.target === this.ID) && message.cmd)
            {
                _log(NS, '>> cmd =', cmd);
                //! send back to origin.
                if (cmd == 'hello!'){
                    const msg2 = Object.assign({}, message);
                    msg2.source = this.ID,
                    msg2.target = message.source;
                    msg2.error = null;
                    msg2.data = {name: 'content'};
                    _log(NS, '>> send-back =', msg2);
                    window.postMessage(msg2, '*');
                }

                //! prepare defualt response based on received message.
                // const response = {source: this.ID, mkey: message.mkey, target: message.source, error: null, data: null};
                const response = (()=>{
                    const msg2 = Object.assign({}, message);
                    msg2.source = this.ID,
                    msg2.target = message.source;
                    msg2.error  = null;
                    msg2.data   = null;
                    return msg2;
                })();

                //! decode by cmd, and send response.
                const handler = cmd && this.HANDLERS[cmd] || null;
                handler && ((handler)=>{
                    try {
                        const ret = handler(_parse_data(message.data), message);
                        if (ret && ret instanceof Promise){
                            return ret
                            .then(_ => {
                                response.data = _ && JSON.stringify(_) || _;
                                return response;
                            })
                            .catch(e => {
                                _err(NS, '>> handle.ret.ERR!=', e);
                                response.error = e;
                                return response;
                            })
                            .then(res => {
                                window.postMessage(response, '*');
                                return res;
                            })
                        }
                        response.data = ret && JSON.stringify(ret) || ret;
                    } catch(e) {
                        _err(NS, '>> handle.ERR!=', e);
                        response.error = e;
                    }
                    window.postMessage(response, '*');
                })(handler);
            }
        },
        postMessage: function(cmd, data, target){
            cmd = cmd||'';
            target = target||'*';           // target must NOT empty.
            const message = {
                id: this.NEXT_ID++,
                mkey: this.MAGIC_KEY,
                source: this.ID,
                target: target,
                cmd: cmd,
            };
            if (data) message.data = data;
            window.postMessage(message, '*');
            return message;
        },
        sendMessage: function(cmd, data, target){
            const message = this.postMessage(cmd, data, target);
            if (!message || !message.id) return Promise.reject(new Error('Invalid message!'));
            const id = message.id;
            return new Promise((resolve, reject)=>{
                //! default callback handler.
                this._CALLBACK[id] = (err, data)=>{
                    if (err) reject(err);
                    else resolve(data)
                }
                //! timeout handler. (default in 5sec)
                setTimeout(()=>{
                    if (this._CALLBACK[id]) reject(new Error('timeout'));
                    this._CALLBACK[id] = undefined;
                }, 5000)
            })
        },        
        setMessageHandle: function(cmd, callback){
            if (typeof callback == 'function'){
                this.HANDLERS[cmd] = callback;
            } else {
                throw new Error('Invalid type:'+(typeof callback));
            }
        },
    };
    window.addEventListener('message', (event)=>MSG_BROKER.onMessage(event));

    //! cmd handler via background.
    MSG_HANLDER.setMessageHandle('hi', (data, msg)=>{
        _log(NS, '! back.hi() data=', data);
        return new Promise((resolve,reject)=>{
            const res = Object.assign({msg: 'hi~ '+(data.name||'nobody')}, thiz);
            resolve(res);
        });
    })
    MSG_HANLDER.setMessageHandle('eval', (data, msg)=>{
        _log(NS, '! back.eval() data=', data);
        return MSG_BROKER.sendMessage('eval', data, 'IJ'+ID)
        .then(_ => {
            _log(NS, '>> eval.res =', _);
            return _;
        })
        .catch(e => {
            _err(NS, '>> eval.err =', e);
            throw e;
        })
    })

    //! cmd:hi handler in content. (for injected)
    MSG_BROKER.setMessageHandle('hi', (data, msg)=>{
        _log(NS, '! hi... data=', data);
        return new Promise((resolve, reject)=>{
            setTimeout(()=>{
                resolve({name: 'waited!'})
            }, 1500)
        })
    });
    MSG_BROKER.setMessageHandle('low', (data, msg)=>{
        _log(NS, '! low... data=', data);

        setTimeout(()=>{
            _log(NS, '! ----------- trigger cmd to inject:'+msg.source);
            MSG_BROKER.sendMessage('hi', {name:'low'}, msg.source)
            .then(_ => {
                _log(NS, '> hi@injected.res =', _);
            })
            .catch(e => {
                _err(NS, '> hi@injected.err =', e);
            })
        }, 100)

        return {name: 'triggered to injected'};
    });
        
})(window||global);
