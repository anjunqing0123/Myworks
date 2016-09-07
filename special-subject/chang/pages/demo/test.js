define(function(require, exports, module) {
    var $ = require("jquery");
    var cookie = require("util/cookie/cookie");
    var ppuploader = require("util/upload/ppVideoUpload");
    var win = window;
    var $win = $(win);

    var _tags, _gameType, _gameName, movieTitle, isCanSubmit = 0,
        iscanProgressUpdate = 1,
        isAlertLeave = 0,
        isDoUnload = 1;

    var $uploadErr = $('.J_upload_err');

    var isProgress = false;
    var isHTML5 = false;
    if (window.File && window.FormData) {
        isHTML5 = true;
    }

    var fileId = '';
    var logTxt = '';
    var _fileVal,
        _fileSize,
        isCanUpload = true; //是否还需要去执行failCallback
    //if(!_comFunc.readLoginCookies()) return;
    var _nameIndex = cookie.get("PPName").indexOf('$');
    var _userName = cookie.get("PPName").slice(0, _nameIndex);
    var vul = new ppuploader({
        "token": cookie.get('ppToken'),
        "cp": webcfg.cp,
        'username': _userName,
        "offset": {
            "x": 0,
            "y": 0,
            "width": 0,
            "height": 0
        },
        'width': 160,
        'height': 45,
        "fileInput": 'myFile'
    });
    vul.bind("metaInfo", metaInfoCallback); //仅flash模式下通过flash选取文件后返回
    vul.bind('start', startCallback);
    vul.bind('progressUpdate', progressUpdateCallback);
    vul.bind('finish', finishCallback);
    vul.bind('fail', failCallback);
    vul.bind('delete', deleteCallback);
    vul.bind('commit', commitCallback);
    //隐藏选择上传视频，显示提交表单
    function showCommitTab() {
        var t1 = _fileVal.lastIndexOf("\\");
        var t2 = _fileVal.lastIndexOf(".");
        var t3 = $.trim(_fileVal.slice(t2 + 1)).toLowerCase();
        var arr3 = new Array();
        arr3 = ["avi", "wmv", "asf", "mp4", "mpg", "ts", "m2ts", "m4v", "mpeg", "mpe", "rm", "rmvb", "vob", "mov", "qt", "3qp", "3g2", "flv", "f4v", "ogm", "mkv", "mwt", "gxf"];
        var vType = -1;
        for (var i = 0; i < arr3.length; i++) {
            if (t3 == arr3[i]) {
                vType = i;
                break;
            }
        }
        if (vType < 0) {
            var _artContent = '请选择以下视频方式：.avi，.wmv，.asf，.mp4，.mpg，.ts，.m2ts，.m4v，.mpeg，.mpe，.rm，.rmvb，.vob，.mov，.qt，.3qp，.3g2，.flv，.f4v，.ogm，.mkv，.mwt，.gxf';
            resetFileInput();
            isCanUpload = false; //不需要再去执行failCallback
            return;
        }
        if (document.getElementById('myFile').files) {
            _fileSize = document.getElementById('myFile').files[0].size;
            var _fileSizeHtml5 = _fileSize / 1024 / 1024;
            if (_fileSizeHtml5 <= 0 || _fileSizeHtml5 > 1024) {
                if (_fileSizeHtml5 <= 0) {
                    var _artContent = '您选择的视频尺寸太小，请重新选择！';
                } else {
                    var _artContent = '文件大小超出（1G）无法上传！';
                }
                iscanProgressUpdate = 0;
                isCanUpload = false;
                resetFileInput();
                if (vul) {
                    if (isProgress) {
                        vul.cancel(fileId);
                    }
                    vul.deleteFile(fileId);
                }
                return;
            } else {
                iscanProgressUpdate = 1;
            }
        }
        if (t1 < t2 && t1 < _fileVal.length && $.trim($('#fileNameTxt').val()) === '') {
            document.getElementById("fileNameTxt").value = _fileVal.slice(t1 + 1);
        }
        $('#uploadBox').show();
        isAlertLeave = 1;
        $('#fileBox').css({
            'position': 'absolute',
            'z-index': '-1'
        });
    }
    //视频上传进度条loading
    var _loadingNum = 0;

    function loadVideo(all, loaded) {
        all = all / 1024 / 1024;
        loaded = loaded / 1024 / 1024;
        //console.log('loaded:'+loaded+',all:'+all);
        var _lWid = loaded * 100 / all;
        if (_lWid > 100) {
            _lWid = 100;
        }
        if (parseInt(loaded) > parseInt(all)) {
            loaded = all;
        }
        if (_loadingNum <= _lWid) {
            _loadingNum = _lWid;
            $('#loadNum').text(parseInt(loaded) + 'M');
            $('#allLoad').text(parseInt(all) + 'M');
            $('#loadPer').text(parseInt(_lWid) + '%');
            $('#loadingNum').stop().animate({
                'width': _lWid + "%"
            }, 100);
            if (parseInt(_lWid) === 100) {
                $('#uploadBtn').show().prev().hide();
                showLogs();
            }
        }
    }

    function metaInfoCallback(evt) {
        $("#fileNameTxt").val(evt.fileName);
        _fileVal = evt.fileName;
        if (vul) {
            vul.upload(file);
        }
        showCommitTab();
    }

    function startCallback(evt) {
        showCommitTab();
        fileId = evt.fileId;
        //$('#loadingNum').css({'width':"0%"},100);
    }

    function progressUpdateCallback(evt) { //console.log(evt.total)
        isProgress = true;
        if (iscanProgressUpdate) {
            if (evt.total / 1024 / 1024 > 1024 || evt.total <= 0) {
                if (evt.total <= 0) {
                    var _artContent = '您选择的视频尺寸太小，请重新选择！';
                } else {
                    var _artContent = '文件大小超出（1G）无法上传！';
                }
                resetFileInput();
                isCanUpload = false; //不需要再去执行failCallback

                if (vul) {
                    if (isProgress) {
                        vul.cancel(fileId);
                    }
                    vul.deleteFile(fileId);
                }
            } else {
                //console.log('服务器端：total='+evt.total+',服务器端：uploaded='+evt.uploaded);
                loadVideo(evt.total, evt.uploaded)
            }
        }
    }

    function finishCallback(evt) {
        isProgress = false;
        fileId = evt.fileId;
        $('#loadPer').text('100%');
        $('#loadingNum').stop().animate({
            'width': "100%"
        }, 100);
        $('#uploadBtn').show().prev().hide();
        showLogs();
    }

    function failCallback(evt) {
        isProgress = false;
        if (isCanUpload) {
            if (evt.failCode === '1006' || evt.failCode === '1001') {
                fileId = evt.fileId;
                showCommitTab();
                //console.log("errorsize:"+_fileSize);
                //console.log('本地：total='+_fileSize+',本地：uploaded='+_fileSize);
                loadVideo(_fileSize, _fileSize);
            } else if (evt.failCode == '2004') {
                var _artContent = '文件大小超出（1G）无法上传！';
                resetFileInput();
            } else {
                var _artContent = '上传网络出错，请刷新重试！';
                resetFileInput();
            }
        }
    }

    function commitCallback(evt) {
        isProgress = false;

        if (isHTML5) {
            var _movieTitle = movieTitle;
        } else {
            var _movieTitle = encodeURIComponent(movieTitle);
        }

        $.ajax({
            type: 'GET',
            dataType: 'jsonp',
            url: WEB_DOMAIN_CONFIG.api_url + '/upload/commit/?upload_id=' + fileId + '&tags=' + _tags + '&title=' + _movieTitle + '&game_type=' + _gameType + '&game_name=' + _gameName,
            success: function(resp) {
                if (resp.code === -1) {
                    $uploadErr.text('该视频已经提交过，请重新选择！');
                } else if (resp.code === -600) {
                    common.doLoginFn();
                } else if (resp.code === -601) {
                    $uploadErr.text('您还不是主播，无法上传视频！');
                } else if (resp.code === 0) {
                    isAlertLeave = 0;
                    isDoUnload = 1;
                    $uploadErr.text('');
                    common.dialog('上传视频成功！', null, function() {
                        location.href = '/i/video/';
                    });
                } else if (resp.code === -3) {
                    $uploadErr.text('标题过长，最多只能输入30个汉字！');
                } else {
                    common.dialog('上传网络出错，请刷新重试！');
                }
            }
        });
    }

    function deleteCallback(evt) {
        $('#uploadBox').hide();
        isAlertLeave = 0;
        $('#fileBox').removeAttr('style');
    }

    function showLogs() {
        $("#showLog").html('视频文件已上传，请确认视频信息后，点击<span class="im">"保存"</span>，以完成视频上传').show();
        _loadingNum = 0;
    }
    var file;
    $("#myFile").change(function(evt) {
        file = this.files.length === 0 ? null : this.files[0];
        _fileVal = $("#myFile").val();

        //showCommitTab();
        $('#loadingNum').css({
            'width': "0%"
        }, 100);

        if (isHTML5) {
            if (!file) return;
        }
        if (vul) {
            vul.upload(file);
        }
    });
    $("#uploadBtn").click(function() {
        isDoUnload = 0;

        if (isHTML5) {
            movieTitle = encodeURIComponent($('#fileNameTxt').val());
        } else {
            movieTitle = $('#fileNameTxt').val();
        }
        if ($.trim(movieTitle) === '') {
            $uploadErr.text('请您填写视频标题！');
            return;
        }

        if (vul && !isProgress) {
            vul.updateTitle(fileId, movieTitle);
            vul.commit(fileId);
        }
    });

    function resetFileInput() {
        var _file = $('#myFile');
        $('#loadingNum').css('width', "0px");
        _file.after(_file.clone(true).val(""));
        _file.remove();
        _loadingNum = 0;
        $("#showLog").hide();
        $('#loadNum').text('0M');
        $('#allLoad').text('0M');
        $('#loadPer').text('0%');
        $('#fileNameTxt').val('');
        $('#uploadBtn').prev().show();
        $('#uploadBtn').hide();
    }
    $("#cancelUpload").click(function() {
        var _isCancel = confirm('您确定要取消本次上传吗？');
        if (_isCancel) {
            resetFileInput();
            setTimeout(function() {
                if (vul) {
                    if (isProgress) {
                        vul.cancel(fileId);
                    }
                    vul.deleteFile(fileId);
                }
            }, 10);
        } else {
            isDoUnload = 0;
        }
    });
});
