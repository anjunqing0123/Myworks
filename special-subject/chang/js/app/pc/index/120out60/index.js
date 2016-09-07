 define(function(require,exports) {
    var $=require('jquery');
    require('../../../../util/flexSlider/flexSlider')($);
    //图片后加载
    var delayload = require('../../../../util/lazyload/delayload');
    delayload.init();
    //图片切换
    var ps = require('../../../../util/photoslide/photoslide');
    //明星脱口秀
    ps.init($(".talkshow"), {
        perTime: 1,
        showNum: 3,
        outer: '.tkshow',
        inner: '.module-animation180x100 ul',
        autoSwitchTime:7000
    });
    //顶部倒计时
    var flipclock=require('../flipclock');
    //是否为客户端
    var isClient = function(){
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
     //右侧锚点
    require('../../../../util/sidemao/sidemao');
    //时间轴tab切换，ajax异步请求
    //演唱会 头部tab切换
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
    var firstChildren=$("#timeline_stage").children(":visible");
    $(".module-timeline ul li").on("click",function(){
        var obj=$(this);
        var idx=obj.index();
        if(obj.hasClass('past')){
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
            firstChildren.siblings().addClass('hidden');
            firstChildren.removeClass('hidden');
        }else{
            return false;
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
    //var pkdata=require('./testallend');
    var loader=require('../../../../util/loader/loader');
    var urls=require('../../../../util/linkcfg/interfaceurl');
    var uniformDate=require('../../../../util/vote/uniformDate');
    var browser=require('../../../../util/browser/browser');
    var formatDate=require('../../../../util/date/format');
    var formatVote=require('../../../../util/vote/formatVote');
    //放省略号
    var limit=require('../../personspace/limit');
    var timer=require('../../../../util/Timer/timer');
    var pk_id_prefix='pk_timer';
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
    //pk赛
    var pkContainer=$(".module-pk .pklist");
    var phpNowDate=pkContainer.attr('data-date');
    if(!!phpNowDate){
        var tempCdnDate=uniformDate(phpNowDate);
    }else{
        var tempCdnDate=null;
    }
    var pkItems=pkContainer.find("li");
    var linkLive=$(".module-pk .pktxt a");
    //存放需要倒计时的对象
    var timerArr=[];
    var timerFirst=false;
    var timerEnd=false;
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
    //头部倒计时初始化
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
    //更新数据通用入口
    function updateResult(obj){
        var scopeData=obj['data'];
        var scopeId=obj['id'];
        //var count=0;
        for(var key in scopeData){
            //更新数据可以直接使用key值 0-9
            dispatchItem(scopeData[key],scopeId,true,key);
            //count++;
        }
        var regChinese=/^[\u0391-\uFFE5]+$/;
        var regEndlish=/^[A-Za-z]([A-Za-z]|\s)+[A-Za-z]$/;
        $(".pklist .vs a").each(function(){
            var obj=$(this);
            var tempTxt=$.trim(obj.html());
            var tempLen=strLen(tempTxt);
            if(tempLen==10){
                if(regChinese.test(tempTxt)==true&&regEndlish.test(tempTxt)==false){
                     obj.html(tempTxt.substr(0,4)+'...');
                }else{
                    obj.html(limit(tempTxt,10,'...'));
                }
            }else{
                obj.html(limit(tempTxt,10,'...'));
            }
        });
    }
    //获取字符串长度
    function strLen(str){
        if (!str) {
            return 0;
        }
        var aMatch = str.match(/[^\x00-\xff]/g);
        return (str.length + (!aMatch ? 0 : aMatch.length));
    };
    //更新未开始
    function updateBefore(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
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
                       updatePKLive(obj,scopeid,needTimer,index);
                    }else{
                       //暂时去除倒计时逻辑
                       //targetDom.find('.tip').html(times.hours+":"+times.minitues+":"+times.seconds);
                    }
                }
            });
        }
    }
    //更新pk中
    function updatePKLive(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        var needRemove=false;
        targetDom.addClass('pking');
        targetDom.find('.tip').html('正在直播');
        linkLive.css("display","block");
        var playerDom2=targetDom.find('.p2');
        var playerDom1=targetDom.find('.p1');
        playerDom1.attr({'spaceurl':playerDom1.attr('href'),'originTitle':playerDom1.attr('title')});
        playerDom2.attr({'spaceurl':playerDom2.attr('href'),'originTitle':playerDom2.attr('title')});
        playerDom1.attr('title','进入直播');
        playerDom2.attr('title','进入直播');
        if(!!isClient){
            linkLive.attr({
                href:obj.pc_link
            });
            linkLive.removeAttr('target');
            playerDom1.attr('href',obj.pc_link);
            playerDom2.attr('href',obj.pc_link);
        }else{
            linkLive.attr({
                href:obj.web_link,
                target:'_blank'
            });
            playerDom1.attr({'href':obj.web_link,'target':"_blank"});
            playerDom2.attr({'href':obj.web_link,'target':"_blank"});
        }
        if(index==pkItems.last().index()){
            needRemove=true;
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
                        targetDom.find('.tip').html('PK结束');
                        targetDom.removeClass('pking');
                        playerDom1.attr({'href':playerDom1.attr('spaceurl'),title:playerDom1.attr('originTitle')});
                        playerDom2.attr({'href':playerDom2.attr('spaceurl'),title:playerDom2.attr('originTitle')});
                        if(needRemove==true){
                            linkLive.css("display","none");
                        }
                    }
                }
            });
        }
    }
    //更新pk结束
    function updatePKEnd(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        var player1=obj.player_1;
        var player2=obj.player_2;
        targetDom.find('.tip').html('PK 结束');
        //首页没有投票结束态
        return false;
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.voteEndTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==2){
                    targetDom.addClass('pkend');
                    targetDom.find('.vote-tips').addClass('show').html('投票结束');
                    targetDom.find('em.num').css('display','none');
                    targetDom.find('em.replace').css('display','none');
                    loader.load('http://chang.pptv.com/api/pk_result',{username:player1.username},function(data){
                        var data=data.data;
                        var player1Res=data.pkinfo;
                        var player2Res=data.playerinfo;
                        if(Number(player1Res.counter)>Number(player2Res.counter)){
                            if(player2.is_group=="1"){
                                var realname=player2.group_name;
                            }else{
                                var realname=player2.real_name;
                            }
                            var tempStr='获得了'+formatVote(player1.counter)+'票 击败了'+realname;
                            targetDom.find('.tip').html(tempStr);
                            var playerDom=targetDom.find('.p2');
                            playerDom.find('i').addClass('out').html('淘汰');
                        }else{
                            if(player1.is_group=="1"){
                                var realname=player1.group_name;
                            }else{
                                var realname=player1.real_name;
                            }
                            var tempStr='获得了'+formatVote(player2.counter)+'票 击败了'+realname;
                            targetDom.find('.tip').html(tempStr);
                            var playerDom=targetDom.find('.p1');
                            playerDom.find('i').addClass('out').html('淘汰');
                        }
                    });
                }
            }
        });
    }
    //更新投票结束
    function updatePKVoteEnd(obj,scopeid,needTimer,index){
        var targetDom=pkItems.eq(index);
        targetDom.addClass('pkend');
        targetDom.find('.vote-tips').addClass('show').html('投票结束');
        var player1=obj.player_1;
        var player2=obj.player_2;
        targetDom.find('em.replace').css('display','none');
        targetDom.find('em.num').css('display','none');
        if(Number(player1.counter)>Number(player2.counter)){
            var playerDom=targetDom.find('.p2');
            playerDom.find('i').addClass('out').html('淘汰');
            if(player2.is_group=="1"){
                var realname=player2.group_name;
            }else{
                var realname=player2.real_name;
            }
            var tempStr='获得了'+formatVote(player1.counter)+'票 击败了'+realname;
            targetDom.find('.tip').html(tempStr);
        }else{
            var playerDom=targetDom.find('.p1');
            playerDom.find('i').addClass('out').html('淘汰');
            if(player1.is_group=="1"){
                var realname=player1.group_name;
            }else{
                var realname=player1.real_name;
            }
            var tempStr='获得了'+formatVote(player2.counter)+'票 击败了'+realname;
            targetDom.find('.tip').html(tempStr);
        }
    }
    //分发事件
    function dispatchItem(obj,scopeid,needTimer,index){
        var startTime=obj.startTime=uniformDate(obj.start);
        var endTime=obj.endTime=uniformDate(obj.end);
        //voteend 是时间戳
        var voteEndTime=obj.voteEndTime=obj.player_1.vote_end ? uniformDate(obj.player_1.vote_end*1000) : getEndVoteTime(endTime);
        var nowTime=getNow(tempCdnDate);
        //直播中
        if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
            updatePKLive(obj,scopeid,needTimer,index);
        }else if(startTime.getTime()>nowTime.getTime()){
            //未开始
            updateBefore(obj,scopeid,needTimer,index)
        }else if(endTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<voteEndTime.getTime()){
            //pk结束
            updatePKEnd(obj,scopeid,needTimer,index);
        }else{
            //投票结束
            //没有投票结束状态，直接取pk结束
            updatePKEnd(obj,scopeid,needTimer,index);
            //updatePKVoteEnd(obj,scopeid,needTimer,index);
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
    // pk 赛结束
    // time 等待 1s 初始化
    function init(){
        //不存在 return false
        if(pkContainer.length==0){
            return false;
        }
       loader.load(urls['interface']['pklistAll'],{__config__:{cdn:true,callback:'updatePKList'}},function(data){
            //var data=require('../../../phone/index/testpk');
            if(data.err==0){
                var pkdata=data.data;
                if(!pkdata){
                    return false;
                }
                var scopeId=pkContainer.attr('data-scope');
                if(scopeId=="0"){
                    return false;
                }
                if(!pkdata[scopeId]){
                    return false;
                }
                var result={
                    data:pkdata[scopeId],
                    id:scopeId
                }
                updateResult(result);
            }
        });
    }
});