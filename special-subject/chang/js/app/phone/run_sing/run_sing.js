define(function(require) {
	var $ = require('jquery');
	var others = require('../../../util/others/others.js');
	var timer = require('./../../../util/Timer/timer');
	var VCanvas = require('../../../util/vcanvas/vcanvas');
	var Loader = require('../../../util/loader/loader.js');

	var $module = $('.module-audition-run_sing');
	if (!$module.length) {
		return;
	}
	var $txtA = $module.find('.nums .a .txt');
	var $txtB = $module.find('.nums .b .txt');
	var upId, downId, upVote, downVote, countDownTime;
	var vote = new (require('../../../util/vote/vote.js'));
	var disc = new VCanvas({
		canvas: 'graph',
		nColor: ['#d5d5d5', '#ef2e2e'],
		lColor: ['#ef2e2e', '#d5d5d5'],
		lineWidth: 4,
		lineLength:30
	});
	disc.redraw(0,0);    //重绘投票canvas
	var clearTimer,
		nextTime;
	var update = function() {
		Loader.ajax({
			url: 'http://api.cdn.chang.pptv.com/api/gettreadmill',
			jsonpCallback: 'updateCb',
			data: {
				player_id: $('[name=player_id]').val(),
				stage: $('[name=stage]').val(),
				scope: $('[name=scope]').val()
			},
			success: function(data) {
				data.data.endedAt = $('#end').val();
				data.data.startedAt = $('#start').val();
				upId =  data.data.speedUpVoteId,
				downId = data.data.slowDownVoteId,
				upVote = data.data.speedUpVote.counter,
				downVote = data.data.slowDownVote.counter,
				countDownTime = others.dateFormat(others.newDate(data.data.endedAt) - others.newDate(), 'hh:mm:ss', true);
				clearTimer && clearTimer.clear && clearTimer.clear();
				if (!$module.find('.num').attr('next-update')) {
					$module.find('.num').attr('next-update', new Date().getTime());
				}
				clearTimer = new timer({
					startTime : others.newDate(),
					endTime   : others.newDate(data.data.endedAt),
					callback  : function(status,times) {
						var nextUpdate = Number($module.find('.num').attr('next-update'));
						if (nextUpdate - new Date().getTime() < -1000 * 10 && nextUpdate !== 0) {
							console.log(new Date(nextUpdate), new Date());
							Loader.ajax({
								url: 'http://chang.pptv.com/api/speed',
								data: {
									cid: $('[name=cid]').val()
								},
								jsonpCallback: 'getSpeed',
								success: function(data) {
									var data = data.data;
									$module.find('.num').text(data.speed).attr('next-update', data.offline_on * 1000);
									console.log(new Date(data.offline_on * 1000), 'offline_on')
									var n = Number(data.speed);
									disc.redraw(n, 5-n);
								}
							});
						}
						if (times.hours === '00' && times.minitues === '00' && times.seconds === '00') {
							$module.find('.btns div').addClass('disable');
							$module.find('.time').attr('count_down', 'end');
						}
						if (Number(times.hours) > 0) {
							$module.find('.time').text('01:00:00');
						} else {
							$module.find('.time').text([times.hours, times.minitues, times.seconds].join(':'));
						}
					}
				});
				// var draw = function(a, b) {
				// 	var canvas = document.getElementById('graph');
				// 	if (!canvas) {
				// 		return false;
				// 	}
				// 	var context = canvas.getContext('2d');
				// 	context.lineWidth = 4;
				// 	context.strokeStyle = '#ef2e2e';
				// 	context.translate(150, 150);
				// 	var R = 120;
				// 	var r = 90;
				// 	for (var i = 5; i < 180; i += 5.625 ) {
				// 		if (i > 180 * (a / (a + b))) {
				// 			context.strokeStyle = '#d5d5d5';
				// 		}
				// 		context.closePath();
				// 		context.beginPath()
				// 		rad = i * Math.PI / 180;
				// 		context.moveTo(-r * Math.cos(rad), -r * Math.sin(rad));
				// 		context.lineTo(-R * Math.cos(rad), -R * Math.sin(rad));
				// 		context.stroke();
				// 	}
				// 	R += 18;
				// 	var text;
				// 	var step2 = 17.3;
				// 	context.fillStyle = '#d5d5d5';
				// 	for (var i = 4; i < 180; i += step2) {
				// 		text = Math.floor(i / step2) - 5;
				// 		rad = i * Math.PI / 180;
				// 		if (text === 1) {
				// 			R -= 8;
				// 			context.fillStyle = '#ef2e2e';
				// 		}
				// 		context.fillText(text, -R * Math.cos(rad), -R * Math.sin(rad));
				// 		context.fill();
				// 	}
				// };
				// $module.find('.time').text(countDownTime);
				// $txtA.text(upVote);
				// $txtB.text(downVote);
				// var rate = Math.max(upVote, downVote);
				// $module.find('.nums .a .bar').width(others.getLenth(100, upVote, rate) + '%');
				// $module.find('.nums .b .bar').width(others.getLenth(100, downVote, rate) + '%');
				// disc.redraw(10, 20);
				// disc.redraw(upVote, downVote);
				// draw(upVote, downVote);
			}
		});
	};
	update();
	setInterval(function() {
		update();
	}, 1000 * 60);
	var $btnA = $module.find('.btns .a');
	var $btnB = $module.find('.btns .b');
	$btnA.add($btnB).click(function() {
		var $that = $(this);
		var sid;
		if ($that.hasClass('a')) {
			sid = upId;
		} else {
			sid = downId;
		}
		if ($module.find('.time').text() === '01:00:00') {
			others.alert1('<div><div>投票还未开始</div><div>开场后一小时才能对跑步机投票哦</div></div>');
			return;
		}
		others.limitedDisable($(this), 10, sid, function() {
			if ($that.hasClass('a')) {
				$txtA.text(Number($txtA.text()) + 1);
			} else {
				$txtB.text(Number($txtB.text()) + 1);
			}
			vote.vote(sid);
		});
	});
	$btnA.add($btnB).each(function() {
		var $that = $(this);
		var sid;
		if ($that.hasClass('a')) {
			sid = upId;
		} else {
			sid = downId;
		}
		others.limitedDisable($(this), 10, sid);
	});
});