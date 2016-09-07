define(function(require) {
	var loader = require('../../../util/loader/loader');
	var others = require('../../../util/others/others');
	var vote = new (require('../../../util/vote/vote.js'));
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var _ = require('underscore');
	var $ = require('jquery');

	var $module = $('#gold-5');
	// if (!$module.length) {
	// 	return;
	// }

	/* 链接点击事件绑定 */
	$module.on('click', '.bdr, .i_avartar, .picw', function() {
		var that = this;

		var link = $(this).parents('.gold_5').attr('link');
		var appLink = $(this).parents('.gold_5').attr('applink');
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

	/* 投票绑定 */
	$module.on('click', '.module-gold10 .btn', function() {
		var sid = $(this).attr('sid');
		others.limitedDisable($(this), 3600, sid, function() {
			$(this).find('.txt').text('+1');

			var $goldCont = $(this).next('.vote');
			$goldCont.text(Number($goldCont.text()) + 1);

			var $Btn = $(this).parents('.item').find('.count');
			$Btn.text(Number($Btn.text().slice(0, -1)) + 1 + '票');

			vote.vote(sid);
		});
	});
	var voteInit = function() {
		$('.module-gold10 .btn').each(function() {
			var sid = $(this).attr('sid');
			others.limitedDisable($(this), 3600, sid);
		});
	};

	var cycleUpdateVote;
	var cycleUpdateVoteFn = function() {
		var sids = $('[sid]').map(function(i, v) {
			return $(v).attr('sid');
		});
		sids = _.toArray(sids);
		var maxVotes = 0;
		var barLen = {};
		cycleUpdateVote = others.cycleGetVotes(sids, function(data) {
			sids.forEach(function(v, i) {
				var $btn = $('[sid='+ v +']');

				var $goldCont = $btn.next('.vote');
				$goldCont.text(data.votes[v].counter);

				var $Btn = $btn.parents('.item').find('.count');
				if ($Btn.length) {
					maxVotes = Math.max(data.votes[v].counter, maxVotes);
					barLen[v] = data.votes[v].counter;
				}
				$Btn.text(data.votes[v].counter + '票');
			});
			for (var key in barLen) {
				$('[sid='+ key +']').parents('.item').find('.l2').width(others.getLenth(80, Number(barLen[key]), maxVotes / 4) + '%');
			}
		});
	};

	var clearList = function() {
		$module.empty();
	};

	var compiled = _.template($('#template').html());
	var compiledData;
	var renderList = function(data) {
		var $html = $(compiled(data));
		$html.appendTo($module);
		clearInterval(cycleUpdateVote);
		cycleUpdateVoteFn();
	};

	var swipervs = function() {
		var vsSlider = new Swiper('.swiper-container', {
			slidesPerView: 'auto'
		});
	};

	var getIsRank = function(players, idol) {
		var rankCount = 0;
		players.forEach(function(v) {
			if ((v.g_status === '1' || v.g_status === '4') && v.g_stage === '7') {
				rankCount++;
			}
		});
		if ((idol.g_status === '1' || idol.g_status === '4')) {
			rankCount++;
		}
		console.log('已经晋级了', rankCount, '个选手');
		return rankCount > 2;
	};
	var nextUpdate = 0,
		stage = 0,
		goback = false;
	var update = function() { // 直播前的数据更新
		var isVoteEnd = false,
			liveStart = false;
		loader.ajax({
			url: 'http://chang.pptv.com/api/home5?stage=7',
			// url: 'http://static9.pplive.cn/chang/datas/gold_5.js',
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
				sortedPlayers.sort(function(a, b) {
					return Number(b.votenum) - Number(a.votenum);
				});
				nextUpdate = Number(sortedPlayers[0].vote_end) * 1000 - now; // 直播前投票结束时间点
				if (nextUpdate < 0) {
					stage = 1;
					nextUpdate = others.newDate(liveInfo.start).getTime() - now; // 直播开始时间点
				}
				if (nextUpdate < 0) {
					stage = 2;
					nextUpdate = others.newDate(liveInfo.end).getTime() - now; // 直播结束时间点
				}
				if (nextUpdate < 0 && !getIsRank(sortedPlayers, idolInfo)) {
					nextUpdate = 1 * 1000 * 60; // 直播结束之后等待选手晋级，2分钟轮询
					stage = 2;
				}
				if (getIsRank(sortedPlayers, idolInfo)) {
					nextUpdate = 'finish';
					stage = 3;
					sortedPlayers = sortedPlayers.filter(function(v) {
						if ((v.g_status === '1' || v.g_status === '4') && v.g_stage === '7') {
							return true;
						} else {
							return false;
						}
					});
					if ((idolInfo.g_status === '1' || idolInfo.g_status === '4')) {
						idolInfo.promotion = true;
					}
				}

				compiledData = {
					stage: stage,
					idolInfo: idolInfo,
					playerInfo: sortedPlayers,
					liveInfo: liveInfo
				};
				renderList(compiledData);
				voteInit();
				swipervs();
				if (nextUpdate !== 'finish') {
					nextUpdate = Math.min(60 * 1000 * 30, nextUpdate);
					console.log(nextUpdate / 1000 / 60, '分钟后更新');
					setTimeout(update, nextUpdate);
				}		
			}
		})
	};
	update();
});