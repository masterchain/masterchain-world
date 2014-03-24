/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

myApp.run(function($rootScope) {
    $rootScope.$on('handlePagesEmit', function(event, args) {
        $rootScope.$broadcast('handlePagesBroadcast', args);
    });
});
