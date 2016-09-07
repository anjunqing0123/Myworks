define(function(require, exports){
	var $=require('jquery');
	var Group = require('./group');
	var GroupController = require('./group-controller');
	var EventAggregator = require('../../../util/event/event-aggregator');
	require('../../../util/scroller/scroller');
	var _=require('underscore');
	// 视频分组方法
	var $wrap_preload;
	var collection=[];
	var title;
	var totalPage;
	var pageSize;
	var singleIdParam;
	var pageIdx;
	var scroller;
	/*视频分组方法*/
	var groupCreater = {
		group_episode: function(page, pageSize, total){
			var groupArray = [];
			var section = pageSize;
			var totalIndex = Math.ceil(total / pageSize);
			for(var i = 0; i < totalIndex; i++){
				var from = section * i + 1;
				var to = section * (i + 1);
				if(to > total){
					to = total;
				}
				var title = from + '-' + to;

				var activePage = totalIndex - page;

				// console.log(activePage);
				groupArray[groupArray.length] = {
					"page"	: groupArray.length + 1
					,"title"    : title
					,"url"     : ''
					,"data"    : []
					// ,"active"  : i == page - 1
					// ,"from"    : from
					// ,"i + 1"    : i + 1
					// ,"section * (i + 1)"    : section * (i + 1)
				}
				for(var j = section * i; j < section * (i + 1); j++){
					if(!j){continue;}
					var data = groupArray[groupArray.length - 1].data;
					data[data.length] = j;
				}
			}
			groupArray.reverse();
			var groups = _.map(groupArray, function(n){
				var g = new Group(n);
				return new Group(n);
			});
			log('剧集分组：', groups);
			return groups;
		}
	};
	var $container=$("#player-sidebar");
	function renderGroup(page, pageSize, total,type) {
		var ea = new EventAggregator();
	    if (pageSize >= total) {
	        $wrap_preload.find("div.numbox").hide();
	        return;
	    } else {
	        $wrap_preload.find("div.numbox").show();
	    }
	    var groupController = new GroupController(groupCreater.group_episode(page, pageSize, total), {
	        eventAggregator: ea,
	        $container: $wrap_preload.find("div.subnum"),
	        $containerMore: $wrap_preload.find("div.morenum"),
	        render: function($container, data) {
	            $container.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:void(0);" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>", {
	                data: data
	            }));
	            return $container.find('a:last');
	        },
	        renderMore: function($containerMore, data) {
	            $containerMore.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:void(0);" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>", {
	                data: data
	            }));
	        }
	    });
	    groupController.init({
	        page: page
	    });
	    var sunBtns=$container.find(".numbox a").not('.more');
	    sunBtns.removeClass('now');
	    var curActiveBtn=sunBtns.eq(page);
	    curActiveBtn.addClass('now');
	    if(page<3){
	    	$(".subnum .more").removeClass('now');
	    }else{
	    	$(".subnum .more").html(curActiveBtn.text()+'<i></i>');
	    	$(".subnum .more").addClass('now');
	    }
	    sunBtns.on('click',function(){
	    	var $obj=$(this);
	    	var sliceArr=$obj.text().split('-');
	    	var idx=sunBtns.index($obj);
	    	var renderCollection=collection.slice(sliceArr[0]-1,sliceArr[1]);
	    	renderCollections(renderCollection,idx);
	    	if(idx<3){
	    		$(".subnum .more").removeClass('now');
	    	}
	    	sunBtns.removeClass('now');
	    	$obj.addClass('now');
	    });
	}
	function renderCollections(renderCollection,page,first){
		var videos=renderCollection;
		var template_container = '<div class="module-video-program-1408">' +
			'<div class="plist">' +
				// '<h3 title="<%= title %>"><%= title %></h3>' +
				'<div class="tabcon">' +
					'<div class="collection-wrap" data-scroller-class="ui-resp-pics">' +
						'<div class="numbox">' +
							'<div class="subnum cf"></div>' +
							'<div class="morenum cf"></div>' +
						'</div>' +
						'<div class="ui-resp-pics ui-80x45 cf v-container">' +
							'<ul><!-- template_item --></ul>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div><!-- plist end -->' +
		'</div>';
		var template_video = '<li  id="video-<%= id %>" data-index="<%= count %>">' +
			'<a href="javascript:;" title="<%= title %>" class="ui-list-ct" data-id="<%= id %>">' +
				'<dl class="cf">' +
					'<dt>' +
						'<img src="<%= picurl %>">' +
						'<i></i>' +
					'</dt>' +
					'<dd>' +
						'<p class="main-tt"><%= title %></p>' +
					'</dd>' +
					'<dd>' +
						'<p class="singer"><%= real_name %></p>' +
					'</dd>' +
				'</dl>' +
			'</a>' +
		'</li>';
		if(!$wrap_preload){
			$wrap_preload = $(_.template(template_container, {
				title:title
			}));
			$container.append($wrap_preload);
		}
		var html = _.map(videos, function(video,i){
			video.count=i+pageSize*(totalPage-page-1);
			return _.template(template_video,video);
		}).join('');
		var maxHeight=$container.height()-$(".subnum").outerHeight()-$("#vod-barrage").height();
		var option = {
		    wheelPixel   : 8 // 单个图片宽度
		    , maxHeight  : maxHeight
		    , horizontal : false
		    , slideBlockSelector : 'ul'
		    , autoWrap   : false
		    ,animate: true
		};
		$container.find('ul').html(html);
		scroller=$container.find('.ui-resp-pics').ppScroller(option).scroll();
		var btns=$container.find('li');
		$container.find('.ui-resp-pics a').on('click',function(e){
			e.preventDefault();
			var btn = $(this);
			var parent=btn.parent();
			if(!parent.hasClass('now')){
				var index = btn.attr('data-id');
				scroller.scrollTo(btn.parent().position().top);
				//播放视频，第二个参数表示没什么作用
				player.goToAndPlay(index);
				btns.removeClass('now');
				parent.addClass('now');
			}
		});
		//默认play 第一个
		if(!!first){
			if(typeof singleIdParam!="undefined"){
				var curBtn=$('#video-'+params.singleid);
				var idx=curBtn.find('a').attr('data-id');
				curBtn.addClass('now');
			}else{
				var curBtn=btns.eq(0);
				curBtn.addClass('now');
				var idx=curBtn.find('a').attr('data-id');
			}
			//解决 chrome自动屏蔽插件导致用户不点视频，进而导致无法播放的问题
			if(player.isReady==true){
				player.goToAndPlay(idx);
				//删除一个像素的div,未知原因
				$(".wp-main").prevAll().each(function(){
					var obj=$(this);
					//console.log(obj.css('width'));
					if(obj.css('width')=='1px'){
						obj.css({
							width:'0px',
							height:'0px'
						});
					}
				});
			}else{
				var timerInterval=setInterval(function(){
					if(player.isReady==true){
						clearInterval(timerInterval);
						timerInterval=null;
						player.goToAndPlay(idx);
						//删除一个像素的div,未知原因
						$(".wp-main").prevAll().each(function(){
							var obj=$(this);
							//console.log(obj.css('width'));
							if(obj.css('width')=='1px'){
								obj.css({
									width:'0px',
									height:'0px'
								});
							}
						});
					}
				},1000);
			}
			scroller.scrollTo(curBtn.position().top);
			player.onRegister('nextvideo',function(){
				var $list=$container.find('.ui-resp-pics');
				var curIndex=$list.find('li.now');
				var next=curIndex.next();
				var numboxVisible=true;
				if($container.find(".numbox").css('display')=='none'){
					numboxVisible=false;
				}
				//没有分页的btn,但是是最后一集
				if(next.length==0&&numboxVisible==false){
					next=$list.find('li').first();
					nextIdx=next.find('a').attr('data-id');
					curIndex.removeClass('now');
					next.addClass('now');
					//console.log(nextIdx);
					player.goToAndPlay(nextIdx);
				//存在分页的逻辑
				}else if(next.length==0&&numboxVisible==true){
					var sunBtns=$container.find(".numbox a").not('.more');
					//console.log(sunBtns);
					var nowBtn=$container.find(".numbox a.now").not('.more');
					//console.log('nowBtn',nowBtn);
					var curIdx=sunBtns.index(nowBtn);
					//console.log(curIdx);
					var nextMoreBtn=sunBtns.eq(curIdx-1);
					nextMoreBtn.trigger('click');
					var nextbtn=$container.find('.ui-resp-pics li').last();
					var playIdx=nextbtn.find('a').attr("data-id");
					nextbtn.addClass('now');
					player.goToAndPlay(playIdx);
				}else{
					//正常下一集的逻辑
					curIndex.removeClass('now');
					next.addClass('now');
					var nextIdx=next.find('a').attr('data-id');
					player.goToAndPlay(nextIdx);
				}
			});
		}
	}
	var Loader = require('../../../util/loader/loader');
	var returnObj;
	//http://http://api.chang.pptv.com/api/video_list_areaid
	var collectionDefer=Loader.ajax({
		url: 'http://api.chang.pptv.com/api/video_list_areaid',
		data:{
			area_id:'2',
			page:'1',
			num:'10'
		},
		error: function(e){
			throw('episode load failed!', e)
		}
	});
	var params={};
	collectionDefer.done(function(data){
		//console.log(data);
		if(data.status==1&&!$.isEmptyObject(data.info)){
			var returnObj=data.info;
			/*returnObj={};
			//都是假数据
			for(i=0;i<500;i++){
				returnObj[i]={};
			}*/
			// 列表collection
			var page=0;
			var specialPage;
			var singleIdx;
			//collection 需要额外处理
			for(var key in returnObj){
				var tempObj={};
				//用户真实姓名
				/*tempObj.real_name=returnObj[key].playerinfo.real_name;
				tempObj.picurl=returnObj[key].dpinfo.picurl;
				tempObj.title=returnObj[key].dpinfo.title;
				tempObj.id=returnObj[key].cid;*/
				// fake json
				tempObj.real_name='zhangjin';
				tempObj.picurl='http://sr3.pplive.com/cms/18/85/942c16f918cfe2b712cf7a1c8f06137d.jpg';
				tempObj.title='daskjdkasjkejqweqweq';
				tempObj.id='23567981';
				collection.push(tempObj);
			}
			//整理collection结束
			pageSize=data.pageSize ? data.pageSize : params.pageSize ? params.pageSize : 100;
			var total=collection.length;
			totalPage=Math.ceil(total/pageSize);
			var playList=_.pluck(collection,'id');
			player.resetList(playList,playList[0]);
			var renderFirstCollection;
			if(total>pageSize){
				var size;
				if((size=-total%pageSize)==0){
					size=-pageSize;
				}
				renderFirstCollection=collection.slice(size);
			}else{
				renderFirstCollection=collection;
			}
			if(typeof specialPage!="undefined"){
				page=specialPage;
				renderFirstCollection=collection.slice(pageIdx*pageSize,(pageIdx+1)*pageSize);
			}
			renderCollections(renderFirstCollection,page,true);
			renderGroup(page, pageSize, total,'collections');
		}
	});
});
