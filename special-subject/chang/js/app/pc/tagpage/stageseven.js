 define(function(require,exports) {
    var $=require('jquery');
    var uniformDate=require('../../../util/vote/uniformDate');
    var getUrlArgObject=require('../../../util/others/getquery');
    var loader=require('../../../util/loader/loader');
    var urls=require('../../../util/linkcfg/interfaceurl');
    var timer=require('../../../util/Timer/timer');
    var _=require('underscore');
    var flipclock=require('../index/flipclock');
    var urlObj=getUrlArgObject();
    var isClient = function(){
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    var currentStage=5;
    var template_item='<li>'              
                    +'<div class="pic">'
                       + '<a href="<%= playurl%>" title="<%= showName %>" <%if(isClient==false){%>target="_blank"<%}%>></a>'
                      +  '<img src="<%= avatar%>" alt="<%= showName %>">'
                   + '</div>'
                   + '<h3><a href="<%= playurl%>" title="<%= avatar%>" <%if(isClient==false){%>target="_blank"<%}%>><%= showName %></a></h3>'
                   +'<% if(isEnd == true && isOut==true) { %>' 
                   + '<i class="icon1"></i>' 
                   + ' <% } %>'
                +'</li>';
    var tempFunc=_.template(template_item);
    var prefix='<div class="module-pic-layout3"><div class="hd"><h3><i></i><span>10强</span>选手</h3></div><ul class="cf">';
    var suffix='</ul></div>';
    function buildItemHtml(data,isEnd){
        var tempObj=data;
        if(!!isClient){
            tempObj.isClient=true;
        }else{
            tempObj.isClient=false;
        }
        if(tempObj.is_group=="1"){
            tempObj.showName=tempObj.group_name;
        }else{
            tempObj.showName=tempObj.real_name;
        }
        tempObj.isEnd=isEnd===true ? true : false;
        if((tempObj.g_status=="2"&&tempObj.g_stage==currentStage)||(tempObj.g_status=="2"&&tempObj.g_stage==4)){
            tempObj.isOut=true;
        }
        if(!!isClient){
            tempObj.playurl='http://chang.pptv.com/pc/player?username='+tempObj.username+'&plt=clt';
        }else{
            tempObj.playurl='http://chang.pptv.com/pc/player?username='+tempObj.username;
        }
        return tempFunc(tempObj);
    }
    var goldfourContainer=$("#gold-stage-tag5");
    var globalParent=goldfourContainer.parent();
    function updateDomGoldEnd(data,isEnd){
        var tempHtml='';
        tempHtml+=prefix;
        for(var key in data){
            tempHtml+=buildItemHtml(data[key]['player1_info'],isEnd);
            tempHtml+=buildItemHtml(data[key]['player2_info'],isEnd);
        }
        tempHtml+=suffix;
        globalParent.html(tempHtml);
    }

    var serverOffsetTime = 0;
    var getServerSuccess = false;
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

    //头部倒计时初始化
    function initTopTimer(){
        //首页倒计时
        var timeDom=$(".js-timer-data");
        if($.trim(timeDom.html())!=""){
            var servertime= new Date((new Date().getTime())+serverOffsetTime);
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

    //var freshTime=5*60;
    var freshTime=10;
    function initGold(){
        var tempobj={};
        tempobj.__config__={cdn:true,callback:'updateGoldList'};
        var scopeid=tempobj.scopeid=urlObj['scope'];
        tempobj.stage=4;
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
                    if(data[key]['player1_info']['g_stage']==currentStage){
                        isEnd=true;
                        break;
                    }
                    if(data[key]['player2_info']['g_stage']==currentStage){
                        isEnd=true;
                        break;
                    }
                }
                if(isEnd===true){
                     updateDomGoldEnd(data,true);
                }else{
                    setTimeout(function(){
                        initGold();
                    },freshTime*1000);
                }
            }
        });
    }
    initGold();
 });