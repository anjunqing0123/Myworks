/**
 * Sample module a.
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){

    var data = require('./b');

    module.exports = {
        name : "module A",
        description : "测试返回A模块内容",
        data : data
    };

});
