seajs.config({
    base: "http://static9.pplive.cn/chang/v_20150916160019/js/",
    alias: {
        jquery: "core/jquery/1.8.3/jquery",
        zepto: "core/zepto/zepto",
        underscore: "core/underscore/1.8.3/underscore",
        backbone: "core/backbone/1.8.3/backbone",
        client : "http://static9.pplive.cn/pc_client/v_20150810183011/clt.js"
    }
    // ,map: [
    //     [".js", (".js?" + (+new Date()))]
    //     //, [/(\/chang\/)(?=js)/, "$1" + '/v_08' + "/"]
    // ]
});
