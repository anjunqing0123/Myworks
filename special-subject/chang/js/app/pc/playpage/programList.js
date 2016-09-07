define(function(require, exports){
	var username=window.username;
	if(!username){
		return false;
	}
	var isClient = function(){
	    //是否是客户端
	    try{
	        if(external && external.GetObject){
	            return true;
	        }
	    }catch(e){}
	    return false;
	}();
	var $=require('jquery');
	var Group = require('../index/group');
	var GroupController = require('../index/group-controller');
	var EventAggregator = require('../../../util/event/event-aggregator');
	var loader=require('../../../util/loader/loader');
	var urls=require('../../../util/linkcfg/interfaceurl');
	require('../../../util/scroller/scroller');
	var _=require('underscore');
	// 视频分组方法
	var $wrap_preload;
	var collection=[];
	var title;
	var totalPage;
	var pageSize;
	var singleIdParam;
	var singleId=webcfg['id'];
	var pageIdx;
	var scroller;
	var isRirect=true;
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
	            $container.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:void(0);" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
	                data: data
	            }));
	            return $container.find('a:last');
	        },
	        renderMore: function($containerMore, data) {
	            $containerMore.append(_.template("<% _.each(data, function(n, i){%>" + '<a href="javascript:void(0);" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' + "<% }); %>")({
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
			'<a href="<%=link %>" title="<%= title %>" class="ui-list-ct" data-id="<%= id %>">' +
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
			$wrap_preload = $(_.template(template_container)({
				title:title
			}));
			$container.append($wrap_preload);
		}
		//取username不对
		var domRealName=$.trim($(".module-info p:first a").html());
		var html = _.map(videos, function(video,i){
			video.count=i+pageSize*(totalPage-page-1);
			video.real_name=domRealName;
			var tempFunc=_.template(template_video);
			return tempFunc(video);
		}).join('');
		var maxHeight=$container.height()-$(".subnum").outerHeight()+35;
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
		$.subscribe1('player.resize', resizeSideBar);
		//设定timer，不然ie6要崩溃
		var resiseTimer=null;
		function resizeSideBar(){
			if(resiseTimer!=null){
				clearTimeout(resiseTimer);
				resiseTimer=null;
			}
			resiseTimer=setTimeout(function(){
				var maxHeight=$container.height()-$(".subnum").outerHeight()+$("#vod-barrage").height();
				var nowBtn=$container.find("li.now");
				var option = {
				    wheelPixel   : 8 // 单个图片宽度
				    , maxHeight  : maxHeight
				    , horizontal : false
				    , slideBlockSelector : 'ul'
				    , autoWrap   : false
				    ,animate: false
				};
				scroller.destory();
				scroller=$container.find('.ui-resp-pics').ppScroller(option).scroll();
				scroller.scrollTo(nowBtn.position().top);
			},500);
		}
		var btns=$container.find('li');
		$container.find('.ui-resp-pics a').on('click',function(e){
			e.preventDefault();
			if(!!isRirect){
				var btn = $(this);
				var tempHref=btn.attr('href');
				window.location=tempHref;
			}else{
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
			}
		});
		//默认play 第一个
		if(!!first){
			if(typeof singleIdParam!="undefined"){
				var curBtn=$('#video-'+singleId);
				var idx=curBtn.find('a').attr('data-id');
				curBtn.addClass('now');
			}else{
				var curBtn=btns.eq(0);
				curBtn.addClass('now');
				var idx=curBtn.find('a').attr('data-id');
			}
			//解决 chrome自动屏蔽插件导致用户不点视频，进而导致无法播放的问题
			if(player.isReady==true){
				scroller.scrollTo(curBtn.position().top);
				//player.goToAndPlay(idx);
				//删除一个像素的div,未知原因
				/*$(".wp-main").prevAll().each(function(){
					var obj=$(this);
					//console.log(obj.css('width'));
					if(obj.css('width')=='1px'){
						obj.css({
							width:'0px',
							height:'0px'
						});
					}
				});*/
			}else{
				var timerInterval=setInterval(function(){
					if(player.isReady==true){
						clearInterval(timerInterval);
						timerInterval=null;
						player.goToAndPlay(idx);
						//删除一个像素的div,未知原因
						/*$(".wp-main").prevAll().each(function(){
							var obj=$(this);
							//console.log(obj.css('width'));
							if(obj.css('width')=='1px'){
								obj.css({
									width:'0px',
									height:'0px'
								});
							}
						});*/
					}
				},1000);
			}
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
					if(!!isRirect){
						nextIdx=next.find('a');
						window.location=nextIdx.attr('href');
					}else{
						nextIdx=next.find('a').attr('data-id');
						curIndex.removeClass('now');
						next.addClass('now');
						//console.log(nextIdx);
						player.goToAndPlay(nextIdx);
					}
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
					if(!!isRirect){
						var playIdx=nextbtn.find('a');
						window.location=playIdx.attr('href');
					}else{
						var playIdx=nextbtn.find('a').attr("data-id");
						nextbtn.addClass('now');
						player.goToAndPlay(playIdx);
					}

				}else{
					//正常下一集的逻辑
					if(!!isRirect){
						var nextIdx=next.find('a');
						window.location=nextIdx.attr('href');
					}else{
						curIndex.removeClass('now');
						next.addClass('now');
						var nextIdx=next.find('a').attr('data-id');
						player.goToAndPlay(nextIdx);
					}

				}
			});
		}
	}
	var returnObj;
	var tempData={
		username:username,
		scope:window.game_scope
	}
	tempData.__config__={
		cdn:true,
		callback:'updatePlayerList'
	};
	tempData.plt='pc';
	var params={};
	loader.load(urls['interface']['videoList'],tempData,function(data){
		if(data.err=="0"){
			var data=data.data;
			if(!$.isEmptyObject(data.info)){
				var returnObj=data.info;
				var newObj={}
				_.each(returnObj,function(obj,key){
					if(obj.status==1){
						newObj[key]=obj;
					}
				});
				returnObj=newObj;
				//console.log(returnObj);
				/*returnObj={};
				//都是假数据
				for(i=0;i<500;i++){
					returnObj[i]={};
				}*/
				// 列表collection
				var page=0;
				var specialPage;
				var singleIdx;
				//console.log(returnObj);
				//collection 需要额外处理
				for(var key in returnObj){
					var tempInfo=returnObj[key]['dpinfo']
					var tempObj={};
					//用户真实姓名
					/*tempObj.real_name=returnObj[key].playerinfo.real_name;
					tempObj.picurl=returnObj[key].dpinfo.picurl;
					tempObj.title=returnObj[key].dpinfo.title;
					tempObj.id=returnObj[key].cid;*/
					// fake json
					//tempObj.real_name=returnObj[key]['playerinfo']['real_name'];
					tempObj.picurl=tempInfo['picurl'];
					tempObj.title=tempInfo['title'];
					tempObj.type=returnObj[key]['type'];
					tempObj.id=key;
					if(!!isClient){
						tempObj.link=returnObj[key]['pc_link'];
					}else{
						tempObj.link=returnObj[key]['web_link'];
					}
					//tempObj.id=webcfg['id'];
					//tempObj.id=17534497;
					collection.push(tempObj);
				}
				var groupObj=_.groupBy(collection,function(obj){
					return obj.type;
				});
				var tempCollection=_.sortBy(groupObj,function(obj,key){
					return -key;
				});
				//console.log(tempCollection);
				collection=_.flatten(tempCollection);
				//console.log('collection',collection);
				//整理collection结束
				pageSize=data.pageSize ? data.pageSize : params.pageSize ? params.pageSize : 100;
				var total=collection.length;
				totalPage=Math.ceil(total/pageSize);
				var playList=_.map(collection,function(video,idx){
						//传入的必须是string 类型，不然就会报错
						//console.log(video);
						//console.log('singleId',singleId);
						if(!!singleId&&video.id==singleId){
							//console.log("找到id");
							singleIdParam=video.id;
							singleIdx=idx;
							pageIdx=Math.floor((singleIdx)/pageSize);
							specialPage=totalPage-1-pageIdx;
						}
						return video.id.toString();
				});
				if(!!singleIdParam){
					player.resetList(playList,singleIdParam);
				}else{
					player.resetList(playList,playList[0]);
				}
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
		}
	});
});
