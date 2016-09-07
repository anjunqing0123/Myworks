define(function(require, exports){
    var cookie = require('./cookie');
    var LM = require('./mob');
    var $ = require('jquery');
    window.webReturnUrl = '';

    LM.appProxy.isApp = function(){return this._plt === 'app';}
    LM.method('userLogin', function(e) {
        location.href = 'http://passport.aplus.pptv.com/h5login?returnUrl=' + webReturnUrl;
    });
    var cb = function(){};
    LM.callback('userLogin', function(s){
        s = JSON.parse(s)['content'];
        for (var i in s) {
            if (typeof s[i] === 'string') {
                cookie.set(i, s[i], 7, 'pptv.com', '/');
            }
        }
        cb(s);
    });
    var cbT;
    return function(success) {
        cb = success;
        success();
        LM.exec('userLogin');
    }
});