/**
 * Injected script
 * - will be loaded in each window by 'content.js'
 * 
 * 
 * 
 * author: Steve <steve@lemoncloud.io>
 * date : 2018-09-03
 *
 * Copyright (C) 2018 LemonCloud Co Ltd. - All Rights Reserved.
 */
//! Main Function Body
(function (window) {
    const NS = 'IJ';

    _log(NS, 'INFO! --------------- loading.');
    _log(NS, '> href =', location && location.href || 'N/A');

    //! catch self-id from script.id.
    const getScriptID = function(){
        const scripts = document.getElementsByTagName('script');
        const len = scripts && scripts.length || 0;
        for(var i=0; i<len; i++){
            const $scr = scripts[i]||{};
            const src = $scr.src||'';
            const id = $scr.id||'';
            if (src && src.indexOf('/js/injected.js') > 0) return id;
        }
        return '';
    }
    // window.getScriptID = getScriptID;

    //! prepare ID of self.
    const ID = getScriptID() || (12*10000 + Math.floor(Math.random()*10000));
    _log(NS, '> ID =', ID);
   
    // internal message broker to communicate with content.js.
    const MSG_BROKER = {
        ID : NS+ID,
        MAGIC_KEY : '#lemon-injected',          // magic-key used for verification of reponse.
        NEXT_ID : 1,                            // internal message counter.
        HANDLERS : {},                          // map to handler for cmd.
        _CALLBACK : {},
        onMessage: function(event){
            // Only accept messages from same frame
            // if (!event || event.source !== window)    return;
            const message = event.data || {};
            // _log(NS, '> message@'+(this.ID)+':', message);

            //! Only if valid message type from this.
            if (!message.mkey || !message.source || !message.target) return;

            const id = message.id||0;
            const cmd = message.cmd||'';
            _inf(NS, '! message@'+(this.ID)+'/'+cmd+'/'+id+' =', message);

            //! For response message.
            if (message.target === this.ID && message.mkey === this.MAGIC_KEY)
            {
                const cb = this._CALLBACK[id];
                this._CALLBACK[id] = undefined;
                const err = message.error;
                const data = message.data;
                if (cb) cb(err, data);
            }
            //! For known command, do handle.
            else if (message.target === this.ID && message.cmd)
            {
                //! prepare defualt response based on received message.
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
                        const ret = handler(message.data, message);
                        if (ret && ret instanceof Promise){
                            return ret
                            .then(_ => {
                                response.data = _;
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
                        response.data = ret;
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
            target = target||'';
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

    //! cmd:hi handler in injected. (for content)
    MSG_BROKER.setMessageHandle('hi', (data, msg)=>{
        _log(NS, '! hi... data=', data);
        return {name: 'injected', loc: location.href};
    })

    //! hello() to test.
    window.hello = function(name){
        name = name||'hello!'
        _log(NS, `hello ${name}!`);
        // MSG_BROKER.postMessage(name);
        return MSG_BROKER.sendMessage(name)
        .then(_ => {
            _log(NS, '> hello.res =', _);
        })
        .catch(e => {
            _err(NS, '> hello.err =', e);
        })
    }

})(window||global)