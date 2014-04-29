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


    $scope.mysort = function (data) {
        console.log('sorting');
        console.log(data);
        data.sort(function(a, b) {
            if (a.symbol == "BTC") {
                return -1; // BTC coin first
            }
            if (b.symbol == "BTC") {
                return 1; // BTC coin first
            }
            if ((a.symbol[0] == "T") && (b.symbol[0] != "T")) {
                return 1; // test coins last
            }
            if ((a.symbol[0] != "T") && (b.symbol[0] == "T")) {
                return -1; // test coins last
            }
            var fa;
            var fb;
            if (typeof a.total_paid == 'undefined') {
                console.log("setting to zero");
                fa = 0;
            } else {
                fa = parseFloat(a.total_paid);
            }
            if (typeof b.total_paid == 'undefined') {
                console.log("setting to zero");
                fb = 0;
            } else {
                fb = parseFloat(b.total_paid);
            }
            (fa < fb) ? console.log(a.total_paid+'<'+b.total_paid) : (fa > fb) ? console.log(a.total_paid+'>'+b.total_paid) : console.log(a.total_paid+'='+b.total_paid);
            return (fa < fb) ? 1 : (fa > fb) ? -1 : 0;
        }); 
        return data;
    };

    $scope.getCurrenciesData = function () {

        // parse addr from url parameters
	var myURLParams = BTCUtils.getQueryStringArgs();
	var currencyName = myURLParams['currency'];
        var currencyIdentity;	

        // Make the http request for extracted_currencies and process the result
	var extracted_currencies_file = 'general/extracted_currencies.json';	
        $http.get(extracted_currencies_file, {}).success(function (extracted_data, status, headers, config) {
            $scope.extracted_currencies = extracted_data;
            console.log($scope.extracted_currencies[0]);
            var currencies_list = extracted_data[0];
            exo=currencies_list[currencyName].exodus;
            id=currencies_list[currencyName].currency_id;
            currencyIdentity=exo+'-'+id;
            //console.log(currencyIdentity);

            // Make the http request for currencies and process the result
	    var currencies_file = 'currencies.json';
            $http.get(currencies_file, {}).success(function (currencies_data, status, headers, config) {
                var updated_data = currencies_data;
                var length = currencies_data.length;
                for (var i = 0; i < length; i++) {
                    if (updated_data[i].symbol == "MSC" || updated_data[i].symbol == "TMSC") {
                        updated_data[i].amount_minted = 619478.6
                        updated_data[i].time = 1377993874000
                        updated_data[i].payment = 0.0
                        updated_data[i].percent_paid = 0.0
                    } else {
                        updated_data[i].time=$scope.extracted_currencies[0][currencies_data[i].symbol]['time']
                        updated_data[i].amount_minted=$scope.extracted_currencies[0][currencies_data[i].symbol]['amount_minted']
                        updated_data[i].payment=$scope.extracted_currencies[0][currencies_data[i].symbol]['payment']
                        var y=updated_data[i].payment/updated_data[i].amount_minted
                        updated_data[i].percent_paid=y/(1+y)*100
                    }
                    updated_data[i].donation=$scope.extracted_currencies[0][currencies_data[i].symbol]['donation']
                    console.log('updated_data[i]')
                    console.log(updated_data[i])
                } 
                //$scope.currency_values = updated_data;
                //console.log($scope.currency_values);

                // Make the http request for values and combine the result
	        var values_file = 'values.json';
                $http.get(values_file, {}).success(function (val_data, status, headers, config) {
                    var values_data = val_data;
                    var values_length = val_data.length;
                    var currencies_length = currencies_data.length;
                    // get BTC price
                    var btc_price = 0;
                    for (var k = 0; k < currencies_length; k++) {
                        if (updated_data[k].symbol == "BTC") {
                            btc_price = updated_data[k].dollar;
                            updated_data[k].percent_paid=0.0;
                        }
                    }
                    for (var l = 0; l < currencies_length; l++) {
                        var donation = updated_data[l].donation;
                        if (donation != undefined) {
                            updated_data[l].usd_donation = donation * btc_price;
                        } else {
                            updated_data[l].usd_donation = 0.0;
                        }
                    }
                    for (var i = 0; i < values_length; i++) {
                        if (values_data[i].last_price != undefined) {
                            var symbol = values_data[i].currency;
                            var last_price = values_data[i].last_price;
                            var average_price = values_data[i].average_price;
                            var total_paid = values_data[i].total_paid;
                            for (var j = 0; j < currencies_length; j++) {
                                if (updated_data[j].symbol == symbol) {
                                    updated_data[j].last_price = last_price;
                                    updated_data[j].average_price = average_price;
                                    updated_data[j].total_paid = total_paid;
                                    updated_data[j].dollar = last_price*btc_price;
                                    var amount_minted = updated_data[j].amount_minted;
                                    updated_data[j].cap = last_price*btc_price*amount_minted/1000000;
                                }
                            }
                        }
                    } 
                    $scope.currency_values = $scope.mysort(updated_data);
                    console.log($scope.currency_values);
                });
            });
        });
    }
}
