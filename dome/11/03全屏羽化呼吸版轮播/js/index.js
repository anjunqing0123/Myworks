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
		timer=setInterval(nextFn, 1000);
	});



	var rightBtn=$('.rightBtn');
	//定义一个模拟变量
	var num=0;

	//封装下一张的功能
	function nextFn(event) {
		
		//辞旧：让当前这一张fadeOut
		//num在加加之前，就可以代表当前这一张的序号
		aImgLi.eq(num).stop().fadeOut(800);
		//让当前这个角标移除current
		aBtnLi.eq(num).removeClass('current');

		num++;
		if(num>2){
			num=0;
		}

		//迎新：让下一张fadeIn
		//num在加加之后，可以代表下一张的序号
		aImgLi.eq(num).stop().fadeIn(800);
		//让下一个角标新增current
		aBtnLi.eq(num).addClass('current');

	}

	//下一张切换
	rightBtn.click(nextFn);

	//自动切换
	timer=setInterval(nextFn, 1000);

	//上一张切换
	var leftBtn=$('.leftBtn');
	leftBtn.click(function(event) {
		
		//辞旧：让当前这一张fadeOut
		//num在减减之前，就可以代表当前这一张的序号
		aImgLi.eq(num).stop().fadeOut(800);
		//让当前这个角标移除current
		aBtnLi.eq(num).removeClass('current');
		num--;
		if(num<0){
			num=2;
		}

		//迎新：让上一张fadeIn
		//num在减减之后，可以代表上一张的序号
		aImgLi.eq(num).stop().fadeIn(800);
		//让上一个角标新增current
		aBtnLi.eq(num).addClass('current');

	});	

	//点击切换
	aBtnLi.click(function(event) {
		
		//现在内存里面驻留的num就代表当前这一张
		//辞旧：让当前这一张fadeOut
		aImgLi.eq(num).stop().fadeOut(800);
		//让当前这个角标移除current
		aBtnLi.eq(num).removeClass('current');

		//迎新：让与当前角标相匹配的那一张显示
		//这里需要一个很关键的操作，这是要让内存里面的num和你操作的这个角标的序号做同步；
		//因为你不做同步的话，内存里面的num永远都是0
		num=$(this).index();
		aImgLi.eq(num).stop().fadeIn(800);
		//让操作的这个角标新增current
		aBtnLi.eq(num).addClass('current');


	});












});