 define(function(require,exports) {
    var goldcommon=require('./goldcommon');
    var addKannma=require('../../../../util/vote/addKannma');
    var cookie=require('../../../../util/cookie/cookie');
    var voteMap=require('../../../../util/vote/voteupdate');
    var loader=require('../../../../util/loader/loader');
    var urls=require('../../../../util/linkcfg/interfaceurl');
    var uniformDate=require('../../../../util/vote/uniformDate');
    //投票专区
    var vote=require('../../../../util/vote/vote');
    var flipclock=require('../flipclock');
    var $=require('jquery');
    //投票配置

var globalTimeObj={};
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

    var counterDefault=60;
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
                doms[j].find('span').html(addKannma(exceptionCounter(tempObj.data.counter)));
            }
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
    function exceptionCounter(counter){
        if(typeof counter=='undefined'||counter==null){
            return 0;
        }else{
            return counter;
        }
    }
    function voteAnimate(dom,originCounter){
        var maskDom=dom.next('.mask');
        maskDom.show();
        maskDom.text(originCounter);
        counter(maskDom,originCounter,true);
    }
     //常规倒计时
    function counter(dom,count,first){
        if(first==true){
            dom.text(count);
        }
        setTimeout(function(){
            var tempCount=--count;
            dom.text(tempCount);
            if(count!=0){
                counter(dom,count,false);
            }else{
                dom.hide();
                dom.html('');
            }
        },1000);
    }
    var curStage=8;
    goldcommon.init(curStage);
    var moduleZone=$('.module-votezone');
    function bindVote(){
        new vote({
            dom:'.js-vote',
            voteAttr:'data-id',
            container:'.module-votezone',
            beforeVote:function(data,dom){
                if(dom.next('.mask').css('display')!="none"){
                    return false;
                }
            },
            afterVote:function(data,dom){
                if(typeof data.counter!='undefined'){
                    dom.html(addKannma(exceptionCounter(data.counter)));
                    var endCounter=getCounter(dom.attr('data-id'));
                    voteAnimate(dom,endCounter);
                }else if(data.errors){
                    alert('休息一会再来投票吧')
                }
            }
        });
        voteMap.init({
          selector: '.js-vote',
          voteAttr: 'data-id'
        });
    }

    function init(){
        var tempobj={};
        tempobj.__config__={cdn:true,callback:'updateGoldList'};
        //tempobj['scope']=scopeid;
        tempobj['stage']=8;
        loader.load(urls['interface']['goldlist'],tempobj,function(data){
            if(data.err==0){
                if($.isEmptyObject(data.data)){
                    return false;
                }
                var liveinfo=data['data']['liveinfo'];
                var playerinfo = data['data']['playerinfo'];
                var start=uniformDate(liveinfo.start);
                var end=uniformDate(liveinfo.end);
                globalTimeObj.startTime=start;
                globalTimeObj.endTime=end;
                var nowtime = getNow(tempCdnDate).getTime();
                if(nowtime>start.getTime() && nowtime<end.getTime()){
                    var playlink = '';
                    var $playlink = $('.module-pk .pktxt a');
                    if(isClient){
                        playlink = playerinfo['0']['pc_link'];
                    } else {
                        playlink = playerinfo['0']['web_link'];
                    }
                    $playlink.attr('href', playlink).show();
                }
            }
        });
    }

    // var freshTime=45;
    // if(moduleZone.length!=0){
    //     bindVote();
    //     voteMap.getVotes({
    //         callback:updateUI
    //     });
    //     setInterval(function(){
    //         voteMap.getVotes({
    //             callback:updateUI
    //         });
    //     },freshTime*1000);
    // }
 });