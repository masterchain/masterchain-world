/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

function parseBase58Check(address) {
	var bytes = Bitcoin.Base58.decode(address);
	var end = bytes.length - 4;
	var hash = bytes.slice(0, end);
	var checksum = Crypto.SHA256(Crypto.SHA256(hash, {asBytes: true}), {asBytes: true});
	if (checksum[0] != bytes[end] ||
		checksum[1] != bytes[end+1] ||
		checksum[2] != bytes[end+2] ||
		checksum[3] != bytes[end+3])
			throw new Error("Wrong checksum");
	var version = hash.shift();
	return [version, hash];
}

Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};


function GetEckey(sec){
	if(!sec || sec=="") {
		return '';
	} 
	try {
		var res = parseBase58Check(sec);
		var version = res[0];
		var payload = res[1];
		var compressed = false;
	}catch(ex){		
		return false; //error checksum
	}
	if (payload.length > 32) {
		payload.pop();
		compressed = true;
	}
	var PRIVATE_KEY_VERSION = 0x80;
	if (version != PRIVATE_KEY_VERSION) {
		//Invalid private key version
		return false;
	} else if (payload.length < 32) {
		//Invalid payload (must be 32 or 33 bytes)
		return false;
	} 
	var eckey = new Bitcoin.ECKey(payload);
	eckey.setCompressed(compressed); 
	return eckey;
}

//creates public key

function getEncoded(pt, compressed) {
    var x = pt.getX().toBigInteger();
    var y = pt.getY().toBigInteger();
    var enc = integerToBytes(x, 32);
    if (compressed) {
        if (y.isEven()) {
            enc.unshift(0x02);
        } else {
            enc.unshift(0x03);
        }
    } else {
        enc.unshift(0x04);
        enc = enc.concat(integerToBytes(y, 32));
    }
    return enc;
}

function GetPublicKey(eckey){
	if(eckey){
		try {
	        var curve = getSECCurveByName("secp256k1");
	        var gen_pt = curve.getG().multiply(eckey.priv);
			var compressed = false;
			var pub = Crypto.util.bytesToHex(getEncoded(gen_pt, compressed));	
			return pub;
	    } catch (err) {
	        console.info(err);            
	        return;
	    }
	}
	return null;
}
// seed == derived_private_key
function GetSeed(eckey){
	if(eckey){
		try {
                var seedDigest1 = CryptoJS.SHA256(CryptoJS.SHA256(eckey + "masterchain_seed_salt")); 
                var byteArray = Wallet.wordToByteArray(seedDigest1.words);
                var seed = Bitcoin.Base58.encode(byteArray);
                console.log(seed);
		return seed;
	    } catch (err) {
	        console.info(err);            
	        return;
	    }
	}
	return null;
}

//set address
function GetAddress(eckey){
	if(eckey){
		var hash160 = eckey.getPubKeyHash();
	    var h160 = Crypto.util.bytesToHex(hash160);
	    var addr = new Bitcoin.Address(hash160);
	    var PUBLIC_KEY_VERSION = 0;
	    addr.version = PUBLIC_KEY_VERSION;
		return addr.toString();
	}
	return '';
}

function CheckKey(pk){
	try{
		var eckey = GetEckey(pk); //ECDSA
		if (eckey)
			return true;
	}catch(ex){
		return false;
	}
	return false;
}

