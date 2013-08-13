var cfg = require('./config').config
	, _ = require('underscore')
	, checks = require('./appConstraints');

var getNewApp = function(){

	var toReturn = {
		currentState: 'stopped',
		states: {
			stopped: {
				validActions: ['start']
			},
			running: {
				validActions: ['stop']
			}
		},
		actions: []
	};

	return toReturn;
};

var _copy = function(app){

	return JSON.parse(
		JSON.stringify(app));
};

var actions = {};

actions.start = function(app){
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
	var app = _copy(_app);

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