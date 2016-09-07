define(function(require, module, exports) {
	var $ = require('jquery');
	var cookie = require('../cookie/cookie');
	var _ = require('underscore');
	var Swiper = require('../swipe/swiper.min.js');
	var vote = new (require('../vote/vote.js'));
	var timer = require('../Timer/timer');
	var sdk = require("../ppsdk/sdkUtil");

	// $('body').append('<input value="'+location.href+'" style="position:fixed; top:0;height:30px;width:100%;z-index:100;">')

	var numberFormat = function(number, digit) {
		return ('0000000000000' + number).slice(0 - digit);
	};
	var limitedDisable = function($selector, maxSecond, sid, beforeFn, afterFn) {
		if ($selector.hasClass('disable')) {
			return;
		}
		var localRecord = {}, second;
		if (localStorage.countDown) {
			localRecord = JSON.parse(localStorage.countDown);
		} else {
			localStorage.countDown = "{}";
		}
		$selector = $($selector);
		if ($selector.data().notFirst) { // 不是第一次，即响应click
			second = maxSecond;
			localRecord[sid] = new Date().getTime();
			localStorage.countDown = JSON.stringify(localRecord);
		} else { // 第一次，页面载入时
			$selector.data().notFirst = true;
			if (!localRecord[sid]) {
				return;
			} else if (new Date().getTime() - localRecord[sid] > maxSecond * 1000) {
				return;
			} else {
				second = maxSecond - Math.floor((new Date().getTime() - localRecord[sid]) / 1000);
			}
			if (!second) {
				return;
			}
		}
		var text = $selector.find('.txt').text();
		beforeFn = beforeFn || $.noop;
		afterFn = afterFn || $.noop;
		beforeFn.call($selector);
		$selector.addClass('disable');
		var t = setInterval(function() {
			var txt;
			if (maxSecond > 60) {
				txt = numberFormat(Math.floor(second / 60), 2) + ':' + numberFormat(second % 60, 2);
			} else {
				txt = second + 's';
			}
			$selector.find('.txt').text(txt);
			second = maxSecond - Math.floor((new Date().getTime() - localRecord[sid]) / 1000);
			// console.log(localRecord)
			if (second < 0) {
				clearInterval(t);
				$selector.removeClass('disable').find('.txt').text(text);
				afterFn.call($selector);
			}
		}, 1000);
	};

	var getLenth = function (maxLenth, num, rate) {
		// 该方法保证正相关，但是不成正比，目的是减小两个相差比较大的数之间的差值。
		// rata 是一个倍率，设成较大值的1/4比较合适。
		if (num === 0) {
			return 0;
		}
		var minLenth = 10;
		return minLenth + Math.atan(num / rate) / Math.PI * 2 * (maxLenth - minLenth);
	};

	var cycleGetVotes = function(ids, callback, type, cycle) {
		var url;
		// if (type === 'show') {
		// 	url = 'http://chang.pptv.com/api/vote/show';
		// } else if (type === 'live') {
		// 	url = 'http://chang.pptv.com/api/vote/live';
		// }
		url = 'http://api.cdn.vote.pptv.com/vote/collection';
		cycle = cycle || 60 * 1000;
		callback = callback || $.noop;
		var fn = function() {
			$.ajax({
				url: url,
				data: {
					ids: ids.join()
				},
				dataType: 'jsonp',
				cache: true,
				jsonp: 'cb',
				jsonpCallback: 'vote',
				success: function(data) {
					callback(data);
				}
			});
		};
		fn();
		var t = setInterval(function() {
			fn();
		}, cycle);
		return t;
	};
	var dateFormat = function(dateObj, format, toUTC) {
		if (typeof dateObj === 'number') {
			dateObj = new Date(dateObj);
			if (dateObj < 0) {
				dateObj = new Date(0);
			}
		}
		if (toUTC) {
			dateObj = new Date(dateObj.getTime() - 8 * 60 * 60 * 1000);
		}
		var weekCn = ['日','一','二','三','四','五','六'];
		var reg = /yyyy|MM|dd|hh|mm|ss|w/g;
		var map = {
			yyyy: dateObj.getFullYear(),
			MM: dateObj.getMonth() + 1,
			dd: dateObj.getDate(),
			w: weekCn[dateObj.getDay()],
			hh: dateObj.getHours(),
			mm: dateObj.getMinutes(),
			ss: dateObj.getSeconds()
		};
		return format.replace(reg, function(str) {
			if (str.length === 4 || str === 'w') {
				return String(map[str]);
			} else {
				return ('0' + String(map[str])).slice(-2);
			}
		});
	};
	var arrayMax = function(array) {
		var max;
		array.forEach(function(v, i, a) {
			if (i === 0) {
				max = v;
			} else {
				max = Math.max(v, max);
			}
		});
		return max;
	};
	var getOS = function() {
		if (!!navigator.userAgent.match(/iPhone|iPad/)) {
			return 'ios';
		} else if (!!navigator.userAgent.match(/Android/)) {
			return 'android';
		} else {
			return 'unknown';
		}
	};
	var userLogin = function(callback) {
		sdk('login', {
			autologin: false,
			success: function(s) {
				for (var i in s) {
					if (typeof s[i] === 'string') {
						if (i === 'PPName') {
							s[i] = decodeURIComponent(s[i]);
						}
						cookie.set(i, s[i], 7, 'pptv.com', '/');
						if (i === 'token') {
							cookie.set('ppToken', decodeURIComponent(s[i]), 7, 'pptv.com', '/');
						}
					}
				}
				callback();
			},
			error: function(code, msg) {
				alert(msg);
			}
		});
	};
	var arrayMax = function(array) {
		var max;
		array.forEach(function(v, i, a) {
			if (i === 0) {
				max = v;
			} else {
				max = Math.max(v, max);
			}
		});
		return max;
	};
	var newDate = function(date) {
		if (typeof date === 'string') {
			date = date.replace(/-/g, '/');
		}
		if (!date) {
			return new Date();
		}
		return new Date(date);
	};
	var checkIsInApp = function() {
		var reg = /type=app/;
		if (reg.test(location.search)) {
			return true;
		} else {
			return false;
		}
	};
	var checkIsInWeixin = function() {
		var reg = /MicroMessenger/i;
		return reg.test(navigator.userAgent);
	};
	var checkIsInWeiBo = function() {
		var reg = /weibo/i;
		return reg.test(navigator.userAgent);
	};
	var alertDownload = function() {
		var type;
		if (getOS() === 'android' || checkIsInWeixin() || checkIsInWeiBo()) {
			type = ' type1'; // android
		} else {
			type = ' type2'; // ios
		}
		var $template = $('' +
			'<div class="mask">' +
				'<div class="module-alert-download'+ type +'">' +
					'<div class="close"></div>' +
					'<div class="l1">下载新版PPTV查看您的主页</div>' +
					'<div class="l2 t1">' +
						'<div class="cancel">取消</div>' +
						'<a target="_blank" class="download" href="http://a.app.qq.com/o/simple.jsp?pkgname=com.pplive.androidphone">查看主页</a>' +
					'</div>' +
					'<div class="l2 t2">' +
						'<a target="_blank" class="download" href="http://a.app.qq.com/o/simple.jsp?pkgname=com.pplive.androidphone">去下载</a>' +
						'<a target="_blank" class="download" href="pptv://activity">我已安装</a>' +
					'</div>' +
				'</div>' +
			'</div>');
		$template.appendTo('body');
		$template.find('.l2, .close').click(function() {
			$(this).parents('.mask').remove();
		});
	};
	var alert1 = function(info) {
		$('.alert.mask').show().find('.info').html(info);
	};
	var getQuery = function(str, key) {
		var reg = new RegExp(key + '=[^&]*\&?');
		str += '&';
		var regResult = str.match(reg);
		if (regResult) {
			var value = regResult[0].slice(key.length + 1, -1);
		}
		return value;
	};
	var openHomePage = function(opt) {
		var username;
		if (opt.username) {
			username = opt.username;
		} else if (opt.href) {
			opt.href += '&&&';
			username = opt.href.match(/username=[^&]*\&?/)[0].slice(9);
		}
		if (!!navigator.userAgent.match(/iPad/)) {
			var homeUrl = 'http://chang.pptv.com/ipad/player?username=' + username;
		} else {
			var homeUrl = 'http://chang.pptv.com/app/player?username=' + username;
		}
		console.log(homeUrl);
		if (checkIsInApp()) {
			sdk('openNativePage', {
				pageUrl: 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent(homeUrl + '&type=app')
			});
		} else {
			location.href = homeUrl;
		}
	};
	return {
		arrayMax: arrayMax,
		limitedDisable: limitedDisable,
		getLenth: getLenth,
		cycleGetVotes: cycleGetVotes,
		dateFormat: dateFormat,
		arrayMax: arrayMax,
		getOS: getOS,
		userLogin: userLogin,
		newDate: newDate,
		checkIsInApp: checkIsInApp,
		alertDownload: alertDownload,
		alert1: alert1,
		openHomePage: openHomePage,
		getQuery: getQuery
	};
});
