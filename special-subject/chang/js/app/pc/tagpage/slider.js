 define(function(require,exports) {
    var $=require('jquery');
    //var ps = require('../../../util/photoslide/photoslide');
    require('../../../util/flexSlider/flexSlider')($);
    //幻灯
    /*ps.init($(".module-slider"), {
        perTime: 1,
        showNum: 1,
        outer: '.slider-wrap',
        inner: '.slider ul',
        autoSwitchTime:0,
        loop:true,
        btns:".btnbox p",
        onChangePage: function(){
            //console.log(this.selectedPageIndex);
            var index = $(".module-slider .btnbox .now").html() - 1,
                lis = $(".module-slider li"),
                curtxt = $(lis[index]).find("img").attr("alt");              
            $(".module-slider span").html(curtxt);
            var as = $(".module-slider .btnbox a");       
            if(index == $(as).length - 1){
                console.log($(as).length)
            }
        }
    });*/


    $(".dropbox").mouseenter(function(){
        $(".drop").show();
    });
    $(".dropbox").mouseleave(function(){
        $(".drop").hide();
    });

    
    $(function() {
        $(".flexslider").flexslider({
            animationLoop:true,
            directionNav:true,
            slideshowSpeed:3000,
            slideshow:true,
            startAt:0,
            after:function(obj){
                var curIdx=obj.currentSlide;
                var lis = $(".module-slider .slides li")
                var curtxt = $(lis[curIdx]).find("a").attr("title");
                $(".flex-control-pagingW p").html(curtxt);   
            },
            start:function(){
                var pageW = $("<div class='flex-control-pagingW'></div>");
                $(document.documentElement).append(pageW);
                pageW.insertBefore(".flex-direction-nav");
                pageW.append("<p></p>");
                $(".flex-control-paging").appendTo(pageW);

                function getAttr(){
                    var index = $(".flex-control-paging .flex-active").html() - 1,
                        lis = $(".module-slider .slides li"),
                        curtxt = $(lis[index]).find("a").attr("title");              
                    $(".flex-control-pagingW p").html(curtxt);
                }
                getAttr();
                
                $(".flex-direction-nav a").click(function(){
                    getAttr();         
                })
                $(".flex-control-paging a").click(function(){
                    return false;  
                })               
            }
        });
    });
        
});