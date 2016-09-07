/*! 一唱成名 create by ErickSong */
/*
* @Author: WhiteWang
* @Date:   2015-08-13 14:35:38
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-29 12:44:46
*/
define("app/pc/upload/upload", [ "core/jquery/1.8.3/jquery", "../../../util/upload/VideoUploader", "../../../util/upload/ppVideoUpload", "../../../util/user/user", "client", "../../../util/cookie/cookie", "../../../util/login/login", "../../../util/loader/loader", "../../../util/log/log", "../../../util/platform/plt", "../../../util/browser/browser", "../../../util/net/urlquery", "../../../util/linkcfg/interfaceurl", "../personcenter/dropdown", "../personcenter/mediator", "../../../util/scroller/scroller", "core/underscore/1.8.3/underscore", "../../../util/event/event-mouse-wheel", "../../../util/scroller/scroller.css", "../../../util/placeholder/placeholder" ], function(require, module, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), VideoUploader = require("../../../util/upload/VideoUploader"), login = require("../../../util/login/login"), Loader = require("../../../util/loader/loader"), api = require("../../../util/linkcfg/interfaceurl")["interface"], dropdownNormal = require("../personcenter/dropdown");
    require("../../../util/placeholder/placeholder")($);
    var errObj = {
        "1": "视频为空，请选择视频文件",
        "2": "视频格式错误",
        "3": "视频尺寸太小",
        "4": "文件大小超出（1G）无法上传！",
        "0": "未登录",
        "-1": "赛区id非法！当前赛区禁止上传视频，请更换赛区",
        "-2": "uploadid不存在",
        "-3": "时长超出限制",
        "-4": "保存失败",
        "-5": "title为空",
        "-6": "用户不能上传视频超过100个",
        "-7": "用户未报名"
    };
    var loadingBarWidth = 298;
    var $form = $("#videoUploadForm");
    var $fileInput = $("#fileInput");
    var $submitBtn = $("#submitBtn");
    var $nameInput = $("#nameInput");
    var $areaSelect = $("#areaSelect");
    var $textInput = $form.find(".video_list .textInput");
    var $loading = $("#loading-grid");
    var $loadingbar = $loading.find(".loadingbar span");
    var $loadingper = $loading.find(".loadingper");
    var $cancelbtn = $loading.find(".cancel-btn");
    var $clearBtn = $form.find(".ico_clear");
    var _file = null;
    var _songName = "";
    var _areaId = "";
    $nameInput.placeholder({
        customClass: "my-placeholder"
    });
    $textInput.placeholder({
        customClass: "my-placeholder"
    });
    dropdownNormal.create({
        container: $form.find(".drop-area"),
        dropIcon: ".curval,.dropdown-icon",
        dataOpt: "data-value"
    });
    var vUploader = new VideoUploader({
        fileInput: "fileInput",
        offset: {
            w: 68,
            h: 37,
            x: 0,
            y: 0
        },
        //插件的位置，对低版本浏览器，会创建一个flash插件，覆盖在input上
        onMetaInfo: function(data) {
            //flash选择文件以后，会返回文件相关信息
            $textInput.val(data.fileName);
        },
        onFail: function(data) {
            var errText = data.message;
            $form.find(".video_list .err_tip").html(errText).show();
            $textInput.addClass("err");
        },
        onStart: function(data) {
            $fileInput.parent().siblings(".textInput").removeClass("err").siblings(".err_tip").hide();
            $loadingbar.width(0);
            $loadingper.html("0%");
            $(".module-videoUpload .success_tip").hide();
            $loading.show();
        },
        onFinish: function(data) {
            var self = this;
            //必需隔一段时间调用commit；直接finish之后调用commit，flash选择下一个文件时会出错
            setTimeout(function() {
                self.completed(_songName);
            }, 100);
        },
        onCommit: function(data) {
            if (!this.isHTML5) {
                $textInput.val("");
            }
            Loader.load(api.uploadCommit + "/" + _areaId + "/" + data.fileId, {
                title: _songName
            }, function(d) {
                $loading.hide();
                if (d && d.status) {
                    if (d.status === "1") {
                        $(".module-videoUpload .success_tip").show();
                    } else {
                        alert(errObj[d.status]);
                    }
                } else {
                    alert("上传失败，请刷新页面重试");
                }
            }, function() {
                $loading.hide();
                alert("上传失败，请刷新页面重试");
            });
        },
        onUpdate: function(total, loaded) {
            var percent = parseInt(loaded * 100 / total);
            $loadingper.html(percent + "%");
            $loadingbar.width(percent / 100 * loadingBarWidth);
        }
    });
    function checkForm() {
        var ck = false;
        if (!_songName) {
            $form.find(".name_list .err_tip").html("请输入歌曲名称").show();
            $nameInput.addClass("err");
            ck = false;
        } else {
            $form.find(".name_list .err_tip").html("请输入歌曲名称").hide();
            $nameInput.removeClass("err");
            ck = true;
        }
        return ck;
    }
    $fileInput.on("change", function() {
        if (this.files) {
            _file = this.files.length === 0 ? null : this.files[0];
        }
        $textInput.val($fileInput.val());
    });
    $nameInput.on("focus", function() {
        $clearBtn.show();
    }).on("blur", function() {
        setTimeout(function() {
            $clearBtn.hide();
        }, 500);
    });
    $submitBtn.on("click", function(ev) {
        ev.preventDefault();
        if (!login.isLogined()) {
            login.init();
            return;
        }
        _songName = $nameInput.val();
        _areaId = $areaSelect.attr("data-value");
        if (checkForm()) {
            vUploader.upload(_file);
        }
    });
    $clearBtn.on("click", function() {
        $nameInput.val("");
    });
    $cancelbtn.on("click", function() {
        vUploader.cancel();
        $loading.fadeOut();
    });
    window.onerror = function(msg, url, l) {
        $textInput.val("");
        $form.find(".video_list .err_tip").html(errObj[1]).show();
    };
});

