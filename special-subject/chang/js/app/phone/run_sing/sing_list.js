define(function(require) {
	var $ = require('jquery');
	var others = require('../../../util/others/others.js');
	var _ = require('underscore');
	var timer = require('./../../../util/Timer/timer');
	var Loader = require('../../../util/loader/loader.js');

	var $module = $('.module-audition-your_song');
	if (!$module.length) {
		return;
	}
	var ids, tracks, lastItem, lastTitle;
	var vote = new (require('../../../util/vote/vote.js'));
	var updateVote;

	// 根据结束时间调用更新歌单
	var updateList = function(index) {
		Loader.ajax({
			url: 'http://api.cdn.chang.pptv.com/api/singList',
			data: {
				player_id: $('[name=player_id]').val(),
				stage: $('[name=stage]').val(),
				scope: $('[name=scope]').val(),
				index: index
			},
			jsonpCallback: 'singList',
			success: function(data) {
				var clearTimer;
				$module.find('.list .item').not('.template').remove();
				$module.find('.list').removeClass('disable');
				var now = others.newDate();
				var inStage = data.data.playlists.some(function(v, i, a) {
					if (now > others.newDate(v.startedAt) && now < others.newDate(v.endedAt)) {
						dataItem = v;
						tracks = v.tracks;
						if (i === 0) {
							$module.find('.brand').fadeTo(600, 0);
							lastItem = null;
						} else {
							$module.find('.brand').fadeTo(600, 1);
							lastItem = a[i - 1];
							lastTracks = lastItem['tracks'];
							lastTitle = _.max(lastTracks, function(stooge) {
								return stooge.vote.counter;
							}).title;
							$module.find('.brand .txt').text('上一轮投票结果：' + lastTitle);
						}
						if (i < a.length) {
							var mill = Number(others.newDate(v.endedAt) - now);
							setTimeout(function() {
								updateList(i + 1);
							}, mill);
						}
						return true;
					}
				});

				if (!inStage) {
					var a = data.data.playlists;
					lastTitle = _.max(a[a.length - 1].tracks, function(stooge) {
						return stooge.vote.counter;
					}).title;
					$module.find('.brand .txt').text('上一轮投票结果：' + lastTitle);
					$module.find('.info').fadeOut();
					return;
				}
				ids = tracks.map(function(v, i, a) {
					return v.voteId;
				});
				clearInterval(updateVote);
				updateVote = others.cycleGetVotes(ids, function(data) {
					$module.find('.num').each(function() {
						var sid = $(this).attr('sid');
						if (!sid) {
							return;
						}
						$(this).text(data.votes[sid].counter + '票');
						$(this).parents('.item').find('.bar').width(others.getLenth(80, data.votes[sid].counter, 4) + '%');
					});
				}, 'live');
				counters = tracks.map(function(v, i, a) {
					return Number(v.vote.counter);
				});

				// 填写歌单数据，生成歌单
				var rate = others.arrayMax(counters) / 4;
				tracks.forEach(function(v, i, a) {
					var $item = $module.find('.list .item.template').clone().removeClass('template');
					$item.find('.bar').width(others.getLenth(80, v.vote.counter, 4) + '%');
					$item.find('.count .num').text(v.vote.counter + '票').attr('sid', v.voteId);
					$item.find('.song').text(v.title);
					$item.appendTo($module.find('.list'));
				});

				// 填写倒计时
				if (clearTimer && clearTimer.clear) {
					clearTimer.clear();
				}
				var clearTimer = new timer({
					startTime : others.newDate(),
					endTime   : others.newDate(others.newDate(dataItem.endedAt)),
					callback  : function(status,times){
						if (status === 2) {
							clearInterval(updateVote);
							$module.find('.list').addClass('disable');
						}
						$module.find('.info .l2').text([times.hours, times.minitues, times.seconds].join(':'));
					}
				});

				// 绑定事件
				$module.find('.list').on('click', '.item', function() {
					var $list = $(this).parent();
					if ($list.hasClass('disable')) {
						return;
					}
					$list.find('.item').removeClass('active');
					$(this).addClass('active');
				});
				$module.find('.list').on('click', '.active .count', function(e) {
					if (!$(this).parents('.item').hasClass('active')) {
						return false;
					}
					$module.find('.list').addClass('disable');
					var $txt = $(this).children('.num');
					vote.vote($txt.attr('sid'));
					$txt.text(Number($txt.text().slice(0, -1)) + 1 + '票');
					$(this).parents('.item').removeClass('active').addClass('checked');
					return false;
				});
			}
		});
	};
	updateList();
});
