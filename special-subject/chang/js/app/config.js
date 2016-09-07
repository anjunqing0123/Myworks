//SeaJs Config.
var VERSION = window.StaticVersion || 'v_20150807';
seajs.importStyle=function importStyle(b){var a=document.createElement("style"),c=document;c.getElementsByTagName("head")[0].appendChild(a);if(a.styleSheet){a.styleSheet.cssText=b}else{a.appendChild(c.createTextNode(b))}};
(function(VERS){
    var flag = true, path = '/js/', base = 'http://static9.pplive.cn/chang/' + VERS;
    seajs.config({
        base : base + path,
        alias: {
            jquery: "core/jquery/1.8.3/jquery",
            zepto: "core/zepto/zepto",
            underscore: "core/underscore/1.8.3/underscore",
            backbone: "core/backbone/backbone",
            client: "http://static9.pplive.cn/pc_client/v_20150810183011/clt.js",
            login:"util/login/login"
        }
    });
    if(!flag){ document.write('<script src="' + base + '/js/app/sea-config.js"><\/script>');}
})(VERSION);
