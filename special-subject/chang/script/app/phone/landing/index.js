/*! 一唱成名 create by ErickSong */
/**
 * landing page.
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/phone/landing/index", [ "core/zepto/zepto", "../../../util/ppsdk/sdkUtil", "core/jquery/1.8.3/jquery", "../../../util/log/alertBox", "../../../util/cookie/cookie", "../../../util/login/login", "../../../util/user/user", "client", "../../../util/browser/browser" ], function(require, exports, module) {
    var $ = require("core/zepto/zepto"), sdk = require("../../../util/ppsdk/sdkUtil"), cookie = require("../../../util/cookie/cookie"), login = require("../../../util/login/login"), browser = require("../../../util/browser/browser");
    var isMobile = browser.MOBILE;
    $(".update_apply").on("touchstart", function() {
        //活动报名结束
        if ($(this).hasClass("disable")) {
            return;
        } else if (cookie.get("PPName")) {
            go();
        } else {
            userLogin(go);
        }
        return false;
    });
    var userLogin = function(callback) {
        sdk("login", {
            autologin: false,
            success: function(s) {
                for (var i in s) {
                    if (typeof s[i] === "string") {
                        cookie.set(i, s[i], 7, "pptv.com", "/");
                        if (i === "token") {
                            cookie.set("ppToken", decodeURIComponent(s[i]), 7, "pptv.com", "/");
                        }
                    }
                }
                callback();
            },
            error: function(code, msg) {
                alert("对不起，出错了！" + msg);
            }
        });
    };
    function go() {
        $.ajax({
            url: "http://api.chang.pptv.com/api/checksign",
            dataType: "jsonp",
            jsonp: "cb",
            success: function(data) {
                var urlEnroll = "http://chang.pptv.com/app/enroll/?type=app";
                var urlHome = "http://space.chang.pptv.com/?type=app";
                if (!!navigator.userAgent.match(/iPad/)) {
                    urlEnroll = "http://chang.pptv.com/ipad/enroll";
                    urlHome = "http://chang.pptv.com/ipad/space";
                }
                if (isMobile) {
                    urlEnroll = "app://iph.pptv.com/v4/activity/web?activity=singtofame&url=" + encodeURIComponent(urlEnroll);
                    urlHome = "app://iph.pptv.com/v4/activity/web?activity=singtofame&url=" + encodeURIComponent(urlHome);
                    if (data.status === "0") {
                        userLogin(go);
                    } else if (data.status === "1") {
                        sdk("openNativePage", {
                            pageUrl: urlEnroll,
                            success: function() {},
                            error: function(code, msg) {}
                        });
                    } else {
                        sdk("openNativePage", {
                            pageUrl: urlHome,
                            success: function() {},
                            error: function(code, msg) {}
                        });
                    }
                } else {
                    if (data.status === "0") {
                        login.init({
                            type: "login"
                        });
                    } else if (data.status === "1") {
                        window.location.href = urlEnroll;
                    } else {
                        window.location.href = urlHome;
                    }
                }
            }
        });
    }
});

/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("util/ppsdk/sdkUtil", [ "core/jquery/1.8.3/jquery", "util/log/alertBox" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery"), alertBox = require("util/log/alertBox");
    ppsdk.config({
        api: [],
        //本页面用到的js接口列表(暂时不支持)
        signature: "",
        //签名，暂时可不填
        debug: true
    });
    /**
     * [obj description]
     * opt{
     *     ...:{},
     *     success:function(rspData){
     *
     *     },
     *     error:function(errCode, msg){
     *
     *     },
     *     cancel:function(){
     *
     *     }
     * }
     **/
    var T = {};
    var p = function(funcName, opt) {
        if (T[funcName] && +new Date() - T[funcName] < 500) {
            alertBox({
                type: "mini",
                msg: "频繁调用接口" + funcName + "，请稍后再试~"
            });
            return;
        }
        if (!ppsdk) {
            alertBox({
                type: "mini",
                msg: "页面加载错误，请刷新后再试~"
            });
            return;
        }
        if (!p.readyStatus) {
            alertBox({
                type: "mini",
                msg: "页面加载未完成，请稍后再试~"
            });
            return;
        }
        if (funcName == "customizeBtn") {
            opt = $.extend({}, p.btnOpt, opt);
        }
        try {
            if (ppsdk[funcName]) {
                ppsdk[funcName](opt);
                T[funcName] = +new Date();
            }
        } catch (e) {
            console.info("call of ppsdk func name=" + funcName + " run into error");
            console.info(e);
        }
    };
    p.readyStatus = false;
    p.readyList = [];
    p.ready = function(func) {
        if (p.readyStatus) {
            func();
        } else {
            p.readyList.push(func);
        }
    };
    //初始化留言板
    ppsdk.ready(function() {
        p.readyStatus = true;
        if (!p.readyList) {
            return false;
        }
        for (var i = 0; i < p.readyList.length; i++) {
            p.readyList[i]();
            console.info(i);
        }
        delete p.readyList;
    });
    p.btnOpt = {
        id: "1001",
        //标识按钮
        behavior: 0,
        //按钮行为，创建删除等
        type: 1,
        //按钮类型，创建更新时用
        pattern: {
            //按钮样式
            position: {
                x: 0,
                y: 0
            },
            size: {
                width: 0,
                height: 0
            },
            normal: {
                text: "",
                textColor: "",
                fontSize: 10,
                boarderColor: "xxxxxx",
                boarderSize: "",
                img: "",
                bgImg: ""
            },
            highLight: {
                text: "",
                textColor: "#000",
                fontSize: 10,
                boarderColor: "#fff",
                boarderSize: "",
                img: "",
                bgImg: ""
            }
        },
        clickFunc: "",
        //点击事件的函数
        params: "",
        //本地处理的参数
        success: function(rspData) {},
        error: function(errCode, msg) {
            alert("不合法1");
            alertBox({
                type: "mini",
                msg: errCode + msg
            });
        },
        cancel: function() {
            alert("不合法12");
            alertBox({
                type: "mini",
                msg: "cancel_share"
            });
        }
    };
    module.exports = p;
});

