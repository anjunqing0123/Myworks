/*! 一唱成名 create by ErickSong */
/*
* @Author: WhiteWang
* @Date:   2015-08-13 15:16:44
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-10 17:46:01
*/
define("util/upload/VideoUploader", [ "core/jquery/1.8.3/jquery", "./ppVideoUpload", "../user/user", "client", "../cookie/cookie" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var PPUploader = require("./ppVideoUpload");
    var user = require("../user/user");
    var userName = user.info.UserName;
    var ppToken = user.info.token;
    var isHTML5 = false;
    if (window.File && window.FormData) {
        isHTML5 = true;
    }
    function VideoUploader(option) {
        var opt = $.extend({
            fileInput: "myFile",
            offset: {
                w: 0,
                h: 0,
                x: 0,
                y: 0
            },
            cp: "UGC",
            onMetaInfo: function() {},
            onCommit: function() {},
            onFinish: function() {},
            onFail: function() {},
            onUpdate: function() {},
            onStart: function() {}
        }, option || {});
        var error = {
            1: {
                errCode: 1,
                message: "视频为空，请选择视频文件"
            },
            2: {
                errCode: 2,
                message: "您选择的视频格式错误"
            },
            3: {
                errCode: 3,
                message: "您选择的视频尺寸太小，请重新选择！"
            },
            4: {
                errCode: 4,
                message: "文件大小超出（1G）无法上传！"
            },
            5: {
                errCode: 5,
                message: "未登录"
            },
            6: {
                errCode: 6,
                message: "上传网络出错，请刷新重试！"
            }
        };
        var _fileId = null;
        var _fileSize = 0;
        var _fileVal = "";
        var that = this;
        var vul = new PPUploader({
            token: ppToken,
            cp: opt.cp,
            username: userName,
            offset: {
                x: opt.offset.x,
                y: opt.offset.y,
                width: 0,
                height: 0
            },
            width: opt.offset.w,
            height: opt.offset.h,
            fileInput: opt.fileInput
        });
        function checkVideo() {
            var videoTypeArray = [ "mp4", "flv", "mkv", "avi", "rmvb", "3gp", "wmv", "asf", "mpg", "ts", "m2ts", "m4v", "mpeg", "rm", "vob", "mov", "qt", "3gp", "3g2", "f4v", "ogm", "mwt", "gxf" ];
            var t1 = _fileVal.lastIndexOf("\\");
            var t2 = _fileVal.lastIndexOf(".");
            var videoType = $.trim(_fileVal.slice(t2 + 1)).toLowerCase();
            var vType = -1;
            for (var i = 0; i < videoTypeArray.length; i++) {
                if (videoType === videoTypeArray[i]) {
                    vType = i;
                    break;
                }
            }
            if (vType < 0) {
                opt.onFail.call(that, error[2]);
                return false;
            }
            if (!isHTML5) {
                return true;
            }
            var _fileSizeHTML5 = _fileSize / 1024 / 1024;
            if (_fileSizeHTML5 <= 0) {
                opt.uploadFail(error[3]);
                return false;
            } else if (_fileSizeHTML5 > 1024) {
                opt.uploadFail(error[4]);
                return false;
            }
            return true;
        }
        function metaInfoCallback(evt) {
            _fileVal = evt.fileName;
            opt.onMetaInfo.call(that, evt);
        }
        function startCallback(evt) {
            // console.log(evt)
            _fileId = evt.fileId;
            if (checkVideo()) {
                opt.onStart.call(that, {
                    fileId: _fileId
                });
            } else {
                vul.cancel(_fileId);
                vul.deleteFile(_fileId);
            }
        }
        function progressUpdateCallback(evt) {
            if (evt.total / 1024 / 1024 > 1024 || evt.total <= 0) {
                vul.cancel(_fileId);
                vul.deleteFile(_fileId);
                if (evt.total <= 0) {
                    opt.onFail.call(that, error[3]);
                } else {
                    opt.onFail.call(that, error[4]);
                }
            } else {
                opt.onUpdate(evt.total, evt.uploaded);
            }
        }
        function finishCallback(evt) {
            _fileId = evt.fileId;
            opt.onFinish.call(that, {
                fileId: _fileId
            });
        }
        function failCallback(evt) {
            if (evt.failCode === "1006" || evt.failCode === "1001") {
                _fileId = evt.fileId;
                if (checkVideo()) {
                    opt.onStart.call(that, {
                        fileId: _fileId
                    });
                    opt.onUpdate.call(that, _fileSize, _fileSize);
                    opt.onFinish.call(that, {
                        fileId: _fileId
                    });
                } else {
                    vul.deleteFile(_fileId);
                }
            } else if (evt.failCode == "2004") {
                opt.onFail.call(that, error[4]);
            } else {
                opt.onFail.call(that, error[6]);
            }
        }
        function deleteCallback(evt) {}
        function commitCallback(evt) {
            if (!isHTML5) {
                _fileVal = null;
            }
            opt.onCommit.call(that, {
                fileId: _fileId
            });
        }
        vul.bind("metaInfo", metaInfoCallback);
        //仅flash模式下通过flash选取文件后返回
        vul.bind("start", startCallback);
        vul.bind("progressUpdate", progressUpdateCallback);
        vul.bind("finish", finishCallback);
        vul.bind("fail", failCallback);
        vul.bind("delete", deleteCallback);
        vul.bind("commit", commitCallback);
        this.isHTML5 = isHTML5;
        this.upload = function(file) {
            if (typeof userName === "undefined" || !userName) {
                opt.onFail.call(that, error[5]);
                return;
            }
            if (isHTML5) {
                if (!file) {
                    opt.onFail.call(that, error[1]);
                } else {
                    _fileSize = file.size;
                    _fileVal = file.name;
                    vul.upload(file);
                }
            } else {
                if (_fileVal) {
                    vul.upload(file);
                } else {
                    opt.onFail.call(that, error[1]);
                }
            }
        };
        this.commit = function(title) {
            vul.updateTitle(_fileId, title);
            vul.commit(_fileId);
        };
        this.cancel = function() {
            vul.cancel(_fileId);
        };
        this.completed = function(title) {
            this.commit(title);
        };
    }
    return VideoUploader;
});

