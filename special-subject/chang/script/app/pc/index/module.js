/*! 一唱成名 create by ErickSong */
define("app/pc/index/module", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    function Mod(option) {
        var opt = $.extend(this, {
            /*define wrap*/
            $wrap: $(),
            $container: $(),
            /*
			 * renderWrap [create wrap dom]
			 * @param $wrap
			 * @return $container
			 */
            renderWrap: $.noop,
            /*
			 * render [render container dom]
			 * @param $container
			 * @param data [object array]
			 */
            render: $.noop
        }, option);
    }
    Mod.prototype = {
        init: function() {
            var $container = this.renderWrap(this.$wrap);
            if ($container) {
                this.$container = $container;
            }
        },
        loadData: function(data) {
            this.render(this.$container, data);
        }
    };
    return Mod;
});
