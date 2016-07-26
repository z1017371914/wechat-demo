'use strict'

var Promise = require('bluebird')
var request = Promise.promisify(require('request'))
var util = require('./util')
var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var fs = require('fs')
var _ = require('lodash')

var api = {
	accessToken: prefix + 'token?grant_type=client_credential',
	temporary: {
		upload: prefix + 'media/upload?',
		fetch: prefix + 'media/get?'
	},
	permanent: {
		upload: prefix + 'material/add_material?',
		uploadNews: prefix + 'material/add_news?',
		uploadNewsPic: prefix + 'media/uploadimg?',
		fetch: prefix + 'material/get_material?',
		del: prefix + 'material/del_material?',
		update: prefix + 'material/update_news?',
		count: prefix + 'material/get_materialcount?',
		list: prefix + 'material/batchget_material?'
	}
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
			var now = (new Date().getTime())
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
	this.status = 200
	this.type = 'application/xml'
	this.body = xml
}

Wechat.prototype.uploadMaterial = function(type, material, permanent) {
	var that = this
	var form = {}
	var uploadUrl = api.temporary.upload
	if (permanent) {
		uploadUrl = api.permanent.upload
		_.extend(form, permanent)
	}
	if (type === 'pic') {
		uploadUrl = api.permanent.uploadNewsPic
	}
	if (type === 'news') {
		uploadUrl = api.permanent.uploadNews
		form = material
	} else {
		form.media = fs.createReadStream(material)
	}

	var appID = this.appID
	var appSecret = this.appSecret

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = uploadUrl + 'access_token=' + data.access_token
			if (!permanent) {
				url += '&type=' + type
			} else {
				form.access_token = data.access_token
			}

			var options = {
				method: 'POST',
				url: url,
				json: true
			}
			if (type === 'news') {
				options.body = form
			} else {
				options.formData = form
			}
			request(options).then(function(res) {
				var data = res[1]
					// console.log(data)
				if (data) {
					resolve(data)
				} else {
					throw new Error('upload material fails')
				}
			})
		})
	})
}


Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
	var that = this
	var form = {}
	var fetchUrl = api.temporary.fetch
	if (permanent) {
		fetchUrl = api.permanent.fetch
	}
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = fetchUrl + 'access_token=' + data.access_token

			var options = {
				method: 'POST',
				url: url,
				json: true
			}
			var form = {

			}
			if (permanent) {
				form.media_id = mediaId
				form.access_token = data.access_token
				options.body = form
			} else {
				if (type === 'video') {
					url = url.replace('https://', 'http://')
				}
				url += '&media_id=' + mediaId
			}
			if (type === 'news' || type === 'video') {
				request(options).then(function(res) {
					var data = res[1]
					if (data) {
						resolve(data)
					} else {
						throw new Error('upload material fails')
					}
				}).catch(function(err) {
					reject(err)
				})
			} else {
				resolve(url)
			}
		})
	})
}


Wechat.prototype.deleteMaterial = function(mediaId) {
	var that = this
	var form = {
		media_id: mediaId
	}
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id' + mediaId
			request({
				method: 'POST',
				url: url,
				body: form,
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

Wechat.prototype.updateMaterial = function(mediaId, news) {
	var that = this
	var form = {
		media_id: mediaId
	}
	_extend(form, news)
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id' + mediaId
			request({
				method: 'POST',
				url: url,
				body: form,
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

Wechat.prototype.countMaterial = function(mediaId, news) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.permanent.count + 'access_token=' + data.access_token
			request({
				method: 'GET',
				url: url,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('count material fails')
				}
			})
		})
	})
}

Wechat.prototype.listMaterial = function(options) {
	var that = this

	options.type = options.type || 'image'
	options.offset = options.offset || 0
	options.count = options.count || 1

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.permanent.list + 'access_token=' + data.access_token
			request({
				method: 'POST',
				url: url,
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('list material fails')
				}
			})
		})
	})
}


module.exports = Wechat