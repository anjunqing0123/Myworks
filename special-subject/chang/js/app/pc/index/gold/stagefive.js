 define(function(require,exports) {
    var $=require('jquery');
    var stage = $('#match_stage').html();
    if(stage == 'b'){
        require('./stagesix');
        return;
    } else if(stage == 'c'){
        require('./stageseven');
        return;
    } else if(stage == 'd'){
        require('./stageeight');
        return;
    }
 	var vote=require('../../../../util/vote/vote');
 	var voteMap=require('../../../../util/vote/voteupdate');
 	var cookie=require('../../../../util/cookie/cookie');
    var uniformDate=require('../../../../util/vote/uniformDate');
    var loader=require('../../../../util/loader/loader');
    var urls=require('../../../../util/linkcfg/interfaceurl');
    var _=require('underscore');
 	var $votepk=$(".module-votepk");
    var flipclock=require('../flipclock');
    var timer=require('../../../../util/Timer/timer');

    //右侧锚点
    require('../../../../util/sidemao/sidemao');
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
        '2':'concert',
        '3':'stagefour'
    }
    var mapUrl={
        'haixuan':'http://chang.pptv.com/api/sea_history',
        'pk':'http://chang.pptv.com/api/pk_history',
        'concert':'http://chang.pptv.com/api/concert_history',
        'stagefour':'http://chang.pptv.com/api/gold_history'
    }
    var prefix='history';
    // 写死阶段
    var curIndex=4;
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
 	//投票配置
 	var counterDefault=3600;
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
	//票数异常处理
	function exceptionCounter(counter){
        if(typeof counter=='undefined'||counter==null){
            return 0;
        }else{
            return counter;
        }
    }
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
     function getCountText(count){
        var minutes = Math.floor(count/60);
        var seconds = count%60;
        if(minutes<10){
            minutes = '0'+minutes;
        }
        if(seconds<10){
            seconds = '0'+seconds;
        }
        return minutes+':'+seconds;
     }
	 //常规倒计时
    function counter(dom,count,first){
    	if(first==true){
    		dom.text(getCountText(count)).attr('data-count', count);
    	}
        setTimeout(function(){
            dom.text(getCountText(--count)).attr('data-count', count);
            if(count!=0){
                counter(dom,count);
            }else{
                dom.text('投票');
                dom.removeClass('disable');
            }
        },1000);
    }
    function exceptionCounter(counter){
        if(typeof counter=='undefined'||counter==null){
            return 0;
        }else{
            return counter;
        }
    }
    var voteIsEnd = false;
    function updateUI(voteIdMap,arr){
        if(voteIsEnd){
            return;
        }
        //console.log('voteIdMap',voteIdMap);
        var newObj={};
        var ids=voteIdMap.id;
        if(ids.length!=6){
            //异常数据，不更新
            return false;
        }
        var endedAt = 0;
        for(var i=0;i<ids.length;i++){
            newObj[ids[i]]=voteIdMap[ids[i]];
            var ed = newObj[ids[i]]['data']['endedAt'];
            if(ed>endedAt){
                endedAt = ed;
            }
        }
        var dataEndTime = endedAt*1000;
        var dataNowTime = getNow(tempCdnDate).getTime();
        if(dataEndTime<dataNowTime){
            voteIsEnd = true;
        }
        var sortedArr=_.sortBy(newObj,function(obj,key){
            obj.id=key;
            return -exceptionCounter(obj.data.counter);
        });
        var tarDom=$votepk.find('.bd');
        var $ddl = tarDom.find('dl');
        for(var i=0; i<$ddl.length; i++){
            var $el = $ddl.eq(i);
            var ddid = $el.attr('data-dl-id');
            voteDomMap[ddid] = $el.clone();
        }
        tarDom.html('');
        for(var i=0;i<sortedArr.length;i++){
            var dom = voteDomMap[sortedArr[i]['id']];
            tarDom.append(dom);
            // voteDomMap[sortedArr[i]['id']] = dom.clone();
            var jsvote = dom.find('.js-vote')
            if(jsvote.hasClass('disable')){
                voteAnimate(jsvote, Number(jsvote.attr('data-count')));
            }
           dom.find('dt span').html(addKannma(exceptionCounter(sortedArr[i]['data']['counter'])))
           if(voteIsEnd){
            dom.find('dt a').remove();
            dom.find('dt').append('<a href="javascript:;" title="" class="js-vote" style="cursor: default;">- '+(i+1)+' -</a>');
            // dom.find('dt a').html('- '+(i+1)+' -').off('click.vote').css('cursor','default');
           }
        }
    }

    function initTopTimer(){
        //首页倒计时
        var timeDom=$(".js-timer-data");
        if($.trim(timeDom.html())!=""){
            var servertime=getNow(tempCdnDate);
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
                    servertime:servertime,
                    finishCallback:function(){
                        $(".module-index-top .time").addClass('hidden');
                    }
                };
                flipclock.create(timerDate, obj);
                $(".module-index-top .time").removeClass('hidden');
            }
        }
    }

    //投票10s倒计时
	function voteAnimate(dom,endCounter){
        dom.addClass('disable');
		counter(dom,endCounter,true);
	}
	//记cookie的投票逻辑
	$(".module-votepk .js-vote").each(function(){
		var obj=$(this);
		var tempCounter=getCounter(obj.attr('data-id'),true);
		if(typeof tempCounter!="undefined"&&tempCounter!=counterDefault){
			voteAnimate(obj,tempCounter);
		}
	});
    function bindVote(){
    	new vote({
    		dom:'.js-vote',
    		voteAttr:'data-id',
    		container:'.module-votepk',
    		beforeVote:function(data,dom){
                if(dom.hasClass('disable')){
                    return false;
                }
    		},
    		afterVote:function(data,dom){
    			if(typeof data.counter!='undefined'){
    				dom.prev('span').html(addKannma(exceptionCounter(data.counter)));
    				var endCounter=getCounter(dom.attr('data-id'));
    				voteAnimate(dom,endCounter);
    			}else if(data.errors){
                    alert('休息一会再来投票吧');
    			}
    		}
    	});
    	voteMap.init({
    		selector:'.js-vote',
    		voteAttr:'data-id'
    	});
    }
    var freshTime=10;
    var globalTimer=null;
    var globalTimeObj={};
    var voteDomMap={};
    var goldStageFiveAfterContainer=$(".module-18out9index-wrap .module-18out9index");
    if(goldStageFiveAfterContainer.length>0){
        //第五阶段不需要往回切换
        //取接口
        /*var tab=require('../../../../util/scroller/tab');
        tab(".module-18out9index .tabs",{
            evt:'click',
            activeClass:'now'
        });*/
    }
 	if($votepk.length>0){
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
                initTopTimer();
                init();
            },
            timeout:1000,
            error:function(){
                initTopTimer();
                init();
            }
        });
 	}
    function init(){
        //进投票逻辑，直播中
        var phpNowDate=uniformDate($votepk.attr('data-date'));
        if(!!phpNowDate){
            tempCdnDate=uniformDate(phpNowDate);
        }else{
            tempCdnDate=null;
        }
        /*var scopeid=$votepk.attr('data-scope');
        if(!scopeid){
            return false;
        }*/
        var tempobj={};
        tempobj.__config__={cdn:true,callback:'updateGoldList'};
        //tempobj['scope']=scopeid;
        tempobj['stage']=5;
        loader.load(urls['interface']['goldlist'],tempobj,function(data){
            if(data.err==0){
                if($.isEmptyObject(data.data)){
                    return false;
                }
                var liveinfo=data['data']['liveinfo'];
                var start=uniformDate(liveinfo.start);
                var end=uniformDate(liveinfo.end);
                globalTimeObj.startTime=start;
                globalTimeObj.endTime=end;
                var nowtime = getNow(tempCdnDate).getTime();
                if(nowtime>start.getTime() && nowtime<end.getTime()){
                    var playlink = '';
                    var $playlink = $('.module-pk .pktxt a');
                    if(isClient){
                        playlink = liveinfo['pc_link'];
                    } else {
                        playlink = liveinfo['web_link'];
                    }
                    $playlink.attr('href', playlink).show();
                }
            }
        });
        bindVote();
        voteMap.getVotes({
            callback:updateUI
        });
        var voteItems=$votepk.find('dl');
       // console.log(voteItems.length);
        voteItems.each(function(){
            var obj=$(this);
            var voteDom=obj.find('.js-vote');
            var voteId=voteDom.attr('data-id');
            obj.attr('data-dl-id', voteId);
          //  console.log('voteId',voteId);
            // voteDomMap[voteId]=obj.clone();
        });
        globalTimer=setInterval(function(){
            voteMap.init({
                selector:'.js-vote',
                voteAttr:'data-id'
            });
            if(getNow(tempCdnDate).getTime()>globalTimeObj.endTime.getTime()){
                 clearInterval(globalTimer);
                 globalTimer=null;
                 voteMap.getVotes({
                     callback:updateUI
                 });
            }else{
                voteMap.getVotes({
                    callback:updateUI
                });
            }
        },freshTime*1000);
    }
 });