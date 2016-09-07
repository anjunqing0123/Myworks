/* 
* @Author: WhiteWang
* @Date:   2015-10-28 15:55:12
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-28 15:55:55
*/
define(function(require, exports){
    var $ = require('jquery');

    var $dom = $('.module-sidebar');
    if($dom.length==0){
        return;
    }
    var timer = null;
    function showTop(){
        var top = $(window).scrollTop();
        if(top>10){
            $dom.removeClass('top');
        } else {
            $dom.addClass('top');
        }
    }
    $(window).on('scroll', function(){
        clearTimeout(timer);
        timer = setTimeout(showTop, 200);
    })
    showTop();
})