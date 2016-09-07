define(function(require, exports){
	var $=require('jquery');
	var _=require('underscore');
	var vote=require('../../../../util/vote/vote');
    var formatVote=require('../../../../util/vote/formatVote');
    //var voteMap=require('../../../../util/vote/voteupdate');
    var counter=require('../../../../util/vote/counterTimer');
    var uniformDate=require('../../../../util/vote/uniformDate');
    var timer=require('../../../../util/Timer/timer');
    var loader=require('../../../../util/loader/loader');
    var urls=require('../../../../util/linkcfg/interfaceurl');
    var appBarrage = require('../../../../util/barrage/barrage');
    var cookie = require('../../../../util/cookie/cookie');
    var _=require('underscore');
    //假数据
    var player={
        player_id:$.trim($('[name=player_id]').val()),
        stage:$.trim($('[name=stage]').val()),
        scope:$.trim($('[name=scope]').val())
    };
    var DomPlayer = $('#pptv_playpage_box');
    //弹幕
    (function(){
        var BarrageHeight = 0;
        $('.module-playbox-page .playbox').append('<div class="barrage" id="barrage"></div>');

        var hasInited = false;
        var barrageapp = new appBarrage({
            wrapbox : $('#barrage'),
            player : window.player
        });
        require('../../../../util/barrage/player-plugin-barrage').init(barrageapp);
        window.player.onRegister('setupbarrage', function(data) {
            var dataContent = data.body && data.body.data || {};
            log('player :: setupbarrage ==>', data, dataContent);
            if(hasInited) return;
            hasInited = true;

            //判断是否支持弹幕 'mode' : 1  或 0  代表   有或无
            if(dataContent.mode === 0){
                barrageapp.none();
            }else{
                barrageapp.init();
                barrageapp.add({
                    userName : 'sysmsg',
                    nickName : '系统消息',
                    playPoint : +new Date(),
                    vipType : 0,
                    content : '欢迎进入' + (webcfg.p_title || '') + '!'
                });
            }

            //启动
            $.publish('barrage:init');

        });
    })();

    //剧场模式
    (function(){
        var isTheatreMode = false;
        var key = 'theatremode';
        var DomPlayerSideBar = $('#barrage');
        //剧场模式
        window.player.onRegister('theatre', function(data) {
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
            if(!!isTheatreMode){
                DomPlayerSideBar.css('display','none');
                DomPlayer.animate({
                    width:'100%'
                },400,'swing');
            }else{
                //DomPlayerParent.css('width','680px');
                DomPlayer.animate({
                    width:'680px'
                },400,'swing',function(){
                    DomPlayerSideBar.css('display','block');
                });
            }
        }
    })();
    //投票配置
    var counterDefaultTread=10;
    var counterDefaultReward=60;
    function getCounter(voteid,first,counterDefault) {
        //first 页面打开加载
        var getCookieVal = cookie.get("_c_" + voteid);
        if (!getCookieVal) {
            if (first != true) {
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
            }
            return counterDefault;
        } else {
            var eclipseTime = Math.floor(new Date().getTime() / 1e3) - Number(getCookieVal);
            if(counterDefault-eclipseTime<0){
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                return counterDefault;
            }
            return counterDefault - eclipseTime;
        }
    }
    //加入vip模块
    require('../../index/common-joinvip');
    //酬金js开始
    //js-vote初始化,votemapupdate
   /* voteMap.init({
        selector:'.js-vote',
        voteAttr:'data-sid',
        prior:'data-prior'
    });*/
    //酬金vote事件
    new vote({
        dom:'.vote-main .js-vote',
        voteAttr:'data-sid',
        afterVote:function(data,dom){
            if(typeof data.counter!='undefined'){
                var domParent=dom.parent();
                var endCounter=getCounter(dom.attr('data-sid'),false,counterDefaultReward);
                voteAnimate(domParent,endCounter,counterDefaultReward);
                domParent.find('em.ml15').html(addKannma(exceptionCounter(data.counter)));
            }else if(data.errors){
    //                console.log(data.errors);
                if(data.errors.code==88){
                    alert("请休息一会儿再投票哦！");
                }else if(data.errors.code==91){
                    alert('投票未开始');
                }
            }
        }
    });
    function exceptionCounter(counter){
        if(typeof counter=='undefined'||counter==null){
            return 0;
        }else{
            return counter;
        }
    }
    //锁定投票逻辑
    var rewardObj=$('.vote-wrap .vote-icon.js-vote');
    var rewardId=rewardObj.attr('data-sid');
    var endCounterReward=getCounter(rewardId,true,counterDefaultReward);
    if(endCounterReward!=counterDefaultReward){
        voteAnimate(rewardObj.parent(),endCounterReward);
    }
    //酬金动画
    function voteAnimate(domParent,endCounter,defaultCount,targetTop){
        var maskDom=domParent.find('.vote-mask');
        var addDom=domParent.find('.vote-add');
        var originTop=addDom.css('marginTop');
        var targetTop=targetTop||-67;
        new counter({
            counter:endCounter,
            init:function(){
                maskDom.show();
                maskDom.text(endCounter);
            },
            update:function(){
                maskDom.text(this.counter);
            },
            finish:function(){
                maskDom.hide();
                maskDom.text('');
            }
        });
        if(endCounter==defaultCount){
            addDom.css('display','block').animate({
                marginTop:targetTop,
                opacity:1
            },1000,function(){
                setTimeout(function(){
                    addDom.fadeOut(function(){
                        addDom.css({
                          marginTop:originTop
                        });
                    });
                },1000);
            });
        }
    }
    //千分位
    function addKannma(number) {
        //测试千万数据
        //num=12235400;
        //测试亿数据
        //num=123500000;
        //num=12000;
        //digit=2;
        if(number==null||number==0){
            return 0;
        }
        if(number.length<4){
            return number;
        }
         var num = number + "";  
         num = num.replace(new RegExp(",","g"),"");   
         // 正负号处理   
         var symble = "";   
         if(/^([-+]).*$/.test(num)) {   
             symble = num.replace(/^([-+]).*$/,"$1");   
             num = num.replace(/^([-+])(.*)$/,"$2");   
         }   
       
         if(/^[0-9]+(\.[0-9]+)?$/.test(num)) {   
             var num = num.replace(new RegExp("^[0]+","g"),"");   
             if(/^\./.test(num)) {   
             num = "0" + num;   
             }   
       
             var decimal = num.replace(/^[0-9]+(\.[0-9]+)?$/,"$1");   
             var integer= num.replace(/^([0-9]+)(\.[0-9]+)?$/,"$1");   
       
             var re=/(\d+)(\d{3})/;  
       
             while(re.test(integer)){   
                 integer = integer.replace(re,"$1,$2");  
             }   
             return symble + integer + decimal;   
       
         } else {   
             return number;   
         }   
     }
    // 酬金结束
	//获取服务器时间
	var serverOffsetTime=0;
    var getServerSuccess=false;
    var pageStartTime=new Date().getTime();
	$.ajax({
		url:'http://time.pptv.com?time='+new Date().getTime(),
		type : 'GET',
    	dataType : 'jsonp',
    	cache: true,
    	jsonp:'cb',
		success:function(data){
			var servertime=new Date(data*1000);
            getServerSuccess=true;
			serverOffsetTime=servertime.getTime()-new Date().getTime();
            init();
		},
        error:function(){
            init();
        },
		timeout:1000
	});
      //获取现在的时间
    function getNow(cdnDate){
        if(getServerSuccess==true){
            return new Date(new Date().getTime()+serverOffsetTime);
        }else{
            if(!cdnDate){
                return new Date(); 
            }
            var offsetTime=new Date().getTime()-pageStartTime;
            var tempPhpDate=new Date(cdnDate.getTime()+offsetTime);
            var clientOffsetTime=new Date().getTime()-tempPhpDate.getTime();
            //cdn 缓存<1小时，相信用户的时间
            if((clientOffsetTime>0&&clientOffsetTime<1000*60*60)||(clientOffsetTime<0&&clientOffsetTime>-1000*60*30)){
                return new Date();
            }else{   
                return tempPhpDate;
            }
        }
    }
	//跑步机开始
	var treadmill=require('./speed');
	var treadmillObj=treadmill.create({
        index:0,
        lineWidth:25,
        lineStrokeWidth:2,
        radius:100,
        auxilary:true,
        hasCursor:true
    });
    //跑步机绑定投票
    var countDownTread=$(".treadmill-countdown");
    var runCid=window.webcfg.id;
    var totalSpeed=5;
    var totalDangwei=35;
    //常规倒计时
    function counterNormal(dom,count,first,originTxt){
        if(first==true){
            dom.text(count+"S");
        }
        setTimeout(function(){
            var tempCount=--count;
            dom.text(tempCount+"S");
            if(count!=0){
                counterNormal(dom,count,false,originTxt);
            }else{
                dom.html(originTxt);
            }
        },1000);
    }
    function nextRequest(nextRequestTime,tempNow){
       // console.log(nextRequestTime);
       // console.log(tempNow);
        timer({
            startTime:tempNow,
            endTime:nextRequestTime,
            serverOffsetTime:serverOffsetTime,
            callback:function(status,times){
                if(status==2){
                    loader.load('http://chang.pptv.com/api/speed',{cid:runCid},function(data){
                        //console.log(data);
                        if(data.err===0){
                            var tempSpeed=data.data.speed;
                            $(".treadmill-curSpeed strong").text(tempSpeed);
                            treadmillObj.update(Math.floor(tempSpeed/totalSpeed*totalDangwei));
                            if(data.data.offline_on===false||!data.data.offline_on){
                                return false;
                            }
                            var nextRequestTime=new Date(data.data.offline_on*1000+1000*3+Math.random()*1000*3);
                            var tempNow=getNow();
                            if(nextRequestTime.getTime()>tempNow.getTime()){
                                nextRequest(nextRequestTime,tempNow);
                            }
                        }
                    });
                }
            }
        });
    }
    //计票tips
    (function(){
        var $link = $(".treadmill-vote-wrap .js-vote");
        var $tips = $('.treadmill-vote-wrap .tips');
        var showTimer, hideTimer;
        $link.on('mouseenter', function(){
            var obj=$(this);
            if(!obj.hasClass('js-unbegin')){
                return false;
            }
            if(obj.hasClass('vote-wrap-l')){
                $tips.css('left','-16px');
            }else if(obj.hasClass('vote-wrap-r')){
                $tips.css('left','124px');
            }
            clearTimeout(hideTimer);
            showTimer = setTimeout(function(){
                $tips.fadeIn();
            }, 200);
        }).on('mouseleave', function(){
            clearTimeout(showTimer);
            hideTimer = setTimeout(function(){
                $tips.fadeOut();
            },200);
        })
    })();
    var totalLast=0;
    var phpCdnRefresh=30;
    function finishUpdateReward(){
        if(globalRewardInterval!=null){
            clearInterval(globalRewardInterval);
            globalRewardInterval=null;
        }
        loaderReward();
        if(totalLast<3){
            totalLast++;
            setTimeout(function(){
                finishUpdateReward();
            },phpCdnRefresh*1000);
        }
    }
    function bindVoteId(data){
        var domUp=$(".vote-wrap-l");
        var domDown=$(".vote-wrap-r");
        // data.speedUpVoteId=34451;
        // data.slowDownVoteId=34751;
        //$(".treadmill-vote-wrap .js-vote").attr('title','投票未开始');
        domUp.attr('data-sid',data.speedUpVoteId);
        domDown.attr('data-sid',data.slowDownVoteId);
        var domUpCounter=getCounter(data.speedUpVoteId,true,counterDefaultTread)
        var domDownCounter=getCounter(data.slowDownVoteId,true,counterDefaultTread);
        if(domUpCounter!=counterDefaultTread){
            counterNormal(domUp,domUpCounter,true,domUp.html());
        }
        if(domDownCounter!=counterDefaultTread){
            counterNormal(domDown,domDownCounter,true,domDown.html());
        }
        var counterUp=data.speedUpVote.counter ? data.speedUpVote.counter : 0;
        var counterDown=data.slowDownVote.counter ? data.slowDownVote.counter : 0;
        //var tempEnd=new Date(uniformDate(data.endedAt));
        var speedExec=false;
        timer({
            startTime:getNow(),
            endTime:new Date($.trim($("[name=end]").val())*1000),
            serverOffsetTime:serverOffsetTime,
            callback:function(status,times){
                if(status==2){
                    countDownTread.html('00:00:00');
                    $(".treadmill-vote-wrap .js-vote").addClass('disabled').attr('title','投票已结束');
                    //更新最后的酬金，为了防止cdn，请求3次
                    finishUpdateReward();
                }else if(status==1){
                    if (Number(times.hours) < 1&&speedExec==false) {
                        var $votes=$(".treadmill-vote-wrap .js-vote");
                        $votes.removeClass('js-unbegin');
                        $votes.removeClass('disabled').removeAttr('title');
                        speedExec=true;
                        loader.load('http://chang.pptv.com/api/speed',{cid:runCid},function(data){
                            if(data.err===0){
                               // console.log(data);
                                var tempSpeed=data.data.speed;
                                $(".treadmill-curSpeed strong").text(tempSpeed);
                                treadmillObj.update(Math.floor(tempSpeed/totalSpeed*totalDangwei));
                                //加延迟，在加防穿透时间
                                var nextRequestTime=new Date(data.data.offline_on*1000+1000*3+Math.random()*1000*3);
                                var tempNow=getNow();
                                if(nextRequestTime.getTime()>tempNow.getTime()){
                                 //   console.log('next');
                                    nextRequest(nextRequestTime,tempNow);
                                }
                            }
                        });
                        countDownTread.html(times.hours+':'+times.minitues+':'+times.seconds);
                    }else{
                        countDownTread.html(times.hours+':'+times.minitues+':'+times.seconds);
                    }
                }
            }
        });
        new vote({
            dom:'.treadmill-votewrap .js-vote',
            voteAttr:'data-sid',
            beforeVote:function(data,dom){
                if(dom.data('locked')===true){
                    return false;
                }
                if(!!dom.hasClass('disabled')){
                    return false;
                }
                if(/\d/.test($.trim(dom.text()))==true){
                    return false;
                }
            },
            afterVote:function(data,dom){
                //console.log(data);
                if(typeof data.counter!='undefined'){
                    var domParent=dom.parents('.treadmill-votewrap');
                    var idx=dom.index();
                    domParent.find('.tread-num').eq(idx).html(exceptionCounter(data.counter));
                    var originTxt=dom.text();
                    var endCounter=getCounter(dom.attr('data-sid'),false,counterDefaultTread);
                    new counter({
                        counter:endCounter,
                        init:function(){
                            dom.text(endCounter+'S');
                            dom.data('locked',true);
                            dom.css('opacity','0.8');
                        },
                        update:function(){
                            dom.text(this.counter+'S');
                        },
                        finish:function(){
                            dom.text(originTxt);
                            dom.css('opacity','1');
                            dom.data('locked',false);
                        }
                    });
                    //updateProgress();
                }else if(data.errors){
                    if(data.errors.code==88){
                        alert("请休息一会儿再投票哦！");
                    }else if(data.errors.code==91){
                        alert('投票未开始');
                    }
                }
            }
        });

    }
    player.__config__={
        cdn:true,
        callback:'updatetreadmill'
    }
    var player_id = $('[name=player_id]').val();
    var scope = $('[name=scope]').val();
    var stage = $('[name=stage]').val();
    //请求酬金接口,依旧是假数据
    var rewardObj={
    	stage:stage,
    	scope:scope
    }
    rewardObj.__config__={
        cdn:true,
        callback :'updateRewardList'
    }
    var moneyDom=$(".vote-main .money");
    function loaderReward(){
        loader.load(urls['interface']['reward'],rewardObj,function(data){
            if(data.err==0){
                var data=data.data;
                var playerCount=null;
                var totalCount=0;
                for(var key in data){
                    totalCount+=Number(data[key]);
                    if(key==player_id){
                        playerCount=data[key];
                    }
                }
                if(playerCount==null){
                    playerCount=0;
                }
                if(totalCount==0){
                    var percent=0;
                }else{
                    var percent=Math.round(Number(playerCount)/totalCount*1000)/10;
                }
                if(Number(playerCount)!=0&&percent==0){
                    percent="0.0";
                }
                if(percent===0){
                    moneyDom.addClass('nomoney');
                }else{
                    moneyDom.removeClass('nomoney');
                }
                var targetDom=$(".money .bar p");
                $(".vote-main p em").html(addKannma(exceptionCounter(playerCount)));
                targetDom.css('width',percent+'%');
                var tempHtml='<i class="bl"></i>'+percent+'%<i class="br"></i>';
                targetDom.html(tempHtml);
            }
        });
    }
    var globalRewardInterval=null;
    var freshTime=45;
    function init(){
        loader.load(urls['interface']['gettreadmill'],player,function(data) {
            if(data.code==1){
                var data=data.data;
                bindVoteId(data);
            }
        });
        loaderReward();
        globalRewardInterval=setInterval(function(){
            loaderReward();
        },freshTime*1000);
    }
});
