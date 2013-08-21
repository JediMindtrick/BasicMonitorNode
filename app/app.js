var cfg = require('./config').config
	, _ = require('underscore')
	, util = require('./appUtil')
	, httpPing = require('./httpPing').httpPing
	, authenticatedPing = require('./httpPing').authenticatedPing
	, messaging = require('./messagingGateway')
	, creds = require('./credentials');


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
				validActions: ['stop','resetPair','resetSUT','resetAll']
			},
			sutUnresponsive: {
				validActions: ['resetSUT','resetAll']
			},
			pairUnresponsive: {
				validActions: ['resetPair','resetAll']
			},
			allBroken: {
				validActions: ['resetSUT','resetPair','resetAll']
			}
		},
		actions: []
	};

	_myApp = toReturn;

	return toReturn;
};

var _handlePingError = function(failedSystem,body){
	console.log('ping ' + failedSystem + ' error');

	var msg = _copy(cfg.pingFailureEmail.message);

	msg.customProperties.EmailFrom = msg.customProperties.EmailFrom.replace('[port here]',cfg.port.toString());
	msg.customProperties.EmailSubject = msg.customProperties.EmailSubject
		.replace('[system here]',failedSystem)
		.replace('[port here]',cfg.port.toString());
	msg.customProperties.EmailBody = body;

	messaging.sendEmail(msg,cfg.pingFailureNotificationAddresses);
};

var _pingSUT = function(){
	console.log('pinging SUT...');

	var opts = _copy(cfg.pairPingOptions);
	opts.username = creds.crmUsername;
	opts.password = creds.crmPassword;

	setTimeout(function(){
		authenticatedPing(
			opts,
			function(){
				console.log('ping SUT success');

				_myApp.currentState = 
					_myApp.currentState === 'allBroken' ||
					_myApp.currentState === 'pairUnresponsive' ?
						_myApp.currentState = 'pairUnresponsive' :
						_myApp.currentState = 'running';

				_pingSUT();
			},
			function(){
				if(['running','stopped','pairUnresponsive']
					.indexOf(_myApp.currentState) > -1){
					_handlePingError("SUT",'Unable to reach ' +
						util.getUrlFromOptions(cfg.sutPingOptions) +  
						' through http ping.');
				}

				_myApp.currentState = 
					_myApp.currentState === 'pairUnresponsive' || 
					_myApp.currentState === 'allBroken' ?
						_myApp.currentState = 'allBroken' :
						_myApp.currentState = 'sutUnresponsive';

				_pingSUT();
			});
		}, 
	cfg.pingSUTTimeout);
};

var _pingPair = function(){
	console.log('pinging pair...');

	setTimeout(function(){
		httpPing(
			cfg.pairPingOptions,
			function(){
				console.log('ping pair success');

				_myApp.currentState = 
					_myApp.currentState === 'allBroken' ||
					_myApp.currentState === 'sutUnresponsive' ?
						_myApp.currentState = 'sutUnresponsive' :
						_myApp.currentState = 'running';

				_pingPair();
			},
			function(){

				if(['running','stopped','sutUnresponsive']
					.indexOf(_myApp.currentState) > -1){
					_handlePingError("Pair",'Unable to reach ' +
						util.getUrlFromOptions(cfg.pairPingOptions) +  
						' through http ping.');
				}

				_myApp.currentState = 
					_myApp.currentState === 'sutUnresponsive' || 
					_myApp.currentState === 'allBroken' ?
						_myApp.currentState = 'allBroken' :
						_myApp.currentState = 'pairUnresponsive';

				_pingPair();
			});
		}, 
	cfg.pingPairTimeout);
};

actions.resetAll = function(app){

	app.currentState = 'running';

	return 'OK';
};

actions.resetPair = function(app){
	if(app.currentState === 'running') return;

	app.currentState = 
		_myApp.currentState === 'allBroken' ?
			_myApp.currentState = 'sutUnresponsive' :
			_myApp.currentState = 'running';

	return 'OK';
};

actions.resetSUT = function(app){
	if(app.currentState === 'running') return;

	app.currentState = 
		_myApp.currentState === 'allBroken' ?
			_myApp.currentState = 'pairUnresponsive' :
			_myApp.currentState = 'running';

	return 'OK';
};

actions.start = function(app){
	_pingSUT();
	_pingPair();

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