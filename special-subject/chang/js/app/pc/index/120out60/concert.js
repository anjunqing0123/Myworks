 define(function(require,exports) {
    var $=require('jquery');
    var delayload = require('../../../../util/lazyload/delayload');
    //图片后加载初始化
    delayload.init();
    require('../../../../util/flexSlider/flexSlider')($);
    var ps = require('../../../../util/photoslide/photoslide');
    var flipclock=require('../flipclock');
    var loader=require('../../../../util/loader/loader');
    var voteMap=require('../../../../util/vote/voteupdate');
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    //明星脱口秀
    ps.init($(".talkshow"), {
        perTime: 1,
        showNum: 3,
        outer: '.tkshow',
        inner: '.module-animation180x100 ul',
        autoSwitchTime:7000
    });
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
    //右侧锚点
    require('../../../../util/sidemao/sidemao');
    var flashTime=45;
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
                doms[j].html(addKannma(exceptionCounter(tempObj.data.counter)));
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
    //时间轴tab切换
    /*var tab=require('../../../../util/scroller/tab');
    tab(".module-timeline ul",{
        evt:'click',
        activeClass:'active',
        beforeSwitch:function(idx,tab,btn){
            if(btn.hasClass('past')||btn.hasClass('now')){
                return true;
            }else{
                return false;
            }
        }
    });*/
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
    var firstChildren=null;
    var curIndex=2;
    var timeLineParent=$("#timeline_stage");
    function showHistoryTab(targetTab,btn){
        $("#timeline_stage").children().addClass('hidden');
        targetTab.removeClass('hidden');
    }
    function showtab(targetTab,btn){
        $(".tabconWrap").children().addClass('hidden');
        btn.siblings().removeClass('cur');
        btn.addClass('cur');
        targetTab.removeClass('hidden');
    }
    var scopeid=$(".module-myconcert-index").attr('data-scope');
    function calculateReward(scopeid){
        var tempObj={};
        tempObj['__config__']={cdn:true,callback:'updateRewardIndex'};
        tempObj['scope']=scopeid;
        tempObj['stage']=3;
        loader.load('http://chang.pptv.com/api/reward_index',tempObj,function(data){
            if(data.err===0){
                var countdata=data.data;
                var totalVote=0;
                var count=0;
                for(var key in countdata){
                    totalVote+=parseInt(Number(countdata[key]),10);
                    count++;
                }
                if(count!==10){
                    //异常数据
                    return false;
                }
                $('.js-vote').each(function(){
                    var obj=$(this);
                    var voteid=obj.attr('data-id');
                    if(typeof voteid!="undefined"){
                        var singleVote=countdata[voteid];
                        if(typeof singleVote!="undefined"){
                            if(totalVote==0){
                                var num=0;
                            }else{
                                var num=Math.round(Number(singleVote)/totalVote*1000)/10;
                                if(Number(singleVote)!=0&&num==0){
                                    num='0.0';
                                }
                            }
                            var tempParent=obj.parents('.pinfo');
                            if(num===0){
                                tempParent.find('.money').addClass('nomoney');
                            }else{
                                tempParent.find('.money').removeClass('nomoney');
                            }
                            if(num!=0&&num.toString().indexOf('.')==-1){
                                num+='.0';
                            }
                            var finalHtml='<p style="width:'+num+'%">'+num+'%<i class="bl"></i><i class="br"></i></p>';
                            tempParent.find('.js-vote').html(addKannma(singleVote));
                            tempParent.find('.bar').html(finalHtml);
                        }
                    }
                });
            }
        });
    }
    //头部演唱会幻灯重写
    $(".module-myconcert-index .tabs li").on('click',function(){
        var obj=$(this);
        var idx=obj.index();
        var tabid=obj.attr('data-tabid');
        var username=obj.attr('data-name');
        var targetTab=$("#"+tabid);
        if(!!isClient){
            var platform='clt';
        }else{
            var platform='pc';
        }
        if(targetTab.length==0){
            //ajax请求
            loader.ajax({
                type:'get',
                dataType:'html',
                cache:true,
                url:"http://chang.pptv.com/api/concert_person",
                data:{
                    username:username,
                    plt:platform,
                    scopeid:scopeid
                },
                success:function(data){
                    var tempObj=$(data);
                    $(".tabconWrap").append(tempObj);
                    tempObj.attr('id','concert_icon_'+idx);
                    showtab($('#concert_icon_'+idx),obj);
                }
            });
        }else{
            showtab(targetTab,obj);
        }
    });
    //头图幻灯
    $(function() {
        $(".flexslider").flexslider({
            animationLoop:true,
            directionNav:true,
            slideshowSpeed:3000,
            slideshow:true,
            startAt:0,
            after:function(obj){
                var curIdx=obj.currentSlide;
                var lis = $(".module-slider .slides li")
                var curtxt = $(lis[curIdx]).find("a").attr("title");
                $(".flex-control-pagingW p").html(curtxt);   
            },
            start:function(){
                var pageW = $("<div class='flex-control-pagingW'></div>");
                $(document.documentElement).append(pageW);
                pageW.insertBefore(".flex-direction-nav");
                pageW.append("<p></p>");
                $(".flex-control-paging").appendTo(pageW);

                function getAttr(){
                    var index = $(".flex-control-paging .flex-active").html() - 1,
                        lis = $(".module-slider .slides li"),
                        curtxt = $(lis[index]).find("a").attr("title");              
                    $(".flex-control-pagingW p").html(curtxt);
                }
                getAttr();
                
                $(".flex-direction-nav a").click(function(){
                    getAttr();         
                })
                $(".flex-control-paging a").click(function(){
                    return false;  
                })               
            }
        });
    });
    //PK赛开始
    var urls=require('../../../../util/linkcfg/interfaceurl');
    var _=require('underscore');
    var uniformDate=require('../../../../util/vote/uniformDate');
    var browser=require('../../../../util/browser/browser');
    var formatDate=require('../../../../util/date/format');
    var formatVote=require('../../../../util/vote/formatVote');
    //放省略号
    var limit=require('../../personspace/limit');
    var timer=require('../../../../util/Timer/timer');
    function uuid(){
        var count=0;
        return function(prefix){
            return prefix+'_'+count++;
        }
    }
    var timerUID=uuid();
    //获取服务器时间,模块global
    var serverOffsetTime=0;
    //用于服务器时间获取失败记录的页面本地打开时间
    var pageStartTime=new Date().getTime();
    var getServerSuccess=false;
    $.ajax({
        url:'http://time.pptv.com',
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
    //暂时作为阶段判定
    var concertContainer=$(".module-pic-layout2");
    var phpNowDate=uniformDate(concertContainer.attr('data-date'));
    if(!!phpNowDate){
        var tempCdnDate=uniformDate(phpNowDate);
    }else{
        var tempCdnDate=null;
    }
    var concertItems;
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
        //jstimer可能存在2个，取页面顶部的倒计时
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
    //获取字符串长度
    function strLen(str){
        if (!str) {
            return 0;
        }
        var aMatch = str.match(/[^\x00-\xff]/g);
        return (str.length + (!aMatch ? 0 : aMatch.length));
    };
    //演唱会js开始
    var globalInProgress=null;
    function updateConcertLive(obj,scopeid,needTimer,index){
        var targetDom=concertItems.eq(index);
        targetDom.addClass('now');
        var targetP=targetDom.find('p');
        targetP.html('<a>观看直播</a>');
        var userlinkDom=targetDom.children('a');
        var targetA=targetP.find('a');
        if(!!isClient){
            targetA.attr('href',obj.pc_link);
            userlinkDom.each(function(){
                var tempObj=$(this);
                tempObj.attr('spaceurl',tempObj.attr('href'));
                tempObj.attr('href',obj.pc_link);
            });
            userlinkDom.removeAttr('target');
            targetA.removeAttr('target');
        }else{
            targetA.attr('href',obj.web_link);
            targetA.attr('target','_blank');
            userlinkDom.each(function(){
                var tempObj=$(this);
                tempObj.attr('spaceurl',tempObj.attr('href'));
                tempObj.attr('href',obj.web_link);
                tempObj.attr('target','_blank');
            });
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
                        targetDom.find('p').html('直播已结束');
                        targetDom.removeClass('now');
                        userlinkDom.each(function(){
                            var tempObj=$(this);
                            tempObj.attr('href',tempObj.attr('spaceurl'));
                        });
                    }
                }
            });
        }
    }
    function updateConcertBefore(obj,scopeid,needTimer,index){
        var targetDom=concertItems.eq(index);
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
                        updateConcertLive(obj,scopeid,needTimer,index);
                    }else{
                       //targetDom.find('p').html(times.hours+":"+times.minitues+":"+times.seconds);
                    }
                }
            });
        }
    }
    function updateConcertEnd(obj,scopeid,needTimer,index){
        var targetDom=concertItems.eq(index);
        targetDom.find('p').html('直播已结束');
    }
    function dispatchConcertItem(obj,scopeid,needTimer,index){
        var startTime=obj.startTime=uniformDate(obj.start);
        var endTime=obj.endTime=uniformDate(obj.end);
        var nowTime=getNow(tempCdnDate);
        //var startTime=obj.startTime=new Date(new Date().getTime()+10*1000);
        //var endTime=obj.endTime=new Date(new Date().getTime()+20*1000);
        //直播中
        if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
            updateConcertLive(obj,scopeid,needTimer,index);
        }else if(startTime.getTime()>nowTime.getTime()){
            //未开始
            updateConcertBefore(obj,scopeid,needTimer,index)
        }else if(endTime.getTime()<=nowTime.getTime()){
            //演唱会结束
            updateConcertEnd(obj,scopeid,needTimer,index);
        }
    }
    function updateConcertResult(obj){
        var scopeData=obj['data'];
        var scopeId=obj['id'];
        for(var key in scopeData){
            dispatchConcertItem(scopeData[key],scopeId,true,key);
        }
    }
    //演唱会js结束
    // time 等待 1s 初始化
    function updateBottom(data){
        var concertData=data.data.lists;
        var scopeId=firstChildren.find('.plist').attr('data-scope');
        concertItems=firstChildren.find('.plist li');
        if(scopeId=="0"||!scopeid){
            return false;
        }
        if(concertData==null){
            return false;
        }
        if(!concertData[scopeId]){
            return false;
        }
        var result={
            data:concertData[scopeId],
            id:scopeId
        }
        updateConcertResult(result);
    }
    function updateConcertTopBefore(obj,scopeid){
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.startTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==2){
                    updateConcertTopLive(obj,scopeid);
                }else{
                   //targetDom.find('p').html(times.hours+":"+times.minitues+":"+times.seconds);
                }
            }
        });
    }
    function updateConcertTopLive(obj,scopeid){
        calculateReward(scopeid);
        globalInProgress=setInterval(function(){
            calculateReward(scopeid);
        },1000*flashTime);
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.endTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==2){
                    if(globalInProgress!=null){
                        setTimeout(function(){
                            clearInterval(globalInProgress);
                        },1000*50*3);
                    }
                }else{
                   //targetDom.find('p').html(times.hours+":"+times.minitues+":"+times.seconds);
                }
            }
        });
    }
    function updateTop(data){
        var concertData=data.data.lists;
        var scopeId=$(".module-myconcert-index").attr('data-scope');
        if(scopeId=="0"||!scopeid){
            return false;
        }
        if(concertData==null){
            return false;
        }
        if(!concertData[scopeId]){
            return false;
        }
        var matchItem=concertData[scopeId]['0'];
        var startTime=matchItem.startTime=uniformDate(matchItem.start);
        var endTime=matchItem.endTime=uniformDate(matchItem.end);
        var nowTime=getNow(tempCdnDate);
        //var startTime=matchItem.startTime=new Date(new Date().getTime()+10*1000);
       // var endTime=matchItem.endTime=new Date(new Date().getTime()+20*1000);
         //直播中
        if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
            updateConcertTopLive(matchItem,scopeId);
        }else if(startTime.getTime()>nowTime.getTime()){
            //未开始
            updateConcertTopBefore(matchItem,scopeId);
        }else if(endTime.getTime()<=nowTime.getTime()){
            //演唱会结束
            return false;
        }
    }
    function init(){
        //不存在直接return false
        var topContainer=$(".module-myconcert-index");
        var earlyCount=0;
        var endCount=0;
        var endObj=null;
        var earlyTime=null;
        var earlyObj=null;
        var endTime=null;
        if(concertContainer.length==0&&topContainer.length==0){
            return false;
        }
        var timeLineObj=timeLineParent.children();
        for(var k=0;k<timeLineObj.length;k++){
            var tempObj=timeLineObj.eq(k);
            var tempStart=new Date(tempObj.attr('data-start')*1000);
            var tempEnd=new Date(tempObj.attr('data-end')*1000);
            var now=getNow(tempCdnDate);
            if(now.getTime()>=tempStart.getTime()&&now.getTime()<tempEnd.getTime()){
                //直播中
                firstChildren=tempObj;
                break;
            }else if(tempStart.getTime()>now.getTime()){
                //未开始
                if(earlyObj==null){
                    earlyObj=tempObj;
                    earlyTime=tempStart;
                }else if(earlyTime.getTime()>tempStart.getTime()){
                    earlyObj=tempObj;
                    earlyTime=tempStart;
                }
                earlyCount++;
            }else if(now.getTime()>=tempEnd.getTime()){
                //已经结束
                //未开始
                if(endObj==null){
                    endObj=tempObj;
                    endTime=tempEnd;
                }else if(endTime.getTime()<tempEnd.getTime()){
                    endObj=tempObj;
                    endTime=tempEnd;
                }
                endCount++;
            }
        }
        if(firstChildren==null){
            //没找到直播的
            if(earlyCount==1&&endCount==1){
                firstChildren=earlyObj;
            }else if(earlyCount==2){
                firstChildren=earlyObj;
            }else{
                firstChildren=endObj;
            }
        }
        timeLineObj.css('display','none');
        firstChildren.css('display','block');
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
        loader.load(urls['interface']['concertAll'],{__config__:{cdn:true,callback:'updateConcertList'}},function(data){
            //var data=require('../../../phone/index/testconcert');
            if(data.err==0){
                if(concertContainer.length!=0){
                    updateBottom(data);
                }
                if(topContainer.length!=0){
                    updateTop(data);
                }
            }
        });
    }
});