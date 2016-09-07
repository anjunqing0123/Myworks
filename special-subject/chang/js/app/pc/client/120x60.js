/* 
* @Author: WhiteWang
* @Date:   2015-09-10 17:44:06
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-11-03 11:08:57
*/
define(function(require,exports) {
    var $=require('jquery'),
        _=require('underscore'),
        formatVote=require('../../../util/vote/formatVote'),
        formatDate=require('../../../util/date/format'),
        serverTime = require('../../../util/Timer/servertime'),
        timer = require('../../../util/Timer/timer'),
        voteMap = require('../../../util/vote/voteupdate'),
        Loader = require('../../../util/loader/loader'),
        client = require('client'),
        cookie = require('../../../util/cookie/cookie'),
        api = require('../../../util/linkcfg/interfaceurl')['interface'],
        ChangVote = require('../../../util/vote/vote');
    require('../../../util/countdown/countdown')($);

    var template_live = _.template(''+
        '<div class="wrap">'+
            '<div class="module module-pk">'+
                '<div class="user">'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player1_info.username %>" target="_blank"><img src="<%= player1_info.avatar %>" /></a>'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player1_info.username %>" target="_blank"><p class="name" title="<%= player1_info.real_name %>"><%= player1_info.real_name %></p></a>'+
                    '<p class="vote active" data-prior="1" data-voteid="<%= player1_info.voteid %>"><span class="icon"></span><span class="text">给TA投票</span></p>'+
                '</div>'+
                '<div class="user">'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player2_info.username %>" target="_blank"><img src="<%= player2_info.avatar %>" /></a>'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player2_info.username %>" target="_blank"><p class="name" title="<%= player2_info.real_name %>"><%= player2_info.real_name %></p></a>'+
                    '<p class="vote active" data-prior="1" data-voteid="<%= player2_info.voteid %>"><span class="icon"></span><span class="text">给TA投票</span></p>'+
                '</div>'+
                '<div class="counter">'+
                    '<p>倒计时</p>'+
                    '<span>00:23:23</span>'+
                '</div>'+
                '<span class="vs">VS</span>'+
            '</div>'+
        '</div>');
    //未开始
    var template_before_item = _.template(''+
        '<div class="wrap">'+
            '<div class="module module-wpk">'+
                '<div class="user">'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player1_info.username %>" target="_blank"><p class="name" title="<%= player1_info.real_name %>"><%= player1_info.real_name %></p></a>'+
                '</div>'+
                '<div class="user">'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player2_info.username %>" target="_blank"><p class="name" title="<%= player2_info.real_name %>"><%= player2_info.real_name %></p></a>'+
                '</div>'+
                '<span class="vs">VS</span>'+
                '<div class="time"><%= begintime %>开始PK</div>'+
            '</div>'+
        '</div>');
    //已经结束
    var template_after_item = _.template(''+
        '<div class="wrap">'+
            '<div class="module module-wpk">'+
                '<div class="user">'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player1_info.username %>" target="_blank"><p class="name" title="<%= player1_info.real_name %>"><%= player1_info.real_name %></p></a>'+
                    '<p class="vote <%= voteStatus %>" data-prior="2" data-voteid="<%= player1_info.voteid %>"><span class="icon"></span><span class="text"><%= player1_info.votenum %>票</span></p>'+
                '</div>'+
                '<div class="user">'+
                    '<a href="http://chang.pptv.com/pc/player?username=<%= player2_info.username %>" target="_blank"><p class="name" title="<%= player2_info.real_name %>"><%= player2_info.real_name %></p></a>'+
                    '<p class="vote <%= voteStatus %>" data-prior="2" data-voteid="<%= player2_info.voteid %>"><span class="icon"></span><span class="text"><%= player2_info.votenum %>票</span></p>'+
                '</div>'+
                '<span class="vs vs2">VS</span>'+
            '</div>'+
        '</div>');

    function updateVideoList(obj){
        var player1 = obj.player1_info;
        var player2 = obj.player2_info;
        if(player1.is_group==1){
            player1['real_name']=player1['group_name'];
        }
        if(player2.is_group==1){
            player2['real_name']=player2['group_name'];
        }
        var html = '<a title="主持人" href="javascript:;" class="inner'+ (webcfg.cid==obj.main_cid ? ' cur': '') +'" data-cid="'+obj.main_cid+'"><img src="'+webcfg.img+'" /><span class="cover">主持人</span></a>';
        html += '<a title="'+player1.real_name+'" href="javascript:;" class="inner'+(webcfg.cid==player1.cid?' cur':'')+'" data-cid="'+player1.cid+'"><img src="'+player1.avatar+'" /><span class="cover">'+player1.real_name+'</span></a>';
        html += '<a title="'+player2.real_name+'" href="javascript:;" class="inner'+(webcfg.cid==player2.cid?' cur':'')+'" data-cid="'+player2.cid+'"><img src="'+player2.avatar+'" /><span class="cover">'+player2.real_name+'</span></a>';
        var $wrap = $('<div class="wrap"><div class="module module-ml">'+html+'</div></div>');
        $('body').append($wrap);
        $wrap.find('a').on('click', function(){
            if($(this).hasClass('cur')) return;
            var cid = $(this).attr('data-cid');
            client.playById(cid, 0, cid);
            // window.location.href='http://chang.pptv.com/client?cid='+cid+'&tpye=live';
        })
    }

    function updateLive(obj){
        if($.isArray(obj)){
            return;
        }
        updateVideoList(obj);   //视频流切换
        var player1=obj['player1_info'];
        var player2=obj['player2_info'];
        player1['votenum']=formatVote(player1['votenum']);
        player2['votenum']=formatVote(player2['votenum']);
        if(player1.is_group==1){
            player1['real_name']=player1['group_name'];
        }
        if(player2.is_group==1){
            player2['real_name']=player2['group_name'];
        }
        var nextId=player1['id'];
        var tempHtml=template_live(obj);
        $('body').append(tempHtml);

    }
    function updateBefore(arr){
        if(arr.length===0){
            return;
        }
        var totalHtml="";
        for(var i=0;i<arr.length;i++){
            var tempDate=new Date(arr[i].start*1000);
            arr[i].begintime=formatDate(tempDate,"hh:mm");
            var player1=arr[i]['player1_info'];
            var player2=arr[i]['player2_info'];
            if(player1.is_group==1){
                player1['real_name']=player1['group_name'];
            }
            if(player2.is_group==1){
                player2['real_name']=player2['group_name'];
            }
            //console.log(arr[i].begintime);
            totalHtml+=template_before_item(arr[i]);
        }
        $('body').append(totalHtml);
    }

    function updateAfter(arr){
        if(arr.length===0){
            return;
        }
        serverTime.get(function(t, o){
            var totalHtml="";
            for(var i=arr.length-1;i>=0;i--){
                //正序输出
                var player1=arr[i]['player1_info'];
                var player2=arr[i]['player2_info'];
                player1['votenum']=formatVote(player1['votenum']);
                player2['votenum']=formatVote(player2['votenum']);
                if(player1.is_group==1){
                    player1['real_name']=player1['group_name'];
                }
                if(player2.is_group==1){
                    player2['real_name']=player2['group_name'];
                }
                arr[i]['winner'] = player1['win']===1 ? 'player1' : 'player2';
                arr[i]['voteStatus'] = getVoteStatus(arr[i], t);
                totalHtml+=template_after_item(arr[i]);
            }
            $('body').append(''+
                '<div class="wrap">'+
                    '<div class="module module-pkline">'+
                        '<span class="line"></span>'+
                        '<span class="text">PK完成</span>'+
                    '</div>'+
                '</div>').append(totalHtml);
            bindVoteClick({dom:'.module-wpk .vote.active'});
            resetVoteMap();
        })

    }

    //投票结束时间为第二天12点
    function getVoteStatus(obj, currentTime){
        obj.end = Number(obj.end)
        var endDate = new Date(obj.end*1000);
        endDate.setHours(0);
        endDate.setMinutes(0);
        endDate.setSeconds(0);
        endDate = endDate.getTime()+(36*60*60*1000);
        endDate = new Date(endDate);
        if(endDate<currentTime){
            return 'disable';
        } else {
            return 'active';
        }
    }

    function bindVoteClick(options){
        var pauseTime = 10;
        var opt = $.extend({
            dom: '.vote.active'
        }, options);
        var $dom = $(opt.dom);
        new ChangVote({
            dom: $dom,
            voteAttr: 'data-voteid',
            beforeVote: function(data, el){
                $(el).countdown();
                cookie.set('_c_'+data.id, (new Date()).getTime(), 1/24/(3600/pauseTime), 'pptv.com', '/')
                return true;
            },
            afterVote: function(data, el){
                var $el = $(el);
                if(data.counter && !$el.hasClass('none-num')){
                    $el.find('.text').html(formatVote(data.counter)+'票');
                } else if(data.errors){
                    // alert(data.errors.message);
                }
            }
        })
        $dom.each(function(i, el){
            var id = $(el).attr('data-voteid');
            var co = cookie.get('_c_'+id);
            if(co){
                co = Number(co);
                d = (new Date()).getTime();
                $(el).countdown({timing: pauseTime-Math.floor((d-co)/1000)});
            }
        })
    }

    function handleNextRequest(nextRequestTime, id){
        var $dom = $('.counter span');
        if(nextRequestTime<=0){
            return;
        }
        serverTime.get(function(t, o){
            if(t.getTime()>nextRequestTime){
                setTimeout(function(){
                    requestPkList(id);
                },10 * 1000)
            } else {
                timer({
                    startTime: t,
                    endTime: new Date(nextRequestTime),
                    serverOffsetTime: o,
                    callback: function(status, times){
                        if(status ==2){
                            $dom.html('00:00:00');
                            requestPkList(id);
                        } else {
                            $dom.html(times.hours+':'+times.minitues+':'+times.seconds);
                        }
                    }
                });
            }
        })
    }

    var voteMapInterval = null;
    function resetVoteMap(){
        voteMap.reset();
        clearInterval(voteMapInterval);
        voteMap.init({
            selector: '.vote',
            voteAttr: 'data-voteid',
            prior: 'data-prior'
        });
        voteMapInterval = setInterval(function(){
            getVotes();
        },45 * 1000);
        getVotes();
    }
    function getVotes(){
        voteMap.getVotes({
            callback: function(map, idArray){
                var prior2 = map.prior[2];
                if(prior2){
                    for(var i=0,len=prior2.length; i<len; i++){
                        var obj = map[prior2[i]];
                        var counter = obj.data.counter;
                        var doms = obj.doms;
                        for(var j=0; j<doms.length; j++){
                            doms[j].find('.text').html(formatVote(counter)+'票');
                        }
                    }
                }
                var prior1 = map.prior[1];
                if(prior1){
                    for(var i=0,len=prior1.length; i<len; i++){
                        var obj = map[prior1[i]];
                        var counter = obj.data.counter;
                        var doms = obj.doms;
                        for(var j=0; j<doms.length; j++){
                            doms[j].find('.text').html(formatVote(counter)+'票');
                        }
                    }
                }
            }
        });
    }

    function requestPkList(id){
        if(!window.webcfg.cid){
            return false;
        }

        var tempData={
            cid: window.webcfg.cid
        }
        if(!!id){
            tempData.id=id;
        }
        // $('body').html('<img src="http://sr4.pplive.com/cms/13/69/d2174ec3abccff6bd471173f8f1ab9b4.gif" />');
        Loader.load(api.PKList_pc, tempData, function(data){
            if(data.code==1){
                var nowObj=data.data.start;
                var beforeArr=data.data.ready;
                var afterArr=data.data.end;
                var nextRequestTime = 0;
                var nextId = null;
                if(nowObj && nowObj.end){
                    nextRequestTime = nowObj.end * 1000;
                    nextId = nowObj.player1_info.id;
                    // console.log(['nowObj-->', new Date(nextRequestTime), 'nextId--->', nextId]);
                } else if(afterArr.length==0 && nowObj.length==0 && beforeArr[0] && beforeArr[0].start) {
                    nextRequestTime = beforeArr[0].start *1000;
                    // console.log(['beforeArr-->', new Date(nextRequestTime), 'nextId--->', nextId]);
                }
                $('body').html('');
                updateLive(nowObj);
                updateBefore(beforeArr);
                updateAfter(afterArr);
                bindVoteClick();
                handleNextRequest(nextRequestTime, nextId);
            }else if(data.code==-2){
                //console.log('time is not match');
            }
        });
    }
    requestPkList();
});