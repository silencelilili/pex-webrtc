// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    // Init function called by the PluginService when plugin is loaded
    function load(participants$, conferenceDetails$) {}

    // context menu item functions
    function changeConferenceLayout(conferenceDetails) {
        PEX.pluginAPI.openTemplateDialog({
            title: 'Layout control',
            body: `<div style="display: flex; flex-wrap: wrap; justify-content: center;">
                       <!-- actors_overlay_text can be set to auto or off on each of the layouts.-->
                       <button class="dialog-button blue-action-button" onclick="window.PEX.pluginAPI.changeConferenceLayout({layouts:[{actors: [], actors_overlay_text: 'off', audience: [], layout: '4:0', plus_n: 'auto', vad_backfill: true}]})">Equal</button>
                       <button class="dialog-button blue-action-button" onclick="window.PEX.pluginAPI.changeConferenceLayout({layouts:[{actors: [], actors_overlay_text: 'off', audience: [], layout: '1:0', plus_n: 'auto', vad_backfill: true}]})">1+0</button>
                       <button class="dialog-button blue-action-button" onclick="window.PEX.pluginAPI.changeConferenceLayout({layouts:[{actors: [], actors_overlay_text: 'off', audience: [], layout: '1:7', plus_n: 'auto', vad_backfill: true}]})">1+7</button>
                       <button class="dialog-button blue-action-button" onclick="window.PEX.pluginAPI.changeConferenceLayout({layouts:[{actors: [], actors_overlay_text: 'off', audience: [], layout: '1:21', plus_n: 'auto', vad_backfill: true}]})">1+21</button>
                       <button class="dialog-button blue-action-button" onclick="window.PEX.pluginAPI.changeConferenceLayout({layouts:[{actors: [], actors_overlay_text: 'off', audience: [], layout: '2:21', plus_n: 'auto', vad_backfill: true}]})">2+21</button>
                       <button class="dialog-button blue-action-button" onclick="window.PEX.pluginAPI.changeConferenceLayout({layouts:[]})">Default</button>
                   </div>`
        }).subscribe();
    }
    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload layout plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    PEX.pluginAPI.registerPlugin({
        id: 'layout-plugin-1.0',
        load: load,
        unload: unload,
        changeConferenceLayout: changeConferenceLayout,
    });

})(); // End IIFE
