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
function injectJs(srcFile) {
    var scr = document.createElement('script');
    scr.src = srcFile;
    document.getElementsByTagName('head')[0].appendChild(scr);
}

//! Main Function Body
(function (window) {
    const NS = 'content';

    _log(NS, 'INFO! --------------- loading.');

    //! prepare ID of self.
    const ID = 11*10000 + Math.floor(Math.random()*10000);
    _log(NS, '> ID =', ID);

    // DO ON DUCEMENT.READY()
    $(document).ready(function() {
        _log(NS, 'lemon ready!');
        _log(NS, '> loc=', document.location.href);
    
        //! load injected script. (do expose command)
        // injectJs(chrome.extension.getURL('js/jquery-3.3.1.slim.min.js'));
        injectJs(chrome.extension.getURL('js/bootloader.js'));
        injectJs(chrome.extension.getURL('js/injected.js'));
    
        // chrome.extension.sendMessage({type: 'document.ready'}, function(data) { 
        //     console.log('! rback.es =', data);
        // });
        chrome.runtime.sendMessage({type: 'document.ready'}, function(response) { 
            _inf(NS, '! cont.res =', response);
            _inf(NS, '> #item-type =', $('#item-type').val())

            //NOTE! 아래와 같은 방법으로 화면 변경 가능함. (BUT 스크립트 호출은 안됨)
            // $('#item-type').val('HAHAHA');                              //INFO! - html 변경은 가능한듯.
            // _inf(NS, '> SITE_CODE=', typeof SITE_CODE, SITE_CODE);      //WARN! - 이건 에러 발생함.
        });
    })

    // message between content.js <-> background.js
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {  
        _log(NS, 'chrome.onMessage()... message=', message);
        if(message.content) {
            sendResponse({content: "response message"});
            return true; // This is required by a Chrome Extension
        }
    })
    
    // internal message broker to communicate with injected.js.
    const INJ_BROKER = {
        ID : 'IJ'+ID,
        MAGIC_KEY : '#lemon-content',
        NEXT_ID : 0,
        onMessage: function(event){
            // Only accept messages from same frame
            if (!event || event.source !== window)    return;
            const message = event.data || {};
            _log(NS, '> message@'+(this.ID)+' =', message);
            // Only if valid message type from this.
            if (!message.mkey || !message.source) return;
            _inf(NS, '! message@'+(this.ID)+' =', message);

            //! For receiving message via injected.js (target must be "")
            if (!message.target)
            {
                _log(NS, '>> cmd =', message.cmd);
                //! send back to origin.
                if (message.cmd == 'hello!'){
                    const msg2 = Object.assign({}, message);
                    msg2.source = this.ID,
                    msg2.target = message.source;
                    msg2.error = null;
                    msg2.data = {name: 'content'};
                    _log(NS, '>> send-back =', msg2);
                    window.postMessage(msg2, '*');
                }
            }
        },
        postMessage: function(cmd, data, target){
            cmd = cmd||'';
            target = target||-1;
            const message = {
                id: this.NEXT_ID++,
                mkey: this.MAGIC_KEY,
                source: this.ID,
                target: target,
                cmd: cmd,
            };
            if (data) message.data = data;
            window.postMessage(message, '*');
        },
    };
    window.addEventListener('message', (event)=>INJ_BROKER.onMessage(event));
        
})(window||global);
