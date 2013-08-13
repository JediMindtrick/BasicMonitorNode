var cfg = require('./config').config
	, _ = require('underscore')
	, checks = require('./appConstraints')
	, httpPing = require('./httpPing').httpPing;


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
				validActions: ['stop','resetPair','resetSUT']
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

var _timer = null;

var _pingSUT = function(){
	console.log('pinging SUT...');

	_timer = setTimeout(function(){
		httpPing({
				hostname: 'localhost',
			 	port: 3000,
				method: 'GET'
			},
			function(){
				console.log('ping SUT success');
				_pingSUT();
			},
			function(){
				console.log('ping SUT error');
				_myApp.currentState = 
					_myApp.currentState === 'pairUnresponsive' || 
					_myApp.currentState === 'allBroken' ?
						_myApp.currentState = 'allBroken' :
						_myApp.currentState = 'sutUnresponsive';
			});
		}, 
	cfg.pingSUTTimeout);
};

var _pingPair = function(){
	console.log('pinging pair...');

	_timer = setTimeout(function(){
		httpPing(
			cfg.pairPingOptions,
			function(){
				console.log('ping pair success');
				_pingPair();
			},
			function(){
				console.log('ping pair error');
				_myApp.currentState = 
					_myApp.currentState === 'sutUnresponsive' || 
					_myApp.currentState === 'allBroken' ?
						_myApp.currentState = 'allBroken' :
						_myApp.currentState = 'pairUnresponsive';
			});
		}, 
	cfg.pingPairTimeout);
};

var _resetPair_PingPair = function(){
	httpPing(
		cfg.pairResetPairOptions,
		function(){},
		function(){});
};

var _resetPair_PingSUT = function(){
	httpPing(
		cfg.pairResetSUTOptions,
		function(){},
		function(){});
};

actions.resetPair = function(app){
	if(app.currentState === 'running') return;

	app.currentState = 
		_myApp.currentState === 'allBroken' ?
			_myApp.currentState = 'sutUnresponsive' :
			_myApp.currentState = 'running';

	_pingPair();

	return 'OK';
};

actions.resetSUT = function(app){
	if(app.currentState === 'running') return;

	app.currentState = 
		_myApp.currentState === 'allBroken' ?
			_myApp.currentState = 'pairUnresponsive' :
			_myApp.currentState = 'running';

	//i.e. the pair is responsive
	if(_myApp.currentState === 'running'){
		_resetPair_PingSUT();
	}

	_pingSUT();

	return 'OK';
};

actions.start = function(app){
	_pingSUT();
	_pingPair();
	_resetPair_PingPair();

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
//	var app = _copy(_app);
	var app = _myApp;

	var fun = actions[_action];
	if(!fun){
		throw ('Client error: unknown action requested ' + _action);
	}

	var errs = checks.isValidAction(app,_action);
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