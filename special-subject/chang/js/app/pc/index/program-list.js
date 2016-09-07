
/**
 * @Description 播放页逻辑
 * @Author 		YanYang
 * @Qq			175225632
 * @Data		2014/9/26
 */
define(function(require, exports){
	//添加依赖
    require('../../../util/pub/main');
	var $ = require('jquery');
	var client= require('client');
	// Publish/Subscribe
	if(typeof $.subscribe1!="function"){
		(function($) {
		    var o = $({});
		    // call比apply速度快
		    $.subscribe = function(a, b) {
		        o.on.call(o, a, b);
		    };
		    $.subscribe1 = function(a, b) {
		        o.on.call(o, a, function() {
		            //舍弃第一个参数event
		            var a = arguments;
		            b.call(o, a[1], a[2], a[3], a[4]);
		        });
		    };
		    $.unsubscribe = function(a, b) {
		        o.off.call(o, a, b);
		    };
		    $.publish = function(a, b) {
		        o.trigger.call(o, a, b);
		    };
		    $.publish1 = function(a, b, c, d, e) {
		        o.trigger.call(o, a, [ b, c, d, e ]);
		    };
		})($);
	}
	var _ = require('underscore');
	var Loader = require('../../../util/loader/loader');
	var formatDate = require('../../../util/date/format');
	var EventAggregator = require('../../../util/event/event-aggregator');

	require('../../../util/scroller/scroller');

	var Video = require('./video');
	var VideoController = require('./video-controller');
	var Group = require('./group');
	var GroupController = require('./group-controller');
	var LivingController = require('./living-controller');
	var Mod = require('./module');


	var PAGESIZE = {
		episode: 100,
		collection: 1000
	};


	var webcfg = window.webcfg || {};


	/**
	 * current_webcfg 【当前播放视频的webcfg】
	 * 1.保存正在播放video相关信息，不覆盖原有信息
	 * 2.通过$来监听和发布相关信息修改
	 */
	window.current_webcfg = {};
	_.extend(current_webcfg, {
		set: function(attr, value){
			this[attr] = value;
			//TODO: bind function when change attr.
		},
		get: function(attr){
			if(this[attr] !== undefined){
				return this[attr];
			}else{
				return webcfg[attr];
			}
		}
	});

	$.subscribe1('webcfg.change', function(attr, value){
		current_webcfg.set(attr, value);
	});

	var player = window.player;
	// if(!player){
	// 	throw('player is not define!');
	// }

	/*视频数据接口*/
	var Data = {
		episode: function(opt, callback){
			var params = _.extend({
				pid: 10034216 // !webcfg 中的 pid
				,page: 1
				,pageSize: PAGESIZE.episode
				,cat_id: current_webcfg.get('cat_id')
			}, opt);

			if(params.page == null){
				delete params.page;
			}
			Loader.ajax({
				url: 'http://v.pptv.com/show/videoList?',
				data: params,
				jsonpCallback: 'videoList',
				success: function(data){
					log('【剧集接口http://v.pptv.com/show/videoList?】');
					log('param:', params);
					log('return:', data);
					callback(data);
				},
				error: function(e){
					throw('episode load failed!', e)
				}
			});
		},
		collection: function(opt, callback){
			var params = _.extend({
				pid: 950471 // !webcfg 中的 pid
				,page: 1
				,pageSize: PAGESIZE.collection
				,cat_id: current_webcfg.get('cat_id')
			}, opt);

			Loader.ajax({
				url: 'http://v.pptv.com/show/videoList?',
				data: params,
				jsonpCallback: 'videoList',
				success: function(data){
					log('【合集接口http://v.pptv.com/show/videoList?】');
					log('param:', params);
					log('return:', data);
					callback(data);
				},
				error: function(e){
					log(e);
					throw('collection load failed!');
				}
			})
		},
		living: function(opt, callback){
			var params = _.extend({
				pid: 300170 // !webcfg 中的 pid
				,page: 1
				,cat_id: current_webcfg.get('cat_id')
			}, opt);
			Loader.ajax({
				url: 'http://v.pptv.com/show/videoList?',
				data: params,
				jsonpCallback: 'videoList',
				success: function(data){
					log('【直播接口http://v.pptv.com/show/videoList?】');
					log('param:', params);
					log('return:', data);
					callback(data);
				},
				error: function(e){
					log(e);
					throw('living load failed!');
				}
			});
		}
	};

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
		},
		/**
		 * [group_living 直播分组数据]
		 * @param  {[int]} page [最大页的日期-今天的日期，例如：从明天开始输出就是1]
		 * @param  {[int]} size [个数]
		 * @param  {[Date]} date [当前时间/服务器时间]
		 * @return {[Array]}
		 */
		group_living: function(page, size, date){
			var date = date || new Date();
			var timeStamp = parseInt(date.valueOf());
			var day = 1000 * 60 * 60 * 24;
			var page = page || 1; //默认明天开始
			var size = size || 7; //显示日期个数

			var start = 1 + page; // 开始输出的日期 = 今天 + 相差日期
			var end = start - size;
			var groupArray = [];
			while(start > end){
				var cDate = new Date(timeStamp + day * (start - 1));
				groupArray.push({
					"date"    : cDate
					,"page"   : start
					,"title"  : start == 1 ? '今天' : formatDate(cDate, 'MM月DD日')
					,"url"    : ''
					,"data"   : []
					,"active" : start == 1 ? true : false
				});
				start -= 1;
			}
			// groupArray.reverse();
			var groups = _.map(groupArray, function(n){
				var g = new Group(n);
				return new Group(n);
			});
			log('[simulate data] 直播分组：', groups);
			return groups;
		}
	};

	var StateHTML = {
		over: '<i class="over"></i>已结束，可回看',
		onair: '<i class="playing"></i>正在直播',
		now: '<i class="playing"></i>正在回播',
		normal: '<i class="nobook"></i>未订阅'
	};

	/*直播视频状态控制器-用来刷新直播节目的状态（可回看，直播，订阅，已订阅）*/
	var VideoTypeController = {
		idPrefix: 'video-',
		/**
		 * @param  {Video Array}   videos   [需要渲染的视频集合]
		 * @param  {Function} callback [将正在播放的视频最为第一个参数的回调方法]
		 */
		init: function(videos, callback){
			this.videos = videos;
			this.map(callback);

			this.curVideo = null;
		},
		map: function(callback){
			var self = this;
			CurTime.get(function(time){

				_.each(self.videos, function(n){
					if(n.etime < time){
						// console.log(1,n,time);
						// 已结束
					}else if(time < n.etime && n.stime < time){
						// console.log(2,n,time);
						$('#' + self.idPrefix + n.stime).addClass('now on-air').find('.state').html(StateHTML.onair);
						self.curVideo = n;
					}else if(time < n.stime){
						// console.log(3,n,time);
						$('#' + self.idPrefix + n.stime).addClass('cant-play').find('.state').html(StateHTML.normal);
					}
				})
				self.curVideo && callback && callback(self.curVideo);
			})
		},
		position: function(posi){
			this.curPosi = posi;
			if(posi > this.curVideo.etime){
				this._nextVideo && this._nextVideo();
			}
		},
		nextVideo: function(fn){
			this._nextVideo = fn;
		}
	};

	/*接收player返回的当前时间*/
	var CurTime = {
		cb: $.Callbacks(),
		live: 0,
		posi: 0,
		set: function(live, posi){
			this.live = live;
			this.posi = posi
			if(this.live && this.posi && this.cb){
				this.cb.fire(live, posi);
				this.cb.empty();
				this.cb = null
			}

		},
		get: function(cb){
			if(this.live && this.posi){
				cb && cb(this.live, this.posi);
				return this.live;
			}else{
				this.cb.add(cb);
			}

		}
	};

	/*计算sidebar列表区域高度*/
	var heightCtrl = function() {
		var total = 'total';
		var hash = {};
		var _get = function(name){
			// console.log(name, typeof this[name]);
			if(typeof hash[name] === 'object'){
				return hash[name].is(':hidden') ? 0 : hash[name].height();
			}else{
				return hash[name];
			}
		}
		return {
			height: function(name, value){
				hash[name] = value;
			},
			count: function(){
				var height = _get(total);
				for(var n in hash){
					if(n !== total){
						height -= _get(n);
					}
				}
				return height;
			}
		}
	};


	/*直播DEMO*/
	function renderLiving($wrap, player, tools){
		var ea = new EventAggregator();
		ea.subscribe('reflashProgram', function(){
			// scrollToCurrentHandler();
			groupController.init({
				page: 1
			});
		});

		var template_container = '' +
		'<div class="module-video-live-1408" style="display:;">' +
			'<h3 title="<%= title %>"><%= title %></h3>' +
			'<div class="tabcon">' +
				'<div class="liveprogram" data-scroller-class="liveprogram-wrap">' +
					'<div class="numbox">' +
						'<div class="subnum cf">' +
						'</div><!-- subnum end -->' +
						'<div class="morenum cf">' +
						'</div><!-- morenum end -->' +
					'</div>' +
					'<div class="liveprogram-wrap">' +
						'<ul></ul>' +
					'</div>' +
				'</div>' +
				'<div id="barrage" style="display:none"></div>' +
			'</div>' +
		'</div>';
		var template_video ='<li id="video-<%= stime %>" data-start-time="<%= stime %>">' + // hover now
				'<em class="time"><%= begin_time.substr(0, 5) %></em>' +
				'<p>' +
					'<span class=""><%= title %></span>' +
					'<span class="state">'+ StateHTML.over +'</span>' +
				'</p>' +
			'</li>';
		var videoController = new LivingController('living', {
			eventAggregator: ea
		});
		var tempFunc=_.template(template_container);
		var $wrap_preload = $(tempFunc({
			title: current_webcfg.get('p_title')
		}));
		var $container = $wrap_preload.find('div.liveprogram-wrap');
		var scrollTop = 0;
		var scroller;

		$container.on('click', 'li',function(e){
			/*直播播放不需要id, 用startTime作为key，来定位视频*/
			e.preventDefault();
			var btn = $(this);
			if(!btn.hasClass('cant-play') && !btn.hasClass('hover')){
				var startTime = $(this).attr('data-start-time');
				videoController.play(startTime, btn.hasClass('on-air'));
			}
		});


		if(player){
			player.onRegister('nextvideo', function(){
				videoController.playNext();
				scrollToCurrentHandler();
			});

			player.onRegister('position', function(data){
				/*Vod: 0live: 1413260861posi: 1413260860*/
				var data = data.body.data;
				CurTime.set(data.live, data.posi);


				if(data.posi > videoController.currentVideo.etime){
					videoController.playNext();
					scrollToCurrentHandler();
				}
		    });

			player.onRegister('golive', function(){
				var startTime = $container.find('.on-air').attr('data-start-time');
	    		videoController.play(startTime, true);
	    		scrollToCurrentHandler();

				groupController.onSelectHandler(1, $.Callbacks().add(function(){
					var startTime = $container.find('.on-air').attr('data-start-time');
		    		videoController.play(startTime, true);
		    		scrollToCurrentHandler();
				})); //选择当天

			});
		}

		ea.subscribe('videoController.getCurTime', function(callback){
			callback(CurTime.live, CurTime.posi);
		});

		/*测试自动播放下一级，勿删*/
		/*$wrap_preload.on('click', 'li.cant-play', function(e){
			var stime = $(this).attr('data-start-time');
			ea.publish('videoController.afterPlay', {
				stime: stime
			});
		});*/

		ea.subscribe('videoController.afterPlay', function(video){
			var oldVideo = $container.find('li.now').removeClass('now');
			if(!oldVideo.hasClass('on-air')){
				oldVideo.find('.state').html(StateHTML.over);
			}

			var newVideo = $('#video-' + video.stime).addClass('now');
			if(!newVideo.hasClass('cant-play')){
				if(!newVideo.hasClass('on-air')){
					newVideo.find('.state').html(StateHTML.now);
				}
			}else{
				//自动播放到新的时间段
				$container.find('li.on-air').removeClass('on-air').find('.state').html(StateHTML.over);
				newVideo.addClass('on-air').find('.state').html(StateHTML.onair);
			}

		});

		var scrollToCurrentHandler = function(){
			var now = $container.find('li.now');
			if(now.length){
				var h = now.outerHeight();
				tools.scroller.scrollTo($container.find('li.now').position().top - 2 * h);
			}
		}


		tools.afterResize = function(){
			scrollToCurrentHandler()
		}

		var mod = new Mod({
			$wrap: $wrap || $('#player-sidebar'),
			$container: $container,
			renderWrap: function($wrap){
				$wrap.empty().append($wrap_preload);
			},
			render: function($container, videos){
				log('[render videos]', videos);
				var html = _.map(videos, function(video){
					return video.render(template_video);
				}).join('');

				$container.find('ul').empty().append(html);


				CurTime.get(function(live, posi){
					var idPrefix = 'video-';
					videoController.each(function(video){
						// console.log('111',video.etime, time);
						if(video.etime < live){
							// console.log(1,video,time);
							// 已结束
						}else if(live < video.etime && video.stime < live){
							// console.log(2,video,time);
							$('#' + idPrefix + video.stime).addClass('on-air').find('.state').html(StateHTML.onair);
							videoController.setCurVideo(video);
						}else if(live < video.stime){
							// console.log(3,video,time);
							$('#' + idPrefix + video.stime).addClass('cant-play').find('.state').html(StateHTML.normal);
						}

						if(posi < video.etime && video.stime < posi){
							// console.log(2,video,time);
							$('#' + idPrefix + video.stime).addClass('now on-air').find('.state').html(StateHTML.onair);
							videoController.setCurVideo(video);
						}
					});

					tools.containerResize($container, $wrap_preload.find('div.numbox').height());
				});

				// $(document).on('click',function(e){
				// 	videoController.playNext();
				// 	scrollToCurrentHandler();
				// });
			}
		});
		mod.init();
		loadData(1);  //加载今天数据

		var groupController = new GroupController(groupCreater.group_living(), {
			eventAggregator: ea,
			$container: $wrap_preload.find('div.subnum'),
			$containerMore: $wrap_preload.find('div.morenum'),
			render: function($container, data){
				$container.empty().append(_.template(
					'<% _.each(data, function(n, i){%>' +
					'<a href="javascript:;" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' +
					'<% }); %>'
				)({
						"data": data
					}));
				return $container.find('a:last');
			},
			renderMore: function($containerMore, data){
				$containerMore.append(_.template(
					'<% _.each(data, function(n, i){%>' +
					'<a href="javascript:;" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' +
					'<% }); %>'
				)({
						"data": data
					}));
			}
		});

		groupController.init({
			page: 1
		});

		ea.subscribe('changePage', function(group, callbacks){
			$container.find('ul').empty();
			loadData(group.page, callbacks);
		});

		function loadData(page, callbacks){
			Data.living({
				pid: current_webcfg.get('id'),
				page: page
			},function(data){
				if(!data.err){
					videoController.empty();
					var videos = _.map(data.data.list, function(n){
						n.id = n.begin_time.replace(/:/g, '');
						var video = new Video(n);
						videoController.push(video, {
							isPlaying: false //webcfg.id == n.id
						});

						return video;
					});
					mod.loadData(videos);

					if(callbacks && typeof callbacks == 'function'){
						callbacks();
					}else if(callbacks){
						callbacks.fire();
					}
				}
			});
		}
	}

	/*合集DEMO*/
	function renderCollection($wrap, player, tools){
		var ea = new EventAggregator();
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
		var template_video = '<li  id="video-<%= id %>" class="<% if(isPlaying){ %>now <% }%>">' +
				'<a href="javascript:;" title="<%= title %>" class="ui-list-ct" data-id="<%= id %>">' +
					'<dl class="cf">' +
						'<dt>' +
							'<img src="http://s1.pplive.cn/v/cap/<%= id %>/w120.jpg">' +
							'<i></i>' +
						'</dt>' +
						'<dd>' +
							'<p class="main-tt"><%= epTitle %></p>' +
						'</dd>' +
					'</dl>' +
				'</a>' +
			'</li>';
		var videoController = new VideoController('collection', {
			eventAggregator : ea
			,redirect       : false
		});
		var tempFunc=_.template(template_container);
		var $wrap_preload = $(tempFunc({
			title: current_webcfg.get('p_title')
		}));
		var $container = $wrap_preload.find('.v-container');
		var page = 1;
		var total, pageSize = PAGESIZE.collection;
		var scrollTop = 0;
		var scroller;
		var maxPage, autoType;

		$container.on('click', 'a',function(e){
			var btn = $(this);
            e.preventDefault();
            var id = btn.attr("data-id");
            var parent=btn.parent();
            var idx=parent.index();
            if (client.isClient()) {
                parent.siblings().removeClass('now');
                parent.addClass('now');
                client.playById(id, 0, id, true);
            } else if (window.player) {
                videoController.play(id);
            }
		});
		//剧集新增scroll mask的逻辑,需要优化
		if($(".mask1").length!=0){
			$(".mask1").on("click",function(e){
				var mouseOffset=e.offsetY;
				var scroll=tools.scroller;
				var targetUl=scroll.find('ul');
				var tempTop=Math.abs(parseInt(targetUl.css('top')));
				var targetLi=targetUl.find('li');
				var itemHeight=targetLi.height();
				var finalH=mouseOffset+tempTop;
				var index=Math.floor(finalH/itemHeight);
				var targetVideo=targetLi.eq(index).find('a').attr('data-id');
				videoController.play(targetVideo);
			});
			$(".mask2").on("click",function(e){
				var mouseOffset=e.offsetY;
				var tempH=parseInt($(".play-sidebar").height());
				var maskH=parseInt($(this).height());
				var scroll=tools.scroller;
				var targetUl=scroll.find('ul');
				var tempTop=Math.abs(parseInt(targetUl.css('top')));
				var targetLi=targetUl.find('li');
				var itemHeight=targetLi.height();
				var finalH=tempH-maskH+mouseOffset+tempTop;
				var index=Math.floor(finalH/itemHeight);
				var targetVideo=targetLi.eq(index).find('a').attr('data-id');
				videoController.play(targetVideo);
			});
		}
		if(player){
			player.onRegister('nextvideo', function(data){
				//TODO: rcc_src
				try{
					videoController.playNext({rcc: data.body.data.autoPlayNext ? 'B1' : 'B2'});//B1: 自动播放下一集 | B2: 手动下一集
					scrollToCurrentHandler();
				}catch(e){}
			});

			player.onRegister('position', function(data){
		    	//console.log(data);
		    })

		    player.onModeChanged.add(function(a){
		        if(a == 3){
		        	videoController.attr('redirect', false);
		        }else{
		        	videoController.attr('redirect', true);
		        }
		    });
		}

		ea.subscribe('videoController.afterPlay', function(video){
			var DomVideo = $('#video-' + video.id);
			DomVideo.parent().find('li').removeClass('now');
			$('#video-' + video.id).addClass('now');
			// scrollToCurrentHandler();
		});


		var scrollToCurrentHandler = function(){
			var now = $container.find('li.now');
			if(now.length){
				var h = now.outerHeight();
				tools.scroller.scrollTo($container.find('li.now').position().top - 2 * h);
			}
		}

		tools.afterResize = function(){
			scrollToCurrentHandler()
		}

		var mod = new Mod({
			$wrap: $wrap || $('#player-sidebar-demo'),
			$container: $container,
			renderWrap: function($wrap){
				$wrap.empty().append($wrap_preload);
			},
			render: function($container, videos){
				log('[render videos]', videos);
				var html = _.map(videos, function(video){
					return video.render(template_video);
				}).join('');

				$container.find('ul').empty().append(html);

				tools.containerResize($container, $wrap_preload.find('div.numbox').height())
			}
		});

		mod.init();

		var firstLoad = 1;

		loadData(page, function(page){
				renderGroup(page);
			});

		function loadData(page, callbacks){
			var param = {
				pid       : current_webcfg.get('pid')
				,page     : page
				,maxPage  : maxPage || ''
				,autoType : autoType || ''
			}

			if(firstLoad){
				param.highlight = current_webcfg.get('id'); // page传null，用highlight定位id所在分页
				firstLoad = 0;
			}

			Data.collection(param, function(data){
				if(!data.err){
					page = data.data.page;
					total = data.data.total;
					maxPage = data.data.maxPage;
					autoType = data.data.autoType;
					videoController.empty();
					var videos = _.map(data.data.list, function(n){
						var video = new Video(n);
						videoController.push(video, {
							isPlaying: current_webcfg.get('id') == n.id
						});
						return video;
					});
					mod.loadData(videos);

					if(callbacks && typeof callbacks == 'function'){
						callbacks(page);
					}else if(callbacks){
						callbacks.fire();
						callbacks.empty();
						callbacks = null;
					}
				}else{}
			});
		}

		function renderGroup(page){
			if(pageSize >= total){
				$wrap_preload.find('div.numbox').hide();
				tools.containerResize($container, 0);
				return;
			}else{
				$wrap_preload.find('div.numbox').show();
				tools.containerResize($container, $wrap_preload.find('div.numbox').height());
			}

			var groupController = new GroupController(groupCreater.group_episode(page, pageSize, total), {
				eventAggregator: ea,
				$container: $wrap_preload.find('div.subnum'),
				$containerMore: $wrap_preload.find('div.morenum'),
				render: function($container, data){
					$container.append(_.template(
						'<% _.each(data, function(n, i){%>' +
						'<a href="javascript:;" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' +
						'<% }); %>'
					)({
							"data": data
						}));

					return $container.find('a:last');
				},
				renderMore: function($containerMore, data){
					$containerMore.append(_.template(
						'<% _.each(data, function(n, i){%>' +
						'<a href="javascript:;" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' +
						'<% }); %>'
					)({
							"data": data
						}));
				}
			});

			groupController.init({
				page: page
			});
			ea.subscribe('changePage', function(group, callbacks){
				$container.append('<div class="loading" style="background:#333;position:absolute; top:0px; text-align:center; width:100%; height:100%; opacity: .7; filter:alpha(opacity=70)"><span style="position:absolute; width:100%; top:49%; left:0; color:#fff">加载中...</span></div>');
				callbacks.add(function(){
					$container.find('div.loading').remove();
				})
				loadData(group.page, callbacks);
			})
		}
	};

	/*剧集DEMO*/
	function renderEpisode($wrap, player, tools){
		var ea = new EventAggregator();
		var template_container = '' +
		'<div class="module-video-num-1408">' +
			'<div class="plist">' +
				'<h3 title="<%= title %>"><%= title %></h3>' +
				'<div class="tabcon">' +
					'<div class="episode-wrap" data-scroller-class="pnums">' +
						'<div class="numbox">' +
							'<div class="subnum cf"></div>' +
							'<div class="morenum cf"></div>' +
						'</div>' +
						'<div class="pnums">' +
							'<ul class="cf"><!-- template_item --></ul>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div><!-- plist end -->' +
		'</div>';
		var template_video = '<li  id="video-<%= id %>" class="<% if(isPlaying){ %>now <% }%>"><a href="<%= url %>" data-id="<%= id %>" title="<%= title %>"><%= Number(epTitle) == epTitle ? epTitle : epIndex %><% if(isTrailer){ %><i class="forecast"></i><% } %></a></li>';
		var videoController = new VideoController('episode', {
			eventAggregator : ea
			,redirect       : true
		});
		var tempFunc=_.template(template_container);
		var $wrap_preload = $(tempFunc({
			title: current_webcfg.get('p_title')
		}));
		var $container = $wrap_preload.find('div.pnums');
		var page, total, pageSize;

		$container.on('click', 'a',function(e){
			e.preventDefault();
			var btn = $(this);
			if(!btn.parent().hasClass('now')){
				var id = $(this).attr('data-id');
				videoController.play(id);
			}
		});

		if(player){
			player.onRegister('nextvideo', function(data){
				//TODO: rcc_src
				try{
					videoController.playNext({rcc: data.body.data.autoPlayNext ? 'B1' : 'B2'});//B1: 自动播放下一集 | B2: 手动下一集
					scrollToCurrentHandler();
				}catch(e){}
			});

			player.onRegister('position', function(data){
		    	//console.log(data);
		    })

		    player.onModeChanged.add(function(a){
		        if(a == 3){
		        	videoController.attr('redirect', false);
		        }else{
		        	videoController.attr('redirect', true);
		        }
		    });
		}

		ea.subscribe('videoController.afterPlay', function(video){
			var DomVideo = $('#video-' + video.id);
			DomVideo.parent().find('li').removeClass('now');
			$('#video-' + video.id).addClass('now');
			// scrollToCurrentHandler();
		});

		var scrollToCurrentHandler = function(){
			var now = $container.find('li.now');
			if(now.length){
				var h = now.outerHeight();
				tools.scroller.scrollTo(now.position().top - 2 * h);
			}
		}


		tools.afterResize = function(){
			scrollToCurrentHandler()
		}

		var mod = new Mod({
			$wrap: $wrap || $('#player-sidebar-juji'),
			$container: $container,
			renderWrap: function($wrap){
				$wrap.empty().append($wrap_preload)
			},
			render: function($container, videos){
				log('[render videos]', videos);
				var html = _.map(videos, function(video){
					return video.render(template_video);
				}).join('');
				$container.find('ul').empty().append(html);

				tools.containerResize($container, $wrap_preload.find('div.numbox').height())
			}
		});
		mod.init();

		var callbacks = $.Callbacks();

		loadData(null, function(page, pageSize, total){
			renderGroup(page, pageSize, total)
		});


		function loadData(page, callbacks){
			var param = {
				pid        : current_webcfg.get('pid')
				,page      : page
			}

			if(page == null){
				param.highlight = current_webcfg.get('id'); // page传null，用highlight定位id所在分页
			}
			Data.episode(param, function(data){
				if(!data.err){
					videoController.empty();
					var startIndex = data.data.pageSize * (data.data.page - 1);
					var videos = _.map(data.data.list, function(n){
						var video = new Video(n);
						startIndex += 1;
						videoController.push(video, {
							epIndex: startIndex,
							isPlaying: current_webcfg.get('id') == n.id
							// isPlaying: page === null && webcfg.id == n.id // page为null第一次加载时，才定义正在播放的视频
						});
						return video;
					});
					mod.loadData(videos);
					var data = data.data;

					if(callbacks && typeof callbacks == 'function'){
						//第一次加载进这里
						callbacks(data.page, data.pageSize, data.total);
					}else if(callbacks){
						callbacks.fire();
					}
				}
			});
		}

		function renderGroup(page, pageSize, total){
			if(pageSize >= total){
				$wrap_preload.find('div.numbox').hide();
				tools.containerResize($container, $wrap_preload.find('div.numbox').height())
				return;
			}else{
				$wrap_preload.find('div.numbox').show();
				tools.containerResize($container, $wrap_preload.find('div.numbox').height())
			}


			var groupController = new GroupController(groupCreater.group_episode(page, pageSize, total), {
				eventAggregator: ea,
				$container: $wrap_preload.find('div.subnum'),
				$containerMore: $wrap_preload.find('div.morenum'),
				render: function($container, data){
					$container.append(_.template(
						'<% _.each(data, function(n, i){%>' +
						'<a href="javascript:;" title="" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' +
						'<% }); %>'
					)({
							"data": data
						}));

					return $container.find('a:last');
				},
				renderMore: function($containerMore, data){
					$containerMore.append(_.template(
						'<% _.each(data, function(n, i){%>' +
						'<a href="javascript:;" title="<%= n.title %>" <% if(n.active){print(\'class="now"\')} %>><%= n.title %></a>' +
						'<% }); %>'
					),{
							"data": data
						});
				}
			});

			groupController.init({
				page: page
			});
			ea.subscribe('changePage', function(group, callbacks){
				$container.append('<div class="loading" style="background:#333;position:absolute; top:0px; text-align:center; width:100%; height:100%; opacity: .7; filter:alpha(opacity=70)"><span style="position:absolute; width:100%; top:49%; left:0; color:#fff">加载中...</span></div>');
				page = group.page;
				callbacks.add(function(){
					$container.find('div.loading').remove();
				})
				loadData(group.page, callbacks);
			})
		}
	};

	function renderSports($wrap, player){
		var $tab = $wrap.find('h3:first').after('<div class="tabs cf">' +
			'<a href="javascript:;" title="互动讨论">互动讨论</a><a href="javascript:;" title="节目单" class="now"><i class="ic1"></i></a>' +
		'</div>').next();
		var container = $wrap.find('div.tabcon');
		var $tabs = $tab.find('a');

		container.prepend('<div class="newTemplate" style="display:none; color:#fff">newTemplate</div>');

		$tab.on('click', 'a', function(e){
			var i = $(this).index();
			$tabs.removeClass('now').eq(i).addClass('now');
			container.children().hide().eq(i).show();
		});
	}


	var ProgramList = function(option){
		this.opt = $.extend({
			$wrap: $('#player-sidebar'),
			player: player
		}, option || {});

		this.tools = {};
		this.tabs = {};

		this.build();
	}

	ProgramList.prototype = {
		build: function(){
			var
				self    = this
				,$wrap   = this.opt.$wrap
				,player = this.opt.player
			;



			switch(webcfg.playType){
				case 'living':
					renderLiving($wrap, player, this.tools);
					break;
				case 'episode':
					renderEpisode($wrap, player, this.tools);
					break;
				case 'collection':
					renderCollection($wrap, player, this.tools);
					break;
				case 'sports':
					//renderLiving($wrap, player);

					//直播地址：http://aplus.pptv.com/api/ssports

					// renderSports($wrap);
					break;
				default:
					break;
			}

			/*指定默认容器*/
			this.$currentContainer = $wrap.find('div.tabcon').children().eq(0);

			/*定义滚动条高度设置*/
			var HC = this.HC = this.heightController = heightCtrl();
			//这个项目的wrap是parent元素
			HC.height('total', this.opt.$wrap.parent());
			HC.height('title', this.opt.$wrap.find('h3'));

			HC.height('numbox', this.opt.$wrap.find('div.numbox'));
			var containerResize = this.tools.containerResize = function($cont, height, name){
				if(!$cont.is(':hidden')){
					var opt = {}
					var height = HC.count();
					opt.wheelPixel = 48;
					// opt.animate = true;
					if(height){
						opt.maxHeight = height;
					}
					self.tools.scroller = $cont.ppScroller(opt).scroll();
					//带name的是新增tab传进来的，不带name是节目单传进来的
					!name && self.tools.afterResize && self.tools.afterResize();
				}
			}
			var resizeSideBar = function(){// height: player - topAd
				self._reScroller($wrap.find('.tabs .now').attr('title'));
			}
			$.subscribe1('player.resize', resizeSideBar);

		},
		appendTab: function(name, factory){
			var icon = arguments[2];
			this.addTab({
				name: name,
				factory: factory,
				icon: icon
			});
		},
		prependTab: function(name, factory){
			this.addTab({
				name: name,
				factory: factory,
				method: 'prepend'
			});
		},
		addTab: function(option){
			this._initTab();
			var self = this;
			var o = $.extend({
				name     : '未命名'
				,factory : $.noop
				,method  : 'append'
			}, option || {});

			var $c_tab = this.opt.$wrap.find('div.tabs');
			var $c_container = this.opt.$wrap.find('div.tabcon');

			var $newTab = $('<a href="javascript:;" title="'+ o.name +'">'+ (o.icon||o.name) +'</a>');
			var $newCont = $('<div style="display:none;"><div></div></div>');
			$c_tab[o.method]($newTab);
			$c_container[o.method]($newCont);

			this.tabs[o.name] = {
				factory     : o.factory
				,$container : $newCont
				,$tab       : $newTab
				,rendered   : false
				,onActive   : $.Callbacks()
			};

			var tools = {
				containerResize: function(){
					self._reScroller(o.name);
				},
				onActive: function(fn){
					self.tabs[o.name].onActive.add(fn);
				}
			}

			var init = function(e){
				var i = $(this).index();
				self.tabs[o.name].rendered = true;
				o.factory($newCont.children(), tools);
				$newTab.off('click', init);
			}
			// $newTab.on('click', init);
			init();
		},
		_reScroller: function(name){
			var $cur = this.$currentContainer;
			var $scrollerWrap;
			if($cur.attr('data-scroller-class')){
				$scrollerWrap = $cur.find('div.' + $cur.attr('data-scroller-class'));
			}else{
				$scrollerWrap = $cur;
			}
			//console.log(222,$scrollerWrap, this.heightController.count());
			this.tools.containerResize($scrollerWrap, this.heightController.count(), name);
		},
		_activeTab: function(i, title){
			this.$currentContainer = this.$tabCon.children().eq(i);

			if(this.tabs[title]){
				this.tabs[title].onActive.fire();
				this._reScroller(title);
			}
		},
		_initTab: function(){
			if(!this._tabCreated){
				this._tabCreated = 1;
				var self = this;

				var $wrap = this.opt.$wrap;
				var menuHtml = '';
				if(webcfg && webcfg.type === 4){ //直播节目单用icon
					menuHtml = '<div class="tabs cf"><a href="javascript:;" title="节目单" class="now"><i class="ic1"></i></a></div>';
				} else {  //点播节目单用文字
					menuHtml = '<div class="tabs cf"><a href="javascript:;" title="节目单" class="now">节目单</a></div>';
				}
				var $tab = $wrap.find('h3:first').after(menuHtml).next();
				var $container = this.$tabCon = $wrap.find('div.tabcon');

				$tab.on('click', 'a', function(e){
					var i = $(this).index();
					var title = $(this).attr('title');
					$tab.children().removeClass('now').eq(i).addClass('now');
					$container.children().hide().eq(i).show();
					self._activeTab(i, title);
				});

				this.HC.height('tabs', this.opt.$wrap.find('div.tabs'));

			}

		}

	}

	return ProgramList;
});
