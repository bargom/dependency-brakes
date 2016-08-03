## dependency-brakes (poc-draft implementation) ##

This script is for testing the circuit breaker pattern with dependency fallback mechanism.

The selected NPM package for the circuit breaker is: https://www.npmjs.com/package/brakes

It uses circuit breaker for internal fallback and health check mechanism for the dependencies.

Here is the detailed diagram of the flow:

![Flow](Help/DependencyBrakes-decisionFlow.png)

##### Scripts: #####

testMongoBrakes.js : This is the example script to use the circuit breaker from "brakes"

It CAN also stream the event on port 8091, you need to configure dashboard to listen on this port. See examples in folder 'OtherCircuitBreakerTypes'

##### Dashboard #####

The source of dashboard: 
https://github.com/spring-cloud-samples/hystrix-dashboard
 
I have included a compiled version of the dashboard, go into the Dashboard folder

```
java -jar hystrix-dashboard-0.0.1.BUILD-SNAPSHOT.jar
```

it should start the dashboard on default port `7979`.
Then you can add your stream to the dashboard. (localhost:8091)
