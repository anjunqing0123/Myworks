define(function(require) {
	var $ = require('jquery');
	var Loader = require('../../../util/loader/loader.js');
	var others = require('../../../util/others/others.js');
	var sdk = require('../../../util/ppsdk/sdkUtil');
	var $module = $('.module-score');
	if (!$module.length) {
		return;
	}
	var cid = others.getQuery(location.href, 'cid');
	var getUpPlayer = function(player, listNew) {
		if (player.player_up === '1') {
			listNew.push(player);
		}
	};
	var transferSecond = function(s) {
		s = Number(s);
		return Math.floor(s / 60) + '分' + s % 60 + '秒';
	};
	Loader.ajax({
		url: 'http://chang.pptv.com/api/match_result',
		jsonpCallback: 'match_result',
		data: {
			match_from: 'app',
			cid: cid
		},
		success: function(data) {
			var listOld = data.data.playList;
			var listNew = [];
			var isEnd = data.is_end;

			for (var i = 0; i < 100; i++) { // 遍历所有选手，全部push到一个数组中
				if (!listOld[i]) {
					continue;
				} else {
					listNew.push(listOld[i][0])
					if (listOld[i][1]) {
						listNew.push(listOld[i][1])
					}
				}	
			}

			listNew.forEach(function(v, i, a) { // 渲染列表
				var username = v.player_username;
				var avatar = v.player_avatar;
				var is_virtual = v.player_isVirtual;
				var name = v.player;
				var $template = $('' +
				'<div class="score-item">' +
					'<div is_virtual='+ is_virtual +' class="score-avatar" username='+ username +'>' +
						'<div class="score-bg"></div>' +
						'<img src="'+ avatar +'" alt="">' +
					'</div>' +
					'<div class="score-name">'+ name +'</div>' +
					'<div class="score-info">' +
						'<span class="score-key">前进: </span><span class="score-value">'+ v.player_praise +'</span><br />' +
						'<span class="score-key">后退: </span><span class="score-value">'+ v.player_hate +'</span><br />' +
						'<span class="score-key">时长: </span><span class="score-value">'+ transferSecond(v.player_time) +'</span><br />' +
					'</div>' +
				'</div>');
				$template.appendTo($module.find('.score-list'));
			});
		}
	});

	$module.on('click', '.score-avatar', function(e) { // 点击头像打开主页
		var that = this;
		if ($(this).attr('is_virtual') === '1') {
			if (others.checkIsInApp()) {
				sdk('openNativePage', {
					pageUrl: 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent('http://chang.pptv.com/idol?type=app')
				});
			} else {
				location.href = 'http://chang.pptv.com/idol';
			}
		} else {
			others.openHomePage({
				username: $(that).attr('username')
			});
		}
	});
});