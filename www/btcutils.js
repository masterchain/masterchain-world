/*
    Copyright Masterchain Grazcoin Grimentz 2013-2014
    https://github.com/masterchain/masterchain-world
    https://masterchain.info
    masterchain@@bitmessage.ch
    https://masterchain.info/LICENSE.txt
*/

function BTCUtils() {
}

///// Public Methods


BTCUtils.getQueryStringArgs = function () {
	//get query string without the initial ?
	var qs = (location.search.length > 0 ? location.search.substring(1) : ""),
		//object to hold data
		args = {},
		//get individual items
		items = qs.length ? qs.split("&") : [],
		item = null,
		name = null,
		value = null,
		//used in for loop
		i = 0,
		len = items.length;
	//fill defaults
	args['title']='Masterchain data'
	args['tx']='sample_tx'
	args['addr']='sample_addr'
	args['currency']='MSC'
	args['page']='0000'
	//assign each item onto the args object
	for (i=0; i < len; i++){
		item = items[i].split("=");
		name = decodeURIComponent(item[0]);
		value = decodeURIComponent(item[1]);
		if (name.length) {
			args[name] = value;
		}
	}
	return args;
}

BTCUtils.isAddress = function(adr) {
    var re = /^[13][1-9A-HJ-NP-Za-km-z]{26,33}$/;
    return re.test(adr);
}

BTCUtils.isTxId = function(txid) {
    var re = /^[0-9a-fA-F]{64}$/;
    return re.test(txid);
}
