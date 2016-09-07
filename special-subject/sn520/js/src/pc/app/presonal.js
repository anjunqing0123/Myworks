/*
 * @author  Zhan Wang
 * @date    2016/5/5 14:10
 * @email   ijingzhan@gmail.com
 * @info    
 *
 */
define(function (require) {
    var $ = require('jquery'),
        user = require('user');

    var $snvideoTit = $('#snvideo-tit'),
        $snvideoList = $('#snvideo-list');

    $snvideoTit.on('mouseenter','a',function (e) {
        e.preventDefault();
        var $self = $(this);
        $self.addClass('now').siblings('a').removeClass('now');
        $snvideoList.children('div.tabcon').eq($self.index()).show().siblings('div').hide();
    });

});
 

 