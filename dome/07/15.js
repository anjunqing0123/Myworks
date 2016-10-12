$(function() {

    var aLi = $('.list li');

    aLi.hover(function() {

        //让当前LI width过渡到599
        //让当前LI的小伙伴们 width过渡到99
        $(this).stop().animate({ 'width': 599 }, 500);
        $(this).siblings().stop().animate({ 'width': 99 }, 500);

    }, function() {
        aLi.stop().animate({ 'width': 199 }, 500);

    });


});