function WalletController($scope, $http, $q) {
 
    $scope.footer = "FOOTER";
    $scope.title = "TITLE";
    $scope.currency_colors= new Array('#E46765','#F17C48','#AE73AF','#066EB4','#82B7DD','#9296CB','#A0CCB4','#ACB2B2','#D0B391','#FED32A');

    $scope.showDollarValues = false;
    $scope.currencyValue = 1;
    
    $scope.setRemoteKey=function(){ console.log('set remote key');};
    $scope.retieveFromCloud=function(){ console.log('retieveFromCloud');};
    $scope.updateCloud=function(){ console.log('updateCloud');};

    $scope.dollarCurrencySymbol = "$ ";

    $scope.addressArray = [];
    $scope.uuid = '';
  
    //password saved
    $scope.walletPasswordSaved="";
    
    //password inserted
    $scope.walletPasswordInserted=false;
    
    // password hash
    $scope.walletPwdDigest="";
    
    //encryption key - calculated from Pwd
    $scope.walletEncKey="";
    
    //derived PK
    $scope.derivedPrivateKey = "";

    //derived PK
    $scope.tempDecodedPK = "";
    
    
    $scope.isPasswordExist=function(){
    	$scope.walletPwdDigest = Wallet.LoadEncPwd();
        return $scope.walletPwdDigest;
    }
    
    $scope.walletPasswordEnter = "";
    $scope.isPasswordEntered=function(){
        return $scope.walletPasswordEnter;
    }

    $scope.clearPK = function () {
        $scope.tempDecodedPK = "";
    }
    
    $scope.createWalletPassword=function(){
    $scope.walletPasswordEnter = $scope.walletPasswordSaved = $scope.walletPassword;
	// Calculate pwd digest and put in storage
	var digest = Wallet.calcPwdDigest($scope.walletPassword);
	Wallet.StoreEncPwd(digest);
	$scope.walletEncKey = $scope.walletPasswordSaved;

	$scope.walletPassword=$scope.walletPasswordConfirm="";
	$('#createWalletPass').modal('hide');
    }
    
    $scope.unlockWalletErrorShow=false;
    
    $scope.validateWalletPassword= function(){
    
        $scope.unlockWalletErrorShow=false;
        
        var digestEnter = Wallet.calcPwdDigest($scope.walletPasswordEnter);
        
        if($scope.walletPwdDigest == digestEnter){
            $scope.walletPasswordInserted = true;
            $('#unlockWallet').modal('hide');  
        } else {
            $scope.walletPasswordInserted = true;
            $scope.unlockWalletErrorShow=true;
        }
    }
    $scope.privateKey="";
    $scope.setPrivateKeyErrorShow=false;
    
    $scope.checkPrivateKey = function (key) {
        var check = CheckKey(key);
        if (CheckKey(key)) {
            $scope.privateKey = key;
        }
        return check;
    }
    
    $scope.decryptPrivateKey = function(index,encrypted,address){
        $scope.tempDecodedPK = Wallet.decryptPK(encrypted, $scope.walletPasswordEnter, address);
    }
    
    $scope.setPrivateKeyFunction = function (index, address, pk, addrObj) {
        
        if (!pk || !$scope.walletPasswordEnter) {
            $scope.setPrivateKeyErrorShow = true;
            return;
        }

        var pkAddress = $scope.getAddressFromPK(pk);
        if (pkAddress != address) {
            //bootbox.alert("private key oes not match adress");
            $('#privateKeyError').modal('show');
        };

        var encPK = Wallet.encPK(pk, $scope.walletPasswordEnter);
        addrObj.pk = encPK;
        console.log(encPK);
        if (!encPK) {
            $scope.setPrivateKeyErrorShow = true;
            return;
        }

        Wallet.setPK(address, encPK);
        $scope.setPrivateKeyErrorShow=false;
        $scope.clearPK();
        $('#setPrivateKey'+address).modal('hide');  
    }

//Sorting Tool
    
    $scope.sortByCurrency = function(symbol){
	    
        var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
        var wallet_pos=0;
        var wallet = wallets[wallet_pos];
        
        var addresses=new Array();
        var names=new Array();
        var publickeys=new Array();
        var seeds=new Array();
        var PK = new Array();
        
        var notordered=new Array();
        var ordered_keys=new Array();
        
        for(var n=0;n<$scope.addressArray.length;n++){
            notordered[n]=0;
        }
        for(var i=0;i<$scope.addressArray.length;i++){
            angular.forEach($scope.addressArray[i].balance,function(val,key){
	            if(val.currency==symbol)
	            	notordered[i]=val.value;
            });
        }
        
        var ordered_keys;
		if (typeof Object.keys === 'function') {
		    ordered_keys = Object.keys(notordered);
		} else {
		    for (var key in notordered) {
		        ordered_keys.push(key);
		    }
		}
		
        ordered_keys.sort( function(a, b) {
			return notordered[a] < notordered[b];		
		});
		for ( var i = 0; i < ordered_keys.length; i++ ) {
		  	var obj=$scope.addressArray[ordered_keys[i]];
		  	
		addresses[i]=obj.address;
		if(obj.name)
	            names[i]=obj.name;
	        else
	            names[i]='';
	        if(obj.publickey)
	            publickeys[i]=obj.publickey;
	        else
	            publickeys[i]='';
	        if(obj.seed)
	            seeds[i]=obj.seed;
	        else
	            seeds[i]='';
	        if(obj.PK)
	            PK[i]=obj.PK;
	        else
	            PK[i]='';
	        
		}
		wallet.addresses=addresses;
        wallet.names=names;
        wallet.publickeys=publickeys;
        wallet.seeds=seeds;
        wallet.PK=PK;
        wallets[wallet_pos]=wallet;
        $scope.currentWallets=JSON.stringify(wallets);
        localStorage[Wallet.StorageKey] = JSON.stringify(wallets); 
        //window.location.reload();
        $scope.skip_adding_to_non_zero_total = true;
        $scope.reGetAddresses();
    }
    
    
    //Address Modal
    $scope.cleanAddAddressToWallet = function () {
        $scope.addPrivateKey = '';
        $scope.addPublicKey = '';
        $scope.addSeed = '';
        $scope.addAddress = '';
        $scope.showInvalidPKDlg = false;
        $scope.showPWDMissing = false;

    }
    $scope.addAddressToWallet = function(){
    	if(!$scope.addPrivateKey) $scope.addPrivateKey='';
    	if(!$scope.addPublicKey) $scope.addPublicKey='';
    	if(!$scope.addSeed) $scope.addSeed='';
    	if(!$scope.addAddress) $scope.addAddress='';
    	
    	var myURLParams = BTCUtils.getQueryStringArgs();
        var uuid = myURLParams['uuid'];
    	var wallet={};
    	var wallet_pos=0;
    	var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
	var addresses=new Array();
	var names=new Array();
        var PK=new Array();
        var publickeys=new Array();
        var seeds=new Array();
        for (var i = 0; i < wallets.length; i++) {
            if (wallets[i].uuid == uuid) {
                wallet=wallets[i];
                wallet_pos=i;
            }
        }
        
        if (!wallet) {
        	wallet = wallets[0];
        	wallet_pos = 0;
	}
        
        
       	for(var i=0;i<$scope.addressArray.length;i++){
            addresses[i]=$scope.addressArray[i].address;
            names[i]=$scope.addressArray[i].name;
            if($scope.addressArray[i].pk)
                PK[i]=$scope.addressArray[i].pk;
            else
                PK[i]='';
            
            if($scope.addressArray[i].publickey)
                publickeys[i]=$scope.addressArray[i].publickey;
            else
                publickeys[i]='';
            
            if($scope.addressArray[i].seed)
                seeds[i]=$scope.addressArray[i].seed;
            else
                seeds[i]='';
            
        }
        
		var cont=true;
		if ($scope.addPrivateKey != "") {
		    if ($scope.controlPrivateKey($scope.addPrivateKey)) {
		        var eckey = GetEckey($scope.addPrivateKey);
		        $scope.addAddress = GetAddress(eckey).toString();
		        $scope.addPublicKey = GetPublicKey(eckey).toString();
		        $scope.addSeed = GetSeed(eckey).toString();
		    }
		    else {
		        return;
		    }
    	}
    	
	    if($scope.addAddress!=""){
	    	for(var i=0;i<$scope.addressArray.length;i++){
                if($scope.addressArray[i].address==$scope.addAddress)
                    cont=false;
            }       
	    }    
	    
	    if($scope.addPublicKey!=""){
	    	for(var i=0;i<$scope.addressArray.length;i++){
                if($scope.addressArray[i].publickey==$scope.addPublicKey)
                    cont=false;
            }       
	    }
	    
	    if($scope.addSeed!=""){
	    	for(var i=0;i<$scope.addressArray.length;i++){
                if($scope.addressArray[i].seed==$scope.addSeed)
                    cont=false;
            }       
	    }
	    
	    
        if(cont){
        	var add=$scope.addAddress;
        	var pub=$scope.addPublicKey;
        	var seed=$scope.addSeed;
        	var pri=$scope.addPrivateKey;
        	if($scope.addAddress!=""){
	        	var file = 'addr/' + $scope.addAddress + '.json';	
		    	// Make the http request and process the result
		        $http.get(file, {}).error(function (data) {
			        $('#errorAddressModal').modal('show');
		        }).success(function(data){
		        	addresses.push(add);

		        	publickeys.push(pub);	
		        	seeds.push(seed);	
		        	names.push("");	
		        	PK.push("");
		        	
		        	wallet.addresses=addresses;
			        wallet.names=names;
			        wallet.publickeys=publickeys;
			        wallet.seeds=seeds;
				    wallet.PK = PK;
			        wallets[wallet_pos]=wallet;
			        $scope.currentWallets=JSON.stringify(wallets);
			        localStorage[Wallet.StorageKey] = JSON.stringify(wallets);

			        if (pri) {
			            if (!$scope.isPasswordExist() || !$scope.walletPasswordEnter) {
			                cont = false;
			            }
			            if (cont) {
			                var encPK = Wallet.encPK(pri, $scope.walletPasswordEnter);
			                Wallet.setPK(add, encPK);
			            }
			        }


		            //window.location.reload();
			        $scope.reGetAddresses();
		        });
        	}
        }
        $scope.addPrivateKey="";
        $scope.addAddress="";
        $scope.addPublicKey="";
        $scope.addSeed="";
        $('#addAddress').modal('hide');
    }
    
    //PK modal
    $scope.setPrivateKeyErrorShow=false;
    $scope.showInvalidPKDlg = false;
    $scope.showPWDMissing = false;
    $scope.checkPrivateKeyAddAddress = function (key) {
        $scope.showInvalidPKDlg = false;
        $scope.showPWDMissing = false;
        $scope.addAddress = '';
        $scope.addPublicKey = '';
        $scope.addSeed = '';
        if (!key) return true;
        if (CheckKey(key) && key) {

            var eckey = GetEckey(key);
        	$scope.addAddress=GetAddress(eckey);
        	$scope.addPublicKey = GetPublicKey(eckey);
        	$scope.addSeed = GetSeed(eckey);

        	if (!$scope.isPasswordExist() || !$scope.walletPasswordEnter) {
        	    $scope.showPWDMissing = true;
        	}

	     	return true;   
        } else {
            $scope.showInvalidPKDlg = true;
        	return false;
        }
    }

    $scope.controlPrivateKey = function (pk) {
        var eckey = GetEckey(pk);
        var address = GetAddress(eckey);
        if (!address || address == '') {
            //error

            return false;
        }
        return true;
    }

    $scope.getAddressFromPK = function (pk) {
        var eckey = GetEckey(pk);
        var address = GetAddress(eckey);
        
        return address;
    }
    
    $scope.checkPrivateKey=function(key){
        return CheckKey(key);
    }
    
    $scope.sortableOptions = {
        placeholder: "element-placeholder",
        handle: ".handle",
        update: function(e, ui) { 
            var myURLParams = BTCUtils.getQueryStringArgs();
            var uuid = myURLParams['uuid'];
            var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
            var wallet_pos=0;
            var wallet='';
            for (var i = 0; i < wallets.length; i++) {
                if (wallets[i].uuid == uuid) {
                    wallet=wallets[i];
                    wallet_pos=i;
                }
            }
            var addresses=new Array();
            var names=new Array();
            var publickeys = new Array();
            var seeds = new Array();
            var pks = new Array();

            var temp=$scope.addressArray;
            
            setTimeout(function(){
				for(var i=0;i<$scope.addressArray.length;i++){
	                addresses[i]=$scope.addressArray[i].address;
	                if($scope.addressArray[i].name)
	                    names[i]=$scope.addressArray[i].name;
	                else
	                    names[i]='';
	                if($scope.addressArray[i].publickey)
	                    publickeys[i]=$scope.addressArray[i].publickey;
	                else
	                    publickeys[i] = '';
	                if($scope.addressArray[i].seed)
	                    seeds[i]=$scope.addressArray[i].seed;
	                else
	                    seeds[i] = '';

	                if ($scope.addressArray[i].pk)
	                    pks[i] = $scope.addressArray[i].pk;
	                else
	                    pks[i] = '';
	                
	            }
	            
	            wallet.addresses=addresses;
	            wallet.names=names;
	            wallet.publickeys=publickeys;
	            wallet.seeds=seeds;
	            wallet.PK = pks;
	            wallets[wallet_pos]=wallet;
	            $scope.currentWallets=JSON.stringify(wallets);
	            localStorage[Wallet.StorageKey] = JSON.stringify(wallets);            
	        },1000);
            

        }
    };
    
    //name modal
    $scope.setNameFunction = function(address,name){
        if (Wallet.supportsStorage()) {
            var wallet={};
            var myURLParams = BTCUtils.getQueryStringArgs();
            var uuid = myURLParams['uuid'];
            var wallet_pos=0;
            if (localStorage[Wallet.StorageKey]) {
                var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
    
                for (var i = 0; i < wallets.length; i++) {
                    if (wallets[i].uuid == uuid) {
                        wallet=wallets[i];
                        wallet_pos=i;
                    }
                }
                //Returning the first wallet
                if (!uuid && wallets.length > 0)
                	wallet=wallets[0];
                	
                var addresses=wallet.addresses;
                var address_pos=0;
                for(var i=0; i< addresses.length; i++){
                    if(addresses[i]==address){
                        address_pos=i;
                        
                    }
                }
                //check names   
                if(!wallet.names){
                    wallet.names=new Array();
                    for(var i=0; i< addresses.length; i++){
                        wallet.names[i]="";
                    }
                }
                wallet.names[address_pos]=name;
                wallets[wallet_pos]=wallet;
	            $scope.currentWallets=JSON.stringify(wallets);
                localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
            }
            
            
        }
        $('#setName'+address).modal('hide');  

    }
    $scope.lastTransactions=new Array();
    //Last 10 transaction
    $scope.getLastTransaction = function (address) {

    	var file = 'addr/' + address + '.json';	
    	// Make the http request and process the result
        $http.get(file, {}).success(function (data, status, headers, config) {
            var last_transactions=new Array();
            var currency_symbols = Object.keys($scope.extracted_currencies);
            for (var i = 1; i < currency_symbols.length; i++) {
                var exo=$scope.extracted_currencies[currency_symbols[i]].exodus;
                var cid=exo+'-'+$scope.extracted_currencies[currency_symbols[i]].currency_id;
                //console.log(cid)
                //console.log(currency_symbols[i]);
                last_transactions=getLastTransactionFromData(last_transactions,data[cid],currency_symbols[i]);
            }
            //console.log(last_transactions);
            $scope.lastTransactions=last_transactions;
        });
    }
    
    //restore Address
    
    $scope.restoreWallets = function(json){
	    if (Wallet.supportsStorage) {
        	localStorage[Wallet.StorageKey]=json;
        	var wallets=JSON.parse(json);
        	var wallet=wallets[0];
        	location.href="wallet.html";
		}
    }
    
  
    $scope.DeleteAddress = function(addrIdx) {
    	var newAddressArray = Wallet.DeleteIndex($scope.uuid, addrIdx);
    	$scope.addressArray.splice(addrIdx,1);
    }
    
    $scope.CreateNewWallet = function() {
    	Wallet.CreateNewWallet();
    }

    $scope.getCurrency = function (item) {
        for (var i = 0; i < $scope.currencies.length; i++) {
            if (item == $scope.currencies[i].symbol) {
                return $scope.currencies[i].dollar;
            }
        }
    };  
    
    $scope.changeCurrency = function () {
       $scope.showDollarValues = !$scope.showDollarValues;
    };
    
    $scope.showAddress=true;
    $scope.toggleAddress = function(){
        $scope.showAddress=!$scope.showAddress;
    } 
     
    $scope.non_zero_currencies = new Array();
    $scope.skip_adding_to_non_zero_total = false;
    $scope.getWalletData = function () {
    
    	var myURLParams = BTCUtils.getQueryStringArgs();
	var uuid = myURLParams['uuid'];
    	$scope.uuid = uuid;

        $scope.getAddress = function (addr, callback) {
        	if(!addr) return null;
            return $http.get("addr/" + addr + ".json").success(
                function (value) {
                    return callback(value.data);
                }
            ).error(function(){
	            return null;
            });
        }

        $scope.refreshLoadedWallet = function () {
            if (Wallet.supportsStorage && localStorage[Wallet.StorageKey]) {
                $scope.currentWallets = localStorage[Wallet.StorageKey];
            }
        }

        $scope.getAddresses = function (callback) {

            var wallet = Wallet.GetWallet();
            
			if (Wallet.supportsStorage && localStorage[Wallet.StorageKey]) {
            	$scope.currentWallets = localStorage[Wallet.StorageKey];
			}
            var addresses = wallet.addresses;
            $scope.uuid = wallet.uuid;

            var prom = [];
            if(addresses)
	            addresses.forEach(function (obj, i) {
	                var addr = obj;
					var tmp=$scope.getAddress(addr, function (value) {});
					if(tmp){
		                prom.push(tmp);
		            }else{
			            var tmp=$scope.getAddress(publickeys[i], function (value) {});
			            prom.push(tmp);
		            }
	            });

            $q.all(prom).then(function (data) {

                callback(data);
            });
        };

        //Get extracted currencies (extracted_currencies.json)
        $http.get('general/extracted_currencies.json', {}).success(function (data, status, headers, config) {
            $scope.extracted_currencies = data[0];

        }).then(function () {
            console.log('finished getting extracted currencies');
        });

        //Get currencies
        $http.get('currencies.json', {}).success(function (data, status, headers, config) {
            //console.log('currencies');
            //console.log(data);

            $scope.currencies = data;

        }).then(function () {
            //console.log('finished');

            $scope.total = new Array();
            $scope.non_zero_total = new Array();
            //Total
            for (var i = 0; i < $scope.currencies.length; i++) {
                var itemTotal = {
                    currency: $scope.currencies[i].symbol,
                    value: 0
                };

                $scope.total.push(itemTotal);
            };

            //console.log($scope.total);
            $scope.reGetAddresses();
        });
        //console.log($scope.total);
       
    }

    $scope.reGetAddresses = function () {
        $scope.addressArray = [];
        // Start with zero totals
        for (var k = 0; k < $scope.currencies.length; k++) {
            $scope.total[k].value=0;
        }

        var j=0; // currencies counter over all addresses

        $scope.getSymbolIndex = function (item, only_non_zero) {
            // only_non_zero checks in the $scope.non_zero_currencies
            // otherwise check in $scope.currencies
            if (only_non_zero == true) {
                search_array=$scope.non_zero_currencies;
            } else {
                search_array=$scope.currencies;
            }
            for(var i=0;i<search_array.length;i++){
                if (search_array[i].symbol == item.symbol) {
                    return i;
                }
            }
            return -1;
        }

        $scope.getAddresses(function (data) {
            data.forEach(function (obj, i) {

                //Sort currencies as in the table and show only needed
                var k=0; // currencies counter over this address

                var dataBalance = [];

                for (var i = 0; i < $scope.currencies.length; i++) {
                    //For each currency in the currencies find the balance and add it to the array
                    var currency = $scope.currencies[i].symbol;
                    //    console.log(currency);

                    var value = Wallet.FindItemInArray(obj.data.balance, currency);
                    value = Wallet.ParseNumber(value);

                    //Adding to total
                    $scope.total[i].value = $scope.total[i].value + value;


                    var item = {
                        value: value,
                        symbol: $scope.currencies[i].symbol,
                        currency: currency
                    };

                    if (item.value > 0) {
                        var m = $scope.getSymbolIndex(item, true);
                        if (m<0) {
                            // adding new currency
                            $scope.non_zero_currencies[j]=item;
                            $scope.non_zero_total[j]=angular.copy(item);
                            j=j+1;
                        } else {
                            // updating existing currency
                            if ($scope.skip_adding_to_non_zero_total == false) {
                                $scope.non_zero_total[m].value = $scope.non_zero_total[m].value + value;
                            }
                        }
                        dataBalance[k]=item;
                        k=k+1;
                    }
                }


                //console.log(dataBalance);
                //console.log($scope.non_zero_currencies);

                var data = {
                    balance: dataBalance,
                    address: obj.data.address,
                    pk: Wallet.getPK(obj.data.address),
                    name: Wallet.GetNameFromLocalStorage(obj.data.address),
                    publickey: Wallet.GetPublicKeyFromLocalStorage(obj.data.address),
                    seed: Wallet.GetSeedFromLocalStorage(obj.data.address)
                };

                $scope.addressArray.push(data);
            });

            //console.log($scope.addressArray);
            //alert();
        });
    };

    $scope.getWalletData();
}


