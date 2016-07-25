'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var util = require('./util')
var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var fs = require('fs')

var api = {
	accessToken: prefix + 'token?grant_type=client_credential',
	upload: prefix + 'media/upload?'
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
	if (this.access_token && this.expires_in) {
		if (this.isValidAccessToken(this)) {
			return Promise.resolve(this)
		}
	}
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
		me.saveAccessToken(data)
		return Promise.resolve(data)
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

Wechat.prototype.uploadMaterial = function(type, filepath) {
	var that = this
	var form = {
		media: fs.createReadStream(filepath)
	}
	var appID = this.appID
	var appSecret = this.appSecret

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.upload + 'access_token=' + data.access_token + '&type=' + type
			request({
				url: url,
				method: 'POST',
				formData: form,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('upload material fails')
				}
			})
		})
	})
}


module.exports = Wechat;