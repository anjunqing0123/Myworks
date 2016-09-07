define(function(require, exports, modules) {
	require('../../../util/pub/main');
    var login=require('../../../util/login/login');
	// webcfg 需要根据新的接口进行组装
    var
        $ = require('jquery'),
        log = require('../../../util/log/log'),
        cookie = require('../../../util/cookie/cookie'),
        user = require('../../../util/user/user');
        playId = webcfg['id'],
        isJuji = !webcfg.playType ? false : true,
        DomPlayer = $('#pptv_playpage_box'),
        DomPlayerSideBar = $('#player-sidebar'),
        BarrageHeight = 0,
        key = 'theatremode',
        isTheatreMode = false;
    if(!playId || !DomPlayer.length){ alert('缺少播放器频道ID!'); return;}
    //弹幕输入
    (function(){
        var hasInited = false;
        //vodBarrage();
        player.onRegister('setupbarrage', function(data) {
        	//这里会初始化2次，原因未知;
            var dataContent = data.body && data.body.data || {};
            log('player :: setupbarrage ==>', data, dataContent);

            //全局设置
            player.getPlayer().setCallback('barragesetting', {
                header : {
                    type : 'barragesetting'
                },
                body : {
                    data : {
                        //alpha : 1,
                        visible : 0
                        //size : 28
                        //color : '#FF9900'
                    }
                }
            });

            //判断是否支持弹幕 'mode' : 1  或 0  代表   有或无
            if(dataContent.mode !== 0){
                vodBarrage();
            }
        });


        function vodBarrage(){
            if(hasInited) return;
            var DomPlayerParent = DomPlayer.parent(), h0 = DomPlayer.height();
            DomPlayerParent.append("<div id='vod-barrage' class='module-dm-input'><div class='form cf'><span class='t' id='setfont'></span><input type='text' name='' class='txt' id='dminput' maxlength='30'><a href='###' title='' class='submit' id='dmsubmit'>发送</a></div><div class='text'></div><iframe frameborder='0' src='about:blank' class='iframe-blank' style='position:absolute;top:-118px;left:0;display:none;background:#fff;opacity:0;width:210px;height:120px;z-index:1;'></iframe><div class='dm-input-pop' style='display:none;top:-118px;height:80px;'>   <!--<dl><dt>弹幕显示设置</dt><dd id='opacity'><span>透明度</span><a href='###' title='' class='now'>无</a><a href='###' title=''>低</a><a href='###' title=''>中</a><a href='###' title=''>高</a></dd></dl>--><dl><dt>我的弹幕设置</dt><dd><span>颜&nbsp;&nbsp;&nbsp;色</span><span class='rgb'>#ffffff</span><span class='color' style='background:#fff;'></span></dd></dl><div class='takecolor'><a href='###' title='' data-color='ffffff' style='background:#ffffff;'></a><a href='###' title='' data-color='ff0000' style='background:#ff0000;'></a><a href='###' title='' data-color='ff9900' style='background:#ff9900;'></a><a href='###' title='' data-color='fff100' style='background:#fff100;'></a><a href='###' title='' data-color='00ff12' style='background:#00ff12;'></a><a href='###' title='' data-color='00fcff' style='background:#00fcff;'></a><a href='###' title='' data-color='3399ff' style='background:#3399ff;'></a><a href='###' title='' data-color='8600ff' style='background:#8600ff;'></a><a href='###' title='' data-color='ff0096' style='background:#ff0096;'></a><a href='###' title='' data-color='c8b33c' style='background:#c8b33c;'></a></div><a href='###' title='' class='arrow'></a></div></div>");
            BarrageHeight = $('#vod-barrage').height();
            var DomPlayerSideBarWrap=DomPlayerSideBar.parent();
            DomPlayerSideBarWrap.height(DomPlayerSideBarWrap.height()+BarrageHeight);
            /*DomPlayerWraper.height(h0 + BarrageHeight);
            DomPlayerWraper.find('.player-bg').css({ height : h0 + BarrageHeight});*/
            /*DomPlayerSideBar.height(DomPlayerSideBar.height() + BarrageHeight);
            if(isTheatreMode){
                DomPlayerSideBar.parent().css('margin-top', 0);
            }else{
                DomPlayerSideBar.parent().css('margin-top', -(h0 + BarrageHeight + 10));
            }*/

            $.publish('player.resize');

            var submit = $("#dmsubmit"),
                inputTxt = $("#dminput"),
                curcolor = "ffffff",
                alpha = "1"
            ;

            var opaNum = [1,0.85,0.7,0.55];

            $("#setfont").click(function(){
                if($(".dm-input-pop").css("display") == "none"){
                    $(".dm-input-pop").show().parent().find('.iframe-blank').show();
                }else{
                    $(".dm-input-pop").hide().parent().find('.iframe-blank').hide();
                }
            });

            $("#opacity a").each(function(i,d){
                $(this).click(function(){
                     $("#opacity a").removeClass("now");
                     $(this).addClass("now");
                     alpha = opaNum[i];
                });
            });

            $(".takecolor a").each(function(i,d){
                $(this).click(function(){
                     curcolor = $(this).attr("data-color");
                     $(".rgb").html("#"+curcolor);
                     $(".color").css("background","#"+curcolor);
                });
             });

            var vodInterval = null;

            var getValue = function(){
                words = inputTxt.val();
                if(/^\s|\S$/.test($.trim(words)) == false){
                    return false;
                }else{
                    player.onNotification({
                        header : {
                            type : 'sendbarrage'
                        },
                        body : {
                            data : {
                                userName : user.info.UserName,
                                nickName : user.info.Nickname,
                                playPoint : '',
                                vipType : 0,
                                visible : 0,
                                content : words,
                                color : "#" + curcolor
                                //alpha : alpha     播放器已经更新， 不需要传这个参数
                            }
                        }
                    });
                    var count = 5;
                    submit.addClass('disable').html(count);
                    vodInterval = setInterval(function(){
                        count--;
                        submit.html(count);
                        if(count<=0){
                            clearInterval(vodInterval);
                            vodInterval = null;
                            submit.removeClass('disable').html('发送');
                        }
                    }, 1000);
                }
            };
            submit.click(function(){
                if(!!vodInterval){
                    return;
                }
                if (user.isLogined) {
                    getValue();
                    inputTxt.val("");
                }else{
                    login.check(function() {
                        getValue();
                    }, {
                        type: "login"
                    });
                }
            });

            inputTxt.on("keydown",function(e){
                if(e.keyCode==13){
                    if(!!vodInterval){
                        return;
                    }
                    if (user.isLogined) {
                        getValue();
                        inputTxt.val("");
                    }else{
                        login.check(function() {
                            getValue();
                        }, {
                            type: "login"
                        });
                    }
                }
            });
            hasInited = true;
        }
        //剧场模式
        player.onRegister('theatre', function(data) {
            log('onRegister ==> theatre ', data, data.body.data.mode);
            var dataContent = data.body && data.body.data || {};
            cookie.set(key, dataContent.mode, 1, 'pptv.com', '/');
            /*window.scrollTo(0, 0);
            isSmallWindow = false;*/
            if(dataContent.mode === 1){
                isTheatreMode = true;
                playForTheatre();
            }else{
                isTheatreMode = false;
                playForTheatre();
            }
        });
        function playForTheatre(){
        	var DomPlayerParent = DomPlayer.parent();
        	if(!!isTheatreMode){
        		DomPlayerSideBar.parent().css('display','none');
                DomPlayerParent.addClass('player-theatre');
        		DomPlayerParent.animate({
        			width:'100%'
        		},400,'swing');
        	}else{
        		//DomPlayerParent.css('width','680px');
        		DomPlayerParent.animate({
        			width:'680px'
        		},400,'swing',function(){
                    DomPlayerParent.removeClass('player-theatre');
        			DomPlayerSideBar.parent().css('display','block');
        		});
        	}
        	$.publish('player.resize');
           /* DomPlayerWraper.css({'height' : (getHeight() + BarrageHeight)});
            DomMainContent.find('.s').stop().animate({
                "margin-top" : 0
            }, 400, 'swing', function(){
                DomPlayerBg.fadeIn();
                DomPlayer.parent().addClass('player-theatre').css('height', getHeight()).parent().css('padding-top', 0).find('.player-bg').css('height', getHeight() + BarrageHeight);
                //$.publish('player.resize');
            });*/
        }
        //剧场模式结束
        //输出节目列表开始
        require('./programList');
        //输出节目列表结束
        // 加载评论模块
        require('../../../util/comment/comment');
        // 加载评论模块结束
    })();
});
