
        var oHtml = document.documentElement;
        getSize();

        window.onresize = function(){
        	getSize();
        }
        function getSize(){

        	var screenWidth = oHtml.clientWidth;
        	oHtml.style.fontSize = screenWidth/(720/40) + 'px';
        }
