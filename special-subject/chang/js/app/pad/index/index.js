define(function(require) {
	var $ = require('jquery');
	require('../../phone/index/banner_slider.js');
	require('../../phone/index/progress.js');
	require('../../phone/index/entrance.js');
	// var Swiper = require('../../../util/swipe/swiper.min.js');
	// //标签tab
	// var noticeVs = new Swiper($(".module-myconcert"), {
	// 	slidesPerView: 'auto'
	// });
	if($(".js-concert").length!=0){
		//吸金页
		require('./xijin');
	}else if($(".js-pk").length!=0){
		require('./pklist');
	}
	if ($('.js-gold-60').length) {
		require('./gold_60');
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
