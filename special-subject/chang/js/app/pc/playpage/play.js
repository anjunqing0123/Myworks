/*
* @Author: WhiteWang
* @Date:   2015-08-18 19:15:32
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-14 19:01:29
*/
define(function(require, exports, module){
    require('./vod');
    var ShareBox = require('../../../util/share/share');
    var urls=require('../../../util/linkcfg/interfaceurl');
    var loader=require('../../../util/loader/loader');
    var cookie=require('../../../util/cookie/cookie');
    var $ = require('jquery');
    //登录模块
    require('../../../util/linkcfg/pcredirect');
    //登录模块结束
    //分享模块
    (function(){
        var reg=/show\/(.*)\.html/;
        var playStr=window.location.pathname.match(reg);
        if(playStr!=null){
            playStr=playStr[1];
        }else{
            playStr='';
            //return false;
        }
        var timershow = null, timerhide = null;
        $share = $('.module-set .share');
        $shareBox = $share.find('.sharebox');
        var tempObj={
            box: $shareBox,
            url:'http://v.pptv.com/show/'+playStr+'.html'
        };
        if(!!webcfg.title){
            tempObj.shareContent=webcfg.title;
        }
        var username=$.trim($(".module-info dd p").first().find('a').text());
        tempObj.shareContent='#'+username+'#报名了#pptv一唱成名#音乐选秀，快来投上一票吧! ['+tempObj.shareContent+']#一唱成名#（分享自@PPTV聚力）';
        new ShareBox(tempObj);
        $share.on('mouseenter', function(){
            clearTimeout(timerhide);
            timershow = setTimeout(function(){
                $shareBox.fadeIn();
            }, 300);
        }).on('mouseleave', function(){
            clearTimeout(timershow);
            timerhide = setTimeout(function(){
                $shareBox.fadeOut();
            }, 300);
        })
    })();
    var vote=require('../../../util/vote/vote');
    var voteMap=require('../../../util/vote/voteupdate');
    var jsVotes=$(".module-set .js-vote");
    var voteLength=jsVotes.length;
    if(voteLength>0){
        voteMap.init({
            selector:'.js-vote',
            voteAttr:'sid'
        });
    }
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
    //console.log('voteMap',voteMap);
    function updateUI(voteIdMap,arr){
       // console.log('voteIdMap',voteIdMap);
        //console.log('arr',arr);
        for(var i=0;i<arr.length;i++){
            var tempObj=voteIdMap[arr[i]];
            var doms=tempObj['doms'];
            var len=doms.length;
            for(var j=0;j<len;j++){
                //更新的操作在这里
                //console.log('domj',doms[j]);
                var domParent=doms[j].parent();
                var text = '';
                if(domParent.hasClass('up')){
                    text = addKannma(tempObj.data.counter);
                } else if(domParent.hasClass('down')){
                    text = addKannma(tempObj.data.counter);
                }
                doms[j].siblings('span').html(text);
            }
        }
    }
    //投票配置
    var counterDefault=3600;
    function getCounter(voteid,first) {
        //first 页面打开加载
        var getCookieVal = cookie.get("_c_" + voteid);
        if (!getCookieVal) {
            if (first != true) {
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
            }
            return counterDefault;
        } else {
            var eclipseTime = Math.floor(new Date().getTime() / 1e3) - Number(getCookieVal);
            if(counterDefault-eclipseTime<0){
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                //cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                return counterDefault;
            }
            return counterDefault - eclipseTime;
        }
    }
    if(voteLength>0){
        new vote({
            dom:'.js-vote',
            voteAttr:'sid',
            beforeVote:function(data,dom){

            },
            afterVote:function(data,dom){
                //console.log(arguments);
                if(typeof data.counter!='undefined'){
                    //todo lock
                    //dom.data('isLocked',true);
                    var domParent=dom.parent();
                    var text = '';
                    var voteid=dom.attr('sid');
                    var relid=domParent.siblings('.rel').find('.js-vote').attr('sid');
                    var endCounter=getCounter(voteid);
                    voteAnimate(domParent,endCounter);
                    if(domParent.hasClass('up')){
                        text = addKannma(data.counter);
                    } else if(domParent.hasClass('down')){
                        text = addKannma(data.counter);
                    }
                    domParent.find('span').html(text);
                }else if(data.errors){
                      if(data.errors.code==88){
                        alert("请休息一个小时再投票哦！");
                      }
//                    console.log(data.errors);
                }
            }
        });
    }
    function formatCounter(count){
        var end=count%60;
        end=end.toString().length==1 ? '0'+end : end;
        var start=Math.floor(count/60);
        start=start.toString().length==1 ? '0'+start : start;
        return start+':'+end;
    }
    //常规倒计时
    function counter(dom,count,first,secondDom){
        if(first==true){
            dom.text(formatCounter(count));
            !!secondDom&&secondDom.text(formatCounter(count));
        }
        setTimeout(function(){
            var tempCount=--count;
            dom.text(formatCounter(tempCount));
            !!secondDom&&secondDom.text(formatCounter(tempCount));
            if(count!=0){
                counter(dom,count,false,secondDom);
            }else{
                dom.hide();
                dom.html('');
                !!secondDom&&secondDom.hide();
                !!secondDom&&secondDom.html('');
            }
        },1000);
    }
    function voteAnimate(domParent,originCounter,targetTop){
        var relDom=domParent.siblings('.rel');
        var maskRel=relDom.find('.vote-mask');
        var maskDom=domParent.find('.vote-mask');
        var addDom=domParent.find('.vote-add');
        var originTop=addDom.css('top');
        var targetTop=targetTop||-50;
        maskDom.show();
        maskDom.text(originCounter);
        //maskRel.show();
        //maskRel.text(originCounter);
        counter(maskDom,originCounter,true);
        //counter(maskRel,originCounter,true);
        /*timer({
            startTime : new Date(),
            endTime:new Date(new Date().getTime()+10*1000),
            callback:function(status,time){
                if(status==2){
                    maskDom.hide();
                    maskDom.html('');
                }else{
                    maskDom.show();
                    maskDom.html(time.seconds);
                }
            }
        });*/
        if(originCounter==counterDefault){
            addDom.css('display','block').animate({
                top:targetTop,
                opacity:1
            },1000,function(){
                addDom.fadeOut();
                setTimeout(function(){
                    addDom.fadeOut(function(){
                        addDom.css({
                          top:originTop
                        });
                    });
                },1000);
            });
        }
    }
    if(voteLength>0){
        voteMap.getVotes({
            callback:updateUI
        });
        //新增投票锁定逻辑
        var checkvote=jsVotes.eq(0);
        var voteId=checkvote.attr('sid');
        var relDom=jsVotes.eq(1);
        var relId=relDom.attr('sid');
        var endCounter=getCounter(voteId,true);
        var endCounter2=getCounter(relId,true);
        if(endCounter!=counterDefault){
            voteAnimate(checkvote.parent(),endCounter);
        }
        if(endCounter2!=counterDefault){
            voteAnimate(relDom.parent(),endCounter2);
        }
        // 更新排名信息
        var updateDom=$(".module-set .tip span");
        var tempData={
            id:webcfg['id'],
            scope:window.game_scope,
            sort:3
        };
        tempData.__config__={
            cdn:true,
            callback:'videoRankUpdate'
        }
        loader.load(urls['interface']['videoRank'],tempData,function(data){
           if(data.err==0){
             //更新dom
             var tempObj=data.data;
             if(tempObj.current==null||(tempObj.current==1&&tempObj.prevVotes!=0)||(tempObj.current==0&&tempObj.prevVotes==0)){
                updateDom.eq(0).text('计算中').addClass('c-grey');
                updateDom.eq(1).text('计算中').addClass('c-grey');
             }else if(tempObj.current!=1&&tempObj.prevVotes==0){
                updateDom.eq(0).text(tempObj.current).removeClass('c-grey');
                updateDom.eq(1).text('计算中').addClass('c-grey');
             }else{
                updateDom.eq(0).text(tempObj.current).removeClass('c-grey');
                updateDom.eq(1).text(addKannma(tempObj.prevVotes)).removeClass('c-grey');
             }
           }
        });
    }
    //加入vip模块
    require('../index/common-joinvip');
    //加入vip模块结束
    //5s 刷一次
    if(voteLength>0){
        var voteObj=voteMap.get();
        setInterval(function(){
            voteMap.getVotes({
                callback:updateUI
            });
        },30*1000);
    }
});



