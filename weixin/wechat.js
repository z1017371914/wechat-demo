'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var util = require('./util')
var prefix = 'https://api.weixin.qq.com/cgi-bin/'

var api = {
	accessToken: prefix + 'token?grant_type=client_credential'
}

function Wechat(opts) {
	// 用于与微信服务器交互 票据更新
	this.appID = opts.appID
	this.appSecret = opts.appSecret
	this.getAccessToken = opts.getAccessToken
	this.saveAccessToken = opts.saveAccessToken
	this.fetchAccessToken()
}

Wechat.prototype.isValidAccessToken = function(data) {
	if (!data || !data.access_token || !data.expires_in) {
		return false
	}
	var access_token = data.access_token
	var expires_in = data.expires_in
	var now = (new Date().getTime())
	if (now < expires_in) {
		return true
	} else {
		return false
	}
}

Wechat.prototype.updateAccessToken = function() {
	var appID = this.appID
	var appSecret = this.appSecret
	var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret

	return new Promise(function(resolve, reject) {
		request({
			url: url,
			json: true
		}).then(function(res) {
			var data = res[1]
			var now = (new Date().getTime());
			var expires_in = now + (data.expires_in - 20) * 1000
			data.expires_in = expires_in
			resolve(data)
		})
	})
}

Wechat.prototype.fetchAccessToken = function() {
	var me = this
	this.getAccessToken().then(function(res) {
		try {
			res = JSON.parse(res)
		} catch (e) {
			return me.updateAccessToken(res)
		}
		if (me.isValidAccessToken(res)) {
			return Promise.resolve(res)
		} else {
			return me.updateAccessToken(res)
		}
	}).then(function(data) {
		me.access_token = data.access_token
		me.expires_in = data.expires_in
		me.saveAccessToken(data);
	})
}

Wechat.prototype.reply = function() {
	var content = this.body
	var message = this.weixin
	var xml = util.tpl(content, message)
	console.log(xml)
	this.status = 200
	this.type = 'application/xml'
	this.body = xml
}

module.exports = Wechat;