/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

var initialAmount = 0;
function AcceptOfferController($scope, $http) {
    $scope.transactionInformation;
 
    $scope.footer = "FOOTER";
    $scope.title = "TITLE";

    $scope.step = 0.1;
    $scope.amount;
    $scope.fee = 0.0005;
    $scope.key = "";
    $scope.currency = "";
    $scope.toAddress = "";
    $scope.toAddrReadOnly = true;
    
    var myURLParams = BTCUtils.getQueryStringArgs();
    
    $scope.simpleView=myURLParams['SimpleView']=="true";
    $scope.Address = myURLParams['from'];
    
    Wallet.avoidRedirect = true;
    var wallet = Wallet.GetWallet();
    $scope.addressArray=new Array();
    
    for(var i=0; i<wallet.addresses.length; i++){
            $scope.addressArray[i]={"address":wallet.addresses[i],"name":wallet.names[i]};
        }

    if ($scope.Address) {
        if (wallet.addresses.indexOf($scope.Address) == -1) {
    	    $scope.addressArray.splice(0, 0, {"address":$scope.Address,"name":""});
        }
    }else{
        if($scope.addressArray.length>0)
            $scope.Address=$scope.addressArray[0].address;
    }

    $scope.setAddress = function(addr){
        $scope.Address=addr;
        $('#selectAddress').modal('hide');
    }
    
    //private key
    $scope.isPKInLocalStorage=IsPKInLocalStorage();

    $scope.unlockWalletErrorShow=false;
    
    $scope.validateWalletPassword= function(){
        $scope.unlockWalletErrorShow=false;
        
        var digestEnter = Wallet.calcPwdDigest($scope.walletPasswordEnter);
        var digestStored = Wallet.LoadEncPwd();

        if (digestEnter != digestStored) {
            $scope.unlockWalletErrorShow = true;
            return;
        }

        var result=null;
        try{
            result=DecryptPK($scope.walletPasswordEnter);
            
        }catch(e){
            result=null;
        }
        
        if(result==null){
            $scope.unlockWalletErrorShow=true;
        }else{
            $scope.key=result;
            $('.invalidKey').hide();
            $('#unlockWallet').modal('hide');  
        }
    }

    $scope.getSellofferData = function () {

        // parse tx from url parameters
        var myURLParams = BTCUtils.getQueryStringArgs();
        //var file = 'tx/' + myURLParams['tx'] + '.json';
	$scope.currency = myURLParams['currency'];
	$scope.toAddress = myURLParams['addr'];
	
	$scope.toAddrReadOnly = ($scope.toAddress && $scope.toAddress.length > 0);
	if (myURLParams['fee'])
		$scope.fee = parseFloat(myURLParams['fee']);
	if (myURLParams['amount'])
		$scope.amount = parseFloat(myURLParams['amount']);
      
    }

    $scope.comboBoxValueChange = function () {
        console.log($scope.transactionInformation);
    }

    $scope.AmountChanged = function () {
        $('#amountWarning').hide();
    }
    
    $('.invalidKey').hide();
    
    $scope.verifyButton = function () {
        $('#verifyMessage').hide();
        $('#verifyLoader').show();

        //If returned ok then add address to history
        if (BTNClientContext.Signing.Verify()) {
            BTNClientContext.Signing.addAddressToHistory();

            console.log('added to history');
        }
        else {
            console.log('not verified and not ok');
        }

        $('#verifyLoader').hide();
    }
    $scope.reSign = function () {
        $('.invalidKey').hide();
        $('.invalidTransaction').hide();

        $('#reSignLoader').show();
        try {
            BTNClientContext.Signing.ReSignTransaction();
        }
        catch (e) {
            console.log(e);
            $('.invalidKey').show();
            $('.invalidTransaction').show();


            //If the key is invalid the resigned transaction form is hidden again
            $('#reSignClickedForm').hide();

        }
        $('#reSignLoader').hide();
    }
    $scope.send = function () {
        $('#sendLoader').addClass('showUntilAjax');
        $('#sendLoader').addClass('show3sec');
        var sendLoaderInterval = setInterval(function () {
            $('#sendLoader').removeClass('show3sec');
            clearInterval(sendLoaderInterval);
        }, 3000);
        //BTNClientContext.Signing.SendTransaction();
        BTNClientContext.txSend();
    }
    $scope.controlPrivateKey = function(pk){
	    var eckey= GetEckey(pk);
    	var address=GetAddress(eckey);
    	if(address==''){
	    	//error
	    	$('#privateKeyError').modal('show');
			return false;
    	}
    	return true;
    }

    $scope.JsonRadioBtn = function () {
        var converted = BTNClientContext.Signing.ConvertRaw(BTNClientContext.Signing.Transaction);
        $('#transactionBBE').val(converted);
    };

    $scope.RawRadioBtn= function () {
        var converted = BTNClientContext.Signing.Transaction;
        $('#transactionBBE').val(converted);
    };

    $scope.JsonRadioBtnSigned = function () {
        if (BTNClientContext.Signing.RawChecked == true) {
            var rawTransaction = $('#signedTransactionBBE').val();
            var converted = BTNClientContext.Signing.ConvertRaw(rawTransaction);
            $('#signedTransactionBBE').val(converted);
            $('#signedTransactionBBE').attr('readonly', false);
            BTNClientContext.Signing.RawChecked = false;
        }
    };


    $scope.RawRadioBtnSigned= function () {
        BTNClientContext.ToRawSigned();
        if ($('.invalidTransaction').is(":visible")) {
            console.log('Json is invalid');
            $('#RawRadioBtnSigned').removeClass('active');
            $('#JsonRadioBtnSigned').addClass('active');
        }
    };
}

