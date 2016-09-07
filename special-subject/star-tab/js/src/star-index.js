define(function(require, exports){
    var $ = require('jquery');
    var living = require('living');
    var $living = new living();
    function getQueryString(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    }
    //公共弹窗
    popBox();
    function popBox(){
        $('.pop-box-wrap .cancle').on('click',function(e){
            e.preventDefault();
            if($('.comment .love i').hasClass('cur')){
                $('.comment .love i').removeClass('cur');
            }
            $('.pop-box-wrap').hide();
        });
        $('.message .speak .speaking').on('click',function(){
            $('.pop-box-wrap').show();
        });
    };
    function endfix(){
        var $berforebottom='<div class="go-wrap"><a href="http://app.aplus.pptv.com/minisite/download" class="go">前往客户端查看更多精彩留言</a></div>';
        $('.fix-bottom').html($berforebottom);
    }
    //获取detail数据
    getDetailData();
    function getDetailData(){
        var contentid=window.location.href.replace(/^.*id=([^\#\?\&]*).*$/,'$1');
        $.ajax({
            url:'http://fans.mobile.pptv.com/content/detail',
            data:{
                contentid:contentid,
                platform:'web'
            },
            dataType:'jsonp',
            callback:'cb',
            success:function(res){
                if(res.code=='200'){
                    root=res.data;
                    getservertime(root);
                    popBox();
                    function isEmptyObject(obj){
                        for(var n in obj){return false}
                        return true;
                    }

                    if(isEmptyObject(root.correlativevide)){
                        $('.relevant').css('display','none');
                    }
                }
            }
        })
    };
    //判断当前处于哪种状态 直播前 、中、后
    function getStatus(root){
        var starTime=root.starttime;
        var endTime=root.endtime||'';
        if(starTime > iNow)
        {
            popBox();
            endfix();
            countDown();
            beforeliving(root);
            getCommonimage();
        }
        else
        {
        	if(!endTime || (endTime && iNow<endTime))
    		{
            	nowLiving(root);

    		}
    		else
    		{
                popBox();
                endfix();
           	 	endingLiving(root);
                getCommonimage();
    		}
        }
    };
    
    //直播前的逻辑
    function beforeliving(root){
        $('.living-default-star').remove();
        $('.mstar').css('margin-top','0.02rem')
        var starTime=root.starttime;
        var endTime=root.endtime;
        var $total=root.bookingcount||'0';
        var start=Math.floor(starTime);
        var date=new Date(start);
        var strtime=date.getMonth()+1+'月'+date.getDate()+'日<i></i>'+toTwo(date.getHours())+':'+toTwo(date.getMinutes());
        var reseverHtml='<div class="mstatus-before"><div class="count-time">直播时间:'+
            strtime+'</div><a href="#" class="reserve-btn">预订</a><div class="total"><span class="total-number">'+
            $total+'</span><span>人想看</span></div></div>';
        $('.mstatus').html(reseverHtml);
        var $mstarinfo=root.title;
        var $mstardes=root.description||'';
        var mstarHtml='<h3>'+
            $mstarinfo+'</h3><p>'+
            $mstardes+'</p>';
        $('.mstar').append(mstarHtml);
        $('.living-star').show();
        $('.message').show();
        $('.comment').show();
        //直播明星有无数据的判断，有则展示，无则隐藏
        if(root.producer && root.producer.length > 0){
            getCommonstar();
        }else{
            $('.living-star').hide();
        }
        $('.mstatus .mstatus-before .reserve-btn').on('click',function (e) {
            e.stopPropagation();
            $('.pop-box-wrap').show();
        });
    };
    //直播中的逻辑
    function nowLiving(root){
        //直播中页面
        $('.mstar').addClass('before-living');
        $('.living-default-star').show();
        $('.message').hide();
        var liveImg=root.image;
        var liveTitle=root.title;
        $('.living-default-star .living-default-star-title h3').html(liveTitle);
        var livingHtml='<div class="living"><div class="living-tag"><i></i>'+
            '直播中'+'</div><div class="living-btn"> <a href="javascript:;" class="cur flow">'+'流畅</a> <a href="javascript:;">'+
            '超清'+'</a></div></div>';
        $('.mstatus').html(livingHtml);
        var $bottom='<div class="discuss-wrap">'+'<a href="javascript:;" class="discuss"><i></i>去客户端参与讨论</div>';
        $('.fix-bottom').html($bottom);
        $('.discuss-wrap .discuss').on('click',function(){
            $('.pop-box-wrap').show();
        })
        $('.living .living-btn').on('click',function(){
            $('.pop-box-wrap').show();
        })
        $('.pop-box-wrap .cancle').on('click',function(e){
            e.preventDefault();
            $('.pop-box-wrap').hide();
        });

        //初始化直播播放器
        $living.initPlayer({
            livebox: 'mtop',
            cid: root.livevideo[0].channelid,
            chatID: 'fans_' + root.id,
            endTime:root.endtime
            // liveImg:liveImg
        });
        //初始化聊天室
        $living.initChat({
            chatbox: 'chatlist'
        });
    }
    //相关数据的cid
    function getCids(){
        var reventData=root.correlativevideo.videos||{}; //相关视屏数据
        cids=[];
        for(var i=0,len=reventData.length;i<len;i++){
            cids.push(reventData[i].channelid);
        };
        return cids;
    }
    //根据cid获取播放的跳转链接
    dataHrefs='';//定义全局的变量为了下面用到
    function reventHref(root){
        var cids=getCids().join(',');
        $.ajax({
            type:'get',
            url:'http://m.pptv.com/api/utils/pg_playlink',
            data:{
                ids:cids,
                plt:'wap',
            },
            dataType:'jsonp',
            jsonp:'callback',
            success:function(datas){
                dataHrefs=datas;
                //相关视频没有数据的时候则不显示
                if(dataHrefs.result&&dataHrefs.result.length!==0){
                    reventDataImg(root);
                }
            },
            error:function(){
                return;
            }
        })
    }
    function imageDefault(){
        $('img').each(function(i,v) {
            $(v).attr('src',$(v).attr('data-src'));
        })
    }
    function reventDataImg(root){
        var reventData=root.correlativevideo.videos||{}; //相关视屏数据
        var reventHtml='';
        if (reventData.length==1){
            reventData[i].corner=reventData[i].corner||'';
            reventHtml=reventHtml+'<li><a href='+dataHrefs.result[i].playlink+'><div class="relevant-pic">'+
                '<img src='+'http://sr1.pplive.com/cms/17/56/1196f6a69ee904099867c542299132c7.png' +' data-src='+((reventData[i].image)?(reventData[i].image):'http://sr1.pplive.com/cms/17/56/1196f6a69ee904099867c542299132c7.png')+' alt="">' +
                ((reventData[i].corner) ? ('<div class="quan">'+ reventData[i].corner+'</div>') : '') +
                '<div class="duration">'+((reventData[i].duration)?(reventData[i].duration):'')+'</div></div> <div class="relevant-detail-info">'+
                ((reventData[i].title)?(reventData[i].title):'')+'</div></a></li>';
        }
        if(reventData.length>1){
            for(var i=0,len=reventData.length;i<len;i++){
                reventData[i].corner=reventData[i].corner||'';
                reventHtml=reventHtml+'<li class="swiper-slide"><a href='+dataHrefs.result[i].playlink+'><div class="relevant-pic">'+
                    '<img src='+'http://sr1.pplive.com/cms/17/56/1196f6a69ee904099867c542299132c7.png' +' data-src='+((reventData[i].image)?(reventData[i].image):'http://sr1.pplive.com/cms/17/56/1196f6a69ee904099867c542299132c7.png')+' alt="">' +
                    ((reventData[i].corner) ? ('<div class="quan">'+ reventData[i].corner+'</div>') : '') +
                   '<div class="duration">'+((reventData[i].duration)?(reventData[i].duration):'')+'</div></div> <div class="relevant-detail-info">'+
                    ((reventData[i].title)?(reventData[i].title):'')+'</div></a></li>';
            }
        }
        $('#slide-revent .swiper-wrapper').html(reventHtml);
        var mySwiper = new Swiper('#slide-revent',{
            loop: false,
            slidesPerView: 'auto'
        });
        imageDefault();
    }

    //时间自动补零处理
    function toTwo ( n ) {
        return n < 10 ?  '0' + n : '' + n;
    }
    //直播后的偶记
    function endingLiving(root){
        $('.mtop .countdown').hide();
        $('.living-default-star').remove();
        popBox();
        //本场相关的请求数据
        $('.living-star').show();
        $('.message').show();
        $('.comment').show();
        //直播明星有无数据的判断，有则展示，无则隐藏
        var $number=root.producer.length;
        if($number!==0){
          getCommonstar()
        }else{
            $('.living-star').hide();
        }
        getCids();
        reventHref(root);
        //大图下面：
        var starTime=root.starttime;
        var date=new Date(Math.floor(starTime));
        var starttime=date.getMonth()+1+'月'+date.getDate()+'日<i></i>'+toTwo(date.getHours())+':'+toTwo(date.getMinutes());
        var $endHtml='<div class="ending"><div class="ending-tag">已结束</div><div class="ending-restart-time"><span>直播时间：</span><span>'+
        starttime+'</span></div><div class="ending-btn"><a href="#" class="flow">流畅</a><a href="#">超清</a></div></div>';
        $('.mstatus').append($endHtml);
        var $mstarinfo=root.title;
        var $mstardes=root.description||'';
        var $already=root.haveseencount||'0';
        var mstarHtml='<h3>'+
            $mstarinfo+'</h3><p>'+
            $mstardes+'</p>'+'<div class="total-per"><i></i><span class="total-pic-number">'+
            $already+'</span><span>人看过</span></div>';
        $('.mstar').append(mstarHtml);
        $('.ending .ending-btn a').on('click',function(){
            $('.pop-box-wrap').show();
        });
    }
    //公共的大的banner背景图片
    function getCommonimage(){
        var $banner=root.image;
        $('.mtop').css('background-image','url('+$banner+')');
    };
    //获取公共的明星资料
    function getCommonstar(){
        var $number=root.producer.length;
        var datastar=root.producer;
        var datastarHtml1='';
        var datastarHtml2='';
        for(var i=0,len=datastar.length;i<len;i++){
            datastarHtml1=datastarHtml1+'<li><div class="star-pic">'+
                '<img src='+'http://sr3.pplive.com/cms/21/46/4d708eab742b283357b6e62d735532a9.png'+' data-src='+((datastar[i].icon)?(datastar[i].icon):'http://sr3.pplive.com/cms/21/46/4d708eab742b283357b6e62d735532a9.png')+' alt=""></div><div class="star-info"><div class="star-name"><span class="star-first">'+
                ((datastar[i].name)?(datastar[i].name):'')+'</span><span>'+((datastar[i].foreignname)?(datastar[i].foreignname):'')+'</span></div><div class="star-detail">'+
                ((datastar[i].description)?(datastar[i].description):'')+'</div></div></li>'
        };
        for(var i=0,len=datastar.length;i<len;i++){
            datastarHtml2=datastarHtml2+'<li class="swiper-slide"><div class="star-pic more">'+
                '<img src='+'http://sr3.pplive.com/cms/21/46/4d708eab742b283357b6e62d735532a9.png'+' data-src='+((datastar[i].icon)?(datastar[i].icon):'http://sr3.pplive.com/cms/21/46/4d708eab742b283357b6e62d735532a9.png')+' alt=""></div><div class="star-info sur"><span>'+
                ((datastar[i].name)?(datastar[i].name):'')+'</span></div></li>';
        };

        //当数据少于三条的时候竖着显示，多于三条的时候横着显示，并可以滑动
        if($number>0&&$number<=3){
            $('#slide-star').removeClass('swiper-container');
            $('.living-star-info').removeClass('swiper-wrapper');
            $('.living-star-info').html(datastarHtml1);
        };
        if($number>=4){
            $('.living-star-info').addClass('more');
            $('.living-star-info').html(datastarHtml2);
        };
        imageDefault();
        $('.living-star .living-star-info li').on('click',function(){
            $('.pop-box-wrap').show();
        })
        var mySwiper = new Swiper('#slide-star',{
            loop: false,
            slidesPerView: 'auto'
        });
    };
    //倒计时的功能
    //1.获取服务器时间
    var iNow='';
    function getservertime(root){
        $.ajax({
            url:'http://time.pptv.com?time='+new Date().getTime(),
            dataType : 'jsonp',
            cache: true,
            jsonp:'cb',
            success:function(data){
                iNow=data*1000;
                getStatus(root);
            },
            error:function(){

            }
        });
    };
    function countDown(){
        //倒计时时间处理
        var starTime=root.starttime;
        var endTime=root.endtime;
        var timer=null;
        var days=00;
        var hours=00;
        var minutes=00;
        var seconds=00;
        var countdownHtml='';
        var t=Math.floor((starTime-iNow)/1000);
        var timer=setInterval(function(){
            t--;
            if(t>=0){
                days=toTwo(Math.floor(t/86400));
                hours=toTwo(Math.floor(t%86400/3600));
                minutes=toTwo(Math.floor(t%86400%3600/60));
                seconds=toTwo(t%60);
            }else if(t=0){
                clearInterval(timer);
                window.location.reload();
            }else if(t<0){
                clearInterval(timer);
            }

            countdownHtml='<div class="countdown"><ul><li><div class="time-detail">'+
                days+'</div><div class="time-txt">DAYS</div></li><li><span>:</span></li><li><div class="time-detail">'+
                hours+'</div><div class="time-txt">HOURS</div></li><li><span>:</span></li><li><div class="time-detail">'+
                minutes+'</div><div class="time-txt">MINUTES</div></li><li><span>:</span></li><li><div class="time-detail">'+
                seconds+'</div><div class="time-txt">SECONDS</div></li></ul></div>';
            $('.mtop').html(countdownHtml);
        },1000);
    };


    //通过评论功能：
    getCommentdata();
    function getVal(data) {
        return data?data:'';
    }
    function getCommentdata(){
        var contentid=window.location.href.replace(/^.*id=([^\#\?\&]*).*$/,'$1');
        var commentHtml='';
        $.ajax({
            url: 'http://apicdn.sc.pptv.com/sc/v3/pplive/ref/'+'fans_'+contentid+'/combine/feed/list?',
            data: {
                appplt:'clt',
            },
            dataType: 'jsonp',
            jsonp:'cb',
            timeout:5000,
            success:function(res){
                //先展示top，如果top的不足三条就用最新的来补
                var rootCommentt=res.data.topList.list;
                var rootCommentn=res.data.newList.list;
                var rootComment=rootCommentt.concat(rootCommentn);
                if(rootComment.length>3){
                    rootComment.length=3
                }
                //时间戳的转化：
                function transTimer(tt){
                    var t=new Date(tt);
                    var objTime=t.getMonth()+1+'-'+t.getDate()+' '+toTwo(t.getHours())+':'+toTwo(t.getMinutes());
                    return objTime;
                };
                for(var i=0,lens=rootComment.length;i<lens;i++){
                    commentHtml=commentHtml+'<li class="comment-first">'+'<div class="comment-pic">'+
                        '<img src='+'http://sr3.pplive.com/cms/21/46/4d708eab742b283357b6e62d735532a9.png'+' data-src='+((rootComment[i].user.icon)?(rootComment[i].user.icon):'http://sr3.pplive.com/cms/21/46/4d708eab742b283357b6e62d735532a9.png')+' alt="">'+
                        '</div><div class="comment-info"><div class="comment-name"><i>热</i> <span>'+
                        getVal(rootComment[i].user.nick_name)+'</span></div><div class="comment-detail">'+
                        getVal(rootComment[i].content)+'</div><div class="comment-love"><div class="time">'+
                        transTimer(rootComment[i].create_time)+'</div><div class="love"><i></i><span>'+
                        getVal(rootComment[i].up_ct)+'</span></div></div></div></li>'
                }
                $('.comment ul').append(commentHtml);
                imageDefault();
                $('.comment .love i').on('click',function(e){
                    $(this).addClass('cur');
                    e.preventDefault();
                    $('.pop-box-wrap').show();
                })
            }
        });
    }
});
