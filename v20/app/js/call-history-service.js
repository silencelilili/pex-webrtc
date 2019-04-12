'use strict';

angular.module('pexapp')

.factory('callHistory', function($log, $window, $timeout, $localStorage, defaultUserSettings) {
    var values = [];

    function load() {
        angular.copy([], values);
        angular.forEach($localStorage.callHistory, function(value, key) {
            values.push({
                alias: key,
                avatarUrl: value.avatarUrl,
                timestamp: value.timestamp,
                status: value.status
            });
        });
    }
    load();

    if ($window.addEventListener) {
        $window.addEventListener('storage', function(event) {
            if (event.key === 'ngStorage-callHistory') {
                $log.log('callHistory updated: reloading');
                $timeout(load);
            }
        });
    }

    return {
        values: values,
        add: function(alias, avatarUrl, status) {
            if (alias) {
                $log.log('Adding callHistory entry', alias, status);
                $localStorage.callHistory[alias] = {
                    avatarUrl: avatarUrl,
                    timestamp: Date.now(),
                    status: status
                };
                $timeout(load);
            }
        },
        addCalendarMeetings: function(entries) {
            values.push.apply(values, entries);
        },
        remove: function(alias) {
            delete $localStorage.callHistory[alias];
            load();
        },
        clear: function() {
            $localStorage.callHistory = {};
            load();
        },
    };
})

.factory('dialHistory', function($localStorage, defaultUserSettings) {
    var values = [];

    function load() {
        angular.copy([], values);
        angular.forEach($localStorage.dialHistory, function(value, key) {
            values.push({
                alias: key,
                protocol: value.protocol,
                timestamp: value.timestamp,
                role: value.role
            });
        });
    }
    load();

    return {
        values: values,
        add: function(alias, protocol, role) {
            if (!alias) {
                return;
            }
            $localStorage.dialHistory[alias] = {
                protocol: protocol,
                timestamp: Date.now(),
                role: role
            };
            load();
        },
        remove: function(alias) {
            delete $localStorage.dialHistory[alias];
            load();
        },
        clear: function() {
            $localStorage.dialHistory = {};
            load();
        },
    };
});
