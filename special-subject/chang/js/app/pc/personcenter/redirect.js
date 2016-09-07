define(function(require, exports, module){
    var login=require('../../../util/login/login');
    var user=require('../../../util/user/user');
    var loader=require('../../../util/loader/loader');
    var $=require('jquery');
    //url配置文件
    var urls=require('../../../util/linkcfg/interfaceurl');
    var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    function counter(dom,count){
        setTimeout(function(){
            dom.text(--count);
            if(count!=0){
                counter(dom,count);
            }else{
                if(!!isClient){
                    window.location='http://passport.aplus.pptv.com/usercenter/?from=clt';
                }else{
                    window.location=urls['redirect']['oneSingTab'];
                }
            }
        },1000);
    }
    function validateRegist(){
        loader.load(urls['interface']['checkSign'],{},function(data){
            if(data.status==-1){
                //已经报过名
                var tempDom=$(".module-register-redirect");
                var updateDom=tempDom.find('em');
                counter(updateDom,5);
                if(!isClient){
                    $("#js-personcenter").attr('href',urls['redirect']['oneSingTab']);
                }else{
                    $("#js-personcenter").attr('href','http://passport.aplus.pptv.com/usercenter/?from=clt');
                }
            }else if(data.status==1){
                //未报名
                if(!!isClient){
                    window.location=urls['redirect']['registration']+'?from=clt';
                }else{
                    window.location=urls['redirect']['registration'];
                }
            }
        });
    }
    //验证报名情况
    var isLogin=login.isLogined();
    if(!!isLogin){
        validateRegist();
    }else{
        if(!!isClient){
            window.location=urls['redirect']['registration']+'?from=clt';
        }else{
            window.location=urls['redirect']['registration'];
        }
    }
});