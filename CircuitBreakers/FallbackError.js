/**
 * Created by Baris on 12-Jul-16.
 */
'use strict';
class FallbackError extends Error {
	constructor(command, next) {
		this._command = command;
		this._next = next;
	}

	getNext() {
		return this._next;
	}

	getCommand() {
		return this._command;
	}
	
	isFallback() {
		return true;
	}
}

module.exports = FallbackError;