function locationOf(element, array, start, end) {
  start = start || 0;
  end = end || array.length;
  
  var pivot = parseInt(start + (end - start) / 2, 10);
  if (end-start <= 1 || array[pivot] === element) return pivot;
  if (array[pivot].tx_time < element.tx_time) {
    return locationOf(element, array, pivot, end);
  } else {
    return locationOf(element, array, start, pivot);
  }
}

function insertInOrderedArray(element, arr) {
    arr[arr.length] = element;
    var sorted = arr.sort(function (a, b) { return a.tx_time < b.tx_time });
    if (sorted.length <= 10)
        return sorted;
    return sorted.slice(0,9);
}

function getLastTransactionFromDataCicle(array,data_array,currency,title,page){
    var tmp="";
    for(var i=0;i<data_array.length;i++){
        tmp = data_array[i];
        tmp.page = page;
        if(array.length==10){
            if(tmp.tx_time>array[9].tx_time){
                tmp.currency=currency;
                tmp.title=title;
                array=insertInOrderedArray(tmp,array);
            }
        }else{
            tmp.currency=currency;
            tmp.title=title;        
            array=insertInOrderedArray(tmp,array);
        }
    }
    return array;
}

function getLastTransactionFromData(array,data,currency){
    array = getLastTransactionFromDataCicle(array, data.accept_transactions, currency, 'Sell accepts', 'sellaccept.html');
    array = getLastTransactionFromDataCicle(array, data.bought_transactions, currency, 'Bought coins', 'btcpayment.html');
    array = getLastTransactionFromDataCicle(array, data.exodus_transactions, currency, 'Exodus transactions', 'exodus.html');
    array = getLastTransactionFromDataCicle(array, data.offer_transactions, currency, 'Sell offers', 'selloffer.html');
    array = getLastTransactionFromDataCicle(array, data.received_transactions, currency, 'Received transactions', 'simplesend.html');
    array = getLastTransactionFromDataCicle(array, data.sent_transactions, currency, 'Sent transactions', 'simplesend.html');
    array = getLastTransactionFromDataCicle(array, data.sold_transactions, currency, 'Sold coins', 'sellaccept.html');
    return array;
}


