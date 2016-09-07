 define(function(require,exports) {
    var $=require('jquery');
    var uniformDate=require('../../../util/vote/uniformDate');
    var flipclock=require('../index/flipclock');
    var afterContainer=$(".wp-grid .module-pic-layout3");
    //获取服务器时间,模块global
    var serverOffsetTime=0;
    var getServerSuccess=false;
    var pageStartTime=new Date().getTime();
    if(afterContainer.length>0){
        //已经结束
        var phpNowDate=afterContainer.attr('data-date');
        if(!!phpNowDate){
            var tempCdnDate=uniformDate(phpNowDate);
        }else{
            var tempCdnDate=null;
        }
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
            },
            timeout:1000,
            error:function(){
                initTopTimer();
            }
        });
        return false;
    }
 	var goldfourContainer=$(".module-gold-tag");
    var globalParent=goldfourContainer.parent();
    var phpNowDate=goldfourContainer.attr('data-date');
    var getUrlArgObject=require('../../../util/others/getquery');
    var loader=require('../../../util/loader/loader');
    var urls=require('../../../util/linkcfg/interfaceurl');
    var timer=require('../../../util/Timer/timer');
    var _=require('underscore');
    var urlObj=getUrlArgObject();
    var goldItems=goldfourContainer.find('li');
    var phpNowDate=uniformDate(goldfourContainer.attr('data-date'));
    if(!!phpNowDate){
        var tempCdnDate=uniformDate(phpNowDate);
    }else{
        var tempCdnDate=null;
    }
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    var currentStage=4;
    var isUpdateEnd=false;
    $.ajax({
        url:'http://time.pptv.com?time='+new Date().getTime(),
        type : 'GET',
        dataType : 'jsonp',
        cache: true,
        jsonp:'cb',
        success:function(data){
            serverOffsetTime=data*1000-new Date().getTime();
            getServerSuccess=true;
            initGold();
            initTopTimer();
        },
        timeout:1000,
        error:function(){
            initGold();
            initTopTimer();
        }
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
    function requestEnd(isFirst){
        var scopeid=urlObj['scope'];
        var tempobj={};
        tempobj['stage']=currentStage;
        tempobj['scope']=scopeid;
        loader.load(urls['interface']['goldlist'],tempobj,function(data){
            var liveinfo=data.liveinfo;
            var start=uniformDate(liveinfo.start);
            var end=uniformDate(liveinfo.end);
            var data=data.playerinfo;
            var isEnd=false;
            for(var key in data){
                if(data[key][g_stage]==currentStage){
                    isEnd=true;
                }
            }
            if(isEnd==false){
                setTimeout(function(){
                    if(!!isFirst){
                        updateDomGoldEnd(data,false);
                    }
                    requestEnd();
                },5*60*1000);
            }else if(isEnd===true){
                updateDomGoldEnd(data,true);
            }
        });
    }
    function updateGoldEnd(force){
        if(force===true||isUpdateEnd===false){
            requestEnd(isUpdateEnd);
        }
        isUpdateEnd=true;
    }
    var template_item='<li>'              
                    +'<div class="pic">'
                       + '<a href="<%= playurl%>" title="<%= showName %>" <%if(isClient==false){%>target="_blank"<%}%>></a>'
                      +  '<img src="<%= avatar%>" alt="<%= showName %>">'
                   + '</div>'
                   + '<h3><a href="<%= playurl%>" title="<%= avatar%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a></h3>'
                   '<% if(isExpand == true) { %>' 
                   + '<p>时长：<%= times%></p>'
                   + ' <% } %>'
                   +'<% if(isEnd == true&&isOut==true) { %>' 
                   + '<i class="icon1"></i>' 
                   + ' <% } %>'
                   +'<% if(isExpand == true) { %>' 
                    +'<p class="cf"><span class="up"><%= upVal%></span><em>|</em><span class="down"><%= downVal%></span></p>'
                    + ' <% } %>'
                +'</li>';
    var tempFunc=_.template(template_item);
    var prefix='<div class="module-pic-layout3"><div class="hd"><h3><i></i><span>10强</span>选手</h3></div><ul class="cf">';
    var suffix='</ul></div>';
    function buildItemHtml(data,isEnd,extraInfo){
        var tempObj1=data;
        if(!!isClient){
            tempobj1.isClient=true;
        }else{
            tempobj1.isClient=false;
        }
        if(tempobj1.is_group=="1"){
            tempobj1.showName=tempobj1.group_name;
        }else{
            tempobj1.showName=tempobj1.real_name;
        }
        if(tempobj1.g_status=="2"&&g_stage==currentStage){
            tempobj1.isOut=true;
        }
        tempobj1.isEnd=isEnd===true ? true : false;
        if(!!extraInfo&&!$.isEmptyObject(extraInfo)){
            var tempName=tempObj1.username;
            var tempInfo=extraInfo[tempName];
            if(typeof tempInfo!='undefined'){
                tempobj1.isExpand=true;
                tempobj1.times='登乐时间'+(parseInt(tempInfo['mins'],10)*60)+'s';
                tempobj1.upVal='前进:'+tempInfo['up_votes'];
                tempobj1.downVal='后退:'+tempInfo['down_votes'];
            }
        }
        return tempFunc(tempobj1);
    }
    function buildNormal(data,isEnd){
        var tempHtml='';
        tempHtml+=prefix;
        var playData=data.playerinfo;
        for(var key in playData){
            tempHtml+=buildItemHtml(playData[key]['player1_info'],isEnd);
            tempHtml+=buildItemHtml(playData[key]['player2_info'],isEnd);
        }
        tempHtml+=suffix;
        globalParent.html(tempHtml);    
    }
    function updateDomGoldEnd(data,isEnd){
        if(isEnd===true){
            var tempobj={};
            tempobj.__config__={cdn:true,callback:'getextraList'};
            tempobj.timeout=1000;
            loader.load(urls['goldExtra'],tempobj,function(data){
                if(data.err===0){
                    var extraInfo=data.data;
                    var tempHtml='';
                    tempHtml+=prefix;
                    var playData=data.playerinfo;
                    for(var key in playData){
                        tempHtml+=buildItemHtml(playData[key]['player1_info'],isEnd,extraInfo);
                        tempHtml+=buildItemHtml(playData[key]['player2_info'],isEnd,extraInfo);
                    }
                    tempHtml+=suffix;
                    globalParent.html(tempHtml);    
                }
            },function(){
                buildNormal(data,isEnd);
            });
        }else{
            buildNormal(data,isEnd);
        }
    }
    function initTopTimer(){
        //首页倒计时
        var timeDom=$(".js-timer-data").eq(0);
        if($.trim(timeDom.html())!=""){
            var servertime=getNow(tempCdnDate);
            //建立time对象如果不是合法的timer对象，跳出
            var timerDate=$.trim(timeDom.html()).replace(/-/g,'/');
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
            updateGoldEnd();
            //return false;
        }
    }
    function updateGoldLive(obj,scopeid,needTimer,index){
        var tempDom=goldItems.eq(index);
        if(!!isClient){
            tempDom.find('pic a').attr('href',obj.pc_link);
        }else{
            tempDom.find('pic a').attr('href',obj.web_link);
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
                   //请求接口换dom
                   updateGoldEnd();
                }
            }
        });
        tempDom.find('a').attr('href',tempDom.attr('next-url'));
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
    function initGold(){
    	var tempobj={};
    	tempobj.__config__={cdn:true,callback:'updateGoldList'};
    	var scopeid=tempobj.scopeid=urlObj['scope'];
    	tempobj.stage=currentStage;
        tempobj['scope']=scopeid;
    	loader.load(urls['interface']['goldlist'],tempobj,function(data){
            if(data.err===0){
                var data=data.data;
                var liveinfo=data.liveinfo;
                var start=uniformDate(liveinfo.start);
                var end=uniformDate(liveinfo.end);
                var data=data.playerinfo;
                var isEnd=false;
                for(var key in data){
                    if(data[key]['g_stage']==currentStage){
                        isEnd=true;
                    }
                    break;
                }
                if(isEnd===false){
                    for(var key in data){
                        var tempObj=data[key];
                        tempObj.startTime=start;
                        tempObj.endTime=end;
                        dispatchGoldItem(tempObj,scopeid,true,key);
                        break;
                    }
                }else{
                    updateGoldEnd(true);
                }
            }
    	});
    }
 });