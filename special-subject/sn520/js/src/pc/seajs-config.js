window._mainVersion = 'v_20160425163212/dist';
window.sn520Version = 'v_20160316141409';
seajs.config({
    base: 'http://static9.pplive.cn/pptv/main/'+ _mainVersion,
    paths: {
    	'sn520': 'http://static9.pplive.cn/sn520/'+ sn520Version + '/js/dist',
    },
    alias: {
        "jquery": "http://static9.pplive.cn/pptv/main/" + _mainVersion + "/lib/jquery/1.8.3/jquery.js",
        "underscore": "http://static9.pplive.cn/pptv/main/" + _mainVersion + "/lib/underscore/1.6.0/underscore.js",
        "publicheader": "http://static9.pplive.cn/pptv/main/v_20160316141409/src/pub/header.js",
        "login": "util/login",
        "login-fix": "util/login-fix",
        "user": "util/user",
        "suggest2": "util/suggest2",
        "client" : "http://static9.pplive.cn/pc_client/v_20160115145907/clt.js",
        "pctx":"util/pctx.js",
        "sctx":"util/sctx.js",
        "pbar":"util/pbar.js",
        "popbox":"util/popbox.js",
        "md5" :"util/md5.js"
    }
});