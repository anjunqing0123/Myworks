define(function(require) {
	var $ = require('zepto');
	var others = require('../../../util/others/others.js');
	var sdk = require("./../../../util/ppsdk/sdkUtil");
	var Loader = require('../../../util/loader/loader.js');

	var $module = $('.module-audition-vote');
	if (!$module.length) {
		return;
	}
	$module.find('.avartar a').click(function() { // 点击头像
		var url = 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent($(this).attr('href') + '&type=app');
		sdk('openNativePage', {
			pageUrl: url,
			success: function(d) {
				// alert('success');
			},
			error: function(code, msg) {
				// alert('faild');
			}
		});
		return false;
	});
	var cycleT;

	var vote = new (require('../../../util/vote/vote.js'));
	var player_id = $('[name=player_id]').val();
	var scope = $('[name=scope]').val();
	var stage = $('[name=stage]').val();
	if (!$module.length) {
		return;
	}
	var id = $module.find('.btn').attr('sid');
	var cycleUpdateVote = function() {
		cycleT = others.cycleGetVotes([id], function(data) {
			$module.find('.btn .txt').text(data.votes[id].counter);
		}, 'live');
	};
	cycleUpdateVote();

	var updataReward = function() {
		Loader.ajax({
			url: 'http://chang.pptv.com/api/reward',
			data: {
				stage: stage,
				scope: scope
			},
			jsonpCallback: 'we',
			success: function(data) {
				data = data.data;
				var sum = 0;
				for(var key in data) {
					sum += data[key];
				}
				if (sum === 0) {
					sum = 1;
				}
				$module.find('.l3 .txt').text('酬金池比例' + Math.round(data[player_id] / sum * 100) + '%');
			}
		});
	};
	updataReward();
	setInterval(updataReward, 1000 * 60);
	$module.find('.btn').click(function() {
		var that = this;
		var sid = $(that).attr('sid');
		others.limitedDisable($(this), 60, sid, function() {
			var $txt = $(that).children('.txt');
			$txt.text(Number($txt.text())+1);
			vote.vote(sid);
			clearInterval(cycleT);
		}, function() {
			cycleUpdateVote();
		});
	});
	$module.find('.btn').each(function() {
		var that = this;
		var sid = $(that).attr('sid');
		others.limitedDisable($(this), 60, sid);
	});
	sdk.ready(function() {
		var url = window.location.href;
		if(/[&]?type=app/.test(url)) {
			url = url.replace(/[&]?type=app/, '');
		}
    	var btnOpt = {
			behavior: 0,
			params: 'shareText='+encodeURIComponent('一唱成名-'+$module.find('.name').text()+'的演唱会') + '&shareURL='+ encodeURIComponent(url) +'&shareImageURL='+ encodeURIComponent($module.find('.avartar img').attr('src'))
		};
    	sdk("customizeBtn",btnOpt);
    });
});
