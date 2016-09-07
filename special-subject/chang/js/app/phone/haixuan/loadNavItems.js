/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){

	var $ = require('jquery');
	var loader = require('./../haixuan/haixuan');
	$(function(){
        loader("swper");
    });
});