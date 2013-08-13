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

exports.getCurrentState = getCurrentState;
exports.getNextValidActions = getNextValidActions;
exports.isValidAction = _.checker(_isValidAction);