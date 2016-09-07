/*! 一唱成名 create by ErickSong */
define("util/pub/user-data", [ "core/jquery/1.8.3/jquery", "../user/user-fix", "../user/user", "client", "../cookie/cookie", "../loader/loader", "../log/log", "../platform/plt", "../browser/browser", "../net/urlquery", "./history", "../json/json", "./puid", "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), user_fix = require("../user/user-fix"), user = require("../user/user"), loader = require("../loader/loader"), cookie = require("../cookie/cookie"), history = require("./history"), _ = require("core/underscore/1.8.3/underscore"), JSON = require("../json/json");
    var webcfg = window.webcfg || {};
    var FROM = webcfg.isClient ? "clt" : "web";
    /*数据模块start*/
    //播放记录
    var playhistorySync = {
        api: "http://sync.pptv.com/v6/",
        errData: {
            200: "成功",
            304: "成功",
            401: "权限出错",
            404: "资源不存在",
            422: "参数或内容不可处理",
            500: "系统内部错误"
        },
        getUserName: function(username) {
            var _username = username || user.info.UserName;
            return _username;
        },
        getUrl: function(params) {
            var _url = this.api + this.getUserName(params.username) + "/";
            if (!params.type) {
                log("type can not be null!");
                return false;
            }
            _url += params.type + "/";
            if (params.cid) {
                _url += params.cid + "/";
            }
            log("_url : >>> ", _url);
            return _url += "?";
        },
        go: function(params, callback) {
            if (!this.getUserName(params.username)) {
                log("Not Login!");
                return false;
            }
            if (webcfg && webcfg.IsCloudOpen === false) {
                log("由于接口有问题，云同步已经关闭....", webcfg.IsCloudOpen);
                return false;
            }
            return loader.ajax({
                url: this.getUrl(params),
                data: params.parms
            }).done(function(d) {
                log("Data >>>>", d);
                if (callback && typeof callback == "function") {
                    callback.apply(null, arguments);
                }
            });
        }
    };
    var playhistory = {
        get: function(callback, sort) {
            // 取缓存
            if (this._cache_playhistory) {
                callback(this._cache_playhistory);
                return;
            }
            if (user.isLogined) {
                playhistorySync.go({
                    type: "Recent",
                    parms: {
                        from: FROM,
                        tk: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    // data = {0:{}, 1:{}}
                    playhistory._cache_playhistory = typeof sort === "function" ? _.sortBy(_.toArray(data), sort) : _.toArray(data);
                    callback && callback(playhistory._cache_playhistory);
                });
            } else {
                history.PlayHistory.get(function(data) {
                    /*
                    data = {error: 0, message: "操作成功", value: [
                        index: 0
                        value: "{"Id":8006303,"SubId":17413248,"Name":"哎哟好正点-20140707-第四期","Pos":91,"Duration":"3012","link":"gHLeXSpmjMotqxM","VideoType":3,"_mt":"1404895274103"}"
                    ]}
                    */
                    if (!data.error) {
                        var ndata;
                        if (data.value && data.value.length) {
                            ndata = _.map(data.value, function(n) {
                                var t = $.parseJSON(n.value);
                                t.index = n.index;
                                return t;
                            });
                        }
                        playhistory._cache_playhistory = typeof sort === "function" ? _.sortBy(ndata, sort) : ndata;
                        callback && callback(playhistory._cache_playhistory);
                    } else {
                        log(data.message);
                        callback && callback([]);
                    }
                });
            }
        },
        delCache: function() {
            this._cache_playhistory = null;
        },
        del: function(id, success, fail) {
            var cache = this._cache_playhistory, index = -1;
            if (cache) {
                $.each(cache, function(i, n) {
                    // Id || SubId || index
                    if (n && (n.Id == id || n.index == id || n.SubId == id)) {
                        index = i;
                        return false;
                    }
                });
                if (index !== -1 && cache[index]) {
                    if (user.isLogined) {
                        playhistorySync.go({
                            type: "Recent",
                            cid: id,
                            parms: {
                                _method: "delete",
                                from: FROM,
                                tk: cookie.get("ppToken") || ""
                            }
                        }).done(function(d) {
                            if (d && (d.errCode == 200 || d.errCode == 304)) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log("[remove playhistory error]", d);
                                fail && fail(d);
                            }
                        });
                    } else {
                        history.PlayHistory.remove(id, function(d) {
                            if (d && d.error === 0) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log("[remove playhistory error]", d);
                                fail && fail(d);
                            }
                        });
                    }
                }
            }
        }
    };
    //云播播放记录
    var cloudhistory = {
        get: function(callback, sort) {
            if (this._cache_cloudhistory) {
                callback(this._cache_cloudhistory);
                return;
            }
            if (user.isLogined) {
                playhistorySync.go({
                    type: "CpRecent",
                    parms: {
                        from: FROM,
                        tk: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    cloudhistory._cache_cloudhistory = typeof sort === "function" ? _.sortBy(_.toArray(data), sort) : _.toArray(data);
                    callback && callback(cloudhistory._cache_cloudhistory);
                });
            }
        }
    };
    var favorite = {
        get: function(callback, sort) {
            // 取缓存
            var cache;
            if (this._cache_favorite) {
                callback(this._cache_favorite);
                return;
            }
            if (user.isLogined) {
                playhistorySync.go({
                    type: "Favorites",
                    parms: {
                        from: FROM,
                        tk: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    // data = {0:{}, 1:{}}
                    favorite._cache_favorite = typeof sort === "function" ? _.sortBy(_.toArray(data), sort) : _.toArray(data);
                    callback && callback(favorite._cache_favorite);
                });
            } else {
                // 未登录用户没有收藏功能
                callback && callback([]);
            }
        },
        set: function(id, success, fail) {
            var FavoriteObject = {
                Id: id,
                Pos: 0
            };
            playhistorySync.go({
                type: "Favorites",
                cid: id,
                parms: {
                    from: "web",
                    _method: "post",
                    _json: decodeURIComponent(JSON.stringify(FavoriteObject)),
                    tk: cookie.get("ppToken") || ""
                }
            }, function(d) {
                favorite._cache_favorite.push({
                    Id: id
                });
                success && success(d);
            }, null, function() {
                fail && fail();
            });
        },
        delCache: function() {
            this._cache_favorite = null;
        },
        del: function(id, success, fail) {
            var cache = this._cache_favorite, index = -1;
            if (cache) {
                $.each(cache, function(i, n) {
                    if (n && n.Id === id) {
                        index = i;
                        return false;
                    }
                });
                if (index !== -1 && cache[index]) {
                    if (user.isLogined) {
                        playhistorySync.go({
                            type: "Favorites",
                            cid: cache[index].Id,
                            parms: {
                                _method: "delete",
                                from: FROM,
                                tk: cookie.get("ppToken") || ""
                            }
                        }).done(function(d) {
                            if (d && (d.errCode == 200 || d.errCode == 304)) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log("[remove favorites error]", d);
                                fail && fail(d);
                            }
                        });
                    }
                }
            }
        }
    };
    var recommend = {
        get: function(callback, sort) {
            // 取缓存
            var cache;
            if (this._cache_recommend) {
                callback(this._cache_recommend, recommend._cache_uuid);
                return;
            }
            var option = {
                params: {}
            };
            if (typeof sort != "function") {
                option = sort;
                sort = option.sort;
            }
            $.extend(option.params, {
                format: "jsonp",
                callback: "getRec"
            });
            /*文档地址：http://sharepoint/tech/datadivision/Shared%20Documents/Forms/AllItems.aspx?RootFolder=%2Ftech%2Fdatadivision%2FShared%20Documents%2Frecommend&FolderCTID=0x012000C0777BE34EFFDB41A199ECB0A77193B9&View={AB4A77E1-A2B8-4E2D-B0AD-136B7CDAAF4E}*/
            /*原接口：http://svcdn.pptv.com/show/v1/recommend.json?cb=getRec&long_video=1&ppi=302c32&num=30*/
            /*
            --- params -----
            参数                               = 网站/客户端
            appplt[*产品线]                    = ikan/client
            appid[*&产品线id]                  = 111/110
            appver[产品版本]                   = 1.0/1.0
            src[*&产品线]                      = 71/63
            video[频道id]                      = null
            uid[用户id]                        = username || uid
            num[返回数量]                      = 18
            area[地域屏蔽]                     = P
            userLevel[??]                      = 0
            vipUser[用户等级0|1]               = 0
            removeVideoIds[要过滤的频道ID列表] =
            extraFields[返回域]                =all
            format                             =jsonp
            callback                           =func
            */
            loader.ajax({
                url: "http://api.v.pptv.com/api/pg_recommend?",
                jsonpCallback: "getRec",
                data: option.params
            }).done(function(data) {
                if (!data.error) {
                    var urlFormat = data.data.urlFormat, picUrlFormat = data.data.picUrlFormat;
                    recommend._cache_uuid = data.requestUUID;
                    recommend._cache_recommend = typeof sort === "function" ? _.sortBy(data.videos, sort) : _.toArray(data.videos);
                    _.map(recommend._cache_recommend, function(n) {
                        n.id = n.pic;
                        n.pic = picUrlFormat.replace("[PIC]", n.pic).replace("[SN]", n.sn);
                        n.url = urlFormat.replace("[URL]", n.url);
                        return n;
                    });
                    callback && callback(recommend._cache_recommend, recommend._cache_uuid);
                } else {
                    log("load http://recommend.pptv.com/recommend error!", data);
                }
            });
        }
    };
    // 清缓存
    var clearCache = function() {
        playhistory._cache_playhistory = null;
        favorite._cache_favorite = null;
        recommend._cache_recommend = null;
    };
    user_fix().onLogin(clearCache).onLogout(clearCache);
    var userDetail = {
        read: function(callback) {
            var self = this;
            var detail = this.detail = {};
            var cb = callback || function() {};
            this.load = false;
            if (!this.load) {
                if (!user.isLogined) {
                    return;
                }
                loader.ajax({
                    url: "http://api.usergrowth.pptv.com/getUserBilling?",
                    data: {
                        username: user.info.UserName,
                        from: "web",
                        format: "jsonp",
                        token: cookie.get("ppToken") || ""
                    }
                }).done(function(data) {
                    if (!data.flag) {
                        self.load = true;
                        self.data = data.result;
                        callback && callback(data.result);
                    }
                });
            } else {
                cb(this.data);
            }
        },
        getPb: function(callback) {
            var UserInfo = user.info;
            loader.ajax({
                url: "http://pb.pptv.com/getmemberinfo?",
                data: {
                    username: UserInfo.UserName,
                    token: cookie.get("ppToken") || "",
                    format: "jsonp"
                }
            }).done(function(d) {
                var msg = {
                    "1": "decode token exception",
                    "2": "token content illegal",
                    "3": "token expired",
                    "4": "username not match",
                    "5": "get pb member exception"
                };
                if (d.errcode === 0) {
                    callback && callback(d.pbamount);
                } else {
                    log("pb -> getmemberinfo", d.errcode, msg[d.errcode]);
                }
            });
        },
        clear: function() {
            self.load = false;
            self.data = {};
        }
    };
    /*数据模块end*/
    return {
        playhistory: playhistory,
        PlayHistory: playhistorySync,
        favorite: favorite,
        recommend: recommend,
        clearCache: clearCache,
        userDetail: userDetail,
        cloudhistory: cloudhistory
    };
});

