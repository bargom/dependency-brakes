/**
 * Created by Baris on 08-Jul-16.
 */
'use strict';

const Brakes = require('brakes');
const MongoClient = require('mongodb').MongoClient;
const Cursor = require('mongodb').Cursor;
const DependencyBrakes = require('./DependencyBrakes');
const InternalError = require('./InternalError');

const defaultOptions = {
	col: 'documents',
	url: 'mongodb://localhost:27017/myproject',
	mongoOptions: null,
	canSaveNext: true,
	canSavePre: true
};

class MongoBrakes extends DependencyBrakes {

	constructor(args) {
		args = Object.assign({}, defaultOptions, args);
		super(args);

		this._db = null;
		this._brake = this._createBrake("Query", this._brakeFunc);
	}

	_brakeFunc(cmd) {
		let self = this._opts.parent;
		// this=Brakes, context is inside Brakes, so use "self"
		if (cmd instanceof Cursor) {
			return cmd.toArray().then(result => self._processResult(result, self, cmd));
		}
		
		if (cmd.cursor instanceof Cursor) {
			return cmd.cursor.toArray().then(result => self._processResult(result, self, cmd));
		}

		// if the command has format which has 2 specific attributes, it is executed: collection, cursor
		if (cmd.cursor && cmd.collection) {
			return self._execArrayFromCommand(cmd);
		}
	}

	_execArrayFromCommand(cmd) {
		let self = this;
		let cursor = this._db.collection(cmd.collection);
		if (cursor) {
			for (let key of Object.keys(cmd.cursor)) {
				let value = cmd.cursor[key];
				if (cursor[key]) {
					cursor = cursor[key](value);
				} else {
					this.emit("internalerror", new InternalError(`Cannot find the "${key}" function from command`));
				}
			}
			return cursor.toArray().then(result => self._processResult(result, self, cmd));
		}
	}

	_processResult(result, self, cmd) {
		try {
			//we can save back to pre
			if (self._args.canSavePre && self._args.pre && self._args.pre.save) {
				let preCmd = self._convertCommand(cmd, cmd.PreCmd, self._args.preConverter);
				self._args.pre.save(preCmd, result);
				console.log(`[SAVED RESULT to PRE]${JSON.stringify(preCmd)}`);
			}

			//we can save forward to next
			if (self._args.canSaveNext && self._args.next && self._args.next.save) {
				let nextCmd = self._convertCommand(cmd, cmd.nextCmd, self._args.nextConverter);
				self._args.next.save(nextCmd, result);
				console.log(`[SAVED RESULT to NEXT]${JSON.stringify(nextCmd)}`);
			}
		} catch (err) {
			//ignore all errors here, not critical to stop the result
			this.emit("internalerror", err);
		}

		return result;
	}

	_createBrake(name, func) {

		var options = {
			group: 'MongoBrakes',
			statInterval: 2500,
			threshold: 1,
			waitThreshold: 0,
			circuitDuration: 60 * 60 * 1000,
			timeout: 5000,
			fallback: this._generateFallback(),
			healthCheck: this._healthCheck,
			mongoUrl: this._args.url, //bypass the value, so it can be used inside health func
			parent: this
		};

		var brake = new Brakes(func,
			Object.assign({name: name}, options));

		brake.on('circuitOpen', () => console.log('----------Circuit Opened--------------'));
		brake.on('circuitClosed', () => console.log('----------Circuit Closed--------------'));
		brake.on('healthCheckFailed', err => console.log("----Still Connection NOT successful----"));

		return brake;
	}

	connect() {
		let self = this;
		return MongoClient.connect(self._args.url, self._args.mongoOptions).then(db => {
			if (self._db) {
				self._db.close().then(console.log("------Old connection closed------"));
			}
			self._db = db;
			console.log("Connected successfully to server");
		}); //do not catch anything here, to allow the caller to catch connection errors
	}

	collection(name) {
		if (this._db) { //we don't need to check connected
			return this._db.collection(name);
		}
		return null;
	}

	exec(command) {
		let self = this;
		//first check if available in pre
		if (!this._args.pre) {
			return this._execMongo(command);
		}

		let preCmd = this._convertCommand(command, command.preCmd, this._args.preConverter);
		return this._args.pre.exec(preCmd).then(result => {
			if (result) {
				console.log(`[CACHED RESULT]${JSON.stringify(preCmd)}`);
				return Promise.resolve(result);
			}
			console.log(`[CACHE MISS]${JSON.stringify(preCmd)}`);
			return self._execMongo(command);;
		});
	}

	_convertCommand(command, preOrNextCmd, converter) {
		let converted = (command instanceof Cursor && {key: JSON.stringify(command.cmd)}) ||
			preOrNextCmd ||
			converter && converter(command) ||
			command;
		return converted;
	}

	_execMongo(command) {
		let connected = this._db && this._db.topology && this._db.topology.isConnected();
		if (connected){
			return this._brake.exec(command);
		}
		else {
			if (!this._db && !this._brake.isOpen()) { // first call, but don't check if cb is already open
				return this.connect().then(() => {
					return this._brake.exec(command);
				}).catch(err => {
					// catch connection error
					console.error("_execMongo error ", err);
					return this._openCircuitAndReturnFallback(command);
				});
			}
			return this._openCircuitAndReturnFallback(command);
		}
	}

	_openCircuitAndReturnFallback(command) {
		this._brake._open();
		let fb = this._brake._fallback || this._generateFallback();
		return fb(command);
	}

	//using "self", as the context of "this" becomes the brakes
	_healthCheck() {
		let self = this._opts.parent;
		return MongoClient.connect(self._args.url).then(db => {
			console.log("----Connection successful----");
			//reset connection
			if (self._db) {
				self._db.close().then(console.log("------Old connection closed------"));
			}
			self._db = db;
		});
	}
}

module.exports = MongoBrakes;
