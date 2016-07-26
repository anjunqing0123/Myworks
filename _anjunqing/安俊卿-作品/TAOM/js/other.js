/*
* @Author: Administrator
* @Date:   2016-03-11 09:06:45
* @Last Modified by:   Administrator
* @Last Modified time: 2016-03-11 09:10:56
*/

$(function() {
	var nav=$('.nav');
    var postop=$('.postop');
	$(window).scroll(function(event) {
         //吸附导航
        if ($(window).scrollTop()>30) {
          
            nav.addClass('current')
        } else{
            nav.removeClass('current')
        };
        //极速回顶部
        if ($(window).scrollTop()>=$(window).height()) {
        postop.show();
        } else{
        postop.hide();
        };
    });
});