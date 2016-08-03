'use strict';

const DependencyBrakes3 = require('./DependencyBrakes');

const defaultOptions = {
  next: null,
  nextConverter: null
};

class Dummy2Brakes extends DependencyBrakes3 {

  constructor(args) {
    super(args);
    this._args = Object.assign({}, defaultOptions, args);
  }
  
  exec(command) {
    return Promise.resolve(command.ctx);
  }
}

module.exports = Dummy2Brakes;
