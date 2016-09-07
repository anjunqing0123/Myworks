define(function (require, exports, module) {

    var $ = require('jquery');
    var Swiper = require('../../../util/swipe/swiper.min.js');
    var loader = require('../../../util/loader/loader');
    var others = require('../../../util/others/others');
    var platform = require('../../../util/platform/plt');
    var _ = require('underscore');

    var scope_id = others.getQuery(location.href, 'scope_id');
    var goldMatchUrl = 'http://chang.pptv.com/api/home4';
    var $module = $('.module-pk-notice');
    if (!$module.length) {
        return;
    }

    var $gold_60 = $('.gold_60');
    $gold_60.addClass('inday');

    var tagSwiper = new Swiper($('.gold_60 .swiper-container'), {
        slidesPerView: 'auto'
    });

    function resolveParam(str) {
        var arr = str.split("&");
        var data = {};
        for (var i = 0; i < arr.length; i++) {
            var arrs = arr[i].split("=");
            data[arrs[0]] = arrs[1];
        }
        return data;
    }

    function isIPAD() {
        var search = window.location.search;
        search = search.substring(1, search.length);
        var data = resolveParam(search);
        return (data["type"] == "ipad" || platform.platform === 'ipad')
    }

    var isInApp = others.checkIsInApp();
    var isIpad = isIPAD();

    //console.info('当前赛区 scopeid --> ' + scope_id);


    //  living tag tpl
    var liveTpl = [
        '<div class="module-tbtitle">',
        '   <div class="tbtitle_a">LIVE</div>',
        '   <div class="tbtitle_b">点击头像进入直播</div>',
        '</div>'
    ].join('');

    $gold_60.on('click', '.g60_personal', function () {
        others.openHomePage({
            username: $(this).attr('username')
        });
    });

    $gold_60.on('click', '.g60_livelink', function () {
        location.href = (isInApp ? $(this).attr('link') : $(this).attr('applink'));
    });

    //  is living
    function isLive(link, applink) {
        $gold_60.prepend(liveTpl).addClass('rest60');
        $('.avartar').removeClass('g60_personal').addClass('g60_livelink');
        if (!isIpad) {
            $('.gold_60 table tr:nth-child(3)').remove();
        }
        $gold_60.find('.avartar').attr({
            'link': link,
            'applink': applink
        });
        var liveSwiper = new Swiper($('.gold_60 .swiper-container'), {
            slidesPerView: 'auto'
        });
    }

    //  是否已晋级三个选手
    var isGetRankFn = function (scopeData) {
        var playinfoData = scopeData['playerinfo'];
        var count = 0;
        for (var i in playinfoData) {
            if ((playinfoData[i].player2_info.g_status === '1' || playinfoData[i].player2_info.g_status === '4' ) && playinfoData[i].player2_info.g_stage === '4') {
                count++;
            }
            if ((playinfoData[i].player1_info.g_status === '1' || playinfoData[i].player1_info.g_status === '4') && playinfoData[i].player1_info.g_stage === '4') {
                count++;
            }
        }
        if (count >= 3) {
            return true;
        } else {
            return false;
        }
    };


    //判断直播前中后，更新dom
    var update = function () {
        var now = new Date().getTime();
        var refreshTime = 5 * 60 * 1000;

        loader.ajax({
            url: goldMatchUrl,
            //url: 'http://static9.pplive.cn/chang/datas/tag_60.js',
            jsonpCallback: 'squareUpdateList',
            success: function (data) {
                var scope_data = data[scope_id];
                var start = others.newDate(scope_data['liveinfo'].start).getTime();
                var isGetRank = isGetRankFn(scope_data);

                var applink = (scope_data['playerinfo']['0']['player1_info'].app_link).replace(/\&amp\;/g, '&');
                var link = (scope_data['playerinfo']['0']['player1_info'].link).replace(/\&amp\;/g, '&');

                if (now < start) {
                    var nextUpdateTime = start - now + 30 * 1000;
                    setTimeout(update, nextUpdateTime);

                } else if (now > start && !isGetRank) {
                    var tbtitle = $('.module-tbtitle');
                    if (tbtitle.length != 0) {
                        tbtitle.remove();
                    }
                    isLive(link, applink);
                    var liveTimeout = window.setTimeout(update, refreshTime);
                } else {
                    window.clearTimeout(liveTimeout);

                    var allPlayerInfo = scope_data['playerinfo'];
                    var afterLiveTpl = _.template($('#tag_template').html());
                    var $html = afterLiveTpl({data: allPlayerInfo});
                    var $gold_60 = $('.gold_60');
                    $gold_60.empty();
                    if (!!isIpad) {
                        $gold_60.addClass('gold_60_wp');
                    }
                    if (!isIpad) {
                        $('.living-tag60').find('.module-title .b').text('TOP3');
                    } else {
                        $('.ipad.reset_tag').find('.module-title .b').text('TOP3');
                    }
                    console.info($html);
                    $gold_60.append($html).addClass('inday');
                }
            }
        });
    };
    update();
});