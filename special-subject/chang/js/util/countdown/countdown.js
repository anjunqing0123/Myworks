/* 
* @Author: WhiteWang
* @Date:   2015-09-17 09:59:17
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-23 09:58:24
*/
//jquery插件，点击按钮后，给按钮覆盖一层dom，默认10秒后才能再次点击
//样式需要CSS定义
define(function(require){
return function($){
    require('../eventpause/eventpause')($);
    $.fn.countdown = function(options){
        var defaults = {
            customClass: 'countdown',
            timing: 10,
            clickCallback: function(){}
        }
        var opt = $.extend({}, defaults, options);
        var $el = $(this);
        $el.each(function(i, e){
            appendCountdown(e);
        })

        function appendCountdown(el){
            var $el = $(el);
            var timing = opt.timing;
            if(!!opt.formatCounter){
               var $cd = $('<span class="'+opt.customClass+'">'+opt.formatCounter(timing)+'</span>');
            }else{
               var $cd = $('<span class="'+opt.customClass+'">'+timing+'</span>'); 
            }
            $cd.on('click', function(){
                opt.clickCallback();
            })
            $el.append($cd);
            $el.eventPause('pause', 'click');
            var timer = setInterval(function(){
                if(timing===0){
                    clearInterval(timer);
                    $cd.remove();
                    $el.eventPause('active', 'click');
                    return;
                }
                timing--;
                if(!!opt.formatCounter){
                    $cd.html(opt.formatCounter(timing));
                }else{
                    $cd.html(timing);
                }
            }, 1000);
        }
    }
}
});