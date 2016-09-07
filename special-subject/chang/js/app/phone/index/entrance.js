define(function(require, module, exports) {
	var $ = require('zepto');
	var cookie = require('../../../util/cookie/cookie');
	var others = require('../../../util/others/others.js');
	var sdk = require("./../../../util/ppsdk/sdkUtil");
	var Loader = require('../../../util/loader/loader.js');
	var share = require("./../../../util/ppsdk/share");

	var $module = $('.module-index-entrance');
	if (!$module.length) {
		return;
	}
	var $join = $module.find('.avartar').last();
	var go = function() {
		Loader.ajax({
			url: 'http://api.chang.pptv.com/api/checksign',
			jsonpCallback: 'checksign',
			success: function(data) {
				var urlEnroll = 'http://chang.pptv.com/app/enroll/?type=app';
				var urlHome = 'http://space.chang.pptv.com?type=app';
				if (!!navigator.userAgent.match(/iPad/)) {
					urlEnroll = 'http://chang.pptv.com/ipad/enroll?type=app';
					urlHome = 'http://chang.pptv.com/ipad/space?type=app';
				}
				var os = others.getOS();
				if (os === 'ios') {
					urlEnroll = 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent(urlEnroll);
					urlHome = 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent(urlHome);
					if (data.status === '0') {
						others.userLogin(go);
					} else if (data.status === '1') {
						if ($('.module-index-entrance').attr('stage') === 'pk') {
							alert('抱歉，PP君未找到您的报名资料');
						} else {
							sdk('openNativePage', {
								pageUrl: urlEnroll,
								success: function() {

								},
								error: function(code, msg) {
								}
							});
						}
					} else {
						sdk('openNativePage', {
							pageUrl: urlHome,
							success: function() {

							},
							error: function(code, msg) {
							}
						});
					}
				} else {
					if (data.status === '0') {
						others.userLogin(go);
					} else if (data.status === '1') {
						if ($('.module-index-entrance').attr('stage') === 'pk') {
							alert('抱歉，PP君未找到您的报名资料');
						} else {
							location.href = urlEnroll;
						}
					} else {
						location.href = urlHome;
					}
				}
			},
			error: function(a, b, c) {
				alert('您的网络状况不佳，请稍后再试！');
			}
		});
	};
	$join.on('click', function() {
		if (!others.checkIsInApp()) {
			others.alertDownload();
			return;
		}
		if (cookie.get('PPName')) {
			go();
		} else {
			others.userLogin(go);
		}
		return false;
	});
	sdk.ready(function() {
		var url = window.location.href;
		if(/[&]?type=app/.test(url)) {
			url = url.replace(/[&]?type=app/, '');
		}
		var btnOpt = {
			behavior: 0,
			params: 'shareText='+encodeURIComponent('【PPTV聚力】我在#pptv 一唱成名#等你登上乐球！＃一唱成名＃') + '&shareURL='+ encodeURIComponent(url) +'&shareImageURL='+ encodeURIComponent('http://sr1.pplive.com/cms/17/21/131fd11edc6bcd799414c9adb353a8c6.jpg')
		};
		sdk("customizeBtn",btnOpt);
	});
});
