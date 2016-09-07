/* 
* @Author: WhiteWang
* @Date:   2015-10-28 10:22:06
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-11-19 15:47:53
*/

define(function(require,exports){
    var $ = require('jquery'),
        cookie = require('../../../util/cookie/cookie'),
        Loader = require('../../../util/loader/loader'),
        api = require('../../../util/linkcfg/interfaceurl')['interface'],
        numToChinese = require('../../../util/numbertochinese/numbertochinese'),
        formatVote=require('../../../util/vote/formatVote'),
        _ = require('underscore'),
        ChangVote = require('../../../util/vote/vote');
    require('../../../util/countdown/countdown')($);

var pauseTime = 10;

//前进后退
(function(){
    var $dom = $('.back, .go');
    new ChangVote({
        dom: $dom,
        voteAttr: 'sid',
        beforeVote: function(data, el){
            return true;
        },
        afterVote: function(data, el){
            if(data.errors){
                alert('休息一会再来投票吧');
            } else if(data.counter){
                var $el = $(el);
                $el.countdown();
                var $add = $('<i>+1</i>');
                $el.append($add);
                $add.animate({
                    top: '-20px',
                    opacity: 0
                }, 500, function(){
                    $add.remove();
                });
                cookie.set('_c_'+data.id, (new Date()).getTime(), 1/24/(3600/pauseTime), 'pptv.com', '/');
            }
            
        }
    });
    $dom.each(function(i, el){
        var id = $(el).attr('sid');
        var co = cookie.get('_c_'+id);
        if(co){
            co = Number(co); 
            d = (new Date()).getTime();
            $(el).countdown({timing: pauseTime-Math.floor((d-co)/1000)});
        }
    })
})();

//计票tips
(function(){
    var $link = $('.link');
    var $tips = $('.tips');
    var showTimer, hideTimer;
    $link.on('mouseenter', function(){
        clearTimeout(hideTimer);
        showTimer = setTimeout(function(){
            $tips.fadeIn();
        }, 200);
    }).on('mouseleave', function(){
        clearTimeout(showTimer);
        hideTimer = setTimeout(function(){
            $tips.fadeOut();
        },200);
    });
    $tips.on('mouseenter', function(){
        clearTimeout(hideTimer);
    }).on('mouseleave', function(){
        hideTimer = setTimeout(function(){
            $tips.fadeOut();
        },200)
    })
})();

//比赛结果
//http://chang.pptv.com/api/match_result?cid=2822237542
(function(){
    var tp = _.template(''+
        '<dd class="cf">'+
            '<a href="javascript:;" title="<%= name %>" class="name fl"><%= name %></a>'+
            '<div class="fr">'+
                '<p>登乐时间：<%= times %>s</p>'+
                '<p>'+
                    '<span class="zan">前进：<%= praise %>票</span>'+
                    '<span class="cai">后退：<%= hate %>票</span>'+
                '</p>'+
            '</div>'+
            '<%= up ? \'<i class="jinji"></i>\':\'\' %>'+
        '</dd>')
    $dom = $('.module-result .bd');
    function loadResult(){
        Loader.load(api.matchResult, {cid: webcfg.cid}, function(data){
            if(data && data.err===0){
                data = data.data;
                var count = 1;
                var html = [];
                var playList = data.playList;
                for(var i in playList){
                    html.push('<dl><dt><em></em><h4>第'+numToChinese.get(count)+'轮</h4></dt>');
                    var arrData=playList[i];
                    for(var j=0,len=arrData.length; j<len; j++){
                        var d=arrData[j];
                        html.push(tp({
                            name: d.player,
                            times: d.player_time,
                            praise: formatVote(d.player_praise),
                            hate: formatVote(d.player_hate),
                            up: (d.player_up==1) ? true : false
                        }));
                    }
                    html.push('</dl>');
                    count++;
                }
                var $html = $(html.join(''));
                $dom.html($html);
                if(data.is_end!="1"){
                    $html.eq(-1).append('<dd><p class="nomore">比赛结果敬请期待</p></dd>');
                    setTimeout(function(){
                         loadResult();
                    },60*1000);
                }
            } else {
                $dom.html('<dl><dd><p class="nomore">比赛结果敬请期待</p></dd></dl>');
                setTimeout(function(){
                    loadResult();
                }, 60*1000);
            }
        })
    }
    loadResult();
})();

});