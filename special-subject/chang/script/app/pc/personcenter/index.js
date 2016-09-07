/*! 一唱成名 create by ErickSong */
define("app/pc/personcenter/index", [ "./validator", "core/jquery/1.8.3/jquery", "../../../util/linkcfg/interfaceurl", "../../../util/user/user", "client", "../../../util/cookie/cookie", "../../../util/login/login", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "./iframeUpload", "./dropdownSelect", "./dropdown", "./mediator", "../../../util/scroller/scroller", "core/underscore/1.8.3/underscore", "../../../util/event/event-mouse-wheel", "../../../util/scroller/scroller.css", "./citydrop", "./bdaydrop" ], function(require, exports) {
    var validator = require("./validator");
    var $ = require("core/jquery/1.8.3/jquery");
    var urls = require("../../../util/linkcfg/interfaceurl");
    var user = require("../../../util/user/user");
    var login = require("../../../util/login/login");
    var loader = require("../../../util/loader/loader");
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    // 添加报名协议
    var $confirmContract = $(".confirm-contract");
    var $link = $confirmContract.find("a");
    if (!!isClient) {
        var link = urls["redirect"]["contract_client"];
        $link.attr("href", link);
    } else {
        var link = urls["redirect"]["contract_pc"];
        $link.attr("href", link);
        $link.attr("target", "_blank");
    }
    //添加登录报名验证
    var client_suffix = "?plt=clt";
    user.loginEvents.add(function() {
        var username = user.info.UserName;
        loader.load(urls["interface"]["checkSign"], {}, function(data) {
            if (data.status == -1) {
                //已经报过名
                var urlComplete = urls["redirect"]["registrationComplete"];
                if (!!isClient) {
                    window.location = urlComplete + client_suffix;
                } else {
                    window.location = urlComplete;
                }
            } else if (data.status == 1) {}
        });
    });
    //console.log(user);
    // 注册成功跳转逻辑
    var registerDirectTemplate = '<div class="grid"><div class="wc100 pdt30 cf"><div class="module-register-redirect"><h2>您已报名一唱成名</h2><p class="mt5">将于<em class="js-direct-time">5</em>s后跳转至您的<span><a href="#">个人中心</a></span></p></div></div></div>';
    function counter(dom, count) {
        setTimeout(function() {
            dom.text(--count);
            if (count != 0) {
                counter(dom, count);
            } else {
                if (!!isClient) {
                    window.location = urls["redirect"]["usercenter"] + "?from=clt";
                } else {
                    window.location = urls["redirect"]["oneSingTab"];
                }
            }
        }, 1e3);
    }
    function registerDirect(type) {
        if (!type) {
            var $wrap = $(".bgGrey");
            $wrap.html(registerDirectTemplate);
            var timeDom = $wrap.find(".js-direct-time");
            counter(timeDom, 5);
        } else {}
    }
    //判断未登录，提示用户登录
    if (!login.isLogined()) {
        login.init({
            type: "login",
            tip: encodeURIComponent("亲，需要登录后才能报名哦")
        });
    } else {}
    // 图片上传
    var iframeUpload = require("./iframeUpload");
    //初始化三级联动
    //城市联动下拉框
    var dropdownSelect = require("./dropdownSelect");
    var dropAddress = dropdownSelect.create({
        dropIcon: ".curval"
    });
    var dropdownNormal = require("./dropdown");
    // 身份证下拉框 ，证件类型默认是身份证
    var card_type = 1;
    dropdownNormal.create({
        container: ".drop-card",
        dropIcon: ".curval,.dropdown-icon",
        afterSelect: function(type, val) {
            $(".drop-card").next().text("");
            if (val == "身份证") {
                card_type = 1;
            } else {
                card_type = 2;
            }
        }
    });
    // bdayjson数据组装
    var bday = "";
    var bdayObj = require("./bdaydrop");
    var bdayJson = {};
    for (var i = 1900; i <= 2014; i++) {
        bdayJson[i] = bdayObj;
    }
    var dropBday = dropdownSelect.create({
        container: ".drop-bday",
        groupDataArr: bdayJson,
        dropIcon: ".curval,.dropdown-icon"
    });
    // bdayjson数据组装结束
    //清空值
    var btnTimeout;
    $(".btn-close").on("click", function() {
        clearTimeout(btnTimeout);
        btnTimeout = null;
        $(this).prev().val("");
    });
    //上传图片的地址
    var photo = "";
    var iframeObj = new iframeUpload({
        afterUpload: function(type, data, obj) {
            photo = data;
            $("#photoNative").val($(".input-file-main").val());
            obj.removeClass("btn-disabled").find("span").text("重新上传");
            $(".upload-inprogress").addClass("hidden");
            obj.next().addClass("hidden");
            obj.siblings(".form-error").text("");
            $(".previewBox-image").css("backgroundImage", "none");
        },
        inProgress: function() {
            $("#imageError").html("");
            $(".upload-inprogress").removeClass("hidden");
        },
        error: function(type, errorInfo, obj) {
            if (errorInfo == "login") {
                login.init({
                    type: "login"
                });
                obj.removeClass("btn-disabled").find("span").text("上传");
                obj.next().addClass("hidden");
                obj.siblings(".form-error").text("请先登录");
            } else if (errorInfo == "upload") {
                obj.siblings(".form-error").text("上传出错，请稍后再试");
            }
        },
        errorType: function(type, errorInfo, obj) {
            obj.removeClass("btn-disabled").find("span").text("上传");
            obj.next().addClass("hidden");
            $("#imageError").text("上传的图片类型不正确");
        },
        errorSize: function(type, errorInfo, obj) {
            obj.removeClass("btn-disabled").find("span").text("上传");
            obj.next().addClass("hidden");
            $("#imageError").text(errorInfo);
        }
    });
    // 尝试使用 imagepreview
    /*var imagepreview=require('./imagePreview');
	imagepreview.create({
		container:'#person-info',
		imgContainer:'.previewBox-image',
		bigImage:'#bigImage',
		smallImage:'#smallImage',
		fileBtn:'.input-file-main',
		errorType:function(){
			$("#imageError").text('上传的图片类型不正确');
		},
		errorSize:function(type,msg){
			$("#imageError").text(msg);
		}
	});*/
    function hasPlaceholderSupport() {
        return "placeholder" in document.createElement("input");
    }
    //单个验证
    function validate(obj) {
        var type = obj.attr("data-check");
        if (!type) {
            return false;
        }
        var digit;
        var idx;
        if (~(idx = type.indexOf("|"))) {
            digit = type.substr(idx + 1);
            type = type.substr(0, idx);
        }
        if (type == "card") {
            digit = card_type;
        }
        var msg = obj.attr("data-error") || validator.msg[type];
        var tempVal = $.trim(obj.val());
        if (!validator[type](tempVal, digit) || obj.val() == "请输入组合名称" || obj.val() == "请输入您的姓名" || obj.val() == "请选择您的认证照片" || obj.val() == "请输入您的联系地址") {
            obj.parents(".form-item").find(".form-error").removeClass("form-success").text(msg);
            obj.addClass("in-error");
            return false;
        } else {
            obj.parents(".form-item").find(".form-error").text("");
            obj.removeClass("in-error");
            return true;
        }
    }
    function focusNormal(obj) {
        obj.removeClass("in-error");
        obj.addClass("in-edit");
        obj.next(".btn-close").removeClass("hidden");
        if (obj.attr("placeholder") == "请输入组合名称") {
            obj.parents(".form-item").find(".form-error").addClass("form-success").text("以下个人信息填写组合队长信息");
        }
    }
    function blurNormal(obj) {
        obj.removeClass("in-edit");
        var isvalidate = validate(obj);
        if (!!isvalidate) {
            obj.removeClass("in-error");
        } else {
            if (obj.attr("placeholder") == "请输入组合名称") {
                obj.parents(".form-item").find(".form-error").removeClass("form-success");
            }
            obj.addClass("in-error");
        }
        obj.next(".btn-close").addClass("hidden");
    }
    // 绑定placeholder
    var inputArr = $("input[type=text]").not($("#photoNative"));
    if (!hasPlaceholderSupport()) {
        inputArr.each(function() {
            var obj = $(this);
            var placeVal = obj.attr("placeholder");
            obj.val(placeVal);
            obj.on("focus", function() {
                if (obj.val() == placeVal) {
                    obj.val("");
                }
                focusNormal(obj);
            }).on("blur", function(e) {
                btnTimeout = setTimeout(function() {
                    blurNormal(obj);
                    if ($.trim(obj.val()) == "") {
                        obj.val(placeVal);
                    }
                }, 500);
            });
        });
        $(".input-text-file").val("请选择您的认证照片");
    } else {
        inputArr.each(function() {
            var obj = $(this);
            obj.on("focus", function() {
                focusNormal(obj);
            }).on("blur", function() {
                btnTimeout = setTimeout(function() {
                    blurNormal(obj);
                }, 500);
            });
        });
    }
    // input radio check
    //是否组合
    var isgroup = 0;
    //性别
    var sex = 1;
    // sex error dom
    var sexErrorDom = $("#js-sex").find(".form-error");
    $(".input-radio").on("click", function() {
        var obj = $(this);
        obj.siblings(".input-radio").removeClass("input-radio-check");
        obj.addClass("input-radio-check");
        var formContainer = $(".form-group-name");
        if (obj.parents(".form-isGroup").length != 0) {
            //组合名称逻辑
            if (obj.prev().text() == "是") {
                isgroup = 1;
                formContainer.removeClass("hidden");
                formContainer.find("input").attr("data-check", "required");
                formContainer.find(".form-error").addClass("form-success").text("以下个人信息填写组合队长信息");
            } else {
                isgroup = 0;
                $(".form-group-name").addClass("hidden");
                formContainer.find("input").removeAttr("data-check", "required");
                formContainer.find(".form-error").removeClass("form-success").text("");
            }
        } else {
            sexErrorDom.text("");
            if (obj.prev().text() == "男") {
                sex = 1;
            } else {
                sex = 0;
            }
        }
    });
    // 是否开启不让发验证码的倒计时
    var capBool = false;
    // 验证码按钮
    var cpaBtn = $(".cpaBtn");
    cpaBtn.on("click", function(e) {
        e.preventDefault();
        var mobile = $("[data-check=mobile]");
        var errorDom = mobile.parents(".form-item").find(".form-error");
        var type = mobile.attr("data-check");
        var tempVal = mobile.val();
        var msg = mobile.attr("data-error") || validator.msg[type];
        if (!login.isLogined()) {
            errorDom.text("需要登录哦，亲");
            //提醒用户登录
            login.init({
                type: "login"
            });
            return false;
        }
        if (!!capBool) {
            errorDom.text("验证码发送过于频繁，请稍后再试");
            return false;
        }
        if (!validator[type](tempVal)) {
            errorDom.text(msg);
        } else {
            //开始发送验证码
            loader.ajax({
                url: urls["interface"]["phonetoken"],
                data: {
                    telphone: tempVal
                },
                success: function(data) {
                    //验证码已经发送
                    if (data.status == 1) {
                        errorDom.text("验证码发送成功");
                        errorDom.addClass("form-success");
                        setTimeout(function() {
                            errorDom.removeClass("form-success").addClass("hidden");
                        }, 3e3);
                        //执行60s不让发的逻辑
                        capBool = true;
                        var time = 60;
                        function buildTxt(time) {
                            return "验证码已经发送(" + time + "S)";
                        }
                        cpaBtn.text(buildTxt(time));
                        cpaBtn.addClass("btn-disabled");
                        var timerInterval = setInterval(function() {
                            time--;
                            cpaBtn.text(buildTxt(time));
                            if (time == 0) {
                                capBool = false;
                                clearInterval(timerInterval);
                                cpaBtn.removeClass("btn-disabled").text("再次发送验证码");
                            }
                        }, 1e3);
                    } else if (data.status == 0) {
                        errorDom.text("需要登录哦，亲");
                        //提醒用户登录
                        login.init({
                            type: "login"
                        });
                    } else if (data.status == -2) {
                        errorDom.text("手机号已经绑定，请更换手机号");
                    } else if (data.status == -4) {
                        errorDom.text("验证码发送过于频繁，请稍后再试");
                    }
                },
                error: function() {
                    errorDom.text("服务器正忙,请稍后再试");
                }
            });
        }
    });
    $("#confirmCheck").on("change", function() {
        var obj = $(this);
        if (obj.prop("checked") == true) {
            $(".confrimError").addClass("hidden");
        }
    });
    var triExpand = $(".confirm-contract .tri-expand");
    $(".confirm-contract .tri-drop").on("mouseenter", function() {
        triExpand.removeClass("hidden");
        $(".confrimError").addClass("hidden");
    });
    triExpand.on("mouseleave", function() {
        triExpand.addClass("hidden");
    });
    //提交按钮
    $(".input-submit-main").on("click", function(e) {
        e.preventDefault();
        var isChecked = $("#confirmCheck");
        if (isChecked.prop("checked") != true) {
            $(".confrimError").removeClass("hidden");
            return false;
        }
        var isValidate = true;
        //验证性别是否勾选
        var checkDomWrap = $("#js-sex");
        var checkDom = checkDomWrap.find(".input-radio-check");
        if (checkDom.length == 0) {
            checkDomWrap.find(".form-error").text("请选择性别");
            isValidate = false;
        }
        //检查是不是外国友人
        var reg = /^[A-Za-z]+$/;
        var tempName = $("[name=cname]").val();
        if (reg.test(tempName)) {
            //是外国友人
            if (card_type == 1) {
                $(".drop-card").next().text("证件类型必须为护照");
            }
        }
        var formCheckItem = $(".form-item").find("[data-check]");
        formCheckItem.each(function() {
            var obj = $(this);
            var singleValidate = validate(obj);
            if (singleValidate == false) {
                isValidate = false;
            }
        });
        if (!!isValidate && !iframeObj.islock()) {
            bday = dropBday.getGroupval("-");
            // if(bday=="1900-01-01"){
            // 	$("#error-bday").removeClass('hidden');
            // 	return false;
            // }
            var totalAddress = dropAddress.getGroupval("-") + "-" + $("#inputAddress").val();
            //开始组建表单数据准备提交
            var obj = {
                isgroup: isgroup,
                sex: sex,
                card_type: card_type,
                photo: photo,
                bday: bday,
                address: totalAddress
            };
            var objStr = $.param(obj);
            var formObj = $("#person-info").serialize();
            var submitStr = formObj + "&" + objStr;
            loader.ajax({
                url: urls["interface"]["sign"],
                data: submitStr,
                success: function(data) {
                    //注册成功，最好使用modal框
                    var status = data.status;
                    //console.log(status);
                    switch (status) {
                      case "1":
                        //执行跳转的逻辑,跳转个人中心
                        if (!!isClient) {
                            window.location = urls["redirect"]["usercenter"] + "?from=clt";
                        } else {
                            window.location = urls["redirect"]["oneSingTab"];
                        }

                      case "-8":
                        $("#err_default").text("当前注册人数过多，请稍后再试");

                      //进入成功逻辑
                        case "-1":
                      case "-14":
                        //手机验证码错误
                        $("#error-mobile").text("手机验证码错误");
                        break;

                      case "-2":
                        //真实的中文名不符合中文格式
                        $("#err_default").text("姓名为英文证件类型必须是护照");
                        break;

                      case "-10":
                        $("#card_num").text("证件号已经被注册");
                        break;

                      case "-5":
                        $("#err_default").text("该用户已经报名");
                        break;

                      case "-9":
                        $("#error-pnum").text("该手机号已经被绑定");
                        break;
                    }
                },
                error: function() {
                    alert("当前注册人数过多，请稍后再试");
                }
            });
        }
    });
});

