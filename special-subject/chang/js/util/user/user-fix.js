/**
 * @info:解决登录登出可能触发2次的bug
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @example:
 *      user_fix().onLogin(clearModuleCacheKey).onLogout(clearModuleCacheKey); //每个user_fix()只能对应一个登录登出事件
 **/
define(function(require, exports){

    var user = require('./user');
    var cookie = require('../cookie/cookie');

    function onLogin(login, o) {
        user.onLogin(function (info) {
            // 登录再登出之后，打开登录弹窗时会错误触发onlogin，需要加ppToken验证登录状态
            if (!o.loginflag && cookie.get('ppToken')) {
                o.loginflag = true;
                o.logoutflag = false;
                login && login(info);
            }
        })
    }

    function onLogout(logout, o) {
        user.onLogout(function (info) {
            if (!o.logoutflag) {
                o.loginflag = false;
                o.logoutflag = true;
                logout && logout(info);
            }
        })
    }


    return function(){
        var o = {
            loginflag: false,
            logoutflag: false
        }

        return {
            onLogin: function(fn){onLogin(fn, o); return this;},
            onLogout: function(fn){onLogout(fn, o); return this;}
        }
    };
});
