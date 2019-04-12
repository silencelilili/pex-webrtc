'use strict';

angular.module('pexapp')

.factory('globalService', function(toggleService, defaultUserSettings, $timeout, $localStorage, $log) {
    if (window.srv) {
        $localStorage.registrationState = 'INACTIVE';
        window.srv.addRegisteredCallback(function(isRegistered, token) {
            $localStorage.registrationToken = token;
            $log.debug('Registered', isRegistered);
            $timeout(function() {
                if (!isRegistered && $localStorage.registrationState !== 'UNREGISTERING') {
                    $localStorage.registrationError = {
                        status: true
                    };
                } else {
                    delete $localStorage.registrationError;
                }
                $localStorage.registrationState = isRegistered ? 'ACTIVE' : 'INACTIVE';
            });
        });
        $timeout(function() {
            // $localStorage.registered = window.srv.service("registration_status").content == 'ACTIVE';
            $localStorage.registrationState = window.srv.service('registration_status').content;
        });
    }
    return {
        VERSION_STRING: '<REPLACE_ME>',
        register: function(host, alias, username, password, apply, remember) {
            delete $localStorage.registrationError;
            if ($localStorage.registrationState === 'REGISTERING') {
                return;
            }
            $localStorage.registrationState = 'REGISTERING';
            window.saveRegPwd(remember ? password : '');
            // Resolve srv then register
            function doRegister(newHost) {
                window.srv.service(
                    'register',
                    JSON.stringify({
                        hostname: newHost,
                        alias: alias,
                        username: username,
                        password: password
                    }));
            }
            var promise = window.srv.resolveSrvAsync(host);
            promise.then(
                function(result) {
                    var newhost = result.content.replace(/https:\/\//, '');
                    doRegister(newhost);
                },
                function(error) {
                    doRegister(host);
                }
            );
        },
        unregister: function() {
            delete $localStorage.registrationError;
            $localStorage.registrationState = 'UNREGISTERING';
            window.srv.service('stop');
            window.srv.service('start');
        },
        onDisconnect: function() {},
    };
});
