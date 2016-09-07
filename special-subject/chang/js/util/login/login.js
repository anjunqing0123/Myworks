/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    通用login
 */

define(function(require) {
    var $ = require('jquery'),
        user = require('../user/user'),
        cookie = require('../cookie/cookie'),
        doc = document,
        ipadPlayer = function(s) {
            var videoPlayer = $('video');
            if(videoPlayer.length === 0) return;
            if (s == "hidden") {
                videoPlayer.each(function(){
                    $(this).attr('_controls',$(this).attr('controls'));
                    $(this).removeAttr('controls');
                });

            } else {
                videoPlayer.each(function(){
                    $(this).attr('controls',$(this).attr('_controls'));
                });
            }
        };


    try{
        doc.domain = 'pptv.com';
    }catch(err){}

    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    var clientCommon = window.clientCommon;

    if(isClient && clientCommon){
        clientCommon.onLogin(function(){
            var sid = setInterval(function(){
                user.readInfo(true);
                clearInterval(sid);
            }, 1000);
        });

        clientCommon.onLogout(function(){
            user.logout();
        });
    }

    var layer = (function(){
        var self = this,
            now = + new Date(),
            _cssopts = {},
            params = {
                type : 'login' //login or reg
            },
            isLoged = !!(cookie.get('PPName') && cookie.get('UDI')) || false,
            size = 'standard';
        var urls = {
            'standard': 'http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=',
            'mobile': 'http://pub.aplus.pptv.com/phonepub/mobilogin/?tab=',
            'mobile_web':'http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?tab=',
            'mobile_web_nosns':'http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?sns=0',
            'mini': 'http://pub.aplus.pptv.com/wwwpub/minilogin/?tab=',
            'tiny': 'http://app.aplus.pptv.com/zt/2013/cwpd/plogin/?tab=',
            'empty':'about:blank'
            };

        var wp_div = doc.createElement('div'),
            msk_div = doc.createElement("div"),
            btn_close = doc.createElement("span");
            wp_div.setAttribute("id", _cssopts.id);
            wp_div.setAttribute("class", "layer loginlayer");

        wp_div.id = 'layer_' + now;
        btn_close.className = 'layer_close';
        btn_close.innerHTML = "<a href='javascript:;' onclick='close_" + now +"()' class='close'></a>";
        wp_div.innerHTML = "<iframe id='iframe' src='"+urls.empty+"' style='overflow:visible;z-index:2' width='100%' height='100%'  scrolling='no' frameborder='0'></iframe>";
        btn_close.style.cssText = "position:absolute; right:15px; top:15px; width:20px; height:20px; text-align:center;background:url('http://static9.pplive.cn/pptv/index/v_201203081858/images/no.gif'); cursor:pointer";
        wp_div.appendChild(btn_close);

        var wp_width = '620', //$(wp_div).width(),
            wp_height = '498', //$(wp_div).height(),
            st = $(doc).scrollTop(),
            sl = $(doc).scrollLeft();

        _cssopts = {
            width : wp_width + 'px',
            height : wp_height + 'px',
            visibility : 'hidden',
            position : 'absolute',
            top : '50%',
            left : '50%',
            'margin-top' : st - 450/2 + 'px',
            'margin-left' : sl - wp_width/2 + 'px',
            'z-index' : 10000
        };


        return {
            init : function(opts, cssopts){

                doc.body.appendChild(wp_div);
                $(wp_div).css(_cssopts);
                //仅针对直播秀或iPad
                wp_div.style.cssText = "width:0; height:0;overflow:hidden";

                var iframe = $('#iframe');
                iframe.on("load",function () {
                    if(navigator.userAgent.indexOf('MSIE')>-1){
                       $(this).height(430);
                    }else{
                        var doc = this.contentDocument;
                        $(this).height($(doc).find("body").height());
                    }
                });
                window['iframehide'] = function(){
                    var c = doc.getElementById('iframe');
                    wp_div.style.visibility = 'hidden';
                    $(wp_div).css({'width' : '0', 'height' : '0'});
                    ipadPlayer('visible');
                };

                var isLogined = this.isLogined();
                if(isLogined) {
                    user.readInfo(true);
                    return;
                }
                params = $.extend(params, opts);

                if(isClient && clientCommon){
                    if(params.type == 'login'){
                        clientCommon.showLoginBox();
                    }else if(params.type == 'reg'){
                        clientCommon.showRegBox();
                    }

                    return;
                }
                st = $(doc).scrollTop();
                sl = $(doc).scrollLeft();

                /** Web请求参数from
                 *  web顶部信息条    web_toplist
                 *  直播秀      web_liveshow
                 *  评论/聊聊   web_comt
                 *  跳过广告    web_adskip
                 *  添加榜单    web_list
                 *  直播频道互动  web_liveinter
                 *  Web_page(注册网页)
                 *  Web_adskip(跳过广告)
                 *  自定义导航   web_topnav
                 *  播放页订阅/收藏    web_collect
                 *
                **/

                /** app表示哪个应用登录，
                 * vas需求 - app=ppshow，调用vas登录、注册api
                 */

                if(iframe.length > 0){
                    if(params.hasOwnProperty('size')){
                        size = params['size'];
                    }
                    iframe[0].src = urls[size] + params.type + '&from=' + params.from + '&app=' + params.app+ (params.tip?('&tip='+params.tip):""); // + '&r=' + Math.random();
                    _cssopts['margin-top'] = st - 450/2 + 'px';
                    _cssopts['margin-left'] = sl - wp_width/2 + 'px';
                    _cssopts = cssopts ? $.extend(_cssopts, cssopts) : _cssopts;
                    if(size=="mobile_web"||size=="mobile_web_nosns"){
                        _cssopts['margin-top']="0px";
                        _cssopts['margin-left']="0px";
                        _cssopts['top']=(document.body.scrollTop || document.documentElement.scrollTop)+"px";
                        _cssopts['left']="0px";
                        _cssopts['width']="100%";
                        _cssopts['height']="100%";
                        _cssopts['overflow']="auto";
                        $(wp_div).find('.layer_close').hide();
                    }
                    $(wp_div).css(_cssopts);
                    iframe.parent().css('visibility','visible');
                    ipadPlayer('hidden');//防止ipad中播放器覆盖弹层
                }


                btn_close.onclick = function(){
                    wp_div.style.visibility = 'hidden';
                    $(wp_div).css({'width' : '0', 'height' : '0'});
                    if(window.CustomListDialog){
                        CustomListDialog.close(); //播放页榜单
                    }
                    ipadPlayer('visible');
                };

            },
            success:{},
            isLogined : function(){
                if(isClient && clientCommon){ //客户端
                    return clientCommon.userIsLogin();
                }else{
                    return !!(cookie.get('PPName') && cookie.get('UDI'));
                }
            },
            show : function(params){
                //nothing
            },
            hide : function(){
                doc.body.removeChild(wp_div);
            },
            check : function(callback, params, cssobj){
                var isLogined = this.isLogined();
                if (params) {
                    if(params.from){
                        this.success[params.from] = callback;
                    }
                    if (params.size in urls) {
                        size = params.size;
                    }
                }
                if(isLogined){
                    if (callback && typeof(callback) == 'function') {
                        callback();
                    }
                }else{
                    this.init(params,cssobj);
                }
            },
            logout : function(callback){
                if(callback && typeof(callback) == 'function') {
                    user.onLogout(callback);
                }else{
                    user.logout();
                }
            },
            onSuccess : function(arg,from){
                user.readInfo(true); //触发登录

                if(arg == 'success'&&this.success[from]){
                    this.check(this.success[from]);
                }
            }
        };

    })();

    return layer;

});
