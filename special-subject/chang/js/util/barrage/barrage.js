/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    弹幕系统
 *
 * Usage:
 * var barrage = new ChatService(wrapbox, options); //auto init.
 *
 * //增加
 * barrage.add({
    userName : 'sysmsg',
    nickName : '系统消息',
    playPoint : 0,
    vipType : 0,
    content : '欢迎进入!'
 * })
 *
 * //定时删除 - remove
 * barrate.remove();
 *
 * 客户端调用接口：add|pageResize
 * ===== 客户端点播弹幕 =====
 * 三点区别：
    点播弹幕不用绑定手机
    点播弹幕信息格式与直播不一样
    点播弹幕不用过滤自己发的弹幕

    var ppp = external.GetObject2("PPP");
    if(ppp.PlayFileType == 5)
    {
        //表示当前是点播
    }

    //xbenable 是否屏蔽小冰
    //xbenable  1 屏蔽

 *
 */

define(function (require, exports, modules) {
    var
        $ = require('jquery'),
        client = require('client'),
        log = require('../log/log'),
        cookie = require('../cookie/cookie'),
        user = require('../user/user'),
        login = require('../login/login'),
        userfix = require('../user/user-fix'),
        dataFormat = require('../date/format'),
        EventAggregator = require('../event/event-aggregator'),
        Emojione = require('./emojione')
    ;

    var
        platform = isClient() ? 'clt' : 'web',
        username = user.info ? user.info.UserName : '',
        nickname = username,
        viptype = user.info ? user.info.isVip : 0,
        pageEv = new EventAggregator()
    ;

    var Loader = {
        load : function(url, params, callback){
            var parsList = [], item;

            //log(url ,' : ', params, decodeURIComponent($.param(params)));

            $.ajax({
                dataType: 'jsonp',
                type: 'GET',
                url: url + '?' + decodeURIComponent($.param(params)),
                jsonp: 'cb',
                data: { format  : 'jsonp' },
                jsonpCallback : params.callback,
                cache : true,
                success: function(data) {
                    if (callback && typeof(callback) == 'function') {
                        callback.apply(null,arguments);
                    }
                }
            });
        }
    };

    //emojione config.
    emojione.imageType = 'png';
    emojione.sprites = true;
    emojione.ascii = true;

    emojione.imagePathPNG = 'http://static9.pplive.cn/pub/flagment/v_20150508141029/modules/emojione/emojione.sprites.png';
    emojione.imagePathSVG = 'http://static9.pplive.cn/pub/flagment/v_20150508141029/modules/emojione/emojione.sprites.png';

    //模拟终端
    if(getQueryString(window.location.href, 'plt')){
        platform = getQueryString(window.location.href, 'plt');
    }

    //客户端屏蔽右键，右键有刷新选项，页面刷新后会出现小冰没有的情况
    //网站端是页面和播放器都会刷新，没有问题
    if(platform === 'clt'){
        // $('body').on('contextmenu', function(ev){
        //     ev.stopPropagation();
        //     return false;
        // })
        document.onkeydown = function(ev){
            if(ev.keyCode == 116){
                ev.returnValue = false;
            }
        }
    }

    if(platform === 'clt' && client.userIsLogin()){
        username = client.getUserInfo().userName;
    }

    function isClient(){
        try{
           if (this.external && external.GetObject('@pplive.com/ui/mainwindow;1')){
               return true;
           }
        }catch(e){}
        return false;
    }

    function ArrayObj(opt, cacheLength){
        var arr = [];
        var obj = {};
        var defaults = opt || {};
        this.pop = function(){
            var o = arr.pop();
            if(o){
                for(var k in o){
                    delete obj[k];
                }
                this.length--;
            }
        };
        this.unshift = function(o){
            if(this.length>cacheLength){
                this.pop();
            }
            arr.unshift(o);
            for(var k in o){
                obj[k] = o[k];
            }
            this.length++;
        };
        this.length = 0;
        this.get = function(n){
            if(obj[n]!=null && obj[n]!=undefined){
                return obj[n];
            } else {
                return null;
            }
        };
        this.each = function(cb){
            for(var k in obj){
                cb(k, obj[k]);
            }
            for(var k in defaults){
                cb(k, defaults[k]);
            }
        }
    }


    function getQueryString(str,name) {
        var reg = new RegExp("(^|\\?|&)"+ name +"=([^&]*)(\\s|&|$)", "i");
        if (reg.test(str)) return unescape(RegExp.$2.replace(/\+/g, " "));
    }


    function XiaoBing(opts){
        this.box = opts.box;
        this.init();
    }

    XiaoBing.prototype = {
        constructor: XiaoBing,
        init : function(){
            //this.init();
        },
        add : function(params){
            var text = '<a href="javascript:;" title="" class="xbpic"><img src="'+ (params.picurl || params.picUrl) +'" alt=""></a><div class="xbslide_txtwrap"><div class="xbslide_txtinner"><p>'+ params.text +'</p></div></div>';
            this.box.html(text).show();
            return this;
        },
        show : function(){
            this.box.show();
        },
        hide : function(){
            this.box.hide();
        }
    };


    //ChatService
    function ChatService(opts){
        var defaults = {
            id : 'Chat-' + (+ new Date()),
            wrapbox : null, //box
            player : window.player, //player
            usersCacheLength: 20,
            message : [],   //点播消息堆栈
            counter : 0,    //当前记录条数
            max : 150,   //最大条数
            timerInterval : 5 * 60 * 10,  //最大时间间隔
            maxPostTime : 5, //单位s
            enableXB: false, //是否显示小冰
            xbUserName : 'wr_xb2015', //小冰用户名
            xbNickName: '小冰'
        };

        $.extend(this, defaults, opts);

        this.wrapbox = $(this.wrapbox);

        this.defaultText = '请在这里输入评论';
        this.xbDefaultText = '@'+this.xbNickName+'，萌妹子陪你聊天侃球';
        this.tpl =
                //'<a href="${link}" title="" class="xbpic"><img src="${imgsrc}" alt=""></a><p>${content}</p>' +
                '<div class="xbslide cf" style="display:none"><a href="javascript:;" title="" class="xbpic"><img src="http://sr4.pplive.com/cms/41/32/7474eaf188a08c074d0ee166f21d7117.png" alt=""></a><div class="xbslide_txtwrap"><div class="xbslide_txtinner"><p>我是PPTV&微软小冰！~我负责貌美如花，你负责看球败家，长得帅和我聊天，其他的靠边边~评论里 <em class="atsomeone " data-name="'+this.xbUserName+'">@'+this.xbNickName+'</em>，一起聊聊天，谈球说八卦</p></div></div></div>' +
                '<div class="chat dm"><ul></ul></div>' +
                '<div class="btn-screen"><a href="javascript:void(0);" title="" class="goscroll"><i></i>停止滚屏</a><a href="javascript:void(0);" title="" class="clean"><i></i>清屏</a></div>' +
                '<div class="form"><div class="formtext"><textarea name="" rows="2" cols="1" maxlength="30">'+this.defaultText+'</textarea><!-- <a href="javascript:void(0);" title="" class="btn-face"></a> --> <p class="num">0/30</p>' +
                    '<div class="user_facebox" style="display:none;"></div>' +
                    '<div class="loginarea"><p class="tips login"><a href="javascript:void(0);" data-type="login" title="登录">登录</a>或 <a href="javascript:void(0);" data-type="reg" title="注册">注册</a>后可以发送弹幕</p><p class="tips bindphone" style="display:none"><a href="http://passport.pptv.com/checkPhone.aspx" target="_blank" title="">绑定手机</a>即可发送弹幕哦</p><p class="tips wait" style="display:none"><em>'+ this.maxPostTime +'</em> 秒后可再次评论</p></div>' +
                '</div><a href="javascript:void(0);" title="" class="disable btn-submit">发送</a><a href="javascript:void(0);" title="" class="btn-set"></a>' +
                '<div class="setform noXB"><dl><dt>聊天选项</dt><dd class="XBsetting"><label><input class="btn-talk-to-xiaobing" type="checkbox" checked name="">和'+this.xbNickName+'聊</label></dd><dd class="NTsetting"><label><input class="btn-night-modle" type="checkbox" name="">夜间模式</label></dd></dl></div>' +
                '</div>' +
                '<div class="pop-phone">' +
                    '<a href="javascript:void(0);" title="关闭" class="close"></a>' +
                    '<div class="bd">' +
                        '<h4>提示</h4>' +
                        '<ul><li>绑定完成前请不要关闭此窗口。</li></ul>' +  //<li>完成绑定后请根据您的情况点击下方的按钮。</li>
                        '<p><a href="javascript:void(0);" title="" class="locked">已绑定手机</a><a class="failed" href="http://bbs.pptv.com/forum.php?mod=viewthread&tid=31660" target="_blank title="">绑定遇到问题</a></p>' +
                    '</div>' +
                '</div>'
        ;

        var self = this;
        this.chatbox = $('<div />', {
            id : this.id,
            'class' : 'module-playlive-dm loading'  //module-playlive-nodm
        }).appendTo(this.wrapbox).append('<div style="display:table-cell;vertical-align:middle;text-align:center;*position:absolute;*top:50%;*left:0;"><div class="nodm" style="width:300px;display:inline-block;text-align:center;*position:relative;*top:-50%;">广告后为您加载弹幕</div></div>')
        .on('click', '.xbslide .atsomeone', function(ev){
            var tempText = '';
            if(self.textarea.val()==self.defaultText){
                tempText = $(this).text()+' ';
            } else {
                tempText = self.textarea.val()+' '+$(this).text();
            }
            self.textarea.focus().val(tempText);
        }).on('click', '.xbslide .xbpic', function(ev){
            var tempText = '';
            if(self.textarea.val()==self.defaultText){
                tempText = '@'+self.xbNickName+' ';
            } else {
                tempText = self.textarea.val()+' '+'@'+self.xbNickName;
            }
            self.textarea.focus().val(tempText);
        });
    }

    ChatService.prototype = {
        constructor: ChatService,
        init : function(callback){
            var self = this;
            if(!this.wrapbox.length || !this.player) {
                alert('调用容器或播放器不存在!');
                return false;
            }
            if(this.hasInited) return;

            this.messageInterval = null;
            this.chatbox.html('').append(this.tpl).removeClass('loading');
            this.box = this.chatbox.find('.chat ul');
            this.xiaobingbox = this.chatbox.find('.xbslide');
            this.textarea = this.chatbox.find('textarea');
            this.submitBtn = this.chatbox.find('.btn-submit');
            this.setBtn = this.chatbox.find('.btn-set');
            this.setBox = this.chatbox.find('.setform');
            this.loginarea = this.chatbox.find('.loginarea');
            this.loginBtn = this.loginarea.find('.login');
            this.bindphoneBtn = this.loginarea.find('.bindphone');
            this.waitDom = this.loginarea.find('.wait');
            this.popupbox = this.chatbox.find('.pop-phone');
            this.hasLogined = platform === 'clt' ? client.userIsLogin() : user.isLogined;

            this.xiaobing = new XiaoBing({
                box : this.xiaobingbox
            });

            //注册事件
            // pageEv.subscribe('barrage:init', function(){ alert('init...'); });
            // pageEv.subscribe('barrage:barragesetting', function(){});
            // pageEv.subscribe('barrage:playbarrage', function(params){
            //     self.add(params);
            // });
            // pageEv.subscribe('barrage:sendbarrage', this.add);
            //

            this.initlize();
            return this.chatbox;
        },
        none : function(){
            this.hasInited = false;
            this.chatbox.html('').removeClass('loading').addClass('module-playlive-nodm').append('<div class="nodm">该节目暂不支持弹幕</div>');
        },
        initlize : function(){
            this.hasInited = true;
            this.interactive();
            this.resize();
        },
        add : function(params, flag){
            var self = this;
            if(typeof(params) === 'string'){
                try{
                    params = JSON.parse(params);
                }catch(e){
                    alert('parse JSON String Error!');
                }
            }


            if($.isArray(params)){
                //添加一条时间分割线
                if(this.lastTime && params[0].playPoint -  this.lastTime >= this.timerInterval){
                    this.showChatMsg({
                        userName : 'system::timeline',
                        nickName : '时间分割线',
                        playPoint : params[0].playPoint,
                        vipType : 0,
                        content : ''
                    });
                }

                //客户端点播弹幕
                if(platform === 'clt' && this.playType == 'vod'){
                    this.vodInterval(params);
                    return;
                }

                for(var i = 0, len = params.length; i < len; i++){
                    if(params[i].userName == this.xbUserName && !this.enableXB){
                        continue;
                    }

                    //点播弹幕不过滤
                    if(this.playType != 'vod' && !flag && params[i].userName === username) break;

                    params[i].nickName = this.filterXBNickname(params[i].nickName, params[i].userName); //对于和小冰同名的昵称，显示“用户小冰”
                    if(params[i].userName == this.xbUserName){   //对于小冰的回复，如果回复中有@小冰，全部换成@用户小冰
                        var reg = '\@小冰';
                        reg = new RegExp(reg, 'gim');
                        params[i].content = params[i].content.replace(reg, '@用户小冰');
                    }

                    this.showChatMsg(params[i]);
                    this.counter ++;
                }

                this.lastTime = params[0].playPoint;
            }else{
                if(flag) this.addToPlayer(params);
                params.nickName = this.filterXBNickname(params.nickName, params.userName); //对于和小冰同名的昵称，显示“用户小冰”
                this.showChatMsg(params);
                this.counter ++;
            }

            if(this.counter > this.max){
                this.remove();
            }

            // if(!this.islock) this.lock();

            return this;
        },
        addToPlayer : function(params){
            //发送弹幕
            this.player.onNotification({
                header : {
                    type : 'sendbarrage'
                },
                body : {
                    data : params
                }
            });
        },
        initXBSetting : function(params){
            if(params.xbisopen){
                this.showXBWords();
                this.enableXB = true;
                if(isClient()){
                    this.setBtn.show();
                }
                this.setBox.removeClass('noXB');
                if(params.name){
                    this.xbUserName = params.name;
                }
                if(this.textarea.val() == this.defaultText){
                    this.textarea.val(this.xbDefaultText);
                    this.defaultText = this.xbDefaultText;
                }
            }else{
                this.enableXB = false;
                this.hideXBWords();
                this.setBox.addClass('noXB');
            }
        },
        addXBSetting : function(params){
            //发送弹幕
            this.player.onNotification({
                header : {
                    type : 'barragesetting'
                },
                body : {
                    data : params
                }
            });
        },
        addXBWords : function(params){
            params = params[params.length-1];
            var text = this.htmlEncode(params.text);
            var isXB = true;
            if(/\@/gi.test(text)){
                text = this.filterContent(text, isXB);
            }
            params.text = text;
            this.xiaobing.add(params);
            this.resize();
        },
        showXBWords : function(){
            this.xiaobing.show();
            this.resize();
        },
        hideXBWords : function(){
            this.xiaobing.hide();
            this.resize();
        },
        remove : function(){
            this.counter --;
            this.box.children().first().remove();
        },
        formatTime: function(num){
            var temp;
            var h = parseInt(num/3600);
            temp = num%3600;
            var m = parseInt(temp/60);
            var s = num%60;
            h = h<10?('0'+h):h;
            m = m<10?('0'+m):m;
            s = s<10?('0'+s):s;
            return h+':'+m+':'+s;
        },
        vodInterval : function(params){
            var self = this;
            this.message = this.message.concat(params);
            var pos = external.getObject("PPP").Position, temp;
            if(this.messageInterval) clearInterval(this.messageInterval);
            this.messageInterval = setInterval(function(){
                if(!self.message.length){
                    clearInterval(self.messageInterval);
                }
                for(var i=0, l=self.message.length; i<l; i++){
                    if(self.message[0]){
                        if(self.message[0].play_point/10<=pos){
                            temp = self.message.shift();
                            self.counter++;
                            self.showChatMsg(temp);
                        } else {
                            break;
                        }
                    } else {
                        self.message.shift();
                        continue;
                    }
                }
                pos += 1;
            }, 1000);
        },
        //点播使用， 暂停
        pause : function(){
            if(this.messageInterval) clearInterval(this.messageInterval);
        },
        //播放
        play : function(){
            this.vodInterval([]);
        },
        //滚屏|锁定
        lock : function(){
            this.box.parent().scrollTop(this.box[0].scrollHeight);
        },
        //清屏
        clear : function(){
            this.counter = 0;
            this.message.length = 0;
            this.box.html('');
        },
        onRegister : function(callback){
            callback();
        },
        resize : function(height){
            var xbHeight = this.xiaobingbox ? this.xiaobingbox.is(":visible") ? this.xiaobingbox.outerHeight() : 0 : 0;
            var boxheight = (height ||  this.wrapbox.height()) - xbHeight - 140;
            var btnScreenTop = xbHeight ? (xbHeight) : 5;
            if(height){
                this.wrapbox.height(height);
            }
            if(this.box && boxheight > 0){
                this.chatbox.find('.btn-screen').css('top', btnScreenTop);
                this.box.parent().css('height', boxheight);
                this.lock();
            }
        },
        //给客户端使用
        bindphone : function(){
            this.popupbox.show();
        },
        interactive : function(){
            var self = this;

            new self.counterText(this.textarea);

            //右上角操作按钮
            this.chatbox.find('.chat, .btn-screen').on('mouseenter', function(){
                self.chatbox.find('.btn-screen').show();
            }).on('mouseleave', function(){
                self.chatbox.find('.btn-screen').hide();
            });

            //登录按钮
            this.loginBtn.find('a').on('click', function(){
                var type = $(this).attr("data-type") || "login";
                login.init({
                    type: type,
                    from: "web_barrage",
                    app: ""
                });
            });

            //设置选项
            this.setBtn.on('click', function(){
                if(!self.setBox.is(":visible")){
                    self.setBox.show();
                }else{
                    self.setBox.hide();
                }
            });

            //小冰设置显示与否
            this.setBox.find('.btn-talk-to-xiaobing').on('click', function(){
                var flag = this.checked;
                if(!flag){
                    self.enableXB = false;
                    self.addXBSetting({xbenable:0});
                    self.hideXBWords();
                }else{
                    self.enableXB = true;
                    self.addXBSetting({xbenable:1});
                    self.showXBWords();
                }
            });

            //夜间模式设置
            this.setBox.find('.btn-night-modle').on('click', function(){
                var flag = this.checked;
                var $dom = $('#player-sidebar .module-video-live-1408').length ? $('#player-sidebar .module-video-live-1408') : self.wrapbox;
                if(!flag){
                    $dom.removeClass('module-video-live-1408b');
                    self.changeNightMode(0);
                } else {
                    $dom.addClass('module-video-live-1408b');
                    self.changeNightMode(1);
                }
            });

            this.setBox.on('click', function(ev){
                ev.stopPropagation();
            })


            this.chatbox.on('click', function(event){
                if($(event.target).hasClass('btn-set') || $(event.target).hasClass('setform')){ return; }
                self.setBox.hide();
            });

            user.onLogout(logoutFun);

            user.onLogin(loginFun);

            function loginFun(){
                self.hasLogined = true;
                self.checkBindMobilePhone();
                self.textarea.hide().parent().parent().addClass('logined');
            }

            function logoutFun(){
                self.hasBindPhone = false;
                self.hasLogined = false;
                self.loginarea.children().hide();
                self.loginBtn.show().parent().show();
                self.popupbox.hide();
                self.textarea.hide().parent().parent().removeClass('logined focus selected').find('.num').hide();
            }

            if(user.isLogined){
                loginFun();
            } else {
                logoutFun();
            }

            if(platform === 'clt' && this.hasLogined){
                self.checkBindMobilePhone();
            }

            this.bindphoneBtn.on('click', function(){
                self.popupbox.show();
            });

            this.popupbox.find('.close').on('click', function(){
                self.popupbox.hide();
            });

            this.popupbox.find('.locked').on('click', function(){
                self.popupbox.hide();
                self.checkBindMobilePhone();
            });

            //滚屏
            this.chatbox.find('.goscroll').toggle(function(){
                self.islock = true;
                $(this).html('<i></i>开始滚屏');
            }, function(){
                self.islock = false;
                $(this).html('<i></i>停止滚屏');
            });

            //清屏
            this.chatbox.find('.clean').on('click', function(){
                self.clear();
            });

            //输入框
            this.textarea.on('focusin', function(evt){  //keypress
                $(this).parent().parent().addClass('logined focus selected');
                self.submitBtn.removeClass('disable');
                if($.trim(this.value) === '' || $.trim(this.value) === self.defaultText){
                    this.value = '';
                }
            }).on('focusout', function(){
                $(this).parent().parent().removeClass('focus selected');
                if($.trim(this.value) === '' || $.trim(this.value) === self.defaultText){
                    $(this).parent().parent().removeClass('focus selected');
                    this.value = self.defaultText;
                }else{
                    $(this).parent().parent().addClass('focus selected');
                }
            }).keydown(function(evt) {
                if (evt.keyCode == 13 || (evt.ctrlKey && evt.keyCode == 13)) {
                    post();
                    return false;
                }
            });

            this.submitBtn.on('click', function(){
                post();
            });

            function post(){
                var text = self.textarea.val();
                self.hasLogined = platform === 'clt' ? client.userIsLogin() : user.isLogined;
                if(self.submitBtn.hasClass('disable') || !self.hasLogined || !self.hasBindPhone) return;
                if(!$.trim(text) || $.trim(text) == self.defaultText){ return false; }
                self.getUserName();
                self.add({
                    userName : username,
                    nickName : nickname,
                    playPoint : +new Date(),
                    vipType : viptype,
                    content : text
                }, true);
                //如果是版本大于3.6.1.0024的客户端，客户端调用了postCountDown
                if(platform === 'clt' && client.getClientVer()>'3.6.1.0024'){

                } else {
                    self.postCountDown();
                }
            }
        },
        postCountDown: function(){
            var self = this, count = this.maxPostTime;
            this.submitBtn.addClass('disable');
            this.textarea.val('').focusout().hide().parent().find('.num').hide();
            this.loginarea.children().hide();
            this.waitDom.html('<em>5</em> 秒后可再次评论').show().parent().show();
            this.maxPostInterval = setInterval(function(){
                if(count === 1){
                    clearInterval(self.maxPostInterval);
                    if(!self.hasLogined) return;
                    self.submitBtn.removeClass('disable');
                    self.waitDom.hide().parent().hide().parent();
                    self.textarea.show().focus().parent().find('.num').show();
                    return;
                }
                count --;
                self.waitDom.html('<em>' + count + '</em> 秒后可再次评论');
            }, 1000);
        },
        showChatMsg : function(params){
            /**
             * [消息格式定义]
             * @type {Object}
             *
             * {
             *     userName : 'lin04com',
             *     nickName : '测试测试测试',
             *     playPoint : 1421401763000,
             *     vipType : 2,
             *     content : '你吃饭了吗？'
             * }
             */
            var self = this;
            var msgTypeMap = {
                'system' : 'sysmsg',
                'timeline' : 'timeline',
                'system::timeline' : 'timeline',
                'system::notice': 'notice',
                'system::xiaobing' : 'xb'
            };
            msgTypeMap[this.xbUserName] = 'xb';

            //兼容点播弹幕数据格式
            if(params.user_name){
                params.userName = params.user_name;
            }
            if(params.nick_name){
                params.nickName = params.nick_name;
            }
            if(params.vip_type){
                params.vipType = params.vip_type;
            }
            if(!params.vipType){
                params.vipType = 0;
            }

            var msgClass = msgTypeMap[params.userName] || '', msgText = '';

            if(!params.userName) return;

            if(params.userName == 'system::timeline'){
                return '<li class="'+ msgClass +'"><em>' + dataFormat(new Date(params.playPoint * 100), 'hh:mm:ss') + '</em></li>';
            }

            msgText = params.content.replace(/\<(script|img|iframe|background|link|style|meta|base|a|body)/gi, '$1');

            var $li = $('<li class="'+ msgClass +'"><span class="'+ ((params.vipType != 0) ? 'vipcolor' : '') +'" data-name='+ params.userName +'>'+ this.htmlEncode(params.nickName || params.userName) + ((params.vipType != 0) ? '<i class="vip"></i>' : '') + '：</span><span class="txt"></span></li>')
                .appendTo(this.box)
                .find('.txt').html(msgText);
            if(!this.islock){
                this.box.parent().scrollTop(this.box.height());
            }

            msgText = Emojione.unescapeHTML($li.text() || '');

            msgText = Emojione.toImage(msgText);

            if(/\@/gi.test(msgText)){
                msgText = this.filterContent(msgText);
                if(/\<em/gi.test(msgText)){
                    $li.html(msgText);
                }
            }else{
                $li.html(msgText);
            }
        },
        getUserName : function(){
            if(platform === 'clt' && client.userIsLogin()){
                username = client.getUserInfo().userName;
                nickname = this.parseLen(client.getUserInfo().nickName, 30);
                viptype = client.getUserInfo().isVip;
            }else{
                username = user.info ? user.info.UserName : '';
                nickname = this.parseLen(user.info&&user.info.Nickname ? user.info.Nickname : username, 30);
                viptype = user.info ? user.info.isVip : 0;
            }
            return username;
        },
        filterContent : function(content, isXB){
            var regText = '', result = content, tempUsername, tempNickname;
            if(isXB){
                tempUsername = this.xbUserName;
                tempNickname = this.xbNickName;
            } else {
                tempUsername = username;
                if(nickname.toUpperCase() == this.xbNickName){
                    tempNickname = '用户小冰';
                } else {
                    tempNickname = nickname;
                }
            }
            regText = '(\@' + tempNickname +')+';
            regText = new RegExp(regText, 'gim');
            result = result.replace(regText, '<em class="atsomeone " data-name="'+ tempUsername +'" >$1</em> ');
            return result;
        },
        filterXBNickname: function(nickname, username){
            if(nickname==this.xbNickName && username!=this.xbUserName){
                return '用户小冰';
            } else {
                return nickname;
            }
        },
        nightModeArray: [],
        onNightModeChange: function(callback){
            this.nightModeArray.push(callback);
        },
        changeNightMode: function(state){
            //state， 0代表白，1代表夜间
            var len = this.nightModeArray.length;
            while(len){
                len--;
                this.nightModeArray[len](state);
            }
        },
        checkBindMobilePhone : function(){
            var self = this;
            this.loginarea.children().hide();
            this.bindphoneBtn.css('display','block').parent().show();
            //客户端点播不用绑定手机
            if(platform === 'clt' && this.playType == 'vod'){
                self.hasBindPhone = true;
                self.popupbox.hide();   //提示浮层关闭
                self.bindphoneBtn.parent().hide();
                self.textarea.show().parent().find('.num').show();
                return;
            }

            Loader.load('http://api.passport.pptv.com/v3/query/accountinfo.do', {
                username : self.getUserName(),
                token : user.info.token,
                from : 'web'
            }, function(d){
                log('checkBindMobilePhone===', d, decodeURIComponent(d.message));
                if(d && d.errorCode === 0 && d.result && d.result.isPhoneBound){
                    self.hasBindPhone = true;
                    self.popupbox.hide();   //提示浮层关闭
                    self.bindphoneBtn.parent().hide();
                    self.textarea.show().parent().find('.num').show();

                    try{
                        //客户端通知绑定手机
                        if(platform === 'clt') external.GetObject('@pplive.com/passport;1').IsBindPhone = true;
                    }catch(e){}
                }
            });
        },
        htmlEncode : function(str){
            return str.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;').replace(/"/gm,'&quot;').replace(/'/gm,'&#039;');
        },
        htmlDecode : function(str){
            if(str){
                return (str.replace(/&lt;/gm, '<').replace(/&gt;/gm, '>').replace(/&amp;/gm, '&').replace(/&#039;/gm, "'").replace(/&quot;/gm, '"').replace(/&apos;/gm, "'").replace(/&nbsp;/gm, ' '));
            }
        },
        parseLen : function(str, count) {
            var l = 0,
                s = '';
            str = str.replace(/^(\s|\xA0)+|(\s|\xA0)+$/g, '');
            for (var i = 0; i < str.length && l < 2 * count; i++) {
                var c = str.charAt(i);
                l += c.match(/[^\x00-\xff]/g) ? 2 : 1;
                s += c;
            }
            return s;
        },
        counterText : (function(){
            var counter = function(input, maxlenth){
                this.input = input;
                this.max = maxlenth;
                var self = this,
                    max = maxlenth || 30,
                    loop;
                this.input.focusin(function(){
                    var l;
                    // if(!self.over){
                        loop = setInterval(function(event){
                            l = self.count();
                            if (l <= max) {
                                self.over = false;
                                self.input.parent().find('.num').text(l + '/' + max);
                            }else {
                                self.input.val(input.val().substring(0, max));
                                self.over = true;
                            }
                        }, 100);
                    // }
                }).focusout(function(){
                    clearInterval(loop);
                });
            };
            counter.prototype = {
                constructor: counter,
                count: function(){
                    var val = this.input.val(), i, l, res = 0;
                    for (i = 0, l = val.length; i < l; i++) {
                        res++;
                    }
                    return Math.ceil(res);
                }
            };
            return counter;
        })()
    };

    return ChatService;

});
