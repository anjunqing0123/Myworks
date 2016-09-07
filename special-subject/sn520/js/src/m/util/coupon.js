define(function(require, exports){
    var COUPON_URL = 'http://sale.suning.com/syb/520dijiakuanghuan/index.html';
    var $ = require('jquery');
    var cookie = require('./cookie');

    return function($getBtn) {
        $getBtn.click(function() {
            if (cookie.get('sn_right') == 1) {
                $(this).attr('href', COUPON_URL);
            } else {
                $('#coupon-alert').fadeIn();
            }
        });
    };
});