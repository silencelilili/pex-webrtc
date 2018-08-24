// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    var state$ = PEX.pluginAPI.createNewState({});

    // called by the PluginService when plugin is loaded
    function load(participants$, conferenceDetails$) {
        participants$.subscribe(participants => {
            var state;
            participants.map(participant => {
                if (participant.spotlight === 0) {
                    state = Object.assign({}, state, {
                        [participant.uuid]: {
                            icon: 'configuration/plugins/spotlight/star.svg#star',
                            label: 'Spotlight'
                        }
                    });
                } else {
                    state = Object.assign({}, state, {
                        [participant.uuid]: {
                            icon: 'configuration/plugins/spotlight/star-fill.svg#star-fill',
                            label: 'Unspotlight'
                        }
                    });
                }
            });

            if (state) {
                state$.next(state);
            }
        });
    }

    // item click functions
    function spotlightParticipant(participant) {
        if (participant.spotlight === 0) {
            PEX.pluginAPI.spotlightOnParticipant(participant.uuid);
        } else {
            PEX.pluginAPI.spotlightOffParticipant(participant.uuid);
        }
    }

    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload spotlight-plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    PEX.pluginAPI.registerPlugin({
        id: 'spotlight-plugin-1.0',
        load: load,
        unload: unload,
        spotlightParticipant: spotlightParticipant,
        state$: state$,
    });

})(); // End IIFE