Wallet = function () {
};

Wallet.GetNameFromLocalStorage = function (address){

    var wallet=Wallet.GetWallet();
    if(!wallet.names){
        return "";
    }else{
        var addresses=wallet.addresses;
        var address_pos=-1;
        for(var i=0; i< addresses.length; i++){
            if(addresses[i]==address){
                address_pos=i;
                
            }
        }
        if(address_pos>=0)
	        return wallet.names[address_pos];
    }
    return "";
}


Wallet.GetPublicKeyFromLocalStorage = function (address){

    var wallet=Wallet.GetWallet();
    if(!wallet.publickeys){
        return "";
    }else{
        var addresses=wallet.addresses;
        var address_pos=-1;
        for(var i=0; i< addresses.length; i++){
            if(addresses[i]==address){
                address_pos=i;
            }
        }
        if(address_pos>=0)
	        return wallet.publickeys[address_pos];
    }
    return "";
}

Wallet.GetSeedFromLocalStorage = function (address){

    var wallet=Wallet.GetWallet();
    if(!wallet.seeds){
        return "";
    }else{
        var addresses=wallet.addresses;
        var address_pos=-1;
        for(var i=0; i< addresses.length; i++){
            if(addresses[i]==address){
                address_pos=i;
            }
        }
        if(address_pos>=0)
	        return wallet.seeds[address_pos];
    }
    return "";
}