function IsPKInLocalStorage(){
    var from_addr = angular.element($('.AcceptOfferController')).scope().Address;
    if (!Boolean(from_addr)) return false;
    var encPK = Wallet.getPK(from_addr);
    return Boolean(encPK);
}

function DecryptPK(PWD) {
    var from_addr = angular.element($('.AcceptOfferController')).scope().Address;
    if (!Boolean(from_addr)) return false;
    var encPK = Wallet.getPK(from_addr);
    return Wallet.decPK(encPK, PWD);
}


//class for Context
BTNClientContext = new function () {
};
//class for Signing
BTNClientContext.Signing = new function () {
};

BTNClientContext.Signing.Transaction = "";

BTNClientContext.Signing.ConvertRaw = function (jsonTransaction) {

    //var str = BTNClientContext.Signing.Transaction;
    var str = jsonTransaction;
    str = str.replace(/[^0-9a-fA-f]/g, '');
    var bytes = Crypto.util.hexToBytes(str);
    var sendTx = BTNClientContext.Signing.deserialize(bytes);
    var text = BTNClientContext.toBBE(sendTx);

    return text;
}

BTNClientContext.Signing.ConvertJSON = function (signedTransaction) {

    try {
        $('.invalidTransaction').hide();
        var sendTx = BTNClientContext.fromBBE(signedTransaction);

    }
    catch (e) {
        $('.invalidTransaction').show();
    }


    var rawTx = Crypto.util.bytesToHex(sendTx.serialize());

    return rawTx;
};


BTNClientContext.Signing.Verify = function () {
    console.log("verify function");
    var from_addr = angular.element($('.AcceptOfferController')).scope().Address;

    var pubKey = Wallet.getPubK(from_addr);
    if (pubKey) {
        from_addr = pubKey;
    }

var dataToSend = { addr: from_addr };

var ok = true;
$.post('/wallet/validateaddr/', dataToSend, function (data) {
console.log('success');
console.log(data);

if (data.status == 'OK') {
    ok = true;
    $('#verifyMessage').addClass('label-success');
    $('#verifyMessage').text('OK');
    $('#verifyMessage').show();
    return ok;
}
else {
    $('#verifyMessage').addClass('label-success');
    ok = false;
    if (data.error == 'invalid pubkey') {
        $('#verifyMessage').text('invalid pubkey');
    } else {
        if (data.error == 'missing pubkey') {
            $('#verifyMessage').text('no pubkey on blockchain. use wallet or supply Public Key from brainwallet.org');
        } else {
	        $('#verifyMessage').addClass('label-danger');
            if (data.error == 'invalid address') {
                $('#verifyMessage').text('invalid address');
            } else {
                $('#verifyMessage').text('invalid');
            }
        }
    }
}
$('#verifyMessage').show();

return ok;
}).fail(function () {

console.log('fail');
$('#verifyMessage').text('server error');
$('#verifyMessage').addClass('label-danger');

ok = false;

$('#verifyMessage').show();

return ok;
});



};

