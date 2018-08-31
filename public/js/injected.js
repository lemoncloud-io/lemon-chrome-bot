function hello(){
    _log('hello lemon!');
    window.postMessage({hello: 'world via inject'}, '*');
}


//! Main Function Body
(function (window) {
    const NS = 'inject';

    _log(NS, 'INFO! --------------- loading.');
    //! wait for loading jQuery.
    _log(NS, '> jQuery =', typeof jQuery);

    // via window.postMessage()......
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
    })


    //! 

})(window||global)