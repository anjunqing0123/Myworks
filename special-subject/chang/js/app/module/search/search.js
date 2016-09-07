define(function(require) {
	(function() { // 搜索框调用native
		var sdk = require("./../../../util/ppsdk/sdkUtil");
		$('.module-search, .module-search_ipad').click(function() {
			sdk('openNativePage', {
				pageUrl: 'app://iph.pptv.com/v4/search',
				success: function() {

				},
				error: function(code, msg) {
				}
			});
		});
	})();
});
	