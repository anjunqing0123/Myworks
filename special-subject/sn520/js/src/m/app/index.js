define(function(require, exports){
    var $ = require('jquery');
    var cookie = require('../util/cookie');
    require('../util/vote');
    var coupon = require('../util/coupon');
    coupon($('.getsale'));
    require('../util/common');
    require('../util/play.js');
    require('../util/common');
    require('../util/share');
});
