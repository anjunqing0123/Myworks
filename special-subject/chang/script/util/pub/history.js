/*! 一唱成名 create by ErickSong */
/**
 * @author  Erick Song
 * @date    2012-08-30
 * @email   ahschl0322@gmail.com
 * @info    网站历史记录功能
 *
 */
define("util/pub/history", [ "core/jquery/1.8.3/jquery", "../json/json", "../log/log", "./puid", "../cookie/cookie" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), JSON = require("../json/json"), log = require("../log/log"), puid = require("./puid");
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
