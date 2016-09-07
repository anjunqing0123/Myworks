define(function(require) {
	var loader = require('../../../util/loader/loader');
	var others = require('../../../util/others/others');
	var _ = require('underscore');
	var $ = require('jquery');

	var $module = $('#gold-3');

	/* 链接点击事件绑定 */
	$module.on('click', '.bdr, .vacant-item, .head', function() {
		var that = this;

		var link = $(this).parents('.module-vtlist').attr('link');
		var appLink = $(this).parents('.module-vtlist').attr('applink');
		if (link && appLink) {
			if (others.checkIsInApp()) {
				location.href = link;
			} else {
				location.href = appLink;
			}
			return;
		}

		if ($(this).attr('username') === 'idol1447728132167') {
			location.href = 'http://chang.pptv.com/idol';
		} else {
			others.openHomePage({
				username: $(that).attr('username')
			});
		}
	});
	$module.on('click', 'img', function() {
		var that = this;

		var link = $(this).attr('link');
		var appLink = $(this).attr('applink');
		if (link && appLink) {
			if (others.checkIsInApp()) {
				location.href = link;
			} else {
				location.href = appLink;
			}
		}
	});

	var clearList = function() {
		$module.empty();
	};

	var compiled = _.template($('#template').html());
	var compiledData;
	var renderList = function(data) {
		var $html = $(compiled(data));
		$html.appendTo($module);
	};

	/* 以下从播放页取出，配合最后一个阶段排名 */
	var cid;
	var getUpPlayer = function(player, listNew) {
		if (Number(player.player_up) === 1) {
			listNew.push(player);
		}
	};
	var updateList = function() {
		loader.ajax({
			url: 'http://chang.pptv.com/api/match_result',
			// url: 'http://static9.pplive.cn/chang/datas/match_result.js',
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
					listNew.push(listOld[i][0]);
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
					setTimeout(updateList, 1000 * 60);
				} else {
					listNew.map(function(v) {
						v.username = v.player_username;
						v.avatar = v.player_avatar;
						v.real_name = v.player;
					});
					clearList();
					renderList({
						stage: 2,
						playerInfo: listNew
					});
				}
			}
		});
	};
	/* 以上从播放页取出，配合最后一个阶段排名 */


	var nextUpdate = 0,
		stage = 0,
		goback = false;
	var update = function() { // 直播前的数据更新
		loader.ajax({
			url: 'http://chang.pptv.com/api/home8?stage=8',
			// url: 'http://static9.pplive.cn/chang/datas/gold_3.js',
			jsonpCallback: 'update_1',
			success: function(data) {
				clearList();
				var now = new Date().getTime();
				var playerInfo = data.playerinfo;
				var liveInfo = data.liveinfo;
				var idolInfo = data.idolinfo || {};
				_.extend(idolInfo, {
					username: 'idol1447728132167',
					real_name: idolInfo.cname,
					avatar: idolInfo.photo
				});
				var sortedPlayers = [];
				for (var key in playerInfo) {
					sortedPlayers.push(playerInfo[key]);
				}
				data.idolinfo && sortedPlayers.push(idolInfo);
				sortedPlayers.sort(function(a, b) {
					return Number(b.votenum) - Number(a.votenum);
				});
				nextUpdate = others.newDate(liveInfo.start).getTime() - now; // 直播开始时间点,直播前
				if (nextUpdate < 0) { // 直播中
					cid = playerInfo[0].livecid;
					stage = 1;
					nextUpdate = others.newDate(liveInfo.end).getTime() - now; // 直播结束时间点
				}
				if (nextUpdate < 0) { // 直播后
					nextUpdate = 'finish'; // 直播结束之后等待选手晋级，2分钟轮询
					stage = 1;
				}

				compiledData = {
					stage: stage,
					idolInfo: idolInfo,
					playerInfo: sortedPlayers,
					liveInfo: liveInfo
				};
				renderList(compiledData);
				if (nextUpdate !== 'finish') {
					nextUpdate = Math.min(60 * 1000 * 30, nextUpdate);
					setTimeout(update, nextUpdate);
				} else {
					updateList();
				}		
			}
		})
	};
	update();
});