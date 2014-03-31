/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

$(document).ready(function () {

    var myURLParams = BTCUtils.getQueryStringArgs();
    console.log(myURLParams);


    var tx = myURLParams['tx'];
    var currency = myURLParams['currency'];
    var url = '';
    if (tx.length < 63)
    {
		var file = 'addr/' + tx + '.json';	
        if (currency == 'MSC') {
           currencyNumber = 0;
        }	
        if (currency == 'TMSC') {
           currencyNumber = 1;
        }	
        $.getJSON( file, function( data ) {
        	console.log("ok");
	    	url = "Address.html?addr=" + tx + "&currency=" + currency;
	    	window.location = url;
        }).fail(function() {
		    console.log( "error" );
		    $('#errorAddressModal').modal('show');
		  });        
    
    	return;
    }


    //Ajax call so I can see transactionType from JSON
    url = '/tx/' + tx + '.json';
    $.ajax({
	url: url,
	type: 'get',
	success: function (data) {
	    //successfull callback, forward user to original_url
	    //  window.location = url;
	    var url = "";

	    var response = data;
	    console.log(response);
	    console.log(response[0].transactionType);
	    var transactionType = response[0].transactionType;
	    var method = response[0].method;
	    var invalid = response[0].invalid;
	    var invalid_str = invalid.toString();
	    if (invalid_str == 'true,bitcoin payment') {
                //if is bitcoin payment
		url += "btcpayment.html?tx=";
            }
	    else if ((method == 'basic') || (transactionType == '0000') || ! transactionType) {
		//it is simplesend
		url += "simplesend.html?tx=";
	    }
	    else if (transactionType == '0014') {
		//it is a sell offer
		url += "selloffer.html?tx=";
	    }
	    else if (transactionType == '0016') {
		//it is a sell accept
		url += "sellaccept.html?tx=";
	    }

	    url += tx + "&currency=" + currency;

	    console.log(url);
	    window.location = url;
	},
	error: function () {
	    console.log('Error');
	    $('#errorTransactionModal').modal('show');
	}
    });
});
