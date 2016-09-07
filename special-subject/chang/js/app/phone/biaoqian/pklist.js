define(function(require, exports, module){   
    //获取服务器时间,需求改变，目前需要投票逻辑
    var $=require('jquery');
    var getQuery=require('../../../util/others/getquery');
    var queryObj=getQuery();
    var areaid=parseInt(queryObj['scope_id']);
    var ajaxLoad=require('../../../util/loader/loader');
    var timer=require('../../../util/Timer/timer');
    var serverOffsetTime=0;
    var getServerSuccess=false;
    $.ajax({
        url:'http://time.pptv.com?time='+new Date().getTime(),
        type : 'GET',
        dataType : 'jsonp',
        cache: true,
        jsonp:'cb',
        success:function(data){
            getServerSuccess=true;
            serverOffsetTime=data*1000-new Date().getTime();
            updatePkList();
        },
        timeout:1000,
        error:function(){
            updatePkList();
        }
    });
    function uuid(prefix){
        var count=0;
        return function(){
            return prefix+'_'+count++;
        }
    }
    var timerBefore=uuid('before');
    var timerLive=uuid('live');
    var timerVote=uuid('vote');
    var timerUID=uuid('timer');
    var beforeArr=[];
    var liveArr=[];
    var voteArr=[];
    var pageStartTime=new Date().getTime();
    var phpNowDate=$("#pk_list").attr('data-date');
    if(!!phpNowDate){
        var tempCdnDate=uniformDate(phpNowDate);
    }else{
        var tempCdnDate=null;
    }
    function resolveParam(str){
        var arr = str.split("&");
        var data = {};
        for( var i = 0 ; i < arr.length ; i++ ){
            var arrs = arr[i].split("=");
            data[arrs[0]] = arrs[1];
        }
        return data
    }
    function isInApp(){
        var search = window.location.search;
        search = search.substring(1,search.length);
        urlObj = resolveParam(search);
        return (urlObj["type"] == "app" || urlObj["type"] == "ipad");
    }
    var isApp=isInApp();
    if(!isApp){
        $(".module-livepk .vs-item .avartar").each(function(){
            var obj=$(this);
            var tempHref=obj.attr('href');
            tempHref=tempHref.replace(/\&?type=app/,'');
            obj.attr('href',tempHref);
        });
        $(".module-livepk .role a").each(function(){
            var obj=$(this);
            var tempHref=obj.attr('href');
            tempHref=tempHref.replace(/\&?type=app/,'');
            obj.attr('href',tempHref);
        });
    }
    function uniformDate(dateString){
        if(typeof dateString=='undefined'){
            return false;
        }
        if(typeof dateString=='object'){
            return dateString;
        }
        if(~dateString.toString().indexOf('-')){
            return new Date(dateString.replace(/-/g,'/'));
        }else{
            return new Date(dateString);
        }
    }
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
    var sdk = require("../../../util/ppsdk/sdk");
    var browser=require('../../../util/browser/browser');
    function redirectBiaoqian(tempHref){
        if(sdk.isReady()){
            sdk.openNativePage({
                pageUrl:'app://iph.pptv.com/v4/activity/web?activity=singtofame&url='+encodeURIComponent(tempHref),
                success:function(){
                },
                error:function(code,msg){
                    if(code==1&&msg=="方法不存在"){
                        window.location.href=tempHref;
                    }
                }
            });
        }else{
            setTimeout(function(){
                redirectBiaoqian(tempHref);
            },300);
        }
    }
    if(browser.IPAD==true){
        $(".module-pk-notice").on('click',".avartar",function(e){
            var tempHref=this.getAttribute('href');
            if(tempHref.indexOf('username')!=-1){
                e.preventDefault();
                redirectBiaoqian(tempHref);
            }
        });
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
    var finalHtml='';
    var isIpad=(function(){
        var ua = navigator.userAgent.toLowerCase();
        return /\(ipad/i.test(ua);
    })();
    var vote=require('../../../util/vote/vote');
    var voteMap=require('../../../util/vote/voteupdate');
    function exceptionCounter(counter){
        if(typeof counter=='undefined'||counter==null){
            return 0;
        }else{
            return counter;
        }
    }
    // 绑定投票事件
    function bindVote(){
        new vote({
            dom:'.js-vote',
            voteAttr:'data-id',
            container:'#pk_list',
            beforeVote:function(data,dom){
                if(dom.find('span').text()!='投票'){
                    return false;
                }
            },
            afterVote:function(data,dom){
                if(typeof data.counter!='undefined'){
                    var idx=dom.index();
                    var targetParentDom=dom.parent().siblings(".tr3");
                    if(idx==0){
                        targetParentDom.find('.count').eq(0).text(exceptionCounter(data.counter));
                    }else{
                        targetParentDom.find('.count').eq(1).text(exceptionCounter(data.counter));
                    }
                    voteAnimate(dom);
                    //counter(dom.find('span'),10,true);
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
    }
    bindVote();
    function voteAnimate(dom){
        counter(dom.find('span'),10,true);
    }
     //常规倒计时
    function counter(dom,count,first){
        if(first==true){
            dom.text(count);
        }
        setTimeout(function(){
            dom.text(--count);
            if(count!=0){
                counter(dom,count);
            }else{
                dom.text('投票');
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
                var idx=doms[j].index();
                var targetParentDom=doms[j].parent().siblings(".tr3");   
                if(idx==0){
                    targetParentDom.find('.count').eq(0).text(exceptionCounter(tempObj.data.counter));
                }else{
                    targetParentDom.find('.count').eq(1).text(exceptionCounter(tempObj.data.counter));
                }
            }
        }
    }
    function resetData(){
        if(timerInterval!=null){
            clearInterval(timerInterval);
            timerInterval=null;
        }
        finalHtml='';
        liveArr=[];
        voteArr=[];
        beforeArr=[];
    }
    function insertVoteEndItem(obj){
        var tempHtml="";
        var player1=obj.player_1;
        var player2=obj.player_2;
        if(player1.is_group=="1"){
            player1.showname=player1.group_name;
        }else{
            player1.showname=player1.real_name;
        }
        if(player2.is_group=="1"){
            player2.showname=player2.group_name;
        }else{
            player2.showname=player2.real_name;
        }
        if(!!isIpad){
            player1.playerurl='http://chang.pptv.com/ipad/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/ipad/player?username='+player2.username;
        }else{
            player1.playerurl='http://chang.pptv.com/app/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/app/player?username='+player2.username;
        }
        if(!!isApp){
            player1.playerurl=player1.playerurl+'&type=app';
            player2.playerurl=player2.playerurl+'&type=app';
        }
        if(Number(player1.counter)>Number(player2.counter)){
            tempHtml+='<div class="swiper-slide vs-block"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="'
            +player1.playerurl+'"><img src="'+player1.avatar+'">';
            tempHtml+='</a><div class="js-win index win">win</div></td>';
            tempHtml+='<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="'+player2.playerurl+'"><img src="'+player2.avatar+'"></a><div class="js-win"></div></td></tr><tr><td class="name">'+player1.showname+'</td><td></td><td class="name">'+player2.showname+'</td></tr>';
            tempHtml+='<tr class="tr3 c"><td><div class="count">'+exceptionCounter(player1.counter)+'</div></td><td></td><td><div class="count">'+exceptionCounter(player2.counter)+'</div></td></tr>';
            tempHtml+='</tbody></table></div>';
        }else{
            tempHtml+='<div class="swiper-slide vs-block"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="'
            +player1.playerurl+'"><img src="'+player1.avatar+'">';
            tempHtml+='</a><div class="js-win"></div></td>';
            tempHtml+='<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="'+player2.playerurl+'"><img src="'+player2.avatar+'"></a><div class="js-win index win">win</div></td></tr><tr><td class="name">'+player1.showname+'</td><td></td><td class="name">'+player2.showname+'</td></tr>';
            tempHtml+='<tr class="tr3 c"><td><div class="count">'+exceptionCounter(player1.counter)+'</div></td><td></td><td><div class="count">'+exceptionCounter(player2.counter)+'</div></td></tr>';
            tempHtml+='</tbody></table></div>';
        }
        finalHtml+=tempHtml;
    }
    function insertLiveItem(obj){
        var tempHtml="";
        var player1=obj.player_1;
        var player2=obj.player_2;
        if(player1.is_group=="1"){
            player1.showname=player1.group_name;
        }else{
            player1.showname=player1.real_name;
        }
        if(player2.is_group=="1"){
            player2.showname=player2.group_name;
        }else{
            player2.showname=player2.real_name;
        }
        if(!!isIpad){
            player1.playerurl='http://chang.pptv.com/ipad/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/ipad/player?username='+player2.username;
        }else{
            player1.playerurl='http://chang.pptv.com/app/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/app/player?username='+player2.username;
        }
        if(!!isApp){
            player1.playerurl=player1.playerurl+'&type=app';
            player2.playerurl=player2.playerurl+'&type=app';
        }
        var tempLiveId=timerLive();
        obj.domId=tempLiveId;
        liveArr.push(obj);
        if(!!isApp){
            var url=obj.link;
            url=url.replace(/\&amp\;/g,'&');
        }else{
            var url=obj.app_link;
        }
        tempHtml+='<div class="swiper-slide vs-block" id="'+tempLiveId+'"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="'
        +url+'" spaceurl="'+player1.playerurl+'"><img src="'+player1.avatar+'"></a><div class="js-win index">'+player1.rank+'</div></td>';
        tempHtml+='<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="'+url+'" spaceurl="'+player2.playerurl+'"><img src="'+player2.avatar+'"></a><div class="js-win index">'+player2.rank+'</div></td></tr><tr><td class="name">'+player1.showname+'</td><td></td><td class="name">'+player2.showname+'</td></tr><tr class="tr3 b"><td colspan="3"><a href="'+url+'"><div class="container"><div class="left">LIVE</div><div class="right">火热直播中</div></div></a></td></tr></tbody></table></div>';
        finalHtml+=tempHtml;
    }
    var hasVote=false;
    var timerInterval=null;
    function insertVoteItem(obj){
        var tempHtml="";
        var player1=obj.player_1;
        var player2=obj.player_2;
        if(player1.is_group=="1"){
            player1.showname=player1.group_name;
        }else{
            player1.showname=player1.real_name;
        }
        if(player2.is_group=="1"){
            player2.showname=player2.group_name;
        }else{
            player2.showname=player2.real_name;
        }
        if(!!isIpad){
            player1.playerurl='http://chang.pptv.com/ipad/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/ipad/player?username='+player2.username;
        }else{
            player1.playerurl='http://chang.pptv.com/app/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/app/player?username='+player2.username;
        }
        if(!!isApp){
            player1.playerurl=player1.playerurl+'&type=app';
            player2.playerurl=player2.playerurl+'&type=app';
        }
        var tempvoteid=timerVote();
        obj.domId=tempvoteid;
        voteArr.push(obj);
        tempHtml+='<div class="swiper-slide vs-block fourLineItem" id="'+tempvoteid+'"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="'
        +player1.playerurl+'"><img src="'+player1.avatar+'"></a><div class="js-win index">'+player1.rank+'</div></td>';
        tempHtml+='<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="'+player2.playerurl+'"><img src="'+player2.avatar+'"></a><div class="js-win index">'+player2.rank+'</div></td></tr><tr><td class="name">'+player1.showname+'</td><td></td><td class="name">'+player2.showname+'</td></tr>';
        tempHtml+='<tr><td class="vote js-vote" data-id="'+player1.vote_id+'"><span>投票</span></td><td></td><td class="vote js-vote" data-id="'+player2.vote_id+'"><span>投票</span></td></tr>';
        tempHtml+='<tr class="tr3 c"><td><div class="count">'+exceptionCounter(player1.counter)+'</div></td><td></td><td><div class="count">'+exceptionCounter(player2.counter)+'</div></td></tr>';
        tempHtml+='</tbody></table></div>';
        finalHtml+=tempHtml;
        hasVote=true;
    }
    function insertBeforeItem(obj){
        var tempHtml="";
        var player1=obj.player_1;
        var player2=obj.player_2;
        if(player1.is_group=="1"){
            player1.showname=player1.group_name;
        }else{
            player1.showname=player1.real_name;
        }
        if(player2.is_group=="1"){
            player2.showname=player2.group_name;
        }else{
            player2.showname=player2.real_name;
        }
        if(!!isIpad){
            player1.playerurl='http://chang.pptv.com/ipad/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/ipad/player?username='+player2.username;
        }else{
            player1.playerurl='http://chang.pptv.com/app/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/app/player?username='+player2.username;
        }
        if(!!isApp){
            player1.playerurl=player1.playerurl+'&type=app';
            player2.playerurl=player2.playerurl+'&type=app';
        }
        var tempBeforeId=timerBefore();
        obj.domId=tempBeforeId;
        beforeArr.push(obj);
        var tempStartTime=obj['start'].match(/\d{2}:\d{2}/);
        if(tempStartTime==null){
            tempStartTime="";
        }else{
            tempStartTime=tempStartTime[0];
        }
        tempHtml+='<div class="swiper-slide vs-block" id="'+tempBeforeId+'"><table width="100%" cellpadding="0" cellspacing="0"><tbody><tr><td width="50%"><a class="avartar" href="'
        +player1.playerurl+'"><img src="'+player1.avatar+'"></a><div class="js-win index">'+player1.rank+'</div></td>';
        tempHtml+='<td class="vs_txt">VS</td><td width="50%"><a class="avartar" href="'+player2.playerurl+'"><img src="'+player2.avatar+'"></a><div class="js-win index">'+player2.rank+'</div></td></tr><tr><td class="name">'+player1.showname+'</td><td></td><td class="name">'+player2.showname+'</td></tr>';
        tempHtml+='<tr class="tr3 c"><td colspan="3"><div class="t1 c">'+tempStartTime+'登场</div></td></tr>'
        tempHtml+='</tbody></table></div>';
        finalHtml+=tempHtml;
    }
    var $pkList=$("#pk_list");
    var liveSwiper=null;
    function dispatchFinish(){
        var prefix='<div class="vs-item active"><div class="swiper-wrapper">';
        var suffix='</div></div>';
        $pkList.html(prefix+finalHtml+suffix);
        var parentWrap=$pkList.parents('.module-livepk');
        if(parentWrap.length!=0){
            parentWrap.removeClass("module-livepk").addClass('pk-biaoqian module-pk-notice');
        }
        var $vsItem=$pkList.find('.vs-item');
        if(!!hasVote){
            $vsItem.addClass('fourline');
        }
        liveSwiper=new Swiper($vsItem, {
            slidesPerView: 'auto'
        });
        voteMap.init({
            selector:'.js-vote',
            voteAttr:'data-id'
        });
        timerInterval=setInterval(function(){
            voteMap.getVotes({
                callback:updateUI
            });
        },45*1000);
        dispatchLive();
        dispatchBefore();
    }
    function dispatchLive(){
        //live 默认全部更新
        if(liveArr.length==0){
            return false;
        }else{
            for(var i=0;i<liveArr.length;i++){
                LiveUpdate(liveArr[i]);
            }
        }
    }
    //更新dom投票
    function LiveUpdate(opts){
        var now=getNow(tempCdnDate);
        var end=opts.endTime;
        var start=opts.startTime;
        var voteend=opts.voteEndTime;
        var uid=timerUID();
        var player1=opts.player_1;
        var player2=opts.player_2;
        var liveTempTarget=$('#'+opts.domId);
        var isExec=false;
        //修改dom
        if(liveSwiper!=null){
            liveSwiper.slideTo(liveTempTarget.index());
        }
        //h5的分享链接逻辑还要考虑
        if(!!isApp){
            var url=opts.link;
            url=url.replace(/\&amp\;/g,'&');
        }else{
            var url=opts.app_link;
        }
        liveTempTarget.find('.tr3').removeClass('a').addClass("b").html('<td colspan="3" id='+uid+'><a href="'+url+'"><div class="container"><div class="left">LIVE</div><div class="right">火热直播中</div></div></a></td>');
        if(!!isIpad){
            player1.playerurl='http://chang.pptv.com/ipad/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/ipad/player?username='+player2.username;
        }else{
            player1.playerurl='http://chang.pptv.com/app/player?username='+player1.username;
            player2.playerurl='http://chang.pptv.com/app/player?username='+player2.username;
        }
        if(!!isApp){
            player1.playerurl=player1.playerurl+'&type=app';
            player2.playerurl=player2.playerurl+'&type=app';
        }
        liveTempTarget.find(".avartar").each(function(idx){
            if(idx==0){
                var prevhref=player1.playerurl;
            }else{
                var prevhref=player2.playerurl;
            }
            this.setAttribute('spaceurl',prevhref);
            this.setAttribute('href',url);
        });
        timer({
            startTime : now,
            endTime:end,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback  : function(status,times){
                if(status==2){
                    var voteStr='<tr><td class="vote js-vote" data-id="'+player1.vote_id+'"><span>投票</span></td><td></td><td class="vote js-vote" data-id="'+player2.vote_id+'"><span>投票</span></td></tr>';
                    var t3Wrap=liveTempTarget.find('.tr3');
                    t3Wrap.before(voteStr);
                    liveTempTarget.addClass('fourLineItem');
                    liveTempTarget.parents('.vs-item').addClass('fourline');
                    t3Wrap.html('<td><div class="count"></div></td><td></td><td><div class="count"></div></td>');
                    var jsVotes=liveTempTarget.find('.js-vote');
                    voteMap.add(player1.vote_id,jsVotes.eq(0));
                    voteMap.add(player2.vote_id,jsVotes.eq(1));
                    voteMap.getVotes({
                        callback:updateUI
                    });
                    liveTempTarget.find(".avartar").each(function(){
                        this.setAttribute('href',this.getAttribute('spaceurl'));
                    });
                    if(!isExec){
                        isExec=true;
                        voteEndUpdate(opts);
                    }
                }
            }
         });
    }
    function voteEndUpdate(opts){
        var end=opts.endTime;
        var voteend=opts.voteEndTime;
        timer({
            startTime : end,
            endTime:voteend,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback  : function(status,times){
                if(status==2){
                    //应该是进入第三阶段了，暂时不写dom逻辑，加延迟
                    setTimeout(function(){
                        window.location.reload();
                    },60*1000);
                }
            }
        });
    }
    function dispatchBefore(){
        //sort
        //没有未开始的
        if(beforeArr.length==0){
            return false;
        }
        beforeArr.sort(function(a,b){
            var returnVal=a.startTime.getTime()-b.startTime.getTime();
            if(returnVal==0){
                return -1;
            }else{
                return returnVal;
            }
        });
        nextTimer();
    }
    //未开始更新
    function beforeUpdate(opts){
        var uid=timerUID();
        var now=getNow(tempCdnDate);
        var start=opts.startTime;
        var startStr=opts['start'].match(/\d{2}:\d{2}/);
        if(startStr==null){
            startStr="";
        }else{
            startStr=startStr[0];
        }
        var tempTarget=$('#'+opts.domId);
        tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t2 c" id='+uid+'></div>后登场</td>');
        timer({
            startTime:now,
            endTime:start,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==1){
                    if(parseInt(times.hours,10)<24){
                        $("#"+uid).html(times.hours+':'+times.minitues+':'+times.seconds);
                    }else{
                        tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t1 c" id='+uid+'>'+startStr+'登场</div></td>');
                    }
                }else if(status==2){
                    //重置状态
                    nextTimer(opts);
                    LiveUpdate(opts);
                }
            }
        });
    }
    function nextTimer(){
        if(beforeArr.length==0){
            return;
        }
        var timerObj=beforeArr.shift();
        beforeUpdate(timerObj);
    }
    function updateAll(pkdata){
        resetData();
        var allVoteEnd=false;
        for(var key in pkdata){
            var obj=pkdata[key];
            var startTime=obj.startTime=uniformDate(obj.start);
            var endTime=obj.endTime=uniformDate(obj.end);
            var voteEndTime=obj.voteEndTime=obj.player_1.vote_end ? new Date(obj.player_1.vote_end*1000) : getEndVoteTime(endTime);
            var nowTime=getNow();
            //直播中
            if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
                insertLiveItem(obj);
            }else if(startTime.getTime()>nowTime.getTime()){
                insertBeforeItem(obj);
                //updateBeforeItem(obj);
            }else if(endTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<voteEndTime.getTime()){
                //投票中
                insertVoteItem(obj);
            }else{
                insertVoteEndItem(obj);
                //投票结束
                //allVoteEnd=false;
                //break;
            }
        }
        if(allVoteEnd==true){
            return false;
        }else{
            dispatchFinish();
        }
    }
    var cachedPKDate=null;
    function updatePkList(){
        var tempData={
            area_id:areaid
        };
        tempData.__config__={
            cdn:true,
            callback:'getPkList'
        };
        //先判断dom结构，如果是投票结束状态直接返回
        if($("#pk_list .container").length==3){
            //投票都已经结束了
            return false;
        }
        ajaxLoad.load('http://chang.pptv.com/api/pk',tempData,function(data){
            //var data=require('../index/testpk');
            if(data.err==0){
                var data=cachedPKDate=data.data[areaid];
                var tempEnd;
                var k=9;
                while(k>0){
                    if(!!data[k]){
                        var tempEnd=data[k]['end'];
                        var tempStart=data[k]['start'];
                        var tempvoteEnd=data[k]['player_1']['vote_end'] ? new Date(data[k]['player_1']['vote_end']*1000) : getEndVoteTime(uniformDate(tempEnd));
                        break;
                    }
                    k--;
                }
                if(!tempEnd){
                    return false;
                }
                var now=getNow();
                var endLast=uniformDate(tempEnd);
                var startLast=uniformDate(tempStart);
                var startFirst=uniformDate(data['0']['start']);
                // 直播未开始
                if(startFirst.getTime()>now.getTime()){
                    if(!!isIpad){
                        /*var $vsItem=$pkList.find('.vs-item');
                        new Swiper($vsItem, {
                            slidesPerView: 'auto'
                        });*/
                        updateAll(cachedPKDate);
                    }
                    return false;
                }else if(now.getTime()<=tempvoteEnd.getTime()){
                    //需要更新
                    updateAll(cachedPKDate);
                }
            }
        });
    }
});