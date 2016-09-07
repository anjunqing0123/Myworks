/*! 一唱成名 create by ErickSong */
/**
 * @author: xuxin | seanxu@pptv.com
 * @Date: 13-8-24
 * @history
 */
define("app/pc/personspace/limit", [], function(require, exports, module) {
    var strLen = function(str) {
        if (!str) {
            return 0;
        }
        var aMatch = str.match(/[^\x00-\xff]/g);
        return str.length + (!aMatch ? 0 : aMatch.length);
    };
    return function(str, lens, replace) {
        if (strLen(str) > lens && lens > 0) {
            var s = str.replace(/\*/g, " ").replace(/[^\x00-\xff]/g, "**");
            str = str.slice(0, s.slice(0, lens).replace(/\*\*/g, " ").replace(/\*/g, "").length);
            str = str.slice(0, str.length - 1) + replace || "";
        }
        return str;
    };
});
