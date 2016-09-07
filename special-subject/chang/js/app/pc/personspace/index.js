define(function(require, module, exports) {
	var delayload = require('../../../util/lazyload/delayload');
	delayload.init();
	var $=require('jquery');
	var ShareBox = require('../../../util/share/share');
    //分享模块
    function getQueryString(str){
        if (str.indexOf('?') === 0 || str.indexOf('#') === 0) {
            str = str.substring(1, str.length);
        }
        var qs = {};
        var tt = str.split('&');
        for (var i=0; i<tt.length; i++) {
            var ss = tt[i].split('=');
            if (ss.length == 2) {
                qs[ss[0]] = ss[1];
            }
        }
        return qs;
    }

	(function(){
	    var timershow = null, timerhide = null;
	    $share = $('.module-person-praise .person-praise-btn');
	    $shareBox = $(".module-person-praise").find('.sharebox');
	    var username=$.trim($(".person-main-info h2").text());
	    new ShareBox({
	        box: $shareBox,
	        url: 'http://chang.pptv.com/pc/player?username='+getQueryString(window.location.search).username,
	        shareContent:'#'+username+'#在#pptv一唱成名#的个人空间上传了精彩视频，快一起分享吧！#一唱成名#（分享自@PPTV聚力）',
	        title:username+'在一唱成名的个人空间',
	        pics:$(".person-avatar img").attr('src')
	    })
	    $share.on('mouseenter', function(){
	        clearTimeout(timerhide);
	        timershow = setTimeout(function(){
	            $shareBox.fadeIn();
	        }, 300);
	    }).on('mouseleave', function(){
	        clearTimeout(timershow);
	        timerhide = setTimeout(function(){
	            $shareBox.fadeOut();
	        }, 300);
	    })
	})();
	//绑定分页逻辑，暂时不封装
	var page=0;
	var pageSize=15;
	var currentPage=0;
	var doms=$(".js-pagination").find('a.item').not(".item-upload");
	var domLens=doms.length;
	var totalPage=Math.ceil(domLens/pageSize)-1;
	function showPage(page){
		doms.css('display','none');
		doms.slice(page*pageSize,(page+1)*pageSize).css('display','block');
		//delayload目前有问题
		!!delayload&&delayload.update();
	}
	//放省略号,暂时这么实现
	var limit=require('./limit');
	doms.each(function(){
		var tempTxt=$(this).find('.ui-txt');
		var tempStr=$.trim(tempTxt.text());
	    var finalStr=limit(tempStr,22,'…');
	    tempTxt.html(finalStr);
	});
	//默认第一页
	showPage(0);
	var btnsContainer=$(".js-page");
	var nextDom=$(".js-next");
	var prevDom=$(".js-prev");
	if(domLens>pageSize){
		nextDom.addClass('js-next-active');
		btnsContainer.on('click',function(){
			var obj=$(this);
			var idx=obj.index();
			//prev
			if(idx==1){
				if(currentPage==0){
					//btnsContainer.removeClass("js-prev-active js-next-active");
					return false;
				}else{
					currentPage--;
					showPage(currentPage);
				}
				//next;
			}else{
				if(currentPage==totalPage){
					//btnsContainer.removeClass("js-prev-active js-next-active");
					return false;
				}else{
					currentPage++;
					showPage(currentPage);
				}
			}
			//最后一页
			if(currentPage==totalPage){
				nextDom.removeClass("js-next-active");
				prevDom.addClass('js-prev-active');
			}else if(currentPage==0){
				prevDom.removeClass('js-prev-active');
				nextDom.addClass("js-next-active");
			}else{
				nextDom.addClass("js-next-active");
				prevDom.addClass('js-prev-active');
			}
		});
	}
});
