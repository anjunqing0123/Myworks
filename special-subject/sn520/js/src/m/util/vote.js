define(function(require, exports){
    var VOTE_URL = 'http://www.suning.com';
    var TOKEN_URL = '/vote/csrf';
    var $ = require('jquery');
    var cookie = require('./cookie');
    var getJsonp = require('./get_jsonp');
    var number = require('./number');
    var dataFormat = require('./dataFormat');

    var voteToken = cookie.get('snvotetoken');


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

    $('.up a').click(function() {
        var that = this;
        var voteid = $(this).attr('voteid');
        var voteCookie = JSON.parse(cookie.get('snvote') || '{}');
        cookie.set('sn_right', 1, 30, 'pptv.com', '/');
        if ($(this).hasClass('disable')) {
            $('#coupon-deadline').fadeIn();
            return;
        }
        if (dataFormat(new Date(), 'YYYYMMdd') == dataFormat(new Date(voteCookie.date), 'YYYYMMdd')) {
            if (voteCookie.record >= 3) {
                $('#coupon-out').fadeIn();
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
                $('#coupon-out').fadeIn();
                return;
            }
            $(that).addClass('cur').next('.vote-num').text(number(data.counter));
            voteCookie.record++;
            cookie.set('snvote', JSON.stringify(voteCookie), 30, 'pptv.com', '/');
            $('#coupon-success').fadeIn();
            var $1 = $('<span style="position: relative;color:#FE6292;">+1</span>');
            $1.appendTo($(that)).animate({
                top: -50,
                opacity: 0
            }, 600);
        });
    });
    return c;
});
