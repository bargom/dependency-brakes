/**
 * Created by Baris on 29-Jun-16.
 */
"use strict";
const MemoryBrakes = require('./CircuitBreakers/MemoryBrakes');
const MongoBrakes = require('./CircuitBreakers/MongoBrakes');
const S3Brakes = require('./CircuitBreakers/S3Brakes');

var memoryBrake = new MemoryBrakes({ttlMs: 10000});
var s3Brake = new S3Brakes({
	awsConfig: {
		//accessKeyId: "",
		//secretAccessKey: "",
		region: 'Frankfurt'
	}
});
var mongoBrake = new MongoBrakes({
	col: 'documents',
	url: 'mongodb://localhost:27017/myproject',
	next: s3Brake,
	// nextConverter: cmd => {
	// 	return {
	// 		bucket: "bucket1",
	// 		key: "bucket1.json",
	// 		find: x => x.a = 1
	// 	};
	// },
	pre: memoryBrake,
	preConverter: cmd => {return {key: JSON.stringify(cmd)};},
});

mongoBrake.on("internalerror", err => {
	console.error(err);
	process.exit(); //we dont want fallback to execute for internal errors (like wrong syntax in parameter)
});

var loop = function() {

	var cmd = {
		collection: "documents",
		cursor: {find: {"a":1}, limit: 1},
		nextCmd: {bucket:"fallback-mongo", key:"s3Example.json", find: x => x.a===1}
	};
	mongoBrake.exec(cmd).then(docs => {
		console.log(`doc1: ${JSON.stringify(docs)}`);
	}).catch(err => console.log(err));
};

console.log("-----Testing the MongoBrakes with disconnected-------");
setInterval(loop, 1000);
