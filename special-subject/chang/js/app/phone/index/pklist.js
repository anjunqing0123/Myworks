define(function(require,exports) {
	var $=require('jquery');
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var loader=require('../../../util/loader/loader');
	var globalActiveTimer=null;
	//获取服务器时间
	var serverOffsetTime=0;
	var getServerSuccess=false;
	var noticeTab=null;
    var phpNowDate=$("#pk_time_wrap").attr('data-date');
    if(!!phpNowDate){
        var tempCdnDate=uniformDate(phpNowDate);
    }else{
        var tempCdnDate=null;
    }
	//存放倒计时数组
	var timerArr=[];
	var globalTimer=null;
	var tabAll=$(".notice-tab").find(".swiper-slide");
	var prevScopeId=null;
	var liveSwiper=null;
	var timer = require('./../../../util/Timer/timer');
	var vote=require('../../../util/vote/vote');
	var voteMap=require('../../../util/vote/voteupdate');
	//用于服务器时间获取失败记录的页面本地打开时间
	(function() {	// pk-notice
		var $module = $('.module-pk-notice');
		$module.find('.notice-tab').each(function() {
			noticeTab = new Swiper(this, {
				slidesPerView: 'auto'
			});
		});
	})();
    var pageStartTime=new Date().getTime();
    var getServerSuccess=false;
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
	//最后绑定切换事件，不然可能会导致未知的问题
	function finishBind(){
		var $module = $('.module-pk-notice');
		$module.find('.notice-tab .swiper-slide').on('click',function() {
			var obj=$(this);
			obj.addClass('active').siblings().removeClass('active');
			var scopeid=obj.attr('scopeid');
			//如果前一个等于后一个
			if(prevScopeId==scopeid){
				return false;
			}else{
				prevScopeId=scopeid;
			}
			var targetDom=$('#pk_'+scopeid);
			var $vsItems = $('.vs-item');
			$vsItems.removeClass('active');
			targetDom.addClass('active');
			//绑定swiper
			if(targetDom.length!=0&&!targetDom.attr('isSwpied')){
				targetDom.attr('isSwpied',1);
				new Swiper(targetDom, {
					slidesPerView: 'auto'
				});
			}
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
	//票数异常处理
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
			container:'.module-pk-notice .vs_list',
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
                    }
					//console.log(data.errors);
				}
			}
		});
		voteMap.init({
			selector:'.js-vote',
			voteAttr:'data-id'
		});
	}
	//事件委托，直接绑定投票
	bindVote();
	//投票10s倒计时
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
	function uuid(){
		var count=0;
		return function(prefix){
			return prefix+'_'+count++;
		}
	}
	// 定时器生成id 函数
	var timerUID=uuid();
	//未开始更新
	function beforeUpdate(opts){
		var uid=timerUID('timer');
		var now=getNow(tempCdnDate);
		var start=opts.starttime;
		var tempTarget=opts.domTarget;
		var tempStartTime=opts['start'].match(/\d{2}:\d{2}/);
		if(tempStartTime==null){
		    tempStartTime="";
		}else{
		    tempStartTime=tempStartTime[0];
		}
		tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t2 c" id='+uid+'>'+tempStartTime+'</div>后登场</td>');
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
					}
				}else if(status==2){
					//重置状态
					nextTimer(opts);
		        	liveUpdate(opts);
				}
			}
		});
	}
	//投票结束更新
	function voteendUpdate(opts){
		var end=opts.endtime;
		var voteend=opts.voteend;
		var endExec=false;
		var isExec=false;
		var liveTempTarget=opts.domTarget;
		timer({
			startTime : end,
			endTime:voteend,
			serverOffsetTime:serverOffsetTime,
			pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
		    callback  : function(status,times){
		        if(status==2){
		        	//执行接口逻辑,返回投票数，更新dom
		        	if(!isExec){
		        		isExec=true;
		        		loader.load('http://chang.pptv.com/api/pk_result',{username:opts.player_1.username},function(data){
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
		        		    		var winDoms=liveTempTarget.find('.js-win');
		       						liveTempTarget.find('.js-vote').parent('tr').css('display','none');
	    		    				liveTempTarget.find('.tr3').removeClass('b').addClass('a').html('<td><div class="count">'+exceptionCounter(player1.votenum)+'</div></td><td></td><td><div class="count">'+exceptionCounter(player2.votenum)+'</div></td>');
		        		    		liveTempTarget.removeClass('fourLineItem');
		        		    		if(data.iswin==="1"){
		        		    			winDoms.eq(0).addClass('win index').text('win');
		        		    			winDoms.eq(1).remove();
		        		    		}else if(data.iswin==="0"){
		        		    			winDoms.eq(1).addClass('win index').text('win');
		        		    			winDoms.eq(0).remove();
		        		    		}
	        		    		}else{
	        		    			//异常处理，不再次请求，避免重复请求
	        		    			return false;
	        		    		}
	        		    	}
	        		    });
		        	}
		        }
		    }
	 	});
	}
	var urlObj=null;
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
		$(".module-pk-notice .vs-item .avartar").each(function(){
			var obj=$(this);
			var tempHref=obj.attr('href');
			tempHref=tempHref.replace(/\&?type=app/,'');
			obj.attr('href',tempHref);
		});
	}
	//直播更新
	function liveUpdate(opts,force){
		var live_cid=opts.live_cid;
		var now=getNow(tempCdnDate);
		var end=opts.endtime;
		var start=opts.starttime;
		var voteend=opts.voteend;
		var uid=timerUID('timer');
		var player1=opts.player_1;
		var player2=opts.player_2;
		var liveTempTarget=opts.domTarget;
		var isExec=false;
		//修改dom
    	if(liveSwiper!=null){
    		liveSwiper.slideTo(liveTempTarget.index());
    	}
		//h5的分享链接逻辑还要考虑
		// var url='pptv://player?cp=1&vid='+live_cid+'&playmode=2&type=pplive2&extra=activity%3dsingtofame';
		if(!!isApp){
			var url=opts.link;
		}else{
			var url=opts.app_link;
		}
		url=url.replace(/\&amp\;/g,'&');
		liveTempTarget.find('.tr3').removeClass('a').addClass("b").html('<td colspan="3" id='+uid+'><a href="'+url+'"><div class="container"><div class="left">LIVE</div><div class="right">火热直播中</div></div></a></td>');
		liveTempTarget.find(".avartar").each(function(idx){
			var prevhref=this.getAttribute('href');
			this.setAttribute('spaceurl',prevhref);
			this.setAttribute('href',decodeURIComponent(url));
		});
		if(force==true){
			nextTimer(opts);
		}
		timer({
			startTime : now,
			endTime:end,
			serverOffsetTime:serverOffsetTime,
			pageStartTime:pageStartTime,
            cdnDate:tempCdnDate,
            getServerSuccess:getServerSuccess,
		    callback  : function(status,times){
		        if(status==2){
		        	//执行接口逻辑,返回投票数，更新dom
		        	if(switchscopeid!=null){
        				tabAll.each(function(){
	        				var obj=$(this);
	        				if(obj.attr('scopeid')==switchscopeid.scopeid){
	        					obj.trigger('click');
	        					var newDomsParent=$('#pk_'+switchscopeid.scopeid);
	        					newDomsParent.attr('isSwpied',1);
	        		       		liveSwiper=new Swiper(newDomsParent, {
	        						slidesPerView: 'auto'
	        					});
	        					liveSwiper.slideTo(switchscopeid.domTarget.index());
	        					switchscopeid=null;
	        					return false;
	        				}
        				});
		        	}
		        	var voteStr='<tr><td class="vote js-vote" data-id="'+player1.vote_id+'"><span>投票</span></td><td></td><td class="vote js-vote" data-id="'+player2.vote_id+'"><span>投票</span></td></tr>';
		        	var t3Wrap=liveTempTarget.find('.tr3');
		        	t3Wrap.before(voteStr);
		        	liveTempTarget.parents('.vs-item').addClass('fourline');
		        	liveTempTarget.addClass('fourLineItem');
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
		        		voteendUpdate(opts);
		        	}
		        }
		    }
		 });
	}
	//控制是否切换tab
	var switchscopeid=null;
	function nextTimer(prevObj){
		if(timerArr.length==0){
			return;
		}
		var timerObj=timerArr.shift();
		if(timerObj.scopeid!=prevObj.scopeid){
			switchscopeid=timerObj;
		}
		beforeUpdate(timerObj);
	}
	function updateDom(target,obj,idx,updateForce,findToday,scopeid){
		if(target.length==0){
			return false;
		}
		var nextFirst=null;
		var liveTarget=null;
		var player1=obj.player_1;
		var player2=obj.player_2;
		var player1win=1;
		player1.counter=player1.counter!=null ? player1.counter : 0;
		player2.counter=player2.counter!=null ? player2.counter : 0;
		if(Number(player1.counter)>Number(player2.counter)){
			player1win=0;
		}
		var start,end;
		start=obj.start.replace(/-/g,'/');
		end=obj.end.replace(/-/g,'/');
		var now=obj.now=getNow(tempCdnDate);
		start=obj.starttime=new Date(start);
		end=obj.endtime=new Date(end);
		obj.scopeid=scopeid;
		/*if(idx%3==0){
			var start=new Date(now.getTime()-2000*60*60+serverOffsetTime);
			var end=new Date(now.getTime()-1000*60*60+serverOffsetTime);
		}else if(idx%3==1){
			//var start=new Date(now.getTime()-500*60*60);
			//var end=new Date(now.getTime()+500*60*60);
			var start=new Date(now.getTime()+1000*60*60+serverOffsetTime);
			var end=new Date(now.getTime()+2000*60*60+serverOffsetTime);
		}else{
			var start=new Date(now.getTime()-1000*60*60+serverOffsetTime);
			var end=new Date(now.getTime()+2000*60*60+serverOffsetTime);
		}*/
		//防止cdn穿透
		var voteend=obj.voteend=new Date(player1.vote_end*1000+parseInt(Math.random()*3000));
		//var voteend=obj.voteend=player1.vote_end=new Date(end.getTime()+1000*60*60*12);
		var tempTarget=obj.domTarget=$(target);
		if(now.getTime()>=end.getTime()){
			//过时了，不隐藏dom
			//更新赢的数据
			if(now.getTime()>=voteend.getTime()){
				var winDoms=tempTarget.find('.js-win');
				winDoms.eq(player1win).addClass('win index').text('win');
				if(player1win==1){
					winDoms.eq(0).remove();
				}else{
					winDoms.eq(1).remove();
				}
				tempTarget.find('.js-win').eq(player1win).addClass('win index').text('win');
				tempTarget.find('.tr3').html('<td><div class="count">'+player1.counter+'</div></td><td></td><td><div class="count">'+player2.counter+'</div></td>');
			}else{
	        	var voteStr='<tr><td class="vote js-vote" data-id="'+player1.vote_id+'"><span>投票</span></td><td></td><td class="vote js-vote" data-id="'+player2.vote_id+'"><span>投票</span></td></tr>';
	        	var targetT3=tempTarget.find('.tr3');
	        	targetT3.before(voteStr);
	        	targetT3.html('<td><div class="count">'+exceptionCounter(player1.counter)+'</div></td><td></td><td><div class="count">'+exceptionCounter(player2.counter)+'</div></td>');
	        	var jsVotes=tempTarget.find('.js-vote');
	        	voteMap.add(player1.vote_id,jsVotes.eq(0));
				voteMap.add(player2.vote_id,jsVotes.eq(1));
				tempTarget.parents('.vs-item').addClass('fourline');
				tempTarget.addClass('fourLineItem');
				//添加投票timer
				voteendUpdate(obj);
			}
		}else if(now.getTime()>=start.getTime()&&now.getTime()<end.getTime()){
			if(!updateForce){
				liveTarget=target;
			}
			if(findToday==false){
				var startStr=obj['start'].match(/\d{2}:\d{2}/);
				if(startStr==null){
				    startStr="";
				}else{
				    startStr=startStr[0];
				}
				tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t1 c">'+startStr+'登场</div></td>');
			}else{
				liveUpdate(obj);
			}
		}else{
			//未开始
			//console.log('未开始');
			if(nextFirst==null||!updateForce){
				if(liveTarget==null){
					liveTarget=target;
					//只取一个
					nextFirst=1;
				}
			}
			if(globalTimer==null&&!!findToday){
				var uid=timerUID('timer');
				var startStr=obj['start'].match(/\d{2}:\d{2}/);
				if(startStr==null){
				    startStr="";
				}else{
				    startStr=startStr[0];
				}
				tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t1 c" id='+uid+'>'+startStr+'登场</div></td>');
				timer({
					startTime : now,
					endTime:start,
					serverOffsetTime:serverOffsetTime,
					pageStartTime:pageStartTime,
            		cdnDate:tempCdnDate,
            		getServerSuccess:getServerSuccess,
				    callback  : function(status,times){
				        if(status==1){
				        	if(parseInt(times.hours,10)<24){
				        		tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t2 c" id='+uid+'>'+startStr+'</div>后登场</td>');
				        		$("#"+uid).html(times.hours+':'+times.minitues+':'+times.seconds);
				        	}
				        }else if(status==2){
				        	//修改dom
				        	liveUpdate(obj,true);
				        }
				    }
				 });
				globalTimer=true;
			}else{
				var startStr=obj['start'].match(/\d{2}:\d{2}/);
				if(startStr==null){
				    startStr="";
				}else{
				    startStr=startStr[0];
				}
				tempTarget.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t1 c">'+startStr+'登场</div></td>');
				timerArr.push(obj);
			}
		}
		return liveTarget;
	}
	function exceptionCounter(counter){
        if(typeof counter=='undefined'||counter==null){
            return 0;
        }else{
            return counter;
        }
    }
	function updateAfter(target,obj,idx){
		var items=target.find('.vs-block');
		//for(var i=0;i<obj.length;i++){
		var tempCount=0;
		for(var key in obj){
			var tempObj=items.eq(tempCount);
			var start=obj[key]['start'].match(/\d{2}:\d{2}/);
			if(start!=null){
				start=start[0];
			}else{
				start="";
			}
			tempObj.find('.tr3').removeClass('a').addClass("c").html('<td colspan="3"><div class="t1 c">'+start+'登场</div></td>');
			tempCount++;
		}
		//}
	}
	function init(){
		loader.load('http://chang.pptv.com/api/pk', {
		__config__ : {
			cdn : true,
			callback : 'getPkList'
		}
	}, function(data){
	    	//需要更强的容错机制
	    	//var data=require('./testpk');
	       if(data.err==0){
	       		var allData=data.data;
	       		var findToday=true;
	    		var targetTodayTab=$(".notice-tab .swiper-slide.active");
	    		if(targetTodayTab.length==0){
	    			targetTodayTab=$(".notice-tab .swiper-slide").eq(0);
	    			targetTodayTab.addClass('active');
	    		}
				prevScopeId=targetTodayTab.attr('scopeid');
				var todayScopeId=prevScopeId;
       			var activeIdx=targetTodayTab.index();
       			noticeTab.slideTo(activeIdx);
	       		//目前逻辑改变，全部进行强验证
	       		var todayDomsParent=$('#pk_'+todayScopeId);
	       		var todayDoms=todayDomsParent.find(".swiper-slide");
	       		var returnData=data.data[todayScopeId];
	       		//数组下标没有从0开始
	       		//var todayCount=0;
	       		var liveTargetCount=false;
	       		var targetLive=null;
	       		if(!!returnData){
	       			for(var key in returnData){
	       				var tempTarget=updateDom(todayDoms.eq(key),returnData[key],key,false,findToday,todayScopeId);
	       				//console.log(returnData[key]);
	       				if(liveTargetCount==false&&tempTarget!=null){
	       					liveTargetCount=true;
	       					targetLive=tempTarget;
	       				}
	       				//todayCount++;
	       			}
	       		}
       			todayDomsParent.addClass('active');
	       		todayDomsParent.attr('isSwpied',1);
	       		liveSwiper=new Swiper(todayDomsParent, {
					slidesPerView: 'auto'
				});
				//初始化状态
				if(targetLive!=null){
					//swiper进行移动
					liveSwiper.slideTo(targetLive.index());
				}
				timerInterval=setInterval(function(){
                    voteMap.getVotes({
                        callback:updateUI
                    });
                },45*1000);
	       		for(var i=0;i<activeIdx;i++){
	       			var tempTab=tabAll.eq(i);
	       			var beforeScopeId=tempTab.attr('scopeid');
	       			var beforeDoms=$('#pk_'+beforeScopeId);
	       			beforeDoms=beforeDoms.find('.vs-block');
	       			var tabData=allData[beforeScopeId];
	       			if(!tabData){
	       				continue;
	       			}
	       			//var tempCount=0;
	       			for(var key in tabData){
	       				updateDom(beforeDoms.eq(key),tabData[key],key,true,true,beforeScopeId);
	       				//tempCount++;
	       			}
	       		}
	       		//更新之后的dom的开始时间
	       		for(var i=activeIdx+1;i<tabAll.length;i++){
	       			var tempTab=tabAll.eq(i);
	       			var afterScopeId=tempTab.attr('scopeid');
	       			var afterDoms=$('#pk_'+afterScopeId);
	       			afterDoms=afterDoms.find('.vs-block');
	       			var tabData=allData[afterScopeId];
	       			if(!tabData){
	       				continue;
	       			}
	       			//var tempCount=0;
	       			for(var key in tabData){
	       				updateDom(afterDoms.eq(key),tabData[key],key,true,true,afterScopeId);
	       				//tempCount++;
	       			}
	       		}
	       		//sort timerArr
	       		timerArr.sort(function(a,b){
	       			var returnVal=a.starttime.getTime()-b.starttime.getTime();
	       			if(returnVal==0){
	       				return -1;
	       			}else{
	       				return returnVal;
	       			}
	       		});
	       		finishBind();
	       }
	    });
	}
});
