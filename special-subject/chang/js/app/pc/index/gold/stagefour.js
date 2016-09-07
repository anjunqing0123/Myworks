 define(function(require,exports) {
 	// 图片后加载
	var delayload = require('../../../../util/lazyload/delayload');
    delayload.init();
    require('../vod');
    var $ = require('jquery'),
		ps = require('../../../../util/photoslide/photoslide')
	;
	var cookie = require('../../../../util/cookie/cookie');
    var loader=require('../../../../util/loader/loader');

    //右侧锚点
    require('../../../../util/sidemao/sidemao');

    //是否为客户端
    var isClient = function(){
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    //幻灯
	ps.init($(".talkshow"), {
        perTime: 1,
        showNum: 3,
        outer: '.tkshow',
        inner: '.module-animation180x100 ul',
        autoSwitchTime:7000
    });
    //写入cookie，禁止客户端iframe刷新
    cookie.set('refreshForClient', 0, 1, 'pptv.com', '/');
    var mapId={
        '0':'haixuan',
        '1':'pk',
        '2':'concert'
    }
    var mapUrl={
        'haixuan':'http://chang.pptv.com/api/sea_history',
        'pk':'http://chang.pptv.com/api/pk_history',
        'concert':'http://chang.pptv.com/api/concert_history'
    }
    var prefix='history';
    // 写死阶段
    var curIndex=3;
    var firstChildren=$("#timeline_stage").children(":visible");
    $(".module-timeline ul li").on("click",function(){
        var obj=$(this);
        var idx=obj.index();
        if(obj.index()<curIndex){
            obj.addClass('pastactive');
            obj.siblings().removeClass('pastactive');
            //ajax 请求或者showtab
            var mapName=mapId[idx];
            var requestUrl=mapUrl[mapName];
            var targetDom=$("#"+prefix+mapName);
            if(targetDom.length==0){
                loader.ajax({
                    type:'get',
                    dataType:'html',
                    cache:true,
                    url:requestUrl,
                    success:function(data){
                        var tempObj=$(data);
                        $("#timeline_stage").append(tempObj);
                        tempObj.attr('id',prefix+mapName);
                        var tempDom= $("#"+prefix+mapName);
                        delayload.add(tempDom.find('img[data-src2]').toArray());
                        $("#timeline_stage").children().addClass('hidden');
                        tempDom.removeClass('hidden');
                        delayload.update();
                    }
                });
            }else{
                targetDom.siblings().addClass('hidden');
                targetDom.removeClass('hidden');
            }
        }else if(obj.hasClass('now')){
            obj.siblings().removeClass('pastactive');
            firstChildren.siblings().addClass('hidden');
            firstChildren.removeClass('hidden');
        }else{
            return false;
        }
    });
    //gold tab 开始,before
    var urls=require('../../../../util/linkcfg/interfaceurl');
    var uniformDate=require('../../../../util/vote/uniformDate');
    var timer=require('../../../../util/Timer/timer');
    //获取服务器时间,模块global
    var goldStageFourContainer=$(".module-pk2");
    if(goldStageFourContainer.length>0){
        var liveLink=$(".module-pk2 .pktxt a");
        var serverOffsetTime=0;
        //用于服务器时间获取失败记录的页面本地打开时间
        var pageStartTime=new Date().getTime();
        var getServerSuccess=false;
        var goldItems=null;
        var tempCdnDate=null;
        $.ajax({
            url:'http://time.pptv.com?time='+new Date().getTime(),
            type : 'GET',
            dataType : 'jsonp',
            cache: true,
            jsonp:'cb',
            success:function(data){
                serverOffsetTime=data*1000-new Date().getTime();
                getServerSuccess=true;
                init();
            },
            timeout:1000,
            error:function(){
                init();
            }
        });
    }
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
    function dispatchGoldItem(obj,scopeid,needTimer,index){
        var startTime=obj.startTime;
        var endTime=obj.endTime;
        var nowTime=getNow(tempCdnDate);
        //直播中
        if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
            updateGoldLive(obj,scopeid,needTimer,index);
        }else if(startTime.getTime()>nowTime.getTime()){
            //未开始
            updateGoldBefore(obj,scopeid,needTimer,index)
        }else if(endTime.getTime()<=nowTime.getTime()){
            //直播结束
            //updateConcertEnd(obj,scopeid,needTimer,index);
            return false;
        }
    }
    function updateGoldLive(obj,scopeid,needTimer,index){
        var tempDom=goldItems.eq(index);
        var links=tempDom.find('dt a');
        var player1=obj.player1_info;
        var player2=obj.player2_info;
        liveLink.css('display','block');
        if(!!isClient){
            links.attr('href',player1.pc_link);
            liveLink.attr('href',player1.pc_link);
        }else{
            links.attr('href',player1.web_link);
            liveLink.attr('href',player1.web_link);
            liveLink.attr('target','_blank');
        }
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.endTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==2){
                   //换链接
                   if(!!isClient){
                      var player1_url='http://chang.pptv.com/pc/player?username=' + player1.username+'&plt=clt';
                      var player2_url='http://chang.pptv.com/pc/player?username=' + player2.username+'&plt=clt';
                   }else{
                      var player1_url='http://chang.pptv.com/pc/player?username=' + player1.username;
                      var player2_url='http://chang.pptv.com/pc/player?username=' + player2.username;
                   }
                   links.eq(0).attr('href',player1_url);
                   links.eq(1).attr('href',player2_url);
                }
            }
        });
    }
    function updateGoldBefore(obj,scopeid,needTimer,index){
        var $time = $('.time');
        var $h = $('#hour'), $m = $('#mini'), $s=$('#sec');
        var countstart = getNow(tempCdnDate);
        var countend = new Date($time.find('.js-timer-data').text().replace(/-/g,'/'));
        if(countstart<countend){
            $time.removeClass('hidden');
            timer({
                startTime: countstart,
                endTime: countend,
                serverOffsetTime:serverOffsetTime,
                callback: function(status, times){
                    $h.text(times.hours);
                    $m.text(times.minitues);
                    $s.text(times.seconds);
                    if(status==2){
                        $time.addClass('hidden');
                    }
                }
            });
        }
    	timer({
    	    startTime:getNow(tempCdnDate),
    	    endTime:obj.startTime,
    	    serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
    	    callback:function(status,times){
    	        if(status==2){
    	           updateGoldLive(obj,scopeid,needTimer,index);
    	        }
    	    }
    	});
    }
    function init(){
        //不存在直接return false        
        if(goldStageFourContainer.length>0){
            var phpNowDate=uniformDate(goldStageFourContainer.attr('data-date'));
            if(!!phpNowDate){
                var tempCdnDate=uniformDate(phpNowDate);
            }else{
                var tempCdnDate=null;
            }
            var scopeid=goldStageFourContainer.attr('data-scope');
            var tempobj={};
            tempobj.__config__={cdn:true,callback:'updateGoldList'};
            tempobj['scope']=scopeid;
            tempobj.stage=4;
            var itemContainer=goldStageFourContainer.find('.pklist2');
            goldItems=itemContainer.find('li');
            loader.load(urls['interface']['goldlist'],tempobj,function(data){
                if(data.err===0){
                    var scopeData=data.data;
                    if(!scopeData){
                        return false;
                    }
                    var liveinfo=scopeData.liveinfo;
                    var start=uniformDate(liveinfo.start);
                    var end=uniformDate(liveinfo.end);
                    var data=scopeData.playerinfo;
                    if(!data){
                        return false;
                    }
                    for(var key in data){
                        var tempObj=data[key];
                        tempObj.startTime=start;
                        tempObj.endTime=end;
                        dispatchGoldItem(tempObj,scopeid,true,key);
                        break;
                    }
                }
            });
        }
    }
    var goldStageFourAfterContainer=$(".module-player-review .player-review");
    if(goldStageFourAfterContainer.length>0){
        var $ul = goldStageFourAfterContainer.find('.tabs ul');
        var $li = $ul.find('li');
        var $view = $('#'+$ul.attr('data-targetid'));
        var $vs = $view.find('.tabcon');
        $li.on('click', function(ev){
            $t = $(this);
            var tname = $t.attr('data-tabid');
            if($('#'+tname).length>0){
                $li.removeClass('now');
                $t.addClass('now');
                $vs.hide().eq($t.index()).show();
            }
        })
        // var tab=require('../../../../util/scroller/tab');
        // tab(".player-review .tabs ul",{
        //     evt:'click',
        //     activeClass:'now'
        // });
    }
 });