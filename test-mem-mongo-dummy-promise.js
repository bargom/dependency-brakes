/**
 * Created by Baris on 29-Jun-16.
 */
"use strict";
const MongoBrakes = require('./CircuitBreakers/MongoBrakes');
const DummyBrakes = require('./CircuitBreakers/DummyBrakes');
const MemoryBrakes = require('./CircuitBreakers/MemoryBrakes');

var dummyBrake = new DummyBrakes();
var memoryBrake = new MemoryBrakes({ttlMs: 10000});

var mongoBrake = new MongoBrakes({
	col: 'documents',
	url: 'mongodb://localhost:27017/myproject',
	next: dummyBrake,
	nextConverter: cmd => {return {key: cmd.collection + '/data.json'};},
	pre: memoryBrake,
	preConverter: cmd => {return {key: JSON.stringify(cmd)};},
	fallbackToPromiseError: true
});

mongoBrake.on("internalerror", err => {
	console.error(err);
	process.exit(); //we dont want fallback to execute for internal errors (like wrong syntax in parameter)
});

var loop3 = function() {

	var cmd = {collection: "documents", cursor: {find: {"a":1}, limit: 1}};//, nextCmd: {key:"documents/all_limit1.json"}};
	mongoBrake.exec(cmd).then(docs => {
		console.log(`doc1: ${JSON.stringify(docs)}`);
	}).catch(err => {
		console.log(err);
		if (err.isFallback) {
			console.log("----it is fallback---");
			err.getNext().exec(cmd).then(docs2 => {
				//get and parse the results....
			});
		}
	});
};

console.log("-----Testing the MongoBrakes with fallback as promise-------");
setInterval(loop3, 1000);