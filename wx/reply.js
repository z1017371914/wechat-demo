'use strict'

var wechat = require('../weixin/wechat')
var config = require('../config/wechat.config')
var wechatAPI = new wechat(config.wechat2)
var menu = require('./menu')
var path = require('path')
var sbList = require('./sbList').sbList
var guess = require('./sbList').guess


wechatAPI.deleteMenu().then(function() {
	return wechatAPI.createMenu(menu)
}).then(function(msg) {
	console.log(msg)
})


exports.reply = function*(next) {
	var message = this.weixin
	console.log(message)
	if (message.MsgType === 'event') {
		if (message.Event === 'subscribe') {
			if (message.EventKey) {
				console.log('扫二维码进来' + message.EventKey + '' + message.ticket)
			}
			this.body = '您好，专业男科请找我们'
		} else if (message.Event === 'unsubscribe') {
			console.log('无情取关')
		} else if (message.Event === 'LOCATION') {

			this.body = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-'

		} else if (message.Event === 'CLICK') {

			this.body = '你选择出' + guess[Math.floor(Math.random(0, 1) * guess.length)] + '  机器选择出' + guess[Math.floor(Math.random(0, 1) * guess.length)]

		} else if (message.Event === 'SCAN') {

			this.body = '关注后扫二维码' + message.EventKey

		} else if (message.Event === 'VIEW') {

			console.log('跳转至' + message.EventKey)

		} else if (message.Event === 'scancode_push') {

			console.log(message.ScanCodeInfo.ScanType)
			console.log(message.ScanCodeInfo.ScanResult)

		} else if (message.Event === 'scancode_waitmsg') {

			console.log(message.ScanCodeInfo.ScanType)
			console.log(message.ScanCodeInfo.ScanResult)
			this.body = '韩腾被肛'

		} else if (message.Event === 'pic_sysphoto') {
			console.log(message.SendPicsInfo.PicList.item.PicMd5Sum, message.SendPicsInfo.Count)
			console.log('选择了系统拍照')

		} else if (message.Event === 'pic_photo_or_album') {

			console.log('从pic_photo_or_album中选择')

		} else if (message.Event === 'location_select') {

			console.log('选择了地点')
			console.log(message.SendLocationInfo.Location_X)
			console.log(message.SendLocationInfo.Location_Y)
			console.log(message.SendLocationInfo.Scale)
			console.log(message.SendLocationInfo.Label)
			console.log(message.SendLocationInfo.Poiname)

		} else if (message.Event === 'pic_weixin') {

			console.log('pic_weixin' + '选择')

		}
	} else if (message.MsgType === 'text') {
		var content = message.Content
		var sb = sbList[Math.floor(Math.random(0, 1) * sbList.length)]
		var reply = sb + '，你大爷的'
		console.log('消息')
		if (content === '1') {
			reply = sb + '得了阳痿'
		} else if (content === '2') {
			reply = sb + '得了早泄'
		} else if (content === '3') {
			reply = sb + '得了前列腺炎'
		} else if (content === '4') {
			reply = [{
				title: sb + '痔疮',
				description: sb + '你废了',
				picUrl: 'http://g.hiphotos.baidu.com/baike/pic/item/b64543a98226cffcd0e2a741bc014a90f703ea7d.jpg',
				url: 'https://github.com'
			}, {
				title: sb + '肛瘘',
				description: sb + '你废了',
				picUrl: 'http://a.hiphotos.baidu.com/baike/w%3D268%3Bg%3D0/sign=9b68295569600c33f079d9ce22773632/d788d43f8794a4c28d150d6a0cf41bd5ad6e39b9.jpg',
				url: 'https://github.com'
			}, {
				title: sb + '直肠癌',
				description: sb + '你废了',
				picUrl: 'http://b.hiphotos.baidu.com/baike/w%3D268%3Bg%3D0/sign=8b66ed736863f6241c5d3e05bf7f8cc5/fd039245d688d43ffeedf7b87e1ed21b0ef43b37.jpg',
				url: 'https://github.com'
			}]
		} else if (content === '5') {
			var data = yield wechatAPI.uploadMaterial('image', path.resolve(__dirname, '../1.jpg'))
			console.log(data)
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content === '6') {
			var data = yield wechatAPI.uploadMaterial('video', path.resolve(__dirname, '../6.mp4'))
			reply = {
				type: 'video',
				mediaId: data.media_id,
				title: '独角戏',
				description: '伤'
			}
		} else if (content === '7') {
			var data = yield wechatAPI.uploadMaterial('image', path.resolve(__dirname, '../1.jpg'))
			reply = {
				type: 'music',
				title: '听听音乐',
				musicUrl: 'http://stream18.qqmusic.qq.com/132216698.mp3',
				thumbMediaId: data.media_id,
				description: '放松一下'
			}
		} else if (content === '8') {
			var data = yield wechatAPI.uploadMaterial('image', path.resolve(__dirname, '../1.jpg'), {
				type: 'image'
			})
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content === '9') {
			var videoInfo = {
				title: 'a video',
				introduction: '6666'
			}
			var data = yield wechatAPI.uploadMaterial('video', path.resolve(__dirname, '../6.mp4'), {
				type: 'video',
				description: JSON.stringify(videoInfo)
			})
			reply = {
				type: 'video',
				mediaId: data.media_id,
				title: '独角戏',
				description: '伤'
			}
		} else if (content === '10') {
			var picData = yield wechatAPI.uploadMaterial('image', path.resolve(__dirname, '../1.jpg'), {})
			var media = {
				articles: [{
					title: '韩腾被肛',
					thumb_media_id: picData.media_id,
					author: 'evilemon',
					digest: '屈辱的毕业季',
					show_cover_pic: 1,
					content: '毕业当天，韩腾被肛，及其屈辱，作案人能看出正脸的有：张岩、苏广军、李遵晴',
					content_source_url: 'https://github.com'
				}, {
					title: '韩腾被肛',
					thumb_media_id: picData.media_id,
					author: 'evilemon',
					digest: '屈辱的毕业季',
					show_cover_pic: 1,
					content: '毕业当天，韩腾被肛，及其屈辱，作案人能看出正脸的有：张岩、苏广军、李遵晴',
					content_source_url: 'https://github.com'
				}, {
					title: '韩腾被肛',
					thumb_media_id: picData.media_id,
					author: 'evilemon',
					digest: '屈辱的毕业季',
					show_cover_pic: 1,
					content: '毕业当天，韩腾被肛，及其屈辱，作案人能看出正脸的有：张岩、苏广军、李遵晴',
					content_source_url: 'https://github.com'
				}]
			}

			data = yield wechatAPI.uploadMaterial('news', media, {})
			data = yield wechatAPI.fetchMaterial(data.media_id, 'news', {})
			console.log(data)

			var items = data.news_item
			var news = []
			items.forEach(function(item) {
				news.push({
					title: item.title,
					description: item.digest,
					picUrl: picData.url,
					url: item.url
				})
			})
			reply = news
		} else if (content === '11') {
			var counts = yield wechatAPI.countMaterial()
			console.log(JSON.stringify(counts))
			var results = yield [
				wechatAPI.listMaterial({
					offset: 0,
					count: 10,
					type: 'image'
				}), wechatAPI.listMaterial({
					offset: 0,
					count: 10,
					type: 'video'
				}), wechatAPI.listMaterial({
					offset: 0,
					count: 10,
					type: 'voice'
				}), wechatAPI.listMaterial({
					offset: 0,
					count: 10,
					type: 'news'
				})
			]
			console.log(JSON.stringify(results))
			reply = 1
		} else if (content === '12') {
			// var group = yield wechatAPI.createGroup('slm')
			// console.log('新分组wechat')
			// console.log(group)

			// var groups = yield wechatAPI.fetchGroup()

			// console.log('加了wechat后的分组列表')
			// console.log(groups)

			var group2 = yield wechatAPI.checkGroup(message.FromUserName)
			console.log('查看自己的分组')
			console.log(group2)

				// var group3 = yield wechatAPI.moveGroup(message.FromUserName, 0)
				// console.log('移动到154')
				// console.log(group3)

			// var group4 = yield wechatAPI.fetchGroup()
			// console.log('移动后的分组列表')
			// console.log(group4)

			// var group5 = yield wechatAPI.checkGroup(message.FromUserName)
			// console.log('查看自己移动后的分组')
			// console.log(group5)

			// var group6 = yield wechatAPI.batchMoveGroup([message.FromUserName], 2)
			// console.log('批量移动到2')
			// console.log(group6)

			// var group7 = yield wechatAPI.fetchGroup()
			// console.log('查看批量移动后的分组')
			// console.log(group7)

			// var group8 = yield wechatAPI.updateGroup(154, 'evilemon')
			// console.log('改名后的分组')
			// console.log(group8)

			// var group9 = yield wechatAPI.deleteGroup(101)
			// console.log('删除101分组')
			// console.log(group9)

			var group10 = yield wechatAPI.fetchGroup()
			console.log('查看所有分组')
			console.log(group10)
			var name 
			group10.groups.map(function(item, index) {
				if (index === group2.groupid) {
					name = item.name
				}
			})

			reply = '你所在的组名叫做:' + name
		} else if (content === '13') {

			var remark = yield wechatAPI.remarkUser(message.FromUserName, '周伯通')
			console.log(remark)
			var user = yield wechatAPI.fetchUsers(message.FromUserName)
			console.log(user)
			var options = [{
				openid: message.FromUserName,
				lang: 'en'
			}, {
				openid: message.FromUserName,
				lang: 'zh_CN'
			}, {
				openid: message.FromUserName,
				lang: 'zh_TW'
			}]

			var users = yield wechatAPI.fetchUsers(options)

			console.log(user)

			reply = '你的昵称是:' + user.nickname + ',  性别是:' + (user.sex === 1 ? '男' : '女')
		} else if (content === '14') {
			var userList = yield wechatAPI.listUsers()
			console.log(userList)
			reply = '订阅此服务的一共有' + userList.total + '人'
		} else if (content === '15') {
			var mpnews = {
				media_id: 'FdsVVjTTCPpZeudKfNs9UyfSJSzjVfOLeWlORTcLH1I'
			}

			var text = {
					content: '找爆请找爆哥'
				}
				// 在返回成功时，意味着群发任务提交成功，并不意味着此时群发已经结束，
				// 所以，仍有可能在后续的发送过程中出现异常情况导致用户未收到消息，
				// 如消息有时会进行审核、服务器不稳定等。
				// 此外，群发任务一般需要较长的时间才能全部发送完毕，请耐心等待。
			var msgData = yield wechatAPI.sendByGroup('text', text, 0)
			console.log(msgData)
			reply = '给订阅本号的群发消息!'
		} else if (content === '16') {
			var text = {
				content: '偷偷告诉你，群发的内容是：找爆请找爆哥'
			}
			var msgData = yield wechatAPI.previewMass('text', text, message.FromUserName)
			console.log(msgData)

			var msgCheck = yield wechatAPI.checkMass('1000000002')
			console.log(msgCheck)
			reply = '没收到过一会就会收到!'
		} 

		this.body = reply

	} else if (message.MsgType === 'location') {

		this.body = '您上报的位置是：' + message.Location_X + '/' + message.Location_Y + '-' + message.Label

	} else if (message.MsgType === 'voice') {

		this.body = {
			type: 'voice',
			mediaId: message.MediaId
		}

	} else if (message.MsgType === 'image') {
		this.body = {
			type: 'image',
			mediaId: message.MediaId
		}
	} else {
		this.body = '能打就别哔哔'
	}
	yield next
}