define(function(require, exports){
    var $ = require('jquery');

    var createVideo = function(cid) {
        var $playerIframe = $('<iframe style="width: 100%;height: 100%;position: fixed; top: 0;left: 0; z-index: 100;" id="player-iframe" src="http://pub.pptv.com/player/iframe/index.html#showList=0&id='+cid+'&ctx=wmode%3Dopaque%26subject%3Dhznoad%26o%3Dhznoad" allowtransparency="true" width="100%" height="100%" scrolling="no" frameborder="0" ></iframe><div style="width: 60px;height: 50px; line-height: 50px;text-align:center;position: fixed; top: 0;right: 0; color: #fff;font-size:16px;z-index: 100;" id="close-iframe">关闭</div>');
        $playerIframe.appendTo('body');
        $('#close-iframe').on('click', function() {
            $('#player-iframe').add($(this)).remove();
        });
    };
    $('.video-item').click(function() {
        createVideo($(this).attr('videoid'));
        return false;
    });
});