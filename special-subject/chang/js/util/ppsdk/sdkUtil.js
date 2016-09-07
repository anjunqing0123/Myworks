/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */
define(function(require, exports, module){
    var $ = require('jquery'),
        alertBox = require('./../log/alertBox')
    ;

	ppsdk.config({
        api: [], //本页面用到的js接口列表(暂时不支持)
        signature: '', //签名，暂时可不填
        debug: true //是否开启调试
    });



    /**
     * [obj description]
     * opt{
     *     ...:{},
     *     success:function(rspData){
     *
     *     },
     *     error:function(errCode, msg){
     *
     *     },
     *     cancel:function(){
     *
     *     }
     * }
     **/
    var T = {};
	var p = function(funcName,opt){
        if(T[funcName] && (+new Date()) - T[funcName] < 500){
            alertBox({
                type:"mini",
                msg:'频繁调用接口'+ funcName +'，请稍后再试~'
            });
            return;
        }
        if( !ppsdk ){
            alertBox({
                type:"mini",
                msg:'页面加载错误，请刷新后再试~'
            });
            return;
        }
        if( !p.readyStatus ){
            alertBox({
                type:"mini",
                msg:'页面加载未完成，请稍后再试~'
            });
            return;
        }
        if( funcName == 'customizeBtn'){
            opt = $.extend({},p.btnOpt,opt);
        }
        try{
            if(ppsdk[funcName]){
                ppsdk[funcName](opt);
                T[funcName] = +new Date();
            }
        }catch(e){
            console.info("call of ppsdk func name="+funcName +" run into error");
            console.info(e);
        }

    };
    p.readyStatus = false;
    p.readyList = [];
    p.ready = function(func){

        if( p.readyStatus ){
            func();
        }else{
            p.readyList.push(func);
        }
    };

    //初始化留言板
    ppsdk.ready(function() {
        p.readyStatus = true;
        if(!p.readyList){
            return false;
        }
        for( var i = 0 ; i < p.readyList.length ; i++ ){
            p.readyList[i]();
            console.info(i);
        }
        delete p.readyList ;

    });

    p.btnOpt = {
        id:"1001",//标识按钮
        behavior:0,//按钮行为，创建删除等
        type:1,//按钮类型，创建更新时用
        pattern:{        //按钮样式
            position:{
                x:0,
                y:0
            },
            size:{
                width:0,
                height:0
            },
            normal:{
                text:"",
                textColor:"",
                fontSize:10,
                boarderColor:"xxxxxx",
                boarderSize:"",
                img:"",
                bgImg:""
            },
            highLight:{
                text:"",
                textColor:"#000",
                fontSize:10,
                boarderColor:"#fff",
                boarderSize:"",
                img:"",
                bgImg:""
            }
        },
        clickFunc:"",//点击事件的函数
        params:"",//本地处理的参数
        success:function(rspData) {

        },
        error:function(errCode, msg) {
            alert('不合法1')
            alertBox({
                "type":"mini",
                "msg":errCode + msg
            });
        },
        cancel:function() {
            alert('不合法12')
            alertBox({
                "type":"mini",
                "msg":"cancel_share"
            });
        }
    };

	module.exports = p;

});