/**
 * fileUpload
 *
 * author: pelexiang
 * copyright: pptv
 */
define("util/upload/ppVideoUpload", [], function(require, exports, module) {
    var ppuploader = function(options) {
        var that = this;
        var PROGRESS_UPDATE = "progressUpdate";
        var START = "start";
        var FINISH = "finish";
        var FAIL = "fail";
        var CANCEL = "cancel";
        var DELETE = "delete";
        var COMMIT = "commit";
        var uploadUrl = "http://ugc.upload.pptv.com/html5upload";
        var swfUrl = window.flashUploadSwf;
        //var swfUrl = "http://static9.pplive.cn/corporate/upload/";
        //var uploadUrl = "http://192.168.27.34:8080/ugc-upload/html5upload";
        //var jsonUrl = 'http://192.168.27.34:8080/ugc-service/init_upload';
        var jsonUrl = "http://ugc.api.pptv.com/init_upload";
        var deleteUrl = "http://ugc.api.pptv.com/video_delete";
        var commitUrl = "http://ugc.api.pptv.com/video_update";
        var upload_id = "";
        var swfCom;
        var isDelete = true;
        var _user_info;
        var _username = "";
        var prev_loaded = 0;
        var uploadSize = 0;
        var nextSize = 0;
        var _updateTitleName;
        var _updateTitleId;
        var _file, blob, fd, xhr;
        this.swfPlayer;
        this.canceled = false;
        this.completed = false;
        this.progressing = false;
        this.json_data;
        this.fileName = "";
        this.isHTML5Bool = false;
        this._listener = {};
        this.init = function() {
            _user_info = options;
            _file = document.getElementById(_user_info.fileInput);
            if (options.username != undefined) {
                _username = options.username;
            }
            if (!that.isHTML5()) {
                that.flashLoad();
            }
        };
        this.upload = function(file) {
            if (that.completed) {
                that.fireEvent(FAIL, {
                    failCode: "1001",
                    fileId: upload_id
                });
                return;
            }
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.upload();
                return;
            }
            if (file == null || file == undefined) {
                that.fireEvent(FAIL, {
                    failCode: "1002",
                    fileId: ""
                });
                return;
            }
            _file = file;
            this.progressing = false;
            var qs = "?format=jsonp" + ugcQueryString() + "&cb=jsonpCb.jsonpOnResult" + "&rnd=" + Math.random();
            requestUgc(jsonUrl, qs);
        };
        this.isHTML5 = function() {
            // return false;
            that.isHTML5Bool = false;
            if (window.File && window.FormData) {
                that.isHTML5Bool = true;
            }
            return that.isHTML5Bool;
        };
        this.flashLoad = function() {
            if (_file == null || _file == undefined) {
                that.fireEvent(FAIL, {
                    failCode: "1002",
                    fileId: ""
                });
                return;
            }
            swfCom = _file.parentNode;
            // swfCom.style.position = "relative";
            var ppSwf = document.createElement("div");
            ppSwf.id = "ppSwfPlayer";
            swfCom.appendChild(ppSwf);
            var vars = "external=ppflash&cp=" + _user_info.cp + "&token=" + encodeURIComponent(_user_info.token);
            if (_username.length > 0) vars += "&username=" + _username;
            var swfObject = {
                swfid: "ppSwfId",
                swfwmode: "transparent",
                movie: swfUrl,
                flashvars: vars
            };
            var swftxt = [ '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=10,0,0,0" width="100%" height="100%" id="' + swfObject.swfid + '" align="middle">', '<param name="allowScriptAccess" value="always" />', '<param name="allowFullScreen" value="false" />', '<param name="movie" value="' + swfObject.movie + '" />', '<param name="quality" value="high" />', '<param name="wmode" value="' + swfObject.swfwmode + '" /><param name="bgcolor" value="#000000" />', '<param name="flashvars" value="' + swfObject.flashvars + '">', '<embed src="' + swfObject.movie + '" flashvars="' + swfObject.flashvars + '" wmode="' + swfObject.swfwmode + '" backgroundcolor="#000000" quality="high" width="100%" height="100%" name="' + swfObject.swfid + '" align="middle" allowScriptAccess="always" allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />', "</object>" ].join("");
            //console.log(swftxt);
            var vx = 0, vy = 0, vw = 0, vh = 0, vWid, vHei;
            if (options.offset != undefined) {
                vx = options.offset.x != undefined ? options.offset.x : 0;
                vy = options.offset.y != undefined ? options.offset.y : 0;
                vw = options.offset.width != undefined ? options.offset.width : 0;
                vh = options.offset.height != undefined ? options.offset.height : 0;
                vWid = options.width != undefined ? options.width : 0;
                vHei = options.height != undefined ? options.height : 0;
            }
            ppSwf.style.position = "absolute";
            ppSwf.style.width = vWid + vw + "px";
            ppSwf.style.height = vHei + vh + "px";
            ppSwf.style.top = vy + "px";
            ppSwf.style.left = vx + "px";
            ppSwf.innerHTML = swftxt;
            that.swfPlayer = document.getElementById("ppSwfId");
        };
        var requestUgc = function(url, params, method, cb, error) {
            url += params;
            //console.log(url);
            if (method == "ajax") {
                ajaxLoad(url, cb);
            } else {
                jsonpLoad(url);
            }
        };
        var reUpload = function(i) {};
        var fileupload = function() {
            fd = new FormData();
            nextSize = uploadSize + 10 * 1024 * 1024;
            if (nextSize > _file.size) {
                nextSize = _file.size;
            }
            //console.log('uploadSize '+uploadSize +' ----- '+nextSize);
            if (_file.slice) {
                blob = _file.slice(uploadSize, nextSize);
            } else if (_file.webkitSlice) {
                blob = _file.webkitSlice(uploadSize, nextSize);
            } else if (_file.mozSlice) {
                blob = _file.mozSlice(uploadSize, nextSize);
            }
            var range = "bytes " + uploadSize + " - " + nextSize + "/" + _file.size;
            //console.log('range : ' + range)
            fd.append("fileToUpload", blob);
            xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", uploadProgress, false);
            xhr.addEventListener("load", uploadCompleted, false);
            xhr.addEventListener("error", uploadFailed, false);
            xhr.addEventListener("abort", uploadCanceled, false);
            var url = uploadUrl;
            var fileTime = new Date(_file.lastModifiedDate.toUTCString());
            url += "?format=json&filename=" + encodeURIComponent(_file.name) + ugcQueryString() + "&uploadid=" + upload_id + "&size=" + _file.size + "&type=" + encodeURIComponent(_file.type) + "&lastmodifiedtime=" + (_file.lastModifiedDate ? fileTime.getTime() : "");
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Range", range);
            xhr.send(fd);
        };
        var uploadProgress = function(evt) {
            if (evt.lengthComputable) {
                if (!that.progressing) {
                    that.progressing = true;
                    that.fileName = encodeURIComponent(_file.name);
                    that.fireEvent(START, {
                        obj: _user_info.fileInput,
                        fileId: upload_id,
                        mode: that.isHTML5Bool ? "html5" : "flash",
                        fileName: _file.name
                    });
                }
                var speed = evt.loaded - prev_loaded;
                var alreadySend = uploadSize + evt.loaded;
                var cbparam = {
                    fileId: upload_id,
                    uploaded: alreadySend,
                    total: _file.size
                };
                that.fireEvent(PROGRESS_UPDATE, cbparam);
                prev_loaded = evt.loaded;
            } else {}
        };
        var uploadCompleted = function() {
            uploadSize = nextSize;
            if (uploadSize < _file.size) {
                fileupload();
            } else {
                that.completed = true;
                that.progressing = false;
                that.fireEvent(FINISH, {
                    fileId: upload_id
                });
            }
        };
        var uploadFailed = function() {
            that.progressing = false;
            that.fireEvent(FAIL, {
                failCode: "1003",
                fileId: upload_id
            });
        };
        var uploadCanceled = function() {
            that.fireEvent(CANCEL, {
                fileId: upload_id
            });
        };
        var jsonpLoad = function(uri) {
            var script = document.createElement("script");
            script.setAttribute("src", uri);
            document.getElementsByTagName("head")[0].appendChild(script);
        };
        this.jsonpOnResult = function(jdata) {
            if (jdata.errorCode != undefined && jdata.errorCode == "0") {
                uploadUrl = jdata.result.html5UploadUrl;
                upload_id = jdata.result.uploadID;
                var dateTime = new Date(_file.lastModifiedDate.toUTCString());
                var qs = "?format=json&filename=" + encodeURIComponent(_file.name) + ugcQueryString() + "&uploadid=" + upload_id + "&size=" + _file.size + "&type=" + encodeURIComponent(_file.type) + "&lastmodifiedtime=" + (_file.lastModifiedDate ? dateTime.getTime() : "");
                requestUgc(uploadUrl, qs, "ajax", that.ajaxOnResult);
            } else {
                that.fireEvent(FAIL, {
                    failCode: "1004",
                    fileId: ""
                });
            }
        };
        var ajaxLoad = function(uri, callback) {
            var request = new XMLHttpRequest();
            request.open("GET", uri, true);
            request.send(null);
            request.onreadystatechange = that.ajaxOnResult;
        };
        this.ajaxOnResult = function(evt) {
            if (evt.currentTarget.readyState == 4 && (evt.currentTarget.status == 200 || evt.currentTarget.status == 0)) {
                //console.log(evt.currentTarget);
                //console.log(evt.currentTarget.responseText);
                that.json_data = JSON.parse(evt.currentTarget.responseText);
                if (that.json_data.size != undefined) {
                    uploadSize = that.json_data.size;
                    if (uploadSize >= _file.size) {
                        uploadSize = nextSize = _file.size;
                        that.fireEvent(FAIL, {
                            failCode: "1006",
                            fileId: upload_id
                        });
                    } else {
                        fileupload();
                    }
                }
            }
        };
        this.updateTitle = function(fileId, movieTitle) {
            _updateTitleName = movieTitle || that.fileName;
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.updateTitle({
                    fileId: fileId,
                    movieTitle: _updateTitleName
                });
                return;
            }
            _updateTitleId = fileId;
        };
        this.cancel = function(fileId) {
            if (!that.isHTML5Bool && that.swfPlayer) {
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
            }
            that.completed = false;
        };
        this.deleteFile = function(fileId) {
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.deleteFile(fileId);
            }
            that.completed = false;
            that.fireEvent(DELETE, {
                fileId: fileId
            });
        };
        this.deleteOnResult = function() {
            that.fireEvent(DELETE, {
                fileId: fileId
            });
        };
        this.commit = function(fileId) {
            if (!that.isHTML5Bool && that.swfPlayer) {
                that.swfPlayer.commit(fileId);
            } else {
                var qs = "?format=jsonp" + ugcQueryString() + "&uploadID=" + _updateTitleId + "&Submit=true" + "&Title=" + _updateTitleName + "&IsNoReview=" + (typeof window.isNoaudituser != "undefined" ? window.isNoaudituser : "0") + "&cb=jsonpCb.commitOnResult";
                //IsNoReview: 0审核    1免审核（default=0）
                // console.log(qs);
                requestUgc(commitUrl, qs);
            }
            that.completed = false;
        };
        this.commitOnResult = function(jdata) {
            if (jdata.errorCode != undefined && jdata.errorCode == "0") {
                that.fireEvent(COMMIT, {
                    fileId: _updateTitleId,
                    title: _updateTitleName
                });
            } else {
                that.fireEvent(FAIL, {
                    failCode: "1005",
                    fileId: upload_id
                });
            }
        };
        var ugcQueryString = function() {
            var url = "&from=clt&token=" + _user_info.token.replace(/\+/g, "%2B") + "&cp=" + _user_info.cp;
            if (_username.length > 0) url += "&username=" + _username;
            return url;
        };
        this.errorDebug = function(o) {
            try {
                console.log("error" + o);
            } catch (X) {}
        };
        this.bind = function(type, cb) {
            if (typeof type === "string" && typeof cb === "function") {
                if (typeof that._listener[type] === "undefined") {
                    that._listener[type] = [ cb ];
                } else {
                    that._listener[type].push(cb);
                }
            }
        };
        this.fireEvent = function(type, data) {
            if (type && that._listener[type]) {
                for (var length = that._listener[type].length, start = 0; start < length; start += 1) {
                    that._listener[type][start].call(that, data);
                }
            }
        };
        var fileSlice = function() {
            return sl;
        };
        this.init();
        var flashEvent = {
            onBindToJs: function(obj) {
                try {
                    that.fireEvent(obj["type"], obj);
                    if (obj["type"] == "start" && obj["fileName"] != "undefined") {
                        that.fileName = encodeURIComponent(obj["fileName"]);
                    }
                } catch (X) {}
            }
        };
        window["jsonpCb"] = this;
        window["ppflash"] = flashEvent;
    };
    return ppuploader;
});

