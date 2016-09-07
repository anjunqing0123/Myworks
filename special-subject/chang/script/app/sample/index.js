/*! 一唱成名 create by ErickSong */
/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/sample/index", [ "core/jquery/1.8.3/jquery", "./a", "./b" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery"), modA = require("./a");
    console.log("sample module - jquery ==> ", $);
    $("h1").text("Sample Code.");
    var DomSample = $("#sample"), htmlText = "", val;
    for (var i in modA) {
        if (i && modA[i]) {
            val = modA[i];
            if (typeof modA[i] === "object") {
                val = JSON.stringify(modA[i]);
            }
            htmlText += '<p class="' + i + '"> key：<strong>' + i + "</strong> value : <strong>" + val + "</strong></p>";
        }
    }
    DomSample.html(htmlText);
});

/**
 * Sample module a.
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/sample/a", [ "app/sample/b" ], function(require, exports, module) {
    var data = require("app/sample/b");
    module.exports = {
        name: "module A",
        description: "测试返回A模块内容",
        data: data
    };
});

/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define("app/sample/b", [], function(require, exports, module) {
    return {
        a: 1,
        b: 2
    };
});
