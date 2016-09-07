/**
 * fileUpload
 *
 * author: pelexiang
 * copyright: pptv
 */
define(function(require, exports, module){
    var ppuploader = function(options){

        var that = this;

        var PROGRESS_UPDATE = 'progressUpdate';
        var START = 'start';
        var FINISH = 'finish';
        var FAIL = 'fail';
        var CANCEL = 'cancel';
        var DELETE = 'delete';
        var COMMIT = 'commit';
        
        var uploadUrl = "http://ugc.upload.pptv.com/html5upload";
        var swfUrl = window.flashUploadSwf;
        //var swfUrl = "http://static9.pplive.cn/corporate/upload/";
        //var uploadUrl = "http://192.168.27.34:8080/ugc-upload/html5upload";
        //var jsonUrl = 'http://192.168.27.34:8080/ugc-service/init_upload';
        
        var jsonUrl = 'http://ugc.api.pptv.com/init_upload';
        var deleteUrl = 'http://ugc.api.pptv.com/video_delete';
        var commitUrl = 'http://ugc.api.pptv.com/video_update';
        
        var upload_id = '';
        var swfCom;
        var isDelete = true;
        
        
        var _user_info;
        var _username = '';
        var prev_loaded = 0;
        var uploadSize = 0;
        var nextSize = 0;
        var _updateTitleName;
        var _updateTitleId;
        var _file,blob,fd,xhr;
        this.swfPlayer;
        this.canceled = false;
        this.completed = false;
        this.progressing = false;
        this.json_data;
        this.fileName = '';
        this.isHTML5Bool = false;
        this._listener = {};

        this.init = function(){ 
            _user_info = options;
            _file = document.getElementById(_user_info.fileInput);
            if(options.username != undefined){
                _username = options.username;
            }
            if(!that.isHTML5()){
                that.flashLoad();
            }
        }
        this.upload = function(file){
            if(that.completed){
                 that.fireEvent(FAIL,{failCode:"1001",fileId:upload_id});
                 return;
            }
            if(!that.isHTML5Bool && that.swfPlayer){
                that.swfPlayer.upload();
                return;
            }
            if(file == null || file == undefined){
                that.fireEvent(FAIL,{failCode:"1002",fileId:""});
                return;
            }
            _file = file;
            this.progressing = false;
             var qs = '?format=jsonp'+ ugcQueryString() +
                        '&cb=jsonpCb.jsonpOnResult'+
                        '&rnd='+Math.random();
             requestUgc(jsonUrl, qs);
        }
        this.isHTML5 = function(){
            // return false;
            that.isHTML5Bool = false;
             if(window.File && window.FormData){
                that.isHTML5Bool = true;
             }
             return that.isHTML5Bool;
        }
        this.flashLoad = function(){
            if(_file == null || _file == undefined){
                that.fireEvent(FAIL,{failCode:"1002",fileId:""});
                return;
            }
            swfCom = _file.parentNode;
            // swfCom.style.position = "relative";
            var ppSwf = document.createElement("div");
            ppSwf.id = "ppSwfPlayer";
            swfCom.appendChild(ppSwf);
            var vars = 'external=ppflash&cp='+_user_info.cp+'&token='+encodeURIComponent(_user_info.token);
            if(_username.length > 0)vars += '&username='+_username;
            var swfObject = {
                swfid:'ppSwfId',
                swfwmode:'transparent',
                movie:swfUrl,
                flashvars:vars
            }
            var swftxt = ['<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" width="100%" height="100%" id="'+ swfObject.swfid + '" align="middle">', '<param name="allowScriptAccess" value="always" />', '<param name="allowFullScreen" value="false" />', '<param name="movie" value="' + swfObject.movie + '" />', '<param name="quality" value="high" />', '<param name="wmode" value="' + swfObject.swfwmode + '" /><param name="bgcolor" value="#000000" />', '<param name="flashvars" value="' + swfObject.flashvars + '">', '<embed src="' + swfObject.movie + '" flashvars="' + swfObject.flashvars + '" wmode="' + swfObject.swfwmode + '" backgroundcolor="#000000" quality="high" width="100%" height="100%" name="'+swfObject.swfid+ '" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />', "</object>"].join("");   
            //console.log(swftxt);
            var vx=0,vy=0,vw=0,vh=0,vWid,vHei;
            if(options.offset != undefined){
                vx = options.offset.x != undefined ? options.offset.x : 0;
                vy = options.offset.y != undefined ? options.offset.y : 0;
                vw = options.offset.width != undefined ? options.offset.width : 0;
                vh = options.offset.height != undefined ? options.offset.height : 0;
                vWid = options.width != undefined ? options.width : 0;
                vHei = options.height != undefined ? options.height : 0;
            }
            ppSwf.style.position = "absolute";
            ppSwf.style.width = (vWid + vw) + 'px';
            ppSwf.style.height = (vHei + vh) + 'px';
            ppSwf.style.top = vy + 'px';
            ppSwf.style.left = vx + 'px';
            ppSwf.innerHTML = swftxt;
            that.swfPlayer = document.getElementById('ppSwfId');
        }
        var requestUgc = function(url, params,method, cb, error) {
            url+=params;
            //console.log(url);
            if(method == 'ajax'){
                ajaxLoad(url, cb);
            } else {
                jsonpLoad(url)
            }
        }
        var reUpload = function(i){
            
        }
        var fileupload = function(){

            fd = new FormData();

            nextSize = uploadSize + 10 * 1024 * 1024;

            if(nextSize > _file.size){
                nextSize = _file.size;
            }
            //console.log('uploadSize '+uploadSize +' ----- '+nextSize);
            if(_file.slice){
                blob = _file.slice(uploadSize,nextSize);
            } else if(_file.webkitSlice){
                blob = _file.webkitSlice(uploadSize,nextSize);
            } else if(_file.mozSlice){
                blob = _file.mozSlice(uploadSize,nextSize);
            }
            var range = "bytes " + uploadSize + " - " + nextSize + "/" + _file.size;
            //console.log('range : ' + range)
            fd.append('fileToUpload',blob);

            xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", uploadProgress, false);
            xhr.addEventListener("load", uploadCompleted, false);
            xhr.addEventListener("error", uploadFailed, false);
            xhr.addEventListener("abort", uploadCanceled, false);
            
            var url = uploadUrl;
            var fileTime = new Date(_file.lastModifiedDate.toUTCString());
                url += "?format=json&filename=" + encodeURIComponent(_file.name) + ugcQueryString() +
                    "&uploadid=" + upload_id +
                    "&size=" + _file.size +
                    "&type=" + encodeURIComponent(_file.type) +
                    "&lastmodifiedtime=" + (_file.lastModifiedDate ? fileTime.getTime() : "");

            xhr.open("POST",url);
            xhr.setRequestHeader("Content-Range", range);
            xhr.send(fd);

        }
        var uploadProgress = function(evt){
            if (evt.lengthComputable) {
                if(!that.progressing){
                    that.progressing = true;
                    that.fileName = encodeURIComponent(_file.name);
                    that.fireEvent(START,{obj:_user_info.fileInput,fileId:upload_id,mode:that.isHTML5Bool ? 'html5' : 'flash',fileName:_file.name});
                }
                var speed = evt.loaded - prev_loaded;
                var alreadySend = uploadSize + evt.loaded;
                var cbparam = {fileId:upload_id, uploaded:alreadySend, total:_file.size}
                that.fireEvent(PROGRESS_UPDATE,cbparam)
                prev_loaded = evt.loaded;
            } else {
                
            }
        }
        var uploadCompleted = function(){
            uploadSize = nextSize;
            if (uploadSize < _file.size) {
                fileupload();
            } else {
                that.completed = true;
                that.progressing = false;
                that.fireEvent(FINISH,{fileId:upload_id});
            }
        }
        var uploadFailed = function(){
            that.progressing = false;
            that.fireEvent(FAIL,{failCode:"1003",fileId:upload_id});
        }
        var uploadCanceled = function(){
             that.fireEvent(CANCEL,{fileId:upload_id});
        }
        var jsonpLoad = function(uri) {
            var script = document.createElement('script');  
            script.setAttribute('src', uri)
            document.getElementsByTagName('head')[0].appendChild(script); 
        }
        this.jsonpOnResult = function(jdata){
            if (jdata.errorCode != undefined && jdata.errorCode == '0') {
                uploadUrl = jdata.result.html5UploadUrl;
                upload_id = jdata.result.uploadID;
                var dateTime = new Date(_file.lastModifiedDate.toUTCString());
                var qs = "?format=json&filename=" + encodeURIComponent(_file.name) + ugcQueryString() +
                    "&uploadid=" + upload_id +
                    "&size=" + _file.size +
                    "&type=" + encodeURIComponent(_file.type) +
                    "&lastmodifiedtime=" + (_file.lastModifiedDate ? dateTime.getTime() : "");
                requestUgc(uploadUrl, qs, 'ajax', that.ajaxOnResult);
            } else {
                that.fireEvent(FAIL,{failCode:"1004",fileId:""});
            }
        }
        var ajaxLoad = function(uri, callback) {
            var request = new XMLHttpRequest();
            request.open("GET", uri,true);  
            request.send(null);
            request.onreadystatechange = that.ajaxOnResult;
        }
        this.ajaxOnResult = function(evt){
            if ((evt.currentTarget.readyState == 4) && (evt.currentTarget.status == 200 || evt.currentTarget.status == 0)){
                //console.log(evt.currentTarget);
                //console.log(evt.currentTarget.responseText);
                that.json_data = JSON.parse(evt.currentTarget.responseText);
                if(that.json_data.size != undefined){
                    uploadSize = that.json_data.size;
                    if(uploadSize >= _file.size){
                       uploadSize = nextSize = _file.size;
                       that.fireEvent(FAIL,{failCode:"1006",fileId:upload_id});
                    } else {
                        fileupload();
                    }
                }
            } 
        }
        this.updateTitle = function(fileId,movieTitle){
            _updateTitleName = movieTitle || that.fileName;
            if(!that.isHTML5Bool && that.swfPlayer){
                that.swfPlayer.updateTitle({"fileId":fileId,"movieTitle":_updateTitleName});
                return;
            }
            _updateTitleId = fileId;
        }
        this.cancel = function(fileId){
            if(!that.isHTML5Bool && that.swfPlayer){
                that.swfPlayer.cancel(fileId);
                return;
            }
            this.canceled = true;
            //function cb() {
                //uploadCanceled();
            //}
            if (this.completed) {
                that.deleteFile(fileId);
            } else {
                xhr.abort();
                //cb();
            }
            that.completed = false;
        }
        this.deleteFile = function(fileId){
            if(!that.isHTML5Bool && that.swfPlayer){
                that.swfPlayer.deleteFile(fileId);
            }
            that.completed = false;
            that.fireEvent(DELETE,{fileId:fileId});
        }
        this.deleteOnResult = function(){
             that.fireEvent(DELETE,{fileId:fileId});
        }
        this.commit = function(fileId){
            if(!that.isHTML5Bool && that.swfPlayer){
                that.swfPlayer.commit(fileId);
            } else {
                var qs = '?format=jsonp'+ ugcQueryString() +
                        '&uploadID='+_updateTitleId +
                        '&Submit=true' +
                        '&Title='+ _updateTitleName +
                        '&IsNoReview=' + ((typeof window.isNoaudituser != 'undefined') ? window.isNoaudituser : '0') + '&cb=jsonpCb.commitOnResult'; //IsNoReview: 0审核    1免审核（default=0）
                        // console.log(qs);
                requestUgc(commitUrl, qs);
            }
            that.completed = false;
        }
        this.commitOnResult = function(jdata){
            if (jdata.errorCode != undefined && jdata.errorCode == '0') {
                that.fireEvent(COMMIT,{fileId:_updateTitleId,title:_updateTitleName});
            } else {
                that.fireEvent(FAIL,{failCode:"1005",fileId:upload_id});
            }
        }
        var ugcQueryString = function(){
            var url = '&from=clt&token=' + _user_info.token.replace(/\+/g, '%2B') + '&cp=' + _user_info.cp;
            if(_username.length > 0)url += '&username='+_username;
            return url;
        }
        this.errorDebug = function(o){
            try{
                console.log("error"+o);
            } catch (X){}
        }
        this.bind = function(type,cb){
             if (typeof type === "string" && typeof cb === "function") {
                if (typeof that._listener[type] === "undefined") {
                    that._listener[type] = [cb];
                } else {
                    that._listener[type].push(cb);    
                }
            }
        }
        this.fireEvent = function(type,data){
            if (type && that._listener[type]) {
                for (var length = that._listener[type].length, start=0; start<length; start+=1) {
                    that._listener[type][start].call(that, data);
                }
            }
        }
        var fileSlice = function(){
           
            return sl;
        }
        this.init();
        var flashEvent = {
            onBindToJs : function(obj){
                try{
                    that.fireEvent(obj['type'],obj);
                    if(obj['type'] == 'start' && obj['fileName'] != 'undefined'){
                        that.fileName = encodeURIComponent(obj['fileName']);
                    }
                } catch(X){
                    //console.log(X);
                }
            }
        }
        window['jsonpCb'] = this;
        window['ppflash'] = flashEvent;
    }
    return ppuploader;
});