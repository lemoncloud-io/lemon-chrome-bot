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
    const NS = 'inject';

    _log(NS, 'INFO! --------------- loading.');
    _log(NS, '> jQuery =', typeof jQuery);
    _log(NS, '> href =', location && location.href || 'N/A');

    //! prepare ID of self.
    const ID = 12*10000 + Math.floor(Math.random()*10000);
    _log(NS, '> ID =', ID);
   
    // internal message broker to communicate with content.js.
    const MSG_BROKER = {
        ID : 'MB'+ID,
        MAGIC_KEY : '#lemon-injected',
        NEXT_ID : 1,
        _CALLBACK : {},
        onMessage: function(event){
            // Only accept messages from same frame
            if (!event || event.source !== window)    return;
            const message = event.data || {};
            _log(NS, '> message@'+(this.ID)+' =', message);
            // Only if valid message type from this.
            if (!message.mkey || !message.source || !message.target) return;
            const id = message.id||0;
            const cmd = message.cmd||'';
            _inf(NS, '! message@'+(this.ID)+'/'+cmd+'/'+id+' =', message);

            //! For receiving message.
            if (message.target === this.ID)
            {
                const cb = this._CALLBACK[id];
                const err = message.error;
                const data = message.data;
                if (cb) cb(err, data);
                delete this._CALLBACK[id];
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
                    delete this._CALLBACK[id];
                }, 5000)
            })
        },
    };
    window.addEventListener('message', (event)=>MSG_BROKER.onMessage(event));
   
    //! main body.
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