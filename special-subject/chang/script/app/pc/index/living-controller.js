/*! 一唱成名 create by ErickSong */
define("app/pc/index/living-controller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "./video-controller", "./video" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var VideoController = require("./video-controller");
    function LivingController() {
        this.initialize.apply(this, arguments);
    }
    // LivingController.prototype = videoController;
    LivingController.constructor = VideoController;
    _.extend(LivingController.prototype, VideoController.prototype, {
        initialize: function() {
            this.livingId = current_webcfg.get("id");
            VideoController.prototype.initialize.apply(this, arguments);
        },
        play: function(startTime, isLiving) {
            var self = this;
            var video;
            if (startTime) {
                if (typeof startTime == "object") {
                    video = startTime;
                } else {
                    video = this.find(startTime, "stime");
                }
                if (!isLiving) {
                    // 这里要保证getCurTime的返回值不是异步（播放页初始的Play是play/index.js启动的，保证了这里getCurTime同步执行）
                    this.eventAggregator.publish("videoController.getCurTime", function(live, posi) {
                        // console.log('live:', live);
                        // console.log('posi:', posi);
                        // console.log('vetime:', video.etime, video);
                        isLiving = live <= video.etime;
                    });
                }
                log("[LivingController.play]isLiving:" + isLiving);
                var pl, reg, swf;
                if (video.subscribe && video.subscribe.link) {
                    reg = video.subscribe.link.match(/\/(\w+)\.html/);
                    if (reg.length > 1) {
                        pl = reg[1];
                    }
                    swf = "http://player.pptv.com/v/" + pl + ".swf";
                }
                var option = {
                    id: this.livingId,
                    title: video.title,
                    link: video.subscribe.link,
                    pl: pl,
                    swf: swf
                };
                $.extend(option, isLiving ? {
                    isVod: 0
                } : {
                    ctx: video.ctx,
                    isVod: 1
                });
                video.play(function() {
                    var current = self.find(true, "isPlaying");
                    if (current) {
                        current.attribute("isPlaying", false);
                    }
                    video.isPlaying = true;
                    self.currentVideo = video;
                    self.eventAggregator && self.eventAggregator.publish("videoController.afterPlay", video);
                }, option);
            }
        },
        playNext: function() {
            var self = this;
            var nextVideo = this.nextVideo();
            log("[VideoController.playNext] nextVideo:", nextVideo);
            if (nextVideo) {
                this.play(nextVideo);
            } else {
                // 播放下一页第一集 openNextPage -> playCurrentPage
                this.eventAggregator && this.eventAggregator.publish("openNextPage", function(index) {
                    self.playFirst();
                    /*index == 0 ,说明自动播放到第一页，即播放到零点以后的节目，刷新节目单分页（分页数据和分页信息自动取当天，即第二天的数据）*/
                    if (index <= 0) {
                        self.eventAggregator.publish("reflashProgram");
                    }
                });
            }
        }
    });
    return LivingController;
});

define("app/pc/index/video-controller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "app/pc/index/video" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var Video = require("app/pc/index/video");
    function VideoController() {
        this.initialize.apply(this, arguments);
    }
    _.extend(VideoController.prototype, {
        initialize: function(name, options) {
            var self = this;
            this.name = name;
            this.videos = [];
            _.extend(this, {
                redirect: false,
                redirectTarget: "_self"
            }, options || {});
            this.eventAggregator && this.eventAggregator.subscribe("playCurrentPage", function() {
                if (self.videos.length) {
                    self.play(self.videos[0]);
                }
            });
        },
        attr: function(attr, value) {
            if (this[attr]) {
                this[attr] = value;
            }
        },
        push: function(video, opt) {
            if (this._check(video)) {
                var opt = _.extend(opt || {}, {
                    _index: this.videos.length
                });
                this.videos[this.videos.length] = video;
                video.attribute(opt);
                if (video.isPlaying) {
                    this.currentVideo = video;
                }
                video.attribute && video.attribute("group", this);
            }
        },
        setCurVideo: function(video) {
            var v = _.find(this.videos, function(n) {
                return video == n;
            });
            if (v) {
                this.currentVideo = v;
                this.find(video.id).attribute("isPlaying", true);
            }
        },
        last: function() {
            return this.videos[this.videos.length - 1];
        },
        first: function() {
            return this.videos[0];
        },
        nextVideo: function(video) {
            var video = video || this.currentVideo;
            if (this._check(video)) {
                if (this.last() == video) {
                    return null;
                }
                var index = _.indexOf(this.videos, video);
                return this.videos[index + 1];
            }
        },
        find: function(id, type) {
            var type = type || "id";
            return _.find(this.videos, function(n) {
                if (typeof type == "string") {
                    return n[type] == id;
                } else {
                    return type(n, id);
                }
            });
        },
        _check: function(video) {
            if (video && video.constructor == Video) {
                return true;
            } else {
                log("video", video);
                throw "wrong video constructor!";
                return false;
            }
        },
        empty: function() {
            this.videos = [];
        },
        play: function(id, options) {
            var self = this;
            var options = options || {};
            var rcc = options.rcc || "B3";
            //播放来源，播放页右侧节目单
            var video;
            var id = id || this.currentVideo;
            if (id) {
                if (typeof id == "object") {
                    video = id;
                } else {
                    video = this.find(id);
                }
                if (this.redirect) {
                    //TODO：不加延迟会出现在ff下连续跳转两次的bug,暂时无法找到问题更本原因
                    var url = video.url.replace(/&?rcc_src=\w\d/, "");
                    url += (url.indexOf("?") > -1 ? "&" : "?") + "rcc_src=" + rcc;
                    setTimeout(function() {
                        window.location.href = url;
                    }, 10);
                } else {
                    video.play(function() {
                        var current = self.find(true, "isPlaying");
                        if (current) {
                            current.attribute("isPlaying", false);
                        }
                        video.isPlaying = true;
                        self.currentVideo = video;
                        self.eventAggregator && self.eventAggregator.publish("videoController.afterPlay", video);
                    });
                }
            }
        },
        playFirst: function(options) {
            if (this.videos.length) {
                this.play(this.videos[0], options);
            }
        },
        playNext: function(options) {
            var nextVideo = this.nextVideo();
            var self = this;
            log("[VideoController.playNext]", nextVideo);
            if (nextVideo) {
                this.play(nextVideo, options);
            } else {
                // 播放下一页第一集 openNextPage -> playCurrentPage
                this.eventAggregator && this.eventAggregator.publish("openNextPage", function() {
                    self.playFirst(options);
                });
            }
        },
        each: function(fn, args, scope) {
            _.each(this.videos, function(video) {
                var arguments = [ video ].concat(args || []);
                fn.apply(scope, arguments);
            });
        }
    });
    return VideoController;
});

define("app/pc/index/video", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var player = window.player;
    function Video(info) {
        _.extend(this, {
            id: null,
            isTrailer: false
        }, info);
        //在this上加个备份，方便调用
        if (this.stime && this.etime) {
            this.ctx = {
                stime: this.stime,
                etime: this.etime
            };
        }
    }
    _.extend(Video.prototype, {
        // setParent: function(group){
        // 	if(group && group.constructor == VideoQueueController){
        // 		this._group = group;
        // 	}else{
        // 		throw('wrong group constructor!');
        // 	}
        // }
        attribute: function() {
            var arg = arguments;
            if (arg.length == 1) {
                var a1 = arg[0];
                if (typeof arg == "string") {
                    return this[a1];
                } else if (typeof arg == "object") {
                    var obj = {};
                    _.each(a1, function(v, n) {
                        obj[n] = v;
                    });
                    _.extend(this, obj);
                }
            } else {
                this[arg[0]] = arg[1];
            }
        },
        render: function(template) {
            //underscore 1.8 改了接口
            return _.template(template)(this);
        },
        play: function(callback, opt) {
            var options = _.extend({
                link: this.url
            }, opt);
            if (player) {
                log("[player.goToAndPlay(" + this.id + ")]", options, this);
                if (player.goToAndPlay) {
                    var id = options.id || this.id;
                    player.goToAndPlay(id, options);
                    $.publish("webcfg.change", [ "id", id ]);
                }
                callback && callback();
            } else {
                throw "player is not define!";
            }
        }
    });
    return Video;
});
