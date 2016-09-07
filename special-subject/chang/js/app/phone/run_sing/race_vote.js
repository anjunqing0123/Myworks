define(function(require) {
	var $ = require('jquery');
	var others = require('../../../util/others/others.js');
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var $selector = $('.module-race-vote .swiper-container');
	var vote = new (require('../../../util/vote/vote.js'));
	var sdk = require("./../../../util/ppsdk/sdkUtil");

	var width = $(window).width();
	var $module = $('.module-race-vote');
	if (!$module.length) {
		return;
	}

	if (others.checkIsInApp() && others.getOS() === 'android') {
		$module.find('.race-btn').fadeIn();
	} else {
		$module.find('.race-slider').fadeIn();
	}

	var $bc = $module.find('.b, .c, .btn-a, .btn-b').each(function() {
		var sid = $(this).attr('sid');
		others.limitedDisable($(this), 10, sid);
	});
	$module.find('.btn-a, .btn-b').click(function() {
		var sid = $(this).attr('sid');
		var that = this;
		others.limitedDisable($(this), 10, sid, function() {
			vote.vote(sid);
			$(that).find('.txt').text('+1');
		});
	});

	var c = function(text) {
		$('.module-vacant .a').text(text);
	};
	$wrapper = $('.swiper-wrapper');
	var isIpad = !!navigator.userAgent.match(/iPad/);
	var raceSlider = new Swiper($selector, {
		loop: false,
		initialSlide: 1,
		slidesPerView: 'auto',
		onInit: function() {
			$module.find('.circle').fadeIn();
		},
		onSliderMove: function(s, e) {
			if (!isIpad) {
				return;
			}
			var x = $wrapper[0].style.transform.match(/\(.[^\,]*/);
			if (x) {
				x = x[0].slice(1, -2);
				if (x < -375) {
					raceSlider.slideTo(2, 500);
				}
				if (x > 0) {
					raceSlider.slideTo(0, 500);
				}
			}
		},
		onTransitionEnd: function(s) {
			var index = s.activeIndex;
			setTimeout(function() {
				if (index === 0) {
					raceSlider.slideNext();
					$module.find('.circle-left').html('滑投').removeClass('active');

				} else if (index === 2) {
					raceSlider.slidePrev();
					$module.find('.circle-right').html('动票').removeClass('active');
				}
			}, 500);
			if (index === 0) {
				var $c = $module.find('.c');
				if ($c.hasClass('disable')) {
					return;
				}
				$module.find('.circle-left').html('+1').addClass('active');
				var sid = $c.attr('sid');
				others.limitedDisable($c, 10, sid, function() {
					vote.vote(sid);
				});
			} else if (index === 2) {
				var $b = $module.find('.b');
				if ($b.hasClass('disable')) {
					return;
				}
				var sid = $b.attr('sid');
				others.limitedDisable($b, 10, sid, function() {
					vote.vote(sid);
				});
				$module.find('.circle-right').html('+1').addClass('active');
			}
		}
	});
	$module.find('.race-link, .rule-link').click(function() {
		var pageUrl = $(this).attr('href');
		if (others.checkIsInApp()) {
			pageUrl += '&type=app';
			sdk('openNativePage', {
				pageUrl: 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent(pageUrl)
			});
		} else {
			location.href = pageUrl;
		}
	});
	if (others.checkIsInApp()) {
		var now = others.dateFormat(new Date(), 'MMdd');
		var shareText;
		if (now <= '1121' && now >= '1116') {
			shareText = '#PPTV 一唱成名#60进18正在直播中，快来为喜欢的选手投票吧。#一唱成名#';
		} else if (now === '1128') {
			shareText = '#PPTV 一唱成名#18进9族群厮杀正在直播中，快来为喜欢的选手投票吧。#一唱成名#';
		} else if (now === '1205') {
			shareText = '#PPTV 一唱成名#9+1进5虚拟偶像踢馆正在直播中，快来为喜欢的选手投票吧。#一唱成名#';
		} else if (now === '1212') {
			shareText = '#PPTV 一唱成名#5进3正在直播中，快来为喜欢的选手投票吧。#一唱成名#';
		} else if (now === '1219') {
			shareText = '#PPTV 一唱成名#总冠军争夺赛正在直播中，快来为喜欢的选手投票吧。#一唱成名#';
		} else {
			shareText = '#PPTV 一唱成名#比赛正在直播中，快来为喜欢的选手投票吧。#一唱成名#';
		}
		url = location.href.replace(/type=app/, '');
		var btnOpt = {
			behavior: 0,
			params: 'shareText='+encodeURIComponent(shareText)+ '&shareURL='+ encodeURIComponent(url) +'&shareImageURL='+ encodeURIComponent('http://sr1.pplive.com/cms/35/18/5ccbb8075fbbf7051217e652fbe80eea.jpg')
		};
		sdk.ready(function() {
			sdk("customizeBtn",btnOpt);
		});
	}
});