BTNClientContext.Signing.SingSource = function () {
var hashType = 1;

//Source Script for signing
var sourceScript = [];
var sourceScriptString = $('#sourceScript').val().split(';');
$.each(sourceScriptString, function (i, val) {
sourceScript[i] = BTNClientContext.parseScript(val);
console.log(val);
console.log($.toJSON(sourceScript[i]));
console.log(BTNClientContext.dumpScript(sourceScript[i]));
});

//create transaction object from BBE JSON
// var transactionBBE = $('#transactionBBE').val();
var transactionBBE = BTNClientContext.Signing.ConvertRaw(BTNClientContext.Signing.Transaction);

try {
$('.invalidTransaction').hide();
    var sendTx = BTNClientContext.fromBBE(transactionBBE);
}
catch (e) {
    $('.invalidTransaction').show();
    return;
}

//signature section
var eckey = BTNClientContext.GetEckey($('#privateKey').val()); //ECDSA
console.log($('#privateKey').val());
console.log(Crypto.util.bytesToHex(eckey.getPubKeyHash()));
for (var i = 0; i < sendTx.ins.length; i++) { //for each input in the transaction -- sign it with the Key

//console.log($.toJSON(sendTx));
//console.log($.toJSON(sourceScript[i]));

var hash = sendTx.hashTransactionForSignature(sourceScript[i], i, hashType); //Get hash of the transaction applying the soure script
console.log(Crypto.util.bytesToHex(hash));

var signature = eckey.sign(hash); //<---SIGN HERE
signature.push(parseInt(hashType, 10)); //add white space
var pubKey = eckey.getPub();			//public key

//creating new in sript signature
var script = new Bitcoin.Script();
script.writeBytes(signature);
script.writeBytes(pubKey);
//write sript signature
sendTx.ins[i].script = script;
}

return BTNClientContext.toBBE(sendTx);
};
//Should re sign transaction -- need to call all BC functions
BTNClientContext.Signing.ReSignTransaction = function () {
var reSigned = BTNClientContext.Signing.SingSource();
BTNClientContext.Signing.TransactionBBE = reSigned;

//show re-signed transaction
$('#signedTransactionBBE').val(reSigned);
BTNClientContext.Signing.RawChecked = false;
BTNClientContext.ToRawSigned();
$('#RawRadioBtnSigned').addClass('active');
$('#JsonRadioBtnSigned').removeClass('active');

//show hidden
$('#reSignClickedForm').show();
};

BTNClientContext.Signing.SendTransaction = function () {

var signedTransaction = $('#signedTransactionBBE').val();

//Maybe I need to convert to object from json string???
var sendTx = BTNClientContext.fromBBE(signedTransaction);
var rawTx = Crypto.util.bytesToHex(sendTx.serialize());
var dataToSend = { signedTransaction: rawTx };
console.log(dataToSend);

// Ajax call to /wallet/pushtx/
$.post('/wallet/pushtx/', dataToSend, function (data) {
console.log('success');
console.log(data);


}).fail(function () {

// TODO  This should be changed - Currently always fail as there is no server

});
};

BTNClientContext.Signing.GetRawTransaction = function () {


$('#statusMessage').removeClass('label-danger');
$('#statusMessage').addClass('label-successColor');
$('#statusMessage').text('');


$('#createRawResponseForm').hide();

var myURLParams = BTCUtils.getQueryStringArgs();
var marker = myURLParams['marker'];
var to_address = $("#recipient").val();
var from_address = angular.element($('.AcceptOfferController')).scope().Address;
var pubKey = Wallet.getPubK(from_address);
if (pubKey) {
    from_address = pubKey;
}
var amount = $('#amount').val();
var currency = $('#currency').val();
var fee = $('#fee').val();

var dataToSend = { from_address: from_address, to_address: to_address, amount: amount, currency: currency, fee: fee, marker: marker };
console.log(dataToSend);

// Ajax call to /wallet/send/
$.post('/wallet/send/', dataToSend, function (data) {
console.log('success');
console.log(data);

BTNClientContext.Signing.GetRawTransactionResponse(data);

}).fail(function () {

console.log('fail');
var testResponse = {
    'status': 'server error',
    'sourceScript': 'ERROR',
    'transaction': ''
};
BTNClientContext.Signing.GetRawTransactionResponse(testResponse);

});
};

BTNClientContext.Signing.GetRawTransactionResponse = function (data) {

var status = data.status;
if (!status)
	status = data.error;
if (status && status != "OK" && status != "Ok" && status != "ok") {
if (status.length > 120) {
    //take first 117 and add ...
    status = status.substr(0, 117);
    status += "...";
}

$('#statusMessage').removeClass('label-successColor');
$('#statusMessage').addClass('label-danger');
$('#statusMessage').text(status);


$('#createRawResponseForm').hide();
return;
}

BTNClientContext.Signing.Transaction = data.transaction;

//Init fields values
//data should have fields sourceScript and transaction
$('#sourceScript').val(data.sourceScript);
$('#transactionBBE').val(data.transaction);

//Showing the fields
$('#createRawResponseForm').show();

};



// HISTORY of Buyer address or public key

