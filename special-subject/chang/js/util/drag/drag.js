/* 
* @Author: WhiteWang
* @Date:   2015-10-14 15:23:12
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-14 15:24:59
*/
define(function(){



/*--------------------------------------------------------------
Draggable
alternative to jQuery UI’s draggable
based on comments from: http://css-tricks.com/snippets/jquery/draggable-without-jquery-ui/
usage example: $('.post-thumbnail, article header').draggable();
--------------------------------------------------------------*/
//https://gist.github.com/Arty2/11199162
return function($){
    $.fn.draggable = function() {
        this
            .on('mousedown touchstart', function(e) {
                var $dragged = $(this);

                var x = $dragged.offset().left - e.pageX,
                    y = $dragged.offset().top - e.pageY,
                    z = $dragged.css('z-index');

                if (!$.fn.draggable.stack) {
                    $.fn.draggable.stack = 999;
                }
                stack = $.fn.draggable.stack;
                
                $(window)
                    .on('mousemove.draggable touchmove.draggable', function(e) {
                        $dragged
                            .css({'z-index': stack, 'bottom': 'auto', 'right': 'auto'})
                            .offset({
                                left: x + e.pageX,
                                top: y + e.pageY
                            })
                            .find('a').one('click.draggable', function(e) {
                                e.preventDefault();
                            });

                        e.preventDefault();
                    })
                    .one('mouseup touchend touchcancel', function() {
                        $(this).off('mousemove.draggable touchmove.draggable click.draggable');
                        $dragged.css({'z-index': stack})
                        $.fn.draggable.stack++;
                    });

                e.preventDefault();
            });
        return this;
    };
}


})