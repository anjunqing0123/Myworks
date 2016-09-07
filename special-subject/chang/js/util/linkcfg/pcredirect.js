define(function(require,exports) {
	//登录跳转模块
    var login=require('../login/login');
    var user=require('../user/user');
    var urls=require('./interfaceurl');
    var loader=require('../loader/loader');
    var $=require('jquery');
    var addEvent=false;
    var client_suffix='?plt=clt';
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    function validateRegist(){
        var username=user.info.UserName;
        loader.load(urls['interface']['checkSign'],{},function(data){
            if(data.status==-1){
                //已经报过名
                var registrationComplete=urls['redirect']['registrationComplete'];
                if(!!isClient){
                    window.location=registrationComplete+client_suffix;
                }else{
                    window.location=registrationComplete;
                }
            }else if(data.status==1){
                //未报名
                var registrationUrl=urls['redirect']['registration'];
                if(!!isClient){
                    window.location=registrationUrl+client_suffix;
                }else{
                    window.location=registrationUrl;
                }
            }
        });
    }
    var loginFunc=function(){
        validateRegist();
    }
    $(".apply .btn,.js-apply").on('click',function(e){
        var isLogin=login.isLogined();
        e.stopPropagation();
        e.preventDefault();
        if(!isLogin){
            if(!addEvent){
                addEvent=true;
                user.loginEvents.add(loginFunc);
                //1分钟未登录取消绑定事件
                setTimeout(function(){
                    user.loginEvents.remove(loginFunc);
                    addEvent=false;
                },60000);
            }
            login.init({
                type:'login',
                tip: encodeURIComponent("亲，需要登录后才能报名哦")
            });
        }else if(!!isLogin){
            //请求接口查看是否报过名，报过名的跳转个人空间
            validateRegist();
        }
    });
    //登录跳转模块结束
});