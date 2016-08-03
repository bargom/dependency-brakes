'use strict';

const DependencyBrakes3 = require('./DependencyBrakes');

const defaultOptions = {
  next: null,
  nextConverter: null
};

class DummyBrakes extends DependencyBrakes3 {

  constructor(args) {
    super(args);
    this._args = Object.assign({}, defaultOptions, args);
  }
  
  exec(command) {
    return Promise.resolve({type: "Dummy", key: command.key});
  }
}

module.exports = DummyBrakes;
