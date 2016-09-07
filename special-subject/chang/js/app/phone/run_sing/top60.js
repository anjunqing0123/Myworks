define(function(require) {
	var $ = require('zepto');
	var vote = new (require('../../../util/vote/vote.js'));
	var timer = require('../../../util/vote/vote.js');
	var Loader = require('../../../util/loader/loader.js');
	var others = require('../../../util/others/others.js');
	var sdk = require("./../../../util/ppsdk/sdkUtil");
	var share = require("./../../../util/ppsdk/share");
	//倒计时模块
	var timer=require('../../../util/Timer/timer');
	var $module = $('.module-audition-top60');
	var servertime;
	var isInApp = others.checkIsInApp();
	Loader.ajax({
		url:'http://time.pptv.com',
		cache: true,
		success:function(data){
			servertime=others.newDate(data*1000);
		},
		timeout:1000
	});
	if (!$module.length) {
		return;
	}
	var isIpad=(function(){
	    var ua = navigator.userAgent.toLowerCase();
	    return /\(ipad/i.test(ua);
	})();
	//初始化页面cid
	var cid = $('[name="cid"]').val();
	var cycleTimer1, sids, counters;
	var updateList = function(playerid) {
		var data = {
			cid: cid
		};
		if(!!playerid){
			data.id=playerid;
		}
		Loader.ajax({
			url: 'http://api.cdn.chang.pptv.com/api/PKList',
			data: data,
			jsonpCallback: 'dv',
			success: function(data) {
				if(data.code==-1){
					$('.time').html('00:00:00');
					return false;
				}
				if(data.code==1){
					var isEnd=data.data.is_end;
					clearInterval(cycleTimer1);
					var $items = $module.find('.list .item');
					var timObj=$module.find('.time');
					var nextPlayerId=data.data.player1_info.id;
					sids = [];
					counters = [];
					if (data.data.main_cid === cid) {
						$module.find('.tab.main').addClass('active');
					}
					$module.find('.tab.main').attr('cid', data.data.main_cid);
					$module.find('.tab.main').attr('cid_str', data.data.main_cid_str);
					$items.each(function() {
						var tempObj=$(this);
						var i = $items.index($(this));
						var playerInfo = data.data['player'+ (i + 1) +'_info'];
						sids.push(playerInfo.voteid);
						counters.push(Number(playerInfo.votenum));
						$(this).find('.i_avartar, .name').click(function() {
							if(!!isIpad){
								var homeUrl = 'http://chang.pptv.com/ipad/player?username=' + playerInfo.username;
							}else{
								var homeUrl = 'http://chang.pptv.com/app/player?username=' + playerInfo.username;
							}
							if (isInApp) {
								sdk('openNativePage', {
									pageUrl: 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url='+ encodeURIComponent(homeUrl + '&type=app')
								});
							} else {
								location.href = homeUrl;
							}
						});
						data.id = playerInfo.id;
						tempObj.find('.i_avartar img').attr('src', playerInfo.avatar);
						var $tab = $module.find('.tabs .tab').not('.main').eq(i);
						if (playerInfo.cid === cid) {
							$tab.addClass('active');
						}
						$tab.attr('cid', playerInfo.cid);
						$tab.attr('cid_str', playerInfo.cid_str);
						$tab.find('.t_avatar img').attr('src', playerInfo.avatar);
						if (playerInfo.is_group === '0') {
							$tab.find('.t_name').text(playerInfo.real_name);
							tempObj.find('.name').text(playerInfo.real_name);
						} else {
							$tab.find('.t_name').text(playerInfo.group_name);
							tempObj.find('.name').text(playerInfo.group_name);
						}
						tempObj.find('.count').text(playerInfo.votenum + '票');
						tempObj.find('.btn').attr('sid', playerInfo.voteid);
					});
					$items.each(function() {
						var i = $(this).index();
						$(this).find('.l2').width(others.getLenth(90, counters[i], Math.max(counters[0], counters[1]) / 4 || 1) + '%');
						// 数据问题 “|| 1”应该去掉
					});
					cycleTimer1 = others.cycleGetVotes(sids, function(data) {
						var counters = [data.votes[sids[0]].counter, data.votes[sids[1]].counter];
						$items.eq(0).find('.count').text(counters[0] + '票');
						$items.eq(1).find('.count').text(counters[1] + '票');
						$items.eq(0).find('.l2').width(others.getLenth(90, counters[0], Math.max(counters[0], counters[1]) / 4 || 1) + '%');
						$items.eq(1).find('.l2').width(others.getLenth(90, counters[1], Math.max(counters[0], counters[1]) / 4 || 1) + '%');
					}, 'live');
					timObj.text(others.dateFormat(data.data.end - others.newDate(), 'hh:mm:ss', true));
					//console.log(others.newDate(Number(data.data.end)));
					//这里返回的是时间戳
					var endTime=others.newDate(Number(data.data.end*1000));
					//var tempEndTime=others.newDate(others.newDate().getTime()+5000);
					if(servertime==null){
						var startTime=others.newDate();
					}else{
						var startTime=servertime;
					}
					if(startTime>endTime){	//后端返回的结束时间可能会小于当前时间，不加判断的话会循环走到status==2这个逻辑里
						clearInterval(cycleTimer1);
						$('.time').html('00:00:00');
						if(!isEnd){
							setTimeout(function(){
								updateList(nextPlayerId);
							}, 10*1000);
						}
					} else {
						timer({
							startTime:startTime,
							endTime: endTime,
							callback: function(status, time) {
								//console.log(status,time);
								if(status==2){
									clearInterval(cycleTimer1);
									$('.time').html('00:00:00');
									if(!isEnd){
										//未结束继续更新列表
										updateList(nextPlayerId);
									}
								}else if (status === 0) {
									return;
								} else {
									$('.time').html(time.hours+':'+time.minitues+':'+time.seconds);
								}
							}
						});
					}

					//第一次之后用客户端时间;
					servertime=null;
					//setTimeout(updateList, 1000 * 60 || (Number(data.end) - others.newDate().getTime()));
					// 1000 * 60属于调试数据，正确的应该是：
					// setTimeout(updateList, umber(data.end) - others.newDate().getTime());

					sdk.ready(function() {
						var shareTextStr = $('.list .name').map(function() {
							return $(this).text();
						}).get().join(' VS ');
						var url = window.location.href;
						if(/[&]?type=app/.test(url)) {
							url = url.replace(/[&]?type=app/, '');
						}
						var btnOpt = {
							behavior: 0,
							params: 'shareText='+encodeURI('一唱成名-'+shareTextStr+' 60强晋级赛') + '&shareURL='+ encodeURIComponent(url) +'&shareImageURL='+ encodeURIComponent('http://static9.pplive.cn/chang/images/pk.png')
						};
						sdk("customizeBtn",btnOpt);
					});
				}

				$module.find('.btn').each(function() {
					var that = this;
					var sid = $(that).attr('sid');
					others.limitedDisable($(this), 10, sid);
				});
			}
		});
	};
	$module.find('.tab').click(function() {
		if ($(this).hasClass('active')) {
			return;
		}
		if (isInApp) {
			url = 'pptv://player?cp=1&vid='+ $(this).attr('cid') +'&playmode=2&type=pplive2&extra=activity%3dsingtofame';	
		} else {
			url = location.href.replace(/run_ring\/\w+/, 'run_ring/' + $(this).attr('cid_str'));
		}
		location.href = url;
	})
	updateList();
	$module.find('.btn').click(function() {
		var that = this;
		var sid = $(that).attr('sid');
		others.limitedDisable($(this), 10, sid, function() {
			vote.vote(sid);
			$count = $(that).parents('.item').find('.count');
			var countTxt = Number($count.text().slice(0, -1)) + 1 + '票';
			if (countTxt === 'NaN票') {
				countTxt = '1票';
			}
			$count.text(countTxt);
		});
	});
});
