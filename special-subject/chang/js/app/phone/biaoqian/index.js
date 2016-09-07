/**
 * 标签页
 * @param  {[type]} require  [description]
 * @param  {[type]} exports  [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}    [description]
 */
define(function(require, exports, module){

    var $ = require('jquery');
    var Swiper = require('../../../util/swipe/swiper.min.js');
    var timer=require('../../../util/Timer/timer');
    var getQuery=require('../../../util/others/getquery');
    var queryObj=getQuery();
    //判断是否是ipad 打开的
    var sdk = require("../../../util/ppsdk/sdk");
    var browser=require('../../../util/browser/browser');
    



    function redirectBiaoqian(tempHref){
        if(sdk.isReady()){
            sdk.openNativePage({
                pageUrl:'app://iph.pptv.com/v4/activity/web?activity=singtofame&url='+encodeURIComponent(tempHref),
                success:function(){
                },
                error:function(code,msg){
                    if(code==1&&msg=="方法不存在"){
                        window.location.href=tempHref;
                    }
                }
            });
        }else{
            setTimeout(function(){
                redirectBiaoqian(tempHref);
            },300);
        }
    }
    if(browser.IPAD==true){
        $(".renqi-item a").on('click',function(e){
            e.preventDefault();
            var tempHref=this.getAttribute('href');
            redirectBiaoqian(tempHref);
        });
        $(".grid").on('click',".module-concertnight ul a",function(e){
            var tempHref=this.getAttribute('href');
            if(tempHref.indexOf('username')!=-1){
                e.preventDefault();
                redirectBiaoqian(tempHref);
            }
        });
    }
    var concert_stage=window.concert_stage;

    //顶部轮播
    var indexSlider = new Swiper('#slider-container', {
        pagination: '.swiper-pagination',
        autoplay: 3000,
        loop: true
    });

    //实力排行滑动
    var shiliSlider = new Swiper('.content.shili', {
        slidesPerView: 'auto'
    });

    //人气排行滑动
    var renqiSlider = new Swiper('.content.renqi', {
        slidesPerView: 'auto'
    });

    //选手视频
    var playerSlider = new Swiper('.playervideo', {
        slidesPerView: 'auto'
    });

    var playerSlider2 = new Swiper('.cloums2._169', {
        slidesPerView: 'auto'
    });

    var myconcert = new Swiper('.module-myconcert', {
        slidesPerView: 'auto'
    });

    var progress = new Swiper('#progress-container', {
        slidesPerView: 'auto'
    });

    //菜单点击
    $(function(){
        $(".swiper-slide.menu-slider-item").click(function(){
            $(this).siblings().removeClass("active");
            $(this).addClass("active");
        });
    });

    //菜单滑动 海选里面存在菜单滑动，这里去掉
    // var menuSlider = new Swiper('.module.module-menu-slider', {
    //   slidesPerView: 'auto'
    // });

    // 排序菜单
    var loader = require('../haixuan/haixuan');
    loader("swper");
    //pk榜单,未开始的状态
    var livePk=$("#pk_list");
    if(livePk.length>0){
       var pkList = new Swiper("#pk_list", {
           slidesPerView: "auto"
       });
    }
    //计算胜利
    function calculateWin(obj,count){
        var player1=obj['player_1'];
        var player2=obj['player_2'];
        var count1=player1.counter==null ? 0 : player1.counter;
        var count2=player2.counter==null ? 0 : player2.counter;
        if(Number(count1)>Number(count2)){
            var avatar=player1.avatar;
            if(player1.is_group==1){
                var winName=player1.group_name;
                //console.log(winName);
            }else{
                var winName=player1.real_name;
            }
            var username='http://chang.pptv.com/app/player?type=app&username='+player1.username;
        }else{
            var avatar=player2.avatar;
            if(player2.is_group==1){
                var winName=player2.group_name;
            }else{
                var winName=player2.real_name;
            }
            var username='http://chang.pptv.com/app/player?type=app&username='+player2.username;
        }
        var role=totalRole.eq(count);
        role.find('.roleimg').attr('src',avatar);
        role.find('.rolename').html(winName);
        role.attr('href',username);
    }
    //concert_stage=2;
    if(!!concert_stage&&concert_stage==2){
        //更新pk数据
        var areaid=parseInt(queryObj['scope_id']);
        if(typeof areaid!="number"){
            return false;
        }else{
            require('./pklist');
        }
    }else if(!!concert_stage&&concert_stage==3){
        var areaid=parseInt(queryObj['scope_id']);
        if(typeof areaid!="number"){
            return false;
        }else{
            require('./concert');
        }
    } else if (!!concert_stage && concert_stage == 4) {
        require('./tag60');
    } else if (!!concert_stage && concert_stage >= 5) {
        var others = require('../../../util/others/others.js');
        $(document).on('click', '.g18_personal', function () {
            others.openHomePage({
                username: $(this).attr('username')
            });
        });
    }
    (function() { // 搜索框调用native
        var sdk = require("./../../../util/ppsdk/sdkUtil");
        $('.search-input').click(function() {
            sdk('openNativePage', {
                pageUrl: 'app://iph.pptv.com/v4/search',
                success: function() {

                },
                error: function(code, msg) {
                }
            });
        });
    })();
    (function() {
        if (!!navigator.userAgent.match(/iPad/)) {
            $('.cont_w').click(function() {
                var others = require('../../../util/others/others.js');
                var href = $(this).attr('href');
                if (!href) {
                    return;
                }
                others.openHomePage({
                    href: href
                });
            });
        }
    })();
});
