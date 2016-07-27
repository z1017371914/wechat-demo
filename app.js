'use strict'

var Koa = require('koa')
var path = require('path')
var util = require('./libs/util')
var wechat = require('./weixin/g')
var config = require('./config/wechat.config')
var reply = require('./wx/reply')

process.env.port = 1234;

var app = new Koa()

app.use(wechat(config.wechat2, reply.reply))

app.listen(process.env.port, function() {
	console.log('running at', process.env.port)
})