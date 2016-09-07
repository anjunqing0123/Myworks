define("m/app/index", [ "jquery", "../util/cookie", "../util/vote", "../util/get_jsonp", "../util/number", "../util/dataFormat", "../util/coupon", "../util/common", "../util/login", "../util/mob", "../util/play", "../util/share" ], function(require, exports) {
    var $ = require("jquery");
    var cookie = require("../util/cookie");
    require("../util/vote");
    var coupon = require("../util/coupon");
    coupon($(".getsale"));
    require("../util/common");
    require("../util/play");
    require("../util/common");
    require("../util/share");
});

/**
 *cookie操作封装
 *mirongxu
 */
define("m/util/cookie", [], function(require) {
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

define("m/util/vote", [ "jquery", "m/util/cookie", "m/util/get_jsonp", "m/util/number", "m/util/dataFormat" ], function(require, exports) {
    var VOTE_URL = "http://www.suning.com";
    var TOKEN_URL = "/vote/csrf";
    var $ = require("jquery");
    var cookie = require("m/util/cookie");
    var getJsonp = require("m/util/get_jsonp");
    var number = require("m/util/number");
    var dataFormat = require("m/util/dataFormat");
    var voteToken = cookie.get("snvotetoken");
    var vote = function(voteid, voteToken, success) {
        getJsonp("http://api.suning520.vote.pptv.com/vote/" + voteid + "/increase", {
            _token: voteToken
        }, function(data) {
            success(data);
        });
    };
    var c = function(voteid, success) {
        if (voteToken) {
            vote(voteid, voteToken, success);
        } else {
            getJsonp("http://api.suning520.vote.pptv.com/vote/csrf", {}, function(data) {
                voteToken = data.token;
                vote(voteid, voteToken, success);
            });
        }
    };
    $(".up a").click(function() {
        var that = this;
        var voteid = $(this).attr("voteid");
        var voteCookie = JSON.parse(cookie.get("snvote") || "{}");
        cookie.set("sn_right", 1, 30, "pptv.com", "/");
        if ($(this).hasClass("disable")) {
            $("#coupon-deadline").fadeIn();
            return;
        }
        if (dataFormat(new Date(), "YYYYMMdd") == dataFormat(new Date(voteCookie.date), "YYYYMMdd")) {
            if (voteCookie.record >= 3) {
                $("#coupon-out").fadeIn();
                return;
            }
        } else {
            voteCookie = {
                date: new Date().getTime(),
                record: 0
            };
        }
        c(voteid, function(data) {
            if (data.errors) {
                $("#coupon-out").fadeIn();
                return;
            }
            $(that).addClass("cur").next(".vote-num").text(number(data.counter));
            voteCookie.record++;
            cookie.set("snvote", JSON.stringify(voteCookie), 30, "pptv.com", "/");
            $("#coupon-success").fadeIn();
            var $1 = $('<span style="position: relative;color:#FE6292;">+1</span>');
            $1.appendTo($(that)).animate({
                top: -50,
                opacity: 0
            }, 600);
        });
    });
    return c;
});

define("m/util/get_jsonp", [ "jquery" ], function(require, exports) {
    var $ = require("jquery");
    var getJsonp = function(url, data, success) {
        success = success || $.noop;
        $.ajax({
            url: url,
            data: data,
            success: function(data) {
                success(data);
            },
            dataType: "jsonp",
            jsonp: "cb",
            jsonpCallback: "cb"
        });
    };
    return getJsonp;
});

define("m/util/number", [], function() {
    return function(n) {
        var b = parseInt(n).toString();
        var len = b.length;
        if (len <= 3) {
            return b;
        }
        var r = len % 3;
        return r > 0 ? b.slice(0, r) + "," + b.slice(r, len).match(/\d{3}/g).join(",") : b.slice(r, len).match(/\d{3}/g).join(",");
    };
});

define("m/util/dataFormat", [], function() {
    var dateFormat = function(dateObj, format) {
        if (typeof dateObj === "number") {
            dateObj = new Date(dateObj);
        }
        var weekCn = [ "日", "一", "二", "三", "四", "五", "六" ];
        var reg = /yyyy|MM|dd|hh|mm|ss|w/g;
        var map = {
            yyyy: dateObj.getFullYear(),
            MM: dateObj.getMonth() + 1,
            dd: dateObj.getDate(),
            w: weekCn[dateObj.getDay()],
            hh: dateObj.getHours(),
            mm: dateObj.getMinutes(),
            ss: dateObj.getSeconds()
        };
        return format.replace(reg, function(str) {
            if (str.length === 4 || str === "w") {
                return String(map[str]);
            } else {
                return ("0" + String(map[str])).slice(-2);
            }
        });
    };
    return dateFormat;
});

define("m/util/coupon", [ "jquery", "m/util/cookie" ], function(require, exports) {
    var COUPON_URL = "http://sale.suning.com/syb/520dijiakuanghuan/index.html";
    var $ = require("jquery");
    var cookie = require("m/util/cookie");
    return function($getBtn) {
        $getBtn.click(function() {
            if (cookie.get("sn_right") == 1) {
                $(this).attr("href", COUPON_URL);
            } else {
                $("#coupon-alert").fadeIn();
            }
        });
    };
});

define("m/util/common", [ "jquery", "m/util/cookie", "m/util/get_jsonp", "m/util/login", "m/util/mob" ], function(require, exports) {
    var $ = require("jquery");
    var cookie = require("m/util/cookie");
    var getJsonp = require("m/util/get_jsonp");
    var login = require("m/util/login");
    $(".module-mpop .close").click(function() {
        $(this).parents(".module-mpop").eq(0).fadeOut();
        if ($(this).parents(".module-mpop").attr("id") == "coupon-success") {
            $(".getsale").addClass("bound-pirce");
            setTimeout(function() {
                $(".getsale").removeClass("bound-pirce");
            }, 5e3);
        }
    });
    $("#home-page, #upload-page").click(function() {
        var that = this;
        if (!cookie.get("PPName")) {
            login(function() {
                if (cookie.get("PPName")) {
                    location.href = $(that).attr("href");
                }
                window.webReturnUrl = $(that).attr("href");
            });
            return false;
        }
        return true;
    });
});

define("m/util/login", [ "m/util/cookie", "m/util/mob", "jquery" ], function(require, exports) {
    var cookie = require("m/util/cookie");
    var LM = require("m/util/mob");
    var $ = require("jquery");
    window.webReturnUrl = "";
    LM.appProxy.isApp = function() {
        return this._plt === "app";
    };
    LM.method("userLogin", function(e) {
        location.href = "http://passport.aplus.pptv.com/h5login?returnUrl=" + webReturnUrl;
    });
    var cb = function() {};
    LM.callback("userLogin", function(s) {
        s = JSON.parse(s)["content"];
        for (var i in s) {
            if (typeof s[i] === "string") {
                cookie.set(i, s[i], 7, "pptv.com", "/");
            }
        }
        cb(s);
    });
    var cbT;
    return function(success) {
        cb = success;
        success();
        LM.exec("userLogin");
    };
});

/**
 * @author   Yan Yang
 * @email    yyfireman@163.com
 * @version  v1.1.0
 * @info     兼容app和native的UI（功能）创建，根据环境调用app接口或js方法。
 */
/*************************
注：
1)目前版本有缺陷，回调方法在app环境中只能存在一个，
  而在非app中才是正常的回调队列。
2)LM.whenApp()必须是在监测到extenal存在的情况下才会执行，
  并且，LM.isApp()在获得参数plt=app时返回true，但是无法获得external后会返回false
*************************/
/*
    example:

    LM.callback('userLogin', function(s){
        console.log('userLogin callback1:' + s);
    });

    LM.callback('userLogin', function(s){
        console.log('userLogin callback2:' + s);
    });

    LM.method('userLogin', function(promise){
        confirm('userLogin method') && promise.done('userLogin promise'[, argu1[, argu2[, argu3[...]]);
    });

    document.getElementById('login').onclick = function(){
        LM.exec('userLogin');
    };

    LM.whenApp(function(){
        alert('In App!!!');
    });


*/
define("m/util/mob", [], function(require, exports, module) {
    (function(module, global) {
        // console.log('start')
        var getParam = function(s) {
            var m = location.search.substring(1).match(new RegExp(s + "=(.*?)(&|$)"));
            return m && m.length > 0 ? m[1] : "";
        };
        var extend = function(s, o) {
            for (var n in o) {
                s[n] = o[n];
            }
        };
        // 回调类
        var Callback = function() {
            this.fns = [];
        };
        Callback.prototype = {
            add: function(fn) {
                this.fns[this.fns.length] = fn;
            },
            remove: function(fn) {
                for (var i = 0; i < this.fns.length; i++) {
                    if (this.fns[i] === fn) {
                        delete this.fns[i];
                        return;
                    }
                }
            },
            empty: function() {
                this.fns = [];
            },
            fire: function() {
                for (var i = 0; i < this.fns.length; i++) {
                    if (typeof this.fns[i] === "function") {
                        this.fns[i].apply(global, arguments);
                    }
                }
            }
        };
        var Ready = new Callback();
        Ready.add = function(callback) {
            // console.log(externalProxy.readyStatus())
            if (externalProxy.readyStatus() > 0) {
                callback(false);
            } else if (externalProxy.readyStatus() < 0) {
                callback(true);
            } else {
                Callback.prototype.add.call(this, callback);
            }
        };
        // 调用app的对象
        var externalProxy = {
            // 设备external准备完毕
            _ready: 0,
            //1 : success | -1 : failed
            _plt: getParam("plt"),
            // 执行external
            proxy: function(name, params) {
                var callbackName = "__" + name;
                var param = params;
                param.push(callbackName);
                external[name].apply(external, param);
            },
            // 当_ready == true
            ready: function() {
                this._ready = 1;
            },
            // external调用失败
            loadFailed: function() {
                this._plt = "";
                this._ready = -1;
            },
            // isApp: function(){return this._plt === 'app';},
            // 不需要 plt=app 的参数，始终运行
            isApp: function() {
                return true;
            },
            readyStatus: function() {
                return this._ready;
            }
        };
        Ready.add(function(err) {
            if (!err) {
                externalProxy.ready();
            } else {
                externalProxy.loadFailed();
            }
        });
        // 回调类
        var Promise = function(callback, content) {
            this.cb = callback;
            this.content = content;
        };
        Promise.prototype.done = function() {
            this.cb.apply(this.content, arguments);
        };
        // 创建公共方法&回调 （只有非app使用）
        var webUiInterface = function() {
            var callback = new Callback();
            return {
                method: function(promise) {
                    promise.done();
                },
                callback: callback
            };
        };
        extend(module, {
            _webUiInterface: {},
            appProxy: externalProxy,
            whenApp: function(callback) {
                Ready.add(function(err) {
                    if (!err) {
                        callback();
                    }
                });
            },
            getInterface: function(name) {
                !this._webUiInterface[name] && (this._webUiInterface[name] = new webUiInterface());
                return this._webUiInterface[name];
            },
            // 运行功能
            exec: function(name) {
                var args = arguments;
                Ready.add(function(err) {
                    if (!err) {
                        module.appProxy.proxy(name, Array.prototype.slice.call(args, 1));
                    } else {
                        // 创建约定，在method执行以后完成约定。
                        var promise = new Promise(function() {
                            var cb = module.getInterface(name).callback;
                            cb.fire.apply(cb, arguments);
                        }, module);
                        module.getInterface(name).method(promise);
                    }
                });
            },
            // 定义功能创建方法（一个功能只有唯一方法）
            method: function(name, method) {
                Ready.add(function(err) {
                    if (err) {
                        module.getInterface(name).method = function(promise) {
                            if (!module.appProxy.isApp()) {
                                method(promise);
                            }
                        };
                    }
                });
            },
            // 定义功能回调（方法数组）
            callback: function(name, callback, content) {
                Ready.add(function(err) {
                    if (!err) {
                        global["__" + name] = function() {
                            callback.apply(content || global, arguments);
                        };
                    } else {
                        module.getInterface(name).callback.add(callback);
                    }
                });
            },
            removeCallback: function(name, callback) {
                Ready.add(function(err) {
                    if (!err) {
                        global["__" + name] = function() {};
                    } else {
                        module.getInterface(name).callback.remove(callback);
                    }
                });
            },
            emptyCallback: function(name) {
                Ready.add(function(err) {
                    if (!err) {
                        global["__" + name] = function() {};
                    } else {
                        module.getInterface(name).callback.empty(callback);
                    }
                });
            }
        });
        if (externalProxy.isApp()) {
            // console.log('wait external ready');
            var maxTimes = 500, times = 10, sid, done = false;
            var checkExternal = function() {
                //console.log('...');
                try {
                    if (external && external.userLogin) {
                        done = true;
                        Ready.fire(false);
                    }
                } catch (e) {}
                if ((times += 50) >= maxTimes) {
                    // console.log('external timeout');
                    done = true;
                    Ready.fire(true);
                }
                !done && (sid = setTimeout(function() {
                    checkExternal();
                }, times));
            };
            checkExternal();
        } else {
            Ready.fire(true);
        }
    })("object" === typeof module ? module.exports : this.LM = {}, this);
});

define("m/util/play", [ "jquery" ], function(require, exports) {
    var $ = require("jquery");
    var createVideo = function(cid) {
        var $playerIframe = $('<iframe style="width: 100%;height: 100%;position: fixed; top: 0;left: 0; z-index: 100;" id="player-iframe" src="http://pub.pptv.com/player/iframe/index.html#showList=0&id=' + cid + '&ctx=wmode%3Dopaque%26subject%3Dhznoad%26o%3Dhznoad" allowtransparency="true" width="100%" height="100%" scrolling="no" frameborder="0" ></iframe><div style="width: 60px;height: 50px; line-height: 50px;text-align:center;position: fixed; top: 0;right: 0; color: #fff;font-size:16px;z-index: 100;" id="close-iframe">关闭</div>');
        $playerIframe.appendTo("body");
        $("#close-iframe").on("click", function() {
            $("#player-iframe").add($(this)).remove();
        });
    };
    $(".video-item").click(function() {
        createVideo($(this).attr("videoid"));
        return false;
    });
});

define("m/util/share", [ "jquery", "m/util/mob", "m/util/cookie" ], function(require, exports) {
    var $ = require("jquery");
    var isInWeixin = !!navigator.userAgent.match(/MicroMessenger/g);
    var LM = require("m/util/mob");
    LM.appProxy.isApp = function() {
        return this._plt === "app";
    };
    LM.method("socialShare", function() {
        if (isInWeixin) {
            $("#weixin-share").fadeIn(100).click(function() {
                $(this).fadeOut();
            });
        } else {
            $(".module-msharebox").animate({
                bottom: 0
            });
        }
    });
    var cookie = require("m/util/cookie");
    if (cookie.get("PPName")) {
        var username = cookie.get("PPName").match(/.*\$/g)[0].slice(0, -1);
    } else {
        username = undefined;
    }
    var sPic = $("#s-pic").val(), sUrl = $("#s-url").val(), sTitle = $("#s-title").val();
    $(".share").click(function() {
        LM.exec("socialShare", JSON.stringify({
            shareText: sTitle,
            shareURL: sUrl,
            shareImageURL: sPic
        }));
    });
    LM.callback("socialShare", function() {
        if (location.href.match(/my_video/g)) {
            location.href = "http://520.pptv.com/app/space?username=" + username;
        }
    });
    $(".module-msharebox .cancel").click(function() {
        $(".module-msharebox").animate({
            bottom: "-164px"
        });
    });
    window._bd_share_config = {
        common: {
            bdSnsKey: {},
            bdText: sTitle,
            bdDesc: sTitle,
            bdMini: "1",
            bdUrl: sUrl,
            bdMiniList: false,
            bdPic: sPic,
            bdStyle: "2",
            bdSize: "32"
        },
        share: {},
        selectShare: {
            bdContainerClass: null,
            bdSelectMiniList: [ "tsina", "qzone", "sqq" ]
        }
    };
    with (document) 0[(getElementsByTagName("head")[0] || body).appendChild(createElement("script")).src = "http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion=" + ~(-new Date() / 36e5)];
    $(".bdsharebuttonbox").click(function() {
        if (location.href.match(/my_video/g)) {
            setTimeout(function() {
                location.href = "http://520.pptv.com/app/space?username=" + username;
            });
        }
    });
});

define("m/app/myvideo", [ "jquery", "../util/cookie", "../util/vote", "../util/get_jsonp", "../util/number", "../util/dataFormat", "../util/coupon", "../util/share", "../util/mob", "../util/common", "../util/login" ], function(require, exports) {
    var $ = require("jquery");
    var cookie = require("../util/cookie");
    require("../util/vote");
    // require('../util/share');
    var coupon = require("../util/coupon");
    require("../util/share");
    require("../util/common");
});

define("m/app/space", [ "jquery", "../util/cookie", "../util/vote", "../util/get_jsonp", "../util/number", "../util/dataFormat", "../util/coupon", "../util/share", "../util/mob", "../util/common", "../util/login", "../util/play" ], function(require, exports) {
    var $ = require("jquery");
    var cookie = require("../util/cookie");
    require("../util/vote");
    var coupon = require("../util/coupon");
    coupon($(".getsale"));
    require("../util/share");
    require("../util/common");
    $(".tab").click(function() {
        $(".tab").removeClass("cur");
        $(this).addClass("cur");
        var id = $(this).attr("_id");
        $(".module-mlist").hide();
        $("#" + id).show();
    });
    require("../util/play");
});
