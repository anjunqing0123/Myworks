/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){

    var $ = require('jquery')
        , modA = require('./a')
    ;

    console.log('sample module - jquery ==> ', $);

    $('h1').text('Sample Code.');

    var DomSample = $('#sample'), htmlText = '', val;

    for(var i in modA){
        if(i && modA[i]){
            val = modA[i];
            if(typeof(modA[i]) === 'object'){
                val = JSON.stringify(modA[i]);
            }
            htmlText += ('<p class="'+ i +'"> key：<strong>' + i + '</strong> value : <strong>' +  val + '</strong></p>');
        }
    }

    DomSample.html(htmlText);

});