//decrypt pk
Wallet.decryptPK = function (encryptedPK, Password, Address){	
	return Wallet.decPK(encryptedPK, Password);
}
Wallet.ParseNumber = function (number) {
    if (number.indexOf('.')>-1) {
        return parseFloat(number);
    }
    return parseInt(number);
};
Wallet.FindItemInArray = function (array, item) {
    if (array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].symbol == item) {
                return array[i].value;
            }
        }
        
    }

    return 0;
   
};
Wallet.StorageKey = "master-wallets";

Wallet.SyncWithServer = function () {

};
Wallet.GenerateUUID = function () {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
    return uuid;
};

Wallet.GetWallet = function () {
    var wallet = Wallet.GetWalletInt();

    if (!wallet.addresses) {
        wallet.addresses = new Array();
    }
    if (!wallet.names) {
        wallet.names = new Array();
        for (var i = 0; i < wallet.addresses.length; i++) {
            wallet.names[i] = "";
        }
    }
    return wallet;
};

Wallet.GetWalletInt = function () {
    if (Wallet.supportsStorage()) {

        var myURLParams = BTCUtils.getQueryStringArgs();
        var uuid = myURLParams['uuid'];

        if (localStorage[Wallet.StorageKey]) {
            var wallets = JSON.parse(localStorage[Wallet.StorageKey]);

            for (var i = 0; i < wallets.length; i++) {
                if (wallets[i].uuid == uuid) {
                    return wallets[i];
                }
            }
            //Returning the first wallet
            if (!uuid && wallets.length > 0)
                return wallets[0];
        }
        // No wallets - create one
        Wallet.CreateNewWallet(uuid);
        var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
        return wallets[0];
    }
    return new Array();

};

