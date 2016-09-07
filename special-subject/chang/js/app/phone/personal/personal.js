/**
 * Sample
 * @param  {[type]} require     [description]
 * @param  {[type]} exports     [description]
 * @param  {[type]} module){} [description]
 * @return {[type]}             [description]
 */

define(function(require, exports, module){
    var $ = require('zepto'),
        Swiper = require('./../../../util/swipe/swiper.min'),
        alertBox = require('./../../../util/log/alertBox'),
        info = require("./info"),
        sdk = require("./../../../util/ppsdk/sdkUtil"),
        platform = require('../../../util/platform/plt');

    function resolveParam(str){
        var arr = str.split("&");
        var data = {};
        for( var i = 0 ; i < arr.length ; i++ ){
            var arrs = arr[i].split("=");
            data[arrs[0]] = arrs[1];
        }
        return data
    }
    // 判断是否是ipad
    function isIpad () {
        var search = window.location.search;
        search = search.substring(1,search.length);
        var data = resolveParam(search);
        return (data["type"] == "ipad" || platform.platform === 'ipad')
    }

    //后端提供是否存在参赛视频，如果不存在视频的话，就默认不去读取player接口了
    var isExistVideo=$("#existsVideo");
    if(isExistVideo.length>0&&isExistVideo.val()=='1'){
         var loader = require('./../haixuan/haixuan');
    }else{
        /*var moduleCustom=$(".module-person-custom");
        if(moduleCustom.length>0&&$('.module-singleupload').length>0){
            moduleCustom.removeClass('cloums3');
        }*/
    }

    //个人信息转换
    window.personal = {},window.p = personal;
    window.init = {};
    var race_lineLen =$(".race_line_w .race_item").length;
    //初始化swiper,头部幻灯逻辑
    init.initSwiper = function(){
        var length = $(".race_list .race_w .race_item").length;
        var $modulePersonal=$(".module.module-personal");
        //赛区一排还是二排的逻辑添加class开始,宽屏ipad不需要这个逻辑
        if(!$modulePersonal.hasClass('w')){
            if( length == 1 ){
                $(".race_list .race_w .race_item").addClass("line");
            }
            if(length == 2 ){
                $(".race_list .race_w ").addClass("two");
            }
            if( length > 3 && !$(".module.module-personal").is(".w") ){
                $modulePersonal.addClass("personal-line2");
            }else{
                $modulePersonal.removeClass("personal-line2");
            }
        }
        //一排二排逻辑结束
        //是否存在翻页逻辑，有点说明存在个人简介，没有则不启动翻页逻辑
        var dots=$(".ancher_wrap .dot");
        //双重验证 有切换点，并且个人简介不是空
        if(dots.length>0&&$.trim($(".detail_w p").html())!=""){
            var touchFunc=race_lineLen>4 ? function(swp,e){
                    var target=$(e.target);
                    if(target.parents('.race_line_w').length!=0){
                        swp.lockSwipeToNext();
                        swp.lockSwipeToPrev();
                    }else{
                        swp.unlockSwipeToNext();
                        swp.unlockSwipeToPrev();
                    }
                } : $.noop;
            p.swiper = new Swiper('.detail_list',{
                slidesPerView: 1,
                centeredSlides: true,
                spaceBetween: 0,
                onSlideChangeStart:function(swp){
                    var index = swp.activeIndex;
                    dots.removeClass('active');
                    dots.eq(index).addClass('active');
                    index == 1 ?
                        $modulePersonal.removeClass("noblue")
                        :
                        $modulePersonal.addClass("noblue");
                },
                onTouchStart:touchFunc
            });
        }
    };
    //个人空间赛区滑动，大于4个才实例化滑动
    if(race_lineLen>4){
        var shiliSlider = new Swiper('.race_line_w', {
            slidesPerView: 'auto'
        });
    }
    //头部幻灯逻辑结束
    //个人信息以及视频名称修改
    init.initInfoEdit = function(){
       var isSelf = ( window.location.pathname.indexOf("app/space") > -1 || window.location.pathname.indexOf("app/space/") > -1 || window.location.hostname == "space.chang.pptv.com" ) ? true : false;
        //如果存在PassPortUserName这个隐藏域 判断是否和username一样
        if( $("#PassPortUserName").length > 0 ){
            isSelf = ( $("#PassPortUserName").val() == $("#username").val() );
        }
        if( isSelf == 0 ) return;
        // 不是自己的页面，不提供操作

        //上传视频按钮
        $(".module.module-video .item-upload .v-up>a").click(function(){
            //验证是否通过审核
            var username = $("#username").val();
            var checkDom=$("#checkStatus");
            if(!!checkDom&&!!checkDom.length>0&&checkDom.val()=="2"){
                alertBox({
                    "type": "mini",
                    "msg" : "您的资料填写未通过审核，请修改通过审核后再上传"
                });
            }else{
                sdk("openNativePage",{
                    pageUrl: "app://iph.pptv.com/v4/activity/ugc?activity=singtofame",
                    success: function (rspData) {
                        var singleDom=$(".module-singleupload");
                        if(singleDom.length!=0){
                            singleDom.removeClass("module-singleupload");
                        }
                        window.location.reload();
                    },
                    error: function(code, msg) {
                        alertBox({
                            "type":"mini",
                            "msg":"服务器正忙，请稍后再试"
                        });
                    },
                    cancel:function()
                    {
                       /* alertBox({
                            "type":"mini",
                            "msg":"cancel_uploadVideo"
                        });*/
                    }
                })
            }
        });
        if( $('#checkStatus').val() != '2' ) return;
        if( $('#theStage').val() != 1 )  return ;
        //审核不通过才可以修改 通过了（==1） 就不可以修改了 返回
        //checkStatus  0 审核中 1 成功 2 失败
        //noreason 拒绝理由 1:姓名 2:昵称 3:组合名 4:头像 0:审核通过

        //上传头像
        $(".desc_w .p_pic .v_fail").click(function(){
            sdk("uploadPic",{
                info:{prod:"yccm_pic"},//扩展用
                type:0,//标识图片用途
                size:{width:300, height:300},//头像尺寸
                success:function(rspData) {
                    p.uploadPicSuccess(rspData.url);
                },
                error:function(errCode, msg) {
                    alertBox({
                        "type":"mini",
                        "msg":errCode + msg
                    });
                },
                cancel:function() {
                    //取消头像上传不做任何信息提示
                    // alertBox({
                    //     "type":"mini",
                    //     "msg":"cancel_uploadPic"
                    // });
                }
            });
           // p.uploadPic();
        });

        //修改用户名
        $(".desc_w .username .edit").click(function(){
            var isGroup = ( $("#isGroup").val() == '1' );
            /*alertBox({
                "type": "mini",
                "msg" : "isGroup:"+isGroup
            });*/
            var obj=$(this);
            if(obj.hasClass("js-group-edit")){
                info.edit("请输入姓名",function(val){
                if( !val ) {
                    this.error("不能为空！");
                    return false;
                }
                info.updateName(val,isGroup);
                return true;
                });
            }else if(obj.hasClass("js-name-edit")){
                info.edit("请输入姓名",function(val){
                    if( !val ) {
                        this.error("不能为空！");
                        return false;
                    }
                    info.updateName(val,false);
                    return true;
                });
            }else{
                info.edit("请输入姓名",function(val){
                    if( !val ) {
                        this.error("不能为空！");
                        return false;
                    }
                    info.updateName(val,isGroup);
                    return true;
                });
            }
        });
    };
    //初始化留言板
    init.initEnrool = function(){
        $(".enroll_btn").hide();
        p.enrool = function(){
            var username = $("#username").val();
            sdk("msgboard",{
                 info:{id:"special_"+encodeURIComponent(encodeURIComponent(username))},
                 success:function(rspData) {

                 },
                 error:function(errCode, msg) {
                    alertBox({
                        "type":"mini",
                        "msg":errCode + msg
                    });
                 },
                 cancel:function() {
                 }
            });
            // p.msgboard(username);
        };
    };

     //视频列表加载
    init.loadVideo = function(){
        //没有load代表后端没给loader,这里是否需要优化 todo
        if(!!loader){
            var s = loader.loadVideo(function(){
                //处理视频修改
               /* $(".module-video .item .v_fail").unbind("click").click(function(){
                    p.editVideo(this);
                })*/
            });
        }
    };

    init.loadVideo();
    init.initSwiper();
    init.initInfoEdit();
    init.initEnrool();


    //图片上传成功回调
    p.uploadPicSuccess = function(url){
        info.updatePic(url);
    };

    p.editVideo = function(obj){
        //修改组建
        info.edit("请输入视频名称",function(val){
            if( !val ) {
                this.error("不能为空！");
                return false;
            }

            //验证通过 调用业务
            info.updateName(val);
            return true;
        });
        //修改组建
    };


    //shareText shareURL shareImageURL
    //分享按钮
    sdk.ready(function(){
        var IsIpad = isIpad();

        $(".enroll_btn").show();
        if( $('#checkStatus').val() != '1' ) return;//审核通过才可以分享
        // shareUrl pad and phone
        var appShareUrl = "http://chang.pptv.com/app/player?username="+$("#username").val()+"&type=share",
            ipadShareUrl = "http://chang.pptv.com/ipad/player?username="+$("#username").val()+"&type=share";
        var url = IsIpad ? ipadShareUrl :appShareUrl;

        var btnOpt = {};
        btnOpt.behavior = 0;
        var pic_url = encodeURIComponent($(".desc_w .p_pic img")[0].src);
        // 文案内容： #选手名#在#pptv 一唱成名#的个人空间上传了精彩视频，快一起分享吧！＃一唱成名＃（分享自@PPTV聚力）
        // 文案头像：选手头像
        var tempName=$.trim($('.ids').text());
        var finalName='#'+tempName+'#在#pptv 一唱成名#的个人空间上传了精彩视频，快一起分享吧！#一唱成名#（分享自@PPTV聚力）';
        var name = encodeURIComponent(finalName);
        btnOpt.params = "shareText="+name+"&shareImageURL="+pic_url+"&shareURL="+ encodeURIComponent(url);
        sdk("customizeBtn",btnOpt);
    });


});
