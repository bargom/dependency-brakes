/**
 * Created by Baris on 29-Jun-16.
 */
"use strict";
const MemoryBrakes = require('./CircuitBreakers/MemoryBrakes');
const MongoBrakes = require('./CircuitBreakers/MongoBrakes');
const Dummy2Brakes = require('./CircuitBreakers/Dummy2Brakes');

var memoryBrake = new MemoryBrakes({ttlMs: 10000});
var dummy2Brake = new Dummy2Brakes();
var mongoBrake = new MongoBrakes({
	col: 'documents',
	url: 'mongodb://localhost:27017/myproject',
	next: dummy2Brake,
	pre: memoryBrake,
	preConverter: cmd => {return {key: cmd.ctx};},
});

mongoBrake.on("internalerror", err => {
	console.error(err);
	process.exit(); //we dont want fallback to execute for internal errors (like wrong syntax in parameter)
});

var loop1 = function() {
	var cursor = mongoBrake.collection('documents').find({}).limit(1);
	mongoBrake.exec({cursor: cursor, ctx: "testContext"}).then(docs => {
		console.log(`doc1: ${JSON.stringify(docs)}`);
	}).catch(err => console.log(err));
};

console.log("-----Testing the MongoBrakes with connected dummy2-------");
mongoBrake.connect().then(() => {
	console.log("connected");
	setInterval(loop1, 1000);
}).catch(err => console.log(err));


