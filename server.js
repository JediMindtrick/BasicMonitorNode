//just a shell to run the application

var express = require('express')
  , routes = require('./routes')
  , cfg = require('./app/config').config
  , appController = require('./app/appController');

var server = module.exports = express.createServer();

// Configuration
server.configure(function(){
  server.use(express.bodyParser());
  server.use(express.methodOverride());
  server.use(server.router);
  server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Routes
server.get('/config', routes.config);
server.get('/favicon.ico',function(req,res){
	res.status(404);
});

server.get('/admin/health',function(req,res){
	res.send(appController.health());	
});
server.get('/admin/:action',appController.handleAction);

server.listen(cfg.port, function(){
  console.log("Express server listening on port %d in %s mode", server.address().port, server.settings.env);
});