$(function() {
	
	//JQ初始化CSS
	var aImgLi=$('.imgList li');
	var aBtnLi=$('.dianList li');
	aImgLi.first().show();
	aBtnLi.last().css('margin-right', 0);


	var timer;

	var banner=$('.banner');
	banner.hover(function() {
		clearInterval(timer);
	}, function() {
		clearInterval(timer);
		timer=setInterval(nextFn, 2000);
	});



	var rightBtn=$('.rightBtn');
	//定义一个模拟变量
	var num=0;
	var coverObj=$('.cover');

	//封装下一张的功能
	function nextFn(event) {
		
		//让蒙版淡入进来
		coverObj.fadeIn(800,function(){

			//再让下一张图片直接显示
			num++;
			if(num>2){
				num=0;
			}
			aImgLi.eq(num).show().siblings('li').hide();
			aBtnLi.eq(num).addClass('current').siblings('li').removeClass('current');

			//再把蒙版掀掉
			coverObj.fadeOut(300);

		});

	}

	//下一张切换
	rightBtn.click(nextFn);

	//自动切换
	timer=setInterval(nextFn, 2000);

	//上一张切换
	var leftBtn=$('.leftBtn');
	leftBtn.click(function(event) {
		
		//让蒙版淡入进来
		coverObj.fadeIn(800,function(){

			//再让上一张图片直接显示
			num--;
			if(num<0){
				num=2;
			}
			aImgLi.eq(num).show().siblings('li').hide();
			aBtnLi.eq(num).addClass('current').siblings('li').removeClass('current');

			//再把蒙版掀掉
			coverObj.fadeOut(300);

		});



	});	

	//点击切换
	aBtnLi.click(function(event) {
		
		//这里的$(this)是指当前角标
		var i=$(this).index();

		//让蒙版淡入进来
		coverObj.fadeIn(800,function(){

			//这里的$(this)是指coverObj，而不是当前角标
			
			//再让与当前角标相匹配的那个图片显示
			aImgLi.eq(i).show().siblings('li').hide();
			//让当前角标具备current....
			aBtnLi.eq(i).addClass('current').siblings('li').removeClass('current');

			//再把蒙版掀掉
			coverObj.fadeOut(300);

			//做所有轮播图的点击事件时，都不要忘了加同步变量这一步
			num=i;

		});



	});












});