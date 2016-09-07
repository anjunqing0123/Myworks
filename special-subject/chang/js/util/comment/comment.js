/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    评论模块整理
 */

define(function(require, exports, modules) {

    var
        $ = require('jquery'),
        cookie = require('../cookie/cookie'),
        user = require('../user/user'),
        login = require('../login/login')
    ;

    if ($.Comment) {
        return;
    }

    var _cmt_obj_index = 0;

    var loader = {
        load: function(opt) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.src = opt.url;
            document.getElementsByTagName("head")[0].appendChild(script);
        }
    };

    var merge = function(o1, o2) {
        for (var o in o2) {
            o1[o] = o2[o];
        }
        return o1;
    };
    var VipStyle_ = "cursor:pointer;margin-top:5px;height: 10px;width: 20px;vertical-align:middle;overflow:hidden;display:inline-block;text-indent: -9999px;background:url(http://static9.pplive.cn/pptv/index/images/sprite.png) no-repeat;_background: url(http://static9.pplive.cn/pptv/index/images/sprite-ie6.png) no-repeat;",
        VipStyle = VipStyle_ + "background-position: -370px -169px;",
        VipStyleNO = VipStyle_ + "background-position: -370px -180px;",
        YearStyle_ = "margin-top:5px;width:13px;height:13px;margin-left:1px;cursor:pointer;display:inline-block;text-indent:-9999px;background:url(http://static9.pplive.cn/pptv/index/images/sprite.png) no-repeat;_background: url(http://static9.pplive.cn/pptv/index/images/sprite-ie6.png) no-repeat;",
        YearStyle = YearStyle_ + "vertical-align:middle;_vertical-align:-2px;background-position: -325px -246px;",
        YearStyleNO = YearStyle_ + "background-position: -345px -246px;";
    var UserIco = function(vip) {
        var viphtml, userName = user.info.UserName;
        var chtml = function(type, style) {
            if (type == 'vip') {
                return '<a href="http://pay.vip.pptv.com/?plt=web&aid=commentviplogo&username=' + userName + '" target="_blank"><span style="float:left;' + style + '">vip</span></a>';
            } else {
                return '<a href="http://pay.vip.pptv.com/?plt=web&aid=commentyearlogo&username=' + userName + '" target="_blank"><span style="float:left;' + style + '">vip</span></a>';
            }
        };
        if (vip == 2) {
            viphtml = chtml('vip', VipStyle) + chtml('year', YearStyle);
        } else if (vip == 1) {
            viphtml = chtml('vip', VipStyle) + chtml('year', YearStyleNO);
        } else {
            viphtml = ''; //chtml('year', YearStyleNO) - 去掉非vip标识 //chtml('vip', VipStyleNO) +
        }
        return viphtml;
    };
    //comment中负责和服务器交互数据
    var dataModel = {
        getUrl: "http://comment.pptv.com/api/v1/show.json/",
        getReplyUrl: "http://comment.pptv.com/api/v1/reply.json/",
        postUrl: "http://p.comment.pptv.com/api/v1/comment.json/",
        voteUrl: "http://p.comment.pptv.com/api/v1/push.json",
        hotUrl: "http://comment.pptv.com/api/v1/hot.json/",
        singleUrl: "http://comment.pptv.com/api/v1/topic.json/",
        get: function(ids, page, pageSize, cb, tm, type) {
            //type 1是短评，2长评
            loader.load({
                url: dataModel.getUrl + "?ids=" + encodeURIComponent(ids) + "&pg=" + encodeURIComponent(page) + "&ps=" + encodeURIComponent(pageSize) + "&tm=" + encodeURIComponent(tm) + "&type=" + type + "&cb=" + cb
            });
        },
        post: function(ids, tgs, t, txt, pid, asy, tpc, ln, fb, cb) {
            loader.load({
                url: dataModel.postUrl + "?ids=" + encodeURIComponent(ids) + "&tgs=" + encodeURIComponent(tgs) + "&t=" + encodeURIComponent(t) + "&txt=" + encodeURIComponent(txt) + "&pid=" + encodeURIComponent(pid) + "&asy=" + encodeURIComponent(asy) + "&tpc=" + encodeURIComponent(tpc) + "&ln=" + encodeURIComponent(ln) + "&fb=" + encodeURIComponent(fb) + "&cb=" + cb
            });
        },
        vote: function(id, v, cb, tid) {
            loader.load({
                url: dataModel.voteUrl + "?id=" + encodeURIComponent(id) + "&tid=" + encodeURIComponent(tid) + "&v=" + encodeURIComponent(v) + "&cb=" + cb
            });
        },
        getReply: function(tid, id, tm, pg, ps, cb) {
            loader.load({
                url: dataModel.getReplyUrl + "?tid=" + encodeURIComponent(tid) + "&id=" + encodeURIComponent(id) + "&tm=" + encodeURIComponent(tm) + "&pg=" + encodeURIComponent(pg) + "&ps=" + encodeURIComponent(ps) + "&cb=" + cb
            });
        },
        getHot: function(id, type, cb) {
            loader.load({
                url: dataModel.hotUrl + "?id=" + encodeURIComponent(id) + "&type=" + type + "&cb=" + cb
            });
        },
        getSingle: function(id, cid, cb) {
            loader.load({
                url: dataModel.singleUrl + "?id=" + encodeURIComponent(id) + "&cid=" + cid + "&cb=" + cb
            });
        }
    };
    $.dataModel = dataModel;

    //CommentObject 对象
    var CommentObject = function(ids, tags, pageSize) {
        this.cmtIndex = "cmt_" + _cmt_obj_index;
        _cmt_obj_index++;
        if (ids[0]) {
            this.ids = ids;
        } else {
            this.ids = [ids];
        }
        this.tags = tags;
        this.et = 0;
        this.pageSize = pageSize || 10;
        this.fb = '';
        this.topic = encodeURIComponent(document.title);
        this.link = encodeURIComponent(window.location.href);
    };
    CommentObject.prototype = {
        constructor: CommentObject,
        getList: function(cb, page, type) {
            var self = this;
            dataModel.get(self.ids.join(','), page, self.pageSize, cb, self.et, type);
            //  self.fb = res.fb;
            //  self.et = res.tm;
        },
        post: function(txt, asy, cb) {
            if (!this.tags) {
                this.tags = [];
            }
            dataModel.post(this.ids.join(','), this.tags.join(','), "", txt, "", asy, this.topic, this.link, this.fb, cb);
        },
        longPost: function() {

        },
        reply: function(pid, txt, asy, cb) {
            dataModel.post(this.ids, this.tags, "", txt, pid, asy, this.topic, this.link, this.fb, cb);
        },
        up: function(id, cb, tid) {
            if (tid) {
                dataModel.vote(id, 1, cb, tid);
            } else {
                dataModel.vote(id, 1, cb, this.ids[0]);
            }
        },
        down: function(id, cb, tid) {
            if (tid) {
                dataModel.vote(id, 2, cb, tid);
            } else {
                dataModel.vote(id, 2, cb, this.ids[0]);
            }
        },
        getReply: function(tid, id, pg, ps, cb) {
            dataModel.getReply(tid, id, this.et, pg, ps, cb);
        },
        getHot: function(type, cb) {
            dataModel.getHot(this.ids[0], type, cb);
        },
        getSingle: function(cid, cb) {
            dataModel.getSingle(this.ids[0], cid, cb);
        }
    };
    $.CommentObject = CommentObject;

    //counter
    var counter = (function() {
        var counter = function(input, infoBox, max) {
            this.input = input;
            this.infoBox = infoBox;
            this.max = max || 300;
            this.over = false;

            //init
            var self = this,
                loop;
            if (!this.infoBox) {
                return;
            }
            $(input).on("focus", function() {
                var l;
                loop = setInterval(function() {
                    l = self.count();

                    if (l <= max) {
                        self.infoBox.html("还可输入<strong>" + (max - l) + "</strong>个字");
                        self.over = false;
                    } else {
                        self.infoBox.html("已超过<strong>" + (l - max) + "</strong>个字");
                        self.over = true;
                    }
                }, 100);
            }).on('blur', function() {
                clearInterval(loop);
            }).focus();
        };
        counter.prototype = {
            constructor: counter,
            count: function() {
                var val = this.input.value,
                    i, l, res = 0;
                for (i = 0, l = val.length; i < l; i++) {
                    if (val.charCodeAt(i) > 255) {
                        res++;
                    } else {
                        res += 0.5;
                    }
                }
                return Math.ceil(res);
            }
        };
        return counter;
    })();
    var pager = (function() {
        var pager = function(container, total, perPage, onChange) {
            this.pageBar = $(container);
            this.total = total;
            this.perPage = perPage;
            this.pages = Math.ceil(total / perPage);
            this.pages == 0 && (this.pages = 1);
            this.current = 0;
            this.onChange = onChange;
            this.createPager(0);
            var self = this;
            this.pageBar.on("click", function(e) {
                e.preventDefault();
                var tgt = $(e.target);
                if (tgt.hasClass("js_cmt_pager_index")) {
                    self.current = parseInt(tgt.attr("_index"), 10);
                } else if (tgt.hasClass("js_cmt_pager_pre")) {
                    self.current = self.current == 0 ? 0 : (self.current - 1);
                } else if (tgt.hasClass("js_cmt_pager_next")) {
                    self.current = (self.current == self.pages - 1) ? self.pages - 1 : (self.current + 1);
                } else {
                    return;
                }
                self.createPager(self.current);
                self.onChange(self.current);
            });
        };
        pager.prototype = {
            constructor: pager,
            createPager: function(cur) {
                var html = "",
                    pre = "<a href='javascript:void(0);' onclick='return false;' class='js_cmt_pager_pre' title='上一页'>上一页</a>",
                    i, l, next = "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_next' title='下一页'>下一页</a>";
                var span = "<span>…</span>",
                    first = "<a onclick='return false;' href='' class='js_cmt_pager_index' _index='0' title='第1页'>1</a>",
                    last = "<a onclick='return false;' href='' class='js_cmt_pager_index' _index='" + (this.pages - 1) + "' title='第" + (this.pages) + "页'>" + (this.pages) + "</a>";
                if (this.pages <= 8) {
                    for (i = 1, l = this.pages; i <= l; i++) {
                        html += "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + (i - 1) + " title='第" + i + "页'>" + i + "</a>";
                    }
                    html = pre + html + next;
                } else {
                    if (cur - 3 <= 0) {
                        for (i = 1, l = 8; i < l; i++) {
                            html += "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + (i - 1) + " title='第" + i + "页'>" + i + "</a>";
                        }
                        html = pre + html + span + last + next;
                    } else if (cur + 3 >= (this.pages - 1)) {
                        for (i = this.pages, l = this.pages - 7; i > l; i--) {
                            html = "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + (i - 1) + " title='第" + i + "页'>" + i + "</a>" + html;
                        }
                        html = pre + first + span + html + next;
                    } else {
                        for (i = cur - 3, l = cur + 3; i <= l; i++) {
                            html = html + "<a onclick='return false;' href='javascript:void(0);' class='js_cmt_pager_index' _index=" + i + " title='第" + (i + 1) + "页'>" + (i + 1) + "</a>";
                        }
                        html = pre + first + span + html + span + last + next;
                    }
                }
                this.pageBar.html(html);
                var links = this.pageBar.find("a");
                for (i = 0, l = links.length; i < l; i++) {
                    if (links[i].getAttribute('_index') == cur) {
                        $(links[i]).addClass("now");
                        break;
                    }
                }
            }
        };
        return pager;
    })();

    //CommentUI 对象,抽象出公用的UI部分
    var CommentUI = {
        faceBox: {
            hasInit: false,
            hasLoadPic: false,
            box: null,
            isShow: false,
            target: null,
            faceUrl: "http://static1.pplive.cn/oth/11/11/comment/images/faces/",
            faces: {
                'no': 'no.gif',
                'OK': 'OK.gif',
                '爱心': 'aixin.gif',
                '傲慢': 'aoman.gif',
                '白眼': 'baiyan.gif',
                '鄙视': 'bishi.gif',
                '闭嘴': 'bizui.gif',
                '便便': 'bianbian.gif',
                '擦汗': 'cahan.gif',
                '菜刀': 'caidao.gif',
                '差劲': 'chajin.gif',
                '承让': 'chengrang.gif',
                '吃饭': 'chifan.gif',
                '呲牙': 'ciya.gif',
                '大兵': 'dabing.gif',
                '大哭': 'daku.gif',
                '呆': 'dai.gif',
                '刀': 'dao.gif',
                '得意': 'deyi.gif',
                '发怒': 'fanu.gif',
                '奋斗': 'fengdou.gif',
                '尴尬': 'ganga.gif',
                '勾引': 'gouyin.gif',
                '鼓掌': 'guzhang.gif',
                '哈欠': 'haqian.gif',
                '害羞': 'haixiu.gif',
                '憨笑': 'hanxiao.gif',
                '哼右': 'hengyou.gif',
                '哼左': 'hengzuo.gif',
                '坏笑': 'huaixiao.gif',
                '惊恐': 'jingkong.gif',
                '惊讶': 'jingya.gif',
                '咖啡': 'kafei.gif',
                '可爱': 'keai.gif',
                '可怜': 'kelian.gif',
                '抠鼻': 'koubi.gif',
                '骷髅': 'kulou.gif',
                '酷': 'ku.gif',
                '快哭了': 'kuaikule.gif',
                '困': 'kun.gif',
                '篮球': 'lanqiu.gif',
                '冷汗': 'lenghan.gif',
                '礼物': 'liwu.gif',
                '流泪': 'liulei.gif',
                '难过': 'nanguo.gif',
                '呕吐': 'outu.gif',
                '啤酒': 'bijiu.gif',
                '瓢虫': 'piaochong.gif',
                '撇嘴': 'piezui.gif',
                '乒乓': 'pingpang.gif',
                '强': 'qiang.gif',
                '敲打': 'qiaoda.gif',
                '亲亲': 'qinqin.gif',
                '糗': 'qiu.gif',
                '拳头': 'quantou.gif',
                '弱': 'ruo.gif',
                '色': 'se.gif',
                '闪电': 'shandian.gif',
                '生日': 'shengri.gif',
                '胜利': 'shengli.gif',
                '衰': 'shuai.gif',
                '睡': 'shui.gif',
                '太阳': 'taiyang.gif',
                '调皮': 'tiaopi.gif',
                '偷笑': 'touxiao.gif',
                '晚安': 'wanan.gif',
                '微笑': 'weixiao.gif',
                '委屈': 'weiqu.gif',
                '吻': 'wen.gif',
                '握手': 'woshou.gif',
                '西瓜': 'xigua.gif',
                '吓': 'xia.gif',
                '鲜花': 'xianhua.gif',
                '谢了': 'xiele.gif',
                '心碎': 'xinsui.gif',
                '嘘': 'xu.gif',
                '疑问': 'yiwen.gif',
                '晕': 'yun.gif',
                '再见': 'zaijian.gif',
                '炸弹': 'zhadan.gif',
                '折磨': 'zhemo.gif',
                '咒骂': 'zhouma.gif',
                '猪头': 'zhutou.gif',
                '抓狂': 'zhuakuang.gif',
                '足球': 'zuqiu.gif'
            },
            perPage: 27,
            loadPic: function() {
                $(this.box).find("h4")[0].innerHTML += " 加载中...";
                var self = this,
                    o, i = 0,
                    l, html, faces = this.faces,
                    pg = this.perPage,
                    url = this.faceUrl,
                    pager, holder;
                html = "<div class='bd fc'>";
                for (o in faces) {
                    if (i % pg === 0) {
                        html += "<ul class='c_b js_cmt_face_ul' style='display:none;'>";
                    }
                    html += "<li><a onclick='return false;' href='javascript:void(0)'  title='" + o + "'><img alt='" + o + "' class='js_cmt_face_facer' src='" + url + faces[o] + "' /></a></li>";
                    if (i % pg == pg - 1) {
                        html += "</ul>";
                    }
                    i++;
                }
                if (html.lastIndexOf("</ul>") !== html.length - 5) {
                    html += "</ul>";
                }
                html += "<div class='page_con'>";
                l = Math.ceil(i / pg);
                for (i = 0; i < l; i++) {
                    html += "<a onclick='return false;' href='javascript:void(0);' title='" + (i + 1) + "' class='js_cmt_face_pager' _index='" + i + "'>" + (i + 1) + "</a>";
                }
                html += "</div></div>";
                this.box[0].innerHTML += html;

                holder = this.box.find(".js_cmt_face_ul");
                pager = this.box.find(".js_cmt_face_pager");
                pager.length && (pager.eq(0).addClass("now"));
                holder.length && (holder.eq(0).css("display", "block"));

                this.box.on("click", function(e) {
                    e.preventDefault();
                    var tgt = $(e.target),
                        ps, val;
                    if (tgt.hasClass("js_cmt_face_facer")) {
                        CommentUI.insertAtCursor(self.target, ("[" + tgt.attr('alt') + "]"));
                        self.hide();
                    } else if (tgt.hasClass("js_cmt_face_pager")) {
                        holder.css("display", "none");
                        holder[tgt.attr("_index")].style.display = 'block';
                        pager.removeClass("now");
                        tgt.addClass("now");
                    }
                    return false;
                });
                this.box.find("h4")[0].innerHTML = "常用表情";
                this.hasLoadPic = true;
            },
            init: function() {
                var fb = $(".js_cmt_facebox");
                if (fb.length) {
                    this.box = fb.eq(0);
                } else {
                    var f = CommentUI.createDom("div", "facebox js_cmt_facebox", document.body);
                    this.box = $(f);
                }
                this.box[0].innerHTML = "<div class='hd'><h4>常用表情</h4><span class='arrow'></span></div>";

                this.hasInit = true;
                $(document).on("click", function(e) {
                    e.preventDefault();
                    CommentUI.faceBox.hide();
                });
            },
            show: function(btn, input) {
                this.target = input;
                if (!this.hasInit) {
                    this.init();
                }
                if (!this.hasLoadPic) {
                    this.loadPic();
                }
                var pos = $(btn).offset(),
                    x = pos.left,
                    y = pos.top;

                this.box.css({
                    display: "block",
                    left: x - 15 + "px",
                    top: y + 25 + "px"
                });

                this.isShow = true;
            },
            hide: function() {
                this.box.css("display", "none");
                this.isShow = false;
            },
            decode: function(str) {
                var self = this;
                str = str.replace(/\[([^\[^\]]+)\]/g, function(w, w1) {
                    if (self.faces[w1]) {
                        return "<img title='" + w1 + "' src='" + self.faceUrl + self.faces[w1] + "' />";
                    }
                    return w;
                });
                return str;
            },
            urlToChar: function(_html) {
                //标签图片转换为文字
                _html = _html.replace(/<img\stitle=\"?([^"^\s]+)\"?[^>]*>/ig, function(w, w1) {
                    return '[' + w1 + ']';
                });
                return _html;
            },
            bind: function(btn, input) {
                if (!btn) {
                    return;
                }

                var self = this;
                $(btn).on("click", function(e) {
                    if (self.isShow) {
                        self.hide();
                    } else {
                        self.show(btn, input);
                    }
                    return false;
                });
            }
        },
        loginBox: {
            hasInit: false,
            isLoged: false,
            box: null,
            usernameel: null,
            passwordel: null,
            loginUrl: "http://passport.pptv.com/weblogin.do",
            init: function() {
                var box = $(".js_cmt_logBox"),
                    html, self = this;
                if (box.length) {
                    this.box = box.eq(0);
                } else {
                    //html
                    var url = encodeURIComponent(window.location.href);
                    html = '<div class="hd"><h4>登录PPTV</h4><a onclick="return false;" title="关闭" class="close js_cmt_log_close"></a></div><div class="bd c_b"><div class="left"><div class="logform"><p>登录后才可以发表评论，请先登录。</p><p><label>用户名</label><input type="text" class="js_cmt_log_username"></p><p><label>密码</label><input type="password" class="js_cmt_log_password"></p><p class="forget"><a target="_blank" title="忘记密码" href="http://passport.pptv.com/fetchpassworduser.aspx">忘记密码</a><a class="log_btn js_cmt_log_login" title="登录" href="javascript:void(0);" >登录</a></p></div><div class="oth_type"><p>使用其他帐号登录</p><a class="log2" title="新浪微博" href="http://passport.pptv.com/doSnsSinaLogin.do?returnURL=' + url + '"></a><a class="log1" title="QQ帐号" href="http://passport.pptv.com/doSnsQQLogin.do?returnURL=' + url + '"></a><a class="log3" title="人人网" href="http://passport.pptv.com/doSnsRenrenLogin.do?returnURL=' + url + '"></a></div></div><div class="right""><p>没有帐号？立即注册。</p><a class="reg_btn" target="_blank" title="注册" href="http://passport.pptv.com/registerandlogin.do">注册</a></div></div>';
                    this.box = $(CommentUI.createDom("div", "lay js_cmt_logBox", document.body));
                    this.box.html(html);
                    this.box.id = "loginBox";
                }
                this.usernameel = this.box.find(".js_cmt_log_username");
                this.passwordel = this.box.find(".js_cmt_log_password");
                // user.onLogin(function(){
                //     self.isLoged = true;
                // });

                // user.onLogout(function(){
                //     self.isLoged = false;
                // });
                user.loginEvents.add(function(){ self.isLoged = true; })
                user.logoutEvents.add(function(){ self.isLoged = false; });

                // user.loginEvents.add(function(){ window.location.reload(); });
                // user.logoutEvents.add(function(){ window.location.reload(); });

                var isFocus = false;
                this.usernameel.on('focus', function() {
                    isFocus = true;
                }).on('blur', function() {
                    isFocus = false;
                });
                this.passwordel.on('focus', function() {
                    isFocus = true;
                }).on('blur', function() {
                    isFocus = false;
                });
                this.box.on("click", function(e) {
                    e.preventDefault();
                    var tgt = $(e.target);
                    if (tgt.hasClass("js_cmt_log_close")) {
                        self.hide();
                    } else if (tgt.hasClass("js_cmt_log_login")) {
                        self.login();
                    } else if (tgt.hasClass("js_cmt_log_othlog")) {}
                }).on('keyup', function(e) {
                    if (e.key === "enter" && isFocus) {
                        self.login();
                    }
                });
                this.hasInit = true;
            },
            show: function(showFrom) {
                var self = this;
                this.showFrom = showFrom;
                login.check(function() {
                    setTimeout(function() {
                        self.onSuccess(self.showFrom);
                    }, 50);
                }, {
                    type: 'login',
                    from: 'web_comt',
                    tip: encodeURIComponent("亲，需要登录后才能评论哦")
                });

                user.readInfo(true);

                return cookie.get('PPName');
            },
            hide: function() {
                this.box.css("display", "none");
            },
            onSuccess: function() {},
            login: function() {
                var un = this.usernameel,
                    psd = this.passwordel,
                    self = this;
                if (un.value.replace(/\s/g, '') == "") {
                    CommentUI.blink(un, "red");
                    un.focus();
                    return;
                }
                if (psd.value.replace(/\s/g, '') == "") {
                    CommentUI.blink(psd, "red");
                    psd.focus();
                    return;
                }
            }
        },
        counter: counter,
        defaultValue: function(input, value) {
            input.value = value;
            input.on('focus', function() {
                if (this.value === value) {
                    this.value = '';
                }
            }).on('blur', function() {
                if (this.value === '') {
                    this.value = value;
                }
            });
        },
        blink: function(dom, color) {
            dom = $(dom);
            color = color ? color : "#D0E5FF";
            var oColor = dom.css('border-color'),
                shadow = "0 0 5px " + color;
            dom.css({
                "border-color": color,
                "box-shadow": shadow
            });
            setTimeout(function() {
                dom.css({
                    "border-color": oColor,
                    "box-shadow": "none"
                });
                setTimeout(function() {
                    dom.css({
                        "border-color": color,
                        "box-shadow": shadow
                    });
                    setTimeout(function() {
                        dom.css({
                            "border-color": oColor,
                            "box-shadow": 'none'
                        });
                    }, 500);
                }, 200);
            }, 500);
        },
        pager: pager,
        updown: {
            //cookie 格式 commentid=updown
            uped: function(tid) {
                var value = cookie.get('cmtupdown');
                return (value && (value.indexOf(',' + tid) != -1));
            },
            write: function(tid) {
                var value = cookie.get('cmtupdown');
                value = value ? value : '';
                cookie.set('cmtupdown', (value + ',' + tid), 1, 'pptv.com', '/');
            }
        },
        createDom: function(type, clsName, parent) {
            var dom = document.createElement(type);
            clsName && (dom.className = clsName);
            parent && (parent.appendChild(dom));
            return dom;
        },
        showInMiddle: function(dom) {
            dom = $(dom);
            dom.css("display", "block");
            var st = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop,
                sl = window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft;
            var h = parseInt(dom.css("height"), 10),
                w = parseInt(dom.css("width"), 10);
            dom.css({
                "margin-top": st - h / 2 + "px",
                "margin-left": sl - w / 2 + "px"
            });
        },
        setCursor: function(dom, ps) {
            ps = ps < dom.value.length ? ps : dom.value.length;
            if (dom.selectionStart || dom.selectionStart == 0) {
                dom.focus();
                dom.selectionStart = dom.selectionEnd = ps;
            } else if (document.selection) {

                var oTextRange = dom.createTextRange();
                oTextRange.moveStart('character', ps);
                oTextRange.moveEnd('character', ps);
                oTextRange.collapse(true);
                oTextRange.select();
                dom.focus();
               // var sel = document.selection.createRange();
               // sel.text = "";
               // sel.select();
            }
        },
        insertAtCursor: function(dom, value) {
            if (dom.selectionStart || dom.selectionStart == '0') {
                var startPos = dom.selectionStart,
                    endPos = dom.selectionEnd,
                    val = dom.value;
                dom.value = val.substring(0, startPos) + value + val.substring(endPos);
                dom.focus();
                dom.selectionStart = dom.selectionEnd = dom.value.length - val.length + endPos;
            } else if (document.selection) {
                dom.focus();
                sel = document.selection.createRange();
                sel.text = value;
                sel.select();
            } else {
                dom.value += value;
            }
        },
        timer: function(time) {
            var now = +new Date(),
                arr = time.split(/-|\s|:/),
                oTime, l, loop, aMinute = 60 * 1000,
                anHour = 60 * 60 * 1000,
                aDay = 24 * 60 * 60 * 1000;
            oTime = new Date(+arr[0], --arr[1], +arr[2], +arr[3], +arr[4], +arr[5]);
            l = now - oTime;
            if (l > aDay) {
                return time;
            } else if (l < aDay && l > anHour) {
                return (parseInt(l / 1000 / 60 / 60) + "小时前");
            } else if (l < anHour && l > aMinute) {
                return (parseInt(l / 1000 / 60) + "分钟前");
            } else {
                return ("刚刚");
            }
        },
        postCheck: function(postBox, postCounter, postBtn) {
            if (postBox.val().replace(/\s/g, '') == '' || (postCounter && postCounter.over)) {
                CommentUI.blink(postBox);
                return false;
            }
            CommentUI.loginBox.onSuccess = function(btn) {
                if (typeof btn === "function") {
                    btn();
                } else {
                    $(btn).trigger('click');
                }

            };
            if (!CommentUI.loginBox.show(postBtn)) {
                return false;
            }
            return true;
        },
        prePend: function(parent, node) {
            if (!parent) {
                return;
            }
            var fst;
            if (fst = parent.childNodes[0]) {
                parent.insertBefore(node, fst);
            } else {
                parent.appendChild(node);
            }
        },
        fadeOut: function(dom) {
            dom = $(dom);
            var opct = parseInt(dom.css("opacity"), 10),
                l = setInterval(function() {
                    if (opct < 100) {
                        dom.css("opacity", opct++);
                    } else {
                        dom.css("opacity", 100);
                        clearInterval(l);
                    }
                }, 20);
        },
        dftFace: "http://face.passport.pptv.com/ppface_black.jpg",
        decodeName: function(name, ip) {
            if (name || !ip) {
                return name;
            }
            return ip.replace(/(\d+.\d+.)\d+.\d+/, function(w, w1) {
                return w1 + "*";
            });
        }
    };
    $.CommentUI = CommentUI;

    //评论列表
    var Comment = function(boxId, ids, tags, options) {
        this.options = {
            pageSize: 10,
            defaultText: "",
            maxNum: 300,
            tabs: [''],
            defaultShow: 0, //默认显示第几个tab
            type: "short-pages", // long short onpage pages
            showFrom: false,
            showHot: false,
            show: [0],
            moreUrl: ""
        };
        if (options) {
            this.options = merge(this.options, options);
        }
        this.hotLoaded = false;
        this.box = $("#" + boxId);
        if (!this.box) return; //判断是否存在有评论ID
        this.postBtn = this.box.find(".js_cmt_post_btn");
        this.postBtn && (this.isPosting = false);
        this.asy = this.box.find(".js_cmt_asy")[0];
        this.postBox = this.box.find(".js_cmt_post_area");
        this.tabInit = [];
        this.postCount = this.box.find(".js_cmt_post_count");
        this.commentNone = this.box.find(".js_cmt_none");
        this.commentCount = this.box.find(".js_cmt_count");
        this.sccs = this.box.find(".js_cmt_sccs");
        this.comment = new CommentObject(ids, tags, this.options.pageSize);
        this.inited = false;
        this.init();
    };
    Comment.prototype = {
        constructor: Comment,
        init: function() {
            var self = this,
                opt = self.options,
                box = self.box,
                tab, listDiv, pice, data, loadingBox, hotBox, newBox;
            self.loadingBox = $(CommentUI.createDom("div", "js_cmt_loading", self.box[0]));
            self.loadingBox.html("评论加载中..");
            CommentUI.faceBox.bind($(".js_cmt_facebtn")[0], self.postBox[0]); //表情
            if (this.postBox && this.postCount) {
                this.postCounter = new CommentUI.counter(this.postBox[0], this.postCount, opt.maxNum);
                CommentUI.defaultValue(this.postBox, opt.defaultText);
            } //字数统计，默认值
            if (!self.sccs.length) {
                self.sccs = CommentUI.createDom("div", "success js_cmt_sccs", box[0]);
                self.sccs.style.display = 'none';
                self.sccs.innerHTML = "<em>发布成功</em>";
            }
            listDiv = box.find(".js_cmt_list");
            if (!listDiv.length) {
                listDiv = $(CommentUI.createDom("div", "cmt_list js_cmt_list", box[0]));
            }
            this.list = listDiv;
            this.list[0].innerHTML = "";
            if (self.options.showHot) {
                this.loadShortHot();
            }

            //抢沙发链接 焦点
            if (this.commentNone) {
                this.commentNone.find('a').on('click', function(e) {
                    e.preventDefault();
                    if (self.postBox) {
                        self.postBox.focus();
                    }
                });
            }

            //创建最新的容器
            this.newBox = newBox = $(CommentUI.createDom("div", "cmt_list_new", listDiv[0]));
            newBox.hide();
            //newBox.style.display = "none";
            newBox[0].innerHTML = '<div class="hd"><h2>最新评论</h2><em class="arrow"></em></div><div class="bd cmt_new_holder"></div>';
            this.newHolder = newBox.find('.cmt_new_holder');

            //get list
            if (opt.type.indexOf("short") != -1) {
                //短评
                this.getPage(0, "short");
            } else if (opt.type.indexOf("long") != -1) {
                //长评
                this.getPage(0, "long");
            }

            //post
            if (this.postBtn) {
                this.postBtn.on("click", function(e) {
                    e.preventDefault();
                    var bt = this;
                    if (bt.isPosting) {
                        return;
                    }
                    if (!CommentUI.postCheck(self.postBox, self.postCounter, bt)) {
                        return;
                    }
                    bt.isPosting = true;
                    window[self.comment.cmtIndex + "_doPost"] = function(res) {
                        if (res.error !== undefined) {
                            alert(res.message);
                            return;
                        }
                        var tmp = self.postBox.val();
                        self.postBox.val("");
                        self.postCount[0].innerHTML = "还可输入<strong>" + self.options.maxNum + "</strong>个字";
                        self.sccs.style.display = 'block';
                        self.hideNone();
                        setTimeout(function() {
                            self.sccs.style.display = 'none';
                            //显示新增的信息
                            if (opt.type.indexOf("short") != -1) {
                                self.addShort(tmp);
                            }
                            self.newBox.show();
                            self.commentCount[0].innerHTML = (+self.commentCount[0].innerHTML) + 1;
                        }, 3000);
                        bt.isPosting = false;
                    };
                    self.comment.post(self.postBox.val(), +self.asy.checked, self.comment.cmtIndex + "_doPost");
                    setTimeout(function() {
                        bt.isPosting = false;
                    }, 10000);
                });
            }

        },
        voteCallBack: function(res, btn) {
            if (res.error !== undefined) {
                alert(res.message);
            } else {
                var n = $(btn.parentNode).find("span");
                n[0].innerHTML = parseInt(n[0].innerHTML) + 1;
            }
        },
        getPage: function(n, shortOrLong) {
            var self = this,
                opt = this.options,
                tab = self.tab,
                _type = shortOrLong == "short" ? 1 : 2;
            window[self.comment.cmtIndex + '_getPage'] = function(res) {
                if (res.error) {
                    self.loadingBox.css('display', 'block').html(res.message);
                } else {
                    self.comment.fb = res.fb;
                    self.comment.et = res.tm;
                    self.loadingBox.css('display', 'none').html("");
                    var o, i = 0,
                        list, j, l, pice, data;
                    data = res.data;
                    for (o in data) {
                        list = data[o].list;
                        if (data[o].count === 0) {
                            self.showNone();
                        } else {
                            self.hideNone();
                            self.newBox.show();
                        }
                        pice = document.createDocumentFragment();
                        var pageWrap, div = self.newHolder;
                        pageWrap = CommentUI.createDom("div", "js_cmt_page_holder", pice);
                        //pageWrap = $('<div class="js_cmt_page_holder" />');
                        pageWrap.setAttribute("_index", data[o].page - 1);
                        if (shortOrLong == "short") {
                            self.getShortPage(pageWrap, pice, list, o);
                        } else {
                            self.getLongPage(pageWrap, pice, list, o);
                        }
                        if (opt.type.indexOf("onepage") != -1) {
                            //显示查看更多
                            var a = CommentUI.createDom("a", "notes", pageWrap);
                            a.title = '查看更多';
                            a.href = opt.moreUrl; //window.location.href.replace('onepage', 'pages');
                            a.target = "_blank";
                            a.innerHTML = "查看更多";
                            // pageWrap.innerHTML += "<a class='notes' title='查看更多' href='"++"'>查看更多</a>"
                        } else if (opt.type.indexOf("pages") != -1) {
                            //显示分页
                            if (!div.find(".page_con").length) {
                                var pager = CommentUI.createDom("div", "page_con js_cmt_out_pager", div[0]);
                                new CommentUI.pager(pager, data[o].count, opt.pageSize, function(i) {
                                    //获取某页
                                    var pages = $(pager.parentNode).find(".js_cmt_page_holder"),
                                        k, l;
                                    for (k = 0, l = pages.length; k < l; k++) {
                                        if (pages[k].getAttribute("_index") == i) {
                                            pages.css("display", "none");
                                            pages[k].style.display = 'block';
                                            return;
                                        }
                                    }
                                    pages.css("display", "none");
                                    if (opt.type.indexOf("short") != -1) {
                                        self.getPage(i, "short");
                                    } else if (opt.type.indexOf("long") != -1) {
                                        self.getPage(i, "long");
                                    }
                                });
                            }
                        }
                        div.find(".js_cmt_page_holder").css("display", 'none'); //连续翻页bug
                        div[0].insertBefore(pice, div.find(".js_cmt_out_pager")[0]);
                        self.commentCount && i == 0 && (self.commentCount[0].innerHTML = data[o].count);
                        i++;
                        break;
                    }
                    self.inited = true;
                }
            };
            self.comment.getList(self.comment.cmtIndex + '_getPage', n + 1, _type);
        },
        getShortPage: function(pageWrap, pice, list, topicid) {
            pageWrap.innerHTML = "";
            var self = this,
                opt = self.options,
                j, l;
            for (j = 0, l = list.length; j < l; j++) {
                var dl, dt, dd, qt, bar, item = list[j],
                    userName, vip, viphtml;
                dl = $(CommentUI.createDom("dl", "c_b"));
                dl.attr("cid", item.comment_id);
                dl.attr("tid", topicid);
                dl.attr("pid", item.parent_id);
                dl.attr("count", item.reply_count);
                userName = CommentUI.decodeName((item.user.nickname || item.user.username), item.ip);
                vip = parseInt(item.user.vip) ? 'ico_1' : 'ico_0'; //http://viptv.pptv.com/year_vip/?web_pl=vip

                var isvip = parseInt(item.user.vip);
                viphtml = UserIco(isvip);

                //viphtml = "<a class='" + vip +"' href='http://viptv.pptv.com/?web_pl=vip' target='_blank'></a>";
                dl.html("<dt><a onclick='return false;' title='" + userName + "' href='javascript:void(0);'><img width='40' height='40' title='" + userName + "' src='" + (item.user.avatar || CommentUI.dftFace) + "'></a></dt>");
                dd = CommentUI.createDom("dd", "", dl[0]);
                if (item.ifdel) {
                    dd.innerHTML = "该评论已被删除";
                } else {
                    dd.innerHTML += "<div class='cmt_con js_cmt_info'><div class='userInfo c_b'><span class='user'>" + userName + "：</span>" + viphtml + "</div>" + CommentUI.faceBox.decode(item.content) + "</div>";
                    qt = item.quote;
                    if (qt && (typeof qt === "object")) {
                        viphtml = UserIco(qt.user.vip);
                        var qtUserName = CommentUI.decodeName((qt.user.nickname || qt.user.username), qt.ip);
                        if (qt.ifdel) {
                            dd.innerHTML += "<div class='quotebox'><span class='arrow'></span><div class='quotelist'><div class='quote end'><div class='cmt_con'><span class='user'>" + qtUserName + "：</span>该评论已被删除</div><div class='pub_sta c_b' style='display:none;'><span class='put_time js_cmt_time' time='" + qt.create_time + "'>" + CommentUI.timer(qt.create_time) + "</span>" + (opt.showFrom ? ("<span class='from'>来自<a title='" + item.topic_title + "' href='" + decodeURIComponent(item.topic_link) + "'>" + item.topic_title + "</a></span>") : "") + "<div class='state'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_qt_reply' title='回复'>回复</a></div></div></div></div></div>"
                        } else {
                            dd.innerHTML += "<div class='quotebox'><span class='arrow'></span><div class='quotelist'><div class='quote end'><div class='cmt_con'><div class='userInfo c_b'><span class='user'>" + qtUserName + "：</span>" + viphtml + "</div>" + CommentUI.faceBox.decode(qt.content.substring(0, 300)) + "</div><div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + qt.create_time + "'>" + CommentUI.timer(qt.create_time) + "</span>" + (opt.showFrom ? ("<span class='from'>来自<a title='" + item.topic_title + "' href='" + decodeURIComponent(item.topic_link) + "'>" + item.topic_title + "</a></span>") : "") + "<div class='state'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_qt_reply' title='回复'>回复</a></div></div></div></div></div>";
                        }
                    }
                    dd.innerHTML += "<div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span>" + (opt.showFrom ? "<span class='from'>来自<a title='" + item.topic_title + "' href='" + decodeURIComponent(item.topic_link) + "'>" + item.topic_title + "</a></span>" : "") + "<div class='state'><a onclick='return false;' title='回复' href='javascript:void(0);' class='js_cmt_reply'>回复</a></div></div>";
                }
                dl.on("click", function(e) {
                    e.preventDefault();
                    var tgt = $(e.target),
                        _dl = $(this);
                    if (tgt.hasClass('js_cmt_up')) {
                        if (!CommentUI.updown.uped(_dl.attr("cid"))) {
                            window[self.comment.cmtIndex + "_up"] = function(res) {
                                self.voteCallBack(res, tgt);
                                CommentUI.updown.write(_dl.attr("cid"));
                            };
                            self.comment.up(_dl.attr("cid"), self.comment.cmtIndex + "_up", _dl.attr("tid"));
                        }
                    } else if (tgt.hasClass('js_cmt_down')) {
                        if (!CommentUI.updown.uped(_dl.attr("cid"))) {
                            window[self.comment.cmtIndex + "_down"] = function(res) {
                                self.voteCallBack(res, tgt);
                                CommentUI.updown.write(_dl.attr("cid"));
                            };
                            self.comment.down(_dl.attr("cid"), self.comment.cmtIndex + "_down", _dl.attr("tid"));
                        }
                    } else if (tgt.hasClass('js_cmt_reply')) {
                        _dl.find(".js_cmt_reply_qtpost").css("display", "none");
                        _dl.find(".js_cmt_reply_qtlist").css("display", "none");
                        _dl.attr("qtshow", "false");
                        if (_dl.attr("show") == "true") {
                            _dl.find(".js_cmt_reply_post").css("display", "none");
                            _dl.find(".js_cmt_reply_list").css("display", "none");
                            _dl.attr("show", "false");
                        } else {
                            self.showReply(_dl, false);
                        }
                    } else if (tgt.hasClass('js_cmt_qt_reply')) {
                        _dl.find(".js_cmt_reply_post").css("display", "none");
                        _dl.find(".js_cmt_reply_list").css("display", "none");
                        _dl.attr("show", "false");
                        if (_dl.attr("qtshow") == "true") {
                            _dl.find(".js_cmt_reply_qtpost").css("display", "none");
                            _dl.find(".js_cmt_reply_qtlist").css("display", "none");
                            _dl.attr("qtshow", "false");
                        } else {
                            self.showReply(_dl, true);
                        }
                    }
                    // else if (tgt.hasClass('js_cmt_asy') || tgt.hasClass('js_cmt_qtasy')) {
                    // if (tgt.checked) {
                    // window.open("http://passport.pptv.com/blogbound.aspx");
                    // }
                    // }
                });

                $(pageWrap).append(dl);
            }
        },
        getLongPage: function(pageWrap, pice, list, topicid) {
            var ul = CommentUI.createDom("ul", "", pageWrap);
            for (j = 0, l = list.length; j < l; j++) {
                var li, dd, qt, bar, item = list[j],
                    userName, url = 'http://comment.aplusapi.pptv.com/yingping/?topic_id=' + topicid + '&cmt_id=' + item.comment_id;
                li = $(CommentUI.createDom("li", "", ul));
                li.attr("cid", item.comment_id);
                li.attr("tid", topicid);
                if (item.ifdel) {
                    li.html('该评论已被删除');
                } else {
                    userName = CommentUI.decodeName((item.user.nickname || item.user.username), item.ip);
                    item.content = item.content.substring(0, 150);
                    li.html("<p class='cmt_tit'><a class='title' title='" + item.title + "' href='" + url + "'>" + item.title + "</a><span class='time js_cmt_time'>" + CommentUI.timer(item.create_time) + "</span></p><p class='cmt_con'>" + CommentUI.faceBox.decode(item.content) + "(<a class='all' title='查看全文' href='" + url + "'>查看全文</a>)</p><p class='cmt_panel c_b'><span class='name'>" + userName + "</span><span class='status'><a class='cmt_reply' title='回复' href='" + url + "'>回复</a></span></p>");
                }
            }
        },
        showReply: function(dl, isQt) {
            var _qt = isQt ? "qt" : "";
            if (dl.attr(_qt + "loaded")) {
                dl.find(".js_cmt_reply_" + _qt + "post").css("display", "block");
                dl.find(".js_cmt_reply_" + _qt + "list").css("display", "block");
                CommentUI.setCursor(dl.find(".js_cmt_reply_" + _qt + "post textarea")[0], 0);
            } else {
                var self = this,
                    opt = this.options,
                    dd = dl.find("dd"),
                    tid = dl.attr("tid"),
                    cid = isQt ? dl.attr("pid") : dl.attr("cid"),
                    area, asy;
                window[self.comment.cmtIndex + '_showReply'] = function(res) {
                    if (res.error != undefined) {
                        alert(res.message);
                        return;
                    }
                    dd[0].innerHTML += "<div class='add js_cmt_reply_" + _qt + "post'><div class='txt_con'><em class='arrow'></em><div><textarea class='js_cmt_reply_" + _qt + "area' ></textarea></div></div><div class='pub_link'><a onclick='return false;' class='input_face js_cmt_" + _qt + "facebtn' title='插入表情' href='javascript:void(0)'>插入表情</a><label><input class='js_cmt_" + _qt + "asy' type='checkbox' checked='checked'>同步到微博</label><div class='btn'><span class='js_cmt_" + _qt + "reply_count'>还可输入<strong>" + opt.maxNum + "</strong>个字</span><a onclick='return false;' class='pub_btn js_cmt_" + _qt + "reply_btn' href='javascript:void(0);'>发布</a></div></div></div>";
                    var pice, quotebox, pageholder, list, i, l, pager, pages, loaded = false;
                    pice = document.createDocumentFragment();
                    quotebox = CommentUI.createDom("div", "quotebox js_cmt_reply_" + _qt + "list", pice);
                    quotebox.innerHTML = "<span class='arrow'></span>";
                    pageholder = CommentUI.createDom("div", "quotelist js_cmt_reply_" + _qt + "page_holder", quotebox);
                    pageholder.setAttribute("_index", "0");

                    list = res.list;
                    for (i = 0, l = list.length; i < l; i++) {
                        var item = list[i],
                            qt, userName;
                        qt = CommentUI.createDom("div", "quote", pageholder);
                        qt.setAttribute("cid", item.comment_id);
                        userName = CommentUI.decodeName((item.user.nickname || item.user.username), item.ip);
                        if (item.ifdel) {
                            qt.innerHTML = "<p class='cmt_con'>该评论已被删除</p><div class='pub_sta c_b' style='display:none;'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_" + _qt + "reply' href='javascript:void(0);'>回复</a></div></div>";
                        } else {
                            qt.innerHTML = "<p class='cmt_con'>" + userName + "：" + CommentUI.faceBox.decode(item.content.substring(0, 300)) + "</p><div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_" + _qt + "reply' href='javascript:void(0);'>回复</a></div></div>";
                        }
                    }
                    //pager
                    area = dl.find(".js_cmt_reply_" + _qt + "area");
                    if (res.count > 10) {
                        pager = CommentUI.createDom("div", "page_con js_cmt_reply_" + _qt + "pager", quotebox);
                        new CommentUI.pager(pager, res.count, 10, function(j) {
                            pages = quotebox.find(".js_cmt_reply_" + _qt + "page_holder");
                            pages.css("display", "none");
                            for (i = 0, l = pages.length; i < l; i++) {
                                if (pages[i].attr("_index") == j) {
                                    pages[i].css("display", "block");
                                    area.focus();
                                    return;
                                }
                            }
                            self.getReply(tid, cid, j, quotebox, isQt);
                            CommentUI.setCursor(area[0], 0);
                        });
                    }
                    CommentUI.setCursor(area[0], 0);
                    dd[0].appendChild(pice);
                    dl.attr(_qt + "loaded", "true");
                    CommentUI.faceBox.bind(dl.find(".js_cmt_" + _qt + "facebtn"), area[0]);
                    //字数统计
                    asy = dl.find(".js_cmt_" + _qt + "asy")[0];
                    dl[_qt + "postCounter"] = new CommentUI.counter(area[0], dl.find(".js_cmt_" + _qt + "reply_count"), opt.maxNum);
                    //事件
                    dl.on("click", function(e) {
                        var tgt = $(e.target);
                        e.preventDefault();
                        if (tgt.hasClass("js_cmt_" + _qt + "reply_btn")) {
                            e.preventDefault();
                            //发表按钮
                            var bt = tgt;
                            if (bt.isPosting) {
                                return;
                            }
                            window[self.comment.cmtIndex + "_reply"] = function(res) {
                                window[self.comment.cmtIndex + "_reply"] = function() {} //防止重复提交alert错误提示
                                if (res.error !== undefined) {
                                    alert(res.message);
                                    return;
                                }
                                var tmp = area[0].value;
                                self.addReply(dl, tmp, isQt);
                                area[0].value = "";
                                bt.isPosting = false;
                            };
                            if (!CommentUI.postCheck(area, dl[_qt + "postCounter"], function() {
                                     self.comment.reply(cid, area[0].value, +asy.checked, self.comment.cmtIndex + "_reply");
                                 })) {
                                 return;
                             }

                            bt.isPosting = true;

                            self.comment.reply(cid, area[0].value, +asy.checked, self.comment.cmtIndex + "_reply");
                            setTimeout(function() {
                                bt.isPosting = false;
                            }, 10000);
                        } else if (tgt.hasClass("js_cmt_reply_" + _qt + "reply")) {
                            //回复按钮
                            area[0].value = "|| " + $.CommentUI.faceBox.urlToChar($(tgt[0].parentNode.parentNode.parentNode).find("p").html());
                            CommentUI.setCursor(area[0], 0);
                        }
                    });
                };
                this.comment.getReply(tid, cid, 1, 10, self.comment.cmtIndex + '_showReply');
            }
            dl.attr(_qt + "show", "true");
        },
        getReply: function(tid, cid, pg, quotebox, isQt) {
            var _qt = isQt ? "qt" : "";
            var self = this;
            window[self.comment.cmtIndex + '_getReply'] = function(res) {
                var pice, pageholder, list, i, l;
                pice = document.createDocumentFragment();
                pageholder = CommentUI.createDom("div", "quotelist js_cmt_reply_" + _qt + "page_holder", pice);
                pageholder.setAttribute("_index", pg);
                list = res.list;
                for (i = 0, l = list.length; i < l; i++) {
                    var item = list[i],
                        qt, userName;
                    qt = CommentUI.createDom("div", "quote", pageholder);
                    userName = CommentUI.decodeName((item.user.nickname || item.user.username), item.ip);
                    if (item.ifdel) {
                        qt.innerHTML = '该评论已被删除';
                    } else {
                        qt.innerHTML = "<p class='cmt_con'>" + userName + "：" + CommentUI.faceBox.decode(item.content) + "</p><div class='pub_sta c_b'><span class='put_time js_cmt_time' time='" + item.create_time + "'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_" + _qt + "reply' href='javascript:void(0);'>回复</a></div></div>";
                    }
                }
                quotebox.insertBefore(pice, quotebox.find(".js_cmt_reply_" + _qt + "pager"));
            };
            this.comment.getReply(tid, cid, (pg + 1), 10, self.comment.cmtIndex + '_getReply');
        },
        addShort: function(value, qouteText) {
            var self = this,
                pageHolders = self.list.find(".js_cmt_page_holder"),
                current, i, l, dl, userInfo, qtHtml, vip, viphtml;
            for (i = 0, l = pageHolders.length; i < l; i++) {
                if ($(pageHolders[i]).css("display") == "block") {
                    current = pageHolders[i];
                    break;
                }
            }
            if (!current) {
                current = pageHolders[0];
            }
            qtHtml = '<div class="quotebox"><span class="arrow"></span><div class="quotelist"><div class="quote end"><div class="cmt_con">' + qouteText + '</div></div></div></div>'
            dl = $(document.createElement("dl"));
            dl.className = "c_b";
            dl.css("opacity", "0");
            CommentUI.prePend(current, dl[0]);
            CommentUI.fadeOut(dl);
            userInfo = user.info;
            vip = parseInt(userInfo.isVip) ? 'ico_1' : 'ico_0'; //http://viptv.pptv.com/year_vip/?web_pl=vip
            var isvip = parseInt(userInfo.isVip);
            viphtml = UserIco(isvip);

            //viphtml = "<a class='" + vip +"' href='http://viptv.pptv.com/?web_pl=vip' target='_blank'></a>";
            dl[0].innerHTML = "<dt><a onclick='return false;' href='javascript:void(0);' title='" + (userInfo.Nickname || userInfo.UserName) + "'><img width='48' height='48' src='http://face.passport.pplive.com/" + userInfo.HeadPic + "' title='" + (userInfo.Nickname || userInfo.UserName) + "'></a></dt><dd><div class='cmt_con js_cmt_info'><div class='userInfo c_b'><span class='user'>" + (userInfo.Nickname || userInfo.UserName) + "：</span>" + viphtml + "</div>" + CommentUI.faceBox.decode(value) + "</div>" + (qouteText ? qtHtml : "") + "<div class='pub_sta c_b'><span class='put_time js_cmt_time'>刚刚</span></div></dd>"
        },
        addReply: function(dl, value, isQt) {
            var self = this,
                qt = isQt ? "qt" : '',
                pageHolders = dl.find(".js_cmt_reply_" + qt + "page_holder"),
                current, i, l, quote, userInfo;
            for (i = 0, l = pageHolders.length; i < l; i++) {
                if ($(pageHolders[i]).is(":visible")) {
                    current = pageHolders[i];
                    break;
                }
            }
            //假的回复
            quote = document.createElement("div");
            quote.className = "quote";
            //  quote.css("opacity", "0");
            CommentUI.prePend(current, quote);
            //    CommentUI.fadeOut(quote);
            //          dl.closeTimer =   setTimeout(function(){
            dl.find(".js_cmt_reply_" + qt + "post").css("display", "none");
            dl.find(".js_cmt_reply_" + qt + "list").css("display", "none");
            if (!qt) {
                var _curCount = parseInt(dl.attr("count"));
                dl.attr('count', _curCount + 1);
                dl.find(".js_cmt_reply").html("回复");
            }
            //              clearInterval(dl.closeTimer)
            dl.attr("qtshow", "false");
            dl.attr("show", "false");
            //            }, 3000);
            userInfo = user.info;
            quote.innerHTML = "<div class='quote' ><p class='cmt_con'>" + (userInfo.Nickname || userInfo.UserName) + "：" + CommentUI.faceBox.decode(value) + "</p><div class='pub_sta c_b'><span class='put_time js_cmt_time'>刚刚</span><div class='state' style='display:none;'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_reply_" + qt + "reply' title='回复'>回复</a></div></div></div>";

            //假的评论
            var cmt_con = dl.find(".cmt_con"),
                _index = isQt ? 1 : 0;
            if (cmt_con && cmt_con[_index]) {
                self.addShort(value, cmt_con[_index].innerHTML);
            }


        },
        loadShortHot: function() {
            var self = this,
                hotBox;
            hotBox = $(CommentUI.createDom("div", "cmt_list_hot"));
            hotBox.innerHTML = '<div class="hd"><h2>最热评论</h2><em class="arrow"></em></div><div class="bd cmt_hot_holder"></div>';
            self.hotHolder = hotBox.find('.cmt_hot_holder');

            window[self.comment.cmtIndex + '_getHot'] = function(data) {
                if (data.result == 0 || !data || !data.list || data.list.length === 0) {
                    return;
                } else {
                    $.CommentUI.prePend(self.list[0], hotBox[0]);
                    var list = data.list;
                    self.getShortPage(self.hotHolder, '', list.slice(0, 2), self.comment.ids[0]);
                    self.hotLoaded = true;
                }
            };
            this.comment.getHot(1, self.comment.cmtIndex + '_getHot');
        },
        showNone: function() {
            this.commentNone && this.commentNone.css('display', 'block');
        },
        hideNone: function() {
            this.commentNone && this.commentNone.css('display', 'none');
        }
    };
    $.Comment = Comment;

    var singleComment = function(boxId, ids, tags, cid, options) {
        this.options = {
            pageSize: 10,
            defaultText: "",
            maxNum: 300
        };
        if (options) {
            this.options = merge(this.options, options);
        }
        this.ids = ids;

        this.commentId = cid;
        this.box = $("#" + boxId);
        this.ctn = this.box.find(".js_cmt_container");
        this.list = this.box.find(".js_cmt_reply_list");
        this.postBtn = this.box.find(".js_cmt_post_btn");
        this.postBtn && (this.isPosting = false);
        this.asy = this.box.find(".js_cmt_asy");
        this.postBox = this.box.find(".js_cmt_post_area");
        this.postCount = this.box.find(".js_cmt_post_count");
        this.replyCount = this.box.find(".js_cmt_reply_count");
        this.singleComment = new CommentObject(ids, tags, this.options.pageSize); //用于获取单条评论
        this.ids.push(cid); //发表回复的时候用post接口，同时发表到ids和cid
        this.postComment = new CommentObject(this.ids, tags, this.options.pageSize); //用于发表
        this.getComment = new CommentObject([cid], "", this.options.pageSize); //用于获取评论列表
        this.init();

    };
    singleComment.prototype = {
        constructor: singleComment,
        init: function() {
            var self = this,
                opt = self.options,
                box = self.box,
                tab, listDiv, pice, data
            ;

            window[self.singleComment.cmtIndex + '_getSingle'] = function(res) {
                var userName = CommentUI.decodeName((res.user.nickname || res.user.username), res.ip);
                if (res.error) {
                    return;
                }
                if (box.find("#js_cmt_headpic")) {
                    box.find("#js_cmt_headpic").html('<a onclick="return false;" title="' + userName + '" href="javascript:void(0);"><img width="48" height="48" alt="' + userName + '" src="' + res.user.avatar + '"></a>')
                }
                if (box.find("#js_cmt_author")) {
                    box.find("#js_cmt_author").html(userName);
                }
                if (box.find("#js_cmt_time")) {
                    box.find("#js_cmt_time").html(res.user.create_time);
                }
                if (box.find("#js_cmt_content")) {
                    box.find("#js_cmt_content").html(res.content);
                }
                if (box.find("#js_cmt_up_num")) {
                    box.find("#js_cmt_up_num").html(res.good);
                }
                if (box.find("#js_cmt_down_num")) {
                    box.find("#js_cmt_down_num").html(res.bad);
                }
            };

            this.singleComment.getSingle(this.commentId, self.singleComment.cmtIndex + '_getSingle');

            CommentUI.faceBox.bind($(".js_cmt_facebtn")[0], self.postBox); //表情按钮
            if (this.postBox && this.postCount) {
                this.postCounter = new CommentUI.counter(this.postBox[0], this.postCount, opt.maxNum);
                CommentUI.defaultValue(this.postBox, opt.defaultText);
            } //字数统计//default value
            if (!this.ctn) {
                this.ctn = $(CommentUI.createDom("div", "cmt_list js_cmt_container", box));
            }
            if (!this.list) {
                this.list = $(CommentUI.createDom("div", "cmt_film js_cmt_reply_list", ctn));
            }
            if (this.postBtn) {
                this.postBtn.on("click", function(e) {
                    e.preventDefault();
                    var bt = this;
                    if (bt.isPosting) {
                        return;
                    }
                    if (!CommentUI.postCheck(self.postBox, self.postCounter, bt)) {
                        return;
                    }
                    bt.isPosting = true;
                    window[self.postComment.cmtIndex + '_post'] = function(res) {
                        if (res.error !== undefined) {
                            alert(res.message);
                            return;
                        }
                        var tmp = self.postBox.val();
                        self.postBox.val("");
                        self.addNew(tmp);
                        bt.isPosting = false;
                    };
                    self.postComment.post(self.postBox.val(), +self.asy.checked, self.postComment.cmtIndex + '_post');
                    setTimeout(function() {
                        bt.isPosting = false;
                    }, 10000);
                });
            }

            box.on("click", function(e) {
                e.preventDefault();
                var tgt = $(e.target),
                    info;
                if (tgt.hasClass("js_cmt_reply_reply")) {
                    if (self.postBox) {
                        info = $(tgt.parentNode.parentNode.parentNode);
                        self.postBox.value = "|| " + info.find("span").html() + info.find("p").html();
                        CommentUI.setCursor(self.postBox[0], 0);
                    }
                } else if (tgt.hasClass("js_cmt_up")) {
                    if (!CommentUI.updown.uped(self.commentId)) {
                        window[self.singleComment.cmtIndex + '_up'] = function(res) {
                            self.voteCallBack(res, tgt);
                            CommentUI.updown.write(self.commentId);
                        }
                        self.singleComment.up(self.commentId, self.singleComment.cmtIndex + '_up');
                    }
                } else if (tgt.hasClass("js_cmt_down")) {
                    if (!CommentUI.updown.uped(self.commentId)) {
                        window[self.singleComment.cmtIndex + '_down'] = function(res) {
                            self.voteCallBack(res, tgt);
                            CommentUI.updown.write(self.commentId);
                        }
                        self.singleComment.down(self.commentId, self.singleComment.cmtIndex + '_down');
                    }
                } else if (tgt.hasClass("js_cmt_reply")) {
                    self.postBox && (self.postBox.focus());
                }
                // else if (tgt.hasClass("js_cmt_asy")) {
                // if (tgt.checked) {
                // window.open("http://passport.pptv.com/blogbound.aspx");
                // }
                // }
            });
            this.getReply(0);
        },
        getReply: function(pg) {
            var self = this,
                box = self.box;
            window[self.getComment.cmtIndex + '_getList'] = function(res) {
                if (res.error != undefined) {
                    alert(res.message);
                    return;
                }
                self.getComment.fb = res.fb;
                self.getComment.et = res.tm;
                var list = self.list,
                    ctn = self.ctn,
                    pice, pageholder, pager = list.find(".js_cmt_reply_pager"),
                    i, l, data;
                pice = document.createDocumentFragment();
                pageholder = CommentUI.createDom("div", "js_cmt_reply_page_holder", pice);
                pageholder.setAttribute("_index", pg);
                data = res.data[self.commentId];
                box.find(".js_cmt_reply_count").html(data.count);

                for (i = 0, l = data.list.length; i < l; i++) {
                    var item = data.list[i],
                        dl, userName;
                    dl = CommentUI.createDom("dl", "c_b", pageholder);
                    userName = CommentUI.decodeName((item.user.nickname || item.user.username), item.ip);
                    if (item.ifdel) {
                        dl.innerHTML = "<dt><a onclick='return false;' title='" + userName + "' href='javascript:void(0);'><img width='48' height='48' alt='' src='" + (item.user.avatar || CommentUI.dftFace) + "'></a></dt><dd><div class='cmt_con  js_cmt_info'><span class='user'>" + userName + ":</span><p>该评论已被删除</p></div><div class='pub_sta c_b' style='display;none;'><span class='put_time js_cmt_time'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_reply' href='javascript:void(0);'>回复</a></div></div></dd>";
                    }
                    dl.innerHTML = "<dt><a onclick='return false;' title='" + userName + "' href='javascript:void(0);'><img width='48' height='48' alt='' src='" + (item.user.avatar || CommentUI.dftFace) + "'></a></dt><dd><div class='cmt_con  js_cmt_info'><span class='user'>" + userName + ":</span><p>" + CommentUI.faceBox.decode(item.content) + "</p></div><div class='pub_sta c_b'><span class='put_time js_cmt_time'>" + CommentUI.timer(item.create_time) + "</span><div class='state'><a onclick='return false;' title='回复' class='js_cmt_reply_reply' href='javascript:void(0);'>回复</a></div></div></dd>";
                }
                if (!pager && data.count > self.options.pageSize) {
                    //分页
                    var pageCtn = CommentUI.createDom("div", "page_con js_cmt_reply_pager", pice);
                    new CommentUI.pager(pageCtn, data.count, self.options.pageSize, function(n) {
                        pages = list.find(".js_cmt_reply_page_holder");
                        pages.css("display", "none");
                        for (i = 0, l = pages.length; i < l; i++) {
                            if (pages[i].attr("_index") == n) {
                                pages[i].css("display", "block");
                                return;
                            }
                        }
                        self.getReply(n);
                    });
                }
                pager ? (list.insertBefore(pice, pager)) : (list.appendChild(pice));
            };
            this.getComment.getList(self.getComment.cmtIndex + '_getList', (pg + 1), 1);
        },
        voteCallBack: function(res, btn) {
            if (res.error !== undefined) {
                alert(res.message);
            } else {
                var n = $(btn.parentNode).find("span");
                n.innerHTML = parseInt(n.innerHTML) + 1;
            }
        },
        addNew: function(value) {
            var self = this,
                pageHolders = self.list.find(".js_cmt_reply_page_holder"),
                current, i, l, dl, userInfo;
            for (i = 0, l = pageHolders.length; i < l; i++) {
                if (pageHolders[i].css("display", "block")) {
                    current = pageHolders[i];
                    break;
                }
            }
            dl = $(document.createElement("dl"));
            dl.className = "c_b";
            dl.css("opacity", "0");
            CommentUI.prePend(current, dl);
            CommentUI.fadeOut(dl);
            userInfo = user.info;
            dl.innerHTML = "<dt><a onclick='return false;' href='javascript:void(0);' title='" + (userInfo.Nickname || userInfo.UserName) + "'><img width='48' height='48' src='http://face.passport.pplive.com/" + userInfo.HeadPic + "' alt=''></a></dt><dd><div class='cmt_con  js_cmt_info'><span class='user'>" + (userInfo.Nickname || userInfo.UserName) + ":</span><p>" + value + "</p></div><div class='pub_sta c_b'><span class='put_time js_cmt_time'>刚刚</span><div class='state' style='display:none;'><a onclick='return false;' href='javascript:void(0);' class='js_cmt_reply_reply' title='回复'>回复</a></div></div></dd>"
        }
    };
    $.singleComment = singleComment;

    //运行comment
    (function() {
        var el = $('#comment');
        if (webcfg.comment && el) {
            var done = false,
                sleep;

            function initComment() {
                if (done) return;
                var st = document.documentElement.scrollTop || document.body.scrollTop,
                    ch = document.documentElement.clientHeight || document.body.clientHeight;
                var top = el.offset().top;

                if (st + ch >= top) {
                    var cmt = new $.Comment('comment', webcfg.comment.ids, webcfg.comment.tags, webcfg.comment.config);
                    done = true;
                }
            }
            initComment();

            function delay() {
                clearTimeout(sleep);
                sleep = setTimeout(initComment, 100);
            }
            $(window).on('scroll', delay);
            $(window).on('resize', delay);
        }
    })();

});
