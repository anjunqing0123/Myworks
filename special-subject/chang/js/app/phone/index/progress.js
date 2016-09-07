define(function(require) {
	var $ = require('zepto');
	var Swiper = require('../../../util/swipe/swiper.min.js');

	var $selector = $('.module-progress .swiper-container');
	$selector.each(function() {
		var stage = $(this).find('.swiper-slide.active').index();
		var progressBar = new Swiper(this, {
			slidesPerView: 'auto',
			initialSlide : stage
		});
	});
});