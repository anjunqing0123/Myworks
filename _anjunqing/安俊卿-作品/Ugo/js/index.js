 var oHtml = document.documentElement;
        getSize();

        window.onresize = function(){
        	getSize();
        }
        function getSize(){

        	var screenWidth = oHtml.clientWidth;
        	
        	if(screenWidth < 320){
        		// 如果说屏幕宽度小于320的话 就让根目录的font-size停留在320的这个范围内
        		oHtml.style.fontSize = '17.06666px';
        	} else if(screenWidth > 750){
        		// 如果说屏幕宽度大于640的话 就让根目录的font-size停留在640的这个范围内
        		oHtml.style.fontSize = '40px';
        	}else{
        		// 在这个区间之间，就让根目录的font-size自己去适配
        		oHtml.style.fontSize = screenWidth/(750/40) + 'px';
        	}
        }

