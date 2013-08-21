var http = require('http');

/*
NOTE:  Using the longer version of creating and running the request,
because the shorter http.get() seems to hang the script.  Even though
.get() is supposed to end the request, it appears that it is not (at 
least on my machine).
*/
var pingSite = function(site,onSuccess,onFailure){

	var options = {
		hostname: site,
	 	port: 80,
		method: 'GET'
	};

	var req = http.request(options, function(res) {

		if(res.statusCode === 200 && onSuccess){
			onSuccess();
		}else if (res.statusCode >= 400 && onFailure){
			onFailure();
		}
		//this may seem useless, but the ping 'hangs' if we don't have it
		res.on('data', function (chunk) {
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		if(onFailure){ onFailure(); }
	});

	req.end();
};

var _count = 0;
var setRecurringPing = function(site,intervalInMs){
	return setInterval(function(){
		pingSite(site
			,function(){ 
				_count++;
				console.log('success ' + _count); 
			}
			,function(){ console.log('error!!!'); });	
	},intervalInMs);
};

setRecurringPing('credability-phonecall-dev0.azurewebsites.net',30000);