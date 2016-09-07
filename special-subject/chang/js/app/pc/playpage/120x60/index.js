define(function(require, exports) {
  var $ = require('jquery');
  var _ = require('underscore');
  var formatDate = require('../../../../util/date/format');
  var timer = require('../../../../util/Timer/timer');
  var formatVote = require('../../../../util/vote/formatVote');
  var log = require('../../../../util/log/log');
  var loader = require('../../../../util/loader/loader');
  var urls = require('../../../../util/linkcfg/interfaceurl');
  var uniformDate = require('../../../../util/vote/uniformDate');
  var appBarrage = require('../../../../util/barrage/barrage');
  //播放器事件
  require('../../../../util/pub/main');
  var login = require('../../../../util/login/login');
  var user = require('../../../../util/user/user');
  //依赖结束
  //放省略号
  var limit = require('../../personspace/limit');
  var cookie = require('../../../../util/cookie/cookie');
  //console.log(limit);
  //切换视频
  var playList = [];
  var avatars = $(".module-liveimg-group .avatar");
  //刷票timer
  var timerInterval = null;
  //刷票时间config
  var freshTime = 45;
  //绑定切换视频事件
  avatars.on("click", function() {
    var obj = $(this);
    var idx = obj.index();
    if (player.isReady == true) {
      if (!!playList[idx]) {
        player.goToAndPlay(playList[idx]);
        obj.siblings().removeClass('active');
        obj.addClass('active');
      }
    }
  });
  //直播中hover态
  $(".module-pking-120x60").on("mouseenter", ".vote-icon", function() {
    var obj = $(this);
    if (obj.siblings('.vote-mask').css('display') == 'none') {
      $(this).addClass('active');
    }
  }).on('mouseleave', ".vote-icon", function() {
    $(this).removeClass('active');
  });
  var DomPlayer = $('#pptv_playpage_box');
  var BarrageHeight = 0;
  //投票配置
  var counterDefault = 10;

  function getCounter(voteid, first) {
    //first 页面打开加载
    var getCookieVal = cookie.get("_c_" + voteid);
    if (!getCookieVal) {
      if (first != true) {
        cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24 / (3600 / counterDefault), ".pptv.com", "/");
        //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
      }
      return counterDefault;
    } else {
      var eclipseTime = Math.floor(new Date().getTime() / 1e3) - Number(getCookieVal);
      if (counterDefault - eclipseTime < 0) {
        cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24 / (3600 / counterDefault), ".pptv.com", "/");
        //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
        return counterDefault;
      }
      return counterDefault - eclipseTime;
    }
  }
  //弹幕
  (function() {

    $('.module-playbox-page .playbox').append('<div class="barrage" id="barrage"></div>');

    var hasInited = false;
    var barrageapp = new appBarrage({
      wrapbox: $('#barrage'),
      player: window.player
    });
    require('../../../../util/barrage/player-plugin-barrage').init(barrageapp);
    player.onRegister('setupbarrage', function(data) {
      var dataContent = data.body && data.body.data || {};
      log('player :: setupbarrage ==>', data, dataContent);
      if (hasInited) return;
      hasInited = true;

      //判断是否支持弹幕 'mode' : 1  或 0  代表   有或无
      if (dataContent.mode === 0) {
        barrageapp.none();
      } else {
        barrageapp.init();
        barrageapp.add({
          userName: 'sysmsg',
          nickName: '系统消息',
          playPoint: +new Date(),
          vipType: 0,
          content: '欢迎进入' + (webcfg.p_title || '') + '!'
        });
      }

      //启动
      $.publish('barrage:init');

    });
  })();


  var isTheatreMode = false;
  var key = 'theatremode';
  var DomPlayerSideBar = $('#barrage');
  //剧场模式
  player.onRegister('theatre', function(data) {
    log('onRegister ==> theatre ', data, data.body.data.mode);
    var dataContent = data.body && data.body.data || {};
    cookie.set(key, dataContent.mode, 1, 'pptv.com', '/');
    /*window.scrollTo(0, 0);
    isSmallWindow = false;*/
    if (dataContent.mode === 1) {
      isTheatreMode = true;
      playForTheatre();
    } else {
      isTheatreMode = false;
      playForTheatre();
    }
  });

  function playForTheatre() {
    if (!!isTheatreMode) {
      DomPlayerSideBar.css('display', 'none');
      DomPlayer.animate({
        width: '100%'
      }, 400, 'swing');
    } else {
      //DomPlayerParent.css('width','680px');
      DomPlayer.animate({
        width: '680px'
      }, 400, 'swing', function() {
        DomPlayerSideBar.css('display', 'block');
      });
    }
  }



  var isClient = function() {
    //是否是客户端
    try {
      if (external && external.GetObject) {
        return true;
      }
    } catch (e) {}
    return false;
  }();
  //加入vip模块
  require('../../index/common-joinvip');
  //加入vip模块结束
  //更新流列表
  function updatePlayList(list) {
    playList = list;
    player.resetList(playList, playList[0]);
    player.onReady.add(function() {
      var playList = player.getPlayList();
      player.goToAndPlay(playList[0]);
    });
  }
  //获取服务器时间
  var serverOffsetTime = 0;
  //用于服务器时间获取失败记录的页面本地打开时间
  var pageStartTime = new Date().getTime();
  var getServerSuccess = false;
  $.ajax({
    url: 'http://time.pptv.com?time=' + new Date().getTime(),
    type: 'GET',
    dataType: 'jsonp',
    cache: true,
    jsonp: 'cb',
    success: function(data) {
      var servertime = new Date(data * 1000);
      serverOffsetTime=servertime.getTime()-new Date().getTime();
      getServerSuccess=true;
      requestPkList();
    },
    error: function() {
      requestPkList();
    },
    timeout: 1000
  });
  //获取现在的时间
  function getNow(cdnDate) {
    if (getServerSuccess == true) {
      return new Date(new Date().getTime() + serverOffsetTime);
    } else {
      if (!cdnDate) {
        return new Date();
      }
      var offsetTime = new Date().getTime() - pageStartTime;
      var tempPhpDate = new Date(cdnDate.getTime() + offsetTime);
      var clientOffsetTime = new Date().getTime() - tempPhpDate.getTime();
      //cdn 缓存<1小时，相信用户的时间
      if ((clientOffsetTime > 0 && clientOffsetTime < 1000 * 60 * 60) || (clientOffsetTime < 0 && clientOffsetTime > -1000 * 60 * 30)) {
        return new Date();
      } else {
        return tempPhpDate;
      }
    }
  }
  var pkContainer = $(".module-pking-120x60");
  var phpNowDate = uniformDate(pkContainer.attr('data-date'));
  var template_live = '<div class="grid cf"><div class="pk-player-wrap rel cf">' + '<div class="vs-tag alCenter">' + '<h3>倒计时</h3>' + '<p></p>' + '<h2>VS</h2>'
    // +'<p>正在直播</p>'
    + '</div>' + '<div class="pk-player fl rel">' + '<a class="avatar-item" title="<%= player1_info.title %>" href="<%= player1_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '  <img src="<%= player1_info.avatar %>" alt="<%= player1_info.title %>">' + ' <span class="alCenter title"><%= player1_info.real_name %></span>' + ' </a>' + ' <a class="vote-icon js-vote" data-id="<%= player1_info.voteid %>" data-prior="1">' + ' </a>' + '<i class="vote-add hidden"></i>' + '<i class="vote-mask hidden"></i>' + '<p><em><%= player1_info.votenum %></em>个顶</p>' + '<%if(player1_info.replace==true){%>' + '<i class="replace"></i>' + '<%} else { %>' + '<i class="num"><%=player1_info.rank%></i>' + ' <% } %>' + '</div>' + '<div class="pk-player fr rel">' + '<a class="avatar-item" title="<%= player2_info.title %>" href="<%= player2_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '   <img src="<%= player2_info.avatar %>" alt="<%= player2_info.title %>">' + '  <span class="alCenter title" title="<%= player2_info.title %>"><%= player2_info.real_name %></span>' + '</a>' + ' <a class="vote-icon js-vote" data-id="<%= player2_info.voteid %>" data-prior="1">' + ' </a>' + '<i class="vote-add hidden"></i>' + '<i class="vote-mask hidden"></i>' + '  <p><em><%= player2_info.votenum %></em>个顶</p>' + '<%if(player2_info.replace==true){%>' + '<i class="replace"></i>' + '<%} else { %>' + '<i class="num"><%=player2_info.rank%></i>' + ' <% } %>' + ' </div>' + '</div></div>';
  //未开始
  var template_before_item = '<div class="item cf rel mt10">' + '<div class="vs-tag alCenter">' + '<h2>VS</h2>' + '<p><%= begintime%></p>' + '</div>' + '<div class="pk-player fl rel">' + '<div class="infoWrap">' + '<a class="avatar" title="<%= player1_info.title %>" href="<%= player1_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '<img src="<%= player1_info.avatar %>" alt="<%= player1_info.title %>">' + '<em class="avatar-mask"></em>' + '</a>' + '<div class="title"><a href="<%= player1_info.url %>" title="<%= player1_info.title %>" <%if(isClient==false){%>target="_blank"<%}%>><%= player1_info.real_name %></a></div>' + '<a class="votewrap">' + '<b>顶</b>' + '<i>给TA投票</i>' + '</a>' + '<%if(player1_info.replace==true){%>' + '<i class="replace"></i>' + '<%} else { %>' + '<i class="num"><%=player1_info.rank%></i>' + ' <% } %>' + '</div>' + '</div>' + '<div class="pk-player fr rel">' + '<div class="infoWrap">' + '<a class="avatar" title="<%= player2_info.title %>" href="<%= player2_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '<img src="<%= player2_info.avatar %>" alt="<%= player2_info.title %>">' + '<em class="avatar-mask"></em>' + '</a>' + '<div class="title"><a href="<%= player2_info.url %>" title="<%= player2_info.title %>" <%if(isClient==false){%>target="_blank"<%}%>><%= player2_info.real_name %></a></div>' + '<a class="votewrap">' + '<b>顶</b>' + '<i>给TA投票</i>' + '</a>' + '<%if(player2_info.replace==true){%>' + '<i class="replace"></i>' + '<%} else { %>' + '<i class="num"><%=player2_info.rank%></i>' + ' <% } %>' + '</div>' + '</div>' + '</div>';
  //已经结束
  var template_after_item = '<div class="item cf rel mt10 <%if(isEnd==true){%>voteend<%}%>">' + '<div class="vs-tag alCenter">' + '<h2>VS</h2>' + '<% if(isEnd == true) { %>' + '<p>投票结束</p>' + '<%} else { %>' + '<p>PK结束</p>' + ' <% } %>' + '</div>' + '<div class="pk-player fl rel">' + '<div class="infoWrap">' + '<a class="avatar" title="<%= player1_info.title %>" href="<%= player1_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '<img src="<%= player1_info.avatar %>" alt="<%= player1_info.title %>">' + '<em class="avatar-mask"></em>' + '</a>' + '<div class="title"><a title="<%= player1_info.title %>" href="<%= player1_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>><%= player1_info.real_name %></a></div>' + '<%if(isEnd==true){%>' + '<a class="votewrap">' + '  <b>顶</b>' + ' <i><%= player1_info.votenum %>票</i>' + '</a>' + '<% } else { %>' + '<a class="votewrap <%if(canVote!=false){%>js-vote ms-pointer<%}%>" <%if(canVote!=false){%>data-id="<%= player1_info.voteid %>"<%}%> data-prior="2">' + '  <b>顶</b>' + ' <i><%= player1_info.votenum %>票</i>' + '<em class="vote-add hidden"></em>' + '<em class="vote-mask hidden"></em>' + '</a>' + '<%if(player1_info.replace==true){%>' + '<i class="replace"></i>' + '<%} else { %>' + '<i class="num"><%=player1_info.rank%></i>' + ' <% } %>' + ' <% } %>' + '</div>' + '<% if(isEnd == true) { %>' + '<%if(player1win==0){%>  <div class="icon-lose"></div> <%}%>' + '<%if(player1win==1){%>  <div class="icon-win"></div> <%}%>' + '<% } %>' + '</div>' + '<div class="pk-player fr rel">' + '<div class="infoWrap">' + '<a class="avatar" title="<%= player2_info.title %>" href="<%= player2_info.url %>" <%if(isClient==false){%>target="_blank"<%}%>>' + '<img src="<%= player2_info.avatar %>" alt="<%= player2_info.title %>">' + '<em class="avatar-mask"></em>' + '</a>' + '<div class="title"><a title="<%= player2_info.title %>" <%if(isClient==false){%>target="_blank"<%}%> href="<%= player2_info.url %>"><%= player2_info.real_name %></a></div>' + '<%if(isEnd==true){%>' + '<a class="votewrap">' + '  <b>顶</b>' + ' <i><%= player2_info.votenum %>票</i>' + '</a>' + '<% } else { %>' + '<a class="votewrap <%if(canVote!=false){%>js-vote ms-pointer<%}%>" <%if(canVote!=false){%>data-id="<%= player2_info.voteid %>"<%}%> data-prior="2">' + '<em class="vote-add hidden"></em>' + '<em class="vote-mask hidden"></em>' + '  <b>顶</b>' + ' <i><%= player2_info.votenum %>票</i>' + '</a>' + '<%if(player2_info.replace==true){%>' + '<i class="replace"></i>' + '<%} else { %>' + '<i class="num"><%=player2_info.rank%></i>' + ' <% } %>' + ' <% } %>' + '</div>' + '<% if(isEnd == true) { %>' + '<%if(player1win==1){%>  <div class="icon-lose"></div> <%}%>' + '<%if(player1win==0){%>  <div class="icon-win"></div> <%}%>' + '<% } %>' + '</div></div>';
  //目前正在比赛的2组选手
  //var curIdx=null;
  var liveContainer = $(".module-pking-120x60");
  var beforeContainer = $(".module-pkwait-120x60");
  var afterContainer = $(".module-pkend-120x60");
  var seperatorDom = $(".pk-finish-bg");
  var voteMap = require('../../../../util/vote/voteupdate');
  var vote = require('../../../../util/vote/vote');
  //常规倒计时
  function counter(dom, count) {
    setTimeout(function() {
      dom.text(--count);
      if (count != 0) {
        counter(dom, count);
      } else {
        dom.hide();
        dom.html('');
      }
    }, 1000);
  }
  // 投票动画模块
  function voteAnimate(domParent, originCounter, targetTop) {
    //var relDom=domParent.siblings(selector);
    //var maskRel=relDom.find('.vote-mask');
    var maskDom = domParent.find('.vote-mask');
    var addDom = domParent.find('.vote-add');
    var originTop = addDom.css('top');
    var targetTop = targetTop || -50;
    maskDom.show();
    maskDom.text(originCounter);
    counter(maskDom, originCounter);
    //maskRel.show();
    //maskRel.text(10);
    //counter(maskRel,10);
    if (originCounter == counterDefault) {
      addDom.css('display', 'block').animate({
        top: targetTop,
        opacity: 1
      }, 1000, function() {
        setTimeout(function() {
          addDom.fadeOut(function() {
            addDom.css({
              top: originTop
            });
          });
        }, 1000);
      });
    }
  }

  function strLen(str) {
    if (!str) {
      return 0;
    }
    var aMatch = str.match(/[^\x00-\xff]/g);
    return (str.length + (!aMatch ? 0 : aMatch.length));
  };

  function updateLive(obj, isend) {
    //obj.vice_cid=['300169','300160','300170'];
    obj.vice_cid.unshift(obj.main_cid)
    updatePlayList(obj.vice_cid);
    var tempFunc = _.template(template_live);
    var player1 = obj['player1_info'];
    var player2 = obj['player2_info'];
    var player1Avatar = avatars.eq(1);
    var player2Avatar = avatars.eq(2);
    player1['votenum'] = formatVote(player1['votenum']);
    player2['votenum'] = formatVote(player2['votenum']);
    if (player1.is_group == 1) {
      player1['real_name'] = player1['group_name'];
    }
    if (player2.is_group == 1) {
      player2['real_name'] = player2['group_name'];
    }
    player1['title'] = player1['real_name'];
    player2['title'] = player2['real_name'];
    if (strLen(player1['real_name']) > 8) {
      player1['real_name'] = limit(player1['real_name'], 10, '...');
    }
    if (strLen(player2['real_name']) > 8) {
      player2['real_name'] = limit(player2['real_name'], 10, '...')
    }
    if (player1.g_status == "4") {
      player1.replace = true;
    }
    if (player2.g_status == "4") {
      player2.replace = true;
    }
    if (!!isClient) {
      player1.url = 'http://chang.pptv.com/pc/player?username=' + player1.username;
      player2.url = 'http://chang.pptv.com/pc/player?username=' + player2.username;
      obj.isClient = true;
    } else {
      player1.url = 'http://chang.pptv.com/pc/player?username=' + player1.username;
      player2.url = 'http://chang.pptv.com/pc/player?username=' + player2.username;
      obj.isClient = false;
    }
    //player1.voteid='35538';
    //player2.voteid='35539';
    player1Avatar.attr('title', player1['title']);
    player2Avatar.attr('title', player2['title']);
    player1Avatar.find("img").attr('src', player1['avatar']);
    player1Avatar.find('span').html(player1['real_name']);
    player2Avatar.find("img").attr('src', player2['avatar']);
    player2Avatar.find('span').html(player2['real_name']);
    var nextId = player1['id'];
    var tempHtml = tempFunc(obj);
    liveContainer.html(tempHtml);
    var targetP = $(".module-pking-120x60 .vs-tag p");
    //倒计时模块，然后重新请求
    if (isend == false) {
      //仍然需要做异常处理 todo
      if (!!phpNowDate) {
        var tempCdnDate = uniformDate(phpNowDate);
      } else {
        var tempCdnDate = null;
      }
      var tempNow=getNow(phpNowDate);
      var tempEnd=new Date(obj.end * 1000 + parseInt(Math.random() * 3000));
      if(tempNow.getTime()>=tempEnd.getTime()){
        //异常处理
        setTimeout(function(){
          requestPkList(nextId);
        },10*1000);
      }else{
        timer({
          startTime: tempNow,
          endTime: tempEnd,
          serverOffsetTime: serverOffsetTime,
          pageStartTime: pageStartTime,
          cdnDate: tempCdnDate,
          getServerSuccess: getServerSuccess,
          callback: function(status, times) {
            //console.log(times);
            if (status == 2) {
              targetP.html("00:00:00");
              requestPkList(nextId);
            } else if (status == 1) {
              targetP.html(times.hours + ':' + times.minitues + ':' + times.seconds);
            }
          }
        });
      }
    }
  }
  //票数更新
  function updateUI(voteIdMap) {
    //这里需要做分发
    //prior 2 是pk结束可以投，prior 1是 正在pk的数据
    //console.log(voteIdMap);
    var tempEnd = voteIdMap['prior']['2'];
    if ($.isArray(tempEnd)) {
      updateVoteEnd(voteIdMap, tempEnd);
    }
    var tempLive = voteIdMap['prior']['1'];
    if ($.isArray(tempLive)) {
      updateVoteLive(voteIdMap, tempLive);
    }
  }

  function updateVoteEnd(voteIdMap, arr) {
    for (var i = 0; i < arr.length; i++) {
      var tempObj = voteIdMap[arr[i]];
      if (!tempObj.data) {
        continue;
      }
      var doms = tempObj['doms'];
      var len = doms.length;
      for (var j = 0; j < len; j++) {
        var updateDom = doms[j].find('i');
        if (updateDom.length > 0) {
          updateDom.html(formatVote(tempObj.data.counter) + '票');
        }
      }
    }
  }

  function initMask() {
    $(".js-vote").each(function() {
      var obj = $(this);
      var voteid = obj.attr('data-id');
      if (typeof voteid != "undefined") {
        var endCounter = getCounter(voteid, true);
        // console.log(endCounter);
        if (endCounter != counterDefault) {
          voteAnimate(obj.parent(), endCounter);
        }
      }
    });
  }

  function updateVoteLive(voteIdMap, arr) {
    for (var i = 0; i < arr.length; i++) {
      var tempObj = voteIdMap[arr[i]];
      if (!tempObj.data) {
        continue;
      }
      var doms = tempObj['doms'];
      var len = doms.length;
      for (var j = 0; j < len; j++) {
        var updateDom = doms[j].siblings('p').find('em');
        if (updateDom.length > 0) {
          updateDom.html(formatVote(tempObj.data.counter));
        }
      }
    }
  }
  // 绑定投票事件
  function bindVote() {
    new vote({
      dom: '.js-vote',
      voteAttr: 'data-id',
      beforeVote: function(data, dom) {
        if (dom.parent().find('.vote-mask').css("display") == 'none') {
          return true;
        } else {
          return false;
        }
      },
      afterVote: function(data, dom) {
        if (typeof data.counter != 'undefined') {
          var voteid = dom.attr('data-id');
          var endCounter = getCounter(voteid);
          if (dom.attr('data-prior') == '2') {
            dom.find('i').html(formatVote(data.counter) + '票');
            voteAnimate(dom.parents('.pk-player'), endCounter, -45);
          } else if (dom.attr('data-prior') == '1') {
            //console.log(endCounter);
            dom.siblings('p').find('em').html(formatVote(data.counter));
            voteAnimate(dom.parents('.pk-player'), endCounter, 5);
          }
        } else if (data.errors) {
          if(data.errors.code==88){
            alert("请休息一会儿再投票哦！");
          }
          //console.log(data.errors);
        }
      }
    });
    voteMap.init({
      selector: '.js-vote',
      voteAttr: 'data-id',
      prior: 'data-prior'
    });
  }
  //获取下一天的中午的date
  function getEndVoteTime(endDate, targetTime) {
    var dayMap = {
      '1': '31',
      '2': '28',
      '3': '31',
      '4': '30',
      '5': '31',
      '6': '30',
      '7': '31',
      '8': '31',
      '9': '30',
      '10': '31',
      '11': '30',
      '12': '31'
    };
    var targetDay = null;
    var targetTime = targetTime ? targetTime : '12:00:00'
    var mon = endDate.getMonth() + 1;
    var day = endDate.getDate();
    var year = endDate.getFullYear();
    var nextOffset = 1;
    var finalStr = null;
    if (day <= 29) {
      if ((day == 28 && mon == 2 && !(year % 4 == 0 && year % 100 != 0 || year % 400 == 0)) || day == 29 && mon == 2) {
        finalStr = year + '/' + 3 + '/' + 1 + ' ' + targetTime;
      } else {
        finalStr = year + '/' + mon + '/' + (1 + day) + ' ' + targetTime;
      }
    } else {
      var getMonDay = dayMap[mon];
      if (day + 1 > getMonDay) {
        if (mon == 12) {
          finalStr = (1 + year) + '/' + 1 + '/' + 1 + ' ' + targetTime;
        } else {
          finalStr = year + '/' + (1 + mon) + '/' + 1 + ' ' + targetTime;
        }
      } else {
        finalStr = year + '/' + mon + '/' + (1 + day) + ' ' + targetTime;
      }
    }
    targetDay = new Date(finalStr);
    return targetDay;
  }
  //未开始
  function updateBefore(arr) {
    if (arr.length == 0) {
      beforeContainer.addClass('hidden');
    } else {
      //正序输出
      var tempFunc = _.template(template_before_item);
      var totalHtml = "";
      for (var i = 0; i < arr.length; i++) {
        var tempDate = new Date(arr[i].start * 1000);
        arr[i].begintime = formatDate(tempDate, "hh:mm");
        var player1 = arr[i]['player1_info'];
        var player2 = arr[i]['player2_info'];
        if (!!isClient) {
          player1.url = 'http://chang.pptv.com/pc/player?username=' + player1.username;
          player2.url = 'http://chang.pptv.com/pc/player?username=' + player2.username;
          arr[i].isClient = true;
        } else {
          player1.url = 'http://chang.pptv.com/pc/player?username=' + player1.username;
          player2.url = 'http://chang.pptv.com/pc/player?username=' + player2.username;
          arr[i].isClient = false;
        }
        if (player1.g_status == "4") {
          player1.replace = true;
        }
        if (player2.g_status == "4") {
          player2.replace = true;
        }
        if (player1.is_group == 1) {
          player1['real_name'] = player1['group_name'];
        }
        if (player2.is_group == 1) {
          player2['real_name'] = player2['group_name'];
        }
        //console.log(arr[i].begintime);
        player1['title'] = player1['real_name'];
        player2['title'] = player2['real_name'];
        if (strLen(player1['real_name']) > 8) {
          player1['real_name'] = limit(player1['real_name'], 10, '...');
        }
        if (strLen(player2['real_name']) > 8) {
          player2['real_name'] = limit(player2['real_name'], 10, '...')
        }
        totalHtml += tempFunc(arr[i]);
      }
      beforeContainer.html(totalHtml);
      beforeContainer.removeClass('hidden');
    }
  }
  //已经结束
  function updateAfter(arr) {
    //倒序输出
    if (arr.length == 0) {
      afterContainer.addClass('hidden');
    } else {
      var tempFunc = _.template(template_after_item);
      var totalHtml = "";
      var nowDate = getNow(phpNowDate);
      for (var i = arr.length - 1; i >= 0; i--) {
        //正序输出
        var tempDate = new Date(arr[i].end * 1000);
        var targetEnd = uniformDate(arr[i].vote_end) || getEndVoteTime(tempDate);
        if (targetEnd.getTime() <= nowDate.getTime()) {
          arr[i]['isEnd'] = false;
          arr[i]['canVote'] = false;
          //arr[i]['isEnd']=true;
        } else {
          arr[i]['isEnd'] = false;
          arr[i]['canVote'] = true;
        }
        var player1 = arr[i]['player1_info'];
        var player2 = arr[i]['player2_info'];
        if (player1.g_status == "4") {
          player1.replace = true;
        }
        if (player2.g_status == "4") {
          player2.replace = true;
        }
        if (!!isClient) {
          player1.url = 'http://chang.pptv.com/pc/player?username=' + player1.username;
          player2.url = 'http://chang.pptv.com/pc/player?username=' + player2.username;
          arr[i].isClient = true;
        } else {
          player1.url = 'http://chang.pptv.com/pc/player?username=' + player1.username;
          player2.url = 'http://chang.pptv.com/pc/player?username=' + player2.username;
          arr[i].isClient = false;
        }
        // player1.voteid=i+34538;
        // player2.voteid=i+34539;
        if (player1.is_group == 1) {
          player1['real_name'] = player1['group_name'];
        }
        if (player2.is_group == 1) {
          player2['real_name'] = player2['group_name'];
        }
        player1['title'] = player1['real_name'];
        player2['title'] = player2['real_name'];
        if (strLen(player1['real_name']) > 8) {
          player1['real_name'] = limit(player1['real_name'], 10, '...');
        }
        if (strLen(player2['real_name']) > 8) {
          player2['real_name'] = limit(player2['real_name'], 10, '...')
        }
        player1['votenum'] = formatVote(player1['votenum']);
        player2['votenum'] = formatVote(player2['votenum']);
        arr[i]['player1win'] = player1['win'];
        totalHtml += tempFunc(arr[i]);
      }
      afterContainer.html(totalHtml);
      afterContainer.removeClass('hidden');
    }
  }
  var isend = false;

  function requestPkList(id) {
    //console.log('进入pklist的调用');
    if (isend == true) {
      return false;
    }
    var tempData = {
      cid: webcfg['id']
    }
    if (!!id) {
      tempData.id = id;
    }
    tempData.__config__ = {
      cdn: true,
      callback: 'updatePKList'
    };
    loader.load(urls['interface']['PKList_pc'], tempData, function(data) {
      if (data.code == 1) {
        var beforeArr = [];
        var afterArr = [];
        //未开始
        beforeArr = data.data.ready;
        //已经结束
        afterArr = data.data.end;
        var nowObj = data.data.start;
        if (nowObj.length == 0 && afterArr.length == 0) {
          var nextTimer = beforeArr[0];
          //防止cdn穿透
          var endTime = new Date(nextTimer.start * 1000 + parseInt(Math.random() * 3000));
          //需要异常处理
          updateBefore(beforeArr);
          if (!!phpNowDate) {
            var tempCdnDate = uniformDate(phpNowDate);
          } else {
            var tempCdnDate = null;
          }
          var tempNow = getNow(phpNowDate);
          if (tempNow.getTime() >= endTime.getTime()) {
            //异常处理
            setTimeout(function() {
              requestPkList();
            }, 10 * 1000);
          } else {
            timer({
              startTime: tempNow,
              endTime: endTime,
              serverOffsetTime: serverOffsetTime,
              pageStartTime: pageStartTime,
              cdnDate: tempCdnDate,
              getServerSuccess: getServerSuccess,
              callback: function(status, time) {
                //console.log(serverOffsetTime);
                //console.log(status,time);
                if (status == 2) {
                  //console.log('request');
                  //console.log(getNow(phpNowDate));
                  requestPkList();
                } else {
                  //do nothing
                }
              }
            });
          }
          return false;
        }
        if (afterArr.length == 0 && !!nowObj && nowObj.length == 0) {
          isend = true;
        }
        if (!$.isArray(nowObj)) {
          updateLive(nowObj, isend);
        } else {
          liveContainer.remove();
        }
        updateBefore(beforeArr);
        updateAfter(afterArr);
        if (beforeArr.length != 0 && afterArr.length != 0) {
          seperatorDom.removeClass('hidden');
        } else if (beforeArr.length == 0 && afterArr.length > 0) {
          afterContainer.removeClass('mtn10').addClass("mt40");
          seperatorDom.addClass('hidden');
        } else {
          seperatorDom.addClass('hidden');
        }
        //绑定投票事件
        bindVote();
        if (timerInterval != null) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        voteMap.getVotes({
          callback: updateUI
        });
        timerInterval = setInterval(function() {
          voteMap.getVotes({
            callback: updateUI
          });
        }, freshTime * 1000);
        initMask();
      } else if (data.code == -2) {
        //	    		console.log('time is not match');
        //相当于进行异常处理，重新刷页面
        setTimeout(function() {
          window.location.reload();
        }, 3000);
      }
    });
  }
});