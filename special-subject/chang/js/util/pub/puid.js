/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    获取PUID
 */

define(function(require) {
    var puid, $ = require('jquery'),
        cookie = require('../cookie/cookie');

    var Puid = {

        getPuid: function(cb) {

            puid = cookie.get('PUID');

            if (puid) {
                cb.call(null, puid);
            } else {
                //分配PUID    http://c(1|2|3|4).pptv.com/puid/get?(&format=[jsonp|json|xml]&cb=[cb])
                $.ajax({
                    dataType: 'jsonp',
                    type: 'GET',
                    url: 'http://c1.pptv.com/puid/get',
                    jsonp: 'cb',
                    data: {
                        format: 'jsonp'
                    },
                    success: function(data) {
                        if (data.error === 0) {
                            puid = data.value;
                            if (typeof(cb) == 'function') {
                                cb.call(null, puid);
                            }
                        }
                    }
                });

            }

        }

    };

    return Puid;

});
