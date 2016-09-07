/**
 * @author  yanyang
 * @email   ahschl0322@gmail.com
 * @info    header
 */
/**
chid = Id
o_cid = ClId
o_chid = SubId

 */
/*
1.播放记录：未登录从history模块中取，登录从http://sync.pptv.com/v3/中取；
*/

define(function(require, exports, module) {
    //添加依赖
    require('./main');

    require('../scroller/scroller');
	var encode = encodeURIComponent;
    var cookie=require('../cookie/cookie');
    var pptoken=cookie.get('ppToken');
    var ppname=cookie.get('PPName');
    var domain='pptv.com';
    var path='/';
    if((!pptoken&&!!ppname)||(!!pptoken&&!ppname)){
        cookie.remove('PPKey', domain, path);
        cookie.remove('UDI', domain, path);
        cookie.remove('PPName', domain, path);
        cookie.remove('ppToken', domain, path);
    }
    var IE6 = !window.XMLHttpRequest;
    var iPad = navigator.userAgent.indexOf('iPad') >= 0;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);

    var
        $         = require('jquery')
        //,loader     = require('../loader/loader')
        ,login    = require('../login/login')
        ,log      = require('../log/log')
        ,user     = require('../user/user')
        ,user_fix = require('../user/user-fix')
        ,cookie   = require('../cookie/cookie')

        ,_        = require('underscore')
        ,delay    = require('../function/delay')
        ,checkIn  = require('./checkin')
        ,userData = require('./user-data')
    ;

    var webcfg = window.webcfg || {};
    // Publish/Subscribe
    if(typeof $.subscribe1!="function"){
        (function($) {
            var o = $({});
            // call比apply速度快
            $.subscribe = function(a, b) {
                o.on.call(o, a, b);
            };
            $.subscribe1 = function(a, b) {
                o.on.call(o, a, function() {
                    //舍弃第一个参数event
                    var a = arguments;
                    b.call(o, a[1], a[2], a[3], a[4]);
                });
            };
            $.unsubscribe = function(a, b) {
                o.off.call(o, a, b);
            };
            $.publish = function(a, b) {
                o.trigger.call(o, a, b);
            };
            $.publish1 = function(a, b, c, d, e) {
                o.trigger.call(o, a, [ b, c, d, e ]);
            };
        })($);
    }

    var
        playhistory = userData.playhistory
        ,favorite   = userData.favorite
        ,recommend  = userData.recommend
        ,clearCache = userData.clearCache
        ,userDetail = userData.userDetail
        ,cloudhistory = userData.cloudhistory
    ;

    var smallHead = $('.g-1408-hd').hasClass('g-1408-hd-s');


    /* 业务逻辑 start*/

    var webInit = function(){
        /* web端逻辑 */

        require.async('./suggest', function(suggest){
            var sg = new suggest('#search_box');
            sg.init();
        });

        // 为了关联收藏、看过 和 个人中心的交互
        var commonCloser = {
            history: function(){},
            userCenter: function(){}
        }

        // 看过，收藏
        ;(function(){
            var container = $('#hd-operate');
            var tabCont = container.find('ul.hd-operate-ul');
            var DomListCont = $('#operate-drop');
            var icon = DomListCont.find('> i');
            var DomLists = DomListCont.find('div.history');
            var lock = false; //
            var loadedModules = []; //缓存key


            var noDataHTML = [
                '<p class="nohistory"><i class="ui-history"></i><span class="">暂无观看记录</span></p>',
                '<p class="nohistory"><i class="ui-favorites"></i><span class="">暂无收藏内容</span></p>'
            ]

            var findModule = function(moduleName){
                if(moduleName.toLowerCase() == 'playhistory'){
                    return playhistory;
                }else if(moduleName.toLowerCase() == 'favorite'){
                    return favorite;
                }
            }


            // 输出节目链接，带缓存
            var watchLink = function(item){
                var cache = watchLink.cache = watchLink.cache || {};
                if(cache[item.Id]){
                    return cache[item.Id];
                }

                var webcfg = window.webcfg || {};
                var state = Number(item.Pos) >= Number(item.Duration);
                var link = 'http://v.pptv.com/show/' + (item.Link || item.link) + '.html' + (state ? '?' : '?rcc_starttime=' + item.Pos);
                var current = webcfg.id == (item.Id || item.SubId) && webcfg.pid == item.Id;
                return cache[item.id] = {
                    link: link,
                    current: current
                }
            }

            // 增加必要显示的内容，没有返回值
            var videoDataFilter = function(data, type){
                _.each(data, function(data){
                    var percent = data.Duration == 0 ? 0 : (parseInt(data.Pos) / parseInt(data.Duration) * 100).toFixed(0);
                    var watched = parseInt(percent) > 95;

                    data._watchEnd = watched;

                    var rcc;
                    //观看过用播放进度，收藏用收藏日期
                    switch(type){
                        case 'favorite':
                            var fDate = new Date(parseInt(data._mt));
                            data._progress = fDate.getFullYear()+'/'+(fDate.getMonth()+1)+'/'+fDate.getDate();
                            rcc = 'A8'; break;
                        case 'playhistory':
                            data._progress = watched ? '看完' : '看到'+ percent +'%';
                            rcc = 'A7'; break;
                        default:;
                    }

                    data._link = watchLink(data).link + '&rcc_src=' + rcc;
                    data._isCurrent = watchLink(data).current;
                    data._moduleName = type;
                });
            }

            var clearModuleCacheKey = function(){
                loadedModules = [];
            }

            user_fix().onLogin(clearModuleCacheKey).onLogout(clearModuleCacheKey);

            var show = delay(function(i, moduleName){
                lock = false;
                tabCont.find('li').removeClass('now').eq(i).addClass('now');
                if(moduleName){
                    DomLists.hide().eq(i).show();

                    /* 浮层小三角位置计算 */
                    var btn = tabCont.find('li').eq(i);
                    var left = btn.position().left;
                    var btnWidth = btn.outerWidth(true);
                    var loginAreaWidth = $('#login-area').width();
                    var contWidth = container.width();
                    icon.css({
                        // 用户区域宽度加上按钮到其父标签右边距离
                        right: loginAreaWidth + contWidth - left - btnWidth / 2 - 20
                    })

                    var dataModule = findModule(moduleName);

                    DomListCont.show();

                    commonCloser.userCenterHandler();
                    // dom缓存
                    if(_.indexOf(loadedModules, moduleName) < 0){
                        dataModule.get(function(data){
                            var listCont = DomListCont.find('div[data-module='+ moduleName +'] div');

                            if(data.length){
                                // 增加显示所需内容
                                videoDataFilter(data, moduleName);

                                // 渲染页面
                                render(listCont, data);

                                // 自定义滚动轴
                                listCont.ppScroller({maxHeight:parseInt(listCont.attr('data-scroller-height')) || 320}).scroll();
                            }else{
                                listCont.html(noDataHTML[i]);
                            }

                            // 记录已加载module
                            loadedModules.push(moduleName);
                        }, function(n){
                            return - parseInt(n._mt);
                        });
                    }
                }
            }, 300);

            var hideHandler = function(i){
                if(lock) return;
                tabCont.find('li').removeClass('now');
                DomListCont.hide();
                DomLists.hide();
            }
            var hide = delay(hideHandler, 250);

            commonCloser.history = hide;
            commonCloser.historyHandler = hideHandler;
            var render = function(listCont, data){
                var HTMLlist = [[],[],[],[]];
                var now = new Date;

                _.each(data, function(n){
                    var curDate = new Date(parseInt(n._mt.slice(0, 13)));
                    var diff = dateDiff('d', curDate, now);
                    var ht = [];
                    var pid = 'pid_' + n.Id + '_' + parseInt(Math.random() * 100);
                    var id = n.index || n.Id || n.SubId;
                    ht.push(n._isCurrent ?
                        ('<li id="'+ pid +'">'+
                            '<a href="javascript:;" title="'+ (n.SubName || n.Name) +'" target="_blank">'+ (n.SubName || n.Name) +'</a>' +
                            '<span class="progress">'+
                                '<a href="javascript:;" title="">正在播放</a>' +
                                '<a href="javascript:;" title="" class="display close" data-id="'+ id +'" data-pid="'+ pid +'" data-type="'+ n._moduleName +'">&times;</a>' +
                            '</span></li>') :
                        ('<li id="'+ pid +'">'+
                            '<a href="'+ n._link +'" title="'+ (n.SubName || n.Name) +'" target="_blank">'+ (n.SubName || n.Name) +'</a>' +
                            '<span class="progress">'+
                                '<a href="javascript:;" title="">'+ n._progress +'</a>' +
                                '<a href="'+ n._link +'" title="" class="display">'+ (n._watchEnd ? '重播' : '续播') +'</a>' +
                                '<a href="javascript:;" title="" class="display close" data-id="'+ id +'" data-pid="'+ pid +'" data-type="'+ n._moduleName +'">&times;</a>' +
                            '</span></li>'));

                    if(diff == 0){
                        HTMLlist[0].push(ht);
                    }else if(diff == 1){
                        HTMLlist[1].push(ht);
                    }else if(diff < 7){
                        HTMLlist[2].push(ht);
                    }else{
                        HTMLlist[3].push(ht);
                    }
                });


                var html = ['<dl>'], tag = ['今天', '昨天', '一周内', '更早'];
                _.each(HTMLlist, function(n, i){
                    if(n.length){
                        html.push('<dt>'+ tag[i] +'</dt><dd><ul>');
                        n.length && html.push(n.join(''));
                        html.push('<i class="ui-line"></i></ul></dd>');
                    }
                });
                html.push('</dl>');

                listCont.empty().append(html.join(''));
            }

            /* 简单处理，解决移动端连续点击只触发一次 */
            if(!webcfg.isMobile){
                tabCont.on('mouseenter', 'li',function(e){
                    var me = $(this);
                    // 上传按钮不能阻止层的关闭
                    if(me.index() < 2){
                        lock = true;
                    }
                    commonCloser.userCenter.cancel();
                    show(me.index(), me.find('a').attr('data-module'));
                }).on('mouseleave', 'li', function(){
                    lock = false;
                    commonCloser.userCenter();
                    show.cancel();
                    hide();
                });
            }else{
                var lShowLayer;
                var showLayer = false;
                tabCont.on('click', 'li', function(e){
                    if(!showLayer || lShowLayer != this){
                        var me = $(this);
                        // 上传按钮不能阻止层的关闭
                        if(me.index() < 2){
                            lock = true;
                        }
                        show(me.index(), me.find('a').attr('data-module'));
                        showLayer = 1;
                        lShowLayer = this;
                    }else{
                        lock = false;
                        show.cancel();
                        hide();
                        showLayer = 0;
                    }

                });
            }



            DomListCont.on('mouseenter', function(){
                hide.cancel();
            }).on('mouseleave', function(){
                hide();
            }).on('dblclick', function(e){
                lock = !lock;
            });

            var lastLi;
            DomListCont.find('div.history').on('mouseenter', 'li', function(e){
                lastLi && lastLi.removeClass('hover');
                lastLi = $(this).addClass('hover');
            }).on('mouseleave', 'li', function(e){
                lastLi.removeClass('hover');
            }).on('click', 'a.close',function(e){
                var id = this.getAttribute('data-id');
                var pid = this.getAttribute('data-pid');
                var moduleName = this.getAttribute('data-type');
                var btn = $(this);
                findModule(moduleName).del(id, function(d){
                    $('#' + pid).fadeOut();
                }, function(){
                    alert('删除失败');
                });
            }).on('touchstart', function(e){
                e.stopPropagation();
            });

            $.subscribe('closeAllLayout', function(){
                tabCont.find('li').removeClass('hover');
                DomListCont.hide();
            });
        })();


        //用户信息
        ;(function(){
            var $loginArea = $('#login-area');
            var $areaLogin = $loginArea.find('div.logined');
            var $areaLogout = $loginArea.find('div.nologin');
            var $userDropdown = $loginArea.find('div.logined-drop');
            var $arrow = $loginArea.find('.arrow');
            var displayUserName;
            var delayLoader_userDetail = $.Callbacks(); //一步读取内容
            var _lock = false;

            /* 登录、注册 */
            $areaLogout.find('.btn-login').on('click',function(e){
                var type = $(this).attr('data-type') || 'login';
                login.init({
                    "type" : type,
                    "from" : 'web_topnav',
                    "app"  : ''
                });
                cookie.set('userAutoLogin', 'notAuto', 1/24/60/2, 'pptv.com');  //用来判断用户是否是自动登录，个人中心云播tab有用到
            });

            /* 登出 */
            $('#btn-user-logout').click(function() {
                user.logout();
                $userDropdown.trigger('close');
                try {
                    var uInfo = {};
                    if (webcfg.comment.tags.length > 0) {
                        uInfo.tags = webcfg.comment.tags.toString();
                    }
                    if (webcfg.comment.ids.length > 0) {
                        uInfo.ids = webcfg.comment.ids.toString();
                    }
                    player.setUserInfo(uInfo); //登出时设置
                } catch (e) {}
            });

            /* 渲染用户基本信息 */
            var renderHeaderUserInfo = function(info){
                displayUserName = decodeURIComponent(info.Nickname || info.UserName || info.Email || '');

                var $userPic = $loginArea.find('.headpic img');
                $userPic.attr('src', webcfg.src_userPic + info.HeadPic)
                    .attr('title', displayUserName);

                var $userName = $loginArea.find('.username');
                $userName.html(displayUserName);
            }

            /* 渲染用户具体信息 */
            var renderHeaderUserDetail = function(detail, info){
                var $icons = $loginArea.find('.user-icons');
                var getNextGradeLeave = (detail.gradeEnd - detail.userCredit + 0.01).toFixed(2);
                $icons.html('<img class="user-level-icon" src="'+ (detail.gradePic || webcfg) +
                    '" title="我的等级:' + detail.userGrade + '级 \n剩余升级天数:'+ getNextGradeLeave +'天" />' +
                    '<img src="http://static9.pplive.cn/pptv/pub/v_20130608151705/css/ic5.png" class="icon_up">' +
                    userIcon(info.isVip));

                var $levelIcon = $loginArea.find('img.user-level-icon');
                detail.gradePic && $levelIcon.attr('src', detail.gradePic);


                // 积分、p币
                var $tScore = $loginArea.find('li.intergral span').html(detail.userAvailablePoint);
                delayLoader_userDetail.add(function(){
                    userDetail.getPb(function(amount){
                        var $tPb = $loginArea.find('li.pb span').html(amount);
                    });
                });

                // 签到
                var $checkArea = $loginArea.find('.check');
                var checkInCount = 0, checked = true, leaveCount = 0;
                delayLoader_userDetail.add(function(){
                    checkIn.checkDay(function(result, count, leave){
                        checkInCount = count;
                        leaveCount = leave;
                        if(result){
                            checked = true;
                            $checkArea.find('a.count').html('已签到' + count + '天');
                            if(leave != 0){
                                $checkArea.find('a.leave').html('本月可补签' + leave + '天');
                                $checkArea.addClass('checkleft');
                            }
                        }else{
                            checked = false;
                            $checkArea.removeClass('checked checkleft').find('a.count').html('签到赚积分');
                        }
                    })
                });

                var checkInHandler = function(e){
                    if(checked){ return;}
                    checkIn.checkIn(function(){
                        $checkArea.addClass('checked').find('a.count').html('已签到' + (++checkInCount) + '天');
                        checked = true;
                        if(leaveCount != 0){
                            $checkArea.find('a.leave').html('本月可补签' + (leaveCount - 1) + '天');
                            $checkArea.addClass('checkleft');
                        }
                    });
                }
                $checkArea.on('click', 'a.count', checkInHandler);


                // 等级icons
                // var $userLevel = $loginArea.find('.userlv .user-level').html(detail.userGrade);
                var $userGradeIcons = $loginArea.find('.userlv')
                    .html('LV：<a href="http://usergrowth.pptv.com/" target="_blank" class="user-level" title="我的等级:' + detail.userGrade + '级 \n剩余升级天数:'+ getNextGradeLeave +'天">'+ detail.userGrade + ' ' + getGradePics(detail.gradeMedal, detail.listGradeUrl)) + '</a>';

                // 等级天数
                var $userCredit = $loginArea.find('span.user-credit').html('活跃天数：' + detail.userCredit);
                var $userNextCreditLeft = $loginArea.find('span.user-next-credit-left')
                    .html('升级还需：' + getNextGradeLeave);

                // 等级天数进度
                var t;
                var tw = $loginArea.find('div.growdays').width();
                var max = (detail.todayMaxCredit).toFixed(2), now = (detail.todayObtainCredit).toFixed(2);
                var $line = $loginArea.find('span.grownow').css({
                    width: now / max * 100 + '%'
                })
                var $allDay = $loginArea.find('span.allday i').html(max)
                var $nowday = $loginArea.find('span.nowday').css({
                    left: (t = tw * now / max) > tw * .55 ? tw * .55 : t
                }).find('i').html(now);

                // 会员说明
                var ut = {
                    0: '注册用户',
                    1: '普通会员',
                    2: '年费会员'
                };

                var $userState = $loginArea.find('dd.userstate');
                $userState.find('span:eq(0)').html(ut[user.info.isVip] + userIcon(info.isVip));
                $userState.find('span:eq(1)').html(speedUpInfoText(user.info));

                // 会员特权
                ;(function() {
                    var userInfo = user.readInfo();
                    var vip = user.info.isVip != '0';
                    var privilege = {
                        noad: {
                            is: vip ? 'true' : userInfo.IsNoad,
                            text: '免去视频播放贴片广告',
                            url: 'http://viptv.pptv.com/privilege/pg_noad'
                        },
                        spdup: {
                            is: vip ? 'true' : userInfo.IsSpdup,
                            text: '播放加速',
                            url: 'http://viptv.pptv.com/privilege/pg_spdup'
                        },
                        rtmp: {
                            is: vip ? 'true' : userInfo.IsRtmp,
                            text: '低延时直播',
                            url: 'http://viptv.pptv.com/privilege/pg_rtmp'
                        },
                        ugspeed: {
                            is: vip ? 'true' : userInfo.IsUgspeed,
                            text: '等级成长加速',
                            url: 'http://viptv.pptv.com/privilege/pg_ug'
                        },
                        other: {
                            is: vip ? 'true' : 'false',
                            text: ['免上传', '蓝光影片下载', '蓝光片库', '会员片库', '付费点播折扣', '专属超级表情'],
                            url: 'http://viptv.pptv.com/year_vip/'
                        }
                    }

                    $loginArea.find('.vipspc a').each(function(i, n) {
                        var arr = n.className.split(/\s/);
                        var name = $(n).attr('data-name') || 'other';
                        var t = privilege[name];
                        if (t.is == 'true') {
                            $(n).find('em').removeClass('ico-gray');
                        } else {
                            $(n).find('em').addClass('ico-gray');
                        }
                        $(n).attr({
                            href: t.url,
                            title: (name == 'other' ? t.text[i - 4] : t.text) + (t.is == 'true' ? '已开启' : '未开启')
                        })
                    })
                })();
            }


            /* 显示、影藏用户下拉事件 */
            var
                open = delay(function(){
                    delayLoader_userDetail.fire();
                    delayLoader_userDetail.empty();
                    $userDropdown.show();
                    commonCloser.historyHandler();
                }, 300)
                ,closeHandler = function(){
                    if(_lock) return;
                    $userDropdown.hide();
                }
                , close = delay(closeHandler, 250);


            commonCloser.userCenter = close;
            commonCloser.userCenterHandler = closeHandler;

            $userDropdown.on('open', function(){
                if(!user.isLogined) return;
                commonCloser.history.cancel();
                $loginArea.addClass('loginarea-hover');
                open();
                close.cancel();
            }).on('close', function(){
                $loginArea.removeClass('loginarea-hover');
                close();
                open.cancel();
                commonCloser.historyHandler();
            });

            $loginArea.on('mouseenter',function(e){
                $userDropdown.trigger('open');
            }).on('mouseleave',function(e){
                $userDropdown.trigger('close');
            }).on('touchstart', function(e){
                e.stopPropagation();
            });

            $userDropdown.on('mouseenter',function(e){
                $userDropdown.trigger('open');
            }).on('mouseleave',function(e){
                $userDropdown.trigger('close');
            }).on('dblclick',function(e){
                _lock = !_lock;
            }).on('touchstart', function(e){
                e.stopPropagation();
            });

            $.subscribe('closeAllLayout', function(){
                $userDropdown.trigger('close');
            });

            /* 登录、登出绑定 */
            user_fix().onLogin(function(info){

                //on login
                $areaLogin.show();
                $areaLogout.hide();

                renderHeaderUserInfo(info);

                userDetail.read(function(detail){
                    detail.listGradeUrl = detail.listGradeUrl.reverse();
                    renderHeaderUserDetail(detail, info);
                });

                $arrow.show();
            }).onLogout(function(){
                //on logout
                $areaLogin.hide();
                $areaLogout.show();

                $arrow.hide();
            });


        })();

        //导航推荐
        ;(function(){
            if(smallHead){
                return;
            }
            navType = {1:"电影",2:"电视剧",3:"动漫"};
            window.recommendShowed = false;
            window.circleshow = true;
            var timer, timer2;

            //判断是否有推荐
            var isRecommend = function(type){
                if(navType[type]=="电影" || navType[type]=="电视剧" || navType[type]=="动漫"){
                    return true;
                }
                return false;
            }


            //加载iframe
            var loadFrame = function(type){
                var frame = '<iframe src="http://pub.aplus.pptv.com/wwwpub/head/pg_recommend?navType='+type+'" id="recommend_frame" frameborder="0" scrolling="no" width="100%" height="180px"></iframe>';
                $('#recommend').html(frame);
                // setState(type);
            }



            //记录展开状态
            var setState = function(show){
                if(show){
                    window.recommendShowed = show;
                } else {
                    window.recommendShowed = false;
                }
            }

            $('#header_nav .hd-nav a').mouseenter(function(){
                if(!circleshow){
                    return;
                }
                clearTimeout(timer);
                $("#header_nav .hd-nav a i").removeClass('icon-tj');
                $(this).children('i').addClass('icon-tj');
            })
            $('#header_nav .hd-nav a').mouseleave(function(){
                if(!circleshow){
                    return;
                }
                var el=this;
                timer = setTimeout(function(){
                    $(el).children('i').removeClass('icon-tj');
                },600)
            })
            $('#header_nav .hd-nav a i').click(function(){
                var type = $(this).parent('a').attr('channel');
                if(isRecommend(type) && type!=recommendShowed){
                    loadFrame(type);
                }
                return false;
            })
        })();

        //导航在窄屏收入更多中、客户端下载hover
        ;(function(){
            if(smallHead){
                return;
            }
            var subnav = $('#header_nav .hd-nav .hd-subnav');
            var more = subnav.children('.more');
            var morenav = subnav.children('.morenav');
            var pdview = $('#header_nav .hd-download #product-view');
            var pddrop = $('#header_nav .hd-download .pd-drop');

            var nav_change = function(className){
                var bodyClass = $('body')[0].className.match(/grid-\d+/);
                var cn = className || (bodyClass ? bodyClass[0] : '');
                var nMax = 4;
                switch(cn){
                    case 'grid-1410':
                        nMax = 10;break;
                    case 'grid-1230':
                        nMax = 9;break;
                    case 'grid-1010':
                        nMax = 4;break;
                    default:
                        nMax = 4;break;
                }
                var n = subnav.children('a').length-1;
                if(n>nMax){
                    var links = subnav.children('a');
                    var l = n-nMax;
                    for(var i=0; i<=l; i++){
                        var li = document.createElement('li');
                        $(li).html(links[n-1-i]);
                        morenav.prepend($(li));
                    }
                } else if(n<nMax){
                    var lists = morenav.children('li');
                    var l = (lists.length+n)<=nMax?lists.length:(nMax-n-1);
                    for(var i=0; i<l; i++){
                        var a = $(lists[i]).children('a');
                        a.insertBefore(more);
                        $(lists[i]).remove();
                    }
                }
                if(morenav.children('li').length<1){
                    more.hide();
                } else {
                    more.show();
                }
            }

            $.subscribe1('onBodyResize', function(className){
                nav_change(className);
            })
            $(document).ready(function(){
                nav_change();
            })

            var more_show = delay(function(){
                morenav.show();
                more.addClass('more-hover');
            },200);
            var more_hide = delay(function(){
                morenav.hide();
                more.removeClass('more-hover');
            },200);
            var pd_show = delay(function(){
                pdview.addClass('cur');
                pddrop.show();
                pddrop.addClass('pd-drop-shake');
            },200);
            var pd_hide = delay(function(){
                pdview.removeClass('cur');
                pddrop.hide();
                pddrop.removeClass('pd-drop-shake');
            },200)

            more.mouseenter(function(){
                more_show();
            }).mouseleave(function(){
                more_hide();
            })
            morenav.mouseenter(function(){
                more_hide.cancel();
            }).mouseleave(function(){
                more_hide();
            })

            pdview.mouseenter(function(){
                pd_show();
            }).mouseleave(function(){
                pd_hide();
            });
            pddrop.mouseenter(function(){
                pd_hide.cancel();
            }).mouseleave(function(){
                pd_hide();
            });
            $(window).on('scroll',function(){
                morenav.hide();
                pddrop.hide();
            })
        })()

        //head在下滚时收起，回滚时显示
        //head、滚动
        ;(function(){
            if(IE6 || smallHead){
                return;
            }
            var previousScroll=0;
            var key = true;
            var direction;
            var header = $('.g-1408-hd');
            var headHeight = header.height();
            var timer;
            function scrollDown(scrolltop){
                if(scrolltop<headHeight || (previousScroll>headHeight && direction=='down')){
                    return;
                }
                if(previousScroll<headHeight && scrolltop>headHeight){
                    direction = 'down';
                    header.css({
                        'position' : 'fixed',
                        'top' : -headHeight
                    })
                    $('body').css({
                        'padding-top' : headHeight
                    })
                    window.circleshow = false;
                }
                if(previousScroll>headHeight){
                    direction = 'down';
                    header.animate({
                        'top' : -headHeight
                    },300)
                }
            }
            function scrollUp(scrolltop){
                if(previousScroll<headHeight || (scrolltop>headHeight && direction=='up')){
                    return;
                }
                if(previousScroll>headHeight && scrolltop<headHeight){
                    if(direction=='up'){
                        header.animate({
                            'top' : -scrolltop
                        },200,function(){
                            header.css({
                                'top' : 0,
                                'position' : 'relative'
                            })
                            $('body').css({
                                'padding-top' : 0
                            })
                            window.circleshow = true;
                        })
                    } else {
                        direction = 'up';
                        header.animate({
                            'top' : -scrolltop
                        },200,function(){
                            header.css({
                                'top' : 0,
                                'position' : 'relative'
                            })
                            $('body').css({
                                'padding-top' : 0
                            })
                            window.circleshow = true;
                        })
                    }
                }
                if(scrolltop>headHeight){
                    direction = 'up';
                    header.animate({
                        'top' : 0
                    },300)
                }
            }
            $(window).scroll(function(){
                clearTimeout(timer);
                timer = setTimeout(function(){
                    var currentScroll = $(window).scrollTop();
                    if(previousScroll<currentScroll){
                        scrollDown(currentScroll);
                    } else {
                        scrollUp(currentScroll);
                    }
                    previousScroll = currentScroll;
                },200);
            })
        })();

        //小导航
        ;(function(){
            if(!smallHead){
                return;
            }
            var ch = $('.hd-s-nav .ui-icon-ch');
            var chdrop = $('.hd-s-nav .ch-drop');
            var dropshow = delay(function(){
                ch.addClass('ui-icon-ch-hover');
                chdrop.show();
            },300);
            var drophide = delay(function(){
                ch.removeClass('ui-icon-ch-hover');
                chdrop.hide();
            },300);
            ch.on('mouseenter',function(){
                drophide.cancel();
                dropshow();
            }).on('mouseleave',function(){
                dropshow.cancel();
                drophide();
            });
            chdrop.on('mouseenter',function(){
                drophide.cancel();
                dropshow();
            }).on('mouseleave',function(){
                dropshow.cancel();
                drophide();
            })
        })();

        //头部logo旁广告逻辑
        ;(function() {
            var $wrap = $('.g-1408-hdtop .hd-recommend');
            var $inner = $('.g-1408-hdtop .hd-recommend .slide-wrap');
            var $lists = $wrap.find('a');
            if($lists.length === 0 || $lists.length === 1){
                return;
            }
            var width = $wrap.width();
            var len = $lists.length;

            function slide() {
                $($lists[len-1]).fadeOut(function(){
                    $inner.prepend($lists[len-1]);
                    $($lists[len-1]).show();
                    $lists = $wrap.find('a');
                    setTimeout(function() {
                        slide();
                    }, 3000);
                })
            }
            $inner.css('position','relative');
            $lists.css({
                'position':'absolute',
                'top':'0px',
                'left':'0px',
                'width':width,
                'overflow':'hidden'
            });
            setTimeout(function() {
                slide();
            }, 3000);
        })();
    }

    // web端自动启动
    if(!webcfg.isClient){
        webInit();
    }
    /* 业务逻辑 end*/

    var header = {
        playHistory: playhistory,
        favorite: favorite,
        recommend: recommend,
        clearCache: clearCache,
        userDetail: userDetail,
        cloudHistory: cloudhistory
    };

    /*数据模块end*/

    $('body').on('touchstart', function(){
        $.publish('closeAllLayout')
    })


    /*helper*/
    function dateDiff(interval, objDate1, objDate2){
        var d=objDate1, i={}, t=d.getTime(), t2=objDate2.getTime();
        i['y']=objDate2.getFullYear()-d.getFullYear();
        i['q']=i['y']*4+Math.floor(objDate2.getMonth()/4)-Math.floor(d.getMonth()/4);
        i['m']=i['y']*12+objDate2.getMonth()-d.getMonth();
        i['ms']=objDate2.getTime()-d.getTime();
        i['w']=Math.floor((t2+345600000)/(604800000))-Math.floor((t+345600000)/(604800000));
        i['d']=Math.floor(t2/86400000)-Math.floor(t/86400000);
        i['h']=Math.floor(t2/3600000)-Math.floor(t/3600000);
        i['n']=Math.floor(t2/60000)-Math.floor(t/60000);
        i['s']=Math.floor(t2/1000)-Math.floor(t/1000);
        return i[interval];
    }

    function userIcon(vip){
        var titleVip, titleYear
        switch (vip) {
            case '0':
                titleVip = '您还不是PPTV会员，等级加速未开启';
                titleYear = '立即点亮年费会员，独享1.4倍等级加速';
                break;
            case '1':
                titleVip = '您是PPTV会员，等级加速1.2倍生效中';
                titleYear = '立即点亮年费会员，独享1.4倍等级加速';
                break;
            case '2':
                titleVip = '您是PPTV年费会员,等级加速1.4倍生效中';
                titleYear = '年费会员独享1.4倍等级加速';
                break;
            default:
        }

        return '<a href="http://pay.vip.pptv.com/?plt=web&aid=wdh_vip" target="_blank" title="'+ titleVip +'" class="ui-vip '+ (vip === '0' ? 'ui-novip' : '') +'"></a>' +
            '<a href="http://pay.vip.pptv.com/?plt=web&aid=wdh_year" target="_blank" title="'+ titleYear +'" class="ui-year '+ (vip === '2' ? '' : 'ui-noyear') +'"></a>';
    }

    function getGradePics(gradeMedal, listGradeUrl) {
        var arr = gradeMedal.split(';');
        return _.map(arr, function(n, i){
            var n = parseInt(n);
            if(n > 0){
                var t = [], obj = listGradeUrl[i];
                while(n-- ){
                    t.push('<img src="' + obj["gradeUrl"] + '" alt="" />\n');
                }
                return t.join('');
            }
            return '';
        }).join('');
    }

    function speedUpInfoText(UserInfo){
        var s;
        if (UserInfo.isVip == 2) {
            s = '享受<i>1.4</i>倍等级加速中';
        } else if (UserInfo.isVip == 1) {
            s = '<i>1.2</i>倍等级加速中';
        } else if (UserInfo.isVip == 0 && UserInfo.IsUgspeed == 'true') {
            s = '<i>1.2</i>倍等级加速中'
        } else if (UserInfo.isVip == 0) {
            s = '没有开启加速'
        }
        return s;
    }

    return header;
});
