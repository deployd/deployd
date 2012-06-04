var util = require('util')
	,	request = require('request');

function Client(port, host) {
	this.port = port || 2403;
	this.host = host || 'localhost';
	this.url = 'http://' + this.host + ':' + port;
}

Client.prototype.get = function (url, query, fn) {
	if(typeof query == 'function') {
		fn = query;
		query = undefined;
	}

	request.get({
		qs: query,
		url: this.url + url
	}, fn);
}

Client.prototype.post = function (url, body, fn) {
	if(typeof query == 'function') {
		fn = query;
		query = undefined;
	}

	request.post({
		url: this.url + url,
		json: body
	}, fn);
}

Client.prototype.put = function (url, query, body, fn) {
	request.put({
		url: this.url + url,
		json: body,
		qs: query || {}
	}, fn);
}

Client.prototype.del = function (url, query, fn) {
	request.del({
		url: this.url + url,
		qs: query || {}
	}, fn);
}

module.exports = Client;