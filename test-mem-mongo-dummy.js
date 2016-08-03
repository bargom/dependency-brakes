/**
 * Created by Baris on 29-Jun-16.
 */
"use strict";
const MemoryBrakes = require('./CircuitBreakers/MemoryBrakes');
const MongoBrakes = require('./CircuitBreakers/MongoBrakes');
const DummyBrakes = require('./CircuitBreakers/DummyBrakes');

var memoryBrake = new MemoryBrakes({ttlMs: 10000});
var dummyBrake = new DummyBrakes();
var mongoBrake = new MongoBrakes({
	col: 'documents',
	url: 'mongodb://localhost:27017/myproject',
	next: dummyBrake,
	nextConverter: cmd => {return {key: cmd.collection + '/data.json'};},
	pre: memoryBrake,
	preConverter: cmd => {return {key: JSON.stringify(cmd)};},
});

mongoBrake.on("internalerror", err => {
	console.error(err);
	process.exit(); //we dont want fallback to execute for internal errors (like wrong syntax in parameter)
});

var loop = function() {
	var cmd = {collection: "documents", cursor: {find: {"a":1}, limit: 1}};//, nextCmd: {key:"documents/all_limit1.json"}};
	mongoBrake.exec(cmd).then(docs => {
		console.log(`doc1: ${JSON.stringify(docs)}`);
	}).catch(err => console.log(err));
};

console.log("-----Testing the MongoBrakes with disconnected-------");
setInterval(loop, 1000);
