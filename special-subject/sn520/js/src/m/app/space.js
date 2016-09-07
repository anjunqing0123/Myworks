define(function(require, exports){
    var $ = require('jquery');
    var cookie = require('../util/cookie');
    require('../util/vote');
    var coupon = require('../util/coupon');
    coupon($('.getsale'));
    require('../util/share');
    require('../util/common');
    $('.tab').click(function() {
        $('.tab').removeClass('cur');
        $(this).addClass('cur');
        var id = $(this).attr('_id');
        $('.module-mlist').hide();
        $('#' + id).show();
    });
    require('../util/play.js');
});