define("app/pc/personcenter/validator", [], function(require, exports) {
    function commonValidator(reg, item) {
        //脚本验证
        var preReg = /\<|\>|php|\?/;
        if (preReg.test(item)) {
            return false;
        }
        if (!reg.test(item)) {
            return false;
        } else {
            return true;
        }
    }
    //检查身份证
    function checkIdCard(item) {
        //http://blog.163.com/jiang_tao_2010/blog/static/1211268902010011102157920/
        //目前默认只有18位的二代身份证，现在15位的逻辑
        var reg = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
        var num = item.toUpperCase();
        if (!/(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(num)) {
            return false;
        }
        var len, re;
        len = num.length;
        //15位的验证规则开始
        if (len == 15) {
            re = new RegExp(/^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/);
            var arrSplit = num.match(re);
            var dtmBirth = new Date("19" + arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
            var bGoodDay;
            bGoodDay = dtmBirth.getYear() == Number(arrSplit[2]) && dtmBirth.getMonth() + 1 == Number(arrSplit[3]) && dtmBirth.getDate() == Number(arrSplit[4]);
            if (!bGoodDay) {
                return false;
            } else {
                return true;
            }
        } else {
            var arrSplit = num.match(reg);
            //检查生日日期是否正确
            var dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
            var bGoodDay;
            bGoodDay = dtmBirth.getFullYear() == Number(arrSplit[2]) && dtmBirth.getMonth() + 1 == Number(arrSplit[3]) && dtmBirth.getDate() == Number(arrSplit[4]);
            if (!bGoodDay) {
                return false;
            } else {
                var valnum;
                var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                var arrCh = new Array("1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2");
                var nTemp = 0, i;
                for (i = 0; i < 17; i++) {
                    nTemp += num.substr(i, 1) * arrInt[i];
                }
                valnum = arrCh[nTemp % 11];
                if (valnum != num.substr(17, 1)) {
                    return false;
                }
                return true;
            }
        }
    }
    function isDate(item, formatString) {
        formatString = formatString || "ymd";
        var m, year, month, day;
        switch (formatString) {
          case "ymd":
            m = item.match(new RegExp("^((\\d{4})|(\\d{2}))([-./])(\\d{1,2})\\4(\\d{1,2})$"));
            if (m === null) return false;
            day = m[6];
            month = m[5]--;
            year = m[2].length == 4 ? m[2] : GetFullYear(parseInt(m[3], 10));
            break;

          case "dmy":
            m = item.match(new RegExp("^(\\d{1,2})([-./])(\\d{1,2})\\2((\\d{4})|(\\d{2}))$"));
            if (m === null) return false;
            day = m[1];
            month = m[3]--;
            year = m[5].length == 4 ? m[5] : GetFullYear(parseInt(m[6], 10));
            break;

          default:
            break;
        }
        if (!parseInt(month)) return false;
        month = month == 12 ? 0 : month;
        var date = new Date(year, month, day);
        return typeof date == "object" && year == date.getFullYear() && month == date.getMonth() && day == date.getDate();
        function GetFullYear(y) {
            return (y < 30 ? "20" : "19") + y || 0;
        }
    }
    var validator = {
        required: function(item) {
            var reg = /.+/;
            return commonValidator(reg, item);
        },
        email: function(item) {
            var reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
            return commonValidator(reg, item);
        },
        phone: function(item) {
            var reg = /^((\(\d{3}\))|(\d{3}\-))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}$/;
            return commonValidator(reg, item);
        },
        mobile: function(item) {
            var reg = /^(0|86|17951)?(13[0-9]|15[012356789]|17[0678]|18[0-9]|14[57])[0-9]{8}$/;
            return commonValidator(reg, item);
        },
        url: function(item) {
            var reg = /^http:\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"\"])*$/;
            return commonValidator(reg, item);
        },
        idCard: function(item) {
            var reg = /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{4}$/;
            return commonValidator(reg, item);
        },
        card: function(item, type) {
            //新增匹配类型的验证，身份证添加校验规则 type=1 代表身份证 0代表护照
            if (type == 1) {
                return checkIdCard(item);
            } else if (type == 2) {
                //这个正则等待验证,目前只验证非空了
                var reg = /.+/;
                //var reg=/^1[45][0-9]{7}|G[0-9]{8}|P[0-9]{7}|S[0-9]{7,8}|D[0-9]+$/;
                return commonValidator(reg, item);
            }
        },
        currency: function(item) {
            var reg = /^\d+(\.\d+)?$/;
            return commonValidator(reg, item);
        },
        number: function(item, digit) {
            if (digit) {
                var reg = "^\\d{" + digit + "}$";
                reg = new RegExp(reg);
            } else {
                var reg = /^\d+$/;
            }
            return commonValidator(reg, item);
        },
        zipCode: function(item) {
            var reg = /^\d+$/;
            return commonValidator(reg, item);
        },
        qq: function(item) {
            var reg = /^[1-9]\d{4,8}$/;
            return commonValidator(reg, item);
        },
        integer: function(item) {
            var reg = /^[-\+]?\d+$/;
            return commonValidator(reg, item);
        },
        "double": function(item) {
            var reg = /^[-\+]?\d+(\.\d+)?$/;
            return commonValidator(reg, item);
        },
        english: function(item) {
            var reg = /^[A-Za-z]([A-Za-z]|\s)+[A-Za-z]$/;
            return commonValidator(reg, item);
        },
        chinese: function(item) {
            var reg = /^[\u0391-\uFFE5]+$/;
            return commonValidator(reg, item);
        },
        chineseOrEnglish: function(item) {
            if (!!this.english(item) && !this.chinese(item) || !this.english(item) && !!this.chinese(item)) {
                return true;
            } else {
                return false;
            }
        },
        unSafe: function(item) {
            var reg = /^(([A-Z]*|[a-z]*|\d*|[-_\~!@#\$%\^&\*\.\(\)\[\]\{\}<>\?\\\/\'\"]*)|.{0,5})$|\s/;
            return commonValidator(reg, item);
        },
        isSafe: function(item) {
            return !this.unSafe(item);
        },
        between: function(item, min, max) {
            if (typeof item != "number") {
                throw new Error("错误");
            }
            return item > min && item < max;
        },
        isDate: function(item, formatString) {
            return isDate(item, formatString);
        }
    };
    validator.msg = {
        require: "不能为空",
        email: "必须为邮箱",
        phone: "必须为固定电话号码",
        mobile: "必须为手机号码",
        url: "必须为url链接",
        idCard: "必须为身份证号码",
        currency: "必须为货币"
    };
    return validator;
});

define("util/linkcfg/interfaceurl", [], function(require, exports) {
    var client_suffix = "?plt=clt";
    var redirectiUrl = {
        registration: "http://chang.pptv.com/pc/registration",
        registrationComplete: "http://chang.pptv.com/pc/registration/pg_complete",
        usercenter: "http://passport.pptv.com/usercenter.aspx",
        oneSingTab: "http://passport.pptv.com/v2/profile/yichangchengming.jsp",
        upload: "http://chang.pptv.com/pc/upload",
        contract_client: "http://w2c.pptv.com/p/zt.chang.pptv.com/news/protocol/17551401.html",
        contract_pc: "http://zt.chang.pptv.com/news/protocol/17551401.html"
    };
    // chackSign 确认是否报名
    var interfaceUrl = {
        checkSign: "http://api.chang.pptv.com/api/checksign",
        phonetoken: "http://api.chang.pptv.com/api/phonetoken",
        sign: "http://api.chang.pptv.com/api/sign",
        voteCollection: "http://api.cdn.vote.pptv.com/vote/collection",
        videoRank: "http://chang.pptv.com/api/video_rank",
        gettreadmill: "http://api.cdn.chang.pptv.com/api/gettreadmill",
        speed: "http://chang.pptv.com/api/speed",
        singList: "http://api.cdn.chang.pptv.com/api/singList",
        uploadCommit: "http://api.chang.pptv.com/api/cimmit_video",
        tagMarquee: "http://chang.pptv.com/api/rank_list",
        PKList_pc: "http://api.cdn.chang.pptv.com/api/PKList_pc",
        reward: "http://chang.pptv.com/api/reward",
        videoList: "http://chang.pptv.com/api/video_list",
        pklistAll: "http://chang.pptv.com/api/pk",
        concertAll: "http://chang.pptv.com/api/concert",
        goldlist: "http://chang.pptv.com/api/sprint_players",
        matchResult: "http://chang.pptv.com/api/match_result",
        goldExtra: "http://chang.pptv.com/api/pg_sprint_players_extra"
    };
    var commonUrl = {
        pc: {
            player: "http://chang.pptv.com/pc/player/",
            suffix: ""
        },
        clt: {
            player: "http://chang.pptv.com/pc/player/",
            suffix: "plt=clt"
        },
        app: {
            player: "http://chang.pptv.com/app/player/",
            suffix: "type=app"
        },
        h5: {
            player: "http://chang.pptv.com/app/player/",
            suffix: "type=share"
        },
        ipad: {
            player: "http://chang.pptv.com/ipad/player/",
            suffix: "type=app"
        }
    };
    return {
        redirect: redirectiUrl,
        "interface": interfaceUrl,
        commonUrl: commonUrl
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

define("app/pc/personcenter/iframeUpload", [ "core/jquery/1.8.3/jquery", "util/loader/loader", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports) {
    //设置domain
    document.domain = "pptv.com";
    var $ = require("core/jquery/1.8.3/jquery");
    var loader = require("util/loader/loader");
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

define("app/pc/personcenter/dropdownSelect", [ "app/pc/personcenter/dropdown", "core/jquery/1.8.3/jquery", "app/pc/personcenter/mediator", "util/scroller/scroller", "core/underscore/1.8.3/underscore", "util/event/event-mouse-wheel", "app/pc/personcenter/citydrop" ], function(require, exports) {
    var dropdown = require("app/pc/personcenter/dropdown");
    var $ = require("core/jquery/1.8.3/jquery");
    function dropdownSelect(options) {
        var defaults = {
            container: ".dropdown-group",
            item: ".input-dropdown"
        };
        this.opt = $.extend({}, defaults, options);
        this.container = $(this.opt.container);
        this.group = this.container.find(this.opt.item);
        this.groupArr = [];
        if (!this.opt.groupDataArr) {
            var arr = require("app/pc/personcenter/citydrop");
            this.groupDataArr = arr;
        } else {
            this.groupDataArr = this.opt.groupDataArr;
        }
        if (typeof this.opt.getGroupval == "function") {
            this.getGroupval = this.opt.getGroupval;
        }
        this.init();
    }
    $.extend(dropdownSelect.prototype, {
        init: function() {
            var self = this;
            this.group.each(function() {
                var tempDropDown = dropdown.create({
                    container: this,
                    groupDataArr: self.groupDataArr,
                    dropIcon: self.opt.dropIcon
                });
                self.groupArr.push(tempDropDown);
            });
            var len = this.groupArr.length;
            for (var i = 0; i < len; i++) {
                if (i == len - 1) {
                    this.groupArr[i].nextDropdown = null;
                } else {
                    this.groupArr[i].nextDropdown = this.groupArr[i + 1];
                }
                if (i == 0) {
                    this.groupArr[i].prevDropdown = null;
                } else {
                    this.groupArr[i].prevDropdown = this.groupArr[i - 1];
                }
            }
            !!this.groupArr[0] && this.groupArr[0].reset();
        },
        getGroupval: function(separator) {
            var resultArr = [];
            for (var i = 0; i < this.groupArr.length; i++) {
                //console.log(this.groupArr[i]);
                resultArr.push(this.groupArr[i].curval.text());
            }
            return separator ? resultArr.join(separator) : resultArr.join("");
        }
    });
    exports.create = function(options) {
        return new dropdownSelect(options);
    };
});

define("app/pc/personcenter/dropdown", [ "core/jquery/1.8.3/jquery", "app/pc/personcenter/mediator", "util/scroller/scroller", "core/underscore/1.8.3/underscore", "util/event/event-mouse-wheel" ], function(require, module, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var mediator = require("app/pc/personcenter/mediator");
    mediator.installTo(dropdown.prototype);
    require("util/scroller/scroller");
    //ie6 bug fix
    var IE6 = !window.XMLHttpRequest;
    function dropdown(options) {
        var defaults = {
            container: ".input-dropdown",
            dropIcon: ".dropdown-icon",
            expandWrap: ".dropdown-expand",
            selectItem: "li",
            activeClass: "active",
            hoverClass: "hover-active",
            curval: ".curval",
            maxHeight: "300",
            dataOpt: "",
            animate: true
        };
        this.opt = $.extend({}, defaults, options);
        this.container = $(this.opt.container);
        this.dropIcon = this.container.find(this.opt.dropIcon);
        this.expandWrap = this.container.find(this.opt.expandWrap);
        this.curval = this.container.find(this.opt.curval);
        this.curIndex = 0;
        // 关联下一个dropdown
        this.nextDropdown = null;
        // 关联前一个dropdown
        this.prevDropdown = null;
        this.scroller = null;
        this.isopen = false;
        var doc = $(document);
        var self = this;
        this.on("open", function() {
            //todo
            var tempNextDropDown = this.nextDropdown;
            while (!!tempNextDropDown) {
                tempNextDropDown.trigger("hide");
                tempNextDropDown = tempNextDropDown.nextDropdown;
            }
            var tempPrevDropDown = this.prevDropdown;
            while (!!tempPrevDropDown) {
                tempPrevDropDown.trigger("hide");
                tempPrevDropDown = tempPrevDropDown.prevDropdown;
            }
            //重置hover的状态
            self.expandWrap.find("." + self.opt.hoverClass).removeClass(self.opt.hoverClass);
            self.show();
            self.isopen = true;
            doc.on("click.dropdown", function(e) {
                var target = $(e.target);
                var tempClass = self.opt.container;
                if (typeof tempClass == "object") {
                    tempClass = defaults.container;
                }
                if (target.parents(tempClass).length == 0) {
                    self.trigger("hide");
                    doc.off("click.dropdown");
                }
            });
        });
        this.on("hide", function() {
            self.hide();
            self.isopen = false;
            doc.off("click.dropdown");
        });
        this.container.on("click", this.opt.dropIcon, function(e) {
            self.isopen ? self.trigger("hide") : self.trigger("open");
        });
        this.on("reset", function(searchVal) {
            self.reset(searchVal);
        });
        this.container.on("click", this.opt.selectItem, function() {
            var obj = $(this);
            var searchVal = obj.html();
            var activeClass = self.opt.activeClass;
            var tempIndex = obj.index();
            if (self.curIndex == tempIndex) {
                self.trigger("hide");
                return false;
            }
            self.curIndex = tempIndex;
            obj.siblings().removeClass(activeClass);
            obj.addClass(activeClass);
            self.trigger("hide");
            self.curval.html(searchVal);
            self.curval.attr("title", searchVal);
            var dataOpt = self.opt.dataOpt;
            if (dataOpt) {
                self.curval.attr(dataOpt, obj.attr(dataOpt));
            }
            self.request("afterSelect", searchVal);
            self.nextDropdown && self.nextDropdown.trigger("reset", searchVal);
        });
        this.container.on("mouseenter", this.opt.selectItem, function(e) {
            var obj = $(this);
            var activeClass = self.opt.hoverClass;
            obj.siblings().removeClass(activeClass);
            obj.addClass(activeClass);
        });
    }
    $.extend(dropdown.prototype, {
        show: function() {
            var option = {
                wheelPixel: 5,
                maxHeight: this.opt.maxHeight,
                horizontal: false,
                autoWrap: false
            };
            if (!this.opt.animate) {
                this.expandWrap.stop(true, true);
                this.expandWrap.css({
                    visibility: "hidden",
                    display: "block"
                });
                var tempHeight = this.expandWrap.find("ul").height();
                if (this.scroller == null && tempHeight > this.opt.maxHeight) {
                    this.scroller = this.expandWrap.ppScroller(option).scroll();
                    var items = this.expandWrap.find(this.opt.selectItem);
                    this.scroller.scrollTo(items.eq(this.curIndex).position().top);
                }
                this.expandWrap.css({
                    visibility: "visible",
                    display: "block"
                });
            } else {
                this.expandWrap.stop(true, true);
                this.expandWrap.css({
                    visibility: "hidden",
                    display: "block"
                });
                var tempHeight = this.expandWrap.find("ul").height();
                if (this.scroller == null && tempHeight > this.opt.maxHeight) {
                    this.scroller = this.expandWrap.ppScroller(option).scroll();
                    var items = this.expandWrap.find(this.opt.selectItem);
                    this.scroller.scrollTo(items.eq(this.curIndex).position().top);
                }
                this.expandWrap.css({
                    visibility: "visible",
                    display: "none"
                });
                this.expandWrap.fadeIn();
            }
        },
        hide: function() {
            var self = this;
            if (!this.opt.animate) {
                this.expandWrap.addClass("hidden");
            } else {
                this.expandWrap.stop(true, true).fadeOut();
            }
        },
        reset: function(searchVal) {
            //模板需要优化
            var searchList = [];
            var tempPrev = this.prevDropdown;
            while (tempPrev != null) {
                searchList.unshift(tempPrev.curval.html());
                tempPrev = tempPrev.prevDropdown;
            }
            this.empty();
            var tempHtml = "<ul>";
            var tempCount = 0;
            this.curIndex = 0;
            !!this.scroller && !this.scroller.destory();
            this.scroller = null;
            if (searchList.length == 0) {
                //第一个tab
                var tempVal = this.curval.html();
                for (key in this.opt.groupDataArr) {
                    if (tempVal == "" && tempCount == 0) {
                        tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                        this.curval.html(key);
                        this.curval.attr("title", key);
                    } else {
                        if (tempVal == key) {
                            tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                            this.curval.html(key);
                            this.curval.attr("title", key);
                            //console.log('count',tempCount);
                            this.curIndex = tempCount;
                        } else {
                            tempHtml += "<li>" + key + "</li>";
                        }
                    }
                    tempCount++;
                }
                tempHtml += "</ul>";
                this.expandWrap.html(tempHtml);
            } else {
                var finalval = this.opt.groupDataArr;
                for (var i = 0; i < searchList.length; i++) {
                    finalval = finalval[searchList[i]];
                }
                if ($.isArray(finalval)) {
                    //判断生日类型
                    var isSpec = false;
                    if (searchList[1] == "02") {
                        var validateVal = searchList[0];
                        if (validateVal % 4 == 0 && validateVal % 100 != 0 || validateVal % 400 == 0) {
                            isSpec = true;
                        }
                    }
                    for (var i = 0; i < finalval.length; i++) {
                        if (i == 0) {
                            tempHtml += '<li class="' + this.opt.activeClass + '">' + finalval[i] + "</li>";
                            this.curval.html(finalval[i]);
                            this.curval.attr("title", finalval[i]);
                        } else {
                            tempHtml += "<li>" + finalval[i] + "</li>";
                        }
                    }
                    if (isSpec) {
                        tempHtml += "<li>" + 29 + "</li>";
                    }
                    tempHtml += "</ul>";
                    this.expandWrap.html(tempHtml);
                    if (this.container.hasClass("hidden")) {
                        this.container.removeClass("hidden");
                    }
                } else if (typeof finalval == "undefined") {
                    tempHtml += "</ul>";
                    this.curval.html("");
                    this.curval.removeAttr("title");
                    this.container.addClass("hidden");
                } else {
                    var isNum = false;
                    for (var key in finalval) {
                        if (!isNaN(parseInt(key))) {
                            isNum = true;
                            break;
                        }
                    }
                    if (!isNum) {
                        for (var key in finalval) {
                            if (tempCount == 0) {
                                tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                                this.curval.html(key);
                                this.curval.attr("title", key);
                            } else {
                                tempHtml += "<li>" + key + "</li>";
                            }
                            tempCount++;
                        }
                    } else {
                        var resultArr = [];
                        for (var key in finalval) {
                            resultArr.push(key);
                        }
                        resultArr.sort(function(a, b) {
                            return parseInt(a, 10) - parseInt(b, 10);
                        });
                        for (var i = 0; i < resultArr.length; i++) {
                            if (i == 0) {
                                tempHtml += '<li class="' + this.opt.activeClass + '">' + resultArr[i] + "</li>";
                                this.curval.html(resultArr[i]);
                                this.curval.attr("title", resultArr[i]);
                            } else {
                                tempHtml += "<li>" + resultArr[i] + "</li>";
                            }
                        }
                    }
                    tempHtml += "</ul>";
                    this.expandWrap.html(tempHtml);
                    if (this.container.hasClass("hidden")) {
                        this.container.removeClass("hidden");
                    }
                }
            }
            if (!!IE6) {
                var containerWidth = this.container.width();
                if (this.expandWrap.width() < containerWidth) {
                    this.expandWrap.width(containerWidth);
                }
            }
            if (this.nextDropdown != null) {
                this.nextDropdown.reset();
            }
        },
        empty: function() {
            this.expandWrap.html("");
        },
        request: function(type) {
            if (typeof this.opt[type] == "function") {
                this.opt[type].apply(this, arguments);
            }
        }
    });
    return {
        create: function(options) {
            return new dropdown(options);
        }
    };
});

define("app/pc/personcenter/mediator", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), slice = [].slice, separator = /\s+/, protos;
    // 根据条件过滤出事件handlers.
    function findHandlers(arr, name, callback, context) {
        return $.grep(arr, function(handler) {
            return handler && (!name || handler.e === name) && (!callback || handler.cb === callback || handler.cb._cb === callback) && (!context || handler.ctx === context);
        });
    }
    function eachEvent(events, callback, iterator) {
        // 不支持对象，只支持多个event用空格隔开
        $.each((events || "").split(separator), function(_, key) {
            iterator(key, callback);
        });
    }
    function triggerHanders(events, args) {
        var stoped = false, i = -1, len = events.length, handler;
        while (++i < len) {
            handler = events[i];
            if (handler.cb.apply(handler.ctx2, args) === false) {
                stoped = true;
                break;
            }
        }
        return !stoped;
    }
    protos = {
        on: function(name, callback, context) {
            var me = this, set;
            if (!callback) {
                return this;
            }
            set = this._events || (this._events = []);
            eachEvent(name, callback, function(name, callback) {
                var handler = {
                    e: name
                };
                handler.cb = callback;
                handler.ctx = context;
                handler.ctx2 = context || me;
                handler.id = set.length;
                set.push(handler);
            });
            return this;
        },
        once: function(name, callback, context) {
            var me = this;
            if (!callback) {
                return me;
            }
            eachEvent(name, callback, function(name, callback) {
                var once = function() {
                    me.off(name, once);
                    return callback.apply(context || me, arguments);
                };
                once._cb = callback;
                me.on(name, once, context);
            });
            return me;
        },
        off: function(name, cb, ctx) {
            var events = this._events;
            if (!events) {
                return this;
            }
            if (!name && !cb && !ctx) {
                this._events = [];
                return this;
            }
            eachEvent(name, cb, function(name, cb) {
                $.each(findHandlers(events, name, cb, ctx), function() {
                    delete events[this.id];
                });
            });
            return this;
        },
        trigger: function(type) {
            var args, events, allEvents;
            if (!this._events || !type) {
                return this;
            }
            args = slice.call(arguments, 1);
            events = findHandlers(this._events, type);
            allEvents = findHandlers(this._events, "all");
            return triggerHanders(events, args) && triggerHanders(allEvents, arguments);
        }
    };
    return $.extend({
        installTo: function(obj) {
            return $.extend(obj, protos);
        }
    }, protos);
});

/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *     $('#selecter').ppScroll().scroll();
 * @TODO
 *     return scroller document with event binding.
  **/
define("util/scroller/scroller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "util/event/event-mouse-wheel" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    require("util/event/event-mouse-wheel");
    require("util/scroller/scroller.css");
    var SHASH = {};
    //自定义滚动轴
    $.fn.ppScroller = function(option) {
        var _this = $(this);
        var opt = $.extend({
            maxHeight: 0,
            maxWidth: 0,
            horizontal: false,
            showScroller: true,
            wheelPixel: 8,
            animate: false,
            mouseWheel: true,
            autoWrap: false,
            slideBlockSelector: null,
            onScroll: function(index, scroll, location) {}
        }, option);
        var _onScroll = opt.onScroll;
        var _a, _b, _range;
        /**
         * [onScroll 滚动监听 - fix 负数问题]
         * @param  {[int]} a     [滚动序号]
         * @param  {[int]} b     [滚动距离]
         * @param  {[int]} range [可滚动距离]
         */
        opt.onScroll = function(a, b, range) {
            var a = parseInt(Math.abs(a));
            var b = parseInt(Math.abs(b));
            var range = Math.abs(b) === 0 ? 0 : Math.abs(b) / range;
            if ((a !== _a || b !== _b || range !== _range) && !isNaN(a + b + range)) {
                _onScroll(a, b, range);
                _a = a;
                _b = b;
                _range = range;
            }
        };
        /* 动画处理 */
        var doChange = opt.animate ? function($obj, attr, v) {
            var a = {};
            a[attr] = v;
            $obj.stop()["animate"](a);
        } : function($obj, attr, v) {
            $obj["css"](attr, v);
        };
        var max = !opt.horizontal ? opt.maxHeight || _this.height() : opt.maxWidth || _this.width();
        return _this.each(function() {
            var sid = parseInt(Math.random() * 1e6);
            if (!_this.attr("data-scroller-sid")) {
                _this.attr("data-scroller-sid", sid);
            } else {
                sid = _this.attr("data-scroller-sid");
                SHASH[sid].destory();
            }
            SHASH[sid] = _this;
            var Handler = {};
            var scrollHandler = $.Callbacks();
            _this.addClass("pp-scroller-container");
            if (opt.horizontal) {
                _this.addClass("pp-scroller-container-h");
            }
            var scroller;
            var inner, $temp;
            if (opt.slideBlockSelector) {
                inner = _this.find(opt.slideBlockSelector);
            } else {
                inner = _this.children(":first");
            }
            if (opt.autoWrap) {
                $temp = $("<div>").appendTo(_this);
                $temp.append(inner);
                inner = $temp;
            }
            inner.eq(0).css({
                position: "relative",
                height: inner.eq(0).height()
            });
            /* 计算宽度 */
            if (opt.horizontal) {
                var width = 0;
                inner.children().each(function(i, n) {
                    width += $(n).outerWidth(true);
                });
                inner.width(width);
            }
            /* 移动端使用默认的滚动轴 */
            if (isMobile) {
                _this.height(max).css(!opt.horizontal ? {
                    overflowY: "scroll",
                    overflowX: "hidden"
                } : {
                    overflowX: "scroll",
                    overflowY: "hidden"
                });
                _this.scroll = _this.destory = this.pause = function() {
                    return _this;
                };
                _this.scrollTo = function(xy, cb) {
                    var xy = parseInt(xy);
                    if (!opt.horizontal) {
                        _this.scrollTop(xy);
                    } else {
                        _this.scrollLeft(xy);
                    }
                    cb && cb();
                    return _this;
                };
                _this.scrollTo1 = function(i, cb) {
                    var xy = parseInt(opt.wheelPixel * i);
                    if (!opt.horizontal) {
                        _this.scrollTop(xy);
                    } else {
                        _this.scrollLeft(xy);
                    }
                    cb && cb();
                    return _this;
                };
                var scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max;
                var spaceing = parseInt(scrollRange / opt.wheelPixel);
                // 间隔数
                _this.on("scroll", function(e) {
                    opt.onScroll(parseInt(scrollRange / opt.wheelPixel), this.scrollTop, scrollRange);
                });
                // opt.onScroll = function(a, b, range){
                //     _onScroll(Math.abs(a), Math.abs(b), Math.abs(b) / range);
                // }
                return _this;
            }
            var offsetXY, // 鼠标按下按钮offset
            mouseXY, // 鼠标按下位置
            mkey = false, // 拖拽开关
            skey = false, // 初始化开关
            scale, // 容器 / 内容总宽高
            total, // 内容总宽高
            btn, // 滚动轴按钮
            scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max, spaceing = parseInt(scrollRange / opt.wheelPixel);
            var index = 0;
            /*
             * stop trigger de event handler when the scroller reach both sides;
             */
            if (opt.mouseWheel) {
                Handler.container_mousewheel = !opt.horizontal ? function(e, y) {
                    if (skey) {
                        index += y;
                        var top = -opt.wheelPixel * index;
                        if (index > 0) {
                            top = 0;
                            index = 0;
                        } else if (-index > spaceing) {
                            top = -max + inner.outerHeight();
                            index = -spaceing;
                        }
                        doChange(btn, "top", top * scale);
                        doChange(inner, "top", -top);
                        opt.onScroll(index, top, scrollRange);
                        return false;
                    }
                } : function(e, y) {
                    if (skey) {
                        index += y;
                        var left = -opt.wheelPixel * index;
                        if (index > 0) {
                            left = 0;
                            index = 0;
                        } else if (-index >= spaceing) {
                            left = -max + inner.outerWidth();
                            index = -spaceing;
                        }
                        doChange(btn, "left", left * scale);
                        doChange(inner, "left", -left);
                        opt.onScroll(index, left, scrollRange);
                        return false;
                    }
                };
                Handler.container_mousewheel_t = _this;
                _this.on("mousewheel", Handler.container_mousewheel);
            }
            scroller = $('<div class="pp-scroller">' + '<div style=""></div></div>');
            Handler.btn_mousedown = !opt.horizontal ? function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageY);
                offsetXY = parseInt($(this).position().top);
                return false;
            } : function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageX);
                offsetXY = parseInt($(this).position().left);
                return false;
            };
            btn = scroller.find("div").on("mousedown", Handler.btn_mousedown);
            Handler.btn_mousedown_t = btn;
            var btnWH;
            Handler.scroller_mousedown = !opt.horizontal ? function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageY);
                offsetXY = parseInt(mouseXY - scroller.offset().top - btnWH / 2);
                $(document).trigger("mousemove", [ e.pageY ]);
            } : function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageX);
                offsetXY = parseInt(mouseXY - scroller.offset().left - btnWH / 2);
                $(document).trigger("mousemove", [ e.pageX ]);
            };
            Handler.scroller_mousedown_t = scroller;
            scroller.appendTo(_this).on("mousedown", Handler.scroller_mousedown);
            Handler.document_mousemove = function(e, pageXY) {
                if (mkey) {
                    ss(parseInt((!opt.horizontal ? e.pageY : e.pageX) || pageXY));
                }
            };
            Handler.document_mousemove_t = $(document);
            Handler.document_mouseup = function(e) {
                mkey = false;
            };
            Handler.document_mouseup_t = $(document);
            Handler.document_selectstart = function(e) {
                if (mkey) {
                    e.preventDefault();
                }
            };
            Handler.document_selectstart_t = $(document);
            $(document).on("mousemove", Handler.document_mousemove).on("mouseup", Handler.document_mouseup).on("selectstart", Handler.document_selectstart);
            var offsetTop = parseInt($(_this).find(".pp-scroller").css("top")) / 2;
            var ss = !opt.horizontal ? function(pageY) {
                //                    console.log('btn',btn);
                var btnOffset = offsetXY + pageY - mouseXY;
                if (btnOffset <= 0) {
                    btnOffset = 0;
                } else if (btnOffset + parseInt(btn.outerHeight()) >= max - offsetTop) {
                    btnOffset = max - btn.outerHeight() - offsetTop;
                }
                index = -(btnOffset / scale / opt.wheelPixel);
                btn.css("top", btnOffset);
                inner.css("top", -btnOffset / scale);
                opt.onScroll(index, -btnOffset / scale, scrollRange);
            } : function(pageX) {
                var btnOffset = offsetXY + pageX - mouseXY;
                if (btnOffset <= 0) {
                    btnOffset = 0;
                } else if (btnOffset + parseInt(btn.outerWidth()) >= max) {
                    btnOffset = max - btn.outerWidth();
                }
                index = -(btnOffset / scale / opt.wheelPixel);
                btn.css("left", btnOffset);
                inner.css("left", -btnOffset / scale);
                opt.onScroll(index, -btnOffset / scale, scrollRange);
            };
            _this.scroll = function() {
                return function() {
                    _this.height("auto");
                    total = !opt.horizontal ? inner.height() : inner.width();
                    btn.css(!opt.horizontal ? "top" : "left", 0);
                    inner.css(!opt.horizontal ? "top" : "left", 0);
                    if (total <= max) {
                        skey = false;
                        scroller.hide();
                        if (!opt.horizontal) {
                            _this.height(max);
                        } else {
                            _this.width(max);
                        }
                    } else {
                        skey = true;
                        scale = max / total;
                        if (!opt.showScroller) {
                            scroller.css("visibility", "hidden");
                        }
                        if (!opt.horizontal) {
                            _this.height(max).css("overflow", "hidden");
                            scroller.show().height(max - 10).find("div").height(max * scale - 10);
                            inner.css("top", 0);
                        } else {
                            _this.width(max).css("overflow", "hidden");
                            scroller.show().width(max).find("div").width(max * scale);
                            inner.css("left", 0);
                        }
                    }
                    btnWH = !opt.horizontal ? btn.height() : btn.width();
                    return _this;
                };
            }();
            _this.scrollTo = function(xy, cb) {
                var xy = parseInt(xy);
                if (xy <= 0 || total < max) {
                    xy = 0;
                } else if (xy >= total - max) {
                    xy = total - max;
                }
                index = -(xy / opt.wheelPixel);
                doChange(btn, !opt.horizontal ? "top" : "left", xy * scale);
                doChange(inner, !opt.horizontal ? "top" : "left", -xy);
                opt.onScroll(index, -xy, scrollRange);
                cb && cb();
                return _this;
            };
            _this.scrollTo1 = function(i, cb) {
                var xy = parseInt(opt.wheelPixel * i);
                if (xy <= 0 || total < max) {
                    xy = 0;
                } else if (xy >= total - max) {
                    xy = total - max;
                }
                doChange(btn, !opt.horizontal ? "top" : "left", xy * scale);
                doChange(inner, !opt.horizontal ? "top" : "left", -xy);
                opt.onScroll(i, -xy, scrollRange);
                cb && cb();
                return _this;
            };
            _this.pause = Handler.pause;
            _this.destory = function() {
                for (var n in Handler) {
                    if (!/_t$/.test(n) && Handler[n + "_t"]) {
                        Handler[n + "_t"].off(n.replace(/.+_/, ""), Handler[n]);
                        Handler[n + "_t"] = null;
                        Handler[n] = null;
                    }
                }
                if (!opt.horizontal) {
                    _this.height("");
                } else {
                    _this.width("");
                }
                scroller.remove();
            };
            return _this;
        });
    };
});

