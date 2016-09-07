/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/tool/guid", [], function(require, exports, module) {
    /**
 * zrender: 生成唯一id
 *
 * @author errorrik (errorrik@gmail.com)
 */
    var idStart = 2311;
    module.exports = function() {
        return "zrender__" + idStart++;
    };
});
