/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    loader - 加载器

 * Loader.load('url', params, sucessCallback, errorcallback, beforeSend, scope);

 * Loader.load('ordersvc/v1/getLastNews.json?', {
 *     type : 'hoster',
 *     roomid : webcfg.roomid,
 *     limit : 20,
 *     __config__ : {
 *        cache : true,
 *        callback : 'getCallback'
 *     }
 * }, function(d){
 *     if(d && d.err === 0 && d.data){
 *        GIftRender($('#gift ul'), d.data);
 *    }
 * });
 *
 */

define(function(require, exports, module){
    var $ = require('jquery');
    var log = require("../log/log");
    var loaderParams = require('../platform/plt');
    var Loader = {}, N = 0;

    function load(url, params, callback, errorcallback, beforecallback, scope){
        log('Loader load====', url, params);

        var sevurl = url, _config = {}, _cdn, prefix = 'pplive_callback_', callbackName = '',
            beforeCallback = beforecallback || $.noop,
            errorCallback = typeof(errorcallback) == 'function' ? errorcallback : $.noop,
            opts = {
                from : 'chang',
                version : '2.1.0',
                format : 'jsonp'
            }
        ;

        params = $.extend(opts, loaderParams, params);

        if(params.__config__){
           _config = params.__config__ ;
           delete params.__config__;
        }

        _cdn = (_config.cache  === true || _config.cdn  === true && _config.callback) ? true : false;

        sevurl = sevurl.indexOf('?') > -1 ? sevurl + '&' : sevurl + '?';
        sevurl += $.param(params);
        sevurl = sevurl.replace(/&&/, '&').replace(/\?\?/, '?');

        if(sevurl.match(/cb=.*/i)){
            callbackName = /cb=(.*?(?=&)|.*)/.exec(sevurl)[1];
            sevurl = sevurl.replace(/(.*)?(cb=.*?\&+)/, '$1');
        }else{
            callbackName = _cdn ? _config.callback : prefix + (N++);
        }

        $.ajax({
            dataType : 'jsonp',
            type : 'GET',
            cache : _config.cache === 0 ? false : true,
            url : sevurl,
            jsonp : 'cb',
            jsonpCallback : function(){
                return callbackName;
            },
            beforeSend : function(XMLHttpRequest){
                beforeCallback();
            },
            success : function(data) {
                _config = null;
                if (callback && typeof(callback) == 'function') {
                    callback.apply(scope, arguments);
                }
            },
            timeout : 10000,
            statusCode : {
                404 : function(){ errorCallback();},
                500 : function(){ errorCallback();},
                502 : function(){ errorCallback();},
                504 : function(){ errorCallback();},
                510 : function(){ errorCallback();}
            },
            error : function(XMLHttpRequest, textStatus, errorThrown){
                log('Ajax Load error: ', sevurl,  XMLHttpRequest, textStatus, errorThrown);
                errorCallback();
            }
        });
    }

    function ajax(option) {
        var opt = $.extend({
            type : 'GET',
            dataType : 'jsonp',
            cache: true,
            jsonp: 'cb',
            success: function(){},
            error: function(){}
        }, loaderParams, option);
        var success = opt.success;
        opt.success = function(data){
            if(!data.err){
                success(data);
            }else{
               //console.log('getJSONP error: ' + (option.errorCode || {})[data.err] + '|' + data.msg, option)
            }
        };
        return $.ajax(opt);
    }

    Loader = {
        load : load,
        ajax : ajax
    };

    module.exports = Loader;

});
