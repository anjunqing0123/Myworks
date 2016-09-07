define(function(require,exports){
	var $=require('jquery');
	var vote=require('../../../../util/vote/vote');
	var counter=require('../../../../util/vote/counterTimer');
	var cookie=require('../../../../util/cookie/cookie');
	var Loader = require('../../../../util/loader/loader');
    var api = require('../../../../util/linkcfg/interfaceurl')['interface'];
    var formatVote=require('../../../../util/vote/formatVote');
    var log = require('../../../../util/log/log');
    var appBarrage = require('../../../../util/barrage/barrage');
    //播放器事件
	require('../../../../util/pub/main');
	var login=require('../../../../util/login/login');
	var user=require('../../../../util/user/user');
    var _ = require('underscore');
    require('../../../../util/scroller/scroller');
    //弹幕
    (function(){
        $('.module-playbox-page .playbox').append('<div class="barrage" id="barrage"></div>');

        var hasInited = false;
        var barrageapp = new appBarrage({
            wrapbox : $('#barrage'),
            player : window.player
        });
        require('../../../../util/barrage/player-plugin-barrage').init(barrageapp);
        player.onRegister('setupbarrage', function(data) {
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
    (function(){
    	var isTheatreMode = false;
    	var key = 'theatremode';
    	var DomPlayerSideBar = $('#barrage');
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
    })();
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
    //加入vip模块
    require('../../index/common-joinvip');
	var jsVotes=$(".js-vote-wrap .js-vote");
	jsVotes.on('mouseenter',function(){
		var obj=$(this);
		if(obj.hasClass('back-countdown')||obj.hasClass('go-countdown')){
			return false;
		}else{
			if(obj.hasClass('back')){
				obj.addClass('back-hover');
			}else if(obj.hasClass('go')){
				obj.addClass('go-hover');
			}
		}
	}).on("mouseleave",function(){
		var obj=$(this);
		obj.removeClass('back-hover go-hover');
	});
	var counterDefault=10;
	function getCounter(voteid,first) {
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
	function voteAnimate(dom,endCounter,targetTop){
		if(!targetTop){
			targetTop=-30;
		}
       var maskDom=dom.find('.time');
       var animateDom=dom.find('.num');
       var originTop = animateDom.css('top');
       new counter({
       	   counter:endCounter,
           init:function(){
           	   if(dom.hasClass('go')){
           	   	 dom.addClass('go-countdown')
           	   }else{
           	   	 dom.addClass('back-countdown');
           	   }
           	   maskDom.show();
               maskDom.text(endCounter);
           },
           update:function(){
               maskDom.text(this.counter);
           },
           finish:function(){
               maskDom.hide();
               maskDom.text('');
               dom.removeClass('go-countdown back-countdown');
           }
       });
       if(endCounter==counterDefault){
	       	animateDom.css('display','block').animate({
	       	    top:targetTop,
	       	    opacity:1
	       	},1000,function(){
	       	    setTimeout(function(){
	       	        animateDom.fadeOut(function(){
	       	            animateDom.css({
	       	              top:originTop
	       	            });
	       	        });
	       	    },1000);
	       	});
       }
	}
	new vote({
	    dom:'.js-vote-wrap .js-vote',
	    voteAttr:'data-id',
	    beforeVote:function(data,dom){
	       if(dom.hasClass('go-countdown')){
	       		return false;
	       }
	       if(dom.hasClass('back-countdown')){
	       		return false;
	       }
	       var endCounter=getCounter(dom.attr('data-id'));
	       voteAnimate(dom,endCounter);
	    },
	    afterVote:function(data,dom){
	        //do nothing
	        if(typeof data.counter!='undefined'){
	            //updateProgress();
	        }else if(data.errors){
	            //console.log(data.errors);
	        }
	    }
	});
	jsVotes.each(function(){
		var obj=$(this);
		var tempCounter=getCounter(obj.attr('data-id'),true);
		if(tempCounter!=counterDefault){
			voteAnimate(obj,tempCounter);
		}
	});
	//计票tips
	(function(){
	    var $link = $('.module-goldroad a.count');
	    var $tips = $('.module-goldroad .tips');
	    var showTimer, hideTimer;
	    $link.on('mouseenter', function(){
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
	var countMap={
		'0':'零',
		'1':'一',
		'2':'二',
		'3':'三',
		'4':'四',
		'5':'五',
		'6':'六',
		'7':'七',
		'8':'八',
		'9':'九',
		'10':'十'
	}
	function getChineseCount(count){
		var strCount=count.toString();
		if(strCount.length==1){
			return countMap[count];
		}else if(strCount.length==2){
			if(strCount.substr(1,1)=='0'){
				if(strCount.substr(0,1)=='1'){
					return countMap['10'];
				}else{
					return countMap[strCount.substr(0,1)]+countMap['10'];
				}
			}else{
				if(strCount.substr(0,1)=='1'){
					return countMap['10']+countMap[strCount.substr(1,1)];
				}else{
					return countMap[strCount.substr(0,1)]+countMap['10']+countMap[strCount.substr(1,1)];
				}
			}
		}
	}
	/*function strLen(str) {
	  if (!str) {
	    return 0;
	  }
	  var aMatch = str.match(/[^\x00-\xff]/g);
	  return (str.length + (!aMatch ? 0 : aMatch.length));
	};*/
	 //放省略号
  	//var limit = require('../../personspace/limit');
	//比赛结果
	//http://chang.pptv.com/api/match_result?cid=2822237542
	//返回数据说明
	//{cid: "2822237542", is_end: "1", player1: "mdsfsd", player1_username: "chenjie3", player1_praise: "223", player1_hate: "22332", player1_up: "0", player1_time: "22323", player1_index: false}
	//player1：姓名，player1_username：用户名，player1_praise：赞票，player1_hate：踩票，player1_up：是否晋级，player1_time：总时长
	(function(){
	    var tp = _.template(''+
	        '<dd class="cf">'+
	            '<a href="javascript:;" title="<%= name %>" class="name fl"><%= name %></a>'+
	            '<div class="fr">'+
	                '<p>登乐时间：<span><%= times %>s</span></p>'+
	                '<p>'+
	                    '<span class="zan">前进：<%= praise %>票</span>'+
	                    '<span class="cai">后退：<%= hate %>票</span>'+
	                '</p>                '+
	            '</div>'+
	            '<%= up ? \'<i class="jinji"></i>\':\'\' %>'+
	        '</dd>')
        $('.module-goldresult').height(1040);
	    $dom = $('.module-goldresult .bd');
	    //webcfg.cid='4662544348';
	    function loadResult(){
	        Loader.load(api.matchResult, {cid: webcfg.id}, function(data){
	            if(data && data.err===0){
	            	var isEnd=data.data.is_end;
	                data = data.data.playList;
	                var count = 1;
	               // var count = 1;
	                var html = [];
	                html.push('<div class="scroll-wrap" style="height:1000px">');
	                for(var i in data){
	                    html.push('<dl><dt><em></em><h4>第'+getChineseCount(count)+'轮</h4></dt>');
	                    var arrData=data[i];
	                    var tempLen=arrData.length;
	                    for(var j=0;j<tempLen;j++){
	                    	var d=arrData[j];
	                    	var showName=d.player;
	                    	/*if (strLen(showName) > 8) {
	                    		showName=limit(showName, 10, '...');
	                    	}*/
	                    	html.push(tp({
	                    	    name: showName,
	                    	    times: d.player_time,
	                    	    praise: formatVote(d.player_praise),
	                    	    hate: formatVote(d.player_hate),
	                    	    up: (d.player_up==1) ? true : false
	                    	}));
	                    }
	                    html.push('</dl>');
	                    count++;
	                }
	                if(isEnd!="1"){
	                	html.push('<dl><dd><p class="nomore">比赛结果敬请期待</p></dd></dl>');
	                	html.push('</div>');
	                	$dom.html(html.join(''));
	                	setTimeout(function(){
	                		 loadResult();
	                	},60*1000);
	                }else{
	                	html.push('</div>');
	                	$dom.html(html.join(''));
	                }
	                var $target = $dom.find('.scroll-wrap');
		            var height = $target.height();
		            var option = {
		                wheelPixel   : 5 // 单个图片宽度
		                , maxHeight  : parseInt(height,10)-20
		                , horizontal : false
		                , slideBlockSelector : 'dl'
		                , autoWrap   : true
		            };
		            $target.ppScroller(option).scroll();
	            } else {
                    $dom.html('<dl><dd><p class="nomore">比赛结果敬请期待</p></dd></dl>');
                    setTimeout(function(){
                        loadResult();
                    }, 60*1000);
                }
	        })
	    }
	    loadResult();
	})();
});