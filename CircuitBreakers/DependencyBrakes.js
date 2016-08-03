/**
 * Created by Baris on 08-Jul-16.
 */
'use strict';
const EventEmitter = require("events");
const FallbackError = require("./FallbackError");

const defaultOptions = {
	next: null,
	nextConverter: null,
	pre: null,
	preConverter: null,
	fallback: undefined,
	fallbackHasPriority: false,
	fallbackToPromiseError: false
};

class DependencyBrakes extends EventEmitter {

	constructor(args) {
		super();
		this._args = Object.assign({}, defaultOptions, args);
	}

	_generateFallback() {
		// fallback to promise reject has the highest priority
		if (this._args.fallbackToPromiseError) {
			return cmd => Promise.reject(new FallbackError(cmd, this._args.next));
		}
		
		if (this._args.fallbackHasPriority && this._args.fallback) {
			//execute fallback function
			return cmd => Promise.resolve(this._args.fallback(cmd));
		}
		return this._args.next ?
			cmd => this._args.next.exec(cmd.nextCmd || (this._args.nextConverter && this._args.nextConverter(cmd)) || cmd) :
			() => Promise.reject(new Error("No more dependency in the chain, the call is failed without fallback"));
	}
	
	setNext(next, idConverter) {
		this._args.next = next;
		this._args.nextConverter = idConverter;
	}

	setPre(pre, idConverter) {
		this._args.pre = pre;
		this._args.preConverter = idConverter;
	}
}
module.exports = DependencyBrakes;
