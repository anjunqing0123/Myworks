/*! 一唱成名 create by ErickSong */
define("app/pc/index/video-controller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "./video" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var Video = require("./video");
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
