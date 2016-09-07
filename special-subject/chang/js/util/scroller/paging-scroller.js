/**
 * @Description
 * @Author 		YanYang
 * @Qq			175225632
 */
define(function(require, exports){
	var $ = require('jquery');
	var _ = require('underscore');
	require('./scroller');

	function PageingScroller(option) {
        var opt = this.opt = option || {};
        var necessary = ['$container', 'width', 'count', 'events', 'pageSize'];
        _.each(necessary, function(n){
            if(opt[n] === undefined){
                throw('need define ' + n);
            }
        });

        _.defaults(opt, {
            suffix : ''
        });

        this.initialize();
    }
    _.extend(PageingScroller.prototype, {
        initialize: function(){
            var opt = this.opt;
            var option = {
                wheelPixel: opt.width // 单个图片宽度
                ,maxWidth: opt.$container.outerWidth()
                ,horizontal: true
                ,showScroller: false
                ,animate: true
                ,mouseWheel: false
            }
            var scroller = this.scroller = opt.$container.ppScroller(option).scroll();

            var pager = new Pager({
                pageSize : opt.pageSize
                , type   : 'loop'
                , count  : opt.count
            });
            opt.events.on('onNext' + opt.suffix, (this._next = function(){
                var result = pager.next().result();
                scroller.scrollTo1(result.index);
            }));
            opt.events.on('onPrev' + opt.suffix, (this._prev = function(){
                var result = pager.prev().result();
                scroller.scrollTo1(result.index);
            }));
        },
        destory: function(){
            this.scroller.destory();
            this.opt.events.off('onNext', this._next);
            this.opt.events.off('onPrev', this._prev);
        }
    });


    function Pager(opt) {
        this.init(opt);
    }
    _.extend(Pager.prototype, {
        init : function(option) {
            var opt =  option || {};
            _.extend(this, {
                index         : 0
                , pageSize    : 0
                , count       : 0
                , amend       : 0
                , type        : null // loop-无缝滚动
                , resultFilter : function(){}
            }, opt);

            if(!this.pageSize && !this.count){
                throw('no define.');
            }
        },
        result : function() {
            var self = this, r = {};

            _.each(['index', 'pageSize', 'count', 'afterEnd', 'beforeStart'], function(n){
                r[n] = self[n];
            });

            return r;
        },
        next : function() {
            this.afterEnd = this.beforeStart = false;

            this.index += this.pageSize;

            if(this.index > this.count - 1) {
                this.afterEnd = true;
                this.index = 0;
            }

            if(this.type !== 'loop'){
                if(this.index >= this.count - 1 - this.pageSize) this.index = this.count - this.pageSize;
            }

            return this;
        },
        prev : function() {
            this.afterEnd = this.beforeStart = false;

            this.index -= this.pageSize;

            if(this.index <= 0 - this.pageSize ) {
                this.beforeStart = true;
                this.index = this.count - this.pageSize;
            }

            if(this.type !== 'loop'){
                if(this.index < 0 ) this.index = 0;
            }

            return this;
        }
    });

    return PageingScroller;
});
