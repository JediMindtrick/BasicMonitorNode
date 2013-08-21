var azure = require('azure')
	, creds = require('./credentials');

process.env.AZURE_SERVICEBUS_NAMESPACE= creds.namespace;
process.env.AZURE_SERVICEBUS_ACCESS_KEY= creds.key;

var queueService = azure.createServiceBusService();

exports.sendEmail = function(msg,emails){
	var emailList = emails;

	if(!emails){
		emailList = [msg.customProperties.EmailTo];
	}

	for(var i = 0, l = emailList.length; i < l; i++){

		msg.customProperties.EmailTo = emailList[i];
		var message = JSON.parse(JSON.stringify(msg));

		queueService.sendQueueMessage('email-prod', message, function(error){
			if(!error){
				console.log('Email message sent to queue.');
			}else{
				console.log('Problem sending email: ');
				console.log(JSON.stringify(message));
				console.log(error);
			}
		}); 
	}
};