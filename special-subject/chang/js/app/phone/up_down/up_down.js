define(function(require) {
	var $ = require('jquery');
	var others = require('../../../util/others/others.js');
	var sdk = require("./../../../util/ppsdk/sdkUtil"),
	loader = require('./../haixuan/haixuan');
	var inStage = $('#in_stage').val();
	var $module = $('.module-audition-updown');
	if (!$module.length) {
		return;
	}
	$module.find('.avartar span').click(function() { // 点击头像
		var url = 'app://iph.pptv.com/v4/activity/web?activity=singtofame&url=' + encodeURIComponent($(this).attr('href') + '&type=app');
		if (others.checkIsInApp()) {
			sdk('openNativePage', {
				pageUrl: url,
				success: function(d) {
					// alert('success');
				},
				error: function(code, msg) {
					// alert('faild');
				}
			});
		} else {
			location.href = $(this).attr('href');
		}
		return false;
	});
	var update = function(scoreA, scoreB) { // 周期获取数据更新票数
		scoreA = Math.max(scoreA, Number($module.find('.nums>.a>.txt').text()));
		scoreB = Math.max(scoreB, Number($module.find('.nums>.b>.txt').text()));
		var rate = Math.max(scoreA, scoreB) / 4;
		$module.find('.nums>.a>.txt').text(scoreA);
		$module.find('.nums>.b>.txt').text(scoreB);
		$module.find('.a .bar').width(others.getLenth(100, scoreA, rate) + '%');
		$module.find('.b .bar').width(others.getLenth(100, scoreB, rate) + '%');
	};
	var ids = [$module.find('.btns>.a>.txt').attr('sid'), $module.find('.btns>.b>.txt').attr('sid')];
	if (inStage === '1') {
		others.cycleGetVotes(ids, function(data) { // 周期获取数据的方法
			update(data.votes[ids[0]].counter, data.votes[ids[1]].counter);
		}, 'show');
	}
	// 以下是绑定点击投票的事件
	var second = 10;
	var vote = new (require('../../../util/vote/vote.js'));
	$module.find('.btns .a, .btns .b').click(function() {
		var sid = $(this).find('.txt').attr('sid');
		var $txt = $module.find('.nums').children().eq($(this).index()).find('.txt');
		others.limitedDisable($(this), 3600, sid, function() {
			$txt.text(Number($txt.text()) + 1);
			vote.vote(sid);
		});
	});
	$module.find('.btns .a, .btns .b').each(function() {
		var sid = $(this).find('.txt').attr('sid');
		var $txt = $module.find('.nums').children().eq($(this).index()).find('.txt');
		others.limitedDisable($(this), 3600, sid);
	});

	//加载个人视频
	var s = loader.loadVideo(function(){});

	//shareText shareURL shareImageURL
	//分享按钮
	sdk.ready(function() {
		var url = window.location.href;
		if(/[&]?type=app|[&]?cep=ipad/.test(url)) {
			url = url.replace(/[&]?type=app|[&]?cep=ipad/, '');
		}
		//encodeURIComponent('一唱成名-'+$module.find('.name').text()+'的参赛视频')
		//文案内容：#选手名#报名了#pptv一唱成名#音乐选秀，快来投上一票吧【视频标题名称】＃一唱成名＃（分享自@PPTV聚力）
		var shareText = '#'+$.trim($module.find('.name').text())+'#报名了#pptv一唱成名#音乐选秀，快来投上一票吧 ＃一唱成名＃（分享自@PPTV聚力）';
		var btnOpt = {
			behavior: 0,
			params: 'shareText='+encodeURIComponent(shareText)+ '&shareURL='+ encodeURIComponent(url) +'&shareImageURL='+ encodeURIComponent($module.find('.avartar img').attr('src'))
		};
		sdk("customizeBtn",btnOpt);
	});
});