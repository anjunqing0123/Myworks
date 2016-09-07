/* 
* @Author: WhiteWang
* @Date:   2015-09-09 19:36:25
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-29 12:37:02
*/
define(function(require){
    var ShareBox = require('../../../util/share/share'),
        ChangVote = require('../../../util/vote/vote'),
        $ = require('jquery'),
        Loader = require('../../../util/loader/loader'),
        api = require('../../../util/linkcfg/interfaceurl')['interface'];
    require('../../../util/countdown/countdown')($);
    var cookie=require('../../../util/cookie/cookie');
    new ShareBox({
        box: '.module-vInfo .share',
        url: 'http://v.pptv.com/show/'+webcfg.playLink+'.html',
        shareContent: '#'+webcfg.playername+'#报名了#pptv一唱成名#音乐选秀，快来投上一票吧【'+webcfg.videotitle+'】＃一唱成名＃（分享自@PPTV聚力）'
    });
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
    var checkvote = $(".icon_up");
    var voteId = checkvote.attr("sid");
    var relDom = $(".icon_down");
    var relId = relDom.attr("sid");
    var counterDefault=3600;
    var endCounter = getCounter(voteId, true);
    var endCounter2 = getCounter(relId,true);
    if (endCounter != counterDefault) {
        $(".upBtn").countdown({
            timing: endCounter,
            formatCounter:function(count){
                var end=count%60;
                end=end.toString().length==1 ? '0'+end : end;
                var start=Math.floor(count/60);
                start=start.toString().length==1 ? '0'+start : start;
                return start+':'+end;
            }
        });
    }
    if(endCounter2 != counterDefault){
        $(".downBtn").countdown({
            timing: endCounter2,
            formatCounter:function(count){
                var end=count%60;
                end=end.toString().length==1 ? '0'+end : end;
                var start=Math.floor(count/60);
                start=start.toString().length==1 ? '0'+start : start;
                return start+':'+end;
            }
        });
    }
    function getCounter(voteid,first) {
        //first 页面打开加载
        var getCookieVal = cookie.get("_c_" + voteid);
        if (!getCookieVal) {
            if (first != true) {
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
               // cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
            }
            return counterDefault;
        } else {
            var eclipseTime = Math.floor(new Date().getTime() / 1e3) - Number(getCookieVal);
            if(counterDefault-eclipseTime<0){
                cookie.set("_c_" + voteid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
               // cookie.set("_c_" + relid, Math.floor(new Date().getTime() / 1e3), 1 / 24/(3600/counterDefault), ".pptv.com", "/");
                return counterDefault;
            }
            return counterDefault - eclipseTime;
        }
    }
    new ChangVote({
        dom: '.upBtn .icon_up,.downBtn .icon_down',
        voteAttr: 'sid',
        beforeVote: function(data, el){
            return true;
        },
        afterVote: function(data, el){
            if(data.counter){
                var $el = $(el);
                var counterTime=getCounter($el.attr('sid'));
                $el.countdown({
                    timing:counterTime,
                    formatCounter:function(count){
                        var end=count%60;
                        end=end.toString().length==1 ? '0'+end : end;
                        var start=Math.floor(count/60);
                        start=start.toString().length==1 ? '0'+start : start;
                        return start+':'+end;
                    }
                });
                var text = '';
                if($el.attr('class')==='icon_up'){
                    text = addKannma(data.counter);
                } else {
                    text = addKannma(data.counter);
                }
                $el.siblings('.text').html(text);
            } else if(data.errors){
                if(data.errors.code==88){
                    alert("请休息一个小时再投票哦！");
                }
            }
        }
    })
    var getVotenum = function(){
        var idsUp = $(".icon_up").attr("sid");
        var idsDown = $(".icon_down").attr("sid");
        Loader.load(api.voteCollection, {
            ids: idsUp+','+idsDown
        }, function(data){
            function numwan(nums){
                var result = '';
                var num = parseInt(nums);
                if( num > 0 && num < 9999){
                    result = num;
                }
                if( num > 10000 && num < 100000 ){
                    result = Math.round( num / 1000 ) / 10  + "万";
                }
                return result;
            }
            var num1 = addKannma(data.votes[idsUp]['counter']);
            var num2 = addKannma(data.votes[idsDown]['counter']);
            $(".upBtn .text").html(num1);
            $(".downBtn .text").html(num2);
        });
    }();

    var getranking = function(){
        var id = $(".module-vInfo").find("p").eq(0).attr("cid"),
            scope = $(".module-vInfo").find("p").eq(0).attr("scope");
        Loader.load(api.videoRank, {
            id: id,
            scope: scope,
            stage:1,
            sort:3
        }, function(data){
            if(data.err==0){
            //更新dom
                var tempObj=data.data;
                if(tempObj.current==null||(tempObj.current==1&&tempObj.prevVotes!=0)||(tempObj.current==0&&tempObj.prevVotes==0)){
                    $(".module-vInfo").find("p").eq(0).find("span").html('计算中').removeClass('c-grey');
                    $(".module-vInfo").find("p").eq(1).find("span").html('计算中').removeClass('c-grey');
                }else{
                    $(".module-vInfo").find("p").eq(0).find("span").html(tempObj.current).removeClass('c-grey');
                    $(".module-vInfo").find("p").eq(1).find("span").html(addKannma(tempObj.prevVotes)).removeClass('c-grey');
                }
            }
        });
    }();
});