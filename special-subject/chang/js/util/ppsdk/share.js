define(function(require, exports, module){
	var sdk = require("./sdkUtil");
	//分享按钮

    //shareText shareURL shareImageURL
    module.exports = function(name,url,pic){

        sdk.ready(function(){
            var btnOpt = {};
            btnOpt.behavior = 0;
            var pic_url = encodeURIComponent(pic);
            var url = window.location.href;
            var name = encodeURIComponent(name);
            if(/[&]?type=app/.test(url)) {
                url = url.replace(/[&]?type=app/, '');
            }
            btnOpt.params = "shareText="+name+"&shareImageURL="+pic_url+"&shareURL="+ encodeURIComponent(url);
            sdk("customizeBtn",btnOpt);
        });
    };
});
