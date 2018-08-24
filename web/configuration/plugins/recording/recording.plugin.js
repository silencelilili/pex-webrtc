// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    var state$ = window.PEX.pluginAPI.createNewState({});
    var uuid;
    var connecting;

        // Init function called by the PluginService when plugin is loaded
        function load(participants$, conferenceDetails$) {
            participants$.subscribe(participants => {
                var state;
                if (participants.filter(participant => participant.uuid === uuid && participant.isStreaming).length > 0) {
                    state = {
                        icon: 'configuration/plugins/recording/stopRecording.svg#stopRecording',
                        label: 'Stop recording'
                    }
                } else {
                    state = {
                        icon: 'configuration/plugins/recording/startRecording.svg#startRecording',
                        label: 'Start recording'
                    }
                }

                if (state) {
                    state$.next(state);
                }
            });
        }

    // context menu item functions
    function recordConference(participants) {
        if (!connecting) {
            if (participants.filter(p => p.uuid === uuid && p.isStreaming).length > 0) {
                stopRecording(uuid);
            } else {
                startRecording();
            }
        }
    }

    function startRecording() {
        PEX.pluginAPI.openTemplateDialog({
            title: 'Record alias',
            body: `<form>
                      <input id="simpleRecordPluginAlias" class="pex-text-input" placeholder="Type the alias details here" autofocus />
                      <button class="dialog-button buttons green-action-button" style="margin-top: 40px" id="recordAliasButton">Start</button>
                   </form>`
        }).subscribe(dialogRef => {
            dialogRef.viewInit$.subscribe(() => {
                if (localStorage.pexSimpleRecordPluginAlias) {
                    document.getElementById('simpleRecordPluginAlias').value = localStorage.pexSimpleRecordPluginAlias;
                }

                document.getElementById('recordAliasButton').addEventListener(
                    'click',
                    (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        const value = document.getElementById('simpleRecordPluginAlias').value;
                        if(!value) { return; }

                        localStorage.pexSimpleRecordPluginAlias = value;
                        var alias = localStorage.pexSimpleRecordPluginAlias;
                        var protocol = 'auto';

                        // const matches = localStorage.pexSimpleRecordPluginAlias.match(/^([^:]+):(.+)/);
                        // if (matches && ['sip', 'rtmp', 'mssip', 'h323'].indexOf(matches[1]) > -1) {
                        //     alias = matches[2];
                        //     protocol = matches[1];
                        // }

                        connecting = true;

                        window.PEX.pluginAPI.dialOut(
                            alias, protocol, 'guest',
                            (value) => {
                                if (value.result.length === 0) {
                                    connecting = false;
                                    document.getElementById('simpleRecordPluginAlias').style.border = '2px solid red';
                                    document.getElementById('simpleRecordPluginAlias').value = '';
                                    document.getElementById('simpleRecordPluginAlias').placeholder = 'check alias and retry';
                                    localStorage.pexSimpleRecordPluginAlias = '';
                                } else {
                                    connecting = false;
                                    uuid = value.result[0];
                                    dialogRef.close();
                                }
                            }, {
                                streaming: true
                            });
                    }
                );
            });
        });
        // }
    }

    function stopRecording(uuid) {
        window.PEX.pluginAPI.disconnectParticipant(uuid);
    }

    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload recoding-plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    PEX.pluginAPI.registerPlugin({
        id: 'recording-plugin-1.0',
        load: load,
        unload: unload,
        recordConference: recordConference,
        state$: state$,
    });

})(); // End IIFE
