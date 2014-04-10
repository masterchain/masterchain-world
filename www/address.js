/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

function AdressController($scope, $http) {
    $scope.addressInformation = {};
    $scope.addressBalance = {};
    $scope.theAddress = "";
    $scope.footer = "FOOTER";
    $scope.title = "TITLE";
    
    $scope.createIconPopup = function () {
        $('.iconPopupInit').popover({ trigger: "hover" });           
    };

    $scope.paymentsReceivedSum = function (currencyId) {
        var length = $scope.addressInformation.received_transactions.length;
        var sum = 0;
        for (var i = 0; i < length; i++) {
            if ($scope.addressInformation.received_transactions[i].currency_id == currencyId) {
                sum += parseFloat($scope.addressInformation.received_transactions[i].amount);
            }
        }
        return sum;
    }

    $scope.boughtViaExodusSum = function (currencyId) {

        var length = $scope.addressInformation.exodus_transactions.length;
        var sum = 0;
        for (var i = 0; i < length; i++) {
            if ($scope.addressInformation.exodus_transactions[i].currency_id == currencyId) {
                sum += parseFloat($scope.addressInformation.exodus_transactions[i].amount);
            }

        }
        return sum;
    }
    //paymentsSentSum
    $scope.paymentsSentSum = function (currencyId) {
        var length = $scope.addressInformation.sent_transactions.length;
        var sum = 0;
        for (var i = 0; i < length; i++) {
            if ($scope.addressInformation.sent_transactions[i].currency_id == currencyId) {
                sum += parseFloat($scope.addressInformation.sent_transactions[i].amount);
            }
        }
        return sum;
    }

    //Count of the transactions
    $scope.incomingTransCount = function (currencyId) {
        var length = $scope.addressInformation.received_transactions.length;
        var sum = 0;
        for (var i = 0; i < length; i++) {
            if ($scope.addressInformation.received_transactions[i].currency_id == currencyId) {
                sum++;
            }

        }
        return sum;
    }

    $scope.outgoingTransCount = function (currencyId) {
        var length = $scope.addressInformation.sent_transactions.length;
        var sum = 0;
        for (var i = 0; i < length; i++) {
            if ($scope.addressInformation.sent_transactions[i].currency_id == currencyId) {
                sum++;
            }

        }
        return sum;
    }

    $scope.exodusTransCount = function (currencyId) {
        var length = $scope.addressInformation.exodus_transactions.length;
        var sum = 0;
        for (var i = 0; i < length; i++) {
            if ($scope.addressInformation.exodus_transactions[i].currency_id == currencyId) {
                sum++;
            }

        }
        return sum;
    }

    $scope.getAddressData = function () {

        // parse addr from url parameters
	var myURLParams = BTCUtils.getQueryStringArgs();
	$scope.theAddress = myURLParams['addr'];
	if (!BTCUtils.isAddress($scope.theAddress)) {
		$scope.theAddress = "invalid";
	}
	$('#qrcode').qrcode({
		width: 130,
		height: 130,
		text: myURLParams['addr']
		});
	var currencyName = myURLParams['currency'];
        var currencyIdentity;	
        // Make the http request for extracted_currencies and process the result
	var file = 'general/extracted_currencies.json';	
        $http.get(file, {}).success(function (data, status, headers, config) {
            $scope.extracted_currencies = data;
            // get positive balances
            var currencies_list = data[0];
            exo=currencies_list[currencyName].exodus;
            id=currencies_list[currencyName].currency_id;
            currencyIdentity=exo+'-'+id;
            //console.log(currencyIdentity);
        });
        // Make the http request for address and process the result
	var file = 'addr/' + myURLParams['addr'] + '.json';	
        $http.get(file, {}).success(function (data, status, headers, config) {
            $scope.addressInformation = data[currencyIdentity];
            // get positive balances
            var balance = data['balance'];
            var length = balance.length;
            var j = 1;
            var url = BTCUtils.getUrl();
            for (var i = 0; i < length; i++) {
                if (balance[i].value != 0.0) {
                    balance[i].newUrl = BTCUtils.replaceCurrency(url, balance[i].symbol);
                    $scope.addressBalance[j]=balance[i];
                    j=j+1;
                }
            }
        });
    }

    $scope.SendClick = function () {
        var myURLParams = BTCUtils.getQueryStringArgs();
        var url = "sendform.html?addr=";
        url += myURLParams['addr'];
        url += "&currency=";
        url += myURLParams['currency'];
        window.location = url;
    }
    
    $scope.AddToWalletClick = function () {
        var myURLParams = BTCUtils.getQueryStringArgs();
        var addr = myURLParams['addr'];
        Wallet.AddAddress(addr);
    }
}
