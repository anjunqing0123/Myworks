define(function(require, exports){
    var $ = require('jquery');

    var getJsonp = function(url, data, success) {
    	success = success || $.noop;
    	$.ajax({
    		url: url,
    		data: data,
    		success: function(data) {
    			success(data);
    		},
    		dataType: 'jsonp',
    		jsonp: 'cb',
    		jsonpCallback: 'cb'
    	});
    };
    return getJsonp;
});