/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *      $('#selecter').ppScroll().scroll();
 **/
define("util/event/event-mouse-wheel", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    // 鼠标中键
    (function($) {
        var types = [ "DOMMouseScroll", "mousewheel" ];
        $.event.special.mousewheel = {
            setup: function() {
                if (this.addEventListener) {
                    for (var i = types.length; i; ) {
                        this.addEventListener(types[--i], handler, false);
                    }
                } else {
                    this.onmousewheel = handler;
                }
            },
            teardown: function() {
                if (this.removeEventListener) {
                    for (var i = types.length; i; ) {
                        this.removeEventListener(types[--i], handler, false);
                    }
                } else {
                    this.onmousewheel = null;
                }
            }
        };
        $.fn.extend({
            mousewheel: function(fn) {
                return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
            },
            unmousewheel: function(fn) {
                return this.unbind("mousewheel", fn);
            }
        });
        function handler(event) {
            var orgEvent = event || window.event, args = [].slice.call(arguments, 1), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
            event = $.event.fix(orgEvent);
            event.type = "mousewheel";
            // Old school scrollwheel delta
            if (event.originalEvent.wheelDelta) {
                delta = event.originalEvent.wheelDelta / 120;
            }
            if (event.originalEvent.detail) {
                delta = -event.originalEvent.detail / 3;
            }
            // New school multidimensional scroll (touchpads) deltas
            deltaY = delta;
            // Gecko
            if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                deltaY = 0;
                deltaX = -1 * delta;
            }
            // Webkit
            if (orgEvent.wheelDeltaY !== undefined) {
                deltaY = orgEvent.wheelDeltaY / 120;
            }
            if (orgEvent.wheelDeltaX !== undefined) {
                deltaX = -1 * orgEvent.wheelDeltaX / 120;
            }
            // Add event and delta to the front of the arguments
            args.unshift(event, delta, deltaX, deltaY);
            return $.event.handle.apply(this, args);
        }
    })($);
});

