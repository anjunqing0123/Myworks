define(function (require, exports, module) {
    var $ = require('jquery');
    var loader = require('../../../util/loader/loader');
    var others = require('../../../util/others/others');
    var platform = require('../../../util/platform/plt');
    var _ = require('underscore');

    var scope_id = others.getQuery(location.href, 'scope_id');
    var goldMatchUrl = 'http://chang.pptv.com/api/sprint_players?stage=5';

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

    console.info('当前赛区 scopeid --> ' + scope_id);

    //  living tag tpl
    var liveTpl = [
        '<div class="module-tbtitle">',
        '   <div class="tbtitle_a">LIVE</div>',
        '   <div class="tbtitle_b">正在直播</div>',
        '</div>'
    ].join('');

    $(document).on('click', '.g18_personal', function () {
        others.openHomePage({
            username: $(this).attr('username')
        });
    });

    $(document).on('click', '.g18_livelink', function () {
        var link = $(this).attr('link');
        var applink = $(this).attr('applink');
        if (isInApp) {
            location.href = link;
        } else {
            location.href = applink;
        }
    });

    //  is living.
    var $gold_18 = $('.gold_18');
    function isLive(link, applink) {
        $gold_18.prepend(liveTpl);
        $('.picw').removeClass('g18_personal').addClass('g18_livelink');
        $gold_18.find('.picw').attr({
            'link': link,
            'applink': applink
        });
    }

    //判断直播前中后，更新dom
    var update = function () {
        var now = new Date().getTime();
        var refreshTime = 5 * 60 * 1000;      // 直播中，轮询时间 5min

        //goldMatchUrl,
        loader.ajax({
            url:goldMatchUrl,
            data: {scope: scope_id},
            jsonpCallback: 'tag18update',
            success: function (data) {
                if (data.err == 0) {
                    var scope_data = data['data'];

                    var start = others.newDate(scope_data['liveinfo'].start).getTime();
                    var end = others.newDate(scope_data['liveinfo'].end).getTime();
                    var applink = (scope_data['liveinfo'].app_link).replace(/\&amp\;/g, '&');
                    var link = (scope_data['liveinfo'].link).replace(/\&amp\;/g, '&');

                    if (now < start) {
                        var nextUpdateTime = start - now + 30 * 1000; // 直播开始前，查询直播开始时间，延时30s
                        setTimeout(update, nextUpdateTime);

                    } else if (now > start && now < end) {
                        if ($('.module-tbtitle').length != 0) {
                            $('.module-tbtitle').remove();
                        }
                        isLive(link, applink);
                        var liveTimeout = window.setTimeout(update, refreshTime);

                    } else if (now > end) {
                        if (liveTimeout) {
                            window.clearTimeout(liveTimeout);
                        }
                        var tagPlayerInfo = scope_data['playerinfo'];
                        var afterLiveTpl = _.template($('#after18Tpl').html());
                        var $html = afterLiveTpl({data: tagPlayerInfo});
                        var $gold_18 = $('.gold_18');
                        $gold_18.empty();
                        $gold_18.append($html);
                    }
                }
            }
        });
    };
    update();
});