/**
 *用户登陆请求和用户数据信息读取
 * mirongxu
 */
define("util/user/user", [ "core/jquery/1.8.3/jquery", "client", "util/cookie/cookie" ], function(require) {
    var jq = require("core/jquery/1.8.3/jquery"), clientCommon = require("client"), cookie = require("util/cookie/cookie"), encode = encodeURIComponent, infoKeys = [ "Gender", //性别
    "PpNum", //用户极点
    "ExpNum", //用户经验值
    "LevelName", //用户等级
    "NextLevelName", //下一等级名称
    "NextLevelExpNum", //下一等级相差经验值
    "Area", //省市
    "Subscribe", //用户一天的节目订阅数
    "UnreadNotes", //未读的小纸条数
    "HeadPic", //用户图像
    "Email", //用户Email
    "OnlineTime", //在线时间
    "Birthday", //生日
    "BlogAddress", //blog地址
    "Signed", //签名档
    "Type", //节目类型
    "Nickname", //昵称
    "isVip", //vip -> 0|1|2
    "VipDate", //vip过期日期
    "IsNoad", //去广告
    "NoadDate", //
    "IsSpdup", //加速
    "SpdupDate", "IsRtmp", //低延迟直播RTMP
    "RtmpDate", //
    "IsUgspeed", //UGS等级加速
    "UgspeedDate" ], domain = "pptv.com", path = "/", loginUrl = "http://passport.pptv.com/weblogin.do?";
    //登陆，退出defer
    var loginDefer = jq.Deferred(), logoutDefer = jq.Deferred(), loginPromise = jq.when(loginDefer), logoutPromise = jq.when(logoutDefer);
    function htmlEncode(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    // var clientCommon = window.clientCommon;
    var User = {
        /**
         * 用户信息对象
         */
        info: {},
        isLogined: false,
        /**
         * 读取用户cookie，并触发登陆或者退出
         */
        readInfo: function(notify) {
            //在UDI存在时，用UDI中的信息填充info
            //UDI若不存在，判断是否是客户端
            //  若不是客户端，代表没有登录，触发logout通知
            //  若是客户端，调用客户端接口判断是否登录
            //      若登录，从客户端中读取info信息，客户端中只能读到部分信息
            var udi = cookie.get("UDI");
            var ppname = cookie.get("PPName");
            if (udi == null || ppname == null) {
                if (isClient && clientCommon && clientCommon.userIsLogin()) {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    this.info["UserName"] = passport.userName;
                    this.info["Nickname"] = passport.nickName;
                    this.info["HeadPic"] = passport.facePictureURL;
                    this.info["isVip"] = passport.isVipUser;
                } else {
                    //触发logout通知
                    if (notify) {
                        this.logoutEvents.fire();
                        logoutDefer.resolve();
                    }
                    return this.info;
                }
            } else {
                // Java的URLEncode是把空格encode为加号，因此要先进行替换
                var infoList = udi.replace(/\+/g, "%20").replace(/\%/g, "%25").split("$");
                //把UDI字段拆分存放到info对象中
                for (var i = 0; i < infoList.length; i++) {
                    this.info[infoKeys[i]] = infoList[i];
                }
                this.info["Nickname"] = decodeURIComponent(this.info["Nickname"]);
                //把PPName字段信息拆分存放info对象中
                var nameList = ppname.split("$");
                this.info["UserName"] = decodeURIComponent(nameList[0]);
            }
            if (isClient && clientCommon && clientCommon.userIsLogin()) {
                this.info["token"] = external.GetObject("@pplive.com/passport;1").token;
            } else {
                this.info["token"] = cookie.get("ppToken");
            }
            this.isLogined = true;
            if (notify) {
                if (loginDefer.state() == "resolved" || loginDefer.state() == "pending") {
                    this.loginEvents.fire(this.info);
                }
                loginDefer.resolve(this.info);
            }
            return this.info;
        },
        /**
         * 登陆
         */
        login: function(name, password, callback) {
            var self = this;
            jq.ajax({
                url: loginUrl,
                dataType: "jsonp",
                jsonp: "cb",
                data: {
                    username: name,
                    password: password
                },
                success: function(statu, json) {
                    if (statu == 1) {
                        self._writeInfo(json);
                    }
                    callback(statu, self.info);
                    loginDefer.resolve(self.info);
                    self.loginEvents.fire(self.info);
                }
            });
            return this;
        },
        /**
         * 退出
         */
        logout: function() {
            if (isClient && clientCommon) {
                try {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    passport.Logout();
                } catch (e) {}
            }
            cookie.remove("PPKey", domain, path);
            cookie.remove("UDI", domain, path);
            cookie.remove("PPName", domain, path);
            cookie.remove("ppToken", domain, path);
            this.isLogined = false;
            logoutDefer.resolve();
            this.logoutEvents.fire();
            return this;
        },
        /**
         * 写入用户信息到pptv.com根域下
         */
        _writeInfo: function(data) {
            for (var i in data) {
                cookie.set(i, data[i], 7, domain, path);
            }
        },
        /**
         * 登陆事件回调
         */
        loginEvents: jq.Callbacks(),
        /**
         *退出事件回调
         */
        logoutEvents: jq.Callbacks(),
        /**
         * 登陆消息处理，并添加到登陆事件
         */
        onLogin: function(fn) {
            loginPromise.then(fn);
            this.loginEvents.add(fn);
            return this;
        },
        /**
         * 退出消息处理，并添加到退出事件
         */
        onLogout: function(fn) {
            logoutPromise.then(fn);
            this.logoutEvents.add(fn);
            return this;
        },
        //海沟计划之真实用户识别,针对有插用户发送diskid和name，设置白名单用户cookie标识
        white: function(flag) {
            var ppi = cookie.get("ppi");
            var self = this;
            var url = "http://tools.aplusapi.pptv.com/get_ppi";
            if (flag || !ppi) {
                var diskId;
                var defer = jq.Deferred();
                getDiskId();
                defer.then(function() {
                    var userName = null;
                    if (diskId !== undefined) {
                        url += "?b=" + encode(diskId);
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "&a=" + encode(userName);
                        }
                    } else {
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "?a=" + encode(userName);
                        }
                    }
                    window.wn = window.wn || function() {};
                    jq.ajax({
                        type: "GET",
                        url: url,
                        jsonp: "cb",
                        cache: true,
                        dataType: "jsonp",
                        contentType: "text/json; charset=utf-8",
                        jsonpCallback: "wn",
                        async: true,
                        success: function(data) {
                            if (data.ppi) {
                                cookie.set("ppi", data.ppi, 1, "pptv.com", "/");
                            }
                        },
                        complete: function(xhr, textStatus) {}
                    });
                });
            }
            //获取插件
            function getDiskId() {
                var obj;
                try {
                    if (navigator.userAgent.indexOf("IE") > -1) {
                        obj = new ActiveXObject("PPLive.Lite");
                        diskId = obj.getDiskID();
                    } else {
                        if (window.navigator.mimeTypes["application/x-pptv-plugin"]) {
                            var id = "PPTVPlayer_plugin_detect_" + +new Date();
                            var div = document.createElement("div");
                            div.style.cssText = "width:1px;height:1px;line-height:0px;font-size:0px;overflow:hidden;";
                            div.innerHTML = '<object width="1px" height="1px" id="' + id + '" type="application/x-pptv-plugin"><param value="false" name="enableupdate"><param value="false" name="enabledownload"><param name="type" value="2"/></object>';
                            document.body.appendChild(div);
                            obj = document.getElementById(id);
                            diskId = obj.getDiskID();
                        }
                    }
                    defer.resolve();
                } catch (e) {
                    jq.ajax({
                        type: "GET",
                        dataType: "jsonp",
                        jsonp: "cb",
                        jsonpCallback: "synacast_json",
                        cache: true,
                        url: "http://127.0.0.1:9000/synacast.json",
                        timeout: 1e3,
                        success: function(data) {
                            diskId = data.k;
                            defer.resolve();
                        },
                        error: function() {
                            defer.resolve();
                        }
                    });
                }
            }
        }
    };
    //脚本载入自动读取用户cookie,并触发消息通知
    User.readInfo(true);
    if (!isClient) {
        User.white();
        var FlashApi = window.player || window.PLAYER;
        //登录时白名单检查
        User.loginEvents.add(function() {
            User.white(true);
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                var UserInfo = {
                    ppToken: encode(cookie.get("ppToken")),
                    PPKey: encode(cookie.get("PPKey")),
                    PPName: encode(cookie.get("PPName")),
                    UDI: encode(cookie.get("UDI"))
                };
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: UserInfo
                    }
                });
            }
        });
        User.logoutEvents.add(function() {
            cookie.remove("ppi", "pptv.com", "/");
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: {}
                    }
                });
            }
        });
    }
    return User;
});

