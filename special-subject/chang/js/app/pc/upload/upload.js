/*
* @Author: WhiteWang
* @Date:   2015-08-13 14:35:38
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-09-29 12:44:46
*/
define(function(require, module, exports){
    var $ = require('jquery'),
        VideoUploader = require('../../../util/upload/VideoUploader'),
        login = require('../../../util/login/login'),
        Loader = require('../../../util/loader/loader'),
        api = require('../../../util/linkcfg/interfaceurl')['interface'],
        dropdownNormal=require('../personcenter/dropdown');
    require('../../../util/placeholder/placeholder')($);

    var errObj = {
        '1': '视频为空，请选择视频文件',
        '2': '视频格式错误',
        '3': '视频尺寸太小',
        '4': '文件大小超出（1G）无法上传！',
        '0': '未登录',
        '-1': '赛区id非法！当前赛区禁止上传视频，请更换赛区',
        '-2': 'uploadid不存在',
        '-3': '时长超出限制',
        '-4': '保存失败',
        '-5': 'title为空',
        '-6': '用户不能上传视频超过100个',
        '-7': '用户未报名'
    };

    var loadingBarWidth = 298;
    var $form = $('#videoUploadForm');
    var $fileInput = $('#fileInput');
    var $submitBtn = $('#submitBtn');
    var $nameInput = $('#nameInput');
    var $areaSelect = $('#areaSelect');
    var $textInput = $form.find('.video_list .textInput');
    var $loading = $('#loading-grid');
    var $loadingbar = $loading.find('.loadingbar span');
    var $loadingper = $loading.find('.loadingper');
    var $cancelbtn = $loading.find('.cancel-btn');
    var $clearBtn = $form.find('.ico_clear');
    var _file = null;
    var _songName = '';
    var _areaId = '';

    $nameInput.placeholder({customClass:'my-placeholder'});
    $textInput.placeholder({customClass:'my-placeholder'});

    dropdownNormal.create({
        container: $form.find('.drop-area'),
        dropIcon:'.curval,.dropdown-icon',
        dataOpt: 'data-value'
    });


    var vUploader = new VideoUploader({
        fileInput: 'fileInput',
        offset: {w:68,h:37,x:0,y:0},  //插件的位置，对低版本浏览器，会创建一个flash插件，覆盖在input上
        onMetaInfo: function(data){ //flash选择文件以后，会返回文件相关信息
            $textInput.val(data.fileName);
        },
        onFail: function(data){
            var errText = data.message;
            $form.find('.video_list .err_tip').html(errText).show();
            $textInput.addClass('err');
        },
        onStart: function(data){
            $fileInput.parent().siblings('.textInput').removeClass('err').siblings('.err_tip').hide();
            $loadingbar.width(0);
            $loadingper.html('0%');
            $('.module-videoUpload .success_tip').hide();
            $loading.show();
        },
        onFinish: function(data){
            var self = this;    //必需隔一段时间调用commit；直接finish之后调用commit，flash选择下一个文件时会出错
            setTimeout(function(){
                self.completed(_songName);
            },100);
            // this.completed(_songName);   //完成之后需要设置插件的completed为false，否则会影响下一次上传
        },
        onCommit: function(data){
            if(!this.isHTML5){
                $textInput.val('');
            }
            Loader.load(api.uploadCommit+'/'+_areaId+'/'+data.fileId, {
                title: _songName
            }, function(d){
                $loading.hide();
                if(d && d.status){
                    if(d.status==='1'){
                        $('.module-videoUpload .success_tip').show();
                    } else {
                        alert(errObj[d.status]);
                    }
                } else {
                    alert('上传失败，请刷新页面重试')
                }
            },function(){
                $loading.hide();
                alert('上传失败，请刷新页面重试');
            });
        },
        onUpdate: function(total, loaded){
            var percent = parseInt(loaded*100/total);
            $loadingper.html(percent+'%');
            $loadingbar.width(percent/100*loadingBarWidth);
        }
    });

    function checkForm(){
        var ck = false;
        if(!_songName){
            $form.find('.name_list .err_tip').html('请输入歌曲名称').show();
            $nameInput.addClass('err');
            ck = false;
        } else {
            $form.find('.name_list .err_tip').html('请输入歌曲名称').hide();
            $nameInput.removeClass('err');
            ck = true;
        }
        return ck;
    }

    $fileInput.on('change', function(){
        if(this.files){
            _file = this.files.length === 0 ? null : this.files[0];
        }
        $textInput.val($fileInput.val());
    });
    $nameInput.on('focus', function(){
        $clearBtn.show();
    }).on('blur', function(){
        setTimeout(function(){
            $clearBtn.hide();
        },500);
    })
    $submitBtn.on('click', function(ev){
        ev.preventDefault();
        if(!login.isLogined()){
            login.init();
            return;
        }
        _songName = $nameInput.val();
        _areaId = $areaSelect.attr('data-value');
        if(checkForm()){
            vUploader.upload(_file);
        }
    });
    $clearBtn.on('click', function(){
        $nameInput.val('');
    });
    $cancelbtn.on('click', function(){
        vUploader.cancel();
        $loading.fadeOut();
    });
    window.onerror = function(msg,url,l){
        $textInput.val('');
        $form.find('.video_list .err_tip').html(errObj[1]).show();
    }
});
