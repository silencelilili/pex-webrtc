// Use IIFE (Immediately Invoked Function Expression) to wrap the plugin to not pollute global namespace with whatever is defined inside here
(function() {
    var canvas;
    var conferenceMediatype;

    // Init function called by the PluginService when plugin is loaded
    function load(participants$, conferenceDetails$) {
        canvas = document.createElement('canvas');
        conferenceDetails$.subscribe(details => {
            conferenceMediatype = details.mediaType;
        });
    }

    // context menu item functions
    function openScreenshotDialog() {
        if (conferenceMediatype === 'video') {
            PEX.pluginAPI.openTemplateDialog({
                title: 'Select video and take screenshot',
                body: `<div style="display: flex; flex-wrap: wrap; justify-content: center;">
                         <select name="videoSelection" id="videoSelection" style="padding: 5px; margin: 5px; line-height: 45px; font-size: 16px; width: 120px;">
                             <option value="mainVideo" selected>Main video</option>
                             <option value="selfviewVideo">Selfview</option>
                         </select>
                         <br>
                         <button id="screenshotButton" class="dialog-button green-action-button">Take</button>
                     </div>`
            }).subscribe(dialogRef => {
                // wait until the dialog dom has been fully initialized
                dialogRef.viewInit$.subscribe(() => {
                    document.getElementById('screenshotButton').addEventListener(
                        'click',
                        () => takeScreenshot(document.getElementById('videoSelection').value));
                });

                dialogRef.close$.subscribe(() => {});
            });
        } else {
            PEX.pluginAPI.openTemplateDialog({
                title: 'No video now',
            }).subscribe();
        }
    }

    function takeScreenshot(id) {
        var videoElement = document.getElementById(id);
        if (videoElement) {
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            var videoImg = canvas.toDataURL('image/png');
            var x = window.open();
            x.document.write("<img width='100%' src='" + videoImg + "'>");
        }
    }

    // unload / cleanup function
    function unload() {
        // clean up any globals or other cruft before being removed before i get killed.
        console.log('unload screenshot plugin');
    }

    // Register our plugin with the PluginService - make sure id matches your package.json
    PEX.pluginAPI.registerPlugin({
        id: 'screenshot-plugin-1.0',
        load: load,
        unload: unload,
        openScreenshotDialog: openScreenshotDialog
    });

})(); // End IIFE
