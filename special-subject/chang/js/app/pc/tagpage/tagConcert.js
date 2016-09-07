 define(function(require,exports) {
 	var $=require('jquery');
 	var loader=require('../../../util/loader/loader');
    var uniformDate=require('../../../util/vote/uniformDate');
    var timer=require('../../../util/Timer/timer');
    var voteMap=require('../../../util/vote/voteupdate');
    var urls=require('../../../util/linkcfg/interfaceurl');
    var flipclock=require('../index/flipclock');
    //获取url参数对象
    var urlObj=require('../../../util/net/urlquery');
    var _=require('underscore');
    var globalConcertData=null;
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    var concertContainer=$(".module-myconcert-tag");
    var timeDom=concertContainer.find('.time');
    var cdnDate;
    cdnDate=concertContainer.attr('data-date');
    if(!!cdnDate){
        var tempCdnDate=uniformDate(cdnDate);
    }else{
        var tempCdnDate=null;
    }
 	//获取服务器时间,模块global
    var serverOffsetTime=0;
    var getServerSuccess=false;
    var pageStartTime=new Date().getTime();
    var freshTime=45;
    var voteRefreshInterval=null;
    //票数更新
    var gloabalIsLive=false;
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
    function initTopTimer(){
        //首页倒计时
        var timeDom=$(".js-timer-data").eq(0);
        if($.trim(timeDom.html())!=""){
            var servertime=getNow(cdnDate);
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
    // 绑定投票事件
    function bindVote(){
        voteMap.init({
            selector:'.js-vote',
            voteAttr:'data-id'
        });
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
    function exceptionCounter(counter){
         if(typeof counter=='undefined'||counter==null){
             return 0;
         }else{
             return counter;
         }
     }
    function updateUI(voteIdMap,arr){
        var ids=voteIdMap.id;
        if(ids.length!=10){
            //异常数据
            setTimeout(function(){
                window.location.reload();
            },10*1000);
            return false;
        }
        var scopeId=urlObj['scope'];
        var dataObj=globalConcertData['data']['lists'][scopeId];
        for(var key in dataObj){
            if(!!voteIdMap[key]){
               dataObj[key]['votenum']=exceptionCounter(voteIdMap[key]['data']['counter']);
            }
        }
        updateFinal(globalConcertData);
    }
    function updateConcertBefore(data,obj){
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.startTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                //console.log(times);
                if(status==2){
                    updateConcertLive(data,obj);
                }else{
                   //timeDom.css('display','none');
                    /*hourConcert.html(times.hours);
                    miniConcert.html(times.minitues);
                    secConcert.html(times.seconds);*/
                }
            }
        });
    }
    function updateConcertLive(data,obj){
        bindVote();
        gloabalIsLive=true;
        voteMap.getVotes({
            callback:updateUI
        });
        voteRefreshInterval=setInterval(function(){
            voteMap.getVotes({
                callback:updateUI
            });
        },freshTime*1000);
        timer({
            startTime:getNow(tempCdnDate),
            endTime:obj.endTime,
            serverOffsetTime:serverOffsetTime,
            pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
            callback:function(status,times){
                if(status==2){
                    setTimeout(function(){
                        clearInterval(voteRefreshInterval);
                    },50*1000*2);
                    timeDom.css('display','none');
                    hourConcert.html("00");
                    miniConcert.html("00");
                    secConcert.html("00");
                }else if(status==1){
                    timeDom.css('display','inline');
                    hourConcert.html(times.hours);
                    miniConcert.html(times.minitues);
                    secConcert.html(times.seconds);
                }
            }
        });
    }
    function updateFinalVote(){
        var ids=voteIdMap.id;
        if(ids.length!=10){
            //异常数据
            setTimeout(function(){
                window.location.reload();
            },10*1000);
            return false;
        }
        var scopeId=urlObj['scope'];
        var dataObj=globalConcertData['data']['lists'][scopeId];
        for(var key in dataObj){
            if(!!voteIdMap[key]){
               dataObj[key]['votenum']=exceptionCounter(voteIdMap[key]['data']['counter']);
            }
        }
        updateFinal(globalConcertData,false);
    }
    var hourConcert=$("#hourConcert");
    var miniConcert=$("#miniConcert");
    var secConcert=$("#secConcert");
    var templateItem='<li><span class="num"><%= idx %></span>'
                       + '<dl class="cf">'
                        +   '<dt>'
                         +'       <a href="<%= url %>" title="<%= showTitle %>" <%if(isClient==false){%>target="_blank"<%}%>></a>'
                          +'<%if(g_status=="4"){%><em class="replace"></em><%}%>'
                          +      '<img src="<%= avatar%>" alt="">'
                          +  '</dt>'
                          +'  <dd>'
                          +'      <a title="<%= showName %>" href="<%=playerUrl%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a>'
                           +'    <div class="money <%if(isZero==true){%>nomoney<%}%>">获得酬金： <div class="bar cf"><p style="width:<%= percent%>"><i class="bl"></i><%= percent%><i class="br"></i></p></div></div>'
                            +    '<p>获得票数： <em class="color"><%= showVotenum%></em></p>'
                           + '</dd>'
                       + '</dl>'
                    +'</li>';
    var itemFunc=_.template(templateItem);
    function updateConcertEnd(){
        //需要更新dom
        if(globalConcertData!=null){
            updateFinal(globalConcertData);
        }else{
          loader.load(urls['interface']['concertAll'],{__config__:{cdn:true,callback:'updateConcertList'}},function(data){
            updateFinal(data);
          }); 
        }
    }
    function updateFinal(data){
        //var data=require('./testconcert');
        if(data.err==0){
            var concertData=data.data.lists;
            var scopeId=urlObj['scope'];
            if(concertData==null){
                return false;
            }
            if(!concertData[scopeId]){
                return false;
            }
            var finalData=concertData[scopeId];
            var result={
                data:finalData,
                id:scopeId,
                bonus:data.data['scopes'][scopeId]['bonus']
            }
            var totalVote=0;
            var finalArr=_.sortBy(finalData,function(obj){
                totalVote+=Number(obj['votenum']);
                return -(Number(obj.votenum));
            });
            var tempHtml="<ul>";
            for(var i=1;i<=finalArr.length;i++){
                var tempObj=finalArr[i-1];
                if(tempObj.is_group==1){
                    tempObj.showName=tempObj.group_name;
                }else{
                    tempObj.showName=tempObj.real_name;
                }
                if(!!isClient){
                    if(!!gloabalIsLive){
                        tempObj.url=tempObj.pc_link;
                        tempObj.showTitle='正在直播中';
                    }else{
                        tempObj.url='http://chang.pptv.com/pc/player?username='+tempObj.username+'&plt=clt';
                        tempObj.showTitle=tempObj.showName;
                    }
                    tempObj.isClient=true;
                    tempObj.playerUrl='http://chang.pptv.com/pc/player?username='+tempObj.username+'&plt=clt';
                }else{
                    if(!!gloabalIsLive){
                        tempObj.showTitle='正在直播中';
                        tempObj.url=tempObj.web_link;
                    }else{
                        tempObj.url='http://chang.pptv.com/pc/player?username='+tempObj.username;
                        tempObj.showTitle=tempObj.showName;
                    }
                    tempObj.isClient=false;
                    tempObj.playerUrl='http://chang.pptv.com/pc/player?username='+tempObj.username;
                }
                if(totalVote==0||!tempObj['votenum']){
                    var num=0;
                }else{
                    var num=Math.round(Number(tempObj['votenum'])/totalVote*1000)/10;
                    if(Number(tempObj['votenum'])!=0&&num==0){
                        num='0.0';
                    }
                }
                if(num===0){
                    tempObj.isZero=true;
                }else{
                    tempObj.isZero=false;
                }
                if(num!=0&&num.toString().indexOf('.')==-1){
                    num+='.0';
                }
                tempObj.percent=num+'%';
                tempObj.idx=i;
                tempObj.showVotenum=addKannma(tempObj['votenum']);
                tempHtml+=itemFunc(tempObj);
                if(i==5){
                    tempHtml+='</ul>';
                    tempHtml+='<ul>';
                }
            }
            tempHtml+='</ul>';
            concertContainer.find('.ranklist').html(tempHtml);
        }
    }
    function updateConcertResult(result){
        var scopeData=result['data'];
        var scopeId=result['id'];
        //演唱会开始时间都是一致的
        for(var key in scopeData){
            var obj=scopeData[key];
            break;
        }
        var startTime=obj.startTime=uniformDate(obj.start);
        var endTime=obj.endTime=uniformDate(obj.end);
        var nowTime=getNow(tempCdnDate);
        if(startTime.getTime()<=nowTime.getTime()&&nowTime.getTime()<endTime.getTime()){
            updateConcertLive(scopeData,obj);
        }else if(startTime.getTime()>nowTime.getTime()){
            //未开始
            updateConcertBefore(scopeData,obj);
        }else if(endTime.getTime()<=nowTime.getTime()){
            //演唱会结束
            //php输出
            if($('.js-vote').length==0){
                return false;
            }else{
                updateConcertEnd();
            }
        }
    }
    function init(){
    	loader.load(urls['interface']['concertAll'],{__config__:{cdn:true,callback:'updateConcertList'}},function(data){
            //var data=require('./testconcert');
            if(data.err==0){
                var concertData=data.data.lists;
                var scopeId=urlObj['scope'];
                if(scopeId=="0"){
                    return false;
                }
                if(concertData==null){
                    return false;
                }
                if(!concertData[scopeId]){
                    return false;
                }
                var originConcertData=concertData[scopeId];
                var tempObj={};
                for(var key in originConcertData){
                    tempObj[originConcertData[key]['voteid']]=originConcertData[key];
                }
                data.data.lists[scopeId]=tempObj;
                globalConcertData=data;
                //console.log("globalConcertData",globalConcertData);
                var result={
                    data:tempObj,
                    id:scopeId,
                    bonus:data.data['scopes'][scopeId]['bonus']
                }
                updateConcertResult(result);
            }
        });
    }
 });