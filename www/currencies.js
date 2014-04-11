/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

function CurrenciesController($scope, $http) {
    $scope.currency_values = {};
    $scope.extracted_currencies = {};
    $scope.footer = "FOOTER";
    $scope.title = "TITLE";
    
    $scope.createIconPopup = function () {
        $('.iconPopupInit').popover({ trigger: "hover" });           
    };


    $scope.getCurrenciesData = function () {

        // parse addr from url parameters
	var myURLParams = BTCUtils.getQueryStringArgs();
	var currencyName = myURLParams['currency'];
        var currencyIdentity;	

        // Make the http request for extracted_currencies and process the result
	var file = 'general/extracted_currencies.json';	
        $http.get(file, {}).success(function (data, status, headers, config) {
            $scope.extracted_currencies = data;
            console.log($scope.extracted_currencies[0]);
            var currencies_list = data[0];
            exo=currencies_list[currencyName].exodus;
            id=currencies_list[currencyName].currency_id;
            currencyIdentity=exo+'-'+id;
            //console.log(currencyIdentity);
        });

        // Make the http request for currencies and process the result
	var file = 'currencies.json';
        $http.get(file, {}).success(function (data, status, headers, config) {
            var updated_data = data;
            var length = data.length;
            for (var i = 0; i < length; i++) {
                updated_data[i].time=$scope.extracted_currencies[0][data[i].symbol]['time']
                updated_data[i].amount_minted=$scope.extracted_currencies[0][data[i].symbol]['amount_minted']
                updated_data[i].payment=$scope.extracted_currencies[0][data[i].symbol]['payment']
                updated_data[i].donation=$scope.extracted_currencies[0][data[i].symbol]['donation']
                console.log(updated_data[i])
            } 
            $scope.currency_values = updated_data;
            console.log($scope.currency_values);
        });
    }
}