define("util/scroller/scroller.css", [], function() {
    seajs.importStyle(".pp-scroller-container{position:relative}.pp-scroller{display:none;box-sizing:border-box;width:8px;height:8px;border-radius:2px;background:#e6e6e6;position:absolute;right:0;top:0;overflow:hidden}.pp-scroller div{position:relative;box-sizing:border-box;border-radius:2px;width:8px;height:8px;background:#c5c5c5;border:1px solid #b4b4b4;position:absolute;right:0;top:0}.pp-scroller-container-h .pp-scroller{top:auto;bottom:0}.pp-scroller-container::-webkit-scrollbar{width:8px;background:#eee}.pp-scroller-container::-webkit-scrollbar-thumb{background:#ccc;border-radius:15px}.pp-scroller-container::-webkit-scrollbar-button{display:none}.pp-scroller-container::-webkit-scrollbar-track-piece{background:transparent}");
});

define("app/pc/personcenter/citydrop", [], {
    "北京市": [ "东城区", "西城区", "朝阳区", "丰台区", "石景山区", "海淀区", "门头沟区", "房山区", "通州区", "顺义区", "昌平区", "大兴区", "怀柔区", "平谷区", "密云县", "延庆县" ],
    "天津市": [ "和平区", "河东区", "河西区", "南开区", "河北区", "红桥区", "塘沽区", "汉沽区", "大港区", "东丽区", "西青区", "津南区", "北辰区", "武清区", "宝坻区", "宁河县", "静海县", "蓟县" ],
    "上海市": [ "黄浦区", "卢湾区", "徐汇区", "长宁区", "静安区", "普陀区", "闸北区", "虹口区", "杨浦区", "闵行区", "宝山区", "嘉定区", "浦东新区", "金山区", "松江区", "青浦区", "南汇区", "奉贤区", "崇明县" ],
    "重庆市": [ "万州区", "涪陵区", "渝中区", "大渡口区", "江北区", "沙坪坝区", "九龙坡区", "南岸区", "北碚区", "万盛区", "双桥区", "渝北区", "巴南区", "黔江区", "长寿区", "江津区", "合川区", "永川区", "南川区", "綦江县", "潼南县", "铜梁县", "大足县", "荣昌县", "璧山县", "梁平县", "城口县", "丰都县", "垫江县", "武隆县", "忠县", "开县", "云阳县", "奉节县", "巫山县", "巫溪县", "石柱土家族自治县", "秀山土家族苗族自治县", "酉阳土家族苗族自治县", "彭水苗族土家族自治县" ],
    "河北省": {
        "石家庄市": [ "长安区", "桥东区", "桥西区", "新华区", "井陉矿区", "裕华区", "井陉县", "正定县", "栾城县", "行唐县", "灵寿县", "高邑县", "深泽县", "赞皇县", "无极县", "平山县", "元氏县", "赵县", "辛集市", "藁城市", "晋州市", "新乐市", "鹿泉市" ],
        "唐山市": [ "路南区", "路北区", "古冶区", "开平区", "丰南区", "丰润区", "滦县", "滦南县", "乐亭县", "迁西县", "玉田县", "唐海县", "遵化市", "迁安市" ],
        "秦皇岛市": [ "海港区", "山海关区", "北戴河区", "青龙满族自治县", "昌黎县", "抚宁县", "卢龙县" ],
        "邯郸市": [ "邯山区", "丛台区", "复兴区", "峰峰矿区", "邯郸县", "临漳县", "成安县", "大名县", "涉县", "磁县", "肥乡县", "永年县", "邱县", "鸡泽县", "广平县", "馆陶县", "魏县", "曲周县", "武安市" ],
        "邢台市": [ "桥东区", "桥西区", "邢台县", "临城县", "内丘县", "柏乡县", "隆尧县", "任县", "南和县", "宁晋县", "巨鹿县", "新河县", "广宗县", "平乡县", "威县", "清河县", "临西县", "南宫市", "沙河市" ],
        "保定市": [ "新市区", "北市区", "南市区", "满城县", "清苑县", "涞水县", "阜平县", "徐水县", "定兴县", "唐县", "高阳县", "容城县", "涞源县", "望都县", "安新县", "易县", "曲阳县", "蠡县", "顺平县", "博野县", "雄县", "涿州市", "定州市", "安国市", "高碑店市" ],
        "张家口市": [ "桥东区", "桥西区", "宣化区", "下花园区", "宣化县", "张北县", "康保县", "沽源县", "尚义县", "蔚县", "阳原县", "怀安县", "万全县", "怀来县", "涿鹿县", "赤城县", "崇礼县" ],
        "承德市": [ "双桥区", "双滦区", "鹰手营子矿区", "承德县", "兴隆县", "平泉县", "滦平县", "隆化县", "丰宁满族自治县", "宽城满族自治县", "围场满族蒙古族自治县" ],
        "沧州市": [ "新华区", "运河区", "沧县", "青县", "东光县", "海兴县", "盐山县", "肃宁县", "南皮县", "吴桥县", "献县", "孟村回族自治县", "泊头市", "任丘市", "黄骅市", "河间市" ],
        "廊坊市": [ "安次区", "广阳区", "固安县", "永清县", "香河县", "大城县", "文安县", "大厂回族自治县", "霸州市", "三河市" ],
        "衡水市": [ "桃城区", "枣强县", "武邑县", "武强县", "饶阳县", "安平县", "故城县", "景县", "阜城县", "冀州市", "深州市" ]
    },
    "山西省": {
        "太原市": [ "小店区", "迎泽区", "杏花岭区", "尖草坪区", "万柏林区", "晋源区", "清徐县", "阳曲县", "娄烦县", "古交市" ],
        "大同市": [ "城区", "矿区", "南郊区", "新荣区", "阳高县", "天镇县", "广灵县", "灵丘县", "浑源县", "左云县", "大同县" ],
        "阳泉市": [ "城区", "矿区", "郊区", "平定县", "盂县" ],
        "长治市": [ "城区", "郊区", "长治县", "襄垣县", "屯留县", "平顺县", "黎城县", "壶关县", "长子县", "武乡县", "沁县", "沁源县", "潞城市" ],
        "晋城市": [ "城区", "沁水县", "阳城县", "陵川县", "泽州县", "高平市" ],
        "朔州市": [ "朔城区", "平鲁区", "山阴县", "应县", "右玉县", "怀仁县" ],
        "晋中市": [ "榆次区", "榆社县", "左权县", "和顺县", "昔阳县", "寿阳县", "太谷县", "祁县", "平遥县", "灵石县", "介休市" ],
        "运城市": [ "盐湖区", "临猗县", "万荣县", "闻喜县", "稷山县", "新绛县", "绛县", "垣曲县", "夏县", "平陆县", "芮城县", "永济市", "河津市" ],
        "忻州市": [ "忻府区", "定襄县", "五台县", "代县", "繁峙县", "宁武县", "静乐县", "神池县", "五寨县", "岢岚县", "河曲县", "保德县", "偏关县", "原平市" ],
        "临汾市": [ "尧都区", "曲沃县", "翼城县", "襄汾县", "洪洞县", "古县", "安泽县", "浮山县", "吉县", "乡宁县", "大宁县", "隰县", "永和县", "蒲县", "汾西县", "侯马市", "霍州市" ],
        "吕梁市": [ "离石区", "文水县", "交城县", "兴县", "临县", "柳林县", "石楼县", "岚县", "方山县", "中阳县", "交口县", "孝义市", "汾阳市" ]
    },
    "内蒙古自治区": {
        "呼和浩特市": [ "新城区", "回民区", "玉泉区", "赛罕区", "土默特左旗", "托克托县", "和林格尔县", "清水河县", "武川县" ],
        "包头市": [ "东河区", "昆都仑区", "青山区", "石拐区", "白云鄂博矿区", "九原区", "土默特右旗", "固阳县", "达尔罕茂明安联合旗" ],
        "乌海市": [ "海勃湾区", "海南区", "乌达区" ],
        "赤峰市": [ "红山区", "元宝山区", "松山区", "阿鲁科尔沁旗", "巴林左旗", "巴林右旗", "林西县", "克什克腾旗", "翁牛特旗", "喀喇沁旗", "宁城县", "敖汉旗" ],
        "通辽市": [ "科尔沁区", "科尔沁左翼中旗", "科尔沁左翼后旗", "开鲁县", "库伦旗", "奈曼旗", "扎鲁特旗", "霍林郭勒市" ],
        "鄂尔多斯市": [ "东胜区", "达拉特旗", "准格尔旗", "鄂托克前旗", "鄂托克旗", "杭锦旗", "乌审旗", "伊金霍洛旗" ],
        "呼伦贝尔市": [ "海拉尔区", "阿荣旗", "莫力达瓦达斡尔族自治旗", "鄂伦春自治旗", "鄂温克族自治旗", "陈巴尔虎旗", "新巴尔虎左旗", "新巴尔虎右旗", "满洲里市", "牙克石市", "扎兰屯市", "额尔古纳市", "根河市" ],
        "巴彦淖尔市": [ "临河区", "五原县", "磴口县", "乌拉特前旗", "乌拉特中旗", "乌拉特后旗", "杭锦后旗" ],
        "乌兰察布市": [ "集宁区", "卓资县", "化德县", "商都县", "兴和县", "凉城县", "察哈尔右翼前旗", "察哈尔右翼中旗", "察哈尔右翼后旗", "四子王旗", "丰镇市" ],
        "兴安盟": [ "乌兰浩特市", "阿尔山市", "科尔沁右翼前旗", "科尔沁右翼中旗", "扎赉特旗", "突泉县" ],
        "锡林郭勒盟": [ "二连浩特市", "锡林浩特市", "阿巴嘎旗", "苏尼特左旗", "苏尼特右旗", "东乌珠穆沁旗", "西乌珠穆沁旗", "太仆寺旗", "镶黄旗", "正镶白旗", "正蓝旗", "多伦县" ],
        "阿拉善盟": [ "阿拉善左旗", "阿拉善右旗", "额济纳旗" ]
    },
    "辽宁省": {
        "沈阳市": [ "和平区", "沈河区", "大东区", "皇姑区", "铁西区", "苏家屯区", "东陵区", "沈北新区", "于洪区", "辽中县", "康平县", "法库县", "新民市" ],
        "大连市": [ "中山区", "西岗区", "沙河口区", "甘井子区", "旅顺口区", "金州区", "长海县", "瓦房店市", "普兰店市", "庄河市" ],
        "鞍山市": [ "铁东区", "铁西区", "立山区", "千山区", "台安县", "岫岩满族自治县", "海城市" ],
        "抚顺市": [ "新抚区", "东洲区", "望花区", "顺城区", "抚顺县", "新宾满族自治县", "清原满族自治县" ],
        "本溪市": [ "平山区", "溪湖区", "明山区", "南芬区", "本溪满族自治县", "桓仁满族自治县" ],
        "丹东市": [ "元宝区", "振兴区", "振安区", "宽甸满族自治县", "东港市", "凤城市" ],
        "锦州市": [ "古塔区", "凌河区", "太和区", "黑山县", "义县", "凌海市", "北镇市" ],
        "营口市": [ "站前区", "西市区", "鲅鱼圈区", "老边区", "盖州市", "大石桥市" ],
        "阜新市": [ "海州区", "新邱区", "太平区", "清河门区", "细河区", "阜新蒙古族自治县", "彰武县" ],
        "辽阳市": [ "白塔区", "文圣区", "宏伟区", "弓长岭区", "太子河区", "辽阳县", "灯塔市" ],
        "盘锦市": [ "双台子区", "兴隆台区", "大洼县", "盘山县" ],
        "铁岭市": [ "银州区", "清河区", "铁岭县", "西丰县", "昌图县", "调兵山市", "开原市" ],
        "朝阳市": [ "双塔区", "龙城区", "朝阳县", "建平县", "喀喇沁左翼蒙古族自治县", "北票市", "凌源市" ],
        "葫芦岛市": [ "连山区", "龙港区", "南票区", "绥中县", "建昌县", "兴城市" ]
    },
    "吉林省": {
        "长春市": [ "南关区", "宽城区", "朝阳区", "二道区", "绿园区", "双阳区", "农安县", "九台市", "榆树市", "德惠市" ],
        "吉林市": [ "昌邑区", "龙潭区", "船营区", "丰满区", "永吉县", "蛟河市", "桦甸市", "舒兰市", "磐石市" ],
        "四平市": [ "铁西区", "铁东区", "梨树县", "伊通满族自治县", "公主岭市", "双辽市" ],
        "辽源市": [ "龙山区", "西安区", "东丰县", "东辽县" ],
        "通化市": [ "东昌区", "二道江区", "通化县", "辉南县", "柳河县", "梅河口市", "集安市" ],
        "白山市": [ "八道江区", "江源区", "抚松县", "靖宇县", "长白朝鲜族自治县", "临江市" ],
        "松原市": [ "宁江区", "前郭尔罗斯蒙古族自治县", "长岭县", "乾安县", "扶余县" ],
        "白城市": [ "洮北区", "镇赉县", "通榆县", "洮南市", "大安市" ],
        "延边朝鲜族自治州": [ "延吉市", "图们市", "敦化市", "珲春市", "龙井市", "和龙市", "汪清县", "安图县" ]
    },
    "黑龙江省": {
        "哈尔滨市": [ "道里区", "南岗区", "道外区", "平房区", "松北区", "香坊区", "呼兰区", "阿城区", "依兰县", "方正县", "宾县", "巴彦县", "木兰县", "通河县", "延寿县", "双城市", "尚志市", "五常市" ],
        "齐齐哈尔市": [ "龙沙区", "建华区", "铁锋区", "昂昂溪区", "富拉尔基区", "碾子山区", "梅里斯达斡尔族区", "龙江县", "依安县", "泰来县", "甘南县", "富裕县", "克山县", "克东县", "拜泉县", "讷河市" ],
        "鸡西市": [ "鸡冠区", "恒山区", "滴道区", "梨树区", "城子河区", "麻山区", "鸡东县", "虎林市", "密山市" ],
        "鹤岗市": [ "向阳区", "工农区", "南山区", "兴安区", "东山区", "兴山区", "萝北县", "绥滨县" ],
        "双鸭山市": [ "尖山区", "岭东区", "四方台区", "宝山区", "集贤县", "友谊县", "宝清县", "饶河县" ],
        "大庆市": [ "萨尔图区", "龙凤区", "让胡路区", "红岗区", "大同区", "肇州县", "肇源县", "林甸县", "杜尔伯特蒙古族自治县" ],
        "伊春市": [ "伊春区", "南岔区", "友好区", "西林区", "翠峦区", "新青区", "美溪区", "金山屯区", "五营区", "乌马河区", "汤旺河区", "带岭区", "乌伊岭区", "红星区", "上甘岭区", "嘉荫县", "铁力市" ],
        "佳木斯市": [ "向阳区", "前进区", "东风区", "郊区", "桦南县", "桦川县", "汤原县", "抚远县", "同江市", "富锦市" ],
        "七台河市": [ "新兴区", "桃山区", "茄子河区", "勃利县" ],
        "牡丹江市": [ "东安区", "阳明区", "爱民区", "西安区", "东宁县", "林口县", "绥芬河市", "海林市", "宁安市", "穆棱市" ],
        "黑河市": [ "爱辉区", "嫩江县", "逊克县", "孙吴县", "北安市", "五大连池市" ],
        "绥化市": [ "北林区", "望奎县", "兰西县", "青冈县", "庆安县", "明水县", "绥棱县", "安达市", "肇东市", "海伦市" ],
        "大兴安岭地区": [ "加格达奇区", "松岭区", "新林区", "呼中区", "呼玛县", "塔河县", "漠河县" ]
    },
    "江苏省": {
        "南京市": [ "玄武区", "白下区", "秦淮区", "建邺区", "鼓楼区", "下关区", "浦口区", "栖霞区", "雨花台区", "江宁区", "六合区", "溧水县", "高淳县" ],
        "无锡市": [ "崇安区", "南长区", "北塘区", "锡山区", "惠山区", "滨湖区", "江阴市", "宜兴市" ],
        "徐州市": [ "鼓楼区", "云龙区", "九里区", "贾汪区", "泉山区", "丰县", "沛县", "铜山县", "睢宁县", "新沂市", "邳州市" ],
        "常州市": [ "天宁区", "钟楼区", "戚墅堰区", "新北区", "武进区", "溧阳市", "金坛市" ],
        "苏州市": [ "沧浪区", "平江区", "金阊区", "虎丘区", "吴中区", "相城区", "常熟市", "张家港市", "昆山市", "吴江市", "太仓市" ],
        "南通市": [ "崇川区", "港闸区", "海安县", "如东县", "启东市", "如皋市", "通州市", "海门市" ],
        "连云港市": [ "连云区", "新浦区", "海州区", "赣榆县", "东海县", "灌云县", "灌南县" ],
        "淮安市": [ "清河区", "楚州区", "淮阴区", "清浦区", "涟水县", "洪泽县", "盱眙县", "金湖县" ],
        "盐城市": [ "亭湖区", "盐都区", "响水县", "滨海县", "阜宁县", "射阳县", "建湖县", "东台市", "大丰市" ],
        "扬州市": [ "广陵区", "邗江区", "维扬区", "宝应县", "仪征市", "高邮市", "江都市" ],
        "镇江市": [ "京口区", "润州区", "丹徒区", "丹阳市", "扬中市", "句容市" ],
        "泰州市": [ "海陵区", "高港区", "兴化市", "靖江市", "泰兴市", "姜堰市" ],
        "宿迁市": [ "宿城区", "宿豫区", "沭阳县", "泗阳县", "泗洪县" ]
    },
    "浙江省": {
        "杭州市": [ "上城区", "下城区", "江干区", "拱墅区", "西湖区", "滨江区", "萧山区", "余杭区", "桐庐县", "淳安县", "建德市", "富阳市", "临安市" ],
        "宁波市": [ "海曙区", "江东区", "江北区", "北仑区", "镇海区", "鄞州区", "象山县", "宁海县", "余姚市", "慈溪市", "奉化市" ],
        "温州市": [ "鹿城区", "龙湾区", "瓯海区", "洞头县", "永嘉县", "平阳县", "苍南县", "文成县", "泰顺县", "瑞安市", "乐清市" ],
        "嘉兴市": [ "南湖区", "秀洲区", "嘉善县", "海盐县", "海宁市", "平湖市", "桐乡市" ],
        "湖州市": [ "吴兴区", "南浔区", "德清县", "长兴县", "安吉县" ],
        "绍兴市": [ "越城区", "绍兴县", "新昌县", "诸暨市", "上虞市", "嵊州市" ],
        "金华市": [ "婺城区", "金东区", "武义县", "浦江县", "磐安县", "兰溪市", "义乌市", "东阳市", "永康市" ],
        "衢州市": [ "柯城区", "衢江区", "常山县", "开化县", "龙游县", "江山市" ],
        "舟山市": [ "定海区", "普陀区", "岱山县", "嵊泗县" ],
        "台州市": [ "椒江区", "黄岩区", "路桥区", "玉环县", "三门县", "天台县", "仙居县", "温岭市", "临海市" ],
        "丽水市": [ "莲都区", "青田县", "缙云县", "遂昌县", "松阳县", "云和县", "庆元县", "景宁畲族自治县", "龙泉市" ]
    },
    "安徽省": {
        "合肥市": [ "瑶海区", "庐阳区", "蜀山区", "包河区", "长丰县", "肥东县", "肥西县" ],
        "芜湖市": [ "镜湖区", "弋江区", "鸠江区", "三山区", "芜湖县", "繁昌县", "南陵县" ],
        "蚌埠市": [ "龙子湖区", "蚌山区", "禹会区", "淮上区", "怀远县", "五河县", "固镇县" ],
        "淮南市": [ "大通区", "田家庵区", "谢家集区", "八公山区", "潘集区", "凤台县" ],
        "马鞍山市": [ "金家庄区", "花山区", "雨山区", "当涂县" ],
        "淮北市": [ "杜集区", "相山区", "烈山区", "濉溪县" ],
        "铜陵市": [ "铜官山区", "狮子山区", "郊区", "铜陵县" ],
        "安庆市": [ "迎江区", "大观区", "宜秀区", "怀宁县", "枞阳县", "潜山县", "太湖县", "宿松县", "望江县", "岳西县", "桐城市" ],
        "黄山市": [ "屯溪区", "黄山区", "徽州区", "歙县", "休宁县", "黟县", "祁门县" ],
        "滁州市": [ "琅琊区", "南谯区", "来安县", "全椒县", "定远县", "凤阳县", "天长市", "明光市" ],
        "阜阳市": [ "颍州区", "颍东区", "颍泉区", "临泉县", "太和县", "阜南县", "颍上县", "界首市" ],
        "宿州市": [ "埇桥区", "砀山县", "萧县", "灵璧县", "泗县" ],
        "巢湖市": [ "居巢区", "庐江县", "无为县", "含山县", "和县" ],
        "六安市": [ "金安区", "裕安区", "寿县", "霍邱县", "舒城县", "金寨县", "霍山县" ],
        "亳州市": [ "谯城区", "涡阳县", "蒙城县", "利辛县" ],
        "池州市": [ "贵池区", "东至县", "石台县", "青阳县" ],
        "宣城市": [ "宣州区", "郎溪县", "广德县", "泾县", "绩溪县", "旌德县", "宁国市" ]
    },
    "福建省": {
        "福州市": [ "鼓楼区", "台江区", "仓山区", "马尾区", "晋安区", "闽侯县", "连江县", "罗源县", "闽清县", "永泰县", "平潭县", "福清市", "长乐市" ],
        "厦门市": [ "思明区", "海沧区", "湖里区", "集美区", "同安区", "翔安区" ],
        "莆田市": [ "城厢区", "涵江区", "荔城区", "秀屿区", "仙游县" ],
        "三明市": [ "梅列区", "三元区", "明溪县", "清流县", "宁化县", "大田县", "尤溪县", "沙县", "将乐县", "泰宁县", "建宁县", "永安市" ],
        "泉州市": [ "鲤城区", "丰泽区", "洛江区", "泉港区", "惠安县", "安溪县", "永春县", "德化县", "金门县", "石狮市", "晋江市", "南安市" ],
        "漳州市": [ "芗城区", "龙文区", "云霄县", "漳浦县", "诏安县", "长泰县", "东山县", "南靖县", "平和县", "华安县", "龙海市" ],
        "南平市": [ "延平区", "顺昌县", "浦城县", "光泽县", "松溪县", "政和县", "邵武市", "武夷山市", "建瓯市", "建阳市" ],
        "龙岩市": [ "新罗区", "长汀县", "永定县", "上杭县", "武平县", "连城县", "漳平市" ],
        "宁德市": [ "蕉城区", "霞浦县", "古田县", "屏南县", "寿宁县", "周宁县", "柘荣县", "福安市", "福鼎市" ]
    },
    "江西省": {
        "南昌市": [ "东湖区", "西湖区", "青云谱区", "湾里区", "青山湖区", "南昌县", "新建县", "安义县", "进贤县" ],
        "景德镇市": [ "昌江区", "珠山区", "浮梁县", "乐平市" ],
        "萍乡市": [ "安源区", "湘东区", "莲花县", "上栗县", "芦溪县" ],
        "九江市": [ "庐山区", "浔阳区", "九江县", "武宁县", "修水县", "永修县", "德安县", "星子县", "都昌县", "湖口县", "彭泽县", "瑞昌市" ],
        "新余市": [ "渝水区", "分宜县" ],
        "鹰潭市": [ "月湖区", "余江县", "贵溪市" ],
        "赣州市": [ "章贡区", "赣县", "信丰县", "大余县", "上犹县", "崇义县", "安远县", "龙南县", "定南县", "全南县", "宁都县", "于都县", "兴国县", "会昌县", "寻乌县", "石城县", "瑞金市", "南康市" ],
        "吉安市": [ "吉州区", "青原区", "吉安县", "吉水县", "峡江县", "新干县", "永丰县", "泰和县", "遂川县", "万安县", "安福县", "永新县", "井冈山市" ],
        "宜春市": [ "袁州区", "奉新县", "万载县", "上高县", "宜丰县", "靖安县", "铜鼓县", "丰城市", "樟树市", "高安市" ],
        "抚州市": [ "临川区", "南城县", "黎川县", "南丰县", "崇仁县", "乐安县", "宜黄县", "金溪县", "资溪县", "东乡县", "广昌县" ],
        "上饶市": [ "信州区", "上饶县", "广丰县", "玉山县", "铅山县", "横峰县", "弋阳县", "余干县", "鄱阳县", "万年县", "婺源县", "德兴市" ]
    },
    "山东省": {
        "济南市": [ "历下区", "市中区", "槐荫区", "天桥区", "历城区", "长清区", "平阴县", "济阳县", "商河县", "章丘市" ],
        "青岛市": [ "市南区", "市北区", "四方区", "黄岛区", "崂山区", "李沧区", "城阳区", "胶州市", "即墨市", "平度市", "胶南市", "莱西市" ],
        "淄博市": [ "淄川区", "张店区", "博山区", "临淄区", "周村区", "桓台县", "高青县", "沂源县" ],
        "枣庄市": [ "市中区", "薛城区", "峄城区", "台儿庄区", "山亭区", "滕州市" ],
        "东营市": [ "东营区", "河口区", "垦利县", "利津县", "广饶县" ],
        "烟台市": [ "芝罘区", "福山区", "牟平区", "莱山区", "长岛县", "龙口市", "莱阳市", "莱州市", "蓬莱市", "招远市", "栖霞市", "海阳市" ],
        "潍坊市": [ "潍城区", "寒亭区", "坊子区", "奎文区", "临朐县", "昌乐县", "青州市", "诸城市", "寿光市", "安丘市", "高密市", "昌邑市" ],
        "济宁市": [ "市中区", "任城区", "微山县", "鱼台县", "金乡县", "嘉祥县", "汶上县", "泗水县", "梁山县", "曲阜市", "兖州市", "邹城市" ],
        "泰安市": [ "泰山区", "岱岳区", "宁阳县", "东平县", "新泰市", "肥城市" ],
        "威海市": [ "环翠区", "文登市", "荣成市", "乳山市" ],
        "日照市": [ "东港区", "岚山区", "五莲县", "莒县" ],
        "莱芜市": [ "莱城区", "钢城区" ],
        "临沂市": [ "兰山区", "罗庄区", "河东区", "沂南县", "郯城县", "沂水县", "苍山县", "费县", "平邑县", "莒南县", "蒙阴县", "临沭县" ],
        "德州市": [ "德城区", "陵县", "宁津县", "庆云县", "临邑县", "齐河县", "平原县", "夏津县", "武城县", "乐陵市", "禹城市" ],
        "聊城市": [ "东昌府区", "阳谷县", "莘县", "茌平县", "东阿县", "冠县", "高唐县", "临清市" ],
        "滨州市": [ "滨城区", "惠民县", "阳信县", "无棣县", "沾化县", "博兴县", "邹平县" ],
        "菏泽市": [ "牡丹区", "曹县", "单县", "成武县", "巨野县", "郓城县", "鄄城县", "定陶县", "东明县" ]
    },
    "河南省": {
        "郑州市": [ "中原区", "二七区", "管城回族区", "金水区", "上街区", "惠济区", "中牟县", "巩义市", "荥阳市", "新密市", "新郑市", "登封市" ],
        "开封市": [ "龙亭区", "顺河回族区", "鼓楼区", "禹王台区", "金明区", "杞县", "通许县", "尉氏县", "开封县", "兰考县" ],
        "洛阳市": [ "老城区", "西工区", "瀍河回族区", "涧西区", "吉利区", "洛龙区", "孟津县", "新安县", "栾川县", "嵩县", "汝阳县", "宜阳县", "洛宁县", "伊川县", "偃师市" ],
        "平顶山市": [ "新华区", "卫东区", "石龙区", "湛河区", "宝丰县", "叶县", "鲁山县", "郏县", "舞钢市", "汝州市" ],
        "安阳市": [ "文峰区", "北关区", "殷都区", "龙安区", "安阳县", "汤阴县", "滑县", "内黄县", "林州市" ],
        "鹤壁市": [ "鹤山区", "山城区", "淇滨区", "浚县", "淇县" ],
        "新乡市": [ "红旗区", "卫滨区", "凤泉区", "牧野区", "新乡县", "获嘉县", "原阳县", "延津县", "封丘县", "长垣县", "卫辉市", "辉县市" ],
        "焦作市": [ "解放区", "中站区", "马村区", "山阳区", "修武县", "博爱县", "武陟县", "温县", "沁阳市", "孟州市" ],
        "濮阳市": [ "华龙区", "清丰县", "南乐县", "范县", "台前县", "濮阳县" ],
        "许昌市": [ "魏都区", "许昌县", "鄢陵县", "襄城县", "禹州市", "长葛市" ],
        "漯河市": [ "源汇区", "郾城区", "召陵区", "舞阳县", "临颍县" ],
        "三门峡市": [ "湖滨区", "渑池县", "陕县", "卢氏县", "义马市", "灵宝市" ],
        "南阳市": [ "宛城区", "卧龙区", "南召县", "方城县", "西峡县", "镇平县", "内乡县", "淅川县", "社旗县", "唐河县", "新野县", "桐柏县", "邓州市" ],
        "商丘市": [ "梁园区", "睢阳区", "民权县", "睢县", "宁陵县", "柘城县", "虞城县", "夏邑县", "永城市" ],
        "信阳市": [ "浉河区", "平桥区", "罗山县", "光山县", "新县", "商城县", "固始县", "潢川县", "淮滨县", "息县" ],
        "周口市": [ "川汇区", "扶沟县", "西华县", "商水县", "沈丘县", "郸城县", "淮阳县", "太康县", "鹿邑县", "项城市" ],
        "驻马店市": [ "驿城区", "西平县", "上蔡县", "平舆县", "正阳县", "确山县", "泌阳县", "汝南县", "遂平县", "新蔡县" ],
        "济源市": [ "济源市" ]
    },
    "湖北省": {
        "武汉市": [ "江岸区", "江汉区", "硚口区", "汉阳区", "武昌区", "青山区", "洪山区", "东西湖区", "汉南区", "蔡甸区", "江夏区", "黄陂区", "新洲区" ],
        "黄石市": [ "黄石港区", "西塞山区", "下陆区", "铁山区", "阳新县", "大冶市" ],
        "十堰市": [ "茅箭区", "张湾区", "郧县", "郧西县", "竹山县", "竹溪县", "房县", "丹江口市" ],
        "宜昌市": [ "西陵区", "伍家岗区", "点军区", "猇亭区", "夷陵区", "远安县", "兴山县", "秭归县", "长阳土家族自治县", "五峰土家族自治县", "宜都市", "当阳市", "枝江市" ],
        "襄樊市": [ "襄城区", "樊城区", "襄阳区", "南漳县", "谷城县", "保康县", "老河口市", "枣阳市", "宜城市" ],
        "鄂州市": [ "梁子湖区", "华容区", "鄂城区" ],
        "荆门市": [ "东宝区", "掇刀区", "京山县", "沙洋县", "钟祥市" ],
        "孝感市": [ "孝南区", "孝昌县", "大悟县", "云梦县", "应城市", "安陆市", "汉川市" ],
        "荆州市": [ "沙市区", "荆州区", "公安县", "监利县", "江陵县", "石首市", "洪湖市", "松滋市" ],
        "黄冈市": [ "黄州区", "团风县", "红安县", "罗田县", "英山县", "浠水县", "蕲春县", "黄梅县", "麻城市", "武穴市" ],
        "咸宁市": [ "咸安区", "嘉鱼县", "通城县", "崇阳县", "通山县", "赤壁市" ],
        "随州市": [ "曾都区", "广水市" ],
        "恩施土家族苗族自治州": [ "恩施市", "利川市", "建始县", "巴东县", "宣恩县", "咸丰县", "来凤县", "鹤峰县" ],
        "仙桃市": [ "仙桃市" ],
        "潜江市": [ "潜江市" ],
        "天门市": [ "天门市" ],
        "神农架林区": [ "神农架林区" ]
    },
    "湖南省": {
        "长沙市": [ "芙蓉区", "天心区", "岳麓区", "开福区", "雨花区", "长沙县", "望城县", "宁乡县", "浏阳市" ],
        "株洲市": [ "荷塘区", "芦淞区", "石峰区", "天元区", "株洲县", "攸县", "茶陵县", "炎陵县", "醴陵市" ],
        "湘潭市": [ "雨湖区", "岳塘区", "湘潭县", "湘乡市", "韶山市" ],
        "衡阳市": [ "珠晖区", "雁峰区", "石鼓区", "蒸湘区", "南岳区", "衡阳县", "衡南县", "衡山县", "衡东县", "祁东县", "耒阳市", "常宁市" ],
        "邵阳市": [ "双清区", "大祥区", "北塔区", "邵东县", "新邵县", "邵阳县", "隆回县", "洞口县", "绥宁县", "新宁县", "城步苗族自治县", "武冈市" ],
        "岳阳市": [ "岳阳楼区", "云溪区", "君山区", "岳阳县", "华容县", "湘阴县", "平江县", "汨罗市", "临湘市" ],
        "常德市": [ "武陵区", "鼎城区", "安乡县", "汉寿县", "澧县", "临澧县", "桃源县", "石门县", "津市市" ],
        "张家界市": [ "永定区", "武陵源区", "慈利县", "桑植县" ],
        "益阳市": [ "资阳区", "赫山区", "南县", "桃江县", "安化县", "沅江市" ],
        "郴州市": [ "北湖区", "苏仙区", "桂阳县", "宜章县", "永兴县", "嘉禾县", "临武县", "汝城县", "桂东县", "安仁县", "资兴市" ],
        "永州市": [ "零陵区", "冷水滩区", "祁阳县", "东安县", "双牌县", "道县", "江永县", "宁远县", "蓝山县", "新田县", "江华瑶族自治县" ],
        "怀化市": [ "鹤城区", "中方县", "沅陵县", "辰溪县", "溆浦县", "会同县", "麻阳苗族自治县", "新晃侗族自治县", "芷江侗族自治县", "靖州苗族侗族自治县", "通道侗族自治县", "洪江市" ],
        "娄底市": [ "娄星区", "双峰县", "新化县", "冷水江市", "涟源市" ],
        "湘西土家族苗族自治州": [ "吉首市", "泸溪县", "凤凰县", "花垣县", "保靖县", "古丈县", "永顺县", "龙山县" ]
    },
    "广东省": {
        "广州市": [ "荔湾区", "越秀区", "海珠区", "天河区", "白云区", "黄埔区", "番禺区", "花都区", "南沙区", "萝岗区", "增城市", "从化市" ],
        "韶关市": [ "武江区", "浈江区", "曲江区", "始兴县", "仁化县", "翁源县", "乳源瑶族自治县", "新丰县", "乐昌市", "南雄市" ],
        "深圳市": [ "罗湖区", "福田区", "南山区", "宝安区", "龙岗区", "盐田区" ],
        "珠海市": [ "香洲区", "斗门区", "金湾区" ],
        "汕头市": [ "龙湖区", "金平区", "濠江区", "潮阳区", "潮南区", "澄海区", "南澳县" ],
        "佛山市": [ "禅城区", "南海区", "顺德区", "三水区", "高明区" ],
        "江门市": [ "蓬江区", "江海区", "新会区", "台山市", "开平市", "鹤山市", "恩平市" ],
        "湛江市": [ "赤坎区", "霞山区", "坡头区", "麻章区", "遂溪县", "徐闻县", "廉江市", "雷州市", "吴川市" ],
        "茂名市": [ "茂南区", "茂港区", "电白县", "高州市", "化州市", "信宜市" ],
        "肇庆市": [ "端州区", "鼎湖区", "广宁县", "怀集县", "封开县", "德庆县", "高要市", "四会市" ],
        "惠州市": [ "惠城区", "惠阳区", "博罗县", "惠东县", "龙门县" ],
        "梅州市": [ "梅江区", "梅县", "大埔县", "丰顺县", "五华县", "平远县", "蕉岭县", "兴宁市" ],
        "汕尾市": [ "城区", "海丰县", "陆河县", "陆丰市" ],
        "河源市": [ "源城区", "紫金县", "龙川县", "连平县", "和平县", "东源县" ],
        "阳江市": [ "江城区", "阳西县", "阳东县", "阳春市" ],
        "清远市": [ "清城区", "佛冈县", "阳山县", "连山壮族瑶族自治县", "连南瑶族自治县", "清新县", "英德市", "连州市" ],
        "东莞市": [ "东莞市" ],
        "中山市": [ "中山市" ],
        "潮州市": [ "湘桥区", "潮安县", "饶平县" ],
        "揭阳市": [ "榕城区", "揭东县", "揭西县", "惠来县", "普宁市" ],
        "云浮市": [ "云城区", "新兴县", "郁南县", "云安县", "罗定市" ]
    },
    "广西壮族自治区": {
        "南宁市": [ "兴宁区", "青秀区", "江南区", "西乡塘区", "良庆区", "邕宁区", "武鸣县", "隆安县", "马山县", "上林县", "宾阳县", "横县" ],
        "柳州市": [ "城中区", "鱼峰区", "柳南区", "柳北区", "柳江县", "柳城县", "鹿寨县", "融安县", "融水苗族自治县", "三江侗族自治县" ],
        "桂林市": [ "秀峰区", "叠彩区", "象山区", "七星区", "雁山区", "阳朔县", "临桂县", "灵川县", "全州县", "兴安县", "永福县", "灌阳县", "龙胜各族自治县", "资源县", "平乐县", "荔浦县", "恭城瑶族自治县" ],
        "梧州市": [ "万秀区", "蝶山区", "长洲区", "苍梧县", "藤县", "蒙山县", "岑溪市" ],
        "北海市": [ "海城区", "银海区", "铁山港区", "合浦县" ],
        "防城港市": [ "港口区", "防城区", "上思县", "东兴市" ],
        "钦州市": [ "钦南区", "钦北区", "灵山县", "浦北县" ],
        "贵港市": [ "港北区", "港南区", "覃塘区", "平南县", "桂平市" ],
        "玉林市": [ "玉州区", "容县", "陆川县", "博白县", "兴业县", "北流市" ],
        "百色市": [ "右江区", "田阳县", "田东县", "平果县", "德保县", "靖西县", "那坡县", "凌云县", "乐业县", "田林县", "西林县", "隆林各族自治县" ],
        "贺州市": [ "八步区", "昭平县", "钟山县", "富川瑶族自治县" ],
        "河池市": [ "金城江区", "南丹县", "天峨县", "凤山县", "东兰县", "罗城仫佬族自治县", "环江毛南族自治县", "巴马瑶族自治县", "都安瑶族自治县", "大化瑶族自治县", "宜州市" ],
        "来宾市": [ "兴宾区", "忻城县", "象州县", "武宣县", "金秀瑶族自治县", "合山市" ],
        "崇左市": [ "江洲区", "扶绥县", "宁明县", "龙州县", "大新县", "天等县", "凭祥市" ]
    },
    "海南省": {
        "海口市": [ "秀英区", "龙华区", "琼山区", "美兰区" ],
        "三亚市": [ "三亚市" ],
        "五指山市": [ "五指山市" ],
        "儋州市": [ "儋州市" ],
        "文昌市": [ "文昌市" ],
        "万宁市": [ "万宁市" ],
        "东方市": [ "东方市" ],
        "定安县": [ "定安县" ],
        "屯昌县": [ "屯昌县" ],
        "澄迈县": [ "澄迈县" ],
        "临高县": [ "临高县" ],
        "白沙黎族自治县": [ "白沙黎族自治县" ],
        "昌江黎族自治县": [ "昌江黎族自治县" ],
        "乐东黎族自治县": [ "乐东黎族自治县" ],
        "陵水黎族自治县": [ "陵水黎族自治县" ],
        "保亭黎族苗族自治县": [ "保亭黎族苗族自治县" ],
        "琼中黎族苗族自治县": [ "琼中黎族苗族自治县" ],
        "西沙群岛": [ "西沙群岛" ],
        "南沙群岛": [ "南沙群岛" ],
        "中沙群岛的岛礁及其海域": [ "中沙群岛的岛礁及其海域" ]
    },
    "四川省": {
        "成都市": [ "锦江区", "青羊区", "金牛区", "武侯区", "成华区", "龙泉驿区", "青白江区", "新都区", "温江区", "金堂县", "双流县", "郫县", "大邑县", "蒲江县", "新津县", "都江堰市", "彭州市", "邛崃市", "崇州市" ],
        "自贡市": [ "自流井区", "贡井区", "大安区", "沿滩区", "荣县", "富顺县" ],
        "攀枝花市": [ "东区", "西区", "仁和区", "米易县", "盐边县" ],
        "泸州市": [ "江阳区", "纳溪区", "龙马潭区", "泸县", "合江县", "叙永县", "古蔺县" ],
        "德阳市": [ "旌阳区", "中江县", "罗江县", "广汉市", "什邡市", "绵竹市" ],
        "绵阳市": [ "涪城区", "游仙区", "三台县", "盐亭县", "安县", "梓潼县", "北川羌族自治县", "平武县", "江油市" ],
        "广元市": [ "市中区", "元坝区", "朝天区", "旺苍县", "青川县", "剑阁县", "苍溪县" ],
        "遂宁市": [ "船山区", "安居区", "蓬溪县", "射洪县", "大英县" ],
        "内江市": [ "市中区", "东兴区", "威远县", "资中县", "隆昌县" ],
        "乐山市": [ "市中区", "沙湾区", "五通桥区", "金口河区", "犍为县", "井研县", "夹江县", "沐川县", "峨边彝族自治县", "马边彝族自治县", "峨眉山市" ],
        "南充市": [ "顺庆区", "高坪区", "嘉陵区", "南部县", "营山县", "蓬安县", "仪陇县", "西充县", "阆中市" ],
        "眉山市": [ "东坡区", "仁寿县", "彭山县", "洪雅县", "丹棱县", "青神县" ],
        "宜宾市": [ "翠屏区", "宜宾县", "南溪县", "江安县", "长宁县", "高县", "珙县", "筠连县", "兴文县", "屏山县" ],
        "广安市": [ "广安区", "岳池县", "武胜县", "邻水县", "华蓥市" ],
        "达州市": [ "通川区", "达县", "宣汉县", "开江县", "大竹县", "渠县", "万源市" ],
        "雅安市": [ "雨城区", "名山县", "荥经县", "汉源县", "石棉县", "天全县", "芦山县", "宝兴县" ],
        "巴中市": [ "巴州区", "通江县", "南江县", "平昌县" ],
        "资阳市": [ "雁江区", "安岳县", "乐至县", "简阳市" ],
        "阿坝藏族羌族自治州": [ "汶川县", "理县", "茂县", "松潘县", "九寨沟县", "九寨沟县", "小金县", "黑水县", "马尔康县", "壤塘县", "阿坝县", "若尔盖县", "红原县" ],
        "甘孜藏族自治州": [ "康定县", "泸定县", "丹巴县", "九龙县", "雅江县", "道孚县", "炉霍县", "甘孜县", "新龙县", "德格县", "白玉县", "石渠县", "色达县", "理塘县", "巴塘县", "乡城县", "稻城县", "得荣县" ],
        "凉山彝族自治州": [ "西昌市", "木里藏族自治县", "盐源县", "德昌县", "会理县", "会东县", "宁南县", "普格县", "布拖县", "金阳县", "昭觉县", "喜德县", "冕宁县", "越西县", "甘洛县", "美姑县", "雷波县" ]
    },
    "贵州省": {
        "贵阳市": [ "南明区", "云岩区", "花溪区", "乌当区", "白云区", "小河区", "开阳县", "息烽县", "修文县", "清镇市" ],
        "六盘水市": [ "钟山区", "六枝特区", "水城县", "盘县" ],
        "遵义市": [ "红花岗区", "汇川区", "遵义县", "桐梓县", "绥阳县", "正安县", "道真仡佬族苗族自治县", "务川仡佬族苗族自治县", "凤冈县", "湄潭县", "余庆县", "习水县", "赤水市", "仁怀市" ],
        "安顺市": [ "西秀区", "平坝县", "普定县", "镇宁布依族苗族自治县", "关岭布依族苗族自治县", "紫云苗族布依族自治县" ],
        "铜仁地区": [ "铜仁市", "江口县", "玉屏侗族自治县", "石阡县", "思南县", "印江土家族苗族自治县", "德江县", "沿河土家族自治县", "松桃苗族自治县", "万山特区" ],
        "黔西南布依族苗族自治州": [ "兴义市", "兴仁县", "普安县", "晴隆县", "贞丰县", "望谟县", "册亨县", "安龙县" ],
        "毕节地区": [ "毕节市", "大方县", "黔西县", "金沙县", "织金县", "纳雍县", "威宁彝族回族苗族自治县", "赫章县" ],
        "黔东南苗族侗族自治州": [ "凯里市", "黄平县", "施秉县", "三穗县", "镇远县", "岑巩县", "天柱县", "锦屏县", "剑河县", "台江县", "黎平县", "榕江县", "从江县", "雷山县", "麻江县", "丹寨县" ],
        "黔南布依族苗族自治州": [ "都匀市", "福泉市", "荔波县", "贵定县", "瓮安县", "独山县", "平塘县", "罗甸县", "长顺县", "龙里县", "惠水县", "三都水族自治县" ]
    },
    "云南省": {
        "昆明市": [ "五华区", "盘龙区", "官渡区", "西山区", "东川区", "呈贡县", "晋宁县", "富民县", "宜良县", "石林彝族自治县", "嵩明县", "禄劝彝族苗族自治县", "寻甸回族彝族自治县", "安宁市" ],
        "曲靖市": [ "麒麟区", "马龙县", "陆良县", "师宗县", "罗平县", "富源县", "会泽县", "沾益县", "宣威市" ],
        "玉溪市": [ "红塔区", "江川县", "澄江县", "通海县", "华宁县", "易门县", "峨山彝族自治县", "新平彝族傣族自治县", "元江哈尼族彝族傣族自治县" ],
        "保山市": [ "隆阳区", "施甸县", "腾冲县", "龙陵县", "昌宁县" ],
        "昭通市": [ "昭阳区", "鲁甸县", "巧家县", "盐津县", "大关县", "永善县", "绥江县", "镇雄县", "彝良县", "威信县", "水富县" ],
        "丽江市": [ "古城区", "玉龙纳西族自治县", "永胜县", "华坪县", "宁蒗彝族自治县" ],
        "普洱市": [ "思茅区", "宁洱哈尼族彝族自治县", "墨江哈尼族自治县", "景东彝族自治县", "景谷傣族彝族自治县", "镇沅彝族哈尼族拉祜族自治县", "江城哈尼族彝族自治县", "孟连傣族拉祜族佤族自治县", "澜沧拉祜族自治县", "西盟佤族自治县" ],
        "临沧市": [ "临翔区", "凤庆县", "云县", "永德县", "镇康县", "双江拉祜族佤族布朗族傣族自治县", "耿马傣族佤族自治县", "沧源佤族自治县" ],
        "楚雄彝族自治州": [ "楚雄市", "双柏县", "牟定县", "南华县", "姚安县", "大姚县", "永仁县", "元谋县", "武定县", "禄丰县" ],
        "红河哈尼族彝族自治州": [ "个旧市", "开远市", "蒙自县", "屏边苗族自治县", "建水县", "石屏县", "弥勒县", "泸西县", "元阳县", "红河县", "金平苗族瑶族傣族自治县", "绿春县", "河口瑶族自治县" ],
        "文山壮族苗族自治州": [ "文山县", "砚山县", "西畴县", "麻栗坡县", "马关县", "丘北县", "广南县", "富宁县" ],
        "西双版纳傣族自治州": [ "景洪市", "勐海县", "勐腊县" ],
        "大理白族自治州": [ "大理市", "漾濞彝族自治县", "祥云县", "宾川县", "弥渡县", "南涧彝族自治县", "巍山彝族回族自治县", "永平县", "云龙县", "洱源县", "剑川县", "鹤庆县" ],
        "德宏傣族景颇族自治州": [ "瑞丽市", "潞西市", "梁河县", "盈江县", "陇川县" ],
        "怒江傈僳族自治州": [ "泸水县", "福贡县", "贡山独龙族怒族自治县", "兰坪白族普米族自治县" ],
        "迪庆藏族自治州": [ "香格里拉县", "德钦县", "维西傈僳族自治县" ]
    },
    "西藏自治区": {
        "拉萨市": [ "城关区", "林周县", "当雄县", "尼木县", "曲水县", "堆龙德庆县", "达孜县", "墨竹工卡县" ],
        "昌都地区": [ "昌都县", "江达县", "贡觉县", "类乌齐县", "丁青县", "察雅县", "八宿县", "左贡县", "芒康县", "洛隆县", "边坝县" ],
        "山南地区": [ "乃东县", "扎囊县", "贡嘎县", "桑日县", "琼结县", "曲松县", "措美县", "洛扎县", "加查县", "隆子县", "错那县", "浪卡子县" ],
        "日喀则地区": [ "日喀则市", "南木林县", "江孜县", "定日县", "萨迦县", "拉孜县", "昂仁县", "谢通门县", "白朗县", "仁布县", "康马县", "定结县", "仲巴县", "亚东县", "吉隆县", "聂拉木县", "萨嘎县", "岗巴县" ],
        "那曲地区": [ "那曲县", "嘉黎县", "比如县", "聂荣县", "安多县", "申扎县", "索县", "班戈县", "巴青县", "尼玛县" ],
        "阿里地区": [ "普兰县", "札达县", "噶尔县", "日土县", "革吉县", "改则县", "措勤县" ],
        "林芝地区": [ "林芝县", "工布江达县", "米林县", "墨脱县", "波密县", "察隅县", "朗县" ]
    },
    "陕西省": {
        "西安市": [ "新城区", "碑林区", "莲湖区", "灞桥区", "未央区", "雁塔区", "阎良区", "临潼区", "长安区", "蓝田县", "周至县", "户县", "高陵县" ],
        "铜川市": [ "王益区", "印台区", "耀州区", "宜君县" ],
        "宝鸡市": [ "太白县", "凤县", "麟游县", "千阳县", "陇县", "眉县", "扶风县", "岐山县", "凤翔县", "陈仓区", "金台区", "渭滨区" ],
        "咸阳市": [ "秦都区", "杨凌区", "渭城区", "三原县", "泾阳县", "乾县", "礼泉县", "永寿县", "彬县", "长武县", "旬邑县", "淳化县", "武功县", "兴平市" ],
        "渭南市": [ "临渭区", "华县", "潼关县", "大荔县", "合阳县", "澄城县", "蒲城县", "白水县", "富平县", "韩城市", "华阴市" ],
        "延安市": [ "宝塔区", "延长县", "延川县", "子长县", "安塞县", "志丹县", "吴起县", "甘泉县", "富县", "洛川县", "宜川县", "黄龙县", "黄陵县" ],
        "汉中市": [ "汉台区", "南郑县", "城固县", "洋县", "西乡县", "勉县", "宁强县", "略阳县", "镇巴县", "留坝县", "佛坪县" ],
        "榆林市": [ "榆阳区", "神木县", "府谷县", "横山县", "靖边县", "定边县", "绥德县", "米脂县", "佳县", "吴堡县", "清涧县", "子洲县" ],
        "安康市": [ "汉滨区", "汉阴县", "石泉县", "宁陕县", "紫阳县", "岚皋县", "平利县", "镇坪县", "旬阳县", "白河县" ],
        "白河县": [ "商州区", "洛南县", "丹凤县", "商南县", "山阳县", "镇安县", "柞水县" ]
    },
    "甘肃省": {
        "兰州市": [ "城关区", "七里河区", "西固区", "安宁区", "红古区", "永登县", "皋兰县", "榆中县" ],
        "嘉峪关市": [ "嘉峪关市" ],
        "金昌市": [ "金川区", "永昌县" ],
        "白银市": [ "白银区", "平川区", "靖远县", "会宁县", "景泰县" ],
        "天水市": [ "秦州区", "麦积区", "清水县", "秦安县", "甘谷县", "武山县", "张家川回族自治县" ],
        "武威市": [ "凉州区", "民勤县", "古浪县", "天祝藏族自治县" ],
        "张掖市": [ "甘州区", "肃南裕固族自治县", "民乐县", "临泽县", "高台县", "山丹县" ],
        "平凉市": [ "崆峒区", "泾川县", "灵台县", "崇信县", "华亭县", "庄浪县", "静宁县" ],
        "酒泉市": [ "肃州区", "金塔县", "瓜州县", "肃北蒙古族自治县", "阿克塞哈萨克族自治县", "玉门市", "敦煌市" ],
        "庆阳市": [ "西峰区", "庆城县", "环县", "华池县", "合水县", "正宁县", "宁县", "镇原县" ],
        "定西市": [ "安定区", "通渭县", "陇西县", "渭源县", "临洮县", "漳县", "岷县" ],
        "陇南市": [ "武都区", "成县", "文县", "宕昌县", "康县", "西和县", "礼县", "徽县", "两当县" ],
        "临夏回族自治州": [ "临夏市", "临夏县", "康乐县", "永靖县", "广河县", "和政县", "东乡族自治县", "积石山保安族东乡族撒拉族自治县" ],
        "甘南藏族自治州": [ "合作市", "临潭县", "卓尼县", "舟曲县", "迭部县", "玛曲县", "碌曲县", "夏河县" ]
    },
    "青海省": {
        "西宁市": [ "城东区", "城中区", "城西区", "城北区", "大通回族土族自治县", "湟中县", "湟源县" ],
        "海东地区": [ "平安县", "民和回族土族自治县", "乐都县", "互助土族自治县", "化隆回族自治县", "循化撒拉族自治县" ],
        "海北藏族自治州": [ "门源回族自治县", "祁连县", "海晏县", "刚察县" ],
        "黄南藏族自治州": [ "同仁县", "尖扎县", "泽库县", "河南蒙古族自治县", "海南藏族自治州", "共和县", "同德县", "贵德县", "兴海县", "贵南县" ],
        "果洛藏族自治州": [ "玛沁县", "班玛县", "甘德县", "达日县", "久治县", "玛多县" ],
        "玉树藏族自治州": [ "玉树县", "杂多县", "称多县", "治多县", "囊谦县", "曲麻莱县" ],
        "海西蒙古族藏族自治州": [ "格尔木市", "德令哈市", "乌兰县", "都兰县", "天峻县" ]
    },
    "宁夏回族自治区": {
        "银川市": [ "兴庆区", "西夏区", "金凤区", "永宁县", "贺兰县", "灵武市" ],
        "石嘴山市": [ "大武口区", "惠农区", "平罗县" ],
        "吴忠市": [ "利通区", "盐池县", "同心县", "青铜峡市" ],
        "固原市": [ "原州区", "西吉县", "隆德县", "泾源县", "彭阳县" ],
        "中卫市": [ "沙坡头区", "中宁县", "海原县" ]
    },
    "新疆维吾尔自治区": {
        "乌鲁木齐市": [ "天山区", "沙依巴克区", "新市区", "水磨沟区", "头屯河区", "达坂城区", "米东区", "乌鲁木齐县" ],
        "克拉玛依市": [ "独山子区", "克拉玛依区", "白碱滩区", "乌尔禾区" ],
        "吐鲁番地区": [ "吐鲁番市", "鄯善县", "托克逊县" ],
        "哈密地区": [ "哈密市", "巴里坤哈萨克自治县", "伊吾县" ],
        "昌吉回族自治州": [ "昌吉市", "阜康市", "呼图壁县", "玛纳斯县", "奇台县", "吉木萨尔县", "木垒哈萨克自治县" ],
        "博尔塔拉蒙古自治州": [ "博乐市", "精河县", "温泉县" ],
        "巴音郭楞蒙古自治州": [ "库尔勒市", "轮台县", "尉犁县", "若羌县", "且末县", "焉耆回族自治县", "和静县", "和硕县", "博湖县" ],
        "阿克苏地区": [ "阿克苏市", "温宿县", "库车县", "沙雅县", "新和县", "拜城县", "乌什县", "阿瓦提县", "柯坪县" ],
        "克孜勒苏柯尔克孜自治州": [ "阿图什市", "阿克陶县", "阿合奇县", "乌恰县" ],
        "喀什地区": [ "喀什市", "疏附县", "疏勒县", "英吉沙县", "泽普县", "莎车县", "叶城县", "麦盖提县", "岳普湖县", "伽师县", "巴楚县", "塔什库尔干塔吉克自治县" ],
        "和田地区": [ "和田市", "和田县", "墨玉县", "皮山县", "洛浦县", "策勒县", "于田县", "民丰县" ],
        "伊犁哈萨克自治州": [ "伊宁市", "奎屯市", "伊宁县", "察布查尔锡伯自治县", "霍城县", "巩留县", "新源县", "昭苏县", "特克斯县", "尼勒克县" ],
        "塔城地区": [ "塔城市", "乌苏市", "额敏县", "沙湾县", "托里县", "裕民县", "和布克赛尔蒙古自治县" ],
        "阿勒泰地区": [ "阿勒泰市", "布尔津县", "富蕴县", "福海县", "哈巴河县", "青河县", "吉木乃县" ],
        "石河子市": [ "石河子市" ],
        "阿拉尔市": [ "阿拉尔市" ],
        "图木舒克市": [ "图木舒克市" ],
        "五家渠市": [ "五家渠市" ]
    },
    "台湾省": [ "台北", "高雄", "台南", "台中", "金门县", "南投县", "基隆", "新竹", "嘉义", "新北", "宜兰县", "新竹县", "桃源县", "苗栗县", "彰化县", "嘉义县", "云林县", "屏东县", "台东县", "花莲县", "澎湖县", "连江县" ],
    "香港特别行政区": [ "香港岛", "九龙", "新界" ],
    "澳门特别行政区": [ "澳门半岛", "离岛" ]
});

define("app/pc/personcenter/bdaydrop", [], function(require, exports) {
    var bdayList = {
        "01": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ],
        "02": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28" ],
        "03": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ],
        "04": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30" ],
        "05": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ],
        "06": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30" ],
        "07": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ],
        "08": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ],
        "09": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30" ],
        "10": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ],
        "11": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30" ],
        "12": [ "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31" ]
    };
    return bdayList;
});
