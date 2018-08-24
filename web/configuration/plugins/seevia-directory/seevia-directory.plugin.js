// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    // Init function called by the PluginService when plugin is loaded
    function load(participants$, conferenceDetails$) {}

    // context menu item functions
    function seeviaDirectoryDial() {
        PEX.pluginAPI.openTemplateDialog({
            title: null,
            body: `<iframe src="https://webapp.seevia.me/customers/f87cdf7f9f99472ebd396c4019915766/applications/pexip" width="480px" height="380px" style="max-width: 100%; max-height: 100%; border: none;"></iframe>`
        }).subscribe();
    }
    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload seevia-directory plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    PEX.pluginAPI.registerPlugin({
        id: 'seevia-directory-plugin-1.0',
        load: load,
        unload: unload,
        seeviaDirectoryDial: seeviaDirectoryDial,
    });

})(); // End IIFE
