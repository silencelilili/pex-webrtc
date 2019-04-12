angular.module('pexapp')

.factory('srvService', function($q, $localStorage, applicationSettings) {
    'use strict';
    return {
        getVmrDetails: function(uri) {
            var uriComponents = uri.split('@');
            var domain = uriComponents[1];

            var deferred = $q.defer();
            deferred.resolve([applicationSettings.serverAddress, $localStorage.serverAddress]);
            return deferred.promise;
        }
    };
});
