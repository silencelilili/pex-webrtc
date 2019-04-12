/* global l2i */

(function() {
    'use strict';
    if (window.location.href.search('_flatlog') !== -1 || sessionStorage.getItem('_flatlog')) {
        sessionStorage.setItem('_flatlog', true);
        var _console = {
            log: console.log.bind(console),
            debug: (console.debug || console.log).bind(console),
            info: (console.info || console.log).bind(console),
            warn: (console.warn || console.log).bind(console),
            error: (console.error || console.log).bind(console),
        };

        console.log('Decorating console to flatten arguments');

        console.log = function() {
            _console.log.call(null, JSON.stringify(Array.prototype.slice.call(arguments)));
        };
        console.debug = function() {
            _console.debug.call(null, JSON.stringify(Array.prototype.slice.call(arguments)));
        };
        console.info = function() {
            _console.info.call(null, JSON.stringify(Array.prototype.slice.call(arguments)));
        };
        console.warn = function() {
            _console.warn.call(null, JSON.stringify(Array.prototype.slice.call(arguments)));
        };
        console.error = function() {
            _console.error.call(null, JSON.stringify(Array.prototype.slice.call(arguments)));
        };
    }

    function bootstrap() {
        angular.element(document).ready(function() {
            console.log('Bootstrapping angular');
            angular.bootstrap(document, ['pexapp']);
        });
    }

    if (window.location.href.search('l2idebug') !== -1 || sessionStorage.getItem('l2idebug')) {
        sessionStorage.setItem('l2idebug', true);
        var script = document.createElement('script');
        document.body.appendChild(script);
        script.onload = function() {
            console.log('Loaded', script.src);
            l2i.init(function() {
                l2i.on(bootstrap);
            });
        };
        script.src = 'js/vendor/logs2indexeddb.js';
    } else {
        bootstrap();
    }
})();
