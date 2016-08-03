'use strict';

const DependencyBrakes = require('./DependencyBrakes');
const cache = require('memory-cache');
const aws = require('aws-sdk');

const defaultOptions = {
  awsConfig: null,
  awsConfigFile: "./aws.json",
  fallbackHasPriority: true,
  fallback: cmd => {} //in case of s3 error, just return empty object
};

/*
example awsConfig
 {
 accessKeyId: "....",
 secretAccessKey: "...",
 region: 'ap-southeast-1'
 }
 */

class S3Brakes extends DependencyBrakes {

  constructor(args) {
    super(args);
    this._args = Object.assign({}, defaultOptions, args);

    if (this._args.awsConfigFile) {
      aws.config.loadFromPath(this._args.awsConfigFile);
    } else {
      aws.config.update(this._args.awsConfig);
    }
    this._s3 = new aws.S3();
  }

  exec(command) {
    // command has path, bucket and find function

    const params = {
      Bucket: command.bucket,
      Key: command.key
    };
    return this._s3.getObject(params).promise().then(data => {
      var json = JSON.parse(data.Body.toString());
      if (command.find) {
        if (json instanceof Array) {
          let result = json.find(command.find);
          return Promise.resolve(result);
        }
      }
    }).catch(err => {
      console.error(err);
      throw err;
    });
  }
}

module.exports = S3Brakes;
