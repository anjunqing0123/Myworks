define(function(require) {
	var $ = require('jquery');
	var Swiper = require('../../../util/swipe/swiper.min.js');

	
	var $selector = $('.module-banner-slider .swiper-container');
	$selector.each(function() {
		var $pagination = $(this).find('.swiper-pagination');
		var autoplay = 3000,
			loop = true;
		if ($(this).find('.swiper-slide').length < 2) {
			autoplay = 0;
			loop = false;
		}
		var bannerSlider = new Swiper(this, {
			pagination: $pagination,
			autoplay: autoplay,
			loop: loop
		});
	});
});