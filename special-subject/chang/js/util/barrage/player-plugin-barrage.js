/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    播放器插件 - 弹幕
 */

define(function(require, exports, modules) {

    var
        $ = require('jquery'),
        log = require('../log/log'),
        player = window.player,
        barrageTransfer = {},
        appBarrage = null
    ;

    // 弹幕设置 barrageSetting
    // data = {
    //  alpha : 0.5,
    //  visible : 0 | 1 //是否显示弹幕狂
    //  size : 28
    // }

    // 发送弹幕 sendBarrage
    // data = {
    //  content : '今天吃饭了吗',
    //  color : '#3399fe'
    // }

    // 播放弹幕 playBarrage
    // data = {
    //  playPoint : 14195739840,
    //  content : '今天吃饭了吗',
    //  userName : 'xxx',
    //  refName : 'live_300156' //vod/live_[cid]
    // }

    // player.onNotification({
    //     header : {
    //         type : "barrageSetting"
    //     },
    //     body : {
    //         data : data
    //     }
    // });


    //弹幕设置 - init之后
    //player.onInit.add(function(){
    player.onRegister('setupbarrage', function(data) {
        //全局设置
        player.getPlayer().setCallback('barragesetting', {
            header : {
                type : 'barragesetting'
            },
            body : {
                data : {
                    //alpha : 1,
                    visible : 0
                    //size : 28
                    //color : '#FF9900'
                }
            }
        });

    });

    //初始化
    barrageTransfer.init = function(app, player){
        log('barrageTransfer init... ', app, player);
        appBarrage = app;
        barrageTransfer.get();
        barrageTransfer.clearbarrage();
        barrageTransfer.setXBSetting();
        barrageTransfer.getXBSetting();
        barrageTransfer.getXBWords();
    };

    //发送弹幕
    barrageTransfer.add = function(databody){
        log('barrageTransfer add == ', databody);
        player.onNotification({
            header : {
                type : 'sendbarrage'
            },
            body : {
                data : databody
            }
        });
    };

    //接收弹幕
    barrageTransfer.get = function(){
        player.onRegister('playbarrage', function(data){
            log('barrageTransfer playbarrage get == ', data, data.body.data);
            var dataContent = data.body && data.body.data || {};
            appBarrage.add(dataContent);
        });
    };

    //清空弹幕 - 新增需求拖动不处理 - 重新改回来
    barrageTransfer.clearbarrage = function(){
        log('barrageTransfer clearbarrage == ');
        player.onRegister('clearbarrage', function(data){
            appBarrage.clear();
        });
    };

    //小冰显示与否设置
    barrageTransfer.setXBSetting = function(databody){
        log('barrageTransfer add == ', databody);
        player.onNotification({
            header : {
                type : 'sendbarrage'
            },
            body : {
                data : databody
            }
        });
    };

    //小冰设置xbsettings
    //{ 'type':'xbsettings',    'data' : { 'xbisopen':BarrageConfig.xbisOpen,                   'name':BarrageConfig.xbName}}
    barrageTransfer.getXBSetting = function(){
        player.onRegister('xbsettings', function(data){
            log('barrageTransfer xbsettings == ', data, data.body.data);
            var dataContent = data.body && data.body.data || {};
            appBarrage.initXBSetting(dataContent);
        });
    };

    //接收小冰说的话
    //{ 'type':'xiaobing',      'data' : 【{ "picurl":xiaobing['picUrl'], "text": xiaobing['text']】。。。}}
    barrageTransfer.getXBWords = function(){
        player.onRegister('xiaobing', function(data){
            log('barrageTransfer xiaobing == ', data, data.body.data);
            var dataContent = data.body && data.body.data || {};
            appBarrage.addXBWords(dataContent);
        });
    };

    modules.exports = barrageTransfer;

});
