var crypto = require('crypto');
var md5 = crypto.createHash('md5');

exports.config = {
	//port: 65535, theoretical maximum port #
	//port: 59999, practical maximum port #
	//port: 1025, practical minimum port #
	//admin 1025-1999
	//monitor 2000-2999
	port: 2000,
	ipHash: md5.digest('hex'),

	sutPingOptions:{
		hostname: 'localhost',
		port:3000,
		method:'GET'
	},
	pingSUTTimeout: 5000,

	pairPingOptions: {
		hostname: 'localhost',
	 	port: 2001,
		method: 'GET',
		path: '/admin/health'
	},
	pingPairTimeout: 5000,
	pingFailureEmail: {
		body:'',
		message: {
			customProperties: {
				EmailFrom: 'CredAbility-Monitoring@CredAbility.org',
				EmailTo: 'brandonjwilhite@gmail.com',
				EmailSubject: 'Node-[port here]-Ping Failure-System-[system here]',
				EmailBody: '',
				RawContent: '',
				Agent: ''
			}
		}
	},
	pingFailureNotificationAddresses: ['brandonjwilhite@gmail.com']
};