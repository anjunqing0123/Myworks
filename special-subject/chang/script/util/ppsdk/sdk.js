/*! 一唱成名 create by ErickSong */
/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    PPSDK
 *
 * Example :
 *
 *  ppsdk.msgboard({
 *       info:{ id : "special_" + encodeURIComponent('querry.username') },
 *       success:function(rspData) {
 *       },
 *       error:function(errCode, msg) {
 *       },
 *       cancel:function() {
 *       }
 *  });
 *
 * or trigger it!
 *
 *  ppsdk.trigger('msgbord')
 *
 *
 */
define("util/ppsdk/sdk", [], function(require, exports, modules) {
    var isReady = false;
    if (!this.ppsdk) {
        alert("load sdk error!");
        return false;
    }
    ppsdk.config({
        api: [],
        //本页面用到的js接口列表(暂时不支持)
        signature: "",
        //签名，暂时可不填
        debug: true
    });
    ppsdk.types = [];
    ppsdk.proxy = function(name, opts) {
        if (!ppsdk.types[name]) {
            ppsdk.types[name] = opts;
        }
        return this;
    };
    ppsdk.trigger = function(name) {
        if (name && ppsdk[name] && isReady) {
            ppsdk[name](ppsdk.types[name]);
        }
        return this;
    };
    ppsdk.ready(function() {
        //alert('ppsdk ready!');
        isReady = true;
    });
    ppsdk.isReady = function() {
        return isReady;
    };
    return ppsdk;
});
