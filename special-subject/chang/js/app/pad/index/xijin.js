define(function(require,exports) {
	var $=require('jquery');
	var loader=require('../../../util/loader/loader');
	var phpNowDate=$("#concert_wrap").attr('data-date');
    if(!!phpNowDate){
        var tempCdnDate=uniformDate(phpNowDate);
    }else{
        var tempCdnDate=null;
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
	//判断是否是ipad 打开的
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
	    $(".grid").on('click',".module-concertnight ul a",function(e){
	        var tempHref=this.getAttribute('href');
            if(tempHref.indexOf('username')!=-1){
                e.preventDefault();
                redirectBiaoqian(tempHref);
            }
	    });
	    $(".grid").on('click',".cont_w",function(e){
	        var tempHref=this.getAttribute('href');
            if(tempHref.indexOf('username')!=-1){
                e.preventDefault();
                redirectBiaoqian(tempHref);
            }
	    });
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
			init();
		},
		timeout:1000,
		error:function(){
			init();
		}
	});
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var tabAll=$(".myconcert-after").find("li");
	var noticeTab=null;
	var $module = $('.module-myconcert');
	(function() {	// pk-notice
		noticeTab = new Swiper($module, {
			slidesPerView: 'auto',
			initialSlide: $module.find('.active').index()
		});
	})();
	function finishBind(){
		tabAll.click(function() {
			var obj=$(this);
			obj.addClass('active').siblings().removeClass('active');
			var scopeid=obj.attr('scopeid');
			//如果前一个等于后一个
			if(prevScopeId==scopeid){
				return false;
			}else{
				prevScopeId=scopeid;
			}
			var targetDom=$('#concert_'+scopeid);
			var $vsItems = $('.vs-item');
			$vsItems.removeClass('active');
			targetDom.addClass('active');
			var swiperItem=targetDom.find('.content.renqi');
			//绑定swiper
			if(swiperItem.length!=0&&!swiperItem.attr('isSwpied')){
				swiperItem.attr('isSwpied',1);
				new Swiper(swiperItem, {
					slidesPerView: 'auto'
				});
			}
		});
	}
	var timer = require('./../../../util/Timer/timer');
	// 直播tab template
	var tab_template='<div class="tips"><em>LIVE</em>点击头像进入直播</div>';
	function uuid(){
		var count=0;
		return function(prefix){
			return prefix+'_'+count++;
		}
	}
	var timerUID=uuid();
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
		$(".renqi-item .cont_w").each(function(){
			var obj=$(this);
			var tempHref=obj.attr('href');
			if(!!tempHref){
				tempHref=tempHref.replace(/\&?type=app/,'');
				obj.attr('href',tempHref);
			}
		});
	}
	function updateToday(todayData,bonus,targetDom,scopeid){
		var now=getNow(tempCdnDate);
		var start=new Date(todayData[0]['start'].replace(/-/g,'/'));
		var end=new Date(todayData[0]['end'].replace(/-/g,'/'));
		//var start=new Date(new Date().getTime()+10*1000);
		//var end=new Date(new Date().getTime()+20*1000);
		if(start.getTime()>=now.getTime()){
			//建立 timer 模块
			var uid=timerUID('timer');
			timer({
				startTime : now,
				endTime:start,
				serverOffsetTime:serverOffsetTime,
				pageStartTime:pageStartTime,
            	cdnDate:tempCdnDate,
            	getServerSuccess:getServerSuccess,
			    callback  : function(status,times){
			    	//console.log(times);
			        if(status==2){
			        	//更新dom
			        	//console.log(times);
			        	var $con=targetDom;
			        	$con.find(".main").prepend(tab_template);
			        	//遍历更新链接
			        	$con.find('a').each(function(){
			        		var obj=$(this);
			        		var nextUrl=obj.attr('next-url');
			        		obj.attr('href',nextUrl);
			        	});
			        	//第二个倒计时，切换吸金结束的逻辑
			        	timer({
			        		startTime :getNow(phpNowDate),
			        		endTime : end,
			        		serverOffsetTime:serverOffsetTime,
			        		pageStartTime:pageStartTime,
            				cdnDate:tempCdnDate,
            				getServerSuccess:getServerSuccess,
			        		callback:function(status,times){
			        			//console.log(times);
			        			if(status==2){
			        				updateFinal(targetDom,bonus,scopeid);
			        			}
			        		}
			        	});
			        }
			    }
			 });
		}else{
			//直接更新dom
			if(now>=end){
				//更新吸金数据
				updateBefore(todayData,bonus,targetDom,true);
			}else{
				//更新直播状态
				var $con=targetDom;
				//console.log(targetDom);
				$con.find(".main").prepend(tab_template);
				//遍历更新链接
				$con.find('a').each(function(){
					var obj=$(this);
					var nextUrl=obj.attr('next-url');
					obj.attr('href',nextUrl);
				});
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
							updateFinal(targetDom,bonus,scopeid);
						}
					}
				});
			}
		}
	}
	function updateFinal(targetDom,bonus,scopeid){
		loader.load(interfaceUrl,{__config__:{cdn:true,callback:'concertFinalUpdate'}}, function(data){
			var areas=data.data.areas;
			var lists=data.data.lists;
			if(lists==null){
				return false;
			}
			var scopes=data.data.scopes;
			var tempData=lists[scopeid];
			updateBefore(tempData,bonus,targetDom,true);
		});
	}
	function updateBefore(data,bonus,targetDom,needSwipe){
		//console.log(data);
		//var totalBonus=bonus.bonus;
		var prefix='http://chang.pptv.com/ipad/player?';
		if(!!isApp){
			prefix+='type=app';
		}
		prefix+='&username=';
		//console.log('singleData',data);
		//过期时间表示吸金结束，直接更新dom即可
		// 吸金template 目前都是假数据
		var xijin_prefix='<div class="module module-top20 pad module-myconcert-xijin"><div class="content renqi"><div class="swiper-wrapper renqi-list">';
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
		var item=targetDom;
		item.html(tempHtml);
		if(!!needSwipe&&targetDom.css('display')=='block'){
			var swiperItem=item.find('.content.renqi');
			if(!swiperItem.attr('isSwpied')){
				swiperItem.attr('isSwpied',1);
				new Swiper(swiperItem, {
					slidesPerView: 'auto'
				});
			}
		}
	}
	var interfaceUrl='http://chang.pptv.com/api/concert';
	function init(){
		loader.load(interfaceUrl,{__config__:{cdn:true,callback:'concertUpdate'}}, function(data){
	       if(data.err==0){
	       		var areas=data.data.areas;
	       		var lists=data.data.lists;
	       		if(lists==null){
	       			finishBind();
	       			return false;
	       		}
	       		var scopes=data.data.scopes;
	       		var targetTodayTab=$(".myconcert-after .swiper-slide.active");
	       		if(targetTodayTab.length==0){
	       			targetTodayTab=$(".myconcert-after .swiper-slide").eq(0);
	       			targetTodayTab.addClass('active');
	       		}
				prevScopeId=targetTodayTab.attr('scopeid');
				var todayScopeId=prevScopeId;
       			var activeIdx=targetTodayTab.index();
       			noticeTab.slideTo(activeIdx);
	   			var todayDomsParent=$('#concert_'+todayScopeId);
	   			var todayData=lists[todayScopeId];
	   			todayDomsParent.addClass('active');
	   			var nowDate=getNow(tempCdnDate);
	   			if(!!todayData){
	   				updateToday(todayData,scopes[todayScopeId],todayDomsParent,todayScopeId);
	   			}
	       		for(var i=0;i<tabAll.length;i++){
	       			if(i==activeIdx){
	       				continue;
	       			}
	       			var tempTab=tabAll.eq(i);
	       			var tempScopeId=tempTab.attr('scopeid');
	       			var tempDomsParent=$('#concert_'+tempScopeId);
	       			var tempdataArr=lists[tempScopeId];
	       			//继续容错
	       			if(!tempdataArr){
	       				continue;
	       			}
	       			updateToday(tempdataArr,scopes[tempScopeId],tempDomsParent,tempScopeId);
	       		}
	       		finishBind();
	       }
	    });
	}
});
