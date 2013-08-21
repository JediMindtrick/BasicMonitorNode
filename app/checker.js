var _ = require('underscore');

/*modified from original to handle multiple arguments*/
var checker = function(/* validators */) {
	var validators = _.toArray(arguments);

	return function(/* args */) {
		var _args = _.toArray(arguments);
    	return _.reduce(validators, function(errs, check) {
      		if (check.apply(check,_args))
        		return errs;
      		else
        		return _.chain(errs).push(check.message).value();
    	}, []);
  	};
};

var validator = function(message, fun) {
		var f = function(/* args */) {
		return fun.apply(fun, arguments);
		};

		f['message'] = message;
		return f;
};

var arg2 = function(pred) {

	var fun = function() {
		var args = _.toArray(arguments);
		return pred(args[1]);
	};

	fun.message = '2nd argument: ' + pred.message;
	return fun;
};

_.checker = checker;
_.validator = validator;
_.arg2 = arg2;