define(function(require) {
	var $ = require('jquery');
	require('./banner_slider.js');
	require('./progress.js');
	//逻辑单独处理
//	require('./pk_notice.js');
	require('./entrance.js');
	if($(".js-concert").length!=0){
		//吸金页
		require('./xijin');
	}else if($(".vs_list").length!=0){
		require('./pklist');
	}
	if($('.js-gold-60').length!=0){
		require('./gold_601');
	}
	if ($('.js-gold-18').length) {
		require('./gold_18');
	}
	if ($('.js-gold-10').length) {
		require('./gold_10');
	}
	if ($('.js-gold-5').length) {
		require('./gold_5');
	}
	if ($('.js-gold-3').length) {
		require('./gold_3');
	}
	require('../../module/search/search.js');
});
