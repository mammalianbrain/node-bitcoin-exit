#!/usr/bin/env node

var bitcoin = require('bitcoinjs');
var express = require('express');
var Pubkeys = require('./pubkeys').Pubkeys;
var Tx = require('./tx').Tx;
var Block = require('./block').Block;
var RealtimeAPI = require('./realtime').API;
var http = require('http');
var Query = require('./query');

var createNode = require('bitcoinjs/daemon/init').createNode;

var node = createNode({ welcome: true });
node.start();

var app = express();


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express['static'](__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.get(/^\/json\//, function (req, res) {
    console.log("URL: " + req.url);
    var req = http.request({method: 'GET',
			    host: 'localhost',
			    port: 3334,
			    path: req.url},
			   function (resp) {
			       var temp = '';
			       resp.on('data', function (chunk) {
				   temp = temp.concat(chunk);
			       });
			       resp.on('end', function(){
				   res.send(temp);
		     });
		 });
    req.on('error', function(e) {
	console.log('problem with request: ' + e.message);
	res.send("error");
    });
    req.end();
});

app.get('/', function(req, res){
  res.send('This is a BitcoinJS exit node. Source code available at <a href="https://github.com/bitcoinjs/node-bitcoin-exit">https://github.com/bitcoinjs/node-bitcoin-exit</a>.');
});

var pubkeysModule = new Pubkeys({
  node: node
});
pubkeysModule.attach(app, '/pubkeys/');

var txModule = new Tx({
  node: node
});
txModule.attach(app, '/tx/');

var blockModule = new Block({
  node: node
});
blockModule.attach(app, '/block/');


var server = http.createServer(app);

var io = require('socket.io').listen(server);
var realtimeApi = new RealtimeAPI(io, node, pubkeysModule, txModule, blockModule, Query);

server.listen(3125);

