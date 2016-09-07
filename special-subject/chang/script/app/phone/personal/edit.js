/*! 一唱成名 create by ErickSong */
/**
 * 个人中心弹出修改框
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/phone/personal/edit", [ "core/zepto/zepto", "./../../../util/log/alertBox", "core/jquery/1.8.3/jquery" ], function(require, exports, module) {
    var $ = require("core/zepto/zepto");
    alertBox = require("./../../../util/log/alertBox");
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
