
	//当鼠标移上li01时，让width=360，height=458,margin-top：-16,背景图换成大图=01big
	//事件源：li01
	//事件类型：移上
	//执行指令：....
	var li01=document.getElementById('li01');
	li01.onmouseenter=function(){
		
		li01.style.width='360px';
		li01.style.height='458px';
		li01.style.marginTop='-16px';
		li01.style.backgroundImage='url(img/01big.jpg)';
	
	};
	
	//离开时，还原所有
	//当鼠标离开li01时，让width=320，height=426,margin-top：0,背景图换成小图=01.jpg
	li01.onmouseleave=function(){
		
		li01.style.width='320px';
		li01.style.height='426px';
		li01.style.marginTop='0';
		li01.style.backgroundImage='url(img/01.jpg)';
			
	};
	
	var li02=document.getElementById('li02');
	li02.onmouseenter=function(){
		
		li02.style.width='360px';
		li02.style.height='458px';
		li02.style.marginTop='-16px';
		li02.style.backgroundImage='url(img/02big.jpg)';
	
	};
	
	//离开时，还原所有
	//当鼠标离开li01时，让width=320，height=426,margin-top：0,背景图换成小图=01.jpg
	li02.onmouseleave=function(){
		
		li02.style.width='320px';
		li02.style.height='426px';
		li02.style.marginTop='0';
		li02.style.backgroundImage='url(img/02.jpg)';
			
	};
	
