var cfg = require('./config').config
	, _ = require('underscore')
	, util = require('./appUtil')
	, pings = require('./httpPing')
	, httpPing = require('./httpPing').httpPing
	, authenticatedPing = require('./httpPing').authenticatedPing
	, messaging = require('./messagingGateway')
	, creds = require('./credentials')
	, myName = require('./name').name;


var _copy = function(app){
	return JSON.parse(
		JSON.stringify(app));
};	

var actions = {};
var _myApp = null;
var getNewApp = function(){

	var toReturn = {
		currentState: 'stopped',
		states: {
			stopped: {
				validActions: ['start']
			},
			running: {
				validActions: ['stop']
			},
			sutUnresponsive: {
				validActions: []
			},
			pairUnresponsive: {
				validActions: []
			},
			allBroken: {
				validActions: []
			}
		},
		actions: []
	};

	_myApp = toReturn;

	return toReturn;
};

//two statuses right now "OK" and "ERROR"
var _monitors = {};
var _getMonitor = function(monitorName){
	return _monitors[monitorName];
};

var _handlePingError = function(failedSystem,body){

	var msg = _copy(cfg.pingFailureEmail.message);

	msg.customProperties.EmailFrom = msg.customProperties.EmailFrom.replace('[port here]',cfg.port.toString());
	msg.customProperties.EmailSubject = msg.customProperties.EmailSubject
		.replace('[system here]',failedSystem)
		.replace('[name here]', myName);
	msg.customProperties.EmailBody = body;

	messaging.sendEmail(msg,cfg.pingFailureNotificationAddresses);
};

var _monitor = function(monitor,_myApp,config){

	_monitors[monitor.systemName] = {
		monitor: monitor,
		status: "OK"
	};

	var _pingSUT = function(){

		console.log('pinging ' + monitor.systemName + '...');

		var opts = _copy(monitor.pingOptions);
		opts.username = creds.crmUsername;
		opts.password = creds.crmPassword;

		setTimeout(function(){
			pings[monitor.pingFunction](
				opts,
				function(){
					console.log('ping ' + monitor.systemName + ' success');

					_getMonitor(monitor.systemName).status = "OK";

					_pingSUT();
				},
				function(){

					console.log('ping ' + monitor.systemName + ' error');

					if(_getMonitor(monitor.systemName).status === "OK"){
						_handlePingError(monitor.systemName,'Unable to reach ' +
							util.getUrlFromOptions(monitor.pingOptions) +  
							' through http ping.');
					}

					_getMonitor(monitor.systemName).status = "ERROR";

					_pingSUT();
				});
			}, 
			monitor.timeout);
	};


	console.log('starting monitor ' + monitor.systemName);
	_pingSUT();
};

actions.start = function(app){

	_.each(cfg.monitors,function(monitor){
		_monitor(monitor,_myApp,cfg);
	});
	
	app.currentState = 'running';

	return 'OK';
};

actions.stop = function(app){

	app.currentState = 'stopped';

	return 'OK';
};

var _do = function(/* args */){

	var args = _.toArray(arguments);

	var _app = args[0];
	var _action = args[1];
	var app = _myApp;

	var fun = actions[_action];
	if(!fun){
		throw ('Client error: unknown action requested ' + _action);
	}

	var errs = util.isValidAction(app,_action);
	if(errs.length > 0){
		throw ('Client error: invalid action ' + _action);
	}

	var result = null;

	try{
		result = fun(app);		
	}catch(err){
		result = {errMessage: err};
	}

	app.actions.push({action: _action, result: result});

	return app;
};

exports.getNewApp = getNewApp;
exports.doAction = _do;