/*! 一唱成名 create by ErickSong */
/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    VIP跳广告
 */
define("app/pc/index/common-joinvip", [ "core/jquery/1.8.3/jquery", "../../../util/user/user", "client", "../../../util/cookie/cookie", "../../../util/login/login" ], function(require, exports, modules) {
    var $ = require("core/jquery/1.8.3/jquery"), user = require("../../../util/user/user"), cookie = require("../../../util/cookie/cookie"), login = require("../../../util/login/login");
    var lastOpenUrl = null;
    (function() {
        //跳广告
        var JoinVip = function() {
            var div = $("#joinVipBox");
            if (!div) return;
            var iframe = div.find("iframe")[0], now = +new Date(), loginCall = "joinvip_" + now, loginUrl = "http://passport.aplusapi.pptv.com/registerandlogin_vip/registerandlogin.html?jscall=" + loginCall, joinUrl = "http://passport.aplusapi.pptv.com/registerandlogin_vip/openvip.html?jscall=" + loginCall, //joinUrl = 'http://local.pptv.com/html/2011/12/noad/openvip.html?jscall='+loginCall;
            loginUrl2 = "http://passport.aplusapi.pptv.com/registerandlogin_vip/openvipfornonregistered?jscall=" + loginCall, joinUrl2 = "http://passport.aplusapi.pptv.com/registerandlogin_vip/openvipforregistered?jscall=" + loginCall;
            window[loginCall] = function(action) {
                if (action == "close") {
                    JoinVip.close();
                    return;
                }
                user.tryReadUserInfo();
                var userInfo = $.IKan.User2.userInfo;
                window.PLAYER.setUserName(userInfo.UserName);
                if (parseInt(userInfo.isVip, 10)) {
                    JoinVip.close();
                } else {
                    JoinVip.showJoin(($("#pptv_playpage_box") || $("#pptv_playpage_box"))["position"]().y);
                }
            };
            $(".btn_close").on("click", function(ev) {
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
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "none");
                    }
                    login.logout();
                    login.check(function() {
                        //vip会员和有相应特权的非vip用户通过相应的入口进入不再显示开通会员覆层
                        if (parseInt(user.info.isVip, 10) || playerVipSource == "1" && user.info.IsNoad == "true" || playerVipSource == "2" && user.info.IsSpdup == "true" || playerVipSource == "3" && user.info.IsRtmp == "true") {
                            return;
                        }
                        if (src = "http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=login&from=web_adskip&app=undefined") {
                            src = lastOpenUrl;
                        }
                        JoinVip.showJoin(null, src);
                    }, {
                        type: "login",
                        from: "web_adskip",
                        tip: ""
                    }, {
                        top: div.css("top") || "280px"
                    });
                },
                //添加后跟的参数src，如果src存在则显示，如果不存在则使用原来的joinUrl2
                showJoin: function(top, src) {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "block");
                    }
                    div.css("display", "block");
                    if (top) {
                        div.css("top", top);
                    } else {
                        //保持和登陆框的位置一致  设置margin-top为-225px
                        var fw = $(iframe).width();
                        div.css({
                            top: "50%",
                            left: "50%",
                            "margin-left": -fw / 2 + "px",
                            "margin-top": -225 + "px"
                        });
                    }
                    iframe.src = lastOpenUrl = src || joinUrl2;
                },
                showJoinInfo: function(src, top) {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "block");
                    }
                    div.css("display", "block");
                    $(".btn_close").css("display", "none");
                    if (top) {
                        div.css("top", top);
                    } else {
                        //保持和登陆框的位置一致  设置margin-top为-225px
                        var fw = $(iframe).width();
                        div.css({
                            top: "50%",
                            left: "50%",
                            "margin-left": -fw / 2 + "px",
                            "margin-top": -225 + "px"
                        });
                    }
                    var logined = document.cookie.indexOf("PPName");
                    if (logined > 0) {
                        iframe.src = lastOpenUrl = src || joinUrl2;
                    } else {
                        iframe.src = lastOpenUrl = src || loginUrl2;
                    }
                },
                close: function() {
                    var parent = div.parent();
                    if (parent.length != 0) {
                        parent.css("display", "none");
                    }
                    div.css("display", "none");
                },
                changeFixframe: function(s) {
                    if (s) {
                        $(iframe).attr("height", s);
                        return;
                    }
                    $(iframe).attr("height", 250);
                }
            };
        }();
        window.JoinVip = JoinVip;
        var urls = {
            removeAd: "http://viptv.pptv.com/vipprivilege/noad/",
            speedUp: "http://viptv.pptv.com/vipprivilege/spdup",
            liveNotLay: "http://viptv.pptv.com/vipprivilege/rtmp"
        };
        window.playerVipSource = -1;
        //播放器内跳广告类型标识 跳广告 蓝光 加速
        player && player.onVipValidate && player.onVipValidate.add(function(s) {
            playerVipSource = s;
            //vip登录来源,全局变量，用于setuserinfo
            var logimg = new Image();
            window["_temp_img_" + +new Date()] = logimg;
            logimg.src = "http://pay.vip.pptv.com/paylogin?web_ad=tggg&" + +new Date();
            //统计请求
            if (window.pluginFlyobject) {
                //如果有小窗飞出，关掉,仅针对32IE浏览器内核
                try {
                    pluginFlyobject.CloseFlyOutWnd();
                } catch (e) {}
            }
            if (s === "1") {
                JoinVip.changeFixframe("270");
                JoinVip.showJoinInfo(urls.removeAd);
                return;
            }
            if (s === "2") {
                JoinVip.changeFixframe("270");
                JoinVip.showJoinInfo(urls.speedUp);
                return;
            }
            if (s === "4") {
                JoinVip.changeFixframe("270");
                JoinVip.showJoinInfo(urls.liveNotLay);
                return;
            }
            if (s === "5") {
                //播放器内pbar登录
                login.check();
                return;
            }
            JoinVip.showJoinInfo(null);
        });
        /* 播放器需要 */
        var playerUserInfo = {};
        user.onLogin(function() {
            playerUserInfo = {
                PPKey: encodeURIComponent(cookie.get("PPKey")),
                PPName: encodeURIComponent(cookie.get("PPName")),
                ppToken: encodeURIComponent(cookie.get("ppToken")),
                UDI: encodeURIComponent(cookie.get("UDI"))
            };
            if (user.info.isVip != 0) {
                if (playerVipSource > 0) playerUserInfo.source = playerVipSource;
            }
            player && player.onNotification({
                header: {
                    type: "userinfo"
                },
                body: {
                    data: playerUserInfo
                }
            });
        });
    })();
});

