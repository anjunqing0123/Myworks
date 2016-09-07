/**
 * 获取url参数，返回一个对象
 */
define(function(require) {
    var queryStr = window.location.search;
    if (queryStr.indexOf('?') === 0 || queryStr.indexOf('#') === 0) {
        queryStr = queryStr.substring(1, queryStr.length);
    }
    var queryObj = {};
    var tt = queryStr.split('&');
    for (var i in tt) {
        var ss = typeof tt[i]=='string' ? tt[i].split('=') : [];
        if (ss.length == 2) {
            queryObj[ss[0]] = decodeURIComponent(ss[1]);
        }
    }
    return queryObj;
});
