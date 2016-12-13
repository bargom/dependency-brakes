## dependency-brakes (poc-draft implementation) ##

This script is for testing the circuit breaker pattern with dependency fallback mechanism.

The selected NPM package for the circuit breaker is: https://www.npmjs.com/package/brakes

It uses circuit breaker for internal fallback and health check mechanism for the dependencies.

Here is the detailed diagram of the flow:

![Flow](Help/DependencyBrakes-decisionFlow.png)

#### Scripts: ####

testMongoBrakes.js : This is the example script to use the circuit breaker from "brakes"

It CAN also stream the event on port 8091, you need to configure dashboard to listen on this port. See examples in folder 'OtherCircuitBreakerTypes'

#### Examples ####

##### Memory > Mongo > Dummy Dependency Order with Promises #####
```javascript
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
```
##### Other Examples #####
* [test-mem-mongo-dummy-promise.js](/test-mem-mongo-dummy-promise.js)
* [test-mem-mongo-dummy.js](/test-mem-mongo-dummy.js)
* [test-mem-mongoCursor-dummy.js](/test-mem-mongoCursor-dummy.js)
* [test-mem-mongoCursor2-dummy2.js](/test-mem-mongoCursor2-dummy2.js)

#### Dashboard ####

The source of dashboard: 
https://github.com/spring-cloud-samples/hystrix-dashboard
 
I have included a compiled version of the dashboard, go into the Dashboard folder

```
java -jar hystrix-dashboard-0.0.1.BUILD-SNAPSHOT.jar
```

it should start the dashboard on default port `7979`.
Then you can add your stream to the dashboard. (localhost:8091)
