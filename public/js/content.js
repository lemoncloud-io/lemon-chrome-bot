/**
 * Content script
 * - chrome extension's main content script.
 * 
 * Will be loaded at `document_end`.
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
    // In ContentScript.js
    // chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {  
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {  
        _log(NS, 'chrome.onMessage()... message=', message);
        if(message.content) {
            sendResponse({content: "response message"});
            return true; // This is required by a Chrome Extension
        }
    })
    
    // Via Inject.js.
    window.addEventListener('message', function(event) {
        // Only accept messages from same frame
        if (event.source !== window) {
            return;
        }
        _log(NS, 'window.on-message()... event=', event);
      
        var message = event.data;
        _log(NS, '> message =', message);
        
        // Only accept messages that we know are ours
        if (typeof message !== 'object' || message === null || !message.hello) {
          return;
        }
        // chrome.runtime.sendMessage(message);
    });
    
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

})(window||global);
