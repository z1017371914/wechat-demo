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
		delete: prefix + 'material/del_material?',
		update: prefix + 'material/update_news?',
		count: prefix + 'material/get_materialcount?',
		list: prefix + 'material/batchget_material?'
	},
	group: {
		create: prefix + 'groups/create?',
		get: prefix + 'groups/get?',
		check: prefix + 'groups/getid?',
		update: prefix + 'groups/update?',
		move: prefix + 'groups/members/update?',
		batch: prefix + 'groups/members/batchupdate?',
		delete: prefix + 'groups/delete?'
	},
	user: {
		remark: prefix + 'user/info/updateremark?',
		fetch: prefix + 'user/info?',
		batch: prefix + 'user/info/batchget?',
		list: prefix + 'user/get?'
	},
	mass: {
		group: prefix + 'message/mass/sendall?',
		openId: prefix + 'message/mass/send?',
		delete: prefix + 'message/mass/delete?',
		preview: prefix + 'message/mass/preview?',
		check: prefix + 'message/mass/get?'
	},
	menu: {
		create: prefix + 'menu/create?',
		get: prefix + 'menu/get?',
		delete: prefix + 'menu/delete?',
		current: prefix + 'get_current_selfmenu_info?',
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
	return this.getAccessToken().then(function(res) {
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
	console.log(this.body, this.weixin)
	var xml = util.tpl(content, message)
	console.log(xml)
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
				if (data) {
					resolve(data)
				} else {
					throw new Error('upload material fails')
				}
			}).catch(function(err) {
				console.log(err)
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
			var url = api.permanent.delete + 'access_token=' + data.access_token + '&media_id' + mediaId
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
			}).catch(function(err) {
				console.log(err)
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
			}).catch(function(err) {
				console.log(err)
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
			}).catch(function(err) {
				console.log(err)
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
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.createGroup = function(name) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.create + 'access_token=' + data.access_token
			var options = {
				group: {
					name: name
				}
			}
			request({
				method: 'POST',
				url: url,
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				console.log(data)
				if (data) {
					resolve(data)
				} else {
					throw new Error('create group fails')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.fetchGroup = function() {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.get + 'access_token=' + data.access_token
			request({
				url: url,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('fetchGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.checkGroup = function(openId) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.check + 'access_token=' + data.access_token
			var options = {
				openid: openId
			}
			request({
				url: url,
				method: 'POST',
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('fetchGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.updateGroup = function(id, name) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.update + 'access_token=' + data.access_token
			var options = {
				group: {
					id: id,
					name: name
				}
			}
			request({
				url: url,
				method: 'POST',
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('updateGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.moveGroup = function(openId, to) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.move + 'access_token=' + data.access_token
			var options = {
				openid: openId,
				to_groupid: to
			}
			request({
				url: url,
				method: 'POST',
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('moveGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.batchMoveGroup = function(openIds, to) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.batch + 'access_token=' + data.access_token
			var options = {
				openid_list: openIds,
				to_groupid: to
			}
			request({
				url: url,
				method: 'POST',
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('moveGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.deleteGroup = function(id) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.group.delete + 'access_token=' + data.access_token
			var options = {
				group: {
					id: id
				}
			}
			request({
				url: url,
				method: 'POST',
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('deleteGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.remarkUser = function(openid, remark) {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.user.remark + 'access_token=' + data.access_token
			var options = {
				openid: openid,
				remark: remark
			}
			request({
				url: url,
				method: 'POST',
				body: options,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('remark err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.fetchUsers = function(openIds, lang) {
	var that = this

	lang = lang || 'zh_CN'

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var options = {
				json: true
			}
			if (_.isArray(openIds)) {
				options.url = api.user.batch + 'access_token=' + data.access_token
				options.body = {
					user_list: openIds
				}
				options.method = 'POST'
			} else {
				options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang
			}
			request(options).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('batch fetch user err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.listUsers = function(openId) {
	var that = this

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.user.list + 'access_token=' + data.access_token
			if (openId) {
				url += '&next_openid=' + openId
			}
			request({
				url: url,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('list user fails')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.sendByGroup = function(type, message, groupId) {
	var that = this
	var msg = {
		filter: {

		},
		msgtype: type
	}
	msg[type] = message
	if (!groupId) {
		msg.filter.is_to_all = true
	} else {
		msg.filter = {
			is_to_all: false,
			group_id: groupId
		}
	}
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.mass.group + 'access_token=' + data.access_token
			request({
				url: url,
				method: 'POST',
				body: msg,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('sendByGroup err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.sendByOpenId = function(type, message, openIds) {
	var that = this
	var msg = {
		msgtype: type,
		touser: openIds
	}
	msg[type] = message
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.mass.openId + 'access_token=' + data.access_token
			request({
				url: url,
				method: 'POST',
				body: msg,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('sendByOpenId err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.deleteMass = function(msgId) {
	var that = this

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.mass.delete + 'access_token=' + data.access_token
			var form = {
				msg_id: msgId
			}

			request({
				url: url,
				method: 'POST',
				body: form,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('delete message err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.previewMass = function(type, message, openId) {
	var that = this
	var msg = {
		msgtype: type,
		touser: openId
	}
	msg[type] = message
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.mass.preview + 'access_token=' + data.access_token
			request({
				url: url,
				method: 'POST',
				body: msg,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('preview err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.checkMass = function(msgId) {
	var that = this

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.mass.check + 'access_token=' + data.access_token
			var form = {
				msg_id: msgId
			}
			request({
				url: url,
				method: 'POST',
				body: form,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('checkMass err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.createMenu = function(menu) {
	var that = this

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.menu.create + 'access_token=' + data.access_token
			request({
				url: url,
				method: 'POST',
				body: menu,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('createMenu err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.getMenu = function() {
	var that = this

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.menu.get + 'access_token=' + data.access_token
			request({
				url: url,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('get Menu err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.getCurrentMenu = function() {
	var that = this

	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.menu.current + 'access_token=' + data.access_token
			request({
				url: url,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('get current Menu err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

Wechat.prototype.deleteMenu = function() {
	var that = this
	return new Promise(function(resolve, reject) {
		that.fetchAccessToken().then(function(data) {
			var url = api.menu.delete + 'access_token=' + data.access_token
			request({
				url: url,
				json: true
			}).then(function(res) {
				var data = res[1]
				if (data) {
					resolve(data)
				} else {
					throw new Error('delete Menu err')
				}
			}).catch(function(err) {
				console.log(err)
			})
		})
	})
}

module.exports = Wechat