BTNClientContext.Signing.supportsStorage = function () {
try {
return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
};


BTNClientContext.Signing.addAddressToHistory = function () {
    if (BTNClientContext.Signing.supportsStorage()) {

        var address = $("input.select.optional.form-control.form-control30px.combobox").val();
        var history;
        if (localStorage["Addresses"]) {
            history = JSON.parse(localStorage["Addresses"]);
            if (history.length > 9) {
                history.shift();
            }
            var addr = { 'address': address };

            // Check if the addr is in the array already and if it is delete it
           // var index = history.indexOf(addr);
            var index = history.indexOf(address);
            if (index > -1) {
                history.splice(index, 1);
            }

            //add new address to array
            //  history.push(addr);
            history.push(address);

            localStorage["Addresses"] = JSON.stringify(history);
        }
        else { // If the localStorage["Addresses"] doesn't exists
         //   var addr = { 'address': address };
            var que = [];
            // que.push(addr);
            que.push(address);
            localStorage["Addresses"] = JSON.stringify(que);
        }

       // console.log(localStorage["Addresses"]);
    }
};
$(document).ready(function myfunction() {

    $('#sendLoader').addClass('hideLoader');


    var navHeight = $('.navbar').height();
    $('.page-container').css('paddingTop', navHeight + 20);


    //disable btn at the beggining, because it needs to have a value in a privateKey
    $('#reSign').attr('disabled', true);


    $('#createRawTransaction').click(function () {
        $('#createRawTransactionLoader').show();

        BTNClientContext.Signing.GetRawTransaction();


        //Add address to history
        BTNClientContext.Signing.addAddressToHistory();

        $('#createRawTransactionLoader').hide();
    });
    
    BTNClientContext.Signing.RawChecked = true;
    
});

BTNClientContext.ToRawSigned = function() {
	if (BTNClientContext.Signing.RawChecked == false) {
		var converted = "";
		try {
		    var signedTransaction = $('#signedTransactionBBE').val();
		    converted = BTNClientContext.Signing.ConvertJSON(signedTransaction);
		    $('#signedTransactionBBE').attr('readonly', false);
		    BTNClientContext.Signing.RawChecked = true;
		}
		catch (e) {
		    converted = $('#signedTransactionBBE').val();

		    $('#RawRadioBtnSigned').removeClass('active');
		    $('#JsonRadioBtnSigned').addClass('active');


		}
		$('#signedTransactionBBE').val(converted);
	}
}

function txSent(text) {
alert(text ? text : 'No response!');
}

BTNClientContext.txSend = function() {
        $('#sendHyperlink').hide();
        $('#sendMessage').hide();
        BTNClientContext.ToRawSigned();
	$('#RawRadioBtnSigned').addClass('active');
	$('#JsonRadioBtnSigned').removeClass('active');
        
        var rawTx = $('#signedTransactionBBE').val();
	//var sendTx = BTNClientContext.fromBBE(signedTransaction);
	//var rawTx = Crypto.util.bytesToHex(sendTx.serialize());

        //url = 'http://bitsend.rowit.co.uk/?transaction=' + tx;
        url = 'http://blockchain.info/pushtx';
        postdata = 'tx=' + rawTx;

        if (url != null && url != "") {
            BTNClientContext.tx_fetch(url, txSent, txSent, postdata);
        }
        return false;
}

// Some cross-domain magic (to bypass Access-Control-Allow-Origin)
BTNClientContext.tx_fetch = function(url, onSuccess, onError, postdata) {
    var useYQL = true;

    if (useYQL) {
        var q = 'select * from html where url="'+url+'"';
        if (postdata) {
            q = 'use "https://masterchain.info/js/htmlpost.xml" as htmlpost; ';
            q += 'select * from htmlpost where url="' + url + '" ';
            q += 'and postdata="' + postdata + '" and xpath="//p"';
        }
        url = 'https://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(q);
    }

    $.ajax({
        url: url,
        success: function(res) {
            $('#sendLoader').removeClass('showUntilAjax');
	    
	    $('#sendMessage').text('Transaction sent');
	    $('#sendMessage').addClass('label-successColor');
	    $('#sendMessage').show();

	    //Get transaction hash code
	    var link = "https://blockchain.info/tx/";
	    //signed transaction code
	    var code = JSON.parse(BTNClientContext.Signing.TransactionBBE).hash;

	    link += code;
	    $('#sendLink').attr('href', link);
	    $('#sendLink').text(link);
            $('#sendHyperlink').show();
        },
        error:function (xhr, opt, err) {
            $('#sendMessage').text('Transaction send error');
            $('#sendMessage').addClass('label-danger');
            $('#sendMessage').show();
            $('#sendLoader').removeClass('showUntilAjax');   
        }
    });
}

