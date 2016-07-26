$(function() {
	

// banner无缝滚动开始
    var ImgList=$('.imgList')
    var rightBtn=$('.rightbtn');
    var leftBtn=$('.leftbtn');
    var aDian=$('.btnList li');
    var banner=$('.banner');
    var timer;
    //定义两个变量，分别用来模拟角标序号和图片序号
    //因为图片和角标数量不一致了，不再是11对应的关系 
    var imgKey=dianKey=0;

    //创建临时工（克隆第0个LI）
    var tempImg=ImgList.children('li').first().clone(true);
    ImgList.append(tempImg);
    function nextFn(event) {
        
        //-------------------控制小点开始---------------------
        dianKey++;
        if(dianKey>2){
            dianKey=0;
        }
        //控制下一个小点
        aDian.eq(dianKey).addClass('current').siblings('li').removeClass('current');

        imgKey++;
        if(imgKey>3){
            //如果能进入该判断，代表轮播图停留在临时工身上
            //用户以为他看见的是第0张，
            //单击下一张，他希望看见的是第1张
            imgKey=1;
            
            ImgList.css('margin-left', 0);
        }
        var moves=imgKey*-100+'%';
        //%在JS里面表示取余，直接在后面书写，一定不对
        //让整个UL移动
        ImgList.stop().animate({'margin-left':moves}, 1000);
    }
    //单击右按钮往右移动
    rightBtn.click(nextFn);
    timer=setInterval(nextFn, 3000);


    banner.hover(function() {
    	clearInterval(timer);
    }, function() {
    	clearInterval(timer);
    	timer=setInterval(nextFn, 3000);
    });

    leftBtn.click(function(event) {
		
		//-------------------控制小点开始---------------------
		dianKey--;
		if(dianKey<0){
			dianKey=2;
		}
		//控制下一个小点
		aDian.eq(dianKey).addClass('current').siblings('li').removeClass('current');
		//-------------------控制小点结束---------------------

		//-------------------控制图片开始---------------------
		//动画到上一张图片
		
		imgKey--;
		if(imgKey<0){
			
			imgKey=2;
			ImgList.css('margin-left', '-300%');

		}
		
		var moves=imgKey*-100+'%';
		//%在JS里面表示取余，直接在后面书写，一定不对
		//让整个UL移动
		ImgList.stop().animate({'margin-left':moves}, 500);
		
		//-------------------控制图片结束---------------------	
		
	});


    //小点点击
		aDian.click(function(event) {
		
		//移动公式：$(this).index()*-400
		var i=$(this).index();
		// i代表当前序号
		var moves=i*-100+'%';
		//%在JS里面表示取余，直接在后面书写，一定不对
		//让整个UL移动当前操作角标相对应的图片的位置
		ImgList.stop().animate({'margin-left':moves}, 500);

		//让当前角标具备current.....
		$(this).addClass('current').siblings('li').removeClass('current');

		//重要的一步：同步两个全局变量
		imgKey=dianKey=i;

		});





});    