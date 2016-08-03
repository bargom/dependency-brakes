'use strict';

const DependencyBrakes = require('./DependencyBrakes');
const cache = require('memory-cache');

const defaultOptions = {
  next: null,
  nextConverter: null,
  ttlMs: null
};

class MemoryBrakes extends DependencyBrakes {

  constructor(args) {
    super(function(cmd) {
      return Promise.resolve({type: "Dummy", path: cmd.path});
    }, args, {});
    this._args = Object.assign({}, defaultOptions, args);
    
    this._cache = cache;
  }
  
  save(keyObject, value) {
      this._cache.put(keyObject.key, value, this._args.ttlMs);
  }

  exec(command) {
    return Promise.resolve(this._cache.get(command.key));
  }
}

module.exports = MemoryBrakes;
