 define(function(require,exports) {
    var $=require('jquery');
    var loader=require('../../../util/loader/loader');
    var urls=require('../../../util/linkcfg/interfaceurl');
    var formatDate=require('../../../util/date/format');
    var timer=require('../../../util/Timer/timer');
    var vote=require('../../../util/vote/vote');
    var voteupdate=require('../../../util/vote/voteupdate');
    var uniformDate=require('../../../util/vote/uniformDate');
    var formatVote=require('../../../util/vote/formatVote');
    var voteMap=require('../../../util/vote/voteupdate');
    var flipclock=require('../index/flipclock');
    var cookie=require('../../../util/cookie/cookie');
    var $pkContainer=$(".module-vote-layout");
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    var getServerSuccess=false;
    var timerInterval=null;
    var cdnDate;
    cdnDate=$pkContainer.attr('data-date');
    if(!!cdnDate){
        var tempCdnDate=uniformDate(cdnDate);
    }else{
        var tempCdnDate=null;
    }
   //获取服务器时间,模块global
    var serverOffsetTime=0;
    //用于服务器时间获取失败记录的页面本地打开时间
    var pageStartTime=new Date().getTime();
    //获取url参数对象
    var getUrlArgObject=require('../../../util/others/getquery');
    var urlObj=getUrlArgObject();
    //所有的pk item
    var pkItems=$pkContainer.find('li');
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
            initTopTimer();
        },
        timeout:1000,
        error:function(){
            init();
            initTopTimer();
        }
    });
    //投票配置
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
    //头部倒计时
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
    //获取下一天的中午的date
    function getEndVoteTime(endDate,targetTime){
        var dayMap={
            '1':'31',
            '2':'28',
            '3':'31',
            '4':'30',
            '5':'31',
            '6':'30',
            '7':'31',
            '8':'31',
            '9':'30',
            '10':'31',
            '11':'30',
            '12':'31'
        };
        var targetDay=null;
        var targetTime=targetTime ? targetTime : '12:00:00'
        var mon=endDate.getMonth()+1;
        var day=endDate.getDate();
        var year=endDate.getFullYear();
        var nextOffset=1;
        var finalStr=null;
        if(day<=29){
            if((day==28&&mon==2&&!(year%4==0&&year%100!=0||year%400==0))||day==29&&mon==2){
                finalStr=year+'/'+3+'/'+1+' '+targetTime;
            }else{
                finalStr=year+'/'+mon+'/'+(1+day)+' '+targetTime;
            }
        }else{
            var getMonDay=dayMap[mon];
            if(day+1>getMonDay){
                if(mon==12){
                    finalStr=(1+year)+'/'+1+'/'+1+' '+targetTime;
                }else{
                    finalStr=year+'/'+(1+mon)+'/'+1+' '+targetTime;
                }
            }else{
                finalStr=year+'/'+mon+'/'+(1+day)+' '+targetTime;
            }
        }
        targetDay=new Date(finalStr);
        return targetDay;
    }
    function dispatchItem(obj,scopeid,needTimer,index){
        var startTime=obj.startTime=uniformDate(obj.start);
        var endTime=obj.endTime=uniformDate(obj.end);
        var voteEndTime=obj.voteEndTime=obj.player_1.vote_end ? new Date(obj.player_1.vote_end*1000+parseInt(Math.random()*3000)) : getEndVoteTime(endTime);
        //console.log('voteEndTime',voteEndTime);
        var nowTime=getNow(tempCdnDate);
        //直播中
        if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
            updatePKLive(obj,scopeid,needTimer,index);
        }else if(startTime.getTime()>nowTime.getTime()){
            //未开始
            if(!!needTimer){
                updateBefore(obj,scopeid,needTimer,index);
            }
        }else if(endTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<voteEndTime.getTime()){
            //pk结束
            updatePKEnd(obj,scopeid,needTimer,index);
        }else{
            //投票结束
            updatePKVoteEnd(obj,scopeid,needTimer,index);
        }
    }
    function updateBefore(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        var player1=obj.player_1;
        var player2=obj.player_2;
        var player1Dom=targetDom.find(".vote-fl");
        var player2Dom=targetDom.find(".vote-fr");
        var avatar1Dom=player1Dom.children('.vote-user');
        var avatar2Dom=player2Dom.children('.vote-user');
        targetDom.find(".vote-wrap").removeAttr('href');
        if(!!needTimer){
            timer({
                startTime:getNow(tempCdnDate),
                endTime:obj.startTime,
                serverOffsetTime:serverOffsetTime,
                pageStartTime:pageStartTime,
                cdnDate:tempCdnDate,
                getServerSuccess:getServerSuccess,
                callback:function(status,times){
                    if(status==2){
                        if(!!isClient){
                            avatar1Dom.attr('href',obj.pc_link);
                            avatar2Dom.attr('href',obj.pc_link);
                        }else{
                            avatar1Dom.attr('href',obj.web_link);
                            avatar2Dom.attr('href',obj.web_link);
                        }
                        targetDom.find('h5').html('正在直播');
                        targetDom.addClass('vote-start');
                        var voteDom_1=player1Dom.find('.vote-wrap');
                        voteDom_1.attr('data-id',player1.vote_id);
                        voteDom_1.addClass('js-vote');
                        voteDom_1.attr('href','javascript:void(0);')
                        var voteDom_2=player2Dom.find('.vote-wrap');
                        voteDom_2.attr('data-id',player2.vote_id);
                        voteDom_2.addClass('js-vote');
                        voteDom_2.attr('href','javascript:void(0);');
                        voteMap.add(player1.vote_id,voteDom_1);
                        voteMap.add(player2.vote_id,voteDom_2);
                        voteDom_1.find(".vote-txt").html(formatVote(player1.counter)+'票');
                        voteDom_2.find(".vote-txt").html(formatVote(player2.counter)+'票');
                        timer({
                            startTime:getNow(tempCdnDate),
                            endTime:obj.endTime,
                            serverOffsetTime:serverOffsetTime,
                            pageStartTime:pageStartTime,
                            cdnDate:tempCdnDate,
                            getServerSuccess:getServerSuccess,
                            callback:function(status,times){
                                if(status==2){
                                    var player1_url='http://chang.pptv.com/pc/player?username=' + player1.username;
                                    var player2_url='http://chang.pptv.com/pc/player?username=' + player2.username;
                                    avatar1Dom.attr('href',player1_url);
                                    avatar2Dom.attr('href',player2_url);
                                    targetDom.addClass('vote-gray');
                                    targetDom.find('h5').html('PK结束');
                                }
                            }
                        });
                    }else{
                        //targetDom.find('h5').html(times.hours+":"+times.minitues+":"+times.seconds);
                    }
                }
            });
        }
    }
    function updatePKLive(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        targetDom.addClass('vote-start');
        var player1=obj.player_1;
        var player2=obj.player_2;
        var player1Dom=targetDom.find(".vote-fl");
        var player2Dom=targetDom.find(".vote-fr");
        var voteDom_1=player1Dom.find('.vote-wrap');
        voteDom_1.attr('data-id',player1.vote_id);
        voteDom_1.addClass('js-vote');
        voteDom_1.find(".vote-txt").html(formatVote(player1.counter)+'票');
        var voteDom_2=player2Dom.find('.vote-wrap');
        voteDom_2.attr('data-id',player2.vote_id);
        voteDom_2.addClass('js-vote');
        voteDom_2.find(".vote-txt").html(formatVote(player2.counter)+'票');
        targetDom.find('h5').html('正在直播');
        var avatar1Dom=player1Dom.children('.vote-user');
        var avatar2Dom=player2Dom.children('.vote-user');
        if(!!isClient){
            avatar1Dom.attr('href',obj.pc_link);
            avatar2Dom.attr('href',obj.pc_link);
        }else{
            avatar1Dom.attr('href',obj.web_link);
            avatar2Dom.attr('href',obj.web_link);
        }
        if(!!needTimer){
            timer({
                startTime:getNow(tempCdnDate),
                endTime:obj.endTime,
                serverOffsetTime:serverOffsetTime,
                pageStartTime:pageStartTime,
                cdnDate:tempCdnDate,
                getServerSuccess:getServerSuccess,
                callback:function(status,times){
                    
                    if(status==2){
                        var player1_url='http://chang.pptv.com/pc/player?username=' + player1.username;
                        var player2_url='http://chang.pptv.com/pc/player?username=' + player2.username;
                        avatar1Dom.attr('href',player1_url);
                        avatar2Dom.attr('href',player2_url);
                        targetDom.addClass('vote-gray');
                        targetDom.find('h5').html('PK结束');
                        targetDom.addClass('vote-start');
                    }
                }
            });
        }
    }
    function updatePKEnd(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        var player1=obj.player_1;
        var player2=obj.player_2;
        var player1Dom=targetDom.find(".vote-fl");
        var player2Dom=targetDom.find(".vote-fr");
        var voteDom_1=player1Dom.find('.vote-wrap');
        voteDom_1.attr('data-id',player1.vote_id);
        voteDom_1.addClass('js-vote');
        var voteDom_2=player2Dom.find('.vote-wrap');
        voteDom_2.attr('data-id',player2.vote_id);
        voteDom_2.addClass('js-vote');
        targetDom.find('h5').html('PK 结束');
        targetDom.addClass('vote-gray vote-start');
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.voteEndTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==2){
                    targetDom.find('.vote-tips').addClass('show').html('投票结束');
                    targetDom.find('em.replace').css('display','none');
                    targetDom.find('em.num').css('display','none');
                    voteDom_1.removeClass('js-vote');
                    voteDom_1.off('click');
                    voteDom_2.removeClass('js-vote');
                    voteDom_2.off('click');
                    targetDom.removeClass('vote-start');
                    loader.load('http://chang.pptv.com/api/pk_result',{username:obj.player_1.username},function(data){
                        //需要确认数据结构
                        if(data.err==0){
                            var data=data.data;
                            if(data.status==-1){
                                //依旧是异常数据
                                return false;
                            }
                            if(data.iswin==="1"||data.iswin==="0"){
                                var player1=data.playerinfo;
                                var player2=data.pkinfo;
                                if(data.iswin==="1"){
                                    targetDom.find('.vote-fl').children('p').before('<span class="vote-win"></span>');
                                }else if(data.iswin==="0"){
                                    targetDom.find('.vote-fr').children('p').before('<span class="vote-win"></span>');
                                }
                            }else{
                                //异常处理，不再次请求，避免重复请求
                                return false;
                            }
                        }
                    });
                }
            }
        });
    }
    function updatePKVoteEnd(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        targetDom.find('em.replace').css('display','none');
        targetDom.find('em.num').css('display','none');
        targetDom.addClass('vote-gray');
        targetDom.removeClass('vote-start');
        targetDom.find('.vote-tips').addClass('show').html('投票结束');
        targetDom.find(".vote-wrap").removeAttr('href');
        var player1=obj.player_1;
        var player2=obj.player_2;
        var player1Dom=targetDom.find(".vote-fl");
        var player2Dom=targetDom.find(".vote-fr");
        var voteDom_1=player1Dom.find('.vote-wrap');
        var voteDom_2=player2Dom.find('.vote-wrap');
        voteDom_1.removeClass('js-vote');
        voteDom_2.removeClass('js-vote');
        voteDom_1.find(".vote-txt").html(formatVote(player1.counter)+'票');
        voteDom_2.find(".vote-txt").html(formatVote(player2.counter)+'票');
    }
     //常规倒计时
    function counter(dom,count){
        setTimeout(function(){
            dom.text(--count);
            if(count!=0){
                counter(dom,count);
            }else{
                dom.hide();
                dom.html('');
            }
        },1000);
    }
    //票数更新
    function updateUI(voteIdMap,arr){
        for(var i=0;i<arr.length;i++){
            var tempObj=voteIdMap[arr[i]];
            var doms=tempObj['doms'];
            var len=doms.length;
            if(!tempObj.data){
                continue;
            }
            for(var j=0;j<len;j++){
                doms[j].find('.vote-txt').html(formatVote(tempObj.data.counter)+'票');
            }
        }
    }
    // 投票动画模块
    function voteAnimate(domParent,originCounter,targetTop){
       // var relDom=domParent.siblings(selector);
        //var maskRel=relDom.find('.vote-mask');
        var maskDom=domParent.find('.vote-mask');
        var addDom=domParent.find('.vote-add');
        var originTop=addDom.css('top');
        var targetTop=targetTop||-50;
        maskDom.show();
        maskDom.text(originCounter);
        counter(maskDom,originCounter);
        //maskRel.show();
        //maskRel.text(10);
        //counter(maskRel,10);
        if(originCounter==counterDefault){
            addDom.css('display','block').animate({
                top:targetTop,
                opacity:1
            },1000,function(){
                addDom.fadeOut();
                setTimeout(function(){
                    addDom.fadeOut(function(){
                        addDom.css({
                          top:originTop
                        }); 
                    });
                },1000);
            });
        }
    }
    // 绑定投票事件
    function bindVote(){
        new vote({
            dom:'.js-vote',
            voteAttr:'data-id',
            container:'.module-vote-layout',
            beforeVote:function(data,dom){
                if(dom.find('.vote-mask').css("display")=='block'){
                    return false;
                }else{
                    return true;
                }
            },
            afterVote:function(data,dom){
                if(typeof data.counter!='undefined'){
                    dom.find('.vote-txt').text(formatVote(data.counter)+'票');
                    var voteid=dom.attr('data-id');
                    var endCounter=getCounter(voteid);
                    voteAnimate(dom.parents('.vote-h80'),endCounter,-50);
                }else if(data.errors){
                    if(data.errors.code==88){
                        alert("请休息一会儿再投票哦！");
                    }else if(data.errors.code==91){
                        alert('投票未开始');
                    }else if(data.errors.code==92){
                        alert('投票已结束');
                    }
                    //console.log(data.errors);
                }
            }
        });
        voteMap.init({
            selector:'.js-vote',
            voteAttr:'data-id'
        });
        voteMap.getVotes({
            callback:updateUI
        });
        timerInterval=setInterval(function(){
            voteMap.getVotes({
                callback:updateUI
            });
        },freshTime*1000);
    }
    function initMask(){
        $(".js-vote").each(function(){
            var obj=$(this);
            var voteid=obj.attr('data-id');
            if(typeof voteid!="undefined"){
                var endCounter=getCounter(voteid,true);
                if(endCounter!=counterDefault){
                    voteAnimate(obj.parent(),endCounter);
                }     
            }
        });
    }
    //投票更新
    var freshTime=45;
    function init(){
        loader.load(urls['interface']['pklistAll'],{__config__:{cdn:true,callback:'updatePKList'}},function(data){
            //var data=require('../../phone/index/testpk');
            if(data.err==0){
                var pkdata=data.data;
                if(!pkdata){
                    return false;
                }
                var scopeData=pkdata[urlObj['scope']];
                if(!scopeData){
                    return false;
                }
                //var count=0;
                //var tempObj=scopeData['0'];
                var needTimer=true;
                for(var key in scopeData){
                    dispatchItem(scopeData[key],urlObj['scope'],needTimer,key);
                    //count++;
                }
                bindVote();
                //开启cookie模式
                initMask();
            }
        });
    }
 });