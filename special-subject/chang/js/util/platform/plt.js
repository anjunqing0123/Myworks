/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    返回三个维度信息
 *
 * 平台 - 网站|客户端|多终端
 * plt = pc|clt|mut
 *
 * 系统平台
 * platform = mobile|ipad|web|clt
 *
 * 浏览器信息
 * device = ie|moz|chrome|safari|opear|weixin|iphone|ipad|android|winphone
 *
 */

define(function(require, exports, module){

    var browser = require('../browser/browser');
    var query = require('../net/urlquery');

    var params = {};
    var SPLITCHAT = {
        'plt' : ['WEB', 'CLT', 'MUT'],
        'platform' : ['IPAD', 'MOBILE', 'WEB', 'CLT'],
        'device' : ['IE', 'MOZ', 'CHROME', 'SAFARI', 'OPERA', 'WEIXIN', 'IPHONE', 'IPAD', 'ANDROID', 'ITOUCH', 'WINPHONE']
    };

    for(var key in SPLITCHAT){
        for(var k = 0, lenk = SPLITCHAT[key].length; k < lenk; k++){
            var mapKey = SPLITCHAT[key][k];
            if(browser[mapKey]){
                params[key] = mapKey.toLowerCase();
                break;
            }
        }
    }

    //merge if the key in params
    for(var i in query){
        if(params[i])
        params[i] = query[i];
    }

    return params;

});
