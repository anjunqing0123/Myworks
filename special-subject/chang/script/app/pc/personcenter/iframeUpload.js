/*! 一唱成名 create by ErickSong */
define("app/pc/personcenter/iframeUpload", [ "core/jquery/1.8.3/jquery", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery" ], function(require, exports) {
    //设置domain
    document.domain = "pptv.com";
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("../../../util/loader/loader");
    var avatarReg = /\.((jpg)|(jpeg)|(gif)|(png))/i;
    //此处使用一个map接收回调，暂时没想到好的办法不用全局变量
    window.imageCallbackList = window.imageCallbackList || {};
    function uuid() {
        var count = 0;
        return function(prefix) {
            return prefix + "_" + count++;
        };
    }
    //ie6 bug fix
    var IE6 = !window.XMLHttpRequest;
    var isOnload = false;
    var isServerOnload = false;
    function imgCallback(data) {
        isServerOnload = false;
        if (data.err == 0) {
            var tempImg = new Image();
            var tempW = this.imgField.width();
            var tempH = this.imgField.height();
            //img.src=data.data+'?size=cp'+tempW+'x'+tempH;
            //加随机数，不然ie6有缓存
            tempImg.src = data.data + "?" + Math.random();
            var self = this;
            tempImg.onload = function() {
                //console.log(arguments);
                if (!isServerOnload) {
                    isServerOnload = true;
                    var origW = tempImg.width;
                    var origH = tempImg.height;
                    if (origW < 400) {
                        self.request("errorSize", "你传的照片宽度必须大于400像素！", self.fakeBtn);
                    } else if (origH < 400) {
                        self.request("errorSize", "你传的照片高度必须大于400像素！", self.fakeBtn);
                    } else {
                        tempImg.width = tempW;
                        tempImg.height = tempH;
                        self.imgField.html($(tempImg));
                        unbindAction.call(self);
                        self.valueMap[self.reservedSrc] = data.data;
                        self.request("afterUpload", data.data, self.fakeBtn);
                    }
                }
            };
        }
    }
    //锁定imageIframe，图片提交的时候会动态改变form的action，这个时候是不让提交的
    function lock() {
        privateInProgress = true;
    }
    //解锁imageIframe
    function unlock() {
        privateInProgress = false;
    }
    function unbindAction() {
        unlock.call(this);
        this.container[0].action = this.origAction;
        this.container.removeAttr("target");
    }
    function CheckSize(img, src, files) {
        var bytes = img.fileSize || files[0].size || files[0].fileSize;
        bytes = bytes == -1 ? this.opt.MIN_SIZE : bytes;
        if (bytes > this.opt.MAX_SIZE) {
            this.request("errorSize", "你传的照片超过最大尺寸啦！", this.fakeBtn);
            return false;
        } else if (bytes < this.opt.MIN_SIZE) {
            this.request("errorSize", "你传的照片太小啦！", this.fakeBtn);
            return false;
        }
        if (this.iframe == null) {
            this.createIframe.call(this);
        }
        this.request("inProgress");
        this.fakeBtn.addClass("btn-disabled").find("span").text("上传中");
        this.upload.call(this);
    }
    function iframeUpload(options) {
        var defaults = {
            MIN_SIZE: 10 * 1024,
            MAX_SIZE: 2 * 1024 * 1024,
            container: "#person-info",
            fileBtn: ".input-file-main",
            fakeBtn: ".input-file",
            iframeName: "PicUploadIFR3",
            tokenUrl: "http://api.chang.pptv.com/api/phototoken",
            uploadUrl: "http://api.grocery.pptv.com/upload_file.php",
            imgField: ".previewBox-image",
            btnDisable: "btn-disabled"
        };
        var privateInProgress = false;
        this.opt = $.extend({}, options, defaults);
        this.container = $(this.opt.container);
        this.fileBtn = this.container.find(this.opt.fileBtn);
        this.iframe = null;
        this.imgField = this.container.find(this.opt.imgField);
        this.uploadId = iframeUpload.uuid(this.opt.iframeName);
        imageCallbackList[this.uploadId] = this;
        this.origAction = this.container[0].action;
        this.callback = imgCallback;
        this.fakeBtn = this.container.find(this.opt.fakeBtn);
        this.valueMap = {};
        this.token = null;
        this.buildAction = function(token) {
            return this.opt.uploadUrl + "?app=lpic&tk=" + token + "&prod=yccm_pic&tag=script&cb=parent." + 'imageCallbackList["' + this.uploadId + '"].callback';
        };
        this.islock = function() {
            return !!privateInProgress;
        };
        var self = this;
        this.container.on("change", this.opt.fileBtn, function(evt) {
            var src = this.value;
            var files = this.files || evt.target && evt.target.files || evt.dataTransfer && evt.dataTransfer.files;
            if (!files) {
                this.select();
                this.blur();
                try {
                    src = document.selection.createRange().text;
                } catch (e) {
                    src = document.selection.createRangeCollection()[0].text;
                }
            }
            var type = src.substr(src.lastIndexOf("."));
            if (!avatarReg.test(type)) {
                // need show error;
                self.request("errorType", "", self.fakeBtn);
                return false;
            }
            self.reservedSrc = src;
            if (!!self.valueMap && !!self.valueMap[src]) {
                self.request("afterUpload", self.valueMap[src], self.fakeBtn);
            } else {
                var img = new Image();
                if (!files || !files[0]) {
                    isOnload = false;
                    img.onload = function() {
                        if (!isOnload && !!IE6) {
                            isOnload = true;
                            CheckSize.call(self, img, src, files);
                        } else if (!IE6) {
                            CheckSize.call(self, img, src, files);
                        }
                    };
                    //img.onreadystatechanged = function () { console.log('---changed'); };
                    img.src = src;
                    //img.dynsrc = src;
                    setTimeout(function() {
                        CheckSize.call(self, img, src, files);
                    }, 100);
                } else {
                    CheckSize.call(self, img, src, files);
                }
            }
        });
    }
    iframeUpload.uuid = uuid();
    $.extend(iframeUpload.prototype, {
        //构造隐藏iframe
        createIframe: function() {
            var iframe;
            try {
                // IE6, IE7
                iframe = document.createElement('<iframe name="' + this.opt.iframeName + '">');
            } catch (e) {
                iframe = document.createElement("iframe");
                iframe.name = this.opt.iframeName;
            }
            iframe.style.display = "none";
            document.body.appendChild(iframe);
            this.iframe = iframe;
        },
        upload: function() {
            if (this.token == null) {
                var self = this;
                loader.load(self.opt.tokenUrl, {}, function(data) {
                    if (data.status == 0) {
                        self.request("error", "login", self.fakeBtn);
                    } else if (data.err == 0) {
                        //锁定不让提交，因为image需要处理
                        lock.call(self);
                        var token = self.token = data.data;
                        var queryStr = self.buildAction.call(self, token);
                        self.container[0].action = queryStr;
                        self.container[0].target = self.opt.iframeName;
                        self.container.submit();
                    }
                }, function() {
                    self.request("error", "upload", self.fakeBtn);
                });
            } else {
                //锁定不让提交，因为image需要处理
                var self = this;
                lock.call(self);
                var queryStr = self.buildAction.call(self, self.token);
                self.container[0].action = queryStr;
                self.container[0].target = self.opt.iframeName;
                self.container.submit();
            }
        },
        request: function(type) {
            if (typeof this.opt[type] == "function") {
                this.opt[type].apply(this, arguments);
            }
        }
    });
    return iframeUpload;
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
