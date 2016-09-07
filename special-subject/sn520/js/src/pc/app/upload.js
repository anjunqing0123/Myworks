/*
 * @author  Zhan Wang
 * @date    2016/5/5 14:10
 * @email   ijingzhan@gmail.com
 * @info    520上传逻辑
 *
 */
define(function(require, module, exports){
    var $ = require('jquery'),
        cookie = require('./../util/cookie'),
        VideoUploader = require('./../util/VideoUploader'),
        login = require('login'),
        Loader = require('http://static9.pplive.cn/chang/v_20151211162917/js/util/loader/loader.js');
    require('./../util/placeholder')($);

    var errCode = {
        '0': '未登录',
        '-1': '赛区id非法',
        '-2': 'uploadid不存在',
        '-3': '时长超出限制',
        '-4': '保存失败',
        '-5': 'title为空',
        '-6': '用户不能上传视频超过30个',
        '-7': '用户未报名',
        '-8': '视频大小限制',
        '1': '成功'
    };


    var loadingBarWidth = 380;
    var $form = $('#videoUploadForm');
    var $fileInput = $('#fileInput');
    var $submitBtn = $('#submitBtn');
    var $nameInput = $('#nameInput');
    var $textInput = $form.find('.video_list .textInput');
    var $loading = $('#loading-grid');
    var $loadingbar = $loading.find('.loadingbar div');
    var $loadingper = $loading.find('.loadingper');
    var $cancelbtn = $loading.find('.cancel-btn');
    var _file = null;
    var _songName = '';

    var $getsale = $('.getsale');
    $nameInput.placeholder({customClass:'my-placeholder'});
    $textInput.placeholder({customClass:'my-placeholder'});

    var vUploader = new VideoUploader({
        fileInput: 'fileInput',
        offset: {w:68,h:37,x:0,y:0},  //插件的位置，对低版本浏览器，会创建一个flash插件，覆盖在input上
        onMetaInfo: function(data){ //flash选择文件以后，会返回文件相关信息
            $textInput.val(data.fileName);
            $textInput.removeClass('err');
        },
        onFail: function(data){
            var errText = data.message;
            $form.find('.video_list .err_tip').html(errText).show();
            $textInput.addClass('err');
        },
        onStart: function(data){
            $fileInput.parent().siblings('.textInput').removeClass('err').siblings('.err_tip').hide();
            $('body').append('<div id="winbg" class="down snopc"></div>');
            $loadingbar.width(0);
            $loadingper.html('0%');
            $form.find('.success').hide();
            $loading.show();
        },
        onFinish:
            function(data){
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
            Loader.load('http://api.suning520.pptv.com/api/cimmit_video/1/' + data.fileId, {
                title: '把爱说出口-'+$nameInput.val(),
                isflash: (window.File && window.FormData) ? 0 : 1
            }, function(d){
                $loading.hide();
                $('#winbg').remove();
                if(d && d.status){
                    if(d.status==='1'){
                        $form.find('.success').show();
                        cookie.set('sn_right', 1, 30, 'pptv.com', '/');
                        $getsale.addClass('bound-pirce');
                        setTimeout(function () {
                            $getsale.removeClass('bound-pirce');
                        },5000);

                    } else {
                        alert(errCode[d.status]);
                    }
                } else {
                    alert('上传失败，请刷新页面')
                }
            },function(){
                $('#winbg').remove();
                $loading.hide();
                alert('上传失败，请刷新页面');
            });
        },
        onUpdate: function(total, loaded){
            var percent = parseInt(loaded*100/total);
            $loadingper.html(percent+'%');
            $loadingbar.width(percent/100*loadingBarWidth);
        }
    });
    
    function checkName() {
        if($nameInput.val().length <= 0){
            $form.find('.name_list .err_tip').html('请填写参赛作品名称,不超过20个字').show();
            $nameInput.addClass('err');
        }else{
            $form.find('.name_list .err_tip').html('请填写参赛作品名称,不超过20个字').hide();
            $nameInput.removeClass('err');
        }
    }

    $fileInput.on('change', function(){
        if(this.files){
            _file = this.files.length === 0 ? null : this.files[0];
        }
        $textInput.val($fileInput.val());
        $textInput.siblings('.err_tip').hide();
        $textInput.removeClass('err');
    });

    $nameInput.on('focus', function () {
        checkName();
    }).on('blur', function () {
        setTimeout(function () {
            checkName();
        }, 200);
    }).on('keydown', function () {
        setTimeout(function () {
            checkName();
        },200);
    });

    $submitBtn.on('click', function (ev) {
        ev.preventDefault();
        if (!login.isLogined()) {
            login.init();
            return;
        }
        if($nameInput.val().length <= 0){
            checkName();
            return ;
        }
        _songName = $nameInput.val();
        vUploader.upload(_file);
    });
    $cancelbtn.on('click', function () {
        vUploader.cancel();
        $loading.fadeOut();
        $('#winbg').remove();
    });
    window.onerror = function (msg, url, l) {
        $textInput.val('');
        $form.find('.video_list .err_tip').html(errCode[1]).show();
    }
});