/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    VIP跳广告
 */

define(function(require, exports, modules) {

    var $ = require('jquery'),
        user = require('../../../util/user/user'),
        cookie = require('../../../util/cookie/cookie'),
        login = require('../../../util/login/login')
    ;
    var lastOpenUrl=null;
    (function() {
        //跳广告
        var JoinVip = (function() {
            var div = $('#joinVipBox');
            if (!div) return;
            var iframe = div.find('iframe')[0],
                now = +new Date(),
                loginCall = 'joinvip_' + now,
                loginUrl = 'http://passport.aplusapi.pptv.com/registerandlogin_vip/registerandlogin.html?jscall=' + loginCall,
                joinUrl = 'http://passport.aplusapi.pptv.com/registerandlogin_vip/openvip.html?jscall=' + loginCall,
                //joinUrl = 'http://local.pptv.com/html/2011/12/noad/openvip.html?jscall='+loginCall;
                loginUrl2 = 'http://passport.aplusapi.pptv.com/registerandlogin_vip/openvipfornonregistered?jscall=' + loginCall,
                joinUrl2 = 'http://passport.aplusapi.pptv.com/registerandlogin_vip/openvipforregistered?jscall=' + loginCall;

            window[loginCall] = function(action) {
                if (action == 'close') {
                    JoinVip.close();
                    return;
                }
                user.tryReadUserInfo();
                var userInfo = $.IKan.User2.userInfo;
                window.PLAYER.setUserName(userInfo.UserName);
                if (parseInt(userInfo.isVip, 10)) {
                    JoinVip.close();
                } else {
                    JoinVip.showJoin(($('#pptv_playpage_box') || $('#pptv_playpage_box'))['position']().y);
                }
            };

            $('.btn_close').on('click', function(ev) {
                ev.preventDefault();
                JoinVip.close();
            });

            $(iframe).on("load", function() {

                if (iframe.contentDocument && iframe.contentDocument.body.offsetHeight) {
                    iframe.height = iframe.contentDocument.body.scrollHeight;
                } else if (iframe.Document && iframe.Document.body.scrollHeight) {
                    iframe.height = iframe.Document.body.scrollHeight;
                }

            });

            return {
                show: function(src, top) {
                    var parent=div.parent();
                    if(parent.length!=0){
                        parent.css('display', 'none');
                    }
                    login.logout();
                    login.check(function() {
                        //vip会员和有相应特权的非vip用户通过相应的入口进入不再显示开通会员覆层
                        if (parseInt(user.info.isVip, 10) || (playerVipSource == "1" && user.info.IsNoad == "true") || (playerVipSource == "2" && user.info.IsSpdup == "true") || (playerVipSource == "3" && user.info.IsRtmp == "true")) {
                            return;
                        }
                        if(src="http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=login&from=web_adskip&app=undefined"){
                            src=lastOpenUrl;
                        }
                        JoinVip.showJoin(null, src);
                    }, {
                        type: 'login',
                        from: 'web_adskip',
                        tip: ''
                    }, {
                        top: div.css('top') || '280px'
                    });
                },
                //添加后跟的参数src，如果src存在则显示，如果不存在则使用原来的joinUrl2
                showJoin: function(top, src) {
                    var parent=div.parent();
                    if(parent.length!=0){
                        parent.css('display', 'block');
                    }
                    div.css('display','block');
                    if (top) {
                        div.css('top', top);
                    } else {
                        //保持和登陆框的位置一致  设置margin-top为-225px
                        var fw = $(iframe).width();
                        div.css({
                            'top': '50%',
                            'left': '50%',
                            'margin-left': -fw / 2 + 'px',
                            'margin-top': -225 + 'px'
                        });
                    }
                    iframe.src = lastOpenUrl= src || joinUrl2;
                },
                showJoinInfo: function(src, top) {
                    var parent=div.parent();
                    if(parent.length!=0){
                        parent.css('display', 'block');
                    }
                    div.css('display','block');
                    $('.btn_close').css('display', 'none');
                    if (top) {
                        div.css('top', top);
                    } else {
                        //保持和登陆框的位置一致  设置margin-top为-225px
                        var fw = $(iframe).width();
                        div.css({
                            'top': '50%',
                            'left': '50%',
                            'margin-left': -fw / 2 + 'px',
                            'margin-top': -225 + 'px'
                        });
                    }
                    var logined = document.cookie.indexOf('PPName');
                    if (logined > 0) {
                        iframe.src = lastOpenUrl = src || joinUrl2;
                    } else {
                        iframe.src = lastOpenUrl = src || loginUrl2;
                    }
                },
                close: function() {
                    var parent=div.parent();
                    if(parent.length!=0){
                        parent.css('display', 'none');
                    }
                    div.css('display', 'none');

                },
                changeFixframe: function(s) {
                    if (s) {
                        $(iframe).attr("height", s);
                        return;
                    }
                    $(iframe).attr("height", 250);
                }

            };

        })();
        window.JoinVip = JoinVip;

        var urls = {
            removeAd: 'http://viptv.pptv.com/vipprivilege/noad/',
            speedUp: 'http://viptv.pptv.com/vipprivilege/spdup',
            liveNotLay: 'http://viptv.pptv.com/vipprivilege/rtmp'
        };
        window.playerVipSource = -1; //播放器内跳广告类型标识 跳广告 蓝光 加速
        player && player.onVipValidate && player.onVipValidate.add(function(s) {
            playerVipSource = s; //vip登录来源,全局变量，用于setuserinfo
            var logimg = new Image();
            window['_temp_img_' + +new Date()] = logimg;
            logimg.src = 'http://pay.vip.pptv.com/paylogin?web_ad=tggg&' + (+new Date()); //统计请求
            if (window.pluginFlyobject) { //如果有小窗飞出，关掉,仅针对32IE浏览器内核
                try {
                    pluginFlyobject.CloseFlyOutWnd();
                } catch (e) {}
            }
            if (s === '1') {
                JoinVip.changeFixframe('270');
                JoinVip.showJoinInfo(urls.removeAd);
                return;
            }
            if (s === '2') {
                JoinVip.changeFixframe('270');
                JoinVip.showJoinInfo(urls.speedUp);
                return;
            }

            if (s === '4') {
                JoinVip.changeFixframe('270');
                JoinVip.showJoinInfo(urls.liveNotLay);
                return;
            }
            if (s === "5") { //播放器内pbar登录
                login.check();
                return;
            }

            JoinVip.showJoinInfo(null);

        });

        /* 播放器需要 */
        var playerUserInfo = {};
        user.onLogin(function(){
            playerUserInfo = {
                PPKey : encodeURIComponent(cookie.get('PPKey')),
                PPName : encodeURIComponent(cookie.get('PPName')),
                ppToken : encodeURIComponent(cookie.get('ppToken')),
                UDI : encodeURIComponent(cookie.get('UDI'))
            };

            if(user.info.isVip != 0){
                if(playerVipSource > 0) playerUserInfo.source = playerVipSource;
            }
            player && player.onNotification({
                header : {
                    type : 'userinfo'
                },
                body : {
                    data : playerUserInfo
                }
            });

        });

    })();
});