/**
 *用户登陆请求和用户数据信息读取
 * mirongxu
 */
define("util/user/user", [ "core/jquery/1.8.3/jquery", "client", "util/cookie/cookie" ], function(require) {
    var jq = require("core/jquery/1.8.3/jquery"), clientCommon = require("client"), cookie = require("util/cookie/cookie"), encode = encodeURIComponent, infoKeys = [ "Gender", //性别
    "PpNum", //用户极点
    "ExpNum", //用户经验值
    "LevelName", //用户等级
    "NextLevelName", //下一等级名称
    "NextLevelExpNum", //下一等级相差经验值
    "Area", //省市
    "Subscribe", //用户一天的节目订阅数
    "UnreadNotes", //未读的小纸条数
    "HeadPic", //用户图像
    "Email", //用户Email
    "OnlineTime", //在线时间
    "Birthday", //生日
    "BlogAddress", //blog地址
    "Signed", //签名档
    "Type", //节目类型
    "Nickname", //昵称
    "isVip", //vip -> 0|1|2
    "VipDate", //vip过期日期
    "IsNoad", //去广告
    "NoadDate", //
    "IsSpdup", //加速
    "SpdupDate", "IsRtmp", //低延迟直播RTMP
    "RtmpDate", //
    "IsUgspeed", //UGS等级加速
    "UgspeedDate" ], domain = "pptv.com", path = "/", loginUrl = "http://passport.pptv.com/weblogin.do?";
    //登陆，退出defer
    var loginDefer = jq.Deferred(), logoutDefer = jq.Deferred(), loginPromise = jq.when(loginDefer), logoutPromise = jq.when(logoutDefer);
    function htmlEncode(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    // var clientCommon = window.clientCommon;
    var User = {
        /**
         * 用户信息对象
         */
        info: {},
        isLogined: false,
        /**
         * 读取用户cookie，并触发登陆或者退出
         */
        readInfo: function(notify) {
            //在UDI存在时，用UDI中的信息填充info
            //UDI若不存在，判断是否是客户端
            //  若不是客户端，代表没有登录，触发logout通知
            //  若是客户端，调用客户端接口判断是否登录
            //      若登录，从客户端中读取info信息，客户端中只能读到部分信息
            var udi = cookie.get("UDI");
            var ppname = cookie.get("PPName");
            if (udi == null || ppname == null) {
                if (isClient && clientCommon && clientCommon.userIsLogin()) {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    this.info["UserName"] = passport.userName;
                    this.info["Nickname"] = passport.nickName;
                    this.info["HeadPic"] = passport.facePictureURL;
                    this.info["isVip"] = passport.isVipUser;
                } else {
                    //触发logout通知
                    if (notify) {
                        this.logoutEvents.fire();
                        logoutDefer.resolve();
                    }
                    return this.info;
                }
            } else {
                // Java的URLEncode是把空格encode为加号，因此要先进行替换
                var infoList = udi.replace(/\+/g, "%20").replace(/\%/g, "%25").split("$");
                //把UDI字段拆分存放到info对象中
                for (var i = 0; i < infoList.length; i++) {
                    this.info[infoKeys[i]] = infoList[i];
                }
                this.info["Nickname"] = decodeURIComponent(this.info["Nickname"]);
                //把PPName字段信息拆分存放info对象中
                var nameList = ppname.split("$");
                this.info["UserName"] = decodeURIComponent(nameList[0]);
            }
            if (isClient && clientCommon && clientCommon.userIsLogin()) {
                this.info["token"] = external.GetObject("@pplive.com/passport;1").token;
            } else {
                this.info["token"] = cookie.get("ppToken");
            }
            this.isLogined = true;
            if (notify) {
                if (loginDefer.state() == "resolved" || loginDefer.state() == "pending") {
                    this.loginEvents.fire(this.info);
                }
                loginDefer.resolve(this.info);
            }
            return this.info;
        },
        /**
         * 登陆
         */
        login: function(name, password, callback) {
            var self = this;
            jq.ajax({
                url: loginUrl,
                dataType: "jsonp",
                jsonp: "cb",
                data: {
                    username: name,
                    password: password
                },
                success: function(statu, json) {
                    if (statu == 1) {
                        self._writeInfo(json);
                    }
                    callback(statu, self.info);
                    loginDefer.resolve(self.info);
                    self.loginEvents.fire(self.info);
                }
            });
            return this;
        },
        /**
         * 退出
         */
        logout: function() {
            if (isClient && clientCommon) {
                try {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    passport.Logout();
                } catch (e) {}
            }
            cookie.remove("PPKey", domain, path);
            cookie.remove("UDI", domain, path);
            cookie.remove("PPName", domain, path);
            cookie.remove("ppToken", domain, path);
            this.isLogined = false;
            logoutDefer.resolve();
            this.logoutEvents.fire();
            return this;
        },
        /**
         * 写入用户信息到pptv.com根域下
         */
        _writeInfo: function(data) {
            for (var i in data) {
                cookie.set(i, data[i], 7, domain, path);
            }
        },
        /**
         * 登陆事件回调
         */
        loginEvents: jq.Callbacks(),
        /**
         *退出事件回调
         */
        logoutEvents: jq.Callbacks(),
        /**
         * 登陆消息处理，并添加到登陆事件
         */
        onLogin: function(fn) {
            loginPromise.then(fn);
            this.loginEvents.add(fn);
            return this;
        },
        /**
         * 退出消息处理，并添加到退出事件
         */
        onLogout: function(fn) {
            logoutPromise.then(fn);
            this.logoutEvents.add(fn);
            return this;
        },
        //海沟计划之真实用户识别,针对有插用户发送diskid和name，设置白名单用户cookie标识
        white: function(flag) {
            var ppi = cookie.get("ppi");
            var self = this;
            var url = "http://tools.aplusapi.pptv.com/get_ppi";
            if (flag || !ppi) {
                var diskId;
                var defer = jq.Deferred();
                getDiskId();
                defer.then(function() {
                    var userName = null;
                    if (diskId !== undefined) {
                        url += "?b=" + encode(diskId);
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "&a=" + encode(userName);
                        }
                    } else {
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "?a=" + encode(userName);
                        }
                    }
                    window.wn = window.wn || function() {};
                    jq.ajax({
                        type: "GET",
                        url: url,
                        jsonp: "cb",
                        cache: true,
                        dataType: "jsonp",
                        contentType: "text/json; charset=utf-8",
                        jsonpCallback: "wn",
                        async: true,
                        success: function(data) {
                            if (data.ppi) {
                                cookie.set("ppi", data.ppi, 1, "pptv.com", "/");
                            }
                        },
                        complete: function(xhr, textStatus) {}
                    });
                });
            }
            //获取插件
            function getDiskId() {
                var obj;
                try {
                    if (navigator.userAgent.indexOf("IE") > -1) {
                        obj = new ActiveXObject("PPLive.Lite");
                        diskId = obj.getDiskID();
                    } else {
                        if (window.navigator.mimeTypes["application/x-pptv-plugin"]) {
                            var id = "PPTVPlayer_plugin_detect_" + +new Date();
                            var div = document.createElement("div");
                            div.style.cssText = "width:1px;height:1px;line-height:0px;font-size:0px;overflow:hidden;";
                            div.innerHTML = '<object width="1px" height="1px" id="' + id + '" type="application/x-pptv-plugin"><param value="false" name="enableupdate"><param value="false" name="enabledownload"><param name="type" value="2"/></object>';
                            document.body.appendChild(div);
                            obj = document.getElementById(id);
                            diskId = obj.getDiskID();
                        }
                    }
                    defer.resolve();
                } catch (e) {
                    jq.ajax({
                        type: "GET",
                        dataType: "jsonp",
                        jsonp: "cb",
                        jsonpCallback: "synacast_json",
                        cache: true,
                        url: "http://127.0.0.1:9000/synacast.json",
                        timeout: 1e3,
                        success: function(data) {
                            diskId = data.k;
                            defer.resolve();
                        },
                        error: function() {
                            defer.resolve();
                        }
                    });
                }
            }
        }
    };
    //脚本载入自动读取用户cookie,并触发消息通知
    User.readInfo(true);
    if (!isClient) {
        User.white();
        var FlashApi = window.player || window.PLAYER;
        //登录时白名单检查
        User.loginEvents.add(function() {
            User.white(true);
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                var UserInfo = {
                    ppToken: encode(cookie.get("ppToken")),
                    PPKey: encode(cookie.get("PPKey")),
                    PPName: encode(cookie.get("PPName")),
                    UDI: encode(cookie.get("UDI"))
                };
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: UserInfo
                    }
                });
            }
        });
        User.logoutEvents.add(function() {
            cookie.remove("ppi", "pptv.com", "/");
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: {}
                    }
                });
            }
        });
    }
    return User;
});

/**
 *cookie操作封装
 *mirongxu
 */
define("util/cookie/cookie", [], function(require) {
    var doc = document, MILLISECONDS_OF_DAY = 24 * 60 * 60 * 1e3, encode = encodeURIComponent, decode = decodeURIComponent;
    function isValidParamValue(val) {
        var t = typeof val;
        // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || t !== "object" && t !== "function";
    }
    function isNotEmptyString(val) {
        return isValidParamValue(val) && val !== "";
    }
    return {
        /**
         * Returns the cookie value for given name
         * @return {String} name The name of the cookie to retrieve
         */
        get: function(name) {
            var ret, m;
            if (isNotEmptyString(name)) {
                if (m = String(doc.cookie).match(new RegExp("(?:^| )" + name + "(?:(?:=([^;]*))|;|$)"))) {
                    ret = m[1] ? decode(m[1]) : "";
                }
            }
            return ret;
        },
        /**
         * Set a cookie with a given name and value
         * @param {String} name The name of the cookie to set
         * @param {String} val The value to set for cookie
         * @param {Number|Date} expires
         * if Number secified how many days this cookie will expire
         * @param {String} domain set cookie's domain
         * @param {String} path set cookie's path
         * @param {Boolean} secure whether this cookie can only be sent to server on https
         */
        set: function(name, val, expires, domain, path, secure) {
            var text = String(encode(val)), date = expires;
            // 从当前时间开始，多少天后过期
            if (typeof date === "number") {
                date = new Date();
                date.setTime(date.getTime() + expires * MILLISECONDS_OF_DAY);
            }
            // expiration date
            if (date instanceof Date) {
                if (expires === 0) {
                    text += ";";
                } else {
                    text += "; expires=" + date.toUTCString();
                }
            }
            // domain
            if (isNotEmptyString(domain)) {
                text += "; domain=" + domain;
            }
            // path
            if (isNotEmptyString(path)) {
                text += "; path=" + path;
            }
            // secure
            if (secure) {
                text += "; secure";
            }
            doc.cookie = name + "=" + text;
        },
        /**
         * Remove a cookie from the machine by setting its expiration date to sometime in the past
         * @param {String} name The name of the cookie to remove.
         * @param {String} domain The cookie's domain
         * @param {String} path The cookie's path
         * @param {String} secure The cookie's secure option
         */
        remove: function(name, domain, path, secure) {
            this.set(name, "", -1, domain, path, secure);
        }
    };
});

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    通用login
 */
define("util/login/login", [ "core/jquery/1.8.3/jquery", "util/user/user", "client", "util/cookie/cookie" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), user = require("util/user/user"), cookie = require("util/cookie/cookie"), doc = document, ipadPlayer = function(s) {
        var videoPlayer = $("video");
        if (videoPlayer.length === 0) return;
        if (s == "hidden") {
            videoPlayer.each(function() {
                $(this).attr("_controls", $(this).attr("controls"));
                $(this).removeAttr("controls");
            });
        } else {
            videoPlayer.each(function() {
                $(this).attr("controls", $(this).attr("_controls"));
            });
        }
    };
    try {
        doc.domain = "pptv.com";
    } catch (err) {}
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var clientCommon = window.clientCommon;
    if (isClient && clientCommon) {
        clientCommon.onLogin(function() {
            var sid = setInterval(function() {
                user.readInfo(true);
                clearInterval(sid);
            }, 1e3);
        });
        clientCommon.onLogout(function() {
            user.logout();
        });
    }
    var layer = function() {
        var self = this, now = +new Date(), _cssopts = {}, params = {
            type: "login"
        }, isLoged = !!(cookie.get("PPName") && cookie.get("UDI")) || false, size = "standard";
        var urls = {
            standard: "http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=",
            mobile: "http://pub.aplus.pptv.com/phonepub/mobilogin/?tab=",
            mobile_web: "http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?tab=",
            mobile_web_nosns: "http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?sns=0",
            mini: "http://pub.aplus.pptv.com/wwwpub/minilogin/?tab=",
            tiny: "http://app.aplus.pptv.com/zt/2013/cwpd/plogin/?tab=",
            empty: "about:blank"
        };
        var wp_div = doc.createElement("div"), msk_div = doc.createElement("div"), btn_close = doc.createElement("span");
        wp_div.setAttribute("id", _cssopts.id);
        wp_div.setAttribute("class", "layer loginlayer");
        wp_div.id = "layer_" + now;
        btn_close.className = "layer_close";
        btn_close.innerHTML = "<a href='javascript:;' onclick='close_" + now + "()' class='close'></a>";
        wp_div.innerHTML = "<iframe id='iframe' src='" + urls.empty + "' style='overflow:visible;z-index:2' width='100%' height='100%'  scrolling='no' frameborder='0'></iframe>";
        btn_close.style.cssText = "position:absolute; right:15px; top:15px; width:20px; height:20px; text-align:center;background:url('http://static9.pplive.cn/pptv/index/v_201203081858/images/no.gif'); cursor:pointer";
        wp_div.appendChild(btn_close);
        var wp_width = "620", //$(wp_div).width(),
        wp_height = "498", //$(wp_div).height(),
        st = $(doc).scrollTop(), sl = $(doc).scrollLeft();
        _cssopts = {
            width: wp_width + "px",
            height: wp_height + "px",
            visibility: "hidden",
            position: "absolute",
            top: "50%",
            left: "50%",
            "margin-top": st - 450 / 2 + "px",
            "margin-left": sl - wp_width / 2 + "px",
            "z-index": 1e4
        };
        return {
            init: function(opts, cssopts) {
                doc.body.appendChild(wp_div);
                $(wp_div).css(_cssopts);
                //仅针对直播秀或iPad
                wp_div.style.cssText = "width:0; height:0;overflow:hidden";
                var iframe = $("#iframe");
                iframe.on("load", function() {
                    if (navigator.userAgent.indexOf("MSIE") > -1) {
                        $(this).height(430);
                    } else {
                        var doc = this.contentDocument;
                        $(this).height($(doc).find("body").height());
                    }
                });
                window["iframehide"] = function() {
                    var c = doc.getElementById("iframe");
                    wp_div.style.visibility = "hidden";
                    $(wp_div).css({
                        width: "0",
                        height: "0"
                    });
                    ipadPlayer("visible");
                };
                var isLogined = this.isLogined();
                if (isLogined) {
                    user.readInfo(true);
                    return;
                }
                params = $.extend(params, opts);
                if (isClient && clientCommon) {
                    if (params.type == "login") {
                        clientCommon.showLoginBox();
                    } else if (params.type == "reg") {
                        clientCommon.showRegBox();
                    }
                    return;
                }
                st = $(doc).scrollTop();
                sl = $(doc).scrollLeft();
                /** Web请求参数from
                 *  web顶部信息条    web_toplist
                 *  直播秀      web_liveshow
                 *  评论/聊聊   web_comt
                 *  跳过广告    web_adskip
                 *  添加榜单    web_list
                 *  直播频道互动  web_liveinter
                 *  Web_page(注册网页)
                 *  Web_adskip(跳过广告)
                 *  自定义导航   web_topnav
                 *  播放页订阅/收藏    web_collect
                 *
                **/
                /** app表示哪个应用登录，
                 * vas需求 - app=ppshow，调用vas登录、注册api
                 */
                if (iframe.length > 0) {
                    if (params.hasOwnProperty("size")) {
                        size = params["size"];
                    }
                    iframe[0].src = urls[size] + params.type + "&from=" + params.from + "&app=" + params.app + (params.tip ? "&tip=" + params.tip : "");
                    // + '&r=' + Math.random();
                    _cssopts["margin-top"] = st - 450 / 2 + "px";
                    _cssopts["margin-left"] = sl - wp_width / 2 + "px";
                    _cssopts = cssopts ? $.extend(_cssopts, cssopts) : _cssopts;
                    if (size == "mobile_web" || size == "mobile_web_nosns") {
                        _cssopts["margin-top"] = "0px";
                        _cssopts["margin-left"] = "0px";
                        _cssopts["top"] = (document.body.scrollTop || document.documentElement.scrollTop) + "px";
                        _cssopts["left"] = "0px";
                        _cssopts["width"] = "100%";
                        _cssopts["height"] = "100%";
                        _cssopts["overflow"] = "auto";
                        $(wp_div).find(".layer_close").hide();
                    }
                    $(wp_div).css(_cssopts);
                    iframe.parent().css("visibility", "visible");
                    ipadPlayer("hidden");
                }
                btn_close.onclick = function() {
                    wp_div.style.visibility = "hidden";
                    $(wp_div).css({
                        width: "0",
                        height: "0"
                    });
                    if (window.CustomListDialog) {
                        CustomListDialog.close();
                    }
                    ipadPlayer("visible");
                };
            },
            success: {},
            isLogined: function() {
                if (isClient && clientCommon) {
                    //客户端
                    return clientCommon.userIsLogin();
                } else {
                    return !!(cookie.get("PPName") && cookie.get("UDI"));
                }
            },
            show: function(params) {},
            hide: function() {
                doc.body.removeChild(wp_div);
            },
            check: function(callback, params, cssobj) {
                var isLogined = this.isLogined();
                if (params) {
                    if (params.from) {
                        this.success[params.from] = callback;
                    }
                    if (params.size in urls) {
                        size = params.size;
                    }
                }
                if (isLogined) {
                    if (callback && typeof callback == "function") {
                        callback();
                    }
                } else {
                    this.init(params, cssobj);
                }
            },
            logout: function(callback) {
                if (callback && typeof callback == "function") {
                    user.onLogout(callback);
                } else {
                    user.logout();
                }
            },
            onSuccess: function(arg, from) {
                user.readInfo(true);
                //触发登录
                if (arg == "success" && this.success[from]) {
                    this.check(this.success[from]);
                }
            }
        };
    }();
    return layer;
});
