var http = require('http');

/*
NOTE:  Using the longer version of creating and running the request,
because the shorter http.get() seems to hang the script.  Even though
.get() is supposed to end the request, it appears that it is not (at 
least on my machine).
*/
var pingSite = function(options,onSuccess,onFailure){

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

exports.httpPing = pingSite;