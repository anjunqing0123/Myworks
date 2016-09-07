/**
 * @info:自定义滚动轴
 * @auth:yanyang
 * @email:yyfireman@163.com
 * @exmaple:
 *     $('#selecter').ppScroll().scroll();
 * @TODO
 *     return scroller document with event binding.
  **/
define(function (require, exports) {
    var _ = require('underscore');
    var $ = require('jquery');
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test( navigator.userAgent);
    require('../../util/event/event-mouse-wheel');
    require('./scroller.css');

    var SHASH = {};

    //自定义滚动轴
    $.fn.ppScroller = function(option) {
        var _this = $(this);
        var opt = $.extend({
            maxHeight           : 0 // 容器高度
            ,maxWidth           : 0 // 容器宽度
            ,horizontal         : false // 纵向
            ,showScroller       : true // 显示滚动轴
            ,wheelPixel         : 8 // 滚动距离
            ,animate            : false // 动画
            ,mouseWheel         : true //鼠标滚轴事件
            ,autoWrap           : false //自动包裹一层div
            ,slideBlockSelector : null //滑块选择器
            ,onScroll           : function(index, scroll, location){}
        },option);

        var _onScroll = opt.onScroll;
        var _a, _b, _range;
        /**
         * [onScroll 滚动监听 - fix 负数问题]
         * @param  {[int]} a     [滚动序号]
         * @param  {[int]} b     [滚动距离]
         * @param  {[int]} range [可滚动距离]
         */
        opt.onScroll = function(a, b, range){
            var a = parseInt(Math.abs(a));
            var b = parseInt(Math.abs(b));
            var range = Math.abs(b) === 0 ? 0 : (Math.abs(b) / range);
            if((a !== _a || b !== _b || range !== _range) && !isNaN(a + b + range)){
                _onScroll(a, b, range);
                _a = a; _b = b; _range = range;
            }

        }

        /* 动画处理 */
        var doChange = opt.animate ? function($obj, attr, v){
                var a = {};
                a[attr] = v;
                $obj.stop()['animate'](a);
            } : function($obj, attr, v){
                $obj['css'](attr, v);
            }

        var max = !opt.horizontal ? opt.maxHeight || _this.height() : opt.maxWidth || _this.width();

        return _this.each(function(){

            var sid = parseInt(Math.random() * 1000000);
            if(!_this.attr('data-scroller-sid')){
                _this.attr('data-scroller-sid', sid);
            }else{
                sid = _this.attr('data-scroller-sid');
                SHASH[sid].destory();
            }

            SHASH[sid] = _this;

            var Handler = {};
            var scrollHandler = $.Callbacks();


            _this.addClass('pp-scroller-container');
            if(opt.horizontal){
                _this.addClass('pp-scroller-container-h');
            }

            var scroller;
            var inner, $temp;
            if(opt.slideBlockSelector){
                inner = _this.find(opt.slideBlockSelector);
            }else{
                inner = _this.children(':first');
            }

            if(opt.autoWrap){
                $temp = $('<div>').appendTo(_this);
                $temp.append(inner);
                inner = $temp;
            }

            inner.eq(0).css({
                position:'relative',
                height: inner.eq(0).height()
            });


            /* 计算宽度 */
            if(opt.horizontal){
                var width = 0;
                inner.children().each(function(i, n){
                    width += $(n).outerWidth(true);
                });
                inner.width(width);
            }

            /* 移动端使用默认的滚动轴 */
            if(isMobile){
                _this.height(max).css(
                    !opt.horizontal ?
                        {
                            overflowY:'scroll',
                            overflowX:'hidden'
                        } : {
                            overflowX:'scroll',
                            overflowY:'hidden'
                        }
                    );
                _this.scroll = _this.destory = this.pause = function(){return _this};
                _this.scrollTo = function(xy, cb){
                    var xy = parseInt(xy);
                    if(!opt.horizontal){
                        _this.scrollTop(xy);
                    }else{
                        _this.scrollLeft(xy);
                    }
                    cb && cb();

                    return _this;
                };
                _this.scrollTo1 = function(i, cb){
                    var xy = parseInt(opt.wheelPixel * i);
                    if(!opt.horizontal){
                        _this.scrollTop(xy);
                    }else{
                        _this.scrollLeft(xy);
                    }


                    cb && cb();

                    return _this;
                };

                var scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max;
                var spaceing = parseInt(scrollRange / opt.wheelPixel); // 间隔数
                _this.on('scroll', function(e){
                    opt.onScroll(parseInt(scrollRange / opt.wheelPixel), this.scrollTop, scrollRange);
                });
                // opt.onScroll = function(a, b, range){
                //     _onScroll(Math.abs(a), Math.abs(b), Math.abs(b) / range);
                // }
                return _this;
            }
            var
                offsetXY, // 鼠标按下按钮offset
                mouseXY, // 鼠标按下位置
                mkey = false, // 拖拽开关
                skey = false, // 初始化开关
                scale, // 容器 / 内容总宽高
                total, // 内容总宽高
                btn, // 滚动轴按钮
                scrollRange = !opt.horizontal ? inner.outerHeight() - max : inner.outerWidth() - max,
                spaceing = parseInt(scrollRange / opt.wheelPixel); // 间隔数
            ;

            var index = 0
            /*
             * stop trigger de event handler when the scroller reach both sides;
             */
            if(opt.mouseWheel){
                Handler.container_mousewheel = !opt.horizontal ?
                    function(e, y){
                        if(skey){
                            index += y;
                            var top = (- opt.wheelPixel * index)
                            if(index > 0){
                                top = 0;
                                index = 0;
                            }else if(- index > spaceing){
                                top = - max + inner.outerHeight();
                                index = - spaceing;
                            }
                            doChange(btn, 'top', top*scale);
                            doChange(inner, 'top', -top);
                            opt.onScroll(index, top, scrollRange);
                            return false;
                        }
                    } : function(e, y){
                        if(skey){
                            index += y;
                            var left = (- opt.wheelPixel * index)
                            if(index > 0){
                                left = 0;
                                index = 0;
                            }else if(- index >= spaceing){
                                left = - max + inner.outerWidth();
                                index = - spaceing;
                            }


                            doChange(btn, 'left', left*scale);
                            doChange(inner, 'left', -left);

                            opt.onScroll(index, left, scrollRange);
                            return false;
                        }
                    }
                Handler.container_mousewheel_t = _this;
                _this.on('mousewheel', Handler.container_mousewheel);
            }

            scroller = $('<div class="pp-scroller">'+
                '<div style=""></div></div>');

            Handler.btn_mousedown = !opt.horizontal ?
                function(e){
                    mkey = true;
                    mouseXY = parseInt(e.pageY);
                    offsetXY = parseInt($(this).position().top);
                    return false;
                } : function(e){
                    mkey = true;
                    mouseXY = parseInt(e.pageX);
                    offsetXY = parseInt($(this).position().left);
                    return false;
                }
            btn = scroller.find('div').on('mousedown', Handler.btn_mousedown);
            Handler.btn_mousedown_t = btn;

            var btnWH;
            Handler.scroller_mousedown = !opt.horizontal ?
                function(e){
                    mkey = true;
                    mouseXY = parseInt(e.pageY);
                    offsetXY = parseInt(mouseXY - scroller.offset().top - btnWH / 2);
                    $(document).trigger('mousemove', [e.pageY]);
                } : function(e){
                    mkey = true;
                    mouseXY = parseInt(e.pageX);
                    offsetXY = parseInt(mouseXY - scroller.offset().left - btnWH / 2);
                    $(document).trigger('mousemove', [e.pageX]);
                }
            Handler.scroller_mousedown_t = scroller;
            scroller.appendTo(_this).on('mousedown', Handler.scroller_mousedown)


            Handler.document_mousemove = function(e, pageXY){
                if(mkey){
                    ss(parseInt((!opt.horizontal ? e.pageY : e.pageX) || pageXY));
                }
            }
            Handler.document_mousemove_t = $(document);
            Handler.document_mouseup = function(e){
                mkey = false;
            }
            Handler.document_mouseup_t = $(document);
            Handler.document_selectstart = function(e){
                if(mkey){
                    e.preventDefault();
                }
            }
            Handler.document_selectstart_t = $(document);
            $(document)
                .on('mousemove', Handler.document_mousemove)
                .on('mouseup', Handler.document_mouseup)
                .on('selectstart', Handler.document_selectstart);
            var offsetTop=parseInt($(_this).find(".pp-scroller").css('top'))/2;
            var ss = !opt.horizontal ? function(pageY){
//                    console.log('btn',btn);
                    var btnOffset = offsetXY + pageY - mouseXY;
                    if(btnOffset <= 0){
                        btnOffset = 0;
                    }else if(btnOffset + parseInt(btn.outerHeight()) >= max-offsetTop){
                        btnOffset = max - btn.outerHeight()-offsetTop;
                    }

                    index = -(btnOffset / scale / opt.wheelPixel)
                    btn.css('top', btnOffset);
                    inner.css('top', - btnOffset / scale);

                    opt.onScroll(index, - btnOffset / scale, scrollRange);

                } : function(pageX){
                    var btnOffset = offsetXY + pageX - mouseXY;
                    if(btnOffset <= 0){
                        btnOffset = 0;
                    }else if(btnOffset + parseInt(btn.outerWidth()) >= max){
                        btnOffset = max - btn.outerWidth();
                    }


                    index = -(btnOffset / scale / opt.wheelPixel)

                    btn.css('left', btnOffset);
                    inner.css('left', - btnOffset / scale);

                    opt.onScroll(index, - btnOffset / scale, scrollRange);
                }

            _this.scroll = (function(){
                return function(){
                    _this.height('auto');
                    total = !opt.horizontal ? inner.height() : inner.width();

                    btn.css(!opt.horizontal ? 'top' : 'left', 0);
                    inner.css(!opt.horizontal ? 'top' : 'left', 0);

                    if(total <= max){
                        skey = false;
                        scroller.hide();

                        if(!opt.horizontal){
                            _this.height(max)
                        }else{
                            _this.width(max)
                        }
                    }else{
                        skey = true;
                        scale = max / total;

                        if(!opt.showScroller){
                            scroller.css('visibility', 'hidden');
                        }

                        if(!opt.horizontal){
                            _this.height(max).css('overflow','hidden');
                            scroller.show().height(max - 10).find('div').height(max * scale - 10);
                            inner.css('top',0);
                        }else{
                            _this.width(max).css('overflow','hidden');
                            scroller.show().width(max).find('div').width(max * scale);
                            inner.css('left',0);
                        }

                    }
                    btnWH = !opt.horizontal ? btn.height() : btn.width();

                    return _this;
                }
            })();


            _this.scrollTo = function(xy, cb){
                var xy = parseInt(xy);
                if(xy <= 0 || total < max){
                    xy = 0;
                }else if(xy >= total - max){
                    xy = total - max
                }

                index = -(xy / opt.wheelPixel);

                doChange(btn, !opt.horizontal ? 'top' : 'left', xy * scale);
                doChange(inner, !opt.horizontal ? 'top' : 'left', - xy);

                opt.onScroll(index, - xy, scrollRange);

                cb && cb();

                return _this;
            };
            _this.scrollTo1 = function(i, cb){

                var xy = parseInt(opt.wheelPixel * i);
                if(xy <= 0 || total < max){
                    xy = 0;
                }else if(xy >= total - max){
                    xy = total - max
                }

                doChange(btn, !opt.horizontal ? 'top' : 'left', xy * scale);
                doChange(inner, !opt.horizontal ? 'top' : 'left', - xy);

                opt.onScroll(i, - xy, scrollRange);

                cb && cb();

                return _this;
            };
            _this.pause = Handler.pause
            _this.destory = function(){
                for(var n in Handler){
                    if(!/_t$/.test(n) && Handler[n + '_t']){
                        Handler[n + '_t'].off(n.replace(/.+_/, ''), Handler[n]);
                        Handler[n + '_t'] = null;
                        Handler[n] = null;
                    }
                }
                if(!opt.horizontal){
                    _this.height('');
                }else{
                    _this.width('');
                }

                scroller.remove();
                // 增加事件销毁
            }

            return _this;
        });
    }
});
