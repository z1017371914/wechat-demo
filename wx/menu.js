'use strict'

module.exports = {
	'button': [{
		'name': '剪子包袱锤',
		'type': 'click',
		'key': '666'
	}, {
		name: '点出菜单',
		'sub_button': [{
			'type': 'view',
			'name': '本项目地址',
			'url': 'https://github.com/evilemon/wechat-demo'
		}, {
			'name': '扫码推送',
			'type': 'scancode_push',
			'key': 'qr_scan_push'
		}, {
			'name': '扫码等待消息',
			'type': 'scancode_waitmsg',
			'key': 'qr_scan_wait'
		}, {
			'name': '弹出系统拍照',
			'type': 'pic_sysphoto',
			'key': 'pic_photo'
		}, {
			'name': '弹出拍照或相册',
			'type': 'pic_photo_or_album',
			'key': 'pic_photo_album'
		}]
	}, {
		'name': '其他功能',
		'sub_button': [{
			"name": "发送位置",
			"type": "location_select",
			"key": "rselfmenu_2_0"
		}, {
			'name': '微信相册发图',
			'type': 'pic_weixin',
			'key': 'pic_weixin'

		}]
	}]
}