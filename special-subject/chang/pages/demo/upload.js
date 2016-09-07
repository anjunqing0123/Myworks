/*
* @Author: WhiteWang
* @Date:   2015-08-11 10:48:32
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-08-11 17:49:51
*/
define(function(require, exports, module){
    var VideoUploader = require('util/upload/VideoUploader');
    var $ = require('jquery');

    var vUploader = new VideoUploader({
        fileInput: 'myFile',
        cp: 'UGC',
        commitBtn: 'uploadBtn',
        uploadStart: function(data){
            $('#fileBox').hide();
            $('#uploadBox').show();
        },
        progressUpdate: function(all, loaded){
            all = all/1024/1024;
            loaded = loaded/1024/1024;
            var _lWid = loaded*100/all;
            $('#loadingNum').stop().animate({'width':_lWid+"%"},100);
        },
        uploadFail: function(data){
            $('#fileBox').show();
            $('#uploadBox').hide();
            alert(data.message)
        },
        getUserInputInfo: function(){
            return {};
        }
    });
    vUploader.init();
});