Wallet.AddAddress = function (address) {
    if (Wallet.supportsStorage()) {

        var uuidToOpen = "";
        
        if (!localStorage[Wallet.StorageKey]) 
        {
       	    Wallet.CreateNewWallet();
        }
        var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
        if (!wallets || wallets.length == 0) {
        	Wallet.CreateNewWallet();
        }
        
        //Add address to the first wallet
        if (!wallets[0].addresses) {
        	wallets[0].addresses = new Array();
        }
        for (var i = 0; i < wallets[0].addresses.length; i++) {
        	if (wallets[0].addresses[i] == address) {
        		window.location.href = "wallet.html";
        		return;
        	}
        }
        wallets[0].addresses.push(address);
        
        
        if (!wallets[0].names) {
	        wallets[0].names = new Array();
        }
	wallets[0].names.push("");
	
	if (!wallets[0].publickeys) {
		wallets[0].publickeys = new Array();
	}
	wallets[0].publickeys.push("");
	
	if (!wallets[0].seeds) {
		wallets[0].seeds = new Array();
	}
	wallets[0].seeds.push("");
	
	if (!wallets[0].PK) {
		wallets[0].PK = new Array();
	}
	wallets[0].PK.push("");

        uuidToOpen = wallets[0].uuid;

        localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
        
        window.location.href = "wallet.html?uuid=" + uuidToOpen;

    }
};

