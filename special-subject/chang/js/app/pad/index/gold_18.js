define(function(require) {
	var loader = require('../../../util/loader/loader');
	var others = require('../../../util/others/others');
	var vote = new (require('../../../util/vote/vote.js'));
	var Swiper = require('../../../util/swipe/swiper.min.js');
	var _ = require('underscore');
	var $ = require('jquery');

	var $module = $('#gold-18');
	if (!$module.length) {
		return;
	}

	/* 链接点击事件绑定 */
	$module.click(function(e) {
		return false;
	});
	$module.on('click', '.gold-cont', function() {
		var link = $(this).parents('.module-gold-18').attr('link');
		var appLink = $(this).parents('.module-gold-18').attr('applink');
		if (link && appLink) {
			if (others.checkIsInApp()) {
				location.href = link;
			} else {
				location.href = appLink;
			}
		}
	});
	$module.on('click', '.bdr', function() {
		var that = this;
		others.openHomePage({
			username: $(that).attr('username')
		});
	});

	/* 投票绑定 */
	$module.on('click', '.gold-btn, .vlist-btn', function() {
		var sid = $(this).attr('sid');
		others.limitedDisable($(this), 3600, sid, function() {

			var $goldCont = $(this).prev('.gold-count');
			$goldCont.text(Number($goldCont.text()) + 1);

			var $vlistBtn = $(this).next('.vote');
			$vlistBtn.text(Number($vlistBtn.text()) + 1);

			vote.vote(sid);
		});
	});


	// swiperV;
	swiperVtlist = function() {
		swiperV = new Swiper($module.find('.swiper-container'), {
			slidesPerView: 'auto'
		});
	};


	var voteInit = function() {
		$('.gold-btn, .vlist-btn').each(function() {
			var sid = $(this).attr('sid');
			others.limitedDisable($(this), 3600, sid);
		});
	};

	var cycleUpdateVote;
	var cycleUpdateVoteFn = function() {
		var sids = $('button[sid]').map(function(i, v) {
			return $(v).attr('sid');
		});
		sids = _.toArray(sids);
		cycleUpdateVote = others.cycleGetVotes(sids, function(data) {
			sids.forEach(function(v, i) {
				var $btn = $('button[sid='+ v +']');
				$btn.next('.vote').text(data.votes[v].counter);
				$btn.prev('.gold-count').text(data.votes[v].counter);
			});
		});
	}

	var clearList = function() {
		$('.module-gold-18').remove();
	};

	var compiled = _.template($('#template').html());
	var compiledData;
	var renderList = function(data) {
		console.log(data);
		var $html = $(compiled(data));
		$html.appendTo($module);
	};

	var nextUpdate = 0,
		stage = 'before',
		goback = false;
	var updateBefore = function() { // 直播前的数据更新
		var isVoteEnd = false,
			liveStart = false;
		loader.ajax({
			url: 'http://chang.pptv.com/api/match189',
			// url: 'http://static9.pplive.cn/chang/datas/gold_181.js',
			jsonpCallback: 'update_1',
			success: function(data) {
				clearList();
				var now = new Date().getTime();
				if (data.data.area) {
					var area = data.data.area;
					nextUpdate = Number(area[0].vote.endedAt) * 1000 - now; // 直播前投票结束时间点
					if (nextUpdate < 0) {
						isVoteEnd = true;
					}
				}
				if (data.data.liveinfo) {
					var liveinfo = data.data.liveinfo;
					if (nextUpdate < 0) {
						nextUpdate = others.newDate(liveinfo.start).getTime() - now; // 直播开始时间点
						if (nextUpdate < 0) {
							liveStart = true;
						}
					}
					if (nextUpdate < 0) {
						nextUpdate = others.newDate(liveinfo.end).getTime() - now; // 直播结束时间点
					}
				}
				var sortScopeList = [];
				for (var key = 0; key < 20; key++) {
					if (!area[key]) {
						continue;
					}
					sortScopeList.push(area[key]);
				}
				sortScopeList.sort(function(a, b) {
					return b.vote.counter - a.vote.counter;
				});
				if (nextUpdate < 0) { // 直播结束之后等待选手晋级，2分钟轮询
					nextUpdate = 0;
					stage = 'after';
				}
				compiledData = {
					stage: 'before',
					isVoteEnd: isVoteEnd,
					liveStart: liveStart,
					scopeList: sortScopeList,
					liveInfo: liveinfo
				};
				if (stage === 'before') {
					renderList(compiledData);
					voteInit();
					clearInterval(cycleUpdateVote);
					cycleUpdateVoteFn();
				}
				setTimeout(update, nextUpdate);
			}
		})
	};

	var updateAfter = function() {
		loader.ajax({
			url: 'http://chang.pptv.com/api/sprint_players?stage=5',
			// url: 'http://static9.pplive.cn/chang/datas/gold_182.js',
			jsonpCallback: 'update_2',
			success: function(data) {
				clearList();
				var playerInfo = data.data.playerinfo;
				var sortedPlayerList = [];
				for (var key = 0; key < 20; key++) {
					if (!playerInfo[key]) {
						continue;
					}
					if (!((playerInfo[key].g_status === '1' || playerInfo[key].g_status === '4') && playerInfo[key].g_stage === '5')) {
						delete playerInfo[key];
					} else {
						sortedPlayerList.push(playerInfo[key]);
					}
				}
				if (sortedPlayerList.length < 9) { // 直播结束之后等待选手晋级，2分钟轮询
					nextUpdate = 2 * 60 * 1000;
					renderList(compiledData);
					setTimeout(update, nextUpdate);
					return;
				}
				compiledData = {
					stage: 'after',
					playerList: sortedPlayerList
				};
				renderList(compiledData);
				voteInit();
				clearInterval(cycleUpdateVote);
				cycleUpdateVoteFn();
				swiperVtlist();
			}
		});
	};

	var update = function() {
		if (stage === 'before') {
			updateBefore();
		} else if (stage === 'after') {
			updateAfter();
		}
	};
	update();
});