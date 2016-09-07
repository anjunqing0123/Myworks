/*! 一唱成名 create by ErickSong */
/**
 * 个人中心修改信息
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/phone/personal/info", [ "core/zepto/zepto", "./../../../util/loader/loader", "core/jquery/1.8.3/jquery", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "./edit", "../../../util/log/alertBox", "./../../../util/log/alertBox" ], function(require, exports, module) {
    //需要重新验证正确性
    var $ = require("core/zepto/zepto"), loader = require("./../../../util/loader/loader"), edit = require("./edit"), alertBox = require("./../../../util/log/alertBox");
    var person = {};
    person.config = {
        personalSpace: "http://api.chang.pptv.com/api/personalSpace",
        //获取参赛者个人空间信息接口
        sign: "http://api.chang.pptv.com/api/sign",
        personalCenter: "http://api.chang.pptv.com/api/personalCenter",
        videolist: "http://chang.pptv.com/api/video_list",
        checksign: "http://api.chang.pptv.com/api/checksign",
        playerinfobycid: "http://api.chang.pptv.com/api/playerinfobycid",
        onlinescope: "http://api.chang.pptv.com/api/onlinescope"
    };
    /**
	 * [personalSpace 个人空间]
	 * @param  {[type]} data    [description]
	 * @param  {[type]} success [description]
	 * @param  {[type]} error   [description]
	 * @return {[type]}         [description]
	 */
    var update = function(data, success, error) {
        loader.load("http://api.chang.pptv.com/api/unpass_modify", data, success, error);
    };
    var success = function(data) {
        var msg = {
            "-1": "参数不能空",
            "-2": "不是组合",
            "-3": "用户未报名",
            "-4": "用户审核状态不符合要求",
            "-5": "系统正忙，请稍后再试",
            "1": "操作成功"
        };
        if (data.status) {
            alertBox({
                type: "mini",
                msg: msg[data.status]
            });
            if (data.status == 1) {
                window.location.reload();
            }
        } else {
            alertBox({
                type: "mini",
                msg: "操作成功" + "<br/>" + JSON.stringify(data)
            });
            window.location.reload();
        }
    };
    var error = function() {
        alertBox({
            type: "mini",
            msg: "系统异常"
        });
    };
    person.updateName = function(name, isGroup) {
        var data = {};
        !isGroup ? data.cname = name : data.group_name = name;
        update(data, success, error);
    };
    person.updatePic = function(url) {
        update({
            photo: url
        }, success, error);
    };
    person.edit = function(placeholder, validate) {
        return edit(placeholder, validate);
    };
    module.exports = person;
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
 * 个人中心弹出修改框
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/phone/personal/edit", [ "core/zepto/zepto", "util/log/alertBox", "core/jquery/1.8.3/jquery" ], function(require, exports, module) {
    var $ = require("core/zepto/zepto");
    alertBox = require("util/log/alertBox");
    var uuid = 0;
    var listener = {};
    listener.height = -1;
    listener.res = null;
    listener.fixedWatch = function(el) {
        if (listener.height == -1) listener.height = $("body").height();
        if (document.activeElement.nodeName == "INPUT") {
            el.css("position", "static");
        } else {
            el.css("position", "fixed");
            if (listener.res) {
                clearInterval(listener.res);
                listener.res = null;
            }
        }
    };
    listener.listen = function() {
        if (!listener.res) {
            listener.fixedWatch($(".mask .input_w"));
            listener.res = setInterval(function() {
                listener.fixedWatch($(".mask .input_w"));
            }, 500);
        }
    };
    listener.enableScroller = function(e) {
        e.preventDefault();
    };
    var edit = function() {
        var edit = function(placeholder, validate) {
            this.init(placeholder, validate);
        };
        var prop = edit.prototype;
        prop.init = function(placeholder, validate) {
            $("body").scrollTop(0);
            uuid++;
            this.id = "mask_" + uuid;
            var html = [ '<div class="mask" id="' + this.id + '">', '	<div class="input_w">', '		<input type="text" placeholder="' + placeholder + '"/>', '		<div class="error_v">', "			<span></span>", "		</div>", '		<div class="clear"></div>', ' 		<div class="sure">确定</div>', "	</div>", "</div>" ].join("");
            $("body").addClass("edit");
            $("body").append(html);
            this.bindClick();
            this.bindChange(validate);
            this.disableScroller();
        };
        prop.disableScroller = function() {
            document.addEventListener("touchmove", listener.enableScroller, false);
        };
        prop.enableScroller = function() {
            document.removeEventListener("touchmove", listener.enableScroller, false);
        };
        prop.bindClick = function() {
            var self = this;
            $("#" + this.id).find(".input_w .clear").click(function() {
                $("#" + self.id).find("input").val("");
                self.error("");
                $("#" + self.id).find("input").focus();
            });
        };
        prop.error = function(msg) {
            $("#" + this.id).find(".error_v span").text(msg);
        };
        prop.bindChange = function(validate) {
            var self = this;
            self.input = $("#" + this.id).find("input");
            $("#" + this.id).find("input").keyup(function(e) {
                var keycode = e.which;
                if (keycode == 13) {
                    var value = self.trim($(this).val());
                    $(this).val(value);
                    var val = validate.call(self, value);
                    if (val) self.remove();
                }
            });
            $("#" + this.id).find(".sure").click(function(e) {
                var value = self.trim($(self.input).val());
                $(self.input).val(value);
                var val = validate.call(self, value);
                if (val) self.remove();
            });
            $("#" + this.id).find(".input_w").click(function(e) {
                $(self.input).focus();
                e.preventDefault();
                return false;
            });
            $("#" + this.id).click(function() {
                self.remove();
            });
            $("#" + this.id).find("input").focus(function() {
                listener.listen();
            });
        };
        prop.remove = function() {
            $("#" + this.id).remove();
            this.enableScroller();
            $("body").removeClass("edit");
        };
        prop.trim = function(str) {
            return $.trim(str);
        };
        return edit;
    }();
    module.exports = function(placeholder, validate) {
        return new edit(placeholder, validate);
    };
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
