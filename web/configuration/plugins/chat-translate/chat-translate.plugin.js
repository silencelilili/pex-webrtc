// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    var requestToken;
    var parser = new DOMParser();

    // Init function called by the PluginService when plugin is loaded
    function load(participants$, conferenceDetails$) {
        var xhr = new XMLHttpRequest();
        xhr.onload = (event) => {
            requestToken = event.target.responseText;
        };
        xhr.onerror = (event) => {
            console.error('error requesting translation token', event);
        }
        xhr.open('post', 'https://api.cognitive.microsoft.com/sts/v1.0/issueToken');
        xhr.setRequestHeader('Ocp-Apim-Subscription-Key', '');
        xhr.send();

        window.PEX.actions$.ofType(window.PEX.actions.SEND_CHAT_MESSAGE)
            .subscribe((action) => {
                console.log('sendRequest', action);
                // trx:<from>:<to>:<text>
                if (action.payload.startsWith('trx:')) {
                    var bits = action.payload.split(':');
                    var from = bits[1];
                    var to = bits[2];
                    var text = bits[3]
                    sendRequest(text, from, to)
                        .then((response) => {
                                console.log('got sendRequest', response);
                                window.PEX.pluginAPI.sendChatMessage({
                                    type: window.PEX.actions.SEND_CHAT_MESSAGE,
                                    payload: '\uD83E\uDD16 ' + response
                                });
                            },
                            (error) => {
                                console.log('got error on sendRequest', error);
                            });
                } else {
                    console.log('normal message, ignore');
                }
            });
    }

    function sendRequest(text, from, to) {
        return new Promise((resolve, reject) => {
            // use script tag in body
            console.log('translation sending request');
            var s = document.createElement("script");
            s.src = "https://api.microsofttranslator.com/V2/Ajax.svc/Translate" +
                "?appId=Bearer " + encodeURIComponent(requestToken) +
                "&from=" + encodeURIComponent(from) +
                "&to=" + encodeURIComponent(to) +
                "&text=" + encodeURIComponent(text) +
                "&oncomplete=translateCallBack";
            window.translateCallBack = function(result) {
                console.log('translate callback fired with:', result);
                resolve(result);
            }
            s.onerror = function(error) {
                console.log('got error on translate callback:', error);
                reject(error);
            };
            console.log('trans');
            document.body.appendChild(s);
        });
    };

    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload chat-translate-plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    window.PEX.pluginAPI.registerPlugin({
        id: 'chat-translate-plugin-1.0',
        load: load,
        unload: unload
    });

})(); // End IIFE
