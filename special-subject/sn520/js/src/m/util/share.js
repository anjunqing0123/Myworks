define(function(require, exports) {
    var $ = require('jquery');
    var isInWeixin = !!navigator.userAgent.match(/MicroMessenger/g);
    var LM = require('./mob');
    LM.appProxy.isApp = function(){return this._plt === 'app';}
    LM.method('socialShare', function() {
        if (isInWeixin) {
            $('#weixin-share').fadeIn(100).click(function() {
                $(this).fadeOut();
            });
        } else {
            $('.module-msharebox').animate({
                bottom: 0
            });
        }
    });
    var cookie = require('./cookie');
    if (cookie.get('PPName')) {
       var username = cookie.get('PPName').match(/.*\$/g)[0].slice(0, -1); 
    } else {
        username = undefined;
    }
    
    var sPic = $('#s-pic').val(),
        sUrl = $('#s-url').val(),
        sTitle = $('#s-title').val()
    ;
    $('.share').click(function() {
        LM.exec('socialShare', JSON.stringify({
            shareText: sTitle,
            shareURL: sUrl,
            shareImageURL: sPic
        }));
    })
    LM.callback('socialShare', function() {
        if (location.href.match(/my_video/g)) {
            location.href = 'http://520.pptv.com/app/space?username=' + username;
        }
    });
    $('.module-msharebox .cancel').click(function() {
        $('.module-msharebox').animate({
            bottom: '-164px'
        });
    });
    window._bd_share_config = {
        "common": {
            "bdSnsKey": {},
            "bdText": sTitle,
            bdDesc: sTitle,
            "bdMini": "1",
            bdUrl: sUrl,
            "bdMiniList": false,
            bdPic: sPic,
            "bdStyle": "2",
            "bdSize": "32"
        },
        "share": {},
        "selectShare": {
            "bdContainerClass": null,
            "bdSelectMiniList": ["tsina", "qzone", "sqq"]
        }
    };
    with (document) 0[(getElementsByTagName('head')[0] || body).appendChild(createElement('script')).src = 'http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion=' + ~( -new Date() / 36e5)];

    $('.bdsharebuttonbox').click(function() {
        if (location.href.match(/my_video/g)) {
            setTimeout(function() {
                location.href = 'http://520.pptv.com/app/space?username=' + username;
            });
        }
    })
});
