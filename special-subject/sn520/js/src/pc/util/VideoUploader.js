/*
* @Author: WhiteWang
* @Date:   2015-08-13 15:16:44
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-10 17:46:01
*/
define(function(require, exports, module){
    var $ = require('jquery');
    var PPUploader = require('./ppVideoUpload');
    var user = require('user');

    var userName = user.info.UserName;
    var ppToken = user.info.token;
    var isHTML5 = false;
    if(window.File && window.FormData){
        isHTML5 = true;
    }

    function VideoUploader(option){
        var opt = $.extend({
            fileInput: 'myFile',
            offset: {w:0,h:0,x:0,y:0},
            cp: 'UGC',
            onMetaInfo: function(){},
            onCommit: function(){},
            onFinish: function(){},
            onFail: function(){},
            onUpdate: function(){},
            onStart: function(){}
        }, option || {});
        var error = {
            1: {errCode:1, message:'请导入正确的文件'},
            2: {errCode:2, message:'您选择的视频格式错误'},
            3: {errCode:3, message:'您选择的视频尺寸太小，请重新选择！'},
            4: {errCode:4, message:'文件大小超出（200M）无法上传！'},
            5: {errCode:5, message:'未登录'},
            6: {errCode:6, message:'上传网络出错，请刷新重试！'}
        };
        var _fileId = null;
        var _fileSize = 0;
        var _fileVal = '';
        var that = this;
        var vul = new PPUploader({
            token: ppToken,
            cp: opt.cp,
            username: userName,
            offset:{x:opt.offset.x, y:opt.offset.y, width:0, height:0},
            width:opt.offset.w,
            height:opt.offset.h,
            fileInput: opt.fileInput
        });
        function checkVideo(){
            var videoTypeArray = ['mp4','flv','mkv','avi','rmvb','3gp', 'wmv', 'asf', 'mpg', 'ts', 'm2ts', 'm4v', 'mpeg', 'rm', 'vob', 'mov', 'qt', '3gp', '3g2', 'f4v', 'ogm', 'mwt', 'gxf'];
            var t1 = _fileVal.lastIndexOf("\\");
            var t2 =  _fileVal.lastIndexOf(".");
            var videoType = $.trim(_fileVal.slice(t2+1)).toLowerCase();

            var vType = -1;
            for(var i=0; i<videoTypeArray.length; i++){
                if(videoType === videoTypeArray[i]){
                    vType = i;
                    break;
                }
            }

            if(vType<0){
                opt.onFail.call(that, error[2]);
                return false;
            }
            if(!isHTML5){
                return true;
            }
            var _fileSizeHTML5 = _fileSize/1024/1024;

            if(_fileSizeHTML5<=0){
                opt.uploadFail(error[3]);
                return false;
            } else if(_fileSizeHTML5>1024){
                opt.uploadFail(error[4]);
                return false;
            }
            return true;
        }
        function metaInfoCallback(evt){
            _fileVal = evt.fileName;
            opt.onMetaInfo.call(that, evt);
        }
        function startCallback(evt){
            // console.log(evt)
            _fileId = evt.fileId;
            if(checkVideo()){
                opt.onStart.call(that, {fileId:_fileId});
            } else {
                vul.cancel(_fileId);
                vul.deleteFile(_fileId);
            }
        }
        function progressUpdateCallback(evt){
            if(evt.total/1024/1024 > 1024 || evt.total <=0){
                vul.cancel(_fileId);
                vul.deleteFile(_fileId);
                if(evt.total <=0){
                    opt.onFail.call(that, error[3]);
                } else {
                    opt.onFail.call(that, error[4]);
                }
            } else {
                opt.onUpdate(evt.total,evt.uploaded);
            }
        }
        function finishCallback(evt){
            _fileId = evt.fileId;
            opt.onFinish.call(that, {fileId:_fileId});
        }
        function failCallback(evt){
            if(evt.failCode === '1006' || evt.failCode === '1001'){
                _fileId = evt.fileId;
                if(checkVideo()){
                    opt.onStart.call(that, {fileId: _fileId});
                    opt.onUpdate.call(that, _fileSize, _fileSize);
                    opt.onFinish.call(that, {fileId:_fileId});
                } else {
                    vul.deleteFile(_fileId);
                }
            } else if(evt.failCode == '2004') {
                opt.onFail.call(that, error[4]);
            } else {
                opt.onFail.call(that, error[6]);
            }
        }
        function deleteCallback(evt){}
        function commitCallback(evt){
            if(!isHTML5){
                _fileVal = null;    //flash不支持连续上传
            }
            opt.onCommit.call(that, {fileId:_fileId});
        }
        vul.bind('metaInfo',metaInfoCallback);//仅flash模式下通过flash选取文件后返回
        vul.bind('start',startCallback);
        vul.bind('progressUpdate',progressUpdateCallback);
        vul.bind('finish',finishCallback);
        vul.bind('fail',failCallback);
        vul.bind('delete',deleteCallback);
        vul.bind('commit',commitCallback);
        this.isHTML5 = isHTML5;
        this.upload = function(file){
            if(typeof userName==='undefined' || !userName){
                opt.onFail.call(that, error[5]);
                return;
            }
            if(isHTML5){
                if(!file){
                    opt.onFail.call(that, error[1]);
                } else {
                    _fileSize = file.size;
                    _fileVal = file.name;
                    vul.upload(file);
                }
            } else {
                if(_fileVal){
                    vul.upload(file);
                } else {
                    opt.onFail.call(that, error[1]);
                }
            }
        }
        this.commit = function(title){
            vul.updateTitle(_fileId, title);
            vul.commit(_fileId);
        }
        this.cancel = function(){
            vul.cancel(_fileId);
        }
        this.completed = function(title){
            this.commit(title);
            // vul.completed = false;
        }
    }

    return VideoUploader;
});
