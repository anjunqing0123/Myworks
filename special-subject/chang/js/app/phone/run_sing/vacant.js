define(function(require) {
	var $ = require('jquery');
	var Loader = require('../../../util/loader/loader.js');
	var others = require('../../../util/others/others.js');
	var sdk = require('../../../util/ppsdk/sdkUtil');

	$module = $('.module-vacant');
	if (!$module.length) {
		return;
	}
	var cid = $('#cid').val();
	var getUpPlayer = function(player, listNew) {
		if (Number(player.player_up) === 1) {
			listNew.push(player);
		}
	};
	var updateList = function() {
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
				var isEnd = data.data.is_end;

				for (var i = 0; i < 100; i++) { // 遍历所有选手，筛选出晋级的
					if (!listOld[i]) {
						continue;
					}
					getUpPlayer(listOld[i][0], listNew);
					if (listOld[i][1]) {
						getUpPlayer(listOld[i][1], listNew);
					}
				}

				listNew.sort(function(a, b) { // 将筛选出的选手按index排名
					return Number(a.player_index) - Number(b.player_index);
				});
				listNew.sort(function(a, b) {
					if (b.player_index === '2') {
						return 1;
					}
					return 0;
				});

				listNew[0] && (listNew[0].player_index !== '0') && (listNew[0].classIndex = 'second');
				listNew[1] && (listNew[1].player_index !== '0') && (listNew[1].classIndex = 'first');
				listNew[2] && (listNew[2].player_index !== '0') && (listNew[2].classIndex = 'third');
				if (Number(isEnd) === 0) { // 如果没有结束就push一个未知选手
					var unknownCount = Number($('#num').val()) - listNew.length;
					for (var i = 0; i < unknownCount; i++) {
						listNew.push({
							empty: true,
							player_username: 'unknown',
							player: '未知',
							player_avatar: 'http://static9.pplive.cn/chang/v_20151030110153/images/stranger1.png'
						});
					}
					setTimeout(updateList, 3 * 60 * 1000);
				} else {
					$('[class^=swiper]').on('touchmove', function(e) {
						return false;
					});
					$('.circle').css('background', '#aaa');
					$('.circle-left').text('投结');
					$('.circle-right').text('票束');
				}
				$module.find('.vacant-list').empty(); // 清空列表

				listNew.forEach(function(v, i, a) { // 渲染列表
					var username = v.player_username;
					var avatar = v.player_avatar;
					var name = v.player;
					var is_virtual = v.player_isVirtual;
					var classIndex = v.classIndex;
					var isEmpty = '';
					if (v.empty) {
						isEmpty = ' empty';
					}
					var $template = $('' +
					'<div is_virtual='+ is_virtual +' username='+ username +' class="vacant-item'+ isEmpty + ' ' + classIndex + '">' +
						'<div class="vacant-item-bg"></div>' +
						'<div class="vacant-avatar">' +
							'<img src="'+ avatar +'" alt="">' +
						'</div>' +
						'<div class="vacant-item-name">'+ name +'</div>' +
					'</div>');
					$template.appendTo($module.find('.vacant-list'));
				});
			}
		});
	};

	updateList();

	$module.on('click', '.vacant-item:not(.empty)', function(e) { // 点击头像打开主页
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