Wallet.GetAddressesOfFirstWallet = function () {
    var retVal = new Array();
    if (!Wallet.supportsStorage()) {
        return retVal;
    }
        
    if (!localStorage[Wallet.StorageKey]) {
       	return retVal;
    }
    
    var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
    
    if (wallets.length <= 0 || wallets.length > 100 || !wallets[0] || !wallets[0].addresses) {
    	return retVal;
    }
           
    retVal = wallets[0].addresses;
    
    return retVal;
};


Wallet.DeleteIndex = function (walletUuid, idx) {
    if (!Wallet.supportsStorage()) {
        return null;
    }
        
    if (!localStorage[Wallet.StorageKey]) {
       	return null;
    }
    
    var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
    
    if (wallets.length < 0 || wallets.length > 100) {
    	return null;
    }
    
    var walletIndex = -1;
    for (var i = 0; i < wallets.length; i++) {
	    if (wallets[i].uuid == walletUuid) {
		walletIndex = i;
	    }
    }
    
    if (walletIndex < 0)
        return null;
    
    
    wallets[walletIndex].addresses.splice(idx,1);
    
    var retVal = wallets[walletIndex].addresses;
    
    localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
    
    return retVal;
};

Wallet.avoidRedirect = false;

Wallet.CreateNewWallet = function (in_uuid) {
    var uuid = (in_uuid)? in_uuid : Wallet.GenerateUUID();
    if (Wallet.supportsStorage()) {

        var uuidToOpen = "";

        if (localStorage[Wallet.StorageKey]) {
            var wallets = JSON.parse(localStorage[Wallet.StorageKey]);

            //Create new wallet
            var addresses = new Array();
            var wallet = {
                uuid: uuid,
                addresses: addresses
            };

            console.log(wallets);

            wallets.unshift(wallet);

            console.log(wallets);

            uuidToOpen = wallets[0].uuid;

            localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
        }
        else {//Walets dont exists
            //Create new wallet and add this addr to it

            uuidToOpen = uuid;

            var addresses = new Array();

            var obj = {
                uuid: uuid,
                addresses: addresses
            };

            console.log(obj);
            console.log(JSON.stringify(obj));

            var wallets = new Array();
            wallets.push(obj);

            console.log(wallets);
            console.log(JSON.stringify(wallets));

            localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
        }



        //open wallet.html with the URL parameter: uuid=uuid-of-first-address
	if (!Wallet.avoidRedirect) {
        	window.location.href = "wallet.html?uuid=" + uuidToOpen;
	}


    }
};

Wallet.supportsStorage = function () {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
};

Wallet.StoreEncPwd = function (pwd) {
    var retVal = new Array();
    if (!Wallet.supportsStorage()) {
        return retVal;
    }
        
    if (!localStorage[Wallet.StorageKey]) {
       	return retVal;
    }
    
    var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
    
    if (wallets.length <= 0 || wallets.length > 100 || !wallets[0] || !wallets[0].addresses) {
    	return retVal;
    }
           
    retVal = wallets[0].pwd = pwd;
    localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
    
    return retVal;
};

Wallet.LoadEncPwd = function () {
    var retVal = new Array();
    if (!Wallet.supportsStorage()) {
        return retVal;
    }
        
    if (!localStorage[Wallet.StorageKey]) {
       	return retVal;
    }
    
    var wallets = JSON.parse(localStorage[Wallet.StorageKey]);
    
    if (wallets.length <= 0 || wallets.length > 100 || !wallets[0] || !wallets[0].addresses) {
    	return retVal;
    }
           
    retVal = wallets[0].pwd;
    
    return retVal;
};

Wallet.wordToByteArray = function (wordArray) {
    var byteArray = [], word, i, j;
    for (i = 0; i < wordArray.length; ++i) {
        word = wordArray[i];
        for (j = 3; j >= 0; --j) {
            byteArray.push((word >> 8 * j) & 0xFF);
        }
    }
    return byteArray;
} 

Wallet.calcPwdDigest = function (pwd) {
        var pwdDigest1 = CryptoJS.PBKDF2(pwd, "masterchain_password_salt", { keySize: 512 / 32, iterations: 750} );
	// Convert to base58
	var byteArray = Wallet.wordToByteArray(pwdDigest1.words);
	var strep = Bitcoin.Base58.encode(byteArray);
	return strep;
}

//PK 
Wallet.setPK = function (address, PK) {
	if (Wallet.supportsStorage()) {
	    var wallet={};
	    var myURLParams = BTCUtils.getQueryStringArgs();
	    var uuid = myURLParams['uuid'];
	    var wallet_pos=0;
	    if (localStorage[Wallet.StorageKey]) {
		var wallets = JSON.parse(localStorage[Wallet.StorageKey]);

		for (var i = 0; i < wallets.length; i++) {
		    if (wallets[i].uuid == uuid) {
			wallet=wallets[i];
			wallet_pos=i;
		    }
		}
		//Returning the first wallet
		if (!uuid && wallets.length > 0)
			wallet=wallets[0];

		var addresses=wallet.addresses;
		var address_pos=0;
		for(var i=0; i< addresses.length; i++){
		    if(addresses[i]==address){
			address_pos=i;

		    }
		}
		//check PK   
		if(!wallet.PK){
		    wallet.PK=new Array();
		    for(var i=0; i< addresses.length; i++){
			wallet.PK[i]="";
		    }
		}
		wallet.PK[address_pos]=PK;
		wallets[wallet_pos]=wallet;
		localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
	    }


	}
}

