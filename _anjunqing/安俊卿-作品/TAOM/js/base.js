/* 
* @Author: Administrator
* @Date:   2016-03-08 20:07:39
* @Last Modified by:   奥特M的小怪S
* @Last Modified time: 2016-03-13 15:06:22
*/

 $(function() {
    $('li.mr0').css('margin-right', 0);
    var top1=$('.top')
    var nav=$('.nav');
    var postop=$('.postop');
   
    $(window).scroll(function(event) {
         //吸附导航
        if ($(window).scrollTop()>30) {
          
            nav.addClass('current')
        } else{
            nav.removeClass('current')
        };
        //极速回顶部
        if ($(window).scrollTop()>=$(window).height()) {
        postop.show();
        } else{
        postop.hide();
        };
    });

     //文本框 移入移出
    var searchText=$('.search input');
    searchText.hover(function() {
        searchText.css('background', '#fff');
    }, function() {
        searchText.css('background', '#c8c8c8');
    });

     //文本框 光标事件
    searchText.focus(function(event) {
    	// alert(searchText.val());
         searchText.val('');
         
    });
    searchText.blur(function(event) {
    	if (searchText.val('')) {
            searchText.val(' 项目、发行、创作者、作品')
        };
    });

    //banner 无缝滑动
    var banner=$('.banner');
    var imgList=$('.imgList');
    var imgs=$('.imgList li');
    //克隆第一张到最后去
    var temp=imgs.first().clone(true);
        imgList.append(temp);
    //克隆完成后 因为角标和imgs的序号不一致，所以定义两个变量序号
    var imgkey=btnkey=0; 

    var btnList=$('.btnList');
    var btns=$('.btnList li');
    
    //左右箭头滑动
    var leftBtn=$('.leftbtn');
    var rightBtn=$('.rightbtn');


    var timer;



    //封装一个往右走的功能
    function nextfn(event){
        btnkey++
        if (btnkey>3) {
            btnkey=0;
        };
        //绑定角标的序号，让当前的得到current这个类名 其它的去掉这个类名；
        btns.eq(btnkey).addClass('current').siblings('li').removeClass('current');
        //绑定imgs，让imgs的margin-left往左走
        imgkey++
        if (imgkey>4) {
            imgkey=1;
            imgList.css('margin-left',0);
        };
        // 定义一个往左走的距离
        var  moves=imgkey*-100+'%';
        imgList.stop().animate({'margin-left':moves}, 2000);


    };
    //点击右按钮往右滑动
        rightBtn.click(nextfn);
    //单击左按钮往左滑动
    leftBtn.click(function(event) {
         btnkey--
        if (btnkey<0){
            btnkey=3;
        };
        //绑定角标的序号，让当前的得到current这个类名 其它的去掉这个类名；
        btns.eq(btnkey).addClass('current').siblings('li').removeClass('current');
        //绑定imgs，让imgs的margin-left往左走
        imgkey--
        if (imgkey<0){
            imgkey=3;
            imgList.css('margin-left',-6332);
        };
        // 定义一个往左走的距离
        var  moves=imgkey*-100+'%';
        imgList.stop().animate({'margin-left':moves}, 2000);



    });
    //自动滑动
    timer=setInterval(nextfn,4000);
    //鼠标移入banner时候停止自动滑动
    banner.hover(function() {
        clearInterval(timer);
    }, function() {
        clearInterval(timer);
        timer=setInterval(nextfn,4000);
    });
    //绑定角标单击
    btns.click(function(event) {
        btnkey=imgkey=$(this).index();
        var moves=imgkey*-100+'%';
        btns.eq(imgkey).addClass('current').siblings('li').removeClass('current');
        imgList.stop().animate({'margin-left':moves}, 2000);
        
    });
    //banner 无缝滑动 end
    //
    //信息类蒙版 con
    var conlis=$('.con li');
    var concover=$('.con .info');
    conlis.hover(function() {
        var i=$(this).index();
       
        concover.eq(i).stop().slideDown(400);
    }, function() {
        var i=$(this).index();
        concover.eq(i).stop().slideUp(400);
    });
    //信息类蒙版 fx
    var fxlis=$('.fx li');
    var fxcover=$('.fx .info');
    fxlis.hover(function() {
        var i=$(this).index();
       
        fxcover.eq(i).stop().slideDown(400);
    }, function() {
        var i=$(this).index();
        fxcover.eq(i).stop().slideUp(400);
    });

    //成绩轮播
    //
    var chengji=$('.scroll');
    var btnl=$('.imgfl');
    var btnr=$('.imgfr');
    var clicknum=0;
    btnr.click(function(event) {
        clicknum++;
        chengji.stop().animate({'left':-1272}, 400);
        
        if (clicknum>1) {
         chengji.stop().animate({'left':0}, 400);
         clicknum=0;
        };
    });

    btnl.click(function(event) {
        clicknum--;
        chengji.stop().animate({'left':0}, 400);
        
        if (clicknum<0) {
         chengji.stop().animate({'left':-1272}, 400);
         clicknum=1;
        };    
    });

    //+ +好友 文字切换
    var Ah=$('.infodn a');
    Ah.hover(function() {
        $(this).html('+好友');
    }, function() {
         $(this).html('+');
    });
    //头像透明
    var photo=$('.infoup img');
    photo.hover(function() {
        $(this).css('opacity', 0.7);
    }, function() {
        $(this).css('opacity', 1);
    });
});        