/*
* @Author: WhiteWang
* @Date:   2015-08-13 15:16:44
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-10 17:46:01
*/
define("util/upload/VideoUploader", [ "core/jquery/1.8.3/jquery", "util/upload/ppVideoUpload", "util/user/user", "client", "util/cookie/cookie" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var PPUploader = require("util/upload/ppVideoUpload");
    var user = require("util/user/user");
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

/**
 * @author  Erick Song
 * @email   ahschl0322@gmail.com
 * @info    通用login
 */
define("util/login/login", [ "core/jquery/1.8.3/jquery", "util/user/user", "client", "util/cookie/cookie" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), user = require("util/user/user"), cookie = require("util/cookie/cookie"), doc = document, ipadPlayer = function(s) {
        var videoPlayer = $("video");
        if (videoPlayer.length === 0) return;
        if (s == "hidden") {
            videoPlayer.each(function() {
                $(this).attr("_controls", $(this).attr("controls"));
                $(this).removeAttr("controls");
            });
        } else {
            videoPlayer.each(function() {
                $(this).attr("controls", $(this).attr("_controls"));
            });
        }
    };
    try {
        doc.domain = "pptv.com";
    } catch (err) {}
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    var clientCommon = window.clientCommon;
    if (isClient && clientCommon) {
        clientCommon.onLogin(function() {
            var sid = setInterval(function() {
                user.readInfo(true);
                clearInterval(sid);
            }, 1e3);
        });
        clientCommon.onLogout(function() {
            user.logout();
        });
    }
    var layer = function() {
        var self = this, now = +new Date(), _cssopts = {}, params = {
            type: "login"
        }, isLoged = !!(cookie.get("PPName") && cookie.get("UDI")) || false, size = "standard";
        var urls = {
            standard: "http://pub.aplus.pptv.com/wwwpub/weblogin/?tab=",
            mobile: "http://pub.aplus.pptv.com/phonepub/mobilogin/?tab=",
            mobile_web: "http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?tab=",
            mobile_web_nosns: "http://pub.aplus.pptv.com/wwwpub/weblogin/mobilelogin?sns=0",
            mini: "http://pub.aplus.pptv.com/wwwpub/minilogin/?tab=",
            tiny: "http://app.aplus.pptv.com/zt/2013/cwpd/plogin/?tab=",
            empty: "about:blank"
        };
        var wp_div = doc.createElement("div"), msk_div = doc.createElement("div"), btn_close = doc.createElement("span");
        wp_div.setAttribute("id", _cssopts.id);
        wp_div.setAttribute("class", "layer loginlayer");
        wp_div.id = "layer_" + now;
        btn_close.className = "layer_close";
        btn_close.innerHTML = "<a href='javascript:;' onclick='close_" + now + "()' class='close'></a>";
        wp_div.innerHTML = "<iframe id='iframe' src='" + urls.empty + "' style='overflow:visible;z-index:2' width='100%' height='100%'  scrolling='no' frameborder='0'></iframe>";
        btn_close.style.cssText = "position:absolute; right:15px; top:15px; width:20px; height:20px; text-align:center;background:url('http://static9.pplive.cn/pptv/index/v_201203081858/images/no.gif'); cursor:pointer";
        wp_div.appendChild(btn_close);
        var wp_width = "620", //$(wp_div).width(),
        wp_height = "498", //$(wp_div).height(),
        st = $(doc).scrollTop(), sl = $(doc).scrollLeft();
        _cssopts = {
            width: wp_width + "px",
            height: wp_height + "px",
            visibility: "hidden",
            position: "absolute",
            top: "50%",
            left: "50%",
            "margin-top": st - 450 / 2 + "px",
            "margin-left": sl - wp_width / 2 + "px",
            "z-index": 1e4
        };
        return {
            init: function(opts, cssopts) {
                doc.body.appendChild(wp_div);
                $(wp_div).css(_cssopts);
                //仅针对直播秀或iPad
                wp_div.style.cssText = "width:0; height:0;overflow:hidden";
                var iframe = $("#iframe");
                iframe.on("load", function() {
                    if (navigator.userAgent.indexOf("MSIE") > -1) {
                        $(this).height(430);
                    } else {
                        var doc = this.contentDocument;
                        $(this).height($(doc).find("body").height());
                    }
                });
                window["iframehide"] = function() {
                    var c = doc.getElementById("iframe");
                    wp_div.style.visibility = "hidden";
                    $(wp_div).css({
                        width: "0",
                        height: "0"
                    });
                    ipadPlayer("visible");
                };
                var isLogined = this.isLogined();
                if (isLogined) {
                    user.readInfo(true);
                    return;
                }
                params = $.extend(params, opts);
                if (isClient && clientCommon) {
                    if (params.type == "login") {
                        clientCommon.showLoginBox();
                    } else if (params.type == "reg") {
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
                if (iframe.length > 0) {
                    if (params.hasOwnProperty("size")) {
                        size = params["size"];
                    }
                    iframe[0].src = urls[size] + params.type + "&from=" + params.from + "&app=" + params.app + (params.tip ? "&tip=" + params.tip : "");
                    // + '&r=' + Math.random();
                    _cssopts["margin-top"] = st - 450 / 2 + "px";
                    _cssopts["margin-left"] = sl - wp_width / 2 + "px";
                    _cssopts = cssopts ? $.extend(_cssopts, cssopts) : _cssopts;
                    if (size == "mobile_web" || size == "mobile_web_nosns") {
                        _cssopts["margin-top"] = "0px";
                        _cssopts["margin-left"] = "0px";
                        _cssopts["top"] = (document.body.scrollTop || document.documentElement.scrollTop) + "px";
                        _cssopts["left"] = "0px";
                        _cssopts["width"] = "100%";
                        _cssopts["height"] = "100%";
                        _cssopts["overflow"] = "auto";
                        $(wp_div).find(".layer_close").hide();
                    }
                    $(wp_div).css(_cssopts);
                    iframe.parent().css("visibility", "visible");
                    ipadPlayer("hidden");
                }
                btn_close.onclick = function() {
                    wp_div.style.visibility = "hidden";
                    $(wp_div).css({
                        width: "0",
                        height: "0"
                    });
                    if (window.CustomListDialog) {
                        CustomListDialog.close();
                    }
                    ipadPlayer("visible");
                };
            },
            success: {},
            isLogined: function() {
                if (isClient && clientCommon) {
                    //客户端
                    return clientCommon.userIsLogin();
                } else {
                    return !!(cookie.get("PPName") && cookie.get("UDI"));
                }
            },
            show: function(params) {},
            hide: function() {
                doc.body.removeChild(wp_div);
            },
            check: function(callback, params, cssobj) {
                var isLogined = this.isLogined();
                if (params) {
                    if (params.from) {
                        this.success[params.from] = callback;
                    }
                    if (params.size in urls) {
                        size = params.size;
                    }
                }
                if (isLogined) {
                    if (callback && typeof callback == "function") {
                        callback();
                    }
                } else {
                    this.init(params, cssobj);
                }
            },
            logout: function(callback) {
                if (callback && typeof callback == "function") {
                    user.onLogout(callback);
                } else {
                    user.logout();
                }
            },
            onSuccess: function(arg, from) {
                user.readInfo(true);
                //触发登录
                if (arg == "success" && this.success[from]) {
                    this.check(this.success[from]);
                }
            }
        };
    }();
    return layer;
});

/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    loader - 加载器

 * Loader.load('url', params, sucessCallback, errorcallback, beforeSend, scope);

 * Loader.load('ordersvc/v1/getLastNews.json?', {
 *     type : 'hoster',
 *     roomid : webcfg.roomid,
 *     limit : 20,
 *     __config__ : {
 *        cache : true,
 *        callback : 'getCallback'
 *     }
 * }, function(d){
 *     if(d && d.err === 0 && d.data){
 *        GIftRender($('#gift ul'), d.data);
 *    }
 * });
 *
 */
define("util/loader/loader", [ "core/jquery/1.8.3/jquery", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var log = require("util/log/log");
    var loaderParams = require("util/platform/plt");
    var Loader = {}, N = 0;
    function load(url, params, callback, errorcallback, beforecallback, scope) {
        log("Loader load====", url, params);
        var sevurl = url, _config = {}, _cdn, prefix = "pplive_callback_", callbackName = "", beforeCallback = beforecallback || $.noop, errorCallback = typeof errorcallback == "function" ? errorcallback : $.noop, opts = {
            from: "chang",
            version: "2.1.0",
            format: "jsonp"
        };
        params = $.extend(opts, loaderParams, params);
        if (params.__config__) {
            _config = params.__config__;
            delete params.__config__;
        }
        _cdn = _config.cache === true || _config.cdn === true && _config.callback ? true : false;
        sevurl = sevurl.indexOf("?") > -1 ? sevurl + "&" : sevurl + "?";
        sevurl += $.param(params);
        sevurl = sevurl.replace(/&&/, "&").replace(/\?\?/, "?");
        if (sevurl.match(/cb=.*/i)) {
            callbackName = /cb=(.*?(?=&)|.*)/.exec(sevurl)[1];
            sevurl = sevurl.replace(/(.*)?(cb=.*?\&+)/, "$1");
        } else {
            callbackName = _cdn ? _config.callback : prefix + N++;
        }
        $.ajax({
            dataType: "jsonp",
            type: "GET",
            cache: _config.cache === 0 ? false : true,
            url: sevurl,
            jsonp: "cb",
            jsonpCallback: function() {
                return callbackName;
            },
            beforeSend: function(XMLHttpRequest) {
                beforeCallback();
            },
            success: function(data) {
                _config = null;
                if (callback && typeof callback == "function") {
                    callback.apply(scope, arguments);
                }
            },
            timeout: 1e4,
            statusCode: {
                404: function() {
                    errorCallback();
                },
                500: function() {
                    errorCallback();
                },
                502: function() {
                    errorCallback();
                },
                504: function() {
                    errorCallback();
                },
                510: function() {
                    errorCallback();
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                log("Ajax Load error: ", sevurl, XMLHttpRequest, textStatus, errorThrown);
                errorCallback();
            }
        });
    }
    function ajax(option) {
        var opt = $.extend({
            type: "GET",
            dataType: "jsonp",
            cache: true,
            jsonp: "cb",
            success: function() {},
            error: function() {}
        }, loaderParams, option);
        var success = opt.success;
        opt.success = function(data) {
            if (!data.err) {
                success(data);
            } else {}
        };
        return $.ajax(opt);
    }
    Loader = {
        load: load,
        ajax: ajax
    };
    module.exports = Loader;
});

/**
 * @author  Erick Song
 * @date    2012-08-22
 * @email   ahschl0322@gmail.com
 * @info    console.log moudle
 *
 * 2014-03-20   增加sendLog方法发送错误日志
 *
 */
define("util/log/log", [], function(require) {
    var logdiv, logstr = "", doc = document, curl = window.location.href, encode = encodeURIComponent, isDebug = window.DEBUG || curl.slice(-4) === "-deb" ? true : false;
    var pe = {
        serviceUrl: "http://web.data.pplive.com/pe/1.html?",
        newImg: new Image(),
        adr: curl,
        sadr: "log",
        et: "js",
        n: "ERROR_"
    };
    var sendLog = function(e, prefix) {
        prefix = prefix || "default";
        pe.newImg.src = pe.serviceUrl + "et=" + pe.et + "&adr=" + encode(pe.adr) + "&sadr=" + encode(pe.sadr) + "&n=" + encode(pe.n + prefix + "_" + (e.message || e));
    };
    if (!window.console) {
        window.console = {};
        window.console.log = function() {
            return;
        };
    }
    //log
    window.log = function() {
        if (isDebug && this.console) {
            console.log(date2str(new Date(), "hh:mm:ss"), [].slice.call(arguments));
        }
    };
    log.sendLog = sendLog;
    if (isDebug) {
        log.sendLog = function() {};
    }
    //firelite + log
    if (curl.indexOf("firelite=1") > -1) {
        var a = doc.createElement("A");
        a.href = 'javascript:if(!window.firebug){window.firebug=document.createElement("script");firebug.setAttribute("src","http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js");document.body.appendChild(firebug);(function(){if(window.firebug.version){firebug.init()}else{setTimeout(arguments.callee)}})();void (firebug);if(window.log){(function(){if(window.firebug&&window.firebug.version){for(var a=0;a<log.history.length;a++){console.log(log.history[a])}}else{setTimeout(arguments.callee,100)}})()}};';
        a.style.cssText = "position:absolute;right:0;top:0;color:#000;font-size:12px;border:1px solid #f00";
        a.innerHTML = "Filelite + Log";
        doc.body.appendChild(a);
    }
    /*else if(curl.indexOf('log=1') > -1){
        for(var i = 0, l = arguments.length; i < l; i ++){ logstr += arguments[i] + " ## " ;}
        if(typeof(logdiv) == 'undefined'){
            logdiv = doc.createElement('div');
            logdiv.style.cssText = 'position:absolute;left:0;bottom:0;width:400px;height:200px;overflow:hidden;overflow-y:auto;border:1px solid #f00;z-index:10000;background:#ccc';
            doc.body.appendChild(logdiv);
        }
        logdiv.innerHTML += logstr + '<br />';
    }else{}*/
    function date2str(x, y) {
        var z = {
            M: x.getMonth() + 1,
            d: x.getDate(),
            h: x.getHours(),
            m: x.getMinutes(),
            s: x.getSeconds()
        };
        y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
            return ((v.length > 1 ? "0" : "") + eval("z." + v.slice(-1))).slice(-2);
        });
        return y.replace(/(y+)/g, function(v) {
            return x.getFullYear().toString().slice(-v.length);
        });
    }
    return log;
});

/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    返回三个维度信息
 *
 * 平台 - 网站|客户端|多终端
 * plt = pc|clt|mut
 *
 * 系统平台
 * platform = mobile|ipad|web|clt
 *
 * 浏览器信息
 * device = ie|moz|chrome|safari|opear|weixin|iphone|ipad|android|winphone
 *
 */
define("util/platform/plt", [ "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var browser = require("util/browser/browser");
    var query = require("util/net/urlquery");
    var params = {};
    var SPLITCHAT = {
        plt: [ "WEB", "CLT", "MUT" ],
        platform: [ "IPAD", "MOBILE", "WEB", "CLT" ],
        device: [ "IE", "MOZ", "CHROME", "SAFARI", "OPERA", "WEIXIN", "IPHONE", "IPAD", "ANDROID", "ITOUCH", "WINPHONE" ]
    };
    for (var key in SPLITCHAT) {
        for (var k = 0, lenk = SPLITCHAT[key].length; k < lenk; k++) {
            var mapKey = SPLITCHAT[key][k];
            if (browser[mapKey]) {
                params[key] = mapKey.toLowerCase();
                break;
            }
        }
    }
    //merge if the key in params
    for (var i in query) {
        if (params[i]) params[i] = query[i];
    }
    return params;
});

/**
 * @author: xuxin | seanxu@pptv.com
 * @Date: 13-7-18
 * @history
 */
define("util/browser/browser", [], function(require, exports, module) {
    var ua = navigator.userAgent.toLowerCase();
    var external = window.external || "";
    var core, m, extra, version, os;
    var isMobile = function() {
        var check = false;
        (function(a, b) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                check = true;
            }
        })(navigator.userAgent || navigator.vendor || window.opera);
        check = ua.match(/(iphone|ipod|android|ipad|blackberry|webos|windows phone)/i) ? true : false;
        return check;
    }();
    var numberify = function(s) {
        var c = 0;
        return parseFloat(s.replace(/\./g, function() {
            return c++ == 1 ? "" : ".";
        }));
    };
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    try {
        if (/windows|win32/i.test(ua)) {
            os = "windows";
        } else if (/macintosh/i.test(ua)) {
            os = "macintosh";
        } else if (/rhino/i.test(ua)) {
            os = "rhino";
        }
        if ((m = ua.match(/applewebkit\/([^\s]*)/)) && m[1]) {
            core = "webkit";
            version = numberify(m[1]);
        } else if ((m = ua.match(/presto\/([\d.]*)/)) && m[1]) {
            core = "presto";
            version = numberify(m[1]);
        } else if (m = ua.match(/msie\s([^;]*)/)) {
            core = "trident";
            version = 1;
            if ((m = ua.match(/trident\/([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        } else if (/gecko/.test(ua)) {
            core = "gecko";
            version = 1;
            if ((m = ua.match(/rv:([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        }
        if (/world/.test(ua)) {
            extra = "world";
        } else if (/360se/.test(ua)) {
            extra = "360";
        } else if (/maxthon/.test(ua) || typeof external.max_version == "number") {
            extra = "maxthon";
        } else if (/tencenttraveler\s([\d.]*)/.test(ua)) {
            extra = "tt";
        } else if (/se\s([\d.]*)/.test(ua)) {
            extra = "sogou";
        }
    } catch (e) {}
    var ret = {
        OS: os,
        CORE: core,
        Version: version,
        EXTRA: extra ? extra : false,
        IE: /msie/.test(ua) || /trident/.test(ua) && /rv[:\s]\d+/.test(ua),
        OPERA: /opera/.test(ua),
        MOZ: /gecko/.test(ua) && !/(compatible|webkit)/.test(ua),
        IE5: /msie 5 /.test(ua),
        IE55: /msie 5.5/.test(ua),
        IE6: /msie 6/.test(ua),
        IE7: /msie 7/.test(ua),
        IE8: /msie 8/.test(ua),
        IE9: /msie 9/.test(ua),
        SAFARI: !/chrome\/([\d.]*)/.test(ua) && /\/([\da-f.]*) safari/.test(ua),
        CHROME: /chrome\/([\d.]*)/.test(ua),
        //!!window["chrome"]
        IPAD: /\(ipad/i.test(ua),
        IPHONE: /\(iphone/i.test(ua),
        ITOUCH: /\(itouch/i.test(ua),
        ANDROID: /android|htc/i.test(ua) || /linux/i.test(ua.platform + ""),
        IOS: /iPhone|iPad|iPod|iOS/i.test(ua),
        MOBILE: isMobile,
        WEIXIN: /micromessenger/i.test(ua),
        WINPHONE: /windows phone/i.test(ua),
        WEB: !/iPhone|iPad|iPod|iOS/i.test(ua) && !/android|htc/i.test(ua) && !/windows phone/i.test(ua),
        CLT: isClient
    };
    ret["MUT"] = !ret.WEB && !ret.CLIENT;
    return ret;
});

/**
 * 获取url参数，返回一个对象
 */
define("util/net/urlquery", [], function(require) {
    var queryStr = window.location.search;
    if (queryStr.indexOf("?") === 0 || queryStr.indexOf("#") === 0) {
        queryStr = queryStr.substring(1, queryStr.length);
    }
    var queryObj = {};
    var tt = queryStr.split("&");
    for (var i in tt) {
        var ss = typeof tt[i] == "string" ? tt[i].split("=") : [];
        if (ss.length == 2) {
            queryObj[ss[0]] = decodeURIComponent(ss[1]);
        }
    }
    return queryObj;
});

define("util/linkcfg/interfaceurl", [], function(require, exports) {
    var client_suffix = "?plt=clt";
    var redirectiUrl = {
        registration: "http://chang.pptv.com/pc/registration",
        registrationComplete: "http://chang.pptv.com/pc/registration/pg_complete",
        usercenter: "http://passport.pptv.com/usercenter.aspx",
        oneSingTab: "http://passport.pptv.com/v2/profile/yichangchengming.jsp",
        upload: "http://chang.pptv.com/pc/upload",
        contract_client: "http://w2c.pptv.com/p/zt.chang.pptv.com/news/protocol/17551401.html",
        contract_pc: "http://zt.chang.pptv.com/news/protocol/17551401.html"
    };
    // chackSign 确认是否报名
    var interfaceUrl = {
        checkSign: "http://api.chang.pptv.com/api/checksign",
        phonetoken: "http://api.chang.pptv.com/api/phonetoken",
        sign: "http://api.chang.pptv.com/api/sign",
        voteCollection: "http://api.cdn.vote.pptv.com/vote/collection",
        videoRank: "http://chang.pptv.com/api/video_rank",
        gettreadmill: "http://api.cdn.chang.pptv.com/api/gettreadmill",
        speed: "http://chang.pptv.com/api/speed",
        singList: "http://api.cdn.chang.pptv.com/api/singList",
        uploadCommit: "http://api.chang.pptv.com/api/cimmit_video",
        tagMarquee: "http://chang.pptv.com/api/rank_list",
        PKList_pc: "http://api.cdn.chang.pptv.com/api/PKList_pc",
        reward: "http://chang.pptv.com/api/reward",
        videoList: "http://chang.pptv.com/api/video_list",
        pklistAll: "http://chang.pptv.com/api/pk",
        concertAll: "http://chang.pptv.com/api/concert",
        goldlist: "http://chang.pptv.com/api/sprint_players",
        matchResult: "http://chang.pptv.com/api/match_result",
        goldExtra: "http://chang.pptv.com/api/pg_sprint_players_extra"
    };
    var commonUrl = {
        pc: {
            player: "http://chang.pptv.com/pc/player/",
            suffix: ""
        },
        clt: {
            player: "http://chang.pptv.com/pc/player/",
            suffix: "plt=clt"
        },
        app: {
            player: "http://chang.pptv.com/app/player/",
            suffix: "type=app"
        },
        h5: {
            player: "http://chang.pptv.com/app/player/",
            suffix: "type=share"
        },
        ipad: {
            player: "http://chang.pptv.com/ipad/player/",
            suffix: "type=app"
        }
    };
    return {
        redirect: redirectiUrl,
        "interface": interfaceUrl,
        commonUrl: commonUrl
    };
});

define("app/pc/personcenter/dropdown", [ "core/jquery/1.8.3/jquery", "app/pc/personcenter/mediator", "util/scroller/scroller", "core/underscore/1.8.3/underscore", "util/event/event-mouse-wheel" ], function(require, module, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    var mediator = require("app/pc/personcenter/mediator");
    mediator.installTo(dropdown.prototype);
    require("util/scroller/scroller");
    //ie6 bug fix
    var IE6 = !window.XMLHttpRequest;
    function dropdown(options) {
        var defaults = {
            container: ".input-dropdown",
            dropIcon: ".dropdown-icon",
            expandWrap: ".dropdown-expand",
            selectItem: "li",
            activeClass: "active",
            hoverClass: "hover-active",
            curval: ".curval",
            maxHeight: "300",
            dataOpt: "",
            animate: true
        };
        this.opt = $.extend({}, defaults, options);
        this.container = $(this.opt.container);
        this.dropIcon = this.container.find(this.opt.dropIcon);
        this.expandWrap = this.container.find(this.opt.expandWrap);
        this.curval = this.container.find(this.opt.curval);
        this.curIndex = 0;
        // 关联下一个dropdown
        this.nextDropdown = null;
        // 关联前一个dropdown
        this.prevDropdown = null;
        this.scroller = null;
        this.isopen = false;
        var doc = $(document);
        var self = this;
        this.on("open", function() {
            //todo
            var tempNextDropDown = this.nextDropdown;
            while (!!tempNextDropDown) {
                tempNextDropDown.trigger("hide");
                tempNextDropDown = tempNextDropDown.nextDropdown;
            }
            var tempPrevDropDown = this.prevDropdown;
            while (!!tempPrevDropDown) {
                tempPrevDropDown.trigger("hide");
                tempPrevDropDown = tempPrevDropDown.prevDropdown;
            }
            //重置hover的状态
            self.expandWrap.find("." + self.opt.hoverClass).removeClass(self.opt.hoverClass);
            self.show();
            self.isopen = true;
            doc.on("click.dropdown", function(e) {
                var target = $(e.target);
                var tempClass = self.opt.container;
                if (typeof tempClass == "object") {
                    tempClass = defaults.container;
                }
                if (target.parents(tempClass).length == 0) {
                    self.trigger("hide");
                    doc.off("click.dropdown");
                }
            });
        });
        this.on("hide", function() {
            self.hide();
            self.isopen = false;
            doc.off("click.dropdown");
        });
        this.container.on("click", this.opt.dropIcon, function(e) {
            self.isopen ? self.trigger("hide") : self.trigger("open");
        });
        this.on("reset", function(searchVal) {
            self.reset(searchVal);
        });
        this.container.on("click", this.opt.selectItem, function() {
            var obj = $(this);
            var searchVal = obj.html();
            var activeClass = self.opt.activeClass;
            var tempIndex = obj.index();
            if (self.curIndex == tempIndex) {
                self.trigger("hide");
                return false;
            }
            self.curIndex = tempIndex;
            obj.siblings().removeClass(activeClass);
            obj.addClass(activeClass);
            self.trigger("hide");
            self.curval.html(searchVal);
            self.curval.attr("title", searchVal);
            var dataOpt = self.opt.dataOpt;
            if (dataOpt) {
                self.curval.attr(dataOpt, obj.attr(dataOpt));
            }
            self.request("afterSelect", searchVal);
            self.nextDropdown && self.nextDropdown.trigger("reset", searchVal);
        });
        this.container.on("mouseenter", this.opt.selectItem, function(e) {
            var obj = $(this);
            var activeClass = self.opt.hoverClass;
            obj.siblings().removeClass(activeClass);
            obj.addClass(activeClass);
        });
    }
    $.extend(dropdown.prototype, {
        show: function() {
            var option = {
                wheelPixel: 5,
                maxHeight: this.opt.maxHeight,
                horizontal: false,
                autoWrap: false
            };
            if (!this.opt.animate) {
                this.expandWrap.stop(true, true);
                this.expandWrap.css({
                    visibility: "hidden",
                    display: "block"
                });
                var tempHeight = this.expandWrap.find("ul").height();
                if (this.scroller == null && tempHeight > this.opt.maxHeight) {
                    this.scroller = this.expandWrap.ppScroller(option).scroll();
                    var items = this.expandWrap.find(this.opt.selectItem);
                    this.scroller.scrollTo(items.eq(this.curIndex).position().top);
                }
                this.expandWrap.css({
                    visibility: "visible",
                    display: "block"
                });
            } else {
                this.expandWrap.stop(true, true);
                this.expandWrap.css({
                    visibility: "hidden",
                    display: "block"
                });
                var tempHeight = this.expandWrap.find("ul").height();
                if (this.scroller == null && tempHeight > this.opt.maxHeight) {
                    this.scroller = this.expandWrap.ppScroller(option).scroll();
                    var items = this.expandWrap.find(this.opt.selectItem);
                    this.scroller.scrollTo(items.eq(this.curIndex).position().top);
                }
                this.expandWrap.css({
                    visibility: "visible",
                    display: "none"
                });
                this.expandWrap.fadeIn();
            }
        },
        hide: function() {
            var self = this;
            if (!this.opt.animate) {
                this.expandWrap.addClass("hidden");
            } else {
                this.expandWrap.stop(true, true).fadeOut();
            }
        },
        reset: function(searchVal) {
            //模板需要优化
            var searchList = [];
            var tempPrev = this.prevDropdown;
            while (tempPrev != null) {
                searchList.unshift(tempPrev.curval.html());
                tempPrev = tempPrev.prevDropdown;
            }
            this.empty();
            var tempHtml = "<ul>";
            var tempCount = 0;
            this.curIndex = 0;
            !!this.scroller && !this.scroller.destory();
            this.scroller = null;
            if (searchList.length == 0) {
                //第一个tab
                var tempVal = this.curval.html();
                for (key in this.opt.groupDataArr) {
                    if (tempVal == "" && tempCount == 0) {
                        tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                        this.curval.html(key);
                        this.curval.attr("title", key);
                    } else {
                        if (tempVal == key) {
                            tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                            this.curval.html(key);
                            this.curval.attr("title", key);
                            //console.log('count',tempCount);
                            this.curIndex = tempCount;
                        } else {
                            tempHtml += "<li>" + key + "</li>";
                        }
                    }
                    tempCount++;
                }
                tempHtml += "</ul>";
                this.expandWrap.html(tempHtml);
            } else {
                var finalval = this.opt.groupDataArr;
                for (var i = 0; i < searchList.length; i++) {
                    finalval = finalval[searchList[i]];
                }
                if ($.isArray(finalval)) {
                    //判断生日类型
                    var isSpec = false;
                    if (searchList[1] == "02") {
                        var validateVal = searchList[0];
                        if (validateVal % 4 == 0 && validateVal % 100 != 0 || validateVal % 400 == 0) {
                            isSpec = true;
                        }
                    }
                    for (var i = 0; i < finalval.length; i++) {
                        if (i == 0) {
                            tempHtml += '<li class="' + this.opt.activeClass + '">' + finalval[i] + "</li>";
                            this.curval.html(finalval[i]);
                            this.curval.attr("title", finalval[i]);
                        } else {
                            tempHtml += "<li>" + finalval[i] + "</li>";
                        }
                    }
                    if (isSpec) {
                        tempHtml += "<li>" + 29 + "</li>";
                    }
                    tempHtml += "</ul>";
                    this.expandWrap.html(tempHtml);
                    if (this.container.hasClass("hidden")) {
                        this.container.removeClass("hidden");
                    }
                } else if (typeof finalval == "undefined") {
                    tempHtml += "</ul>";
                    this.curval.html("");
                    this.curval.removeAttr("title");
                    this.container.addClass("hidden");
                } else {
                    var isNum = false;
                    for (var key in finalval) {
                        if (!isNaN(parseInt(key))) {
                            isNum = true;
                            break;
                        }
                    }
                    if (!isNum) {
                        for (var key in finalval) {
                            if (tempCount == 0) {
                                tempHtml += '<li class="' + this.opt.activeClass + '">' + key + "</li>";
                                this.curval.html(key);
                                this.curval.attr("title", key);
                            } else {
                                tempHtml += "<li>" + key + "</li>";
                            }
                            tempCount++;
                        }
                    } else {
                        var resultArr = [];
                        for (var key in finalval) {
                            resultArr.push(key);
                        }
                        resultArr.sort(function(a, b) {
                            return parseInt(a, 10) - parseInt(b, 10);
                        });
                        for (var i = 0; i < resultArr.length; i++) {
                            if (i == 0) {
                                tempHtml += '<li class="' + this.opt.activeClass + '">' + resultArr[i] + "</li>";
                                this.curval.html(resultArr[i]);
                                this.curval.attr("title", resultArr[i]);
                            } else {
                                tempHtml += "<li>" + resultArr[i] + "</li>";
                            }
                        }
                    }
                    tempHtml += "</ul>";
                    this.expandWrap.html(tempHtml);
                    if (this.container.hasClass("hidden")) {
                        this.container.removeClass("hidden");
                    }
                }
            }
            if (!!IE6) {
                var containerWidth = this.container.width();
                if (this.expandWrap.width() < containerWidth) {
                    this.expandWrap.width(containerWidth);
                }
            }
            if (this.nextDropdown != null) {
                this.nextDropdown.reset();
            }
        },
        empty: function() {
            this.expandWrap.html("");
        },
        request: function(type) {
            if (typeof this.opt[type] == "function") {
                this.opt[type].apply(this, arguments);
            }
        }
    });
    return {
        create: function(options) {
            return new dropdown(options);
        }
    };
});

define("app/pc/personcenter/mediator", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), slice = [].slice, separator = /\s+/, protos;
    // 根据条件过滤出事件handlers.
    function findHandlers(arr, name, callback, context) {
        return $.grep(arr, function(handler) {
            return handler && (!name || handler.e === name) && (!callback || handler.cb === callback || handler.cb._cb === callback) && (!context || handler.ctx === context);
        });
    }
    function eachEvent(events, callback, iterator) {
        // 不支持对象，只支持多个event用空格隔开
        $.each((events || "").split(separator), function(_, key) {
            iterator(key, callback);
        });
    }
    function triggerHanders(events, args) {
        var stoped = false, i = -1, len = events.length, handler;
        while (++i < len) {
            handler = events[i];
            if (handler.cb.apply(handler.ctx2, args) === false) {
                stoped = true;
                break;
            }
        }
        return !stoped;
    }
    protos = {
        on: function(name, callback, context) {
            var me = this, set;
            if (!callback) {
                return this;
            }
            set = this._events || (this._events = []);
            eachEvent(name, callback, function(name, callback) {
                var handler = {
                    e: name
                };
                handler.cb = callback;
                handler.ctx = context;
                handler.ctx2 = context || me;
                handler.id = set.length;
                set.push(handler);
            });
            return this;
        },
        once: function(name, callback, context) {
            var me = this;
            if (!callback) {
                return me;
            }
            eachEvent(name, callback, function(name, callback) {
                var once = function() {
                    me.off(name, once);
                    return callback.apply(context || me, arguments);
                };
                once._cb = callback;
                me.on(name, once, context);
            });
            return me;
        },
        off: function(name, cb, ctx) {
            var events = this._events;
            if (!events) {
                return this;
            }
            if (!name && !cb && !ctx) {
                this._events = [];
                return this;
            }
            eachEvent(name, cb, function(name, cb) {
                $.each(findHandlers(events, name, cb, ctx), function() {
                    delete events[this.id];
                });
            });
            return this;
        },
        trigger: function(type) {
            var args, events, allEvents;
            if (!this._events || !type) {
                return this;
            }
            args = slice.call(arguments, 1);
            events = findHandlers(this._events, type);
            allEvents = findHandlers(this._events, "all");
            return triggerHanders(events, args) && triggerHanders(allEvents, arguments);
        }
    };
    return $.extend({
        installTo: function(obj) {
            return $.extend(obj, protos);
        }
    }, protos);
});

/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *     $('#selecter').ppScroll().scroll();
 * @TODO
 *     return scroller document with event binding.
  **/
define("util/scroller/scroller", [ "core/underscore/1.8.3/underscore", "core/jquery/1.8.3/jquery", "util/event/event-mouse-wheel" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    var $ = require("core/jquery/1.8.3/jquery");
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    require("util/event/event-mouse-wheel");
    require("util/scroller/scroller.css");
    var SHASH = {};
    //自定义滚动轴
    $.fn.ppScroller = function(option) {
        var _this = $(this);
        var opt = $.extend({
            maxHeight: 0,
            maxWidth: 0,
            horizontal: false,
            showScroller: true,
            wheelPixel: 8,
            animate: false,
            mouseWheel: true,
            autoWrap: false,
            slideBlockSelector: null,
            onScroll: function(index, scroll, location) {}
        }, option);
        var _onScroll = opt.onScroll;
        var _a, _b, _range;
        /**
         * [onScroll 滚动监听 - fix 负数问题]
         * @param  {[int]} a     [滚动序号]
         * @param  {[int]} b     [滚动距离]
         * @param  {[int]} range [可滚动距离]
         */
        opt.onScroll = function(a, b, range) {
            var a = parseInt(Math.abs(a));
            var b = parseInt(Math.abs(b));
            var range = Math.abs(b) === 0 ? 0 : Math.abs(b) / range;
            if ((a !== _a || b !== _b || range !== _range) && !isNaN(a + b + range)) {
                _onScroll(a, b, range);
                _a = a;
                _b = b;
                _range = range;
            }
        };
        /* 动画处理 */
        var doChange = opt.animate ? function($obj, attr, v) {
            var a = {};
            a[attr] = v;
            $obj.stop()["animate"](a);
        } : function($obj, attr, v) {
            $obj["css"](attr, v);
        };
        var max = !opt.horizontal ? opt.maxHeight || _this.height() : opt.maxWidth || _this.width();
        return _this.each(function() {
            var sid = parseInt(Math.random() * 1e6);
            if (!_this.attr("data-scroller-sid")) {
                _this.attr("data-scroller-sid", sid);
            } else {
                sid = _this.attr("data-scroller-sid");
                SHASH[sid].destory();
            }
            SHASH[sid] = _this;
            var Handler = {};
            var scrollHandler = $.Callbacks();
            _this.addClass("pp-scroller-container");
            if (opt.horizontal) {
                _this.addClass("pp-scroller-container-h");
            }
            var scroller;
            var inner, $temp;
            if (opt.slideBlockSelector) {
                inner = _this.find(opt.slideBlockSelector);
            } else {
                inner = _this.children(":first");
            }
            if (opt.autoWrap) {
                $temp = $("<div>").appendTo(_this);
                $temp.append(inner);
                inner = $temp;
            }
            inner.eq(0).css({
                position: "relative",
                height: inner.eq(0).height()
            });
            /* 计算宽度 */
            if (opt.horizontal) {
                var width = 0;
                inner.children().each(function(i, n) {
                    width += $(n).outerWidth(true);
                });
                inner.width(width);
            }
            /* 移动端使用默认的滚动轴 */
            if (isMobile) {
                _this.height(max).css(!opt.horizontal ? {
                    overflowY: "scroll",
                    overflowX: "hidden"
                } : {
                    overflowX: "scroll",
                    overflowY: "hidden"
                });
                _this.scroll = _this.destory = this.pause = function() {
                    return _this;
                };
                _this.scrollTo = function(xy, cb) {
                    var xy = parseInt(xy);
                    if (!opt.horizontal) {
                        _this.scrollTop(xy);
                    } else {
                        _this.scrollLeft(xy);
                    }
                    cb && cb();
                    return _this;
                };
                _this.scrollTo1 = function(i, cb) {
                    var xy = parseInt(opt.wheelPixel * i);
                    if (!opt.horizontal) {
                        _this.scrollTop(xy);
                    } else {
                        _this.scrollLeft(xy);
                    }
                    cb && cb();
                    return _this;
                };
                var scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max;
                var spaceing = parseInt(scrollRange / opt.wheelPixel);
                // 间隔数
                _this.on("scroll", function(e) {
                    opt.onScroll(parseInt(scrollRange / opt.wheelPixel), this.scrollTop, scrollRange);
                });
                // opt.onScroll = function(a, b, range){
                //     _onScroll(Math.abs(a), Math.abs(b), Math.abs(b) / range);
                // }
                return _this;
            }
            var offsetXY, // 鼠标按下按钮offset
            mouseXY, // 鼠标按下位置
            mkey = false, // 拖拽开关
            skey = false, // 初始化开关
            scale, // 容器 / 内容总宽高
            total, // 内容总宽高
            btn, // 滚动轴按钮
            scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max, spaceing = parseInt(scrollRange / opt.wheelPixel);
            var index = 0;
            /*
             * stop trigger de event handler when the scroller reach both sides;
             */
            if (opt.mouseWheel) {
                Handler.container_mousewheel = !opt.horizontal ? function(e, y) {
                    if (skey) {
                        index += y;
                        var top = -opt.wheelPixel * index;
                        if (index > 0) {
                            top = 0;
                            index = 0;
                        } else if (-index > spaceing) {
                            top = -max + inner.outerHeight();
                            index = -spaceing;
                        }
                        doChange(btn, "top", top * scale);
                        doChange(inner, "top", -top);
                        opt.onScroll(index, top, scrollRange);
                        return false;
                    }
                } : function(e, y) {
                    if (skey) {
                        index += y;
                        var left = -opt.wheelPixel * index;
                        if (index > 0) {
                            left = 0;
                            index = 0;
                        } else if (-index >= spaceing) {
                            left = -max + inner.outerWidth();
                            index = -spaceing;
                        }
                        doChange(btn, "left", left * scale);
                        doChange(inner, "left", -left);
                        opt.onScroll(index, left, scrollRange);
                        return false;
                    }
                };
                Handler.container_mousewheel_t = _this;
                _this.on("mousewheel", Handler.container_mousewheel);
            }
            scroller = $('<div class="pp-scroller">' + '<div style=""></div></div>');
            Handler.btn_mousedown = !opt.horizontal ? function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageY);
                offsetXY = parseInt($(this).position().top);
                return false;
            } : function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageX);
                offsetXY = parseInt($(this).position().left);
                return false;
            };
            btn = scroller.find("div").on("mousedown", Handler.btn_mousedown);
            Handler.btn_mousedown_t = btn;
            var btnWH;
            Handler.scroller_mousedown = !opt.horizontal ? function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageY);
                offsetXY = parseInt(mouseXY - scroller.offset().top - btnWH / 2);
                $(document).trigger("mousemove", [ e.pageY ]);
            } : function(e) {
                mkey = true;
                mouseXY = parseInt(e.pageX);
                offsetXY = parseInt(mouseXY - scroller.offset().left - btnWH / 2);
                $(document).trigger("mousemove", [ e.pageX ]);
            };
            Handler.scroller_mousedown_t = scroller;
            scroller.appendTo(_this).on("mousedown", Handler.scroller_mousedown);
            Handler.document_mousemove = function(e, pageXY) {
                if (mkey) {
                    ss(parseInt((!opt.horizontal ? e.pageY : e.pageX) || pageXY));
                }
            };
            Handler.document_mousemove_t = $(document);
            Handler.document_mouseup = function(e) {
                mkey = false;
            };
            Handler.document_mouseup_t = $(document);
            Handler.document_selectstart = function(e) {
                if (mkey) {
                    e.preventDefault();
                }
            };
            Handler.document_selectstart_t = $(document);
            $(document).on("mousemove", Handler.document_mousemove).on("mouseup", Handler.document_mouseup).on("selectstart", Handler.document_selectstart);
            var offsetTop = parseInt($(_this).find(".pp-scroller").css("top")) / 2;
            var ss = !opt.horizontal ? function(pageY) {
                //                    console.log('btn',btn);
                var btnOffset = offsetXY + pageY - mouseXY;
                if (btnOffset <= 0) {
                    btnOffset = 0;
                } else if (btnOffset + parseInt(btn.outerHeight()) >= max - offsetTop) {
                    btnOffset = max - btn.outerHeight() - offsetTop;
                }
                index = -(btnOffset / scale / opt.wheelPixel);
                btn.css("top", btnOffset);
                inner.css("top", -btnOffset / scale);
                opt.onScroll(index, -btnOffset / scale, scrollRange);
            } : function(pageX) {
                var btnOffset = offsetXY + pageX - mouseXY;
                if (btnOffset <= 0) {
                    btnOffset = 0;
                } else if (btnOffset + parseInt(btn.outerWidth()) >= max) {
                    btnOffset = max - btn.outerWidth();
                }
                index = -(btnOffset / scale / opt.wheelPixel);
                btn.css("left", btnOffset);
                inner.css("left", -btnOffset / scale);
                opt.onScroll(index, -btnOffset / scale, scrollRange);
            };
            _this.scroll = function() {
                return function() {
                    _this.height("auto");
                    total = !opt.horizontal ? inner.height() : inner.width();
                    btn.css(!opt.horizontal ? "top" : "left", 0);
                    inner.css(!opt.horizontal ? "top" : "left", 0);
                    if (total <= max) {
                        skey = false;
                        scroller.hide();
                        if (!opt.horizontal) {
                            _this.height(max);
                        } else {
                            _this.width(max);
                        }
                    } else {
                        skey = true;
                        scale = max / total;
                        if (!opt.showScroller) {
                            scroller.css("visibility", "hidden");
                        }
                        if (!opt.horizontal) {
                            _this.height(max).css("overflow", "hidden");
                            scroller.show().height(max - 10).find("div").height(max * scale - 10);
                            inner.css("top", 0);
                        } else {
                            _this.width(max).css("overflow", "hidden");
                            scroller.show().width(max).find("div").width(max * scale);
                            inner.css("left", 0);
                        }
                    }
                    btnWH = !opt.horizontal ? btn.height() : btn.width();
                    return _this;
                };
            }();
            _this.scrollTo = function(xy, cb) {
                var xy = parseInt(xy);
                if (xy <= 0 || total < max) {
                    xy = 0;
                } else if (xy >= total - max) {
                    xy = total - max;
                }
                index = -(xy / opt.wheelPixel);
                doChange(btn, !opt.horizontal ? "top" : "left", xy * scale);
                doChange(inner, !opt.horizontal ? "top" : "left", -xy);
                opt.onScroll(index, -xy, scrollRange);
                cb && cb();
                return _this;
            };
            _this.scrollTo1 = function(i, cb) {
                var xy = parseInt(opt.wheelPixel * i);
                if (xy <= 0 || total < max) {
                    xy = 0;
                } else if (xy >= total - max) {
                    xy = total - max;
                }
                doChange(btn, !opt.horizontal ? "top" : "left", xy * scale);
                doChange(inner, !opt.horizontal ? "top" : "left", -xy);
                opt.onScroll(i, -xy, scrollRange);
                cb && cb();
                return _this;
            };
            _this.pause = Handler.pause;
            _this.destory = function() {
                for (var n in Handler) {
                    if (!/_t$/.test(n) && Handler[n + "_t"]) {
                        Handler[n + "_t"].off(n.replace(/.+_/, ""), Handler[n]);
                        Handler[n + "_t"] = null;
                        Handler[n] = null;
                    }
                }
                if (!opt.horizontal) {
                    _this.height("");
                } else {
                    _this.width("");
                }
                scroller.remove();
            };
            return _this;
        });
    };
});

/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *      $('#selecter').ppScroll().scroll();
 **/
define("util/event/event-mouse-wheel", [ "core/jquery/1.8.3/jquery" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery");
    // 鼠标中键
    (function($) {
        var types = [ "DOMMouseScroll", "mousewheel" ];
        $.event.special.mousewheel = {
            setup: function() {
                if (this.addEventListener) {
                    for (var i = types.length; i; ) {
                        this.addEventListener(types[--i], handler, false);
                    }
                } else {
                    this.onmousewheel = handler;
                }
            },
            teardown: function() {
                if (this.removeEventListener) {
                    for (var i = types.length; i; ) {
                        this.removeEventListener(types[--i], handler, false);
                    }
                } else {
                    this.onmousewheel = null;
                }
            }
        };
        $.fn.extend({
            mousewheel: function(fn) {
                return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
            },
            unmousewheel: function(fn) {
                return this.unbind("mousewheel", fn);
            }
        });
        function handler(event) {
            var orgEvent = event || window.event, args = [].slice.call(arguments, 1), delta = 0, returnValue = true, deltaX = 0, deltaY = 0;
            event = $.event.fix(orgEvent);
            event.type = "mousewheel";
            // Old school scrollwheel delta
            if (event.originalEvent.wheelDelta) {
                delta = event.originalEvent.wheelDelta / 120;
            }
            if (event.originalEvent.detail) {
                delta = -event.originalEvent.detail / 3;
            }
            // New school multidimensional scroll (touchpads) deltas
            deltaY = delta;
            // Gecko
            if (orgEvent.axis !== undefined && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                deltaY = 0;
                deltaX = -1 * delta;
            }
            // Webkit
            if (orgEvent.wheelDeltaY !== undefined) {
                deltaY = orgEvent.wheelDeltaY / 120;
            }
            if (orgEvent.wheelDeltaX !== undefined) {
                deltaX = -1 * orgEvent.wheelDeltaX / 120;
            }
            // Add event and delta to the front of the arguments
            args.unshift(event, delta, deltaX, deltaY);
            return $.event.handle.apply(this, args);
        }
    })($);
});

define("util/scroller/scroller.css", [], function() {
    seajs.importStyle(".pp-scroller-container{position:relative}.pp-scroller{display:none;box-sizing:border-box;width:8px;height:8px;border-radius:2px;background:#e6e6e6;position:absolute;right:0;top:0;overflow:hidden}.pp-scroller div{position:relative;box-sizing:border-box;border-radius:2px;width:8px;height:8px;background:#c5c5c5;border:1px solid #b4b4b4;position:absolute;right:0;top:0}.pp-scroller-container-h .pp-scroller{top:auto;bottom:0}.pp-scroller-container::-webkit-scrollbar{width:8px;background:#eee}.pp-scroller-container::-webkit-scrollbar-thumb{background:#ccc;border-radius:15px}.pp-scroller-container::-webkit-scrollbar-button{display:none}.pp-scroller-container::-webkit-scrollbar-track-piece{background:transparent}");
});

//github地址：https://github.com/mathiasbynens/jquery-placeholder
define("util/placeholder/placeholder", [], function(require) {
    return function($) {
        // Opera Mini v7 doesn't support placeholder although its DOM seems to indicate so
        var isOperaMini = Object.prototype.toString.call(window.operamini) === "[object OperaMini]";
        var isInputSupported = "placeholder" in document.createElement("input") && !isOperaMini;
        var isTextareaSupported = "placeholder" in document.createElement("textarea") && !isOperaMini;
        var valHooks = $.valHooks;
        var propHooks = $.propHooks;
        var hooks;
        var placeholder;
        var settings = {};
        if (isInputSupported && isTextareaSupported) {
            placeholder = $.fn.placeholder = function() {
                return this;
            };
            placeholder.input = true;
            placeholder.textarea = true;
        } else {
            placeholder = $.fn.placeholder = function(options) {
                var defaults = {
                    customClass: "placeholder"
                };
                settings = $.extend({}, defaults, options);
                return this.filter((isInputSupported ? "textarea" : ":input") + "[placeholder]").not("." + settings.customClass).bind({
                    "focus.placeholder": clearPlaceholder,
                    "blur.placeholder": setPlaceholder
                }).data("placeholder-enabled", true).trigger("blur.placeholder");
            };
            placeholder.input = isInputSupported;
            placeholder.textarea = isTextareaSupported;
            hooks = {
                get: function(element) {
                    var $element = $(element);
                    var $passwordInput = $element.data("placeholder-password");
                    if ($passwordInput) {
                        return $passwordInput[0].value;
                    }
                    return $element.data("placeholder-enabled") && $element.hasClass(settings.customClass) ? "" : element.value;
                },
                set: function(element, value) {
                    var $element = $(element);
                    var $replacement;
                    var $passwordInput;
                    if (value !== "") {
                        $replacement = $element.data("placeholder-textinput");
                        $passwordInput = $element.data("placeholder-password");
                        if ($replacement) {
                            clearPlaceholder.call($replacement[0], true, value) || (element.value = value);
                            $replacement[0].value = value;
                        } else if ($passwordInput) {
                            clearPlaceholder.call(element, true, value) || ($passwordInput[0].value = value);
                            element.value = value;
                        }
                    }
                    if (!$element.data("placeholder-enabled")) {
                        element.value = value;
                        return $element;
                    }
                    if (value === "") {
                        element.value = value;
                        // Setting the placeholder causes problems if the element continues to have focus.
                        if (element != safeActiveElement()) {
                            // We can't use `triggerHandler` here because of dummy text/password inputs :(
                            setPlaceholder.call(element);
                        }
                    } else {
                        if ($element.hasClass(settings.customClass)) {
                            clearPlaceholder.call(element);
                        }
                        element.value = value;
                    }
                    // `set` can not return `undefined`; see http://jsapi.info/jquery/1.7.1/val#L2363
                    return $element;
                }
            };
            if (!isInputSupported) {
                valHooks.input = hooks;
                propHooks.value = hooks;
            }
            if (!isTextareaSupported) {
                valHooks.textarea = hooks;
                propHooks.value = hooks;
            }
            $(function() {
                // Look for forms
                $(document).delegate("form", "submit.placeholder", function() {
                    // Clear the placeholder values so they don't get submitted
                    var $inputs = $("." + settings.customClass, this).each(function() {
                        clearPlaceholder.call(this, true, "");
                    });
                    setTimeout(function() {
                        $inputs.each(setPlaceholder);
                    }, 10);
                });
            });
            // Clear placeholder values upon page reload
            $(window).bind("beforeunload.placeholder", function() {
                $("." + settings.customClass).each(function() {
                    this.value = "";
                });
            });
        }
        function args(elem) {
            // Return an object of element attributes
            var newAttrs = {};
            var rinlinejQuery = /^jQuery\d+$/;
            $.each(elem.attributes, function(i, attr) {
                if (attr.specified && !rinlinejQuery.test(attr.name)) {
                    newAttrs[attr.name] = attr.value;
                }
            });
            return newAttrs;
        }
        function clearPlaceholder(event, value) {
            var input = this;
            var $input = $(input);
            if (input.value === $input.attr("placeholder") && $input.hasClass(settings.customClass)) {
                input.value = "";
                $input.removeClass(settings.customClass);
                if ($input.data("placeholder-password")) {
                    $input = $input.hide().nextAll('input[type="password"]:first').show().attr("id", $input.removeAttr("id").data("placeholder-id"));
                    // If `clearPlaceholder` was called from `$.valHooks.input.set`
                    if (event === true) {
                        $input[0].value = value;
                        return value;
                    }
                    $input.focus();
                } else {
                    input == safeActiveElement() && input.select();
                }
            }
        }
        function setPlaceholder(event) {
            var $replacement;
            var input = this;
            var $input = $(input);
            var id = input.id;
            // If the placeholder is activated, triggering blur event (`$input.trigger('blur')`) should do nothing.
            if (event && event.type === "blur") {
                if ($input.hasClass(settings.customClass)) {
                    return;
                }
                if (input.type === "password") {
                    $replacement = $input.prevAll('input[type="text"]:first');
                    if ($replacement.length > 0 && $replacement.is(":visible")) {
                        return;
                    }
                }
            }
            if (input.value === "") {
                if (input.type === "password") {
                    if (!$input.data("placeholder-textinput")) {
                        try {
                            $replacement = $input.clone().prop({
                                type: "text"
                            });
                        } catch (e) {
                            $replacement = $("<input>").attr($.extend(args(this), {
                                type: "text"
                            }));
                        }
                        $replacement.removeAttr("name").data({
                            "placeholder-enabled": true,
                            "placeholder-password": $input,
                            "placeholder-id": id
                        }).bind("focus.placeholder", clearPlaceholder);
                        $input.data({
                            "placeholder-textinput": $replacement,
                            "placeholder-id": id
                        }).before($replacement);
                    }
                    input.value = "";
                    $input = $input.removeAttr("id").hide().prevAll('input[type="text"]:first').attr("id", $input.data("placeholder-id")).show();
                } else {
                    var $passwordInput = $input.data("placeholder-password");
                    if ($passwordInput) {
                        $passwordInput[0].value = "";
                        $input.attr("id", $input.data("placeholder-id")).show().nextAll('input[type="password"]:last').hide().removeAttr("id");
                    }
                }
                $input.addClass(settings.customClass);
                $input[0].value = $input.attr("placeholder");
            } else {
                $input.removeClass(settings.customClass);
            }
        }
        function safeActiveElement() {
            // Avoid IE9 `document.activeElement` of death
            try {
                return document.activeElement;
            } catch (exception) {}
        }
    };
});