Wallet.getPK = function (address) {
	if (!Wallet.supportsStorage()) {
		return null
	}
	var wallet={};
	var myURLParams = BTCUtils.getQueryStringArgs();
	var uuid = myURLParams['uuid'];
	var wallet_pos=0;
	if (!localStorage[Wallet.StorageKey]) {
	    return null;
	}
	var wallets = JSON.parse(localStorage[Wallet.StorageKey]);

	for (var i = 0; i < wallets.length; i++) {
		if (wallets[i].uuid == uuid) {
		wallet=wallets[i];
		wallet_pos=i;
		}
	}
	//Returning the first wallet
	if (!uuid && wallets.length > 0)
		wallet=wallets[0];

	var addresses=wallet.addresses;
	var address_pos=0;
	for(var i=0; i< addresses.length; i++){
		if(addresses[i]==address){
		address_pos=i;

		}
	}
	//check PK   
	if(!wallet.PK){
	    return null;
	}
	return wallet.PK[address_pos];
}

//PK 
Wallet.setPubK = function (address, PK) {
    if (Wallet.supportsStorage()) {
        var wallet = {};
        var myURLParams = BTCUtils.getQueryStringArgs();
        var uuid = myURLParams['uuid'];
        var wallet_pos = 0;
        if (localStorage[Wallet.StorageKey]) {
            var wallets = JSON.parse(localStorage[Wallet.StorageKey]);

            for (var i = 0; i < wallets.length; i++) {
                if (wallets[i].uuid == uuid) {
                    wallet = wallets[i];
                    wallet_pos = i;
                }
            }
            //Returning the first wallet
            if (!uuid && wallets.length > 0)
                wallet = wallets[0];

            var addresses = wallet.addresses;
            var address_pos = 0;
            for (var i = 0; i < addresses.length; i++) {
                if (addresses[i] == address) {
                    address_pos = i;

                }
            }
            //check public keys   
            if (!wallet.publickeys) {
                wallet.publickeys = new Array();
                for (var i = 0; i < addresses.length; i++) {
                    wallet.publickeys[i] = "";
                }
            }
            wallet.publickeys[address_pos] = PK;
            wallets[wallet_pos] = wallet;
            localStorage[Wallet.StorageKey] = JSON.stringify(wallets);
        }


    }
}

Wallet.getPubK = function (address) {
    if (!Wallet.supportsStorage()) {
        return null
    }
    var wallet = {};
    var myURLParams = BTCUtils.getQueryStringArgs();
    var uuid = myURLParams['uuid'];
    var wallet_pos = 0;
    if (!localStorage[Wallet.StorageKey]) {
        return null;
    }
    var wallets = JSON.parse(localStorage[Wallet.StorageKey]);

    for (var i = 0; i < wallets.length; i++) {
        if (wallets[i].uuid == uuid) {
            wallet = wallets[i];
            wallet_pos = i;
        }
    }
    //Returning the first wallet
    if (!uuid && wallets.length > 0)
        wallet = wallets[0];

    var addresses = wallet.addresses;
    var address_pos = 0;
    for (var i = 0; i < addresses.length; i++) {
        if (addresses[i] == address) {
            address_pos = i;

        }
    }
    //check Public Keys   
    if (!wallet.publickeys || wallet.publickeys.length <= address_pos) {
        return null;
    }
    return wallet.publickeys[address_pos];
}


Wallet.encPK = function (PK, PWD) {
    var encrypted = CryptoJS.AES.encrypt(PK, PWD);
    if (!encrypted) return null;
    //return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
    return encrypted.toString();
}

Wallet.decPK = function (PK, PWD) {
    var decrypted = CryptoJS.AES.decrypt(PK, PWD);
    if (!decrypted) return null;
    return decrypted.toString(CryptoJS.enc.Utf8);
}


$(document).ready(function () {
    $('#createNewWallet').click(function () {
        Wallet.CreateNewWallet();
    });
    
    if (!localStorage['WalletHelp']) {
        $('#helpModal').modal('show');
    };

    $('#syncWithServer').click(function () {
        Wallet.SyncWithServer();
    });
     $('.slide-out-div').tabSlideOut({
         tabHandle: '.handle',                              //class of the element that will be your tab
         pathToTabImage: 'img/newcoin.png',          //path to the image for the tab (optionaly can be set using css)
         imageHeight: '146px',                               //height of tab image
         imageWidth: '30px',                               //width of tab image    
         tabLocation: 'right',                               //side of screen where tab lives, top, right, bottom, or left
         speed: 300,                                        //speed of animation
         action: 'click',                                   //options: 'click' or 'hover', action to trigger animation
         topPos: '72px',                                   //position from the top
         fixedPosition: false                               //options: true makes it stick(fixed position) on scroll
     });

});


function giveHelp(){
    localStorage['WalletHelp']=true;
    $('#helpModal').modal('hide');
    setTimeout(function(){
        window.open('Masterchain_wallet_01.pdf','_blank');
    }, 0);
    
}

function closeHelpModal(){
    localStorage['WalletHelp']=true;
    $('#helpModal').modal('hide');
}
