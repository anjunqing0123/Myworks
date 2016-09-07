/*
* @Author: WhiteWang
* @Date:   2015-08-18 15:53:13
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-11 12:12:13
*/
define(function(require, exports, module){
    var $ = require('jquery');
    var _ = require('underscore');
    var cookie = require('../cookie/cookie');
    var user = require('../user/user');
    var _template = _.template(''+
    '<a href="http://connect.qq.com/widget/shareqq/index.html?title=<%=title%>&url=<%=url%>QQ&site=http%3A%2F%2Fwww.pptv.com%2F&desc=<%=shareContent%><%if(pics!=null){%>&pics=<%=pics%><%}%>" external_url="_t=share" target="_blank" title="分享到qq" class="ui-share qq s2"></a>'+
'<a href="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=<%=url%>QQ%E7%A9%BA%E9%97%B4&desc=<%=shareContent%><%if(pics!=null){%>&pics=<%=pics%><%}%>" external_url="_t=share" target="_blank" title="分享到qq空间" class="ui-share qzone s3"></a>'+
 '<a href="http://v.t.sina.com.cn/share/share.php?c=spr_web_bd_pplive_weibo&url=<%=url%>%E6%96%B0%E6%B5%AA%E5%BE%AE%E5%8D%9A&title=<%=shareContent%>&source=PPLive%E7%BD%91%E7%BB%9C%E7%94%B5%E8%A7%86&sourceUrl=http%3A%2F%2Fwww.pptv.com%2F&content=utf-8&appkey=1938876518<%if(pics!=null){%>&pic=<%=pics%><%}%>" external_url="_t=share" target="_blank" title="分享到微博" class="ui-share weibo s4"></a>');
    var UserInfo = user.info || {}, puid = cookie.get('PUID') || '', uid = UserInfo.UserName || '';
    var platform = 'web';
    try{
        if(external && external.GetObject){
            platform = 'clt';
        }
    }catch(e){}
    function ShareBox(options){
        var opt = $.extend({
            box: '#shareBox',
            shareContent: '来PPTV看视频吧',
            title: document.getElementsByTagName('title')[0].innerHTML,
            url: window.location.href,
            pics:null
        }, options || {});

        var $box = $(opt.box);
        if(opt.url.indexOf('?')===-1){
            opt.url+='?';
        } else {
            opt.url+='&';
        }
        opt.url+='suid='+puid+'&uid='+uid+'&splt='+platform+'&sapp=';

        $box.append(_template({
            shareContent: encodeURIComponent(opt.shareContent),
            title: encodeURIComponent(opt.title),
            url: encodeURIComponent(opt.url),
            pics: opt.pics===null ? null : encodeURIComponent(opt.pics)
        }));
    }
    return ShareBox;
});