/**
 *cookie操作封装
 *mirongxu
 */
define("util/cookie/cookie", [], function(require) {
    var doc = document, MILLISECONDS_OF_DAY = 24 * 60 * 60 * 1e3, encode = encodeURIComponent, decode = decodeURIComponent;
    function isValidParamValue(val) {
        var t = typeof val;
        // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || t !== "object" && t !== "function";
    }
    function isNotEmptyString(val) {
        return isValidParamValue(val) && val !== "";
    }
    return {
        /**
         * Returns the cookie value for given name
         * @return {String} name The name of the cookie to retrieve
         */
        get: function(name) {
            var ret, m;
            if (isNotEmptyString(name)) {
                if (m = String(doc.cookie).match(new RegExp("(?:^| )" + name + "(?:(?:=([^;]*))|;|$)"))) {
                    ret = m[1] ? decode(m[1]) : "";
                }
            }
            return ret;
        },
        /**
         * Set a cookie with a given name and value
         * @param {String} name The name of the cookie to set
         * @param {String} val The value to set for cookie
         * @param {Number|Date} expires
         * if Number secified how many days this cookie will expire
         * @param {String} domain set cookie's domain
         * @param {String} path set cookie's path
         * @param {Boolean} secure whether this cookie can only be sent to server on https
         */
        set: function(name, val, expires, domain, path, secure) {
            var text = String(encode(val)), date = expires;
            // 从当前时间开始，多少天后过期
            if (typeof date === "number") {
                date = new Date();
                date.setTime(date.getTime() + expires * MILLISECONDS_OF_DAY);
            }
            // expiration date
            if (date instanceof Date) {
                if (expires === 0) {
                    text += ";";
                } else {
                    text += "; expires=" + date.toUTCString();
                }
            }
            // domain
            if (isNotEmptyString(domain)) {
                text += "; domain=" + domain;
            }
            // path
            if (isNotEmptyString(path)) {
                text += "; path=" + path;
            }
            // secure
            if (secure) {
                text += "; secure";
            }
            doc.cookie = name + "=" + text;
        },
        /**
         * Remove a cookie from the machine by setting its expiration date to sometime in the past
         * @param {String} name The name of the cookie to remove.
         * @param {String} domain The cookie's domain
         * @param {String} path The cookie's path
         * @param {String} secure The cookie's secure option
         */
        remove: function(name, domain, path, secure) {
            this.set(name, "", -1, domain, path, secure);
        }
    };
});
