/* 
* @Author: WhiteWang
* @Date:   2015-09-08 20:58:13
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-11-13 15:32:13
*/
define(function(require){
    var VCanvas = require('../../../util/vcanvas/vcanvas'),
        voteMap = require('../../../util/vote/voteupdate'),
        ChangVote = require('../../../util/vote/vote'),
        formatVote=require('../../../util/vote/formatVote'),
        timer = require('../../../util/Timer/timer'),
        serverTime = require('../../../util/Timer/servertime'),
        api = require('../../../util/linkcfg/interfaceurl')['interface'],
        Loader = require('../../../util/loader/loader'),
        cookie = require('../../../util/cookie/cookie'),
        _ = require('underscore'),
        $ = require('jquery');
    require('../../../util/countdown/countdown')($);


    function addKannma(number) {
        //测试千万数据
        //num=12235400;
        //测试亿数据
        //num=123500000;
        //num=12000;
        //digit=2;
        if(number==null||number==0){
            return 0;
        }
        if(number.length<4){
            return number;
        }
         var num = number + "";  
         num = num.replace(new RegExp(",","g"),"");   
         // 正负号处理   
         var symble = "";   
         if(/^([-+]).*$/.test(num)) {   
             symble = num.replace(/^([-+]).*$/,"$1");   
             num = num.replace(/^([-+])(.*)$/,"$2");   
         }   
       
         if(/^[0-9]+(\.[0-9]+)?$/.test(num)) {   
             var num = num.replace(new RegExp("^[0]+","g"),"");   
             if(/^\./.test(num)) {   
             num = "0" + num;   
             }   
       
             var decimal = num.replace(/^[0-9]+(\.[0-9]+)?$/,"$1");   
             var integer= num.replace(/^([0-9]+)(\.[0-9]+)?$/,"$1");   
       
             var re=/(\d+)(\d{3})/;  
       
             while(re.test(integer)){   
                 integer = integer.replace(re,"$1,$2");  
             }   
             return symble + integer + decimal;   
       
         } else {   
             return number;   
         }   
     }


var pauseTime = 10;
var pauseTime2 = 60;
//绑定页面上的所有投票
//最后会调用getVote方法，通过callback更新dom
var voteMapCallback = {};
voteMap.init({
    selector: '.cheerBtn',
    voteAttr: 'data-sid',
    prior: 'data-prior'
}); //为TA喝彩更新
voteMapCallback[1] = function(){
    var opt = arguments[0];
    var counter = opt.data.counter;
    $('.module-cheer .ticket-num').html(addKannma(counter)+'票');
};

//为Ta喝彩按钮点击处理逻辑
(function(){
    var $dom = $('.cheerBtn');
    new ChangVote({
        dom: $dom,
        voteAttr: 'data-sid',
        beforeVote: function(data, el){
            return true;
        },
        afterVote: function(data, el){
            if(data.counter){
                var $el = $(el);
                $el.countdown({timing:pauseTime2});
                var $add = $('<span class="addIcon"></span>');
                $el.parent().append($add);
                $add.animate({
                    top: '-16px',
                    opacity: 0
                }, 500, function(){
                    $add.remove();
                });
                cookie.set('_c_'+data.id, (new Date()).getTime(), 1/24/(3600/pauseTime2), 'pptv.com', '/');
                $('.ticket-num').html(addKannma(data.counter)+'票');
            } else if(data.errors){
                if(data.errors.code==88){
                    alert("请休息一会儿再投票哦！");
                }else if(data.errors.code==91){
                    alert('投票未开始');
                }
            }
        }
    });
    $dom.each(function(i, el){
        var id = $(el).attr('data-sid');
        var co = cookie.get('_c_'+id);
        if(co){
            co = Number(co);
            d = (new Date()).getTime();
            $(el).countdown({timing: pauseTime2-Math.floor((d-co)/1000)});
        }
    })
})();

//跑步机功能
(function(){
    var speedUpdated = false;
    //创建一个跑步机投票canvas
    var disc = new VCanvas({
        canvas: 'speed',
        font: '20px Arial',
        lineLength: 30,
        lineWidth: 3,
        scale: 0.5,
        textRadius: 130,
        lineRadius: 115
    });

    //一开始跑步机是0档
    disc.redraw(0,0);    //重绘投票canvas
    drawPointer(0,1);

    //请求跑步机投票数据
    Loader.load(api.gettreadmill, window.webcfg, function(data){
        if(data.code==1){
            var data=data.data;
            bindVoteId(data);   //根据数据重绘投票canvas，绑定加速减速按钮事件
        }
    });

    //根据数据重绘投票canvas，绑定加速减速按钮事件
    function bindVoteId(data){
        var $upBtn = $('.btn-add'),
            $downBtn = $('.btn-min'),
            upNum = data.speedUpVote.counter,
            downNum = data.slowDownVote.counter;
        $upBtn.attr('data-sid', data.speedUpVoteId);
        $downBtn.attr('data-sid', data.slowDownVoteId);
        voteMap.add({
            selector: '.btn-add, .btn-min',
            voteAttr: 'data-sid',
            prior: 'data-prior'
        }); //增加更新投票数据，会在最后的getVotes中处理
        voteMapCallback[2] = function(){
            if(!speedUpdated){
                return;
            }
            var obj1 = arguments[0],
                obj2 = arguments[1];
            if(!obj1.data || !obj2.data){
                return;
            }
            if(obj1.id==data.speedUpVoteId){
                upNum = obj1.data.counter || upNum;
            } else if(obj1.id == data.slowDownVoteId){
                downNum = obj1.data.counter || downNum;
            }
            if(obj2.id == data.speedUpVoteId){
                upNum = obj2.data.counter || upNum;
            } else if(obj2.id == data.slowDownVoteId){
                downNum = obj2.data.counter || downNum;
            }
            // disc.redraw(upNum, downNum);
            // drawPointer(upNum, downNum);
        }
        // disc.redraw(upNum, downNum);    //重绘投票canvas
        // drawPointer(upNum, downNum);
        endCountDown(webcfg.endTime*1000);   //倒计时
    }

    function drawPointer(upNum, downNum){
        var t = 83;
        var $pointer = $('.pointer');
        var deg = t-(t*2*downNum/(upNum+downNum));
        $pointer.css('-webkit-transform', 'rotate('+deg+'deg)');
    }

    function endCountDown(endTime){
        serverTime.get(function(date, offset){
            var $countdown = $('.counttime');
            timer({
                startTime: date,
                endTime: new Date(endTime),
                serverOffsetTime: offset,
                callback: function(status, times){
                    if(status==1){
                        $countdown.html(times.hours+':'+times.minitues+':'+times.seconds);
                        if(Number(times.hours) < 1 && !speedUpdated){
                            getSpeed();
                        }
                    } else if(status==2){
                        $countdown.html('00:00:00');
                        $('.btn-add, .btn-min').addClass('disable').attr('title', '投票已结束');
                    }
                }
            })
        });

    }

    //获取跑步机速度
    function getSpeed(){
        Loader.load(api.speed, {
            cid: window.webcfg.cid
        }, function(data){
            data = data.data;
            $('.run p strong').html(data.speed);
            // var sp = 1;
            var sp = Number(data.speed);
            disc.redraw(sp, 5-sp);
            drawPointer(sp, 5-sp);
            $('.btn-add, .btn-min').removeClass('disable').attr('title', '');
            if(!speedUpdated){
                var $dom = $('.btn-add, .btn-min');
                new ChangVote({ //绑定投票点击事件
                    dom: $dom,
                    voteAttr: 'data-sid',
                    beforeVote: function(data, el){
                        if($(el).hasClass('disable')){
                            return false;
                        } else {
                            return true;
                        }
                    },
                    afterVote: function(data, el){
                        if(data.errors){
                            if(data.errors.code==88){
                                alert("请休息一会儿再投票哦！");
                            }else if(data.errors.code==91){
                                alert('投票未开始');
                            }
                        } else {
                            $(el).countdown();
                            cookie.set('_c_'+data.id, (new Date()).getTime(), 1/24/(3600/pauseTime), 'pptv.com', '/');
                        }
                    }
                });
                $dom.each(function(i, el){
                    var id = $(el).attr('data-sid');
                    var co = cookie.get('_c_'+id);
                    if(co){
                        co = Number(co);
                        d = (new Date()).getTime();
                        $(el).countdown({timing: pauseTime-Math.floor((d-co)/1000)});
                    }
                })
            }
            speedUpdated = true;
            if(data.offline_on){
                serverTime.get(function(t, o){
                    timer({ //到时间以后重新获取
                        startTime: t,
                        endTime: new Date(data.offline_on*1000),
                        serverOffsetTime: o,
                        callback: function(status, times){
                            // console.log(times.hours+':'+times.minitues+':'+times.seconds)
                            if(status==2){
                                setTimeout(function(){
                                    getSpeed();
                                }, 3000)
                            }
                        }
                    })
                })
            }
        })
    }
})();

//歌单模块
//20分钟倒计时 听你想听
(function(){
var tpSongList = _.template(''+
        '<div class="songticket">'+
            '<span class="progress" style="width:<%= percent %>%;"></span>'+
            '<span class="song"><%= title %></span>'+
            '<span class="ticket"><%= counter %>票</span>'+
            '<a href="javascript:;" class="btn" data-sid="<%= voteId %>" data-prior="3">确认投票</a>'+
        '</div>');
var $module = $('.module-20min');
var $moduleHsy = $('.module-songlist');

function getLength(maxLenth, num, rate) {
    // 该方法保证正相关，但是不成正比，目的是减小两个相差比较大的数之间的差值。
    // rata 是一个倍率，设成较大值的1/4比较合适。
    if (num === 0) {
        return 0;
    }
    var minLenth = 10;
    return minLenth + Math.atan(num / rate) / Math.PI * 2 * (maxLenth - minLenth);
}

//点击选中事件
$module.on('click', '.songticket', function(ev){
    if($(ev.target).hasClass('btn')){
        return;
    }
    var $list = $(this);
    if($list.hasClass('s1')){
        $list.removeClass('s1');
    } else {
        $module.find('.songticket').removeClass('s1');
        $list.addClass('s1');
    }
});

//倒数计时更新处理
var $timerProgress = $module.find('.timer .progress');
function updateCountDom(times, total){
    var h = Number(times.hours),
        m = Number(times.minitues),
        s = Number(times.seconds);
    var t = h*3600+m*60+s;
    if(t>total){
        t = total;
    }
    $timerProgress.width(((total-t)*100/total) + '%').find('span').html(times.hours+':'+times.minitues+':'+times.seconds);
}

//
function updateSingList(list){
    $module.find('.songticket').remove();
    var tracks = list.tracks;
    var len = tracks.length;
    var totalVotes = 0;
    var html = '';
    var maxCount = _.max(list, function(l){
        l.counter = l.vote.counter || 0;
        return l.counter
    }).counter;
    for(var i=0; i<len; i++){
        var obj = tracks[i];
        obj.percent = getLength(90, obj.counter, maxCount/4);
        obj.counter = formatVote(obj.counter);
        html+= tpSongList(obj);
    }
    $module.append(html);
    bindVote();
    bindVoteMap();
}

//绑定点击事件
function bindVote(){
    new ChangVote({
        dom: $module.find('.btn'),
        voteAttr: 'data-sid',
        beforeVote: function(data, el){
            return true;
        },
        afterVote: function(data, el){
            if(data.counter){
                $module.find('.btn').countdown();
                var $parent = $(el).parent();
                var $add = $('<span class="addIcon"></span>');
                $parent.append($add);
                $add.animate({
                    top: '-38px',
                    opacity: 0
                }, 500, function(){
                    $add.remove();
                    $parent.removeClass('s1');
                })
                $(el).siblings('.ticket').html(formatVote(data.counter)+'票');
            }
            if(data.errors){
                if(data.errors.code==88){
                    alert("请休息一会儿再投票哦！");
                }else if(data.errors.code==91){
                    alert('投票未开始');
                }
            }
        }
    })
}

//绑定投票map，定时统一更新，见最后的voteMap.getVotes
function bindVoteMap(){
    voteMap.delPrior(3);
    voteMap.add({
        selector: $module.find('.btn'),
        voteAttr: 'data-sid',
        prior: 'data-prior'
    }); //增加更新投票数据，会在最后的getVotes中处理
    voteMapCallback[3] = function(){
        var lists = arguments;
        var rate = _.max(lists, function(list){
            return list.data.counter;
        }).data.counter/4;
        for(var i=0, len=lists.length; i<len; i++){
            var list = lists[i];
            var count = list.data.counter;
            for(var j=0; j<list.dom.length; j++){
                var $dom = list.dom[j];
                $dom.siblings('.ticket').html(formatVote(counter)+'票');
                $dom.siblings('.progress').width(getLength(90, counter, rate)+'%');
            }
        }
    }
}

//历史歌单处理
function updateHistoryList(list){
    if(!list || !list.length){
        return;
    }
    $('.js-songList').show();
    var html = '<h2>历史歌单</h2>';
    for(var i=0,len=list.length; i<len; i++){
        var tracks = list[i].tracks;
        var maxItem = _.max(tracks, function(track){
            return track.vote.counter || 0;
        });
        html+= '<span class="list">'+maxItem.title+'</span>';
    }
    $moduleHsy.html(html);
}

//当前正在唱的歌单处理
function updateNowList(list, nextRequest){
    if(!list || !list.length){
        return;
    }
    list = list[0];
    serverTime.get(function(serverTime, offsetTime){
        var endTime = new Date(list.endedAt);
        var totalSeconds = parseInt((endTime.getTime()-serverTime.getTime())/1000);
        timer({
            startTime: serverTime,
            endTime: endTime,
            serverOffsetTime: offsetTime,
            callback: function(status, times){
                updateCountDom(times, totalSeconds);
                if(status==2 && nextRequest){
                    requestSingList();
                }
            }
        })
    });
    updateSingList(list);
}

function requestSingList(){
    Loader.load(api.singList, window.webcfg, function(data){
        if(data.code==1){
            serverTime.get(function(serverTime, offsetTime){
                var playlists = data.data.playlists;
                var countI = null; //用来判断是否要发送下一次请求
                var nowArray = [];
                var befArray = [];
                var len = playlists.length;
                var nextRequestTime = 0;
                for(var i=0; i<len; i++){
                    var obj = playlists[i];
                    var startTime = new Date(obj.startedAt);
                    var endTime = new Date(obj.endAt);
                    if(serverTime>=startTime && serverTime<endTime){
                        nowArray.push(obj);
                        countI = i;
                    } else if(serverTime>=endTime){
                        befArray.push(obj);
                    }
                }
                if(countI!=null && countI<len-1){   //如果歌单列表里的最后一个歌单，已经进入了nowArray，则不发送下一次请求，因为所有歌单都已经唱完了
                    updateNowList(nowArray, true);
                } else {
                    updateNowList(nowArray, false);
                }
                updateHistoryList(befArray);
            })

        }
    })
}

// requestSingList();


})();



//通过getVote获取投票数据，统一更新dom
//根据prior字段分发处理
function voteFilter(){
    voteMap.getVotes({
        callback: function(map, idArray){
            var prior = map.prior;
            for(var i in prior){
                var pArr = prior[i];
                var tArr = [];
                for(var j=0, l=pArr.length; j<l; j++){
                    var obj = map[pArr[j]];
                    obj.id = pArr[j];
                    tArr.push(obj);
                }
                if(voteMapCallback[i]){
                    voteMapCallback[i].apply(null, tArr);
                }
            }
        }
    })
}
function updateRewardMoney(){
    Loader.load(api['reward'], window.webcfg, function(data){
        if(data.err===0){
            data = data.data;
            var playerCount=0;
            var totalCount=0;
            for(var i in data){
                totalCount+=Number(data[i]);
                if(i == window.webcfg.player_id){
                    playerCount+=data[i];
                }
            }
            if(totalCount==0){
                var percent=0+'%';
            }else{
                var percent=Math.round(Number(playerCount)/totalCount*1000)/10+'%';
            }
            var $dom = $('.ticket-per span');
            $dom.html(percent).css('width', percent);
        }
    })
}
voteFilter();
updateRewardMoney();
setInterval(function(){
    voteFilter();   //投票数据更新
    updateRewardMoney();    //获得奖金更新
}, 30000);



});