/**
 * [AlertBox 弹框]
 * @param {[type]} type  弹框类型 doubleBtn/onceCancel/onceConfirm/mini
 * @param {[type]} alertType  弹框固定fixed /''滚动样式类型
 * @param {[type]} alertCls  弹框class 可继承修改样式
 * @param {[type]} title 弹框标题
 * @param {[type]} msg 弹框内容
 * @param {[type]} cancelText 取消按钮文本
 * @param {[type]} confirmText 确认按钮文本
 * @param {[type]} cancel 取消按钮回调事件
 * @param {[type]} confirm 确认按钮回调事件
 * @param {[type]} callback 弹框回调事件
 * @return {[Function]}    [AlertBox({type:'doubleBtn',title:'温馨提示',...})]
 */
define("util/log/alertBox", [ "core/jquery/1.8.3/jquery" ], function(require, exports, module) {
    var w = window, d = document, $ = require("core/jquery/1.8.3/jquery");
    "use strict";
    var _uuid = 0;
    function AlertBox(opts) {
        if (!(this instanceof AlertBox)) {
            return new AlertBox(opts).init();
        }
        this.opts = opts || {};
        this.uuid = _uuid;
        this.type = this.opts.type || "doubleBtn";
        this.alertType = this.opts.alertType || "";
        this.alertCls = this.opts.alertCls || "";
        this.title = this.opts.title || "";
        this.msg = this.opts.msg || "";
        this.cancelText = this.opts.cancelText || "取消";
        this.confirmText = this.opts.confirmText || "确定";
        this.cancel = this.opts.cancel || "";
        this.confirm = this.opts.confirm || "";
        this.callback = this.opts.callback || "";
        this.delay = this.opts.delay || 2e3;
    }
    AlertBox.prototype = {
        constructor: AlertBox,
        getEl: function(supEl, el) {
            return supEl.querySelector(el);
        },
        init: function() {
            var self = this;
            _uuid++;
            self.setStyle();
            self.addAlertBox();
            self.type == "mini" ? self.minEvent() : self.alertEvent();
        },
        addAlertBox: function() {
            var self = this, pos = self.getPos();
            self.alertType == "fixed" ? self.getFixedMask() : self.getMask();
            self.alertType == "fixed" ? self.getEl(d, "#alertMask_" + self.uuid).insertAdjacentHTML("beforeend", self.getHtml()) : self.getEl(d, "body").insertAdjacentHTML("beforeend", self.getHtml());
            self.alertBox = self.getEl(d, "#alertBox_" + self.uuid);
            if (self.alertType == "fixed") {
                self.alertBox.style.cssText = "width:" + parseInt(pos.width - 2 * 25) + "px;left:25px;top:50%;-webkit-transform:translate3d(0,-50%,0);";
            } else {
                self.alertBox.style.cssText = "width:" + parseInt(pos.width - 2 * 25) + "px;left:25px;top:" + parseInt(pos.sTop + w.innerHeight / 2 - self.alertBox.offsetHeight / 2) + "px;";
            }
            self.callback && typeof self.callback == "function" && self.type != "mini" && self.callback();
        },
        setStyle: function() {
            var self = this, style = d.createElement("style"), cssStr = ".alert-box{position:absolute;left:0;top:0;border-radius:0.2rem;background:#FFF;-webkit-box-sizing:border-box;z-index:200;font-size:0.6rem;}" + ".alert-msg{padding:0.4rem 0.6rem 0.6rem;text-align:center;line-height:1.8;word-break:break-all;font-size:.4rem;}" + ".alert-title{padding:0.6rem 0.6rem 0;text-align:center;}" + ".alert-btn{display:-webkit-flex !important;display:-webkit-box;border-top:1px solid #DCDCDC;}" + ".alert-btn a{display:block;-webkit-flex:1 !important;-webkit-box-flex:1;height:1.68rem;line-height:1.68rem;text-align:center;}" + ".alert-btn a.alert-confirm{border-left:1px solid #DCDCDC;color:#EDA200;}" + ".alert-btn a.alert-confirm.single{border-left:none;}" + ".alert-mini-box{border-radius:0.2rem;background:rgba(0,0,0,.7);color:#fff;}";
            style.type = "text/css";
            style.innerText = cssStr;
            self.getEl(d, "head").appendChild(style);
        },
        getPos: function() {
            var wn = d.documentElement.offsetWidth || d.body.offsetWidth, h = d.documentElement.offsetHeight || d.body.offsetHeight, s = d.documentElement.scrollTop || d.body.scrollTop;
            if (w.innerHeight > h) {
                h = w.innerHeight;
            }
            return {
                width: wn,
                height: h,
                sTop: s
            };
        },
        getHtml: function() {
            var self = this, html = "";
            if (self.type != "mini") {
                html += '<div class="alert-box ' + self.alertCls + '" id="alertBox_' + self.uuid + '">' + '<div class="alert-title">' + self.title + "</div>" + '<div class="alert-msg">' + self.msg + "</div>" + '<div class="alert-btn">';
                switch (self.type) {
                  case "doubleBtn":
                    html += '<a href="javascript:;" class="alert-cancel mr10">' + self.cancelText + "</a>" + '<a href="javascript:;" class="alert-confirm">' + self.confirmText + "</a>";
                    break;

                  case "onceCancel":
                    html += '<a href="javascript:;" class="alert-cancel">' + self.cancelText + "</a>";
                    break;

                  case "onceConfirm":
                    html += '<a href="javascript:;" class="alert-confirm single">' + self.confirmText + "</a>";
                    break;
                }
                html += "</div></div>";
            } else {
                html += '<div class="alert-box alert-mini-box ' + self.alertCls + '"  id="alertBox_' + self.uuid + '"><div class="alert-msg">' + self.msg + "</div></div>";
            }
            return html;
        },
        getMask: function() {
            var self = this, pos = self.getPos(), mask = d.createElement("div");
            mask.id = "alertMask_" + self.uuid;
            self.getEl(d, "body").appendChild(mask);
            mask.style.cssText = "position:absolute;left:0;top:0;width:" + pos.width + "px;height:" + pos.height + "px;background:rgba(0,0,0,0.3);z-index:99";
            self.type == "mini" && (mask.style.backgroundColor = "rgba(255, 255, 255, 0)");
        },
        getFixedMask: function() {
            var self = this, mask = d.createElement("div");
            mask.id = "alertMask_" + self.uuid;
            self.getEl(d, "body").appendChild(mask);
            mask.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,.3);z-index:99;";
        },
        minEvent: function() {
            var self = this;
            setTimeout(function() {
                if (navigator.userAgent.match(/iPhone/i)) {
                    $(self.alertBox).fadeOut(500, function() {
                        self.getEl(d, "body").removeChild(self.alertBox);
                        self.callback && typeof self.callback == "function" && self.callback();
                    });
                } else {
                    self.remove(self.alertBox);
                    self.callback && typeof self.callback == "function" && self.callback();
                }
                self.remove(self.getEl(d, "#alertMask_" + self.uuid));
            }, self.delay);
        },
        alertEvent: function() {
            var self = this;
            if (self.alertBox) {
                var cancelBtn = self.getEl(self.alertBox, ".alert-cancel"), confirmBtn = self.getEl(self.alertBox, ".alert-confirm");
                cancelBtn && self.reset(cancelBtn, self.cancel);
                confirmBtn && self.reset(confirmBtn, self.confirm);
            }
        },
        reset: function(el, type) {
            var self = this;
            el.onclick = function() {
                type && typeof type == "function" && type(this);
                self.alertType != "fixed" && self.remove(self.alertBox);
                self.remove(self.getEl(d, "#alertMask_" + self.uuid));
            };
        },
        remove: function(el) {
            this.getEl(d, "body").removeChild(el);
        }
    };
    return AlertBox;
    module.exports = function(opts) {
        return AlertBox(opts);
    };
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
