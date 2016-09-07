define(function(require, exports){
	var $ = require('jquery');

	function Mod(option){
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
		// this.init();	
	}

	Mod.prototype = {
		init: function(){
			var $container = this.renderWrap(this.$wrap);
			if($container){
				this.$container = $container;
			}
			
		},
		loadData: function(data){
			this.render(this.$container, data)
		}
	}

	return Mod;
});