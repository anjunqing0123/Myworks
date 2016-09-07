/*! 一唱成名 create by ErickSong */
define("app/module/search/search", [ "./../../../util/ppsdk/sdkUtil", "core/jquery/1.8.3/jquery", "../../../util/log/alertBox" ], function(require) {
    (function() {
        // 搜索框调用native
        var sdk = require("./../../../util/ppsdk/sdkUtil");
        $(".module-search, .module-search_ipad").click(function() {
            sdk("openNativePage", {
                pageUrl: "app://iph.pptv.com/v4/search",
                success: function() {},
                error: function(code, msg) {}
            });
        });
    })();
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
