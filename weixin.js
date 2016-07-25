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
		if (content.indexOf('1') >= 0) {
			reply = '您得了阳痿'
		} else if (content.indexOf('2') >= 0) {
			reply = '您得了早泄'
		} else if (content.indexOf('3') >= 0) {
			reply = '前列腺炎'
		} else if (content.indexOf('4') >= 0) {
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
		} else if (content.indexOf('5') >= 0) {
			var data = yield wechatAPI.uploadMaterial('image', __dirname + '/2.jpg')
			reply = {
				type: 'image',
				mediaId: data.media_id
			}
		} else if (content.indexOf('6') >= 0) {
			var data = yield wechatAPI.uploadMaterial('video', __dirname + '/6.mp4')
			reply = {
				type: 'video',
				mediaId: data.media_id,
				title: '独角戏',
				description: '伤'
			}
		}else if (content.indexOf('7') >= 0) {
			var data = yield wechatAPI.uploadMaterial('image', __dirname + '/2.jpg')
			reply = {
				type: 'music',
				mediaId: data.media_id,
				title: 'xxx',
				musicUrl: 'http://dl.stream.qqmusic.qq.com/C200004KvnQu2AnzoV.m4a?vkey=CA8856ACD245471E7B4CCB6925ED793636A1E65159EBFA86E3A1EA30AA7E094E3227C5A713E81435AABAC1DFE7C0D280F453BA99A57F60F6&guid=5743842172&fromtag=30',
				thumbMediaId: data.media_id,
				description: 'relax'
			}
		} 
		this.body = reply
	}
	yield next
}