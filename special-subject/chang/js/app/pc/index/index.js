define(function(require, module, exports) {
    // 图片后加载
	var delayload = require('../../../util/lazyload/delayload');
    delayload.init();
    // 头部倒计时，由于之前使用的不是timer，所以暂时还是用这个flipclock
	var flipclock=require('./flipclock');
    var cookie = require('../../../util/cookie/cookie');
	require('./vod');
	var $ = require('jquery'),
		ps = require('../../../util/photoslide/photoslide')
	;
    require('../../../util/drag/drag')($);
	//var d = new Date(new Date().getTime()+60*1000*60);
    //首页倒计时
    var timeDom=$(".js-timer-data");
    if($.trim(timeDom.html())!=""){
        var servertime;
        $.ajax({
            url:'http://time.pptv.com?time='+new Date().getTime(),
            type : 'GET',
            dataType : 'jsonp',
            cache: true,
            jsonp:'cb',
            success:function(data){
                servertime=new Date(data*1000);
                var now=new Date();
                //建立time对象如果不是合法的timer对象，跳出
                var timerDate=timeDom.text().replace(/-/g,'/');
                if(!!timerDate){
                    timerDate=new Date(timerDate);
                }else{
                    return false;
                }
                if(servertime.getTime()<timerDate.getTime()){
                    var obj = {
                        sec: document.getElementById("sec"),
                        mini: document.getElementById("mini"),
                        hour: document.getElementById("hour"),
                        servertime:servertime
                    };
                    flipclock.create(timerDate, obj);
                    $(".time").removeClass('hidden');
                }
            },
            timeout:1000,
            error:function(){
                //todo
                var timerDate=$(".js-timer-data").text().replace('-','/');
                if(!!timerDate){
                    var obj = {
                        sec: document.getElementById("sec"),
                        mini: document.getElementById("mini"),
                        hour: document.getElementById("hour")
                    };
                    flipclock.create(timerDate, obj);
                    $(".time").removeClass('hidden');
                }
            }
        });
    }
    //幻灯
	ps.init($(".talkshow"), {
        perTime: 1,
        showNum: 3,
        outer: '.tkshow',
        inner: '.module-animation180x100 ul',
        autoSwitchTime:7000
    });
    /*var tab=require('../../../util/scroller/tab');
    tab(".js-tab-switch",{
    	evt:'click',
    	activeClass:'active'
    });*/
    //登录模块
    require('../../../util/linkcfg/pcredirect');
    //登录模块结束
    var applyTab = $(".apply .tabcon");
    $(".apply ul").on("click","li",function(){
    	$(applyTab).hide();
    	$(".apply li").removeClass("now");
		var index = $(this).index();
		$(this).addClass("now");
		$(applyTab[index]).show();
    })

    $(".module-pic-layout .animation3-180x100 li").hover(function(){
    	$(this).addClass("item-hover");
    },
    function(){
    	$(this).removeClass("item-hover");
    });

    //写入cookie，禁止客户端iframe刷新
    cookie.set('refreshForClient', 0, 1, 'pptv.com', '/');

    //客户端弹tips
    //判断是否是客户端，判断是否是最新版本
    //如果不是就弹出更新tips
    //一天弹一次
    (function(){
        try{
            var clientVer = external.GetObject('@pplive.com/PPFrame;1').PPTVVersion;
            if(clientVer>'3.6.3.0026'){
                return;
            }
            var passport = external.GetObject('@pplive.com/passport;1');
            var username = passport.state==-1 ? '' : passport.userName;
            var popcookiename = username+'_changpoptips';
            if(cookie.get(popcookiename)){
                return;
            } else {
                cookie.set(popcookiename, 1, 1, 'pptv.com', '/');
                showPop();
            }
        } catch(e){return;}
        function showPop(){
            var $pop = $(''+
            '<div class="chang-pop" style="width:100%; height:100%; position:fixed; top:0; left:0; z-index:100">'+
                '<div class="popbox" style="width:420px; height:250px; position:absolute; background:url(http://sr2.pplive.com/cms/24/59/ce23433c069095be392ad1548939addb.png); cursor:default; -webkit-user-select:none;">'+
                    '<h1 style="margin:16px 0 0 10px; font-size:18px; color:#000000;">温馨提示</h1>'+
                    '<p style="color:#000000; width:320px; margin:46px auto 0 auto; font-size:16px; line-height:30px; letter-spacing:2px;">检测到您不是最新客户端，低版本不支持直播互动，请升级版本</p>'+
                    '<a href="javascript:;" class="sbtn" style="font-size:12px; color:#ffffff; text-decoration:none; width:120px; height:30px; line-height:30px; text-align:center; display:block; background:#01afea; margin:40px auto 0 auto; letter-spacing:2px;">更新</a>'+
                    '<a href="javascript:;" class="cbtn" style="background:url(http://sr1.pplive.com/cms/39/27/7e99a827d0255917874fb4df2fa4b4fe.png); width:13px; height:14px; display:block; position:absolute; top:17px; right:10px;"></a>'+
                '</div>'+
            '</div>');
            $cbtn = $pop.find('.cbtn');
            $sbtn = $pop.find('.sbtn');
            $box = $pop.find('.popbox');
            var wHeight = $(window).height();
            var wWidth = $(window).width();
            var boxHeight = $box.height();
            var boxWidth = $box.width();
            $box.css({
                top: wHeight/2-boxHeight/2,
                left: (wWidth-boxWidth)/2
            });
            $cbtn.on('click', function(){
                $pop.remove();
            });
            $sbtn.on('click', function(){
                $pop.remove();
                try{
                    external.GetObject2("@pplive.com/PPFrame;1").ManualUpdate();
                } catch(e){}
            });
            $('body').append($pop);
            $box.draggable();
        }
    })();
});
