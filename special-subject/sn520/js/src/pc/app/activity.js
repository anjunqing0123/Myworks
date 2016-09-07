define(function (require, module, exports) {
    var $ = require("jquery"),
        _ = require('underscore'),
        user = require('user'),
        login = require("login"),
        JSON = require('./../util/json'),
        cookie = require("./../util/cookie"),
        os = require('./../util/os');

    var $joinBtn = $(".topnav .join,.j-snupload a"),
        $goTop = $(".gotop"),
        $sharebox = $(".sharebox"),
        $getSale = $(".getsale"),
        $myVideo = $('#sn-myvideo'),
        $couponsSide = $('#sn-coupons-side'),
        $pageQrcode  = $('#sn-qrcode');

    var loginInfo = $.parseJSON(cookie.get('pageclick'));
    var redirectFunc = function () {
        if (loginInfo) {
            if (!loginInfo.isLogined && loginInfo.links != '') {
                cookie.set('pageclick', '', 30, 'pptv.com', '/');
                window.location.replace(loginInfo.links);
            }
        }
    };

    user.isLogined ? redirectFunc() : $.noop() ;


    (function(){
        //  我的视频按钮、我的视频页
        var nowUrl = window.location.href,
            baseHomeUrl = 'http://520.pptv.com/pc/home',
            isMyVideo = (nowUrl.indexOf('520i.pptv.com/pc/my_video') > 0),
            isClient = nowUrl.indexOf('plt=clt') > 0,
            realHomeUrl = isClient ? baseHomeUrl + '?plt=clt' : baseHomeUrl,
            timeDate = nowUrl.indexOf('?') > 0 ? (isClient ? '&' + (+new Date()) : '?' + (+new Date())) : '?' + (+new Date());

        if(isMyVideo){
            if(!user.isLogined){
                location.replace(realHomeUrl);
            }
        }
        $myVideo.on('click', function (e) {
            var myLink = $myVideo.attr('data-href');
            var myLink_app = 'http://520i.pptv.com/app/my_video';
            !user.isLogined ? cookie.set('pageclick', JSON.stringify({
                isLogined: user.isLogined,
                links: myLink
            }), 30, 'pptv.com', '/') : $.noop();

            if (!user.isLogined) {
                login.init();
            } else {
                if(os.isPc){
                    $myVideo.attr({"href": myLink + timeDate});
                }else{
                    $myVideo.attr({"href": myLink_app + timeDate});
                }
            }
        });

    }());

    //  加入按钮
    $joinBtn.click(function () {
        var joinLink = $joinBtn.attr('data-href');
        !user.isLogined ? cookie.set('pageclick', JSON.stringify({
            isLogined: user.isLogined,
            links: joinLink
        }), 30, 'pptv.com', '/') : $.noop();

        if (!user.isLogined) {
            login.init();
        } else {
            $joinBtn.attr({"href": joinLink});
        }
    });

    $('.module-page').find('input[type=text]').on('keydown',function (e) {
        if(e.keyCode == 13){
            $('.module-page').find('input[type=submit]').trigger('submit');
        }
    })

    //  侧栏逻辑
    ;(function () {
        //  priceUrl pc and h5
        $getSale.on('click',function (e) {
            e.preventDefault();
            if (!cookie.get("sn_right")) {
                $couponsSide.fadeIn();
                return;
            }
            os.isPc ? $pageQrcode.show() : window.location.href = 'http://sale.suning.com/syb/520dijiakuanghuan/index.html';
        });

        //  share
        var tpl = [
            '<a target="_blank" href="http://v.t.sina.com.cn/share/share.php?url=<%= encodeURIComponent(data.url) %>&title=<%= data.title %>&pic=<%= data.pic %>&source=<%= encodeURIComponent(\'PPLive网络电视\') %>&sourceUrl=http://www.pptv.com&content=utf-8&appkey=3114134302&searchPic=false" class="wb"></a>',
            '<a target="_blank" href="http://v.t.qq.com/share/share.php?url=<%= encodeURIComponent(data.url) %>&title=<%= data.title %>&pic=<%= data.pic %>&site=http://www.pptv.com&appkey=801088622" class="tx"></a>',
            '<a target="_blank" href="http://connect.qq.com/widget/shareqq/index.html?&url=<%= data.url %>&title=<%= data.title %>&desc=<%= data.description %>&pics=<%= data.pic %>" class="rr"></a>',
            '<a target="_blank" href="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=<%= encodeURIComponent(data.url) %>&title=<%= data.title %>&pics=<%= data.pic %>" class="qzone"></a>'
        ].join('');

        if(window.location.href.indexOf('upload')>0){
            $('.sharebtn').remove();
        }else{
            $sharebox.html(_.template(tpl, {data: window.sn520ShareData}));
        }
        //  gotop
        $goTop.on('click',function (e) {
            e.preventDefault();
            $("html,body").animate({scrollTop: "0px"}, 300);
        });
    }());

    $('.close').on('click', function (e) {
        $(this).parent('.module-pop').hide();
        if($(this).parent('.module-pop').attr('id') == 'sn-coupons-middle'){
            $getSale.addClass('bound-pirce');
            setTimeout(function () {
                $getSale.removeClass('bound-pirce');
            },5000);
        }
    })
});