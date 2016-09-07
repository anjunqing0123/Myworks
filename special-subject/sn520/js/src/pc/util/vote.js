define(function(require, exports){
    var VOTE_URL = 'http://www.suning.com';
    var TOKEN_URL = '/vote/csrf';
    var $ = require('jquery');
    var cookie = require('./cookie');
    var getJsonp = require('./get_jsonp');
    var number = require('./number');
    var JSON = require('./json');
    var dataFormat = require('./dataFormat');

    var voteToken = cookie.get('snvotetoken');

    var $voteErr = $('#sn-vote'),
        $voteOk = $('#sn-coupons-middle'),
        $voteEnd = $('#sn-coupons-end');


    var vote = function(voteid, voteToken, success) {
        getJsonp('http://api.suning520.vote.pptv.com/vote/'+ voteid +'/increase', {
            _token: voteToken
        }, function(data) {
            success(data);
        });
    };

    var c = function(voteid, success) {
        if (voteToken) {
            vote(voteid, voteToken, success);
        } else {
            getJsonp('http://api.suning520.vote.pptv.com/vote/csrf', {}, function(data) {
                voteToken = data.token;
                vote(voteid, voteToken, success);
            });
        }
    };

    $('.zan').click(function() {
        var that = this;
        var voteid = $(this).attr('voteid');
        var voteCookie = JSON.parse(cookie.get('snvote') || '{}');
        cookie.set('sn_right', 1, 30, 'pptv.com', '/');
        if ($(this).hasClass('disable')) {
            $voteEnd.find('em').html('活动结束');
            $voteEnd.fadeIn();
            return;
        }
        if (dataFormat(new Date(), 'YYYYMMdd') == dataFormat(new Date(voteCookie.date), 'YYYYMMdd')) {
            if (voteCookie.record >= 3) {
                $voteErr.show();
                return;
            }
        } else {
            voteCookie = {
                date: new Date().getTime(),
                record: 0
            };
        }
        c(voteid, function(data) {
            if (data.errors) {
                if(data.errors.code == '92'){
                    // 活动截止
                    $voteEnd.find('em').html('活动结束');
                    $voteEnd.fadeIn();
                }else if(data.errors.code == '91'){
                    //  未开始
                    $voteEnd.find('em').html('活动未开始');
                    $voteEnd.fadeIn();
                }else{
                    $voteErr.show();
                }
            } else {
                $(that).find('code').text(number(data.counter));
                voteCookie.record++;
                cookie.set('snvote', JSON.stringify(voteCookie), 30, 'pptv.com', '/');
                $voteOk.show();

            }
        });
    });
    return c;
});
