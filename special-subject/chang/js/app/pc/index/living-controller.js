define(function(require, exports){
	var _ = require('underscore');
	var $ = require('jquery');

	var VideoController = require('./video-controller.js');

	function LivingController(){
		this.initialize.apply(this, arguments);
	}

	// LivingController.prototype = videoController;
	LivingController.constructor = VideoController;
	_.extend(LivingController.prototype, VideoController.prototype, {
		initialize: function(){
			this.livingId = current_webcfg.get('id');
			VideoController.prototype.initialize.apply(this, arguments);
		},
		play: function(startTime, isLiving){
			var self = this;
			var video;

			if(startTime){
				if(typeof startTime == 'object'){
					video = startTime;
				}else{
					video = this.find(startTime, 'stime');
				}

				if(!isLiving){
					// 这里要保证getCurTime的返回值不是异步（播放页初始的Play是play/index.js启动的，保证了这里getCurTime同步执行）
					this.eventAggregator.publish('videoController.getCurTime', function(live, posi){
						// console.log('live:', live);
						// console.log('posi:', posi);
						// console.log('vetime:', video.etime, video);
						isLiving = live <= video.etime;
					});
				}

				log('[LivingController.play]isLiving:' + isLiving);

				var pl, reg, swf;

				if(video.subscribe && video.subscribe.link){
					reg = video.subscribe.link.match(/\/(\w+)\.html/);
					if(reg.length > 1){
						pl = reg[1];
					}
					swf = 'http://player.pptv.com/v/'+ pl +'.swf'
				}
				

				var option = {
					id: this.livingId,
					title: video.title,
					link: video.subscribe.link,
					pl: pl,
					swf: swf
				}

				$.extend(option, isLiving ? {
					isVod : 0
				} : {
					ctx: video.ctx,
					isVod : 1
				});
				
				video.play(function(){
					var current = self.find(true, 'isPlaying');
					if(current){
						current.attribute('isPlaying', false);
					}

					video.isPlaying = true;
					self.currentVideo = video;

					self.eventAggregator && self.eventAggregator.publish('videoController.afterPlay', video);

				}, option);
			}
		},
		playNext: function(){
			var self = this;

			var nextVideo = this.nextVideo();
			log('[VideoController.playNext] nextVideo:', nextVideo)

			if(nextVideo){
				this.play(nextVideo);
			}else{
				// 播放下一页第一集 openNextPage -> playCurrentPage
				this.eventAggregator && this.eventAggregator.publish('openNextPage', function(index){
					self.playFirst();
					/*index == 0 ,说明自动播放到第一页，即播放到零点以后的节目，刷新节目单分页（分页数据和分页信息自动取当天，即第二天的数据）*/
					if(index <= 0){
						self.eventAggregator.publish('reflashProgram');
					}
				});
			}
		}
	});


	return LivingController;
});