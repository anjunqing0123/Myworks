define(function(require, exports, module){
	var $=require('jquery');
	var ajaxLoad=require('../../../util/loader/loader');
	var getQuery=require('../../../util/others/getquery');
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var timer=require('../../../util/Timer/timer');
	var queryObj=getQuery();
	// 直播tab template
	var tab_template='<div class="tab"><div class="tab_a">LIVE</div><div class="tab_b">点击头像直接进入直播页</div></div>';
	//更新演唱会数据
	var isIpad=(function(){
	    var ua = navigator.userAgent.toLowerCase();
	    return /\(ipad/i.test(ua);
	})();
	if(!!isIpad){
	    var $container=$(".module-concertnight.pad");
	    var totalRole=$container.find('.noresult').find('a');
	}else{
	    var $container=$(".module-livepk");
	    var totalRole=$container.find('.role');
	}
	var areaid=parseInt(queryObj['scope_id']);
	if(typeof areaid!="number"){
	    return false;
	}
	var phpNowDate=$("#concert_biaoqian_wrap").attr('data-date');
	if(!!phpNowDate){
	    var tempCdnDate=uniformDate(phpNowDate);
	}else{
	    var tempCdnDate=null;
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
	var pageStartTime=new Date().getTime();
	var getServerSuccess=false;
	var serverOffsetTime=0;
	$.ajax({
	    url:'http://time.pptv.com?time='+new Date().getTime(),
	    type : 'GET',
	    dataType : 'jsonp',
	    cache: true,
	    jsonp:'cb',
	    success:function(data){
	        serverOffsetTime=data*1000-new Date().getTime();
	        getServerSuccess=true;
	        updateConcertList();
	    },
	    timeout:1000,
	    error:function(){
	        updateConcertList();
	    }
	});
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
	function updateSingleRole(obj,count){
	    if(!!isApp){
	        var url=obj.link;
	        url=url.replace(/\&amp\;/g,'&');
	    }else{
	        var url=obj.app_link;
	    }
	    var tempObj=totalRole.eq(count);
	    if(!!isIpad){
	        tempObj.attr('href',url);
	        var tempImg=tempObj.find('img');
	        tempImg.attr('src',obj.avatar);
	        tempImg.css('opacity',1);
	        if(obj.is_group=="1"){
	            tempObj.find('i').text(obj.group_name);
	        }else{
	            tempObj.find('i').text(obj.real_name);
	        }
	    }else{
	        tempObj.attr('href',url);
	        tempObj.find('.roleimg').attr('src',obj.avatar);
	        if(obj.is_group=="1"){
	            tempObj.find('.rolename').text(obj.group_name);
	        }else{
	            tempObj.find('.rolename').text(obj.real_name);
	        }
	    }
	}
	function updateBeforeRole(obj,count){
	    if(!!isIpad){
	        var url='http://chang.pptv.com/ipad/player?username='+obj.username;
	        if(!!isApp){
	            url+='&type=app';
	        }
	        var tempObj=totalRole.eq(count);
	        tempObj.attr('href',url);
	        var tempImg=tempObj.find('img');
	        tempImg.attr('src',obj.avatar);
	        tempImg.css('opacity',1);
	        if(obj.is_group=="1"){
	            tempObj.find('i').text(obj.group_name);
	        }else{
	            tempObj.find('i').text(obj.real_name);
	        }
	    }else{
	        var url='http://chang.pptv.com/app/player?username='+obj.username;
	        if(!!isApp){
	            url+='&type=app';
	        }
	        var tempObj=totalRole.eq(count);
	        tempObj.attr('href',url);
	        tempObj.find('.roleimg').attr('src',obj.avatar);
	        if(obj.is_group=="1"){
	            tempObj.find('.rolename').text(obj.group_name);
	        }else{
	            tempObj.find('.rolename').text(obj.real_name);
	        }
	    }
	}
	function updateToday(todayData,bonus){
	    var now=getNow(tempCdnDate);
	    var start=new Date(todayData[0]['start'].replace(/-/g,'/'));
	    var end=new Date(todayData[0]['end'].replace(/-/g,'/'));
	    //start=new Date(new Date().getTime()-10*1000);
	    //end=new Date(new Date().getTime()+1000*10);
	    //end=new Date(new Date().getTime()+1000*20);
	    //未开始
	    if(start.getTime()>=now.getTime()){
	        for(var key in todayData){
	            updateBeforeRole(todayData[key],key);
	        }
	        //倒计时,未开始
	        //建立 timer 模块
	        timer({
	            startTime : now,
	            endTime:start,
	            serverOffsetTime:serverOffsetTime,
	            pageStartTime:pageStartTime,
	            cdnDate:tempCdnDate,
	            getServerSuccess:getServerSuccess,
	            callback  : function(status,times){
	                if(status==2){
	                    //更新dom
	                    if(!!isIpad){
	                        $(".module-concertnight .main").prepend('<div class="tips"><em>LIVE</em>点击头像进入直播</div>');
	                    }else{
	                        $container.find(".container").eq(0).prepend(tab_template);
	                    }
	                    for(var key in todayData){
	                        updateSingleRole(todayData[key],key);
	                    }
	                    //第二个倒计时，切换吸金结束的逻辑
	                    timer({
	                        startTime : getNow(tempCdnDate),
	                        endTime : end,
	                        serverOffsetTime:serverOffsetTime,
	                        pageStartTime:pageStartTime,
	                        cdnDate:tempCdnDate,
	                        getServerSuccess:getServerSuccess,
	                        callback:function(status,times){
	                            if(status==2){
	                                updateFinal();
	                            }
	                        }
	                    });
	                }
	            }
	         });
	    }else{
	        //直接更新dom
	        if(now>=end){
	            //更新吸金数据，直播结束
	            updateBefore(todayData,bonus);
	        }else{
	           //直播中
	           if(!!isIpad){
	                if($(".module-concertnight .main .tips").length==0){
	                    $(".module-concertnight .main").prepend('<div class="tips"><em>LIVE</em>点击头像进入直播</div>');
	                }
	           }else{
	               if($(".container .tab .tab_b").length==0){
	                    $container.find(".container").eq(0).prepend(tab_template);
	                }
	           }
	            for(var key in todayData){
	                updateSingleRole(todayData[key],key);
	            }
	            //第二个倒计时，切换吸金结束的逻辑
	            timer({
	                startTime : getNow(tempCdnDate),
	                endTime : end,
	                serverOffsetTime:serverOffsetTime,
	                pageStartTime:pageStartTime,
	                cdnDate:tempCdnDate,
	                getServerSuccess:getServerSuccess,
	                callback:function(status,times){
	                    if(status==2){
	                    	updateFinal();
	                    }
	                }
	            });
	        }
	    }
	}
	//如果已经获取了服务器时间直接更新数据，没有的话请求30s的接口，拿到服务器时间再更新数据
	function updateFinal(){
    	var tempData={
    	    scopeid:areaid
    	};
    	tempData.__config__={
    	    cdn:true,
    	    callback:'updateConcert'
    	};
    	if(getServerSuccess==true){
    		setTimeout(function(){
		        ajaxLoad.load('http://chang.pptv.com/api/concert',tempData,function(data){
			        if(data.err==0){
			            var data=data.data;
			            var updateData=data.lists;
			            var bonus=data.scopes[areaid];
			            if(!!updateData&&!!bonus){
			                bonus=bonus.bonus ? bonus : 0;
			                updateBefore(updateData,bonus);
			            }
			        }
			    });
    		},5*1000+Math.random()*1000);
    	}else{
    		$.ajax({
    		    url:'http://time.pptv.com?time='+new Date().getTime(),
    		    type : 'GET',
    		    dataType : 'jsonp',
    		    cache: true,
    		    jsonp:'cb',
    		    success:function(data){
    		        serverOffsetTime=data*1000-new Date().getTime();
    		        pageStartTime=new Date().getTime();
    		        getServerSuccess=true;
    		        updateConcertList();
    		    },
    		    timeout:30000
    		});
    	}
	};
	function updateBefore(data,bonus){
	    //移除dom
	    var totalBonus=bonus.bonus;
	    if(!!isIpad){
	        var $container=$(".module-concertnight.pad");
	        $container.find('.main').remove();
	        var prefix='http://chang.pptv.com/ipad/player?';
	    }else{
	        var $container=$(".module-livepk .container");
	        $container.html('');
	        var prefix='http://chang.pptv.com/app/player?';
	    }
	    if(!!isApp){
	        prefix+='type=app';
	    }
	    prefix+='&username=';
	    //过期时间表示吸金结束，直接更新dom即可
	    // 吸金template 目前都是假数据
	    if(!!isIpad){
	        var xijin_prefix='<div class="module module-top20 pad module-myconcert-xijin"><div class="content renqi"><div class="swiper-wrapper renqi-list">';
	    }else{
	        var xijin_prefix='<div class="module module-top20"><div class="content renqi"><div class="swiper-wrapper renqi-list">';
	    }
	    var xijin_suffix='</div></div></div>';
	    var tempHtml="";
	    var totalVote=0;
	    for(var key in data){
	        totalVote+=parseInt(data[key]['votenum'],10);
	    }
	    for(var i in data){
	        if(totalVote==0||!data[i]['votenum']){
	            var num='0%';
	        }else{
	            var num=Math.round(Number(data[i]['votenum'])/totalVote*1000)/10+'%';
	        }
	        if(data[i]['is_group']==1){
	            var showName=data[i]['group_name'];
	        }else{
	            var showName=data[i]['real_name'];
	        }
	        if(i<3){
	            tempHtml+='<div class="swiper-slide  renqi-item"><a href="'+(prefix+data[i]['username'])+'" class="cont_w"><div class="picw"><img src="'+data[i].avatar+'"><div class="imgw"></div></div><div class="name">'+showName+'</div><div class="score"><span>'+num+'</span></div><span class="tag top">'+(parseInt(i,10)+1)+'</span></a></div>';
	        }else{
	            tempHtml+='<div class="swiper-slide  renqi-item"><a href="'+(prefix+data[i]['username'])+'" class="cont_w"><div class="picw"><img src="'+data[i].avatar+'"><div class="imgw"></div></div><div class="name">'+showName+'</div><div class="score"><span>'+num+'</span></div><span class="tag">'+(parseInt(i,10)+1)+'</span></a></div>';
	        }
	    }
	    tempHtml=xijin_prefix+tempHtml+xijin_suffix;
	    if(!!isIpad){
	        $container.append(tempHtml);
	    }else{
	        $container.html(tempHtml);
	    }
	    var swiperItem=$container.find('.content.renqi');
	    if(!swiperItem.attr('isSwpied')){
	        swiperItem.attr('isSwpied',1);
	        new Swiper(swiperItem, {
	            slidesPerView: 'auto'
	        });
	    }
	}
	function updateConcertList(){
	    var tempData={
	        scopeid:areaid
	    };
	    tempData.__config__={
	        cdn:true,
	        callback:'updateConcert'
	    };
	    ajaxLoad.load('http://chang.pptv.com/api/concert',tempData,function(data){
	        if(data.err==0){
	            var data=data.data;
	            var updateData=data.lists;
	            var bonus=data.scopes[areaid];
	            if(!!updateData&&!!bonus){
	                bonus=bonus.bonus ? bonus : 0;
	                updateToday(updateData,bonus);
	            }
	        }
	    });
	}
});