/**
 * @info:解决登录登出可能触发2次的bug
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @example:
 *      user_fix().onLogin(clearModuleCacheKey).onLogout(clearModuleCacheKey); //每个user_fix()只能对应一个登录登出事件
 **/
define("util/user/user-fix", [ "util/user/user", "core/jquery/1.8.3/jquery", "client", "util/cookie/cookie" ], function(require, exports) {
    var user = require("util/user/user");
    var cookie = require("util/cookie/cookie");
    function onLogin(login, o) {
        user.onLogin(function(info) {
            // 登录再登出之后，打开登录弹窗时会错误触发onlogin，需要加ppToken验证登录状态
            if (!o.loginflag && cookie.get("ppToken")) {
                o.loginflag = true;
                o.logoutflag = false;
                login && login(info);
            }
        });
    }
    function onLogout(logout, o) {
        user.onLogout(function(info) {
            if (!o.logoutflag) {
                o.loginflag = false;
                o.logoutflag = true;
                logout && logout(info);
            }
        });
    }
    return function() {
        var o = {
            loginflag: false,
            logoutflag: false
        };
        return {
            onLogin: function(fn) {
                onLogin(fn, o);
                return this;
            },
            onLogout: function(fn) {
                onLogout(fn, o);
                return this;
            }
        };
    };
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
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    loader - 加载器

 * Loader.load('url', params, sucessCallback, errorcallback, beforeSend, scope);

 * Loader.load('ordersvc/v1/getLastNews.json?', {
 *     type : 'hoster',
 *     roomid : webcfg.roomid,
 *     limit : 20,
 *     __config__ : {
 *        cache : true,
 *        callback : 'getCallback'
 *     }
 * }, function(d){
 *     if(d && d.err === 0 && d.data){
 *        GIftRender($('#gift ul'), d.data);
 *    }
 * });
 *
 */
define("util/loader/loader", [ "core/jquery/1.8.3/jquery", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var log = require("util/log/log");
    var loaderParams = require("util/platform/plt");
    var Loader = {}, N = 0;
    function load(url, params, callback, errorcallback, beforecallback, scope) {
        log("Loader load====", url, params);
        var sevurl = url, _config = {}, _cdn, prefix = "pplive_callback_", callbackName = "", beforeCallback = beforecallback || $.noop, errorCallback = typeof errorcallback == "function" ? errorcallback : $.noop, opts = {
            from: "chang",
            version: "2.1.0",
            format: "jsonp"
        };
        params = $.extend(opts, loaderParams, params);
        if (params.__config__) {
            _config = params.__config__;
            delete params.__config__;
        }
        _cdn = _config.cache === true || _config.cdn === true && _config.callback ? true : false;
        sevurl = sevurl.indexOf("?") > -1 ? sevurl + "&" : sevurl + "?";
        sevurl += $.param(params);
        sevurl = sevurl.replace(/&&/, "&").replace(/\?\?/, "?");
        if (sevurl.match(/cb=.*/i)) {
            callbackName = /cb=(.*?(?=&)|.*)/.exec(sevurl)[1];
            sevurl = sevurl.replace(/(.*)?(cb=.*?\&+)/, "$1");
        } else {
            callbackName = _cdn ? _config.callback : prefix + N++;
        }
        $.ajax({
            dataType: "jsonp",
            type: "GET",
            cache: _config.cache === 0 ? false : true,
            url: sevurl,
            jsonp: "cb",
            jsonpCallback: function() {
                return callbackName;
            },
            beforeSend: function(XMLHttpRequest) {
                beforeCallback();
            },
            success: function(data) {
                _config = null;
                if (callback && typeof callback == "function") {
                    callback.apply(scope, arguments);
                }
            },
            timeout: 1e4,
            statusCode: {
                404: function() {
                    errorCallback();
                },
                500: function() {
                    errorCallback();
                },
                502: function() {
                    errorCallback();
                },
                504: function() {
                    errorCallback();
                },
                510: function() {
                    errorCallback();
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                log("Ajax Load error: ", sevurl, XMLHttpRequest, textStatus, errorThrown);
                errorCallback();
            }
        });
    }
    function ajax(option) {
        var opt = $.extend({
            type: "GET",
            dataType: "jsonp",
            cache: true,
            jsonp: "cb",
            success: function() {},
            error: function() {}
        }, loaderParams, option);
        var success = opt.success;
        opt.success = function(data) {
            if (!data.err) {
                success(data);
            } else {}
        };
        return $.ajax(opt);
    }
    Loader = {
        load: load,
        ajax: ajax
    };
    module.exports = Loader;
});

/**
 * @author  Erick Song
 * @date    2012-08-22
 * @email   ahschl0322@gmail.com
 * @info    console.log moudle
 *
 * 2014-03-20   增加sendLog方法发送错误日志
 *
 */
define("util/log/log", [], function(require) {
    var logdiv, logstr = "", doc = document, curl = window.location.href, encode = encodeURIComponent, isDebug = window.DEBUG || curl.slice(-4) === "-deb" ? true : false;
    var pe = {
        serviceUrl: "http://web.data.pplive.com/pe/1.html?",
        newImg: new Image(),
        adr: curl,
        sadr: "log",
        et: "js",
        n: "ERROR_"
    };
    var sendLog = function(e, prefix) {
        prefix = prefix || "default";
        pe.newImg.src = pe.serviceUrl + "et=" + pe.et + "&adr=" + encode(pe.adr) + "&sadr=" + encode(pe.sadr) + "&n=" + encode(pe.n + prefix + "_" + (e.message || e));
    };
    if (!window.console) {
        window.console = {};
        window.console.log = function() {
            return;
        };
    }
    //log
    window.log = function() {
        if (isDebug && this.console) {
            console.log(date2str(new Date(), "hh:mm:ss"), [].slice.call(arguments));
        }
    };
    log.sendLog = sendLog;
    if (isDebug) {
        log.sendLog = function() {};
    }
    //firelite + log
    if (curl.indexOf("firelite=1") > -1) {
        var a = doc.createElement("A");
        a.href = 'javascript:if(!window.firebug){window.firebug=document.createElement("script");firebug.setAttribute("src","http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js");document.body.appendChild(firebug);(function(){if(window.firebug.version){firebug.init()}else{setTimeout(arguments.callee)}})();void (firebug);if(window.log){(function(){if(window.firebug&&window.firebug.version){for(var a=0;a<log.history.length;a++){console.log(log.history[a])}}else{setTimeout(arguments.callee,100)}})()}};';
        a.style.cssText = "position:absolute;right:0;top:0;color:#000;font-size:12px;border:1px solid #f00";
        a.innerHTML = "Filelite + Log";
        doc.body.appendChild(a);
    }
    /*else if(curl.indexOf('log=1') > -1){
        for(var i = 0, l = arguments.length; i < l; i ++){ logstr += arguments[i] + " ## " ;}
        if(typeof(logdiv) == 'undefined'){
            logdiv = doc.createElement('div');
            logdiv.style.cssText = 'position:absolute;left:0;bottom:0;width:400px;height:200px;overflow:hidden;overflow-y:auto;border:1px solid #f00;z-index:10000;background:#ccc';
            doc.body.appendChild(logdiv);
        }
        logdiv.innerHTML += logstr + '<br />';
    }else{}*/
    function date2str(x, y) {
        var z = {
            M: x.getMonth() + 1,
            d: x.getDate(),
            h: x.getHours(),
            m: x.getMinutes(),
            s: x.getSeconds()
        };
        y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
            return ((v.length > 1 ? "0" : "") + eval("z." + v.slice(-1))).slice(-2);
        });
        return y.replace(/(y+)/g, function(v) {
            return x.getFullYear().toString().slice(-v.length);
        });
    }
    return log;
});

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
define("util/platform/plt", [ "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var browser = require("util/browser/browser");
    var query = require("util/net/urlquery");
    var params = {};
    var SPLITCHAT = {
        plt: [ "WEB", "CLT", "MUT" ],
        platform: [ "IPAD", "MOBILE", "WEB", "CLT" ],
        device: [ "IE", "MOZ", "CHROME", "SAFARI", "OPERA", "WEIXIN", "IPHONE", "IPAD", "ANDROID", "ITOUCH", "WINPHONE" ]
    };
    for (var key in SPLITCHAT) {
        for (var k = 0, lenk = SPLITCHAT[key].length; k < lenk; k++) {
            var mapKey = SPLITCHAT[key][k];
            if (browser[mapKey]) {
                params[key] = mapKey.toLowerCase();
                break;
            }
        }
    }
    //merge if the key in params
    for (var i in query) {
        if (params[i]) params[i] = query[i];
    }
    return params;
});

/**
 * @author: xuxin | seanxu@pptv.com
 * @Date: 13-7-18
 * @history
 */
define("util/browser/browser", [], function(require, exports, module) {
    var ua = navigator.userAgent.toLowerCase();
    var external = window.external || "";
    var core, m, extra, version, os;
    var isMobile = function() {
        var check = false;
        (function(a, b) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                check = true;
            }
        })(navigator.userAgent || navigator.vendor || window.opera);
        check = ua.match(/(iphone|ipod|android|ipad|blackberry|webos|windows phone)/i) ? true : false;
        return check;
    }();
    var numberify = function(s) {
        var c = 0;
        return parseFloat(s.replace(/\./g, function() {
            return c++ == 1 ? "" : ".";
        }));
    };
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    try {
        if (/windows|win32/i.test(ua)) {
            os = "windows";
        } else if (/macintosh/i.test(ua)) {
            os = "macintosh";
        } else if (/rhino/i.test(ua)) {
            os = "rhino";
        }
        if ((m = ua.match(/applewebkit\/([^\s]*)/)) && m[1]) {
            core = "webkit";
            version = numberify(m[1]);
        } else if ((m = ua.match(/presto\/([\d.]*)/)) && m[1]) {
            core = "presto";
            version = numberify(m[1]);
        } else if (m = ua.match(/msie\s([^;]*)/)) {
            core = "trident";
            version = 1;
            if ((m = ua.match(/trident\/([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        } else if (/gecko/.test(ua)) {
            core = "gecko";
            version = 1;
            if ((m = ua.match(/rv:([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        }
        if (/world/.test(ua)) {
            extra = "world";
        } else if (/360se/.test(ua)) {
            extra = "360";
        } else if (/maxthon/.test(ua) || typeof external.max_version == "number") {
            extra = "maxthon";
        } else if (/tencenttraveler\s([\d.]*)/.test(ua)) {
            extra = "tt";
        } else if (/se\s([\d.]*)/.test(ua)) {
            extra = "sogou";
        }
    } catch (e) {}
    var ret = {
        OS: os,
        CORE: core,
        Version: version,
        EXTRA: extra ? extra : false,
        IE: /msie/.test(ua) || /trident/.test(ua) && /rv[:\s]\d+/.test(ua),
        OPERA: /opera/.test(ua),
        MOZ: /gecko/.test(ua) && !/(compatible|webkit)/.test(ua),
        IE5: /msie 5 /.test(ua),
        IE55: /msie 5.5/.test(ua),
        IE6: /msie 6/.test(ua),
        IE7: /msie 7/.test(ua),
        IE8: /msie 8/.test(ua),
        IE9: /msie 9/.test(ua),
        SAFARI: !/chrome\/([\d.]*)/.test(ua) && /\/([\da-f.]*) safari/.test(ua),
        CHROME: /chrome\/([\d.]*)/.test(ua),
        //!!window["chrome"]
        IPAD: /\(ipad/i.test(ua),
        IPHONE: /\(iphone/i.test(ua),
        ITOUCH: /\(itouch/i.test(ua),
        ANDROID: /android|htc/i.test(ua) || /linux/i.test(ua.platform + ""),
        IOS: /iPhone|iPad|iPod|iOS/i.test(ua),
        MOBILE: isMobile,
        WEIXIN: /micromessenger/i.test(ua),
        WINPHONE: /windows phone/i.test(ua),
        WEB: !/iPhone|iPad|iPod|iOS/i.test(ua) && !/android|htc/i.test(ua) && !/windows phone/i.test(ua),
        CLT: isClient
    };
    ret["MUT"] = !ret.WEB && !ret.CLIENT;
    return ret;
});

/**
 * 获取url参数，返回一个对象
 */
define("util/net/urlquery", [], function(require) {
    var queryStr = window.location.search;
    if (queryStr.indexOf("?") === 0 || queryStr.indexOf("#") === 0) {
        queryStr = queryStr.substring(1, queryStr.length);
    }
    var queryObj = {};
    var tt = queryStr.split("&");
    for (var i in tt) {
        var ss = typeof tt[i] == "string" ? tt[i].split("=") : [];
        if (ss.length == 2) {
            queryObj[ss[0]] = decodeURIComponent(ss[1]);
        }
    }
    return queryObj;
});

/**
 * @author  Erick Song
 * @date    2012-08-30
 * @email   ahschl0322@gmail.com
 * @info    网站历史记录功能
 *
 */
define("util/pub/history", [ "core/jquery/1.8.3/jquery", "util/json/json", "util/log/log", "util/pub/puid", "util/cookie/cookie" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), JSON = require("util/json/json"), log = require("util/log/log"), puid = require("util/pub/puid");
    puid.getPuid(function(_puid) {
        puid = _puid;
    });
    var History = {
        load: function(action, params, callback, domain) {
            var parsList = [], item, url = "http://" + (typeof domain == "undefined" ? "c1" : domain) + ".pptv.com/stg/";
            log(action, " : ", params);
            $.ajax({
                dataType: "jsonp",
                type: "GET",
                url: url + action + "?" + $.param(params),
                jsonp: "cb",
                data: {
                    format: "jsonp"
                },
                //cache : false,
                success: function(data) {
                    if (data && data.error === 0) {
                        if (callback && typeof callback == "function") {
                            callback.apply(null, arguments);
                        }
                    }
                }
            });
        },
        set: function(params, callback) {
            this.load("set", params, callback);
        },
        get: function(params, callback) {
            this.load("get", params, callback);
        },
        add: function(params, callback) {
            this.load("add", params, callback);
        },
        remove: function(params, callback) {
            this.load("remove", params, callback);
        },
        clear: function(key, callback) {
            this.load("set", {
                key: key,
                value: "",
                expire: 0
            }, callback);
        }
    };
    var PlayHistory = {
        key: "play_history",
        expire: 365 * 24 * 60 * 60,
        max: 8,
        set: function(value, callback) {
            if (!isArray(value)) {
                value = [ value ];
            }
            for (var i = 0, l = value.length; i < l; i++) {
                value[i] = $.JSON.encode(value[i]);
            }
            History.set({
                key: this.key,
                value: value,
                expire: this.expire,
                max_len: this.max
            }, callback);
        },
        get: function(callback) {
            History.get({
                key: this.key,
                max_len: this.max
            }, callback);
        },
        add: function(value, callback) {
            History.add({
                key: this.key,
                value: JSON.stringify(value),
                expire: this.expire,
                ut: 1,
                //去除已存在的，追加新的记录
                max_len: this.max
            }, callback);
        },
        remove: function(index, callback) {
            History.remove({
                key: this.key,
                index: index,
                expire: this.expire
            }, callback);
        },
        clear: function(callback) {
            History.clear(this.key, callback);
        }
    };
    var SearchHistory = {
        key: "search_history",
        expire: 365 * 24 * 60 * 60,
        max: 6,
        set: function(value, callback) {
            if (!isArray(value)) {
                value = [ value ];
            }
            for (var i = 0, l = value.length; i < l; i++) {
                value[i] = $.JSON.encode(value[i]);
            }
            History.set({
                key: this.key,
                value: value,
                expire: this.expire,
                max_len: this.max
            }, callback);
        },
        get: function(callback) {
            History.get({
                key: this.key,
                max_len: this.max
            }, callback);
        },
        add: function(value, callback) {
            History.add({
                key: this.key,
                value: JSON.stringify(value),
                expire: this.expire,
                ut: 1,
                //去除已存在的，追加新的记录
                max_len: this.max
            }, callback);
        },
        remove: function(index, callback) {
            History.remove({
                key: this.key,
                index: index,
                expire: this.expire
            }, callback);
        },
        clear: function(callback) {
            History.clear(this.key, callback);
        }
    };
    var NavHistory = {
        trigger: null,
        //#mini_record
        holder: null,
        //#fu_historylist
        listDiv: null,
        //.fu_history
        recommend: null,
        //.fu_recommend
        build: function() {
            if (!this.trigger && !this.holder && !this.listDiv) return;
            //获取一次数据，并将构建好的html插入到制定的div里面
            var self = this;
            function show() {
                self.trigger.addClass("hover his_active");
                self.holder.show();
            }
            function hide() {
                self.trigger.removeClass("hover his_active");
                self.holder.hide();
            }
            function displayRecommend(display) {
                if (self.recommend) {
                    self.recommend.css("display", display || "block");
                }
            }
            displayRecommend("none");
            function _build() {
                PlayHistory.get(function(d) {
                    var list = d.value || [];
                    list.reverse();
                    if (d.error == 1) {
                        self.recommend.html("<p>" + d.message + "</p>");
                    } else {
                        if (list.length < 1) {
                            self.listDiv.hide();
                            displayRecommend("block");
                        } else {
                            self.listDiv.show();
                            displayRecommend("none");
                            self.listDiv.find(".fu_lists").html(self._makeListHtml(list));
                            self._bindHtmlEvent();
                        }
                    }
                });
            }
            self.holder.find(".fu_delall").on("click", function(ev) {
                ev.preventDefault();
                PlayHistory.clear(function() {
                    self.listDiv.hide();
                    displayRecommend("block");
                });
            });
            self.holder.find(".fu_viewall").hide();
            self.holder.find(".fu_viewall").on("click", function(ev) {
                ev.preventDefault();
                //判断登录逻辑
                seajs.use("user", function(user) {
                    log("user : ", user);
                    var islogin = user.isLogined;
                    if (!islogin) {}
                });
            });
            self.trigger.hover(function() {
                show();
                _build();
            }, function() {
                hide();
            });
            self.holder.hover(show, hide);
        },
        _bindHtmlEvent: function() {
            var self = this;
            var del = self.listDiv.find(".fu_del");
            self.listDiv.find("dl").hover(function() {
                $(this).addClass("hover");
            }, function() {
                $(this).removeClass("hover");
            });
            del.on("click", function(ev) {
                ev.preventDefault();
                var el = this;
                PlayHistory.remove($(this).attr("data-index"), function(d) {
                    if (d.error === 0) {
                        var p = $(el.parentNode.parentNode);
                        p.remove();
                        if ($(self.listDiv).children().length < 1) {
                            if ($(self.recommend)) {
                                $(this).find(".fu_delbox").css("display", "none");
                                $(self.recommend).css("display", "block");
                            }
                        }
                    }
                });
            });
        },
        _makeListHtml: function(list) {
            var html = [];
            for (var i = 0, len = list.length; i < len; i++) {
                var item = list[i];
                var value = $.parseJSON(decodeURIComponent(item.value));
                var relUrl = this.pushUrl(value.Link || value.link);
                html.push('<dl class="' + (i == len - 1 ? "fu_nobd" : "") + '"><dt>');
                html.push('<a href="' + relUrl + "?rcc_starttime=" + (value.Pos || value.pos) + '" title="' + (value.Name || value.name) + '" target="_play">' + (value.Name || value.name) + "</a>");
                //兼容线上播放页
                html.push('<a href="' + relUrl + '" class="fu_del" data-index="' + item.index + '" title="删除本条记录"></a>');
                html.push("</dt><dd></dd></dl>");
            }
            return html.join("");
        },
        pushUrl: function(s) {
            return s.indexOf("http") > -1 ? s : "http://v.pptv.com/show/" + s + ".html";
        },
        parseUrl: function(s) {
            return s.indexOf("http") > -1 ? s.match(/.*?v.pptv.com\/(.*?)\.html/)[1] : s;
        }
    };
    window.History = History;
    //兼容顶踩
    return {
        History: History,
        PlayHistory: PlayHistory,
        SearchHistory: SearchHistory,
        NavHistory: NavHistory
    };
});

/*
 @fileOverview  http://www.JSON.org/json2.js

 2010-08-25

 Public Domain.

 NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

 See http://www.JSON.org/js.html


 This code should be minified before deployment.
 See http://javascript.crockford.com/jsmin.html

 USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
 NOT CONTROL.


 This file creates a global JSON object containing two methods: stringify
 and parse.

 JSON.stringify(value, replacer, space)
 value       any JavaScript value, usually an object or array.

 replacer    an optional parameter that determines how object
 values are stringified for objects. It can be a
 function or an array of strings.

 space       an optional parameter that specifies the indentation
 of nested structures. If it is omitted, the text will
 be packed without extra whitespace. If it is a number,
 it will specify the number of spaces to indent at each
 level. If it is a string (such as '\t' or '&nbsp;'),
 it contains the characters used to indent at each level.

 This method produces a JSON text from a JavaScript value.

 When an object value is found, if the object contains a toJSON
 method, its toJSON method will be called and the result will be
 stringified. A toJSON method does not serialize: it returns the
 value represented by the name/value pair that should be serialized,
 or undefined if nothing should be serialized. The toJSON method
 will be passed the key associated with the value, and this will be
 bound to the value

 For example, this would serialize Dates as ISO strings.

 Date.prototype.toJSON = function (key) {
 function f(n) {
 // Format integers to have at least two digits.
 return n < 10 ? '0' + n : n;
 }

 return this.getUTCFullYear()   + '-' +
 f(this.getUTCMonth() + 1) + '-' +
 f(this.getUTCDate())      + 'T' +
 f(this.getUTCHours())     + ':' +
 f(this.getUTCMinutes())   + ':' +
 f(this.getUTCSeconds())   + 'Z';
 };

 You can provide an optional replacer method. It will be passed the
 key and value of each member, with this bound to the containing
 object. The value that is returned from your method will be
 serialized. If your method returns undefined, then the member will
 be excluded from the serialization.

 If the replacer parameter is an array of strings, then it will be
 used to select the members to be serialized. It filters the results
 such that only members with keys listed in the replacer array are
 stringified.

 Values that do not have JSON representations, such as undefined or
 functions, will not be serialized. Such values in objects will be
 dropped; in arrays they will be replaced with null. You can use
 a replacer function to replace those with JSON values.
 JSON.stringify(undefined) returns undefined.

 The optional space parameter produces a stringification of the
 value that is filled with line breaks and indentation to make it
 easier to read.

 If the space parameter is a non-empty string, then that string will
 be used for indentation. If the space parameter is a number, then
 the indentation will be that many spaces.

 Example:

 text = JSON.stringify(['e', {pluribus: 'unum'}]);
 // text is '["e",{"pluribus":"unum"}]'


 text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
 // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

 text = JSON.stringify([new Date()], function (key, value) {
 return this[key] instanceof Date ?
 'Date(' + this[key] + ')' : value;
 });
 // text is '["Date(---current time---)"]'


 JSON.parse(text, reviver)
 This method parses a JSON text to produce an object or array.
 It can throw a SyntaxError exception.

 The optional reviver parameter is a function that can filter and
 transform the results. It receives each of the keys and values,
 and its return value is used instead of the original value.
 If it returns what it received, then the structure is not modified.
 If it returns undefined then the member is deleted.

 Example:

 // Parse the text. Values that look like ISO date strings will
 // be converted to Date objects.

 myData = JSON.parse(text, function (key, value) {
 var a;
 if (typeof value === 'string') {
 a =
 /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
 if (a) {
 return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
 +a[5], +a[6]));
 }
 }
 return value;
 });

 myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
 var d;
 if (typeof value === 'string' &&
 value.slice(0, 5) === 'Date(' &&
 value.slice(-1) === ')') {
 d = new Date(value.slice(5, -1));
 if (d) {
 return d;
 }
 }
 return value;
 });


 This is a reference implementation. You are free to copy, modify, or
 redistribute.
 */
/*jslint evil: true, strict: false */
/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
 call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
 getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
 lastIndex, length, parse, prototype, push, replace, slice, stringify,
 test, toJSON, toString, valueOf
 */
// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.
define("util/json/json", [], function() {
    var JSON;
    if (!JSON) {
        JSON = {};
    }
    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? "0" + n : n;
    }
    if (typeof Date.prototype.toJSON !== "function") {
        Date.prototype.toJSON = function(key) {
            return isFinite(this.valueOf()) ? this.getUTCFullYear() + "-" + f(this.getUTCMonth() + 1) + "-" + f(this.getUTCDate()) + "T" + f(this.getUTCHours()) + ":" + f(this.getUTCMinutes()) + ":" + f(this.getUTCSeconds()) + "Z" : null;
        };
        String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key) {
            return this.valueOf();
        };
    }
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
        // table of character substitutions
        "\b": "\\b",
        "	": "\\t",
        "\n": "\\n",
        "\f": "\\f",
        "\r": "\\r",
        '"': '\\"',
        "\\": "\\\\"
    }, rep;
    function quote(string) {
        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.
        escapable["lastIndex"] = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
            var c = meta[a];
            return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }
    function str(key, holder) {
        // Produce a string from holder[key].
        var i, // The loop counter.
        k, // The member key.
        v, // The member value.
        length, mind = gap, partial, value = holder[key];
        // If the value has a toJSON method, call it to obtain a replacement value.
        if (value && typeof value === "object" && typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }
        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.
        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }
        // What happens next depends on the value's type.
        switch (typeof value) {
          case "string":
            return quote(value);

          case "number":
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : "null";

          case "boolean":
          case "null":
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);

          // If the type is 'object', we might be dealing with an object or an array or
            // null.
            case "object":
            // Due to a specification blunder in ECMAScript, typeof null is 'object',
            // so watch out for that case.
            if (!value) {
                return "null";
            }
            // Make an array to hold the partial results of stringifying this object value.
            gap += indent;
            partial = [];
            // Is the value an array?
            if (Object.prototype.toString.apply(value) === "[object Array]") {
                // The value is an array. Stringify every element. Use null as a placeholder
                // for non-JSON values.
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }
                // Join all of the elements together, separated with commas, and wrap them in
                // brackets.
                v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            // If the replacer is an array, use it to select the members to be stringified.
            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === "string") {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            } else {
                // Otherwise, iterate through all of the keys in the object.
                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            }
            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.
            v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }
    // If the JSON object does not yet have a stringify method, give it one.
    if (typeof JSON.stringify !== "function") {
        JSON.stringify = function(value, replacer, space) {
            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.
            var i;
            gap = "";
            indent = "";
            // If the space parameter is a number, make an indent string containing that
            // many spaces.
            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }
            } else if (typeof space === "string") {
                indent = space;
            }
            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.
            rep = replacer;
            if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }
            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            return str("", {
                "": value
            });
        };
    }
    // If the JSON object does not yet have a parse method, give it one.
    if (typeof JSON.parse !== "function") {
        JSON.parse = function(text, reviver) {
            // The parse method takes a text and an optional reviver function, and returns
            // a JavaScript value if the text is a valid JSON text.
            var j;
            function walk(holder, key) {
                // The walk method is used to recursively walk the resulting structure so
                // that modifications can be made.
                var k, v, value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }
            // Parsing happens in four stages. In the first stage, we replace certain
            // Unicode characters with escape sequences. JavaScript handles many characters
            // incorrectly, either silently deleting them, or treating them as line endings.
            text = String(text);
            cx["lastIndex"] = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function(a) {
                    return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }
            // In the second stage, we run the text against regular expressions that look
            // for non-JSON patterns. We are especially concerned with '()' and 'new'
            // because they can cause invocation, and '=' because it can cause mutation.
            // But just to be safe, we want to reject all unexpected forms.
            // We split the second stage into 4 regexp operations in order to work around
            // crippling inefficiencies in IE's and Safari's regexp engines. First we
            // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
            // replace all simple value tokens with ']' characters. Third, we delete all
            // open brackets that follow a colon or comma or that begin the text. Finally,
            // we look to see that the remaining characters are only whitespace or ']' or
            // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
            if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                // In the third stage we use the eval function to compile the text into a
                // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
                // in JavaScript: it can begin a block or an object literal. We wrap the text
                // in parens to eliminate the ambiguity.
                j = eval("(" + text + ")");
                // In the optional fourth stage, we recursively walk the new structure, passing
                // each name/value pair to a reviver function for possible transformation.
                return typeof reviver === "function" ? walk({
                    "": j
                }, "") : j;
            }
            // If the text is not JSON parseable, then a SyntaxError is thrown.
            throw new SyntaxError("JSON.parse");
        };
    }
    return JSON;
});

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    获取PUID
 */
define("util/pub/puid", [ "core/jquery/1.8.3/jquery", "util/cookie/cookie" ], function(require) {
    var puid, $ = require("core/jquery/1.8.3/jquery"), cookie = require("util/cookie/cookie");
    var Puid = {
        getPuid: function(cb) {
            puid = cookie.get("PUID");
            if (puid) {
                cb.call(null, puid);
            } else {
                //分配PUID    http://c(1|2|3|4).pptv.com/puid/get?(&format=[jsonp|json|xml]&cb=[cb])
                $.ajax({
                    dataType: "jsonp",
                    type: "GET",
                    url: "http://c1.pptv.com/puid/get",
                    jsonp: "cb",
                    data: {
                        format: "jsonp"
                    },
                    success: function(data) {
                        if (data.error === 0) {
                            puid = data.value;
                            if (typeof cb == "function") {
                                cb.call(null, puid);
                            }
                        }
                    }
                });
            }
        }
    };
    return Puid;
});
