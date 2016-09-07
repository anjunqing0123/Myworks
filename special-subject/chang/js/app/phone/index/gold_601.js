define(function(require) {
	var loader = require('../../../util/loader/loader');
	var platform = require('../../../util/platform/plt');
	var others = require('../../../util/others/others');
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var _ = require('underscore');

	var $module = $('.module-pk-notice');
	if (!$module.length) {
		return;
	}

	$module.find('.notice-tab .swiper-slide').click(function() {
		$(this).parents('.notice-tab').find('.swiper-slide').removeClass('active');
		$(this).addClass('active');

		var i = $(this).index();
		dayIndex = i + 1;
		var $gold_60 = $module.find('.gold_60');
		$gold_60.removeClass('inday');
		$gold_60.eq(i).addClass('inday');

		swiperVs();
	});
	$module.on('click', '.avartar, .picw', function() {
		var link = $(this).parents('.gold_60').attr('link');
		var appLink = $(this).parents('.gold_60').attr('applink');
		if (link && appLink) {
			if (others.checkIsInApp()) {
				location.href = link;
			} else {
				location.href = appLink;
			}
		} else {
			others.openHomePage({
				username: $(this).attr('username')
			});
		}
	});

	var progressSlider = {
		detachEvents: function(){}
	};
	var swiperProgress = function(i) {
		// $module.find('.notice-tab .swiper-slide').removeClass('active');
		// $module.find('.notice-tab .swiper-slide').eq(dayIndex).addClass('active');
		progressSlider.detachEvents();
		progressSlider = new Swiper('.notice-tab', {
			slidesPerView: 'auto',
			initialSlide: i - 1
		});
	};
	var dayIndex = $('.notice-tab').find('.swiper-slide.active').index();
	swiperProgress(dayIndex);

	var goldSlider = [];
	var swiperVs = function() {
		goldSlider.forEach(function(v) {
			v.detachEvents();
		});
		$('.gold_60 .swiper-container').each(function(i) {
			goldSlider[i] = new Swiper(this, {
				slidesPerView: 'auto'
			});
		});
		
	};

	var update = function() {
		var now = new Date();
		var nextUpdate = 1000 * 100;
		loader.ajax({
			url: 'http://chang.pptv.com/api/home4',
			// url: 'http://static9.pplive.cn/chang/datas/gold.js',
			jsonpCallback: 'updateList',
			success: function(data) {
				$module.find('.gold_60').remove();
				var orderData = [];

				for (var key in data) {
					orderData.push(data[key]);
				}
				orderData.sort(function(a, b) {
					return others.newDate(a.liveinfo.start) - others.newDate(b.liveinfo.start);
				});
				console.log(orderData);
				var compiled = _.template($('#template').html());
				var $html = $(compiled({
					data: orderData,
					others: others,
					now: new Date(),
					isGetRankFn: function(data) { // 返回是否已经得出晋级结果
						var count = 0;
						for (var i in data) {
							if ((data[i].player2_info.g_status === '1' || data[i].player2_info.g_status === '4') && data[i].player2_info.g_stage === '4') {
								count++;
							}
							if ((data[i].player1_info.g_status === '1' || data[i].player1_info.g_status === '4') && data[i].player1_info.g_stage === '4') {
								count++;
							}
						};
						if (count >=3) {
							return true;
						} else {
							return false;
						}
					},
					getNextUpdate: function(start) { // 获取下次更新的时间
						if (others.dateFormat(now, 'yyyyMMdd') === others.dateFormat(start, 'yyyyMMdd')) {
							if (now < start) {
								nextUpdate = start.getTime() - now.getTime();
							} else if (!isGetRank) {
								nextUpdate = 2 * 1000 * 60;
							} else {
								nextUpdate = 'never';
							}
						}
					},
					isIndayClass: function(start, i) { // 如果是今天就返回一个indayclass，添加到gold_60就显示。
						if (dayIndex === i) {
							return ' inday';
						} else {
							return '';
						}
					}
				}));
				$html.appendTo($module);
				swiperVs();

				/* 下次什么时候递归调用更新~ */
				if (nextUpdate === 'never') {
					return;
				}
				setTimeout(update, nextUpdate);
			}
		})
	};
	update();
});