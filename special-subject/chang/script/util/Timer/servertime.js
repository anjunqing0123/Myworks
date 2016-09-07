/*! 一唱成名 create by ErickSong */
/* 
* @Author: WhiteWang
* @Date:   2015-09-22 18:02:46
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-23 19:58:58
*/
define("util/Timer/servertime", [ "core/jquery/1.8.3/jquery" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery");
    //根据服务器时间，计算与本地时间的差异
    function calculateOffsetTime(serverTime) {
        return serverTime * 1e3 - new Date().getTime();
    }
    //根据offsetTime，计算出服务器时间
    function calculateServerTime(ot) {
        var serverTime = new Date().getTime() + ot;
        return new Date(serverTime);
    }
    var ServerTime = {
        offsetTime: 0,
        serverGet: false,
        get: function(callback) {
            if (this.serverGet) {
                callback(calculateServerTime(this.offsetTime), this.offsetTime);
            } else {
                this.getServerTime(callback);
            }
        },
        getServerTime: function(callback) {
            var self = this;
            $.ajax({
                url: "http://time.pptv.com",
                type: "GET",
                dataType: "jsonp",
                cache: true,
                jsonp: "cb",
                timeout: 1e3,
                jsonpCallback: "getServerTime",
                success: function(data) {
                    self.serverGet = true;
                    self.offsetTime = calculateOffsetTime(data);
                    callback(new Date(data * 1e3), self.offsetTime);
                },
                error: function(jqXHR, status) {
                    callback(calculateServerTime(self.offsetTime), self.offsetTime);
                }
            });
        }
    };
    return ServerTime;
});
