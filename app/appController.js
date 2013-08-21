var appMod = require('./app')
	, util = require('./appUtil');
var	app = appMod.getNewApp();
app = appMod.doAction(app,'start');

exports.health = function(){
	return {
		actions: app.actions,
		status: app.currentState,
		nextValidActions: util.getNextValidActions(app)
	};
};

//serialize/deserialize, validate, translate, call function
exports.handleAction = function(req,res){

	var action = req.params.action;

	try{
		app = appMod.doAction(app,action);
	}catch(err){
		if(err.indexOf('Client error: unknown action requested') > -1){

			app.actions.push({action: action,result:'ERR',errMessage:err});
			res.status(404).send(err);
		}else if(err.indexOf('Client error:') > -1){

			app.actions.push({action: action,result:'ERR',errMessage:err});
			res.status(400).send(err);
		}else{

			app.actions.push({action: action,result:'ERR',errMessage:err});
			res.status(500).send('oops, we messed up: ' + err);
		}

		return;
	}

	res.status(200).send({
		actions: app.actions,
		status: app.currentState,
		nextValidActions: util.getNextValidActions(app)
	});

	return;
};