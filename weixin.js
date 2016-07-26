'use strict'

var wechat = require('./weixin/wechat')
var config = require('./config/wechat.config')
var wechatAPI = new wechat(config.wechat)


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
			this.body = 0
		} else if (message.Event === 'LOCATION') {
			this.body = '您上报的位置是：' + message.Latitude + '/' + message.Longitude + '-'
		} else if (message.Event === 'CLICK') {
			this.body = '您点击了菜单：' + message.EventKey
		} else if (message.Event === 'SCAN') {
			this.body = '关注后扫二维码' + message.EventKey
		} else if (message.Event === 'VIEW') {
			this.body = '您点击了菜单中的链接' + message.EventKey
		}
	} else if (message.MsgType === 'text') {
		var content = message.Content
		var reply = '爆哥，你大爷的'
		console.log('消息')
		if (content === '1') {
			reply = '您得了阳痿'
		} else if (content === '2') {
			reply = '您得了早泄'
		} else if (content === '3') {
			reply = '前列腺炎'
		} else if (content === '4') {
			reply = [{
				title: '痔疮',
				description: '你废了',
				picUrl: 'http://g.hiphotos.baidu.com/baike/pic/item/b64543a98226cffcd0e2a741bc014a90f703ea7d.jpg',
				url: 'https://github.com'
			}, {
				title: '肛瘘',
				description: '你废了',
				picUrl: 'http://a.hiphotos.baidu.com/baike/w%3D268%3Bg%3D0/sign=9b68295569600c33f079d9ce22773632/d788d43f8794a4c28d150d6a0cf41bd5ad6e39b9.jpg',
				url: 'https://github.com'
			}, {
				title: '直肠癌',
				description: '你废了',
				picUrl: 'http://b.hiphotos.baidu.com/baike/w%3D268%3Bg%3D0/sign=8b66ed736863f6241c5d3e05bf7f8cc5/fd039245d688d43ffeedf7b87e1ed21b0ef43b37.jpg',
				url: 'https://github.com'
			}]
		} else if (content === '5') {
			var data = yield wechatAPI.uploadMaterial('image', __dirname + '/1.jpg')
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content === '6') {
			var data = yield wechatAPI.uploadMaterial('video', __dirname + '/6.mp4')
			reply = {
				type: 'video',
				mediaId: data.media_id,
				title: '独角戏',
				description: '伤'
			}
		} else if (content === '7') {
			var data = yield wechatAPI.uploadMaterial('image', __dirname + '/1.jpg')
			reply = {
				type: 'music',
				title: '听听音乐',
				musicUrl: 'http://stream18.qqmusic.qq.com/132216698.mp3',
				thumbMediaId: data.media_id,
				description: '放松一下'
			}
		} else if (content === '8') {
			var data = yield wechatAPI.uploadMaterial('image', __dirname + '/1.jpg', {
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
			var data = yield wechatAPI.uploadMaterial('video', __dirname + '/6.mp4', {
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
			var picData = yield wechatAPI.uploadMaterial('image', __dirname + '/1.jpg', {})
			var media = {
				articles: [{
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
			console.log(results)
			reply = 1
		}

		this.body = reply
	}
	yield next
}