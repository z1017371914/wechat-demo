var path = require('path')
var util = require('../libs/util')
var wechat_file = path.join(__dirname, './wechat.txt')

module.exports = {
	wechat: {
		appID: 'wxb1b8ac0327f95bbe',
		appSecret: '0934fa2825162f2116295e42e0d0012a',
		token: 'evilemon',
		getAccessToken: function() {
			return util.readFileAsync(wechat_file)
		},
		saveAccessToken: function(data) {
			return util.writeFileAsync(wechat_file, JSON.stringify(data))
		}
	}
}