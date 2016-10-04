$(function() {
	
	var rightBtn=$('.rightBtn');
	var leftBtn=$('.leftBtn');
	//定义两个变量，分别用来模拟角标序号和图片序号
	//因为图片和角标数量不一致了，不再是11对应的关系 
	var imgKey=dianKey=0;
	var imgList=$('.imgList');
	var aDian=$('.dianList li');
	aDian.last().css('margin-right', 0);
	var banner=$('.banner');
	var timer;


	//创建临时工（克隆第0个LI）
	var tempImg=imgList.children('li').first().clone(true);
	imgList.append(tempImg);

	//下一张切换的功能封装
	function nextFn(event) {
		
		//-------------------控制小点开始---------------------
		dianKey++;
		if(dianKey>2){
			dianKey=0;
		}
		//控制下一个小点
		aDian.eq(dianKey).addClass('current').siblings('li').removeClass('current');

		//-------------------控制小点结束---------------------
		
		//-------------------控制图片开始---------------------
		//动画到下一张图片
		
		//想动画，先得用公式算出下一张图上的left位移距离
		//  0		imgKey=0
		// -100%	imgKey=1;	
		// -200%	imgKey=2;
		// -300%	imgKey=3;		
		// 移动公式：imgKey*-100%
		imgKey++;
		if(imgKey>3){
			//如果能进入该判断，代表轮播图停留在临时工身上
			//用户以为他看见的是第0张，
			//单击下一张，他希望看见的是第1张
			imgKey=1;
			//如果直接切下一张，是从-1600到-400，还是走1200PX的距离
			//无缝是要每次都走400PX
			//所以先一瞬间让盒子的left到达0点
			//然后再从0点切到-400	实现走400PX
			imgList.css('margin-left', 0);
		}
		
		var moves=imgKey*-100;
		//%在JS里面表示取余，直接在后面书写，一定不对
		moves=moves+'%';
		//让整个UL移动
		imgList.stop().animate({'margin-left':moves}, 500);

		//-------------------控制图片结束---------------------	

	}

	//下一张切换
	rightBtn.click(nextFn);

	
	//自动走
	timer=setInterval(nextFn, 2000);

	//停止和重启定时器
	banner.hover(function() {
		clearInterval(timer);
	}, function() {
		clearInterval(timer);
		timer=setInterval(nextFn, 1000);
	});

	//上一张切换
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
			imgList.css('margin-left', '-300%');

		}
		
		var moves=imgKey*-100;
		//%在JS里面表示取余，直接在后面书写，一定不对
		moves=moves+'%';
		//让整个UL移动
		imgList.stop().animate({'margin-left':moves}, 500);

		//-------------------控制图片结束---------------------	

	});

	//小点点击
	aDian.click(function(event) {
		
		//移动公式：$(this).index()*-400
		var i=$(this).index();
		// i代表当前序号
		var moves=i*-100;
		//%在JS里面表示取余，直接在后面书写，一定不对
		moves=moves+'%';
		//让整个UL移动当前操作角标相对应的图片的位置
		imgList.stop().animate({'margin-left':moves}, 500);

		//让当前角标具备current.....
		$(this).addClass('current').siblings('li').removeClass('current');

		//重要的一步：同步两个全局变量
		imgKey=dianKey=i;

	});





});