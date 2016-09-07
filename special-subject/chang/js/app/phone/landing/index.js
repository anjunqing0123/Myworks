/**
 * landing page.
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){

    var $ = require('zepto'),
        sdk = require('../../../util/ppsdk/sdkUtil'),
        cookie = require('../../../util/cookie/cookie'),
        login = require('../../../util/login/login'),
        browser = require('../../../util/browser/browser')
    ;

    var isMobile = browser.MOBILE;

    $('.update_apply').on('touchstart', function(){
        //活动报名结束
        if($(this).hasClass('disable')){
            return;
        }else if (cookie.get('PPName')) {
            go();
        }else{
            userLogin(go);
        }
        return false;
    });

    var userLogin = function(callback) {
        sdk('login', {
            autologin: false,
            success: function(s) {
                for (var i in s) {
                    if (typeof s[i] === 'string') {
                        cookie.set(i, s[i], 7, 'pptv.com', '/');
                        if (i === 'token') {
                            cookie.set('ppToken',  decodeURIComponent(s[i]), 7, 'pptv.com', '/');
                        }
                    }
                }
                callback();
            },
            error: function(code, msg) {
                alert('对不起，出错了！' + msg);
            }
        });
    };

    function go(){
        $.ajax({
            url: 'http://api.chang.pptv.com/api/checksign',
            dataType: 'jsonp',
            jsonp: 'cb',
            success: function(data) {

                var urlEnroll = 'http://chang.pptv.com/app/enroll/?type=app';
                var urlHome = 'http://space.chang.pptv.com/?type=app';
                if (!!navigator.userAgent.match(/iPad/)) {
                    urlEnroll = 'http://chang.pptv.com/ipad/enroll';
                    urlHome = 'http://chang.pptv.com/ipad/space';
                }
                if(isMobile){
                    urlEnroll = 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent(urlEnroll);
                    urlHome = 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent(urlHome);
                    if (data.status === '0') {
                        userLogin(go);
                    } else if (data.status === '1') {
                        sdk('openNativePage', {
                            pageUrl: urlEnroll,
                            success: function() {},
                            error: function(code, msg) {
                            }
                        });
                    } else {
                        sdk('openNativePage', {
                            pageUrl: urlHome,
                            success: function() {},
                            error: function(code, msg) {
                            }
                        });
                    }
                }else{
                    if (data.status === '0') {
                        login.init({
                            "type" : 'login'
                        });
                    } else if (data.status === '1') {
                        window.location.href = urlEnroll;
                    } else {
                        window.location.href = urlHome;
                    }
                }
            }
        });
    }

});
