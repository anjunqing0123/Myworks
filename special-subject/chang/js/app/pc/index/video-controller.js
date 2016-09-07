define(function(require, exports){
	var _ = require('underscore');
	var $ = require('jquery');
	var Video = require('./video');

	function VideoController(){
		this.initialize.apply(this, arguments);
	}

	_.extend(VideoController.prototype, {
		initialize: function(name, options){
			var self = this;
			this.name = name;
			this.videos = [];

			_.extend(this, {
				redirect        : false //是否刷新页面
				,redirectTarget : '_self' //指定新视频打开方式，暂未使用
			}, options || {});
			this.eventAggregator && this.eventAggregator.subscribe('playCurrentPage', function(){
				if(self.videos.length){
					self.play(self.videos[0]);
				}
			});
		},
		attr: function(attr, value){
			if(this[attr]){
				this[attr] = value;
			}
		},
		push: function(video, opt){
			if(this._check(video)){
				var opt = _.extend(opt || {}, {
					"_index": this.videos.length
				})
				this.videos[this.videos.length] = video;
				video.attribute(opt);
				if(video.isPlaying){
					this.currentVideo = video;
				}

				video.attribute && video.attribute('group', this);
			}
		},
		setCurVideo: function(video){
			var v = _.find(this.videos, function(n){
				return video == n;
			});
			if(v){
				this.currentVideo = v;
				this.find(video.id).attribute('isPlaying', true);
			}
		},
		last: function(){
			return this.videos[this.videos.length - 1];
		},
		first: function(){
			return this.videos[0];
		},
		nextVideo: function(video){
			var video = video || this.currentVideo;
			if(this._check(video)){
				if(this.last() == video){
					return null;
				}
				var index = _.indexOf(this.videos, video);
				return this.videos[index + 1];
			}
		},
		find: function(id, type){
			var type = type || 'id';
			return _.find(this.videos, function(n){
				if(typeof type == 'string'){
					return n[type] == id;	
				}else{
					return type(n, id);
				}
				
			})
		},
		_check: function(video){
			if(video && video.constructor == Video){
				return true;
			}else{
				log('video', video);
				throw('wrong video constructor!');
				return false;
			}
		},
		empty: function(){
			this.videos = [];
		},
		play: function(id, options){
			var self = this;
			var options = options || {};
			var rcc = options.rcc || 'B3'; //播放来源，播放页右侧节目单
			var video;
			var id = id || this.currentVideo;
			if(id){
				
				if(typeof id == 'object'){
					video = id;
				}else{
					video = this.find(id);
				}

				

				if(this.redirect){
					//TODO：不加延迟会出现在ff下连续跳转两次的bug,暂时无法找到问题更本原因
					var url = video.url.replace(/&?rcc_src=\w\d/, '');
					url += (url.indexOf('?') > -1 ? '&' : '?') + 'rcc_src=' + rcc;

					setTimeout(function(){window.location.href = url;},10)
				}else{
					video.play(function(){
						var current = self.find(true, 'isPlaying');
						if(current){
							current.attribute('isPlaying', false);
						}
						video.isPlaying = true;
						self.currentVideo = video;

						self.eventAggregator && self.eventAggregator.publish('videoController.afterPlay', video);
					});
				}
			}
		},
		playFirst: function(options){
			if(this.videos.length){
				this.play(this.videos[0], options);
			}
		},
		playNext: function(options){
			var nextVideo = this.nextVideo();
			var self = this;
			log('[VideoController.playNext]', nextVideo);

			if(nextVideo){
				this.play(nextVideo, options);
			}else{
				// 播放下一页第一集 openNextPage -> playCurrentPage
				this.eventAggregator && this.eventAggregator.publish('openNextPage', function(){
					self.playFirst(options);
				});
			}
		},
		each: function(fn, args, scope){
			_.each(this.videos, function(video){
				var arguments = [video].concat(args || []);
				fn.apply(scope, arguments);
			})
		}
	});

	return VideoController;
});