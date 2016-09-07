/**
 * @Description 播放页逻辑
 * @Author      YanYang
 * @Qq          175225632
 * @Data        2014/9/26
 * @Used
 *     www.pptv.com
 *     v.pptv.com
 */

define(function(require, exports){
    var $ = require('jquery');
    var delay = require('../function/delay');

    function tab(jqSelector, options){
        var opt = $.extend({
            evt: 'mouseenter'
            ,activeClass: 'now'
            ,beforeSwitch: function(){return true;}
            ,onSwitch: function(){}
            ,delay: 200
            ,strict: false //有些需求可能第一个tab对应的内容在第二个位置，此时不能按照顺序来对应
        }, options || {});

        $(jqSelector).each(function(i, n){
            var $this = $(n);
            var $child = $this.children();
            var $target = $('#' + $this.attr('data-targetid'));
            if($target.length){
                var show = delay(function(i, $btn){
                    if(opt.strict){
                        var tar = $btn.attr('data-targetid');
                        var $tar = $target.find('[data-targetid="'+ tar +'"]');
                        i = $tar.index();
                    }
                    var c = $target.children();
                    if(i < c.length){
                        if(opt.beforeSwitch(i, c.eq(i),$btn)!==false){
                            $child.removeClass(opt.activeClass);
                            $btn.addClass(opt.activeClass);
                            c.hide().eq(i).show();

                            opt.onSwitch(i, c.eq(i));
                        }
                        
                    }
                },  opt.evt == 'click' ? 0 : opt.delay);
                $child.each(function(){
                    $(this).on(opt.evt,function(e){
                        e.preventDefault();
                        if($(this).hasClass('disable')){
                            return;
                        }
                        show($(this).index(), $(this));
                    }).on('mouseleave',function(e){
                        show.cancel();
                    });;
                });
            }
        });

        return {
            // switch: function(i){},
            // auto: function(){},
            // stop: function(){}
        };
    }

    return tab;
});
