var cfg = require('./config').config
	, _ = require('underscore')
	, util = require('./appUtil')
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

var _pingSUT = function(){
	console.log('pinging SUT...');

	setTimeout(function(){
		httpPing(
			cfg.sutPingOptions,
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
				console.log('ping SUT error');
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
				console.log('ping pair error');
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