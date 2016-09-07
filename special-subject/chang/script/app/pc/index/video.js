/*! 一唱成名 create by ErickSong */
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
