/* 
* @Author: WhiteWang
* @Date:   2015-04-28 14:48:04
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-05-27 10:37:03
* @Des 对于版本大于30的chrome或客户端，图片格式是jpg，用.webp压缩格式；冰哥需求
*/

define(function(require, exports, module){
    var isClient = (function(){
        try{
           if (this.external && external.GetObject('@pplive.com/ui/mainwindow;1')){
               return true;
           }
        }catch(e){}
        return false;
    })();

    function getImgFormat(url){
        var match= /\.[^\.]+$/.exec(url);
        if(match!=null){
            return match[0];
        }else{
            return false;
        }
    }

    function getChromeVer(){
        var isChrome = window.navigator.userAgent.indexOf("Chrome") !== -1;
        if(!isChrome){
            return 0;
        }
        return parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
    }

    var Webp = {
        isBrowserSupport: function(){
            if(typeof this.webpSupport=='boolean'){
                return this.webpSupport;
            }
            if(isClient){
                this.webpSupport = true;
                return this.webpSupport;
            }
            var el = new Image();
            el.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';
            this.webpSupport = el.height === 1;
            return this.webpSupport;
        },
        isFormatSupport: function(url){
            //目前图片格式只支持jpg,jpeg
            var imgFormat = getImgFormat(url);
            if(imgFormat=='.jpg' || imgFormat=='.jpeg'){
                return true;
            } else {
                return false;
            }
        },
        isDomainSupport: function(url){
            //域名支持
            var reg = /\/((img([1-3]|[5-9]|1[0-9]|2[0-8]|3[0-9]|4[0-5])|m\.imgx|v\.img|webpic)\.pplive\.cn|(img(1|[5-9]|1[0-9]|2[0-8])|res[1-4]?|sr[1-9]|img\.bkm)\.pplive\.com|(m\.imgx|focus)\.pptv\.com)\//
            return reg.test(url);
        },
        splitUrl: function(url){
            //http://sr1.pplive.com/cms/13/48/6aca0ee5be6a5f29861a2bfe90b26c5d.jpg
            //http://sr1.pplive.com/cms/13/48/6aca0ee5be6a5f29861a2bfe90b26c5d.jpg?id=88908
            //http://sr1.pplive.com/cms/13/48/6aca0ee5be6a5f29861a2bfe90b26c5d.jpg#88908
            var n = url.search(/\?|\#/);
            if(n==-1){
                return [url];
            }
            return [url.substr(0,n),url.substr(n)];
        },
        getWebp: function(url){
            //如果url带参数，将参数分离
            //检测浏览器是否支持
            //检测图片格式是否支持
            //检测图片域名是否支持
            if(!this.isBrowserSupport()){
                return url;
            }
            var urlArray = this.splitUrl(url);
            if(!this.isFormatSupport(urlArray[0])){
                return url;
            }
            if(!this.isDomainSupport(urlArray[0])){
                return url;
            }
            urlArray[0] = urlArray[0]+'.webp';
            return urlArray.join('');
        }
    }

    return Webp;
});