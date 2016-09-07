define(function(require, exports) {
    var $ = require('jquery');
    var cookie = require('./cookie');
    var getJsonp = require('./get_jsonp');
    var login = require('./login');
    $('.module-mpop .close').click(function() {
        $(this).parents('.module-mpop').eq(0).fadeOut();
        if ($(this).parents('.module-mpop').attr('id') == 'coupon-success') {
        	$('.getsale').addClass('bound-pirce');
        	setTimeout(function() {
	        	$('.getsale').removeClass('bound-pirce');
	        }, 5000);
        }
    });
    $('#home-page, #upload-page').click(function() {
        var that = this;
        if (!cookie.get('PPName')) {
            login(function() {
                if (cookie.get('PPName')) {
                    location.href = $(that).attr('href');
                }
                window.webReturnUrl = $(that).attr('href');
            });
            return false;
        }
        return true;
    });
});