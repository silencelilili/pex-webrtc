'use strict';
angular.module('pexapp')

.constant('platformSettings', {
    realHasWebRTC: navigator.msLaunchUri ? false : navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || false, // changes here should be duplicated below
    hasWebRTC: navigator.msLaunchUri ? false : navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) || false,
    screenshareSupported: window.chrome && window.chrome.webstore || angular.isDefined(window.require),
    isDesktopClient: angular.isDefined(window.process) && window.process.platform,
    isAndroidClient: angular.isDefined(window.srv),
    isWebClient: !((angular.isDefined(window.process) && window.process.platform) || angular.isDefined(window.srv)),
    volumeControlsEnabled: true,
    supportsVideo: true,
    keenProjectId: '557575d690e4bd6c1d8184e5',
    keenWriteKey: '3b7d272c6795270ebc07a922183c78bb5af84950fb4e21eea6fe46467dc1ee202f798833340ba9d97c2bb19c6de98379231f17da1a487d1ceabc37cd4836a3d61e0c5d4af6c156e66416cfadb97395b8f502507ae26cd3d1ebe1c81a3e7385a99b92a9db2faf72c8631b100d8ed25884'
})

.constant('applicationSettings', angular.extend({
    serverAddress: (window.srv || window.nw) ? null : window.location.host,

    dialOutProtocols: [
        'sip',
        'h323',
        'mssip',
        'rtmp',
        'rtsp',
        'auto',
    ],
    defaultDialOutProtocol: 'sip',

    registrationEnabled: angular.isDefined(window.require) || window.srv, //enable for desktop + android client

    bandwidths: [{
        name: 'IDS_BANDWIDTH_LOW',
        value: 192 + 64
    }, {
        name: 'IDS_BANDWIDTH_MEDIUM',
        value: 512 + 64
    }, {
        name: 'IDS_BANDWIDTH_HIGH',
        value: 1200 + 64
    }, {
        name: 'IDS_BANDWIDTH_MAXIMUM',
        value: 2400 + 64
    }],

    defaultDialOutRole: 'host', // 'host' or 'guest'

    enableFullMotionPresentation: true,

    // Uncomment to use PNG for presentation (higher quality but uses more bandwidth)
    // enablePNGPresentation: true,

    // Uncomment to enable the use of H264
    // h264Enabled: true,

    // Uncomment to forget user name and conference name on start page
    // clearLastUsed: true,

    languages: {
        'English (US)': 'configuration/languages/en-us.json',
        // 'Norsk (Bokmål)': 'configuration/languages/no-nb.json' // Example additional language (make sure the language file exist)
    },

    themes: {
        'Default': 'configuration/themes/default',
        // 'Dark': 'configuration/themes/dark' // Example additional theme
    },

    ringtones: {
        'IDS_SETTINGS_DEFAULT': 'ringtones/default.wav'
    },

    // Uncomment the next line and specify an img path to override conference-avatar:
    // overrideConferenceAvatar: 'configuration/themes/default/conference-avatar.jpg',

    // Uncomment one of the next lines to specify a client-side TURN server to use
    // turnServer: { url: 'turn:turn.example.com', username: 'user', credential: 'pass' },
    // turnServer: { url: 'turn:turn.example.com:443?transport=tcp', username: 'user', credential: 'pass' },

    // Uncomment and reconfigure the next line if you use a customized screensharing extension
    // screenshareApi: 'pexGetScreen',

    // controlGatewayCalls: true, // Uncomment this line to show the conference-control menu in GW calls
}, window.applicationSettings))

.constant('defaultUserSettings', angular.extend({
    theme: 'configuration/themes/default',
    language: 'configuration/languages/en-us.json',
    ringtone: 'ringtones/default.wav',
    callHistory: {},
    dialHistory: {},
    promptDisconnect: true,
    promptMedia: true,
    media: true,
    audioonly: false,
    fullMotionPresentationByDefault: false,
    muteOnJoin: false,
    muteCameraOnJoin: false,
    defaultBandwidth: 512 + 64,
    screenshareFrameRate: 5,
    analyticsReportingEnabled: true,
    name: (window.process && (window.process.env.LOGNAME || window.process.env.USERNAME || window.process.USER)) || '',
    sideBarHidden: false,
    sideBarHiddenInGW: true,
    enableRingtone: true,
    forceFlash: false,
    powerLineFrequency: "0",
    settingsVersion: 10, // Should be updated only if key nedds to be reset (not for new keys)
}, window.defaultUserSettings))

.constant('serverSettings', {
    analyticsReportingEnabled: true,
});
