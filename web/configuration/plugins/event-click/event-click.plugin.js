// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    // Init function called by the PluginService when plugin is loaded
    function load(participants$, conferenceDetails$) {
      PEX.actions$.ofType(PEX.actions.SELECT_EVENT)
            .filter(action => action.payload.action.type === PEX.actions.PARTICIPANT_CONNECT_SUCCESS)
            .subscribe(action => {
                var participantName = action.payload.action.payload.name;
                var src = 'https://www.pexip.com/sites/pexip/themes/o7theme/logo.png';
                PEX.pluginAPI.openTemplateDialog({
                    title: participantName,
                    body: `<div style="padding:10px">
                               <p style="text-align:middle">
                                  <img src="` + src + `" style="background-color:#F38B00; width: 100px;">
                               </p>
                               <button id="okButton" class="dialog-button blue-action-button">OK</button>
                           </div>`
                }).subscribe(dialogRef => {
                  // wait until the dialog dom has been fully initialized
                  dialogRef.viewInit$.subscribe(() => {
                      document.getElementById('okButton').addEventListener(
                          'click',
                          () => dialogRef.close());
                  });
                });
            });
    }

    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload event click plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    PEX.pluginAPI.registerPlugin({
        id: 'event-click-plugin-1.0',
        load: load,
        unload: unload
    });

})(); // End IIFE
