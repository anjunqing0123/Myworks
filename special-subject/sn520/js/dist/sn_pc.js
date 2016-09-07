define("pc/app/activity", [ "jquery", "underscore", "util/user", "login", "./../util/json", "./../util/cookie", "./../util/os" ], function(require, module, exports) {
    var $ = require("jquery"), _ = require("underscore"), user = require("util/user"), login = require("login"), JSON = require("./../util/json"), cookie = require("./../util/cookie"), os = require("./../util/os");
    var $joinBtn = $(".topnav .join,.j-snupload a"), $goTop = $(".gotop"), $sharebox = $(".sharebox"), $getSale = $(".getsale"), $myVideo = $("#sn-myvideo"), $couponsSide = $("#sn-coupons-side"), $pageQrcode = $("#sn-qrcode");
    var loginInfo = $.parseJSON(cookie.get("pageclick"));
    var redirectFunc = function() {
        if (loginInfo) {
            if (!loginInfo.isLogined && loginInfo.links != "") {
                cookie.set("pageclick", "", 30, "pptv.com", "/");
                window.location.replace(loginInfo.links);
            }
        }
    };
    user.isLogined ? redirectFunc() : $.noop();
    (function() {
        //  我的视频按钮、我的视频页
        var nowUrl = window.location.href, baseHomeUrl = "http://520.pptv.com/pc/home", isMyVideo = nowUrl.indexOf("520i.pptv.com/pc/my_video") > 0, isClient = nowUrl.indexOf("plt=clt") > 0, realHomeUrl = isClient ? baseHomeUrl + "?plt=clt" : baseHomeUrl, timeDate = nowUrl.indexOf("?") > 0 ? isClient ? "&" + +new Date() : "?" + +new Date() : "?" + +new Date();
        if (isMyVideo) {
            if (!user.isLogined) {
                location.replace(realHomeUrl);
            }
        }
        $myVideo.on("click", function(e) {
            var myLink = $myVideo.attr("data-href");
            var myLink_app = "http://520i.pptv.com/app/my_video";
            !user.isLogined ? cookie.set("pageclick", JSON.stringify({
                isLogined: user.isLogined,
                links: myLink
            }), 30, "pptv.com", "/") : $.noop();
            if (!user.isLogined) {
                login.init();
            } else {
                if (os.isPc) {
                    $myVideo.attr({
                        href: myLink + timeDate
                    });
                } else {
                    $myVideo.attr({
                        href: myLink_app + timeDate
                    });
                }
            }
        });
    })();
    //  加入按钮
    $joinBtn.click(function() {
        var joinLink = $joinBtn.attr("data-href");
        !user.isLogined ? cookie.set("pageclick", JSON.stringify({
            isLogined: user.isLogined,
            links: joinLink
        }), 30, "pptv.com", "/") : $.noop();
        if (!user.isLogined) {
            login.init();
        } else {
            $joinBtn.attr({
                href: joinLink
            });
        }
    });
    $(".module-page").find("input[type=text]").on("keydown", function(e) {
        if (e.keyCode == 13) {
            $(".module-page").find("input[type=submit]").trigger("submit");
        }
    });
    (function() {
        //  priceUrl pc and h5
        $getSale.on("click", function(e) {
            e.preventDefault();
            if (!cookie.get("sn_right")) {
                $couponsSide.fadeIn();
                return;
            }
            os.isPc ? $pageQrcode.show() : window.location.href = "http://sale.suning.com/syb/520dijiakuanghuan/index.html";
        });
        //  share
        var tpl = [ '<a target="_blank" href="http://v.t.sina.com.cn/share/share.php?url=<%= encodeURIComponent(data.url) %>&title=<%= data.title %>&pic=<%= data.pic %>&source=<%= encodeURIComponent(\'PPLive网络电视\') %>&sourceUrl=http://www.pptv.com&content=utf-8&appkey=3114134302&searchPic=false" class="wb"></a>', '<a target="_blank" href="http://v.t.qq.com/share/share.php?url=<%= encodeURIComponent(data.url) %>&title=<%= data.title %>&pic=<%= data.pic %>&site=http://www.pptv.com&appkey=801088622" class="tx"></a>', '<a target="_blank" href="http://connect.qq.com/widget/shareqq/index.html?&url=<%= data.url %>&title=<%= data.title %>&desc=<%= data.description %>&pics=<%= data.pic %>" class="rr"></a>', '<a target="_blank" href="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=<%= encodeURIComponent(data.url) %>&title=<%= data.title %>&pics=<%= data.pic %>" class="qzone"></a>' ].join("");
        if (window.location.href.indexOf("upload") > 0) {
            $(".sharebtn").remove();
        } else {
            $sharebox.html(_.template(tpl, {
                data: window.sn520ShareData
            }));
        }
        //  gotop
        $goTop.on("click", function(e) {
            e.preventDefault();
            $("html,body").animate({
                scrollTop: "0px"
            }, 300);
        });
    })();
    $(".close").on("click", function(e) {
        $(this).parent(".module-pop").hide();
        if ($(this).parent(".module-pop").attr("id") == "sn-coupons-middle") {
            $getSale.addClass("bound-pirce");
            setTimeout(function() {
                $getSale.removeClass("bound-pirce");
            }, 5e3);
        }
    });
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
define("pc/util/json", [], function() {
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
 *cookie操作封装
 *mirongxu
 */
define("pc/util/cookie", [], function(require) {
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

/*
 * @author  Zhan Wang
 * @date    2016/5/7 14:51
 * @email   ijingzhan@gmail.com
 * @info    
 *
 */
define("pc/util/os", [], function(require) {
    var ua = navigator.userAgent, isWindowsPhone = /(?:Windows Phone)/gi.test(ua), isSymbian = /(?:SymbianOS)/gi.test(ua) || isWindowsPhone, isAndroid = /(?:Android)/gi.test(ua), isFireFox = /(?:Firefox)/gi.test(ua), isChrome = /(?:Chrome|CriOS)/gi.test(ua), isTablet = /(?:iPad|PlayBook)/gi.test(ua) || isAndroid && !/(?:Mobile)/gi.test(ua) || isFireFox && /(?:Tablet)/gi.test(ua), isPhone = /(?:iPhone)/gi.test(ua) && !isTablet, isiPad = /iPad/gi.test(ua), isPc = !isPhone && !isAndroid && !isSymbian && !isTablet && !isWindowsPhone;
    return {
        isTablet: isTablet,
        isPhone: isPhone,
        isAndroid: isAndroid,
        isPc: isPc,
        isiPad: isiPad
    };
});

/*
 * @author  Zhan Wang
 * @date    2016/5/7 14:38
 * @email   ijingzhan@gmail.com
 * @info    
 *
 */
define("pc/app/dataConfig", [], function(require) {
    return;
    var priceurl = {
        pcPriceUrl: "http://www.pptv.com",
        h5PriceUrl: "http://m.pptv.com"
    };
});

/*
 * @author  Zhan Wang
 * @date    2016/5/5 14:08
 * @email   ijingzhan@gmail.com
 * @info    
 *
 */
define("pc/app/index", [ "./activity", "jquery", "underscore", "util/user", "login", "../util/json", "../util/cookie", "../util/os", "./upload", "../util/VideoUploader", "../util/ppVideoUpload", "http://static9.pplive.cn/chang/v_20151211162917/js/util/loader/loader", "../util/placeholder", "./presonal", "./../util/vote", "../util/get_jsonp", "../util/number", "../util/dataFormat" ], function(require) {
    require("./activity");
    require("./upload");
    require("./presonal");
    require("./../util/vote");
});

/*
 * @author  Zhan Wang
 * @date    2016/5/5 14:10
 * @email   ijingzhan@gmail.com
 * @info    520上传逻辑
 *
 */
define("pc/app/upload", [ "jquery", "pc/util/cookie", "pc/util/VideoUploader", "pc/util/ppVideoUpload", "util/user", "login", "http://static9.pplive.cn/chang/v_20151211162917/js/util/loader/loader", "pc/util/placeholder" ], function(require, module, exports) {
    var $ = require("jquery"), cookie = require("pc/util/cookie"), VideoUploader = require("pc/util/VideoUploader"), login = require("login"), Loader = require("http://static9.pplive.cn/chang/v_20151211162917/js/util/loader/loader.js");
    require("pc/util/placeholder")($);
    var errCode = {
        "0": "未登录",
        "-1": "赛区id非法",
        "-2": "uploadid不存在",
        "-3": "时长超出限制",
        "-4": "保存失败",
        "-5": "title为空",
        "-6": "用户不能上传视频超过30个",
        "-7": "用户未报名",
        "-8": "视频大小限制",
        "1": "成功"
    };
    var loadingBarWidth = 380;
    var $form = $("#videoUploadForm");
    var $fileInput = $("#fileInput");
    var $submitBtn = $("#submitBtn");
    var $nameInput = $("#nameInput");
    var $textInput = $form.find(".video_list .textInput");
    var $loading = $("#loading-grid");
    var $loadingbar = $loading.find(".loadingbar div");
    var $loadingper = $loading.find(".loadingper");
    var $cancelbtn = $loading.find(".cancel-btn");
    var _file = null;
    var _songName = "";
    var $getsale = $(".getsale");
    $nameInput.placeholder({
        customClass: "my-placeholder"
    });
    $textInput.placeholder({
        customClass: "my-placeholder"
    });
    var vUploader = new VideoUploader({
        fileInput: "fileInput",
        offset: {
            w: 68,
            h: 37,
            x: 0,
            y: 0
        },
        //插件的位置，对低版本浏览器，会创建一个flash插件，覆盖在input上
        onMetaInfo: function(data) {
            //flash选择文件以后，会返回文件相关信息
            $textInput.val(data.fileName);
            $textInput.removeClass("err");
        },
        onFail: function(data) {
            var errText = data.message;
            $form.find(".video_list .err_tip").html(errText).show();
            $textInput.addClass("err");
        },
        onStart: function(data) {
            $fileInput.parent().siblings(".textInput").removeClass("err").siblings(".err_tip").hide();
            $("body").append('<div id="winbg" class="down snopc"></div>');
            $loadingbar.width(0);
            $loadingper.html("0%");
            $form.find(".success").hide();
            $loading.show();
        },
        onFinish: function(data) {
            var self = this;
            //必需隔一段时间调用commit；直接finish之后调用commit，flash选择下一个文件时会出错
            setTimeout(function() {
                self.completed(_songName);
            }, 100);
        },
        onCommit: function(data) {
            if (!this.isHTML5) {
                $textInput.val("");
            }
            Loader.load("http://api.suning520.pptv.com/api/cimmit_video/1/" + data.fileId, {
                title: "把爱说出口-" + $nameInput.val(),
                isflash: window.File && window.FormData ? 0 : 1
            }, function(d) {
                $loading.hide();
                $("#winbg").remove();
                if (d && d.status) {
                    if (d.status === "1") {
                        $form.find(".success").show();
                        cookie.set("sn_right", 1, 30, "pptv.com", "/");
                        $getsale.addClass("bound-pirce");
                        setTimeout(function() {
                            $getsale.removeClass("bound-pirce");
                        }, 5e3);
                    } else {
                        alert(errCode[d.status]);
                    }
                } else {
                    alert("上传失败，请刷新页面");
                }
            }, function() {
                $("#winbg").remove();
                $loading.hide();
                alert("上传失败，请刷新页面");
            });
        },
        onUpdate: function(total, loaded) {
            var percent = parseInt(loaded * 100 / total);
            $loadingper.html(percent + "%");
            $loadingbar.width(percent / 100 * loadingBarWidth);
        }
    });
    function checkName() {
        if ($nameInput.val().length <= 0) {
            $form.find(".name_list .err_tip").html("请填写参赛作品名称,不超过20个字").show();
            $nameInput.addClass("err");
        } else {
            $form.find(".name_list .err_tip").html("请填写参赛作品名称,不超过20个字").hide();
            $nameInput.removeClass("err");
        }
    }
    $fileInput.on("change", function() {
        if (this.files) {
            _file = this.files.length === 0 ? null : this.files[0];
        }
        $textInput.val($fileInput.val());
        $textInput.siblings(".err_tip").hide();
        $textInput.removeClass("err");
    });
    $nameInput.on("focus", function() {
        checkName();
    }).on("blur", function() {
        setTimeout(function() {
            checkName();
        }, 200);
    }).on("keydown", function() {
        setTimeout(function() {
            checkName();
        }, 200);
    });
    $submitBtn.on("click", function(ev) {
        ev.preventDefault();
        if (!login.isLogined()) {
            login.init();
            return;
        }
        if ($nameInput.val().length <= 0) {
            checkName();
            return;
        }
        _songName = $nameInput.val();
        vUploader.upload(_file);
    });
    $cancelbtn.on("click", function() {
        vUploader.cancel();
        $loading.fadeOut();
        $("#winbg").remove();
    });
    window.onerror = function(msg, url, l) {
        $textInput.val("");
        $form.find(".video_list .err_tip").html(errCode[1]).show();
    };
});

/*
* @Author: WhiteWang
* @Date:   2015-08-13 15:16:44
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-10 17:46:01
*/
define("pc/util/VideoUploader", [ "jquery", "pc/util/ppVideoUpload", "util/user" ], function(require, exports, module) {
    var $ = require("jquery");
    var PPUploader = require("pc/util/ppVideoUpload");
    var user = require("util/user");
    var userName = user.info.UserName;
    var ppToken = user.info.token;
    var isHTML5 = false;
    if (window.File && window.FormData) {
        isHTML5 = true;
    }
    function VideoUploader(option) {
        var opt = $.extend({
            fileInput: "myFile",
            offset: {
                w: 0,
                h: 0,
                x: 0,
                y: 0
            },
            cp: "UGC",
            onMetaInfo: function() {},
            onCommit: function() {},
            onFinish: function() {},
            onFail: function() {},
            onUpdate: function() {},
            onStart: function() {}
        }, option || {});
        var error = {
            1: {
                errCode: 1,
                message: "请导入正确的文件"
            },
            2: {
                errCode: 2,
                message: "您选择的视频格式错误"
            },
            3: {
                errCode: 3,
                message: "您选择的视频尺寸太小，请重新选择！"
            },
            4: {
                errCode: 4,
                message: "文件大小超出（200M）无法上传！"
            },
            5: {
                errCode: 5,
                message: "未登录"
            },
            6: {
                errCode: 6,
                message: "上传网络出错，请刷新重试！"
            }
        };
        var _fileId = null;
        var _fileSize = 0;
        var _fileVal = "";
        var that = this;
        var vul = new PPUploader({
            token: ppToken,
            cp: opt.cp,
            username: userName,
            offset: {
                x: opt.offset.x,
                y: opt.offset.y,
                width: 0,
                height: 0
            },
            width: opt.offset.w,
            height: opt.offset.h,
            fileInput: opt.fileInput
        });
        function checkVideo() {
            var videoTypeArray = [ "mp4", "flv", "mkv", "avi", "rmvb", "3gp", "wmv", "asf", "mpg", "ts", "m2ts", "m4v", "mpeg", "rm", "vob", "mov", "qt", "3gp", "3g2", "f4v", "ogm", "mwt", "gxf" ];
            var t1 = _fileVal.lastIndexOf("\\");
            var t2 = _fileVal.lastIndexOf(".");
            var videoType = $.trim(_fileVal.slice(t2 + 1)).toLowerCase();
            var vType = -1;
            for (var i = 0; i < videoTypeArray.length; i++) {
                if (videoType === videoTypeArray[i]) {
                    vType = i;
                    break;
                }
            }
            if (vType < 0) {
                opt.onFail.call(that, error[2]);
                return false;
            }
            if (!isHTML5) {
                return true;
            }
            var _fileSizeHTML5 = _fileSize / 1024 / 1024;
            if (_fileSizeHTML5 <= 0) {
                opt.uploadFail(error[3]);
                return false;
            } else if (_fileSizeHTML5 > 1024) {
                opt.uploadFail(error[4]);
                return false;
            }
            return true;
        }
        function metaInfoCallback(evt) {
            _fileVal = evt.fileName;
            opt.onMetaInfo.call(that, evt);
        }
        function startCallback(evt) {
            // console.log(evt)
            _fileId = evt.fileId;
            if (checkVideo()) {
                opt.onStart.call(that, {
                    fileId: _fileId
                });
            } else {
                vul.cancel(_fileId);
                vul.deleteFile(_fileId);
            }
        }
        function progressUpdateCallback(evt) {
            if (evt.total / 1024 / 1024 > 1024 || evt.total <= 0) {
                vul.cancel(_fileId);
                vul.deleteFile(_fileId);
                if (evt.total <= 0) {
                    opt.onFail.call(that, error[3]);
                } else {
                    opt.onFail.call(that, error[4]);
                }
            } else {
                opt.onUpdate(evt.total, evt.uploaded);
            }
        }
        function finishCallback(evt) {
            _fileId = evt.fileId;
            opt.onFinish.call(that, {
                fileId: _fileId
            });
        }
        function failCallback(evt) {
            if (evt.failCode === "1006" || evt.failCode === "1001") {
                _fileId = evt.fileId;
                if (checkVideo()) {
                    opt.onStart.call(that, {
                        fileId: _fileId
                    });
                    opt.onUpdate.call(that, _fileSize, _fileSize);
                    opt.onFinish.call(that, {
                        fileId: _fileId
                    });
                } else {
                    vul.deleteFile(_fileId);
                }
            } else if (evt.failCode == "2004") {
                opt.onFail.call(that, error[4]);
            } else {
                opt.onFail.call(that, error[6]);
            }
        }
        function deleteCallback(evt) {}
        function commitCallback(evt) {
            if (!isHTML5) {
                _fileVal = null;
            }
            opt.onCommit.call(that, {
                fileId: _fileId
            });
        }
        vul.bind("metaInfo", metaInfoCallback);
        //仅flash模式下通过flash选取文件后返回
        vul.bind("start", startCallback);
        vul.bind("progressUpdate", progressUpdateCallback);
        vul.bind("finish", finishCallback);
        vul.bind("fail", failCallback);
        vul.bind("delete", deleteCallback);
        vul.bind("commit", commitCallback);
        this.isHTML5 = isHTML5;
        this.upload = function(file) {
            if (typeof userName === "undefined" || !userName) {
                opt.onFail.call(that, error[5]);
                return;
            }
            if (isHTML5) {
                if (!file) {
                    opt.onFail.call(that, error[1]);
                } else {
                    _fileSize = file.size;
                    _fileVal = file.name;
                    vul.upload(file);
                }
            } else {
                if (_fileVal) {
                    vul.upload(file);
                } else {
                    opt.onFail.call(that, error[1]);
                }
            }
        };
        this.commit = function(title) {
            vul.updateTitle(_fileId, title);
            vul.commit(_fileId);
        };
        this.cancel = function() {
            vul.cancel(_fileId);
        };
        this.completed = function(title) {
            this.commit(title);
        };
    }
    return VideoUploader;
});

/**
 * fileUpload
 *
 * author: pelexiang
 * copyright: pptv
 */
define("pc/util/ppVideoUpload", [], function(require, exports, module) {
    var ppuploader = function(options) {
        var that = this;
        var PROGRESS_UPDATE = "progressUpdate";
        var START = "start";
        var FINISH = "finish";
        var FAIL = "fail";
        var CANCEL = "cancel";
        var DELETE = "delete";
        var COMMIT = "commit";
        var uploadUrl = "http://ugc.upload.pptv.com/html5upload";
        var swfUrl = window.flashUploadSwf;
        //var swfUrl = "http://static9.pplive.cn/corporate/upload/";
        //var uploadUrl = "http://192.168.27.34:8080/ugc-upload/html5upload";
        //var jsonUrl = 'http://192.168.27.34:8080/ugc-service/init_upload';
        var jsonUrl = "http://ugc.api.pptv.com/init_upload";
        var deleteUrl = "http://ugc.api.pptv.com/video_delete";
        var commitUrl = "http://ugc.api.pptv.com/video_update";
        var upload_id = "";
        var swfCom;
        var isDelete = true;
        var _user_info;
        var _username = "";
        var prev_loaded = 0;
        var uploadSize = 0;
        var nextSize = 0;
        var _updateTitleName;
        var _updateTitleId;
        var _file, blob, fd, xhr;
        this.swfPlayer;
        this.canceled = false;
        this.completed = false;
        this.progressing = false;
        this.json_data;
        this.fileName = "";
        this.isHTML5Bool = false;
        this._listener = {};
        this.init = function() {
            _user_info = options;
            _file = document.getElementById(_user_info.fileInput);
            if (options.username != undefined) {
                _username = options.username;
            }
            if (!that.isHTML5()) {
                that.flashLoad();
            }
        };
        this.upload = function(file) {
            if (that.completed) {
                that.fireEvent(FAIL, {
                    failCode: "1001",
                    fileId: upload_id
                });
                return;
            }
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.upload();
                return;
            }
            if (file == null || file == undefined) {
                that.fireEvent(FAIL, {
                    failCode: "1002",
                    fileId: ""
                });
                return;
            }
            _file = file;
            this.progressing = false;
            var qs = "?format=jsonp" + ugcQueryString() + "&cb=jsonpCb.jsonpOnResult" + "&rnd=" + Math.random();
            requestUgc(jsonUrl, qs);
        };
        this.isHTML5 = function() {
            // return false;
            that.isHTML5Bool = false;
            if (window.File && window.FormData) {
                that.isHTML5Bool = true;
            }
            return that.isHTML5Bool;
        };
        this.flashLoad = function() {
            if (_file == null || _file == undefined) {
                that.fireEvent(FAIL, {
                    failCode: "1002",
                    fileId: ""
                });
                return;
            }
            swfCom = _file.parentNode;
            // swfCom.style.position = "relative";
            var ppSwf = document.createElement("div");
            ppSwf.id = "ppSwfPlayer";
            swfCom.appendChild(ppSwf);
            var vars = "external=ppflash&cp=" + _user_info.cp + "&token=" + encodeURIComponent(_user_info.token);
            if (_username.length > 0) vars += "&username=" + _username;
            var swfObject = {
                swfid: "ppSwfId",
                swfwmode: "transparent",
                movie: swfUrl,
                flashvars: vars
            };
            var swftxt = [ '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" width="100%" height="100%" id="' + swfObject.swfid + '" align="middle">', '<param name="allowScriptAccess" value="always" />', '<param name="allowFullScreen" value="false" />', '<param name="movie" value="' + swfObject.movie + '" />', '<param name="quality" value="high" />', '<param name="wmode" value="' + swfObject.swfwmode + '" /><param name="bgcolor" value="#000000" />', '<param name="flashvars" value="' + swfObject.flashvars + '">', '<embed src="' + swfObject.movie + '" flashvars="' + swfObject.flashvars + '" wmode="' + swfObject.swfwmode + '" backgroundcolor="#000000" quality="high" width="100%" height="100%" name="' + swfObject.swfid + '" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />', "</object>" ].join("");
            //console.log(swftxt);
            var vx = 0, vy = 0, vw = 0, vh = 0, vWid, vHei;
            if (options.offset != undefined) {
                vx = options.offset.x != undefined ? options.offset.x : 0;
                vy = options.offset.y != undefined ? options.offset.y : 0;
                vw = options.offset.width != undefined ? options.offset.width : 0;
                vh = options.offset.height != undefined ? options.offset.height : 0;
                vWid = options.width != undefined ? options.width : 0;
                vHei = options.height != undefined ? options.height : 0;
            }
            ppSwf.style.position = "absolute";
            ppSwf.style.width = vWid + vw + "px";
            ppSwf.style.height = vHei + vh + "px";
            ppSwf.style.top = vy + "px";
            ppSwf.style.right = vx + "px";
            ppSwf.innerHTML = swftxt;
            that.swfPlayer = document.getElementById("ppSwfId");
        };
        var requestUgc = function(url, params, method, cb, error) {
            url += params;
            //console.log(url);
            if (method == "ajax") {
                ajaxLoad(url, cb);
            } else {
                jsonpLoad(url);
            }
        };
        var reUpload = function(i) {};
        var fileupload = function() {
            fd = new FormData();
            nextSize = uploadSize + 10 * 1024 * 1024;
            if (nextSize > _file.size) {
                nextSize = _file.size;
            }
            //console.log('uploadSize '+uploadSize +' ----- '+nextSize);
            if (_file.slice) {
                blob = _file.slice(uploadSize, nextSize);
            } else if (_file.webkitSlice) {
                blob = _file.webkitSlice(uploadSize, nextSize);
            } else if (_file.mozSlice) {
                blob = _file.mozSlice(uploadSize, nextSize);
            }
            var range = "bytes " + uploadSize + " - " + nextSize + "/" + _file.size;
            //console.log('range : ' + range)
            fd.append("fileToUpload", blob);
            xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", uploadProgress, false);
            xhr.addEventListener("load", uploadCompleted, false);
            xhr.addEventListener("error", uploadFailed, false);
            xhr.addEventListener("abort", uploadCanceled, false);
            var url = uploadUrl;
            var fileTime = new Date(_file.lastModifiedDate.toUTCString());
            url += "?format=json&filename=" + encodeURIComponent(_file.name) + ugcQueryString() + "&uploadid=" + upload_id + "&size=" + _file.size + "&type=" + encodeURIComponent(_file.type) + "&lastmodifiedtime=" + (_file.lastModifiedDate ? fileTime.getTime() : "");
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Range", range);
            xhr.send(fd);
        };
        var uploadProgress = function(evt) {
            if (evt.lengthComputable) {
                if (!that.progressing) {
                    that.progressing = true;
                    that.fileName = encodeURIComponent(_file.name);
                    that.fireEvent(START, {
                        obj: _user_info.fileInput,
                        fileId: upload_id,
                        mode: that.isHTML5Bool ? "html5" : "flash",
                        fileName: _file.name
                    });
                }
                var speed = evt.loaded - prev_loaded;
                var alreadySend = uploadSize + evt.loaded;
                var cbparam = {
                    fileId: upload_id,
                    uploaded: alreadySend,
                    total: _file.size
                };
                that.fireEvent(PROGRESS_UPDATE, cbparam);
                prev_loaded = evt.loaded;
            } else {}
        };
        var uploadCompleted = function() {
            uploadSize = nextSize;
            if (uploadSize < _file.size) {
                fileupload();
            } else {
                that.completed = true;
                that.progressing = false;
                that.fireEvent(FINISH, {
                    fileId: upload_id
                });
            }
        };
        var uploadFailed = function() {
            that.progressing = false;
            that.fireEvent(FAIL, {
                failCode: "1003",
                fileId: upload_id
            });
        };
        var uploadCanceled = function() {
            that.fireEvent(CANCEL, {
                fileId: upload_id
            });
        };
        var jsonpLoad = function(uri) {
            var script = document.createElement("script");
            script.setAttribute("src", uri);
            document.getElementsByTagName("head")[0].appendChild(script);
        };
        this.jsonpOnResult = function(jdata) {
            if (jdata.errorCode != undefined && jdata.errorCode == "0") {
                uploadUrl = jdata.result.html5UploadUrl;
                upload_id = jdata.result.uploadID;
                var dateTime = new Date(_file.lastModifiedDate.toUTCString());
                var qs = "?format=json&filename=" + encodeURIComponent(_file.name) + ugcQueryString() + "&uploadid=" + upload_id + "&size=" + _file.size + "&type=" + encodeURIComponent(_file.type) + "&lastmodifiedtime=" + (_file.lastModifiedDate ? dateTime.getTime() : "");
                requestUgc(uploadUrl, qs, "ajax", that.ajaxOnResult);
            } else {
                that.fireEvent(FAIL, {
                    failCode: "1004",
                    fileId: ""
                });
            }
        };
        var ajaxLoad = function(uri, callback) {
            var request = new XMLHttpRequest();
            request.open("GET", uri, true);
            request.send(null);
            request.onreadystatechange = that.ajaxOnResult;
        };
        this.ajaxOnResult = function(evt) {
            if (evt.currentTarget.readyState == 4 && (evt.currentTarget.status == 200 || evt.currentTarget.status == 0)) {
                //console.log(evt.currentTarget);
                //console.log(evt.currentTarget.responseText);
                that.json_data = JSON.parse(evt.currentTarget.responseText);
                if (that.json_data.size != undefined) {
                    uploadSize = that.json_data.size;
                    if (uploadSize >= _file.size) {
                        uploadSize = nextSize = _file.size;
                        that.fireEvent(FAIL, {
                            failCode: "1006",
                            fileId: upload_id
                        });
                    } else {
                        fileupload();
                    }
                }
            }
        };
        this.updateTitle = function(fileId, movieTitle) {
            _updateTitleName = movieTitle || that.fileName;
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.updateTitle({
                    fileId: fileId,
                    movieTitle: _updateTitleName
                });
                return;
            }
            _updateTitleId = fileId;
        };
        this.cancel = function(fileId) {
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.cancel(fileId);
                return;
            }
            this.canceled = true;
            //function cb() {
            //uploadCanceled();
            //}
            if (this.completed) {
                that.deleteFile(fileId);
            } else {
                xhr.abort();
            }
            that.completed = false;
        };
        this.deleteFile = function(fileId) {
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.deleteFile(fileId);
            }
            that.completed = false;
            that.fireEvent(DELETE, {
                fileId: fileId
            });
        };
        this.deleteOnResult = function() {
            that.fireEvent(DELETE, {
                fileId: fileId
            });
        };
        this.commit = function(fileId) {
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.commit(fileId);
            } else {
                var qs = "?format=jsonp" + ugcQueryString() + "&uploadID=" + _updateTitleId + "&Submit=true" + "&Title=" + _updateTitleName + "&IsNoReview=" + (typeof window.isNoaudituser != "undefined" ? window.isNoaudituser : "0") + "&cb=jsonpCb.commitOnResult";
                //IsNoReview: 0审核    1免审核（default=0）
                // console.log(qs);
                requestUgc(commitUrl, qs);
            }
            that.completed = false;
        };
        this.commitOnResult = function(jdata) {
            if (jdata.errorCode != undefined && jdata.errorCode == "0") {
                that.fireEvent(COMMIT, {
                    fileId: _updateTitleId,
                    title: _updateTitleName
                });
            } else {
                that.fireEvent(FAIL, {
                    failCode: "1005",
                    fileId: upload_id
                });
            }
        };
        var ugcQueryString = function() {
            var url = "&from=clt&token=" + _user_info.token.replace(/\+/g, "%2B") + "&cp=" + _user_info.cp;
            if (_username.length > 0) url += "&username=" + _username;
            return url;
        };
        this.errorDebug = function(o) {
            try {
                console.log("error" + o);
            } catch (X) {}
        };
        this.bind = function(type, cb) {
            if (typeof type === "string" && typeof cb === "function") {
                if (typeof that._listener[type] === "undefined") {
                    that._listener[type] = [ cb ];
                } else {
                    that._listener[type].push(cb);
                }
            }
        };
        this.fireEvent = function(type, data) {
            if (type && that._listener[type]) {
                for (var length = that._listener[type].length, start = 0; start < length; start += 1) {
                    that._listener[type][start].call(that, data);
                }
            }
        };
        var fileSlice = function() {
            return sl;
        };
        this.init();
        var flashEvent = {
            onBindToJs: function(obj) {
                try {
                    that.fireEvent(obj["type"], obj);
                    if (obj["type"] == "start" && obj["fileName"] != "undefined") {
                        that.fileName = encodeURIComponent(obj["fileName"]);
                    }
                } catch (X) {}
            }
        };
        window["jsonpCb"] = this;
        window["ppflash"] = flashEvent;
    };
    return ppuploader;
});

//github地址：https://github.com/mathiasbynens/jquery-placeholder
define("pc/util/placeholder", [], function(require) {
    return function($) {
        // Opera Mini v7 doesn't support placeholder although its DOM seems to indicate so
        var isOperaMini = Object.prototype.toString.call(window.operamini) === "[object OperaMini]";
        var isInputSupported = "placeholder" in document.createElement("input") && !isOperaMini;
        var isTextareaSupported = "placeholder" in document.createElement("textarea") && !isOperaMini;
        var valHooks = $.valHooks;
        var propHooks = $.propHooks;
        var hooks;
        var placeholder;
        var settings = {};
        if (isInputSupported && isTextareaSupported) {
            placeholder = $.fn.placeholder = function() {
                return this;
            };
            placeholder.input = true;
            placeholder.textarea = true;
        } else {
            placeholder = $.fn.placeholder = function(options) {
                var defaults = {
                    customClass: "placeholder"
                };
                settings = $.extend({}, defaults, options);
                return this.filter((isInputSupported ? "textarea" : ":input") + "[placeholder]").not("." + settings.customClass).bind({
                    "focus.placeholder": clearPlaceholder,
                    "blur.placeholder": setPlaceholder
                }).data("placeholder-enabled", true).trigger("blur.placeholder");
            };
            placeholder.input = isInputSupported;
            placeholder.textarea = isTextareaSupported;
            hooks = {
                get: function(element) {
                    var $element = $(element);
                    var $passwordInput = $element.data("placeholder-password");
                    if ($passwordInput) {
                        return $passwordInput[0].value;
                    }
                    return $element.data("placeholder-enabled") && $element.hasClass(settings.customClass) ? "" : element.value;
                },
                set: function(element, value) {
                    var $element = $(element);
                    var $replacement;
                    var $passwordInput;
                    if (value !== "") {
                        $replacement = $element.data("placeholder-textinput");
                        $passwordInput = $element.data("placeholder-password");
                        if ($replacement) {
                            clearPlaceholder.call($replacement[0], true, value) || (element.value = value);
                            $replacement[0].value = value;
                        } else if ($passwordInput) {
                            clearPlaceholder.call(element, true, value) || ($passwordInput[0].value = value);
                            element.value = value;
                        }
                    }
                    if (!$element.data("placeholder-enabled")) {
                        element.value = value;
                        return $element;
                    }
                    if (value === "") {
                        element.value = value;
                        // Setting the placeholder causes problems if the element continues to have focus.
                        if (element != safeActiveElement()) {
                            // We can't use `triggerHandler` here because of dummy text/password inputs :(
                            setPlaceholder.call(element);
                        }
                    } else {
                        if ($element.hasClass(settings.customClass)) {
                            clearPlaceholder.call(element);
                        }
                        element.value = value;
                    }
                    // `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
                    return $element;
                }
            };
            if (!isInputSupported) {
                valHooks.input = hooks;
                propHooks.value = hooks;
            }
            if (!isTextareaSupported) {
                valHooks.textarea = hooks;
                propHooks.value = hooks;
            }
            $(function() {
                // Look for forms
                $(document).delegate("form", "submit.placeholder", function() {
                    // Clear the placeholder values so they don't get submitted
                    var $inputs = $("." + settings.customClass, this).each(function() {
                        clearPlaceholder.call(this, true, "");
                    });
                    setTimeout(function() {
                        $inputs.each(setPlaceholder);
                    }, 10);
                });
            });
            // Clear placeholder values upon page reload
            $(window).bind("beforeunload.placeholder", function() {
                $("." + settings.customClass).each(function() {
                    this.value = "";
                });
            });
        }
        function args(elem) {
            // Return an object of element attributes
            var newAttrs = {};
            var rinlinejQuery = /^jQuery\d+$/;
            $.each(elem.attributes, function(i, attr) {
                if (attr.specified && !rinlinejQuery.test(attr.name)) {
                    newAttrs[attr.name] = attr.value;
                }
            });
            return newAttrs;
        }
        function clearPlaceholder(event, value) {
            var input = this;
            var $input = $(input);
            if (input.value === $input.attr("placeholder") && $input.hasClass(settings.customClass)) {
                input.value = "";
                $input.removeClass(settings.customClass);
                if ($input.data("placeholder-password")) {
                    $input = $input.hide().nextAll('input[type="password"]:first').show().attr("id", $input.removeAttr("id").data("placeholder-id"));
                    // If `clearPlaceholder` was called from `$.valHooks.input.set`
                    if (event === true) {
                        $input[0].value = value;
                        return value;
                    }
                    $input.focus();
                } else {
                    input == safeActiveElement() && input.select();
                }
            }
        }
        function setPlaceholder(event) {
            var $replacement;
            var input = this;
            var $input = $(input);
            var id = input.id;
            // If the placeholder is activated, triggering blur event (`$input.trigger('blur')`) should do nothing.
            if (event && event.type === "blur") {
                if ($input.hasClass(settings.customClass)) {
                    return;
                }
                if (input.type === "password") {
                    $replacement = $input.prevAll('input[type="text"]:first');
                    if ($replacement.length > 0 && $replacement.is(":visible")) {
                        return;
                    }
                }
            }
            if (input.value === "") {
                if (input.type === "password") {
                    if (!$input.data("placeholder-textinput")) {
                        try {
                            $replacement = $input.clone().prop({
                                type: "text"
                            });
                        } catch (e) {
                            $replacement = $("<input>").attr($.extend(args(this), {
                                type: "text"
                            }));
                        }
                        $replacement.removeAttr("name").data({
                            "placeholder-enabled": true,
                            "placeholder-password": $input,
                            "placeholder-id": id
                        }).bind("focus.placeholder", clearPlaceholder);
                        $input.data({
                            "placeholder-textinput": $replacement,
                            "placeholder-id": id
                        }).before($replacement);
                    }
                    input.value = "";
                    $input = $input.removeAttr("id").hide().prevAll('input[type="text"]:first').attr("id", $input.data("placeholder-id")).show();
                } else {
                    var $passwordInput = $input.data("placeholder-password");
                    if ($passwordInput) {
                        $passwordInput[0].value = "";
                        $input.attr("id", $input.data("placeholder-id")).show().nextAll('input[type="password"]:last').hide().removeAttr("id");
                    }
                }
                $input.addClass(settings.customClass);
                $input[0].value = $input.attr("placeholder");
            } else {
                $input.removeClass(settings.customClass);
            }
        }
        function safeActiveElement() {
            // Avoid IE9 `document.activeElement` of death
            try {
                return document.activeElement;
            } catch (exception) {}
        }
    };
});

/*
 * @author  Zhan Wang
 * @date    2016/5/5 14:10
 * @email   ijingzhan@gmail.com
 * @info    
 *
 */
define("pc/app/presonal", [ "jquery", "util/user" ], function(require) {
    var $ = require("jquery"), user = require("util/user");
    var $snvideoTit = $("#snvideo-tit"), $snvideoList = $("#snvideo-list");
    $snvideoTit.on("mouseenter", "a", function(e) {
        e.preventDefault();
        var $self = $(this);
        $self.addClass("now").siblings("a").removeClass("now");
        $snvideoList.children("div.tabcon").eq($self.index()).show().siblings("div").hide();
    });
});

define("pc/util/vote", [ "jquery", "pc/util/cookie", "pc/util/get_jsonp", "pc/util/number", "pc/util/json", "pc/util/dataFormat" ], function(require, exports) {
    var VOTE_URL = "http://www.suning.com";
    var TOKEN_URL = "/vote/csrf";
    var $ = require("jquery");
    var cookie = require("pc/util/cookie");
    var getJsonp = require("pc/util/get_jsonp");
    var number = require("pc/util/number");
    var JSON = require("pc/util/json");
    var dataFormat = require("pc/util/dataFormat");
    var voteToken = cookie.get("snvotetoken");
    var $voteErr = $("#sn-vote"), $voteOk = $("#sn-coupons-middle"), $voteEnd = $("#sn-coupons-end");
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
    $(".zan").click(function() {
        var that = this;
        var voteid = $(this).attr("voteid");
        var voteCookie = JSON.parse(cookie.get("snvote") || "{}");
        cookie.set("sn_right", 1, 30, "pptv.com", "/");
        if ($(this).hasClass("disable")) {
            $voteEnd.find("em").html("活动结束");
            $voteEnd.fadeIn();
            return;
        }
        if (dataFormat(new Date(), "YYYYMMdd") == dataFormat(new Date(voteCookie.date), "YYYYMMdd")) {
            if (voteCookie.record >= 3) {
                $voteErr.show();
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
                if (data.errors.code == "92") {
                    // 活动截止
                    $voteEnd.find("em").html("活动结束");
                    $voteEnd.fadeIn();
                } else if (data.errors.code == "91") {
                    //  未开始
                    $voteEnd.find("em").html("活动未开始");
                    $voteEnd.fadeIn();
                } else {
                    $voteErr.show();
                }
            } else {
                $(that).find("code").text(number(data.counter));
                voteCookie.record++;
                cookie.set("snvote", JSON.stringify(voteCookie), 30, "pptv.com", "/");
                $voteOk.show();
            }
        });
    });
    return c;
});

define("pc/util/get_jsonp", [ "jquery" ], function(require, exports) {
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

define("pc/util/number", [], function() {
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

define("pc/util/dataFormat", [], function() {
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
