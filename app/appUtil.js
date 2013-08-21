var _ = require('underscore');
require('./checker');

var getCurrentState = function(app){
	return app.states[app.currentState];
};

var getNextValidActions = function(app){
	var _curr = getCurrentState(app);
	return _curr.validActions;
};

var _isValidAction = _.validator(
	'Invalid action',	
	function(app,action){

		var actions = getCurrentState(app)
			.validActions;

		return actions.indexOf(action) > -1;
	});

var _getUrlFromOptions = function(opt){
	return '' +
		(opt.method ? opt.method : 'GET') + ' ' +
		opt.hostname + ':' + opt.port + 
		(opt.path ? opt.path : '/');
};

exports.getCurrentState = getCurrentState;
exports.getNextValidActions = getNextValidActions;
exports.isValidAction = _.checker(_isValidAction);
exports.getUrlFromOptions = _getUrlFromOptions;