var path = require('path')
var util = require('../libs/util')
var wechat_file = path.join(__dirname, './wechat.txt')

module.exports = {
	wechat: {
		appID: 'wx1bf35639c6ec2d34',
		appSecret: '5bb67da21753b87a293e87e072086f7f ',
		token: 'evilemon',
		getAccessToken: function() {
			return util.readFileAsync(wechat_file)
		},
		saveAccessToken: function(data) {
			return util.writeFileAsync(wechat_file, JSON.stringify(data))
		}
	},
	wechat2: {
		appID: 'wx280acc87d13d7f1b',
		appSecret: 'b023f06bebc2fb11762a931b40c7cd6f',
		token: 'evilemon',
		getAccessToken: function() {
			return util.readFileAsync(wechat_file)
		},
		saveAccessToken: function(data) {
			return util.writeFileAsync(wechat_file, JSON.stringify(data))
		}
	}
}