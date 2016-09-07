define(function (require) {

    var jq = require('jquery');

    var ua = navigator.userAgent;
    var android=ua.match(/(Android);?[\s\/]+([\d.]+)?/),
                ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
                ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/),
                iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
    var isTouchable = android||ipad||ipod||iphone;
    var _container;

    var PhotoSlide = function (container, ops) {
        this.ops = ops;
        this.pageCount = 0;
        this.selectedPageNum = 0;
        this.container = container;
        this.init();
    };

    PhotoSlide.prototype = {
        init: function () {

            var i, len, children,
                s = [],
                self = this,
                perTime = this.ops.perTime,
                showNum = this.ops.showNum,
                container = jq(this.container);

            this.outLayer = container.find(this.ops.outer);
            this.innerLayer = this.outLayer.find(this.ops.inner);
            this.preBtn = container.find(this.ops.pre);
            this.nextBtn = container.find(this.ops.next);
            this.btnsEl = container.find(this.ops.btns);

            if (container.length != 1 || this.outLayer.length != 1 || this.innerLayer.length != 1) {
                return;
            }

            children = this.innerLayer.children();
            this.size = children.length;

            if (this.size < 2) {
                this.preBtn && this.preBtn.length == 1 && (this.preBtn.addClass("no_pre"));
                this.nextBtn && this.nextBtn.length == 1 && (this.nextBtn.addClass("no_next"));
                return;
            }

            if (perTime > this.size || perTime < 1) {
                perTime = this.size;
                this.ops.perTime = perTime;
            }

            if (showNum > this.size || showNum <  perTime ) {
                showNum =  perTime;
            }

            this.pageCount = Math.ceil((this.size - showNum)/perTime) + 1;

            if (this.pageCount < 1) {
                return;
            }

            if (this.ops.direction === "vertical") {
                this.height = jq(children[1]).offset().top - jq(children[0]).offset().top;
                this.height = this.ops.height || this.height || jq(children[0]).height();
                this.innerLayer.css('height', this.height * this.size);
                this.outLayer.css('height', this.height * this.ops.showNum);
                this.height = this.height * perTime;
            } else {
                this.width = jq(children[1]).offset().left - jq(children[0]).offset().left;
                this.width = this.ops.width || this.width || jq(children[0]).width();
                this.innerLayer.css('width', this.width * this.size);
                this.outLayer.css('width', this.width * this.ops.showNum);
                this.width = this.width * perTime;
            }

            this.outLayer.css('overflow', 'hidden');

            if (this.btnsEl && this.btnsEl.length == 1) {
                if (this.ops.fillBtns) {
                    for (i = 0, len = this.pageCount; i < len; i++) {
                        s.push(['<a href="javascript:;">', i + 1, '</a>'].join(''));
                    }
                    this.btnsEl.html(s.join(''));
                }
                this.btns = this.btnsEl.children();

                this.btns.each(function (n) {
                    jq(this).bind(self.ops.btnTriggerEvent, function (e) {
                        e.preventDefault();
                        self.changePage(n);
                    });
                });
            }

            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.click( function (e) {
                    e.preventDefault();
                    self.changePage(self.selectedPageNum - 1);
                });
            }

            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.click( function (e) {
                    e.preventDefault();
                    self.changePage(self.selectedPageNum + 1);
                });
            }

            container.hover(
                function () {
                    self.stopAutoSwitch();
                },
                function () {
                    self.beginAutoSwitch();
                }
            );

            this.changePage(0);
            if (this.ops.autoSwitchTime > 0) {
                this.beginAutoSwitch();
            }
        },
        beginAutoSwitch: function () {

            if (this.ops.autoSwitchTime < 1 || this.pageCount < 2) {
                return;
            }

            clearInterval(this.sid);

            var self = this;
            this.sid = setInterval( function () {
                var pn = 0;
                if(self.selectedPageNum < self.pageCount - 1) {
                    pn = self.selectedPageNum + 1;
                }
                self.changePage(pn);
            }, this.ops.autoSwitchTime);
        },
        stopAutoSwitch: function () {
            clearInterval(this.sid);
        },
        changePage: function (ix) {

            if (ix < 0 || ix > this.pageCount - 1) {
                return;
            }

            if (this.btnsEl.length > 0) {
                this.btns.removeClass("now");
                this.btns[ix].className = 'now';
            }

            this.selectedPageNum = ix;
            this.ops.onChangePage.call(null, ix * this.ops.perTime);

            if (ix == 0) {
                this.preBtn && (this.preBtn.addClass("no_pre"));
            } else {
                this.preBtn && (this.preBtn.removeClass("no_pre"));
            }

            if (ix == this.pageCount - 1) {
                this.nextBtn && (this.nextBtn.addClass("no_next"));
            } else {
                this.nextBtn && (this.nextBtn.removeClass("no_next"));
            }

            if (this.ops.direction == 'horizontal') {
                this.innerLayer.animate({marginLeft: -(this.selectedPageNum * this.width)}, this.ops.duration);
            } else {
                this.innerLayer.animate({marginTop: -(this.selectedPageNum * this.height)}, this.ops.duration);
            }
        }
    };


    var PhotoSlide2 = function (container, ops) {
        this.ops = ops;
        this.firstIndex = 1;
        this.lastIndex = 0;
        this.container = container;

        this.init();
    };

    PhotoSlide2.prototype = {
        init: function () {

            var children,
                self = this,
                perTime = this.ops.perTime,
                showNum = this.ops.showNum,
                container = jq(this.container);

            this.outLayer = container.find(this.ops.outer);
            this.innerLayer = container.find(this.ops.inner);
            this.preBtn = container.find(this.ops.pre);
            this.nextBtn = container.find(this.ops.next);

            if (container.length != 1 || this.outLayer.length != 1 || this.innerLayer.length != 1){
                return;
            }

            children = this.innerLayer.children();
            this.size = children.length;

            if (this.size < 2) {
                this.lastIndex = this.size; //fix bug -> 当this.size为1时, nextBtn为不可点击
                this.checkPreNext();
                return;
            }

            if (perTime > this.size || perTime < 1) {
                perTime = this.size;
                this.ops.perTime = perTime;
            }

            /*if (showNum > this.size || showNum <  perTime ) {
                showNum =  perTime;
                this.ops.showNum = showNum;
            }*/

            if (this.ops.direction === "vertical") {
                this.height = jq(children[1]).offset().top - jq(children[0]).offset().top;
                this.height = this.ops.height || this.height || jq(children[0]).height();
                this.innerLayer.css('height', this.height * this.size);
                this.outLayer.css('height', this.height * showNum);
            } else {
                this.width = jq(children[1]).offset().left - jq(children[0]).offset().left;
                this.width = this.ops.width || this.width || jq(children[0]).width();
                this.innerLayer.css('width', this.width * this.size);
                this.outLayer.css('width', this.width * showNum);
            }

            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.bind('click', function(e) {
                    e.preventDefault();
                    self.chagePage(true);
                });
            }

            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.bind('click', function(e) {
                    e.preventDefault();
                    self.chagePage(false);
                });
            }

            this.outLayer.css('overflow', 'hidden');
            this.lastIndex = showNum;
            this.checkPreNext();

            container.hover(
                function () {
                    self.stopAutoSwitch();
                },
                function () {
                    self.beginAutoSwitch();
                }
            );

            if (this.ops.autoSwitchTime > 0) {
                this.beginAutoSwitch();
            }
        },
        beginAutoSwitch: function () {

            if (this.ops.autoSwitchTime < 1 || this.size <= this.ops.showNum) {
                return;
            }

            clearInterval(this.sid);

            var self = this;
            this.sid = setInterval( function () {

                if (self.lastIndex >= self.size) {
                    if (self.ops.direction == 'horizontal') {
                        self.innerLayer.animate({marginLeft: 0}, self.ops.duration);
                    } else {
                        self.innerLayer.animate({marginTop: 0}, self.ops.duration);
                    }
                    self.firstIndex = 1;
                    self.lastIndex = self.ops.showNum > self.size ? self.size : self.ops.showNum;
                    self.checkPreNext();
                    return;
                }
                self.chagePage(false);
            }, this.ops.autoSwitchTime);
        },
        stopAutoSwitch: function () {
            clearInterval(this.sid);
        },
        chagePage: function ( pre) {

            var count = this.ops.perTime;
            if (pre){
                if (this.firstIndex <= 1) {
                    return;
                }

                if (this.firstIndex - count >= 1) {
                    this.lastIndex = this.lastIndex - count;
                    this.firstIndex -= count;
                } else {
                    this.firstIndex = 1;
                    this.lastIndex = this.ops.showNum;
                }
            } else {
                if (this.lastIndex >= this.size) {
                    return;
                }

                if (this.lastIndex + count < this.size) {
                    this.firstIndex += count;
                    this.lastIndex += count;

                } else {
                    this.lastIndex = this.size;
                    this.firstIndex = this.lastIndex - this.ops.showNum + 1;
                }
            }

            if (this.ops.direction == 'horizontal') {
                this.innerLayer.animate({marginLeft: (-(this.firstIndex - 1) * this.width)}, this.ops.duration);
            } else {
                this.innerLayer.animate({marginTop: (-(this.firstIndex - 1) * this.height)}, this.ops.duration);
            }

            this.checkPreNext();
            this.ops.onChangePage.call(null, this.firstIndex - 1);
        },
        checkPreNext: function () {
            this.firstIndex <= 1 ? this.preBtn.addClass('no_pre') : this.preBtn.removeClass('no_pre');
            this.lastIndex >= this.size ? this.nextBtn.addClass('no_next') : this.nextBtn.removeClass('no_next');
        }
    };


    var PhotoSlide3 = function (container, ops) {
        this.ops = ops;
        this.firstIndex = 1;
        this.changed = true;
        this.container = container;
        this.init();
    };


    //todo: 无限循环模式目前暂不支持纵向和分页按钮

    PhotoSlide3.prototype = {
        init: function () {

            var i, l, cloneNode,
                s = [],
                self = this,
                showNum = this.ops.showNum,
                perTime = this.ops.perTime,
                container = jq(this.container);


            this.selectedPageIndex = 1;
            this.outLayer = container.find(this.ops.outer);
            this.innerLayer = container.find(this.ops.inner);
            this.preBtn = container.find(this.ops.pre);
            this.nextBtn = container.find(this.ops.next);
            this.btnsEl = container.find(this.ops.btns);
            this.pageCount = Math.ceil(this.innerLayer.children().length/ showNum);
            this.container = container;

            if (container.length != 1 || this.outLayer.length != 1 || this.innerLayer.length != 1){
                return;
            }

            this.children = this.innerLayer.children();

            this.size = this.children.length;

            if (this.ops.perTime > this.size){
                this.ops.perTime = this.size;
            }
            if(showNum>this.size||this.size < 2 || this.ops.perTime < 1){
                return;
            }
            if (showNum < 1 || showNum < this.ops.perTime) {
                this.ops.showNum = this.ops.perTime;
                showNum = this.ops.showNum;
            }

            if (this.btnsEl && this.btnsEl.length == 1 && (this.size - showNum) % this.ops.perTime == 0) {

                if (this.ops.fillBtns) {
                    this.pageCount = (this.size - showNum) / this.ops.perTime + 1;
                    this.page = 0;
                    for (i = 0, len = this.pageCount; i < len; i++) {
                        s.push(['<a href="javascript:;">', i + 1, '</a>'].join(''));
                    }
                    this.btnsEl.html(s.join(''));
                }
                this.btns = this.btnsEl.children();

                var finish = true;

                this.btns.each(function (n) {
                    jq(this).bind(self.ops.btnTriggerEvent, function (e) {
                        e.preventDefault();
                        if (!finish) {
                            return;
                        }

                        var pre = Math.abs(len - n + self.page) % len,
                            next = Math.abs(len + n - self.page) % len,
                            min = next > pre ? pre : next,
                            flag = next > pre ? true : false;
                            speed = self.speed;

                        if (min) {
                            finish = false;
                            self.speed = parseInt(self.speed / min, 10);
                            min--;
                            self.chagePage(flag);
                            jq(self).bind('onOneSlideEnd', function(e){
                                if (min > 0) {
                                    self.chagePage(flag);
                                } else {
                                    jq(self).unbind('onOneSlideEnd');
                                    self.speed = speed;
                                    finish = true;
                                }
                                min--;
                            });
                        }
                    });
                });
            }
            this.preBtnFunction = function(e){
                e.preventDefault();
                self.changed = false;
                self.chagePage(true);
            }
            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.bind('click', this.preBtnFunction);
            }

            this.nextBtnFunction = function(e){
                e.preventDefault();
                self.changed = false;
                self.chagePage(false);
            }
            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.bind('click', this.nextBtnFunction);
            }

            //新增，如果传递'oreder:asc'则在最后一页的前面补齐空白，否则在后面
            if(this.ops.order == 'asc'){
                var num = this.size - (this.pageCount-1)*showNum;
                for(var i=0;num<showNum;num++,i++){
                    var prePageLast =this.children[(this.pageCount-1)*showNum-1];
                    var cloneNode = this.children[(this.pageCount-1)*showNum-i-1];
                    jq(prePageLast).after(cloneNode.cloneNode(true));
                }
            }else{
                //补齐最后一页的空白
                for (var i = this.children.length, len = this.pageCount * showNum, j=0; i < len; i++) {
                    this.innerLayer.append(this.children[j++].cloneNode(true));
                }
            }

            //当页数只有一页的时候，不进行页面元素的添加
			if(this.pageCount>1){
                this.children = this.innerLayer.children();
                //头上添加最后一页，尾部添加第一页
                for (var i = 0, len = perTime,length = this.children.length; i < len; i++) {
                    this.innerLayer.prepend(this.children[length-i-1].cloneNode(true));
                }
                for (var i = 0, len = perTime; i < len; i++) {
                    this.innerLayer.append(this.children[i].cloneNode(true));
                }

                this.size = this.innerLayer.children().length;

                if (this.ops.direction === "vertical") {
                    this.height = jq(this.children[1]).offset().top - jq(this.children[0]).offset().top;
                    this.height = this.ops.height || this.height || jq(this.children[0]).height();
                    this.innerLayer.css('height', this.height * this.size * 2);
                    this.outLayer.css('height', this.height * showNum);
                } else {
                    this.width = jq(this.children[1]).offset().left - jq(this.children[0]).offset().left;
                    this.width = this.ops.width || this.width || jq(this.children[0]).width();
                    this.innerLayer.css('width', this.width * this.size);
                    this.outLayer.css('width', this.width * showNum);
                    //如果设置了指定页面，则显示指定页面
                    if(this.ops.showPageCount && this.ops.showPageCount<=this.pageCount&&this.ops.showPageCount>=1){
                        this.innerLayer.css('margin-left', -this.width*perTime*(this.ops.showPageCount));
                        this.selectedPageIndex = this.ops.showPageCount;
                    }else{
                        this.innerLayer.css('margin-left', -this.width*perTime);
                    }
                }
            }

            this.children = this.innerLayer.children();
            this.outLayer.css('overflow', 'hidden');
            this.containerFunction = function(){

            }

            this.containerEnter = function(){
                self.stopAutoSwitch();
            }
            this.containerLeave = function(){
                self.beginAutoSwitch();
            }

            container.hover(
               this.containerEnter,
               this.containerLeave
            );

            switch ( this.ops.duration){
                case 'slow':
                    this.speed = 3000;
                    break;
                case 'normal':
                    this.speed = 500;
                    break;
                case 'fast':
                    this.speed = 200;
                    break;
                default:
                    this.speed = parseInt(this.ops.duration, 10);
                    if(isNaN(this.speed) || this.speed < 1){
                        return;
                    }
                    break;
            }

            if (this.speed  > this.ops.autoSwitchTime) {
                return;
            }

            if(this.ops.autoSwitchTime){
                this.beginAutoSwitch();
            }

            if(isTouchable){
                this.enableTouch();
            }

        },
        enableTouch:function(){
            var self = this;
            var count = this.pageCount;
            this.container.swipeLeft(function(){
                self.chagePage(false);
            })
            this.container.swipeRight(function(){
                self.chagePage(true);
            })
        }
        ,
        beginAutoSwitch: function () {

            if (this.ops.autoSwitchTime < 1 || this.size <= this.ops.showNum) {
                return;
            }
            clearInterval(this.sid);
            var self = this;

            this.sid = setInterval( function () {
                self.chagePage(false);
            }, this.ops.autoSwitchTime);
        },
        stopAutoSwitch: function () {
            clearInterval(this.sid);
        },
        chagePage: function ( pre) {
            var self = this;
            if(self.animating) return;
            var margin = 0,
                flag = false,
                stop=false;

            if(pre){
                this.selectedPageIndex -= 1;
                // if (!jq(this.children[this.firstIndex - 1 + this.ops.showNum]).data('clone')){
                    // margin = -(this.firstIndex - 1 + this.size) ;
                    // this.firstIndex += this.size;
                    // flag = true;
                // }
                // this.firstIndex -= this.ops.perTime;
                // if (this.pageCount > 1) {
                    // this.page = (this.page + this.pageCount - 1) % this.pageCount;
                // }
            }else{
                this.selectedPageIndex += 1;
                // if (jq(this.children[this.firstIndex - 1]).data('clone')) {
                    // margin = this.firstIndex - 1 - this.size;
                    // this.firstIndex -= this.size;
                    // flag = true;
                // }
                // this.firstIndex += this.ops.perTime;
                // if (this.pageCount > 1) {
                    // this.page = (this.page + 1) % this.pageCount;
                // }
            }

            if (this.pageCount > 1&&this.btns) {
                this.btns.removeClass('now');
                jq(this.btns[this.page]).addClass('now');
            }

            if (this.ops.direction == 'horizontal') {
                if (this.selectedPageIndex == this.pageCount+1) {
                    this.innerLayer.css('margin-left', 0);
                    this.selectedPageIndex = 1;
                }
                else if(this.selectedPageIndex ==0){
                    this.innerLayer.css("margin-left",-this.width*this.ops.showNum*(this.pageCount+1));
                    this.selectedPageIndex =this.pageCount;
                }
                self.animating =true;
                this.innerLayer.animate({'margin-left':-this.selectedPageIndex* this.width*this.ops.showNum},500,function(){
                    self.animating =false;
                });
            } else {
                // if (flag) {
                    // this.innerLayer.css('margin-top', margin * this.height);
                // }
                // this.animate('margin-top', -(this.firstIndex - 1) * this.height);
            }

            this.ops.onChangePage.call(null, this.firstIndex - 1);
        },
        destroy:function(){
            //解除已绑定的事件
            if (this.preBtn && this.preBtn.length == 1) {
                this.preBtn.unbind('click',this.preBtnFunction);
            }
            if (this.nextBtn && this.nextBtn.length == 1) {
                this.nextBtn.unbind('click',this.nextBtnFunction);
            }
            this.container.unbind('mouseenter',this.containerEnter);
            this.container.unbind('mouseleave',this.containerLeave);

            //恢复inner子元素的个数
            if(this.pageCount>1){
                this.children[0].remove();
                this.children[this.children.length-1].remove();
            }
        }
    };




    function init (containers, ops) {
        this.ops = {
            btnTriggerEvent: 'click', //切换按钮触发事件
            autoSwitchTime: 5000, //自动切换频率时间,小于1为不自动切换
            direction: 'horizontal', //横向or竖向    horizontal|vertical
            onChangePage: function(){},
            perTime: 1, //每次翻几张
            showNum: 1, //默认显示几张
            fillBtns: true,
            blank: true,
            loop: false,
            width: null,
            height: null,
            outer: '.pics',
            inner: '.picsMove',
            pre: '.pre',
            next: '.next',
            btns: '.btns',
            duration: 'slow',
            display : 'block'
        };

        jq.extend(this.ops, ops);

        _container = containers;
        var obj = this.ops.onChangePage;
        if(!(obj && obj.constructor && obj.call && obj.apply)){
            this.ops.onChangePage = function () {};
        }
        var ps ;

        if(containers && containers.length == 1){
            if(this.ops.display == 'block'){
                jq(containers).css('display', this.ops.display);
            }
            if (this.ops.loop) {
              ps = new PhotoSlide3(containers, this.ops);
            } else if (!this.ops.blank) {
              ps =  new PhotoSlide2(containers, this.ops);
            } else {
              ps =   new PhotoSlide(containers, this.ops);
            }
        }
        if(containers && containers.length > 1){
            for(var i=0,l=containers.length; i<l; i++){
                jq(containers[i]).css('display', 'block');
                if (this.ops.loop) {
                    ps = new PhotoSlide3(containers, this.ops);
                } else if (!this.ops.blank) {
                    ps = new PhotoSlide2(containers, this.ops);
                } else {
                   ps = new PhotoSlide(containers[i], this.ops);
                }
            }
        }
        return ps;
    }

    //添加手势支持库 zepto_touch.js
    if(isTouchable){
    (function($){
        var touch = {},
            touchTimeout, tapTimeout, swipeTimeout, longTapTimeout,
            longTapDelay = 750,
            gesture

        function swipeDirection(x1, x2, y1, y2) {
            return Math.abs(x1 - x2) >=
                Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down')
        }

        function longTap() {
            longTapTimeout = null
            if (touch.last) {
                touch.el.trigger('longTap')
                touch = {}
            }
        }

        function cancelLongTap() {
            if (longTapTimeout) clearTimeout(longTapTimeout)
            longTapTimeout = null
        }

        function cancelAll() {
            if (touchTimeout) clearTimeout(touchTimeout)
            if (tapTimeout) clearTimeout(tapTimeout)
            if (swipeTimeout) clearTimeout(swipeTimeout)
            if (longTapTimeout) clearTimeout(longTapTimeout)
            touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null
            touch = {}
        }

        function isPrimaryTouch(event){
            return (event.pointerType == 'touch' ||
                event.pointerType == event.MSPOINTER_TYPE_TOUCH)
                && event.isPrimary
        }

        function isPointerEventType(e, type){
            return (e.type == 'pointer'+type ||
                e.type.toLowerCase() == 'mspointer'+type)
        }

        $(document).ready(function(){
            var now, delta, deltaX = 0, deltaY = 0, firstTouch, _isPointerType

            if ('MSGesture' in window) {
                gesture = new MSGesture()
                gesture.target = document.body
            }

            _container
                .bind('MSGestureEnd', function(e){
                    var swipeDirectionFromVelocity =
                        e.velocityX > 1 ? 'Right' : e.velocityX < -1 ? 'Left' : e.velocityY > 1 ? 'Down' : e.velocityY < -1 ? 'Up' : null;
                    if (swipeDirectionFromVelocity) {
                        touch.el.trigger('swipe')
                        touch.el.trigger('swipe'+ swipeDirectionFromVelocity)
                    }
                })
                .on('touchstart MSPointerDown pointerdown', function(e){
                    e=e.originalEvent;
                    if((_isPointerType = isPointerEventType(e, 'down')) &&
                        !isPrimaryTouch(e)) return
                    firstTouch = _isPointerType ? e : e.touches[0]
                    if (e.touches && e.touches.length === 1 && touch.x2) {
                        // Clear out touch movement data if we have it sticking around
                        // This can occur if touchcancel doesn't fire due to preventDefault, etc.
                        touch.x2 = undefined
                        touch.y2 = undefined
                    }
                    now = Date.now()
                    delta = now - (touch.last || now)
                    touch.el = $('tagName' in firstTouch.target ?
                        firstTouch.target : firstTouch.target.parentNode)
                    touchTimeout && clearTimeout(touchTimeout)
                    touch.x1 = firstTouch.pageX
                    touch.y1 = firstTouch.pageY
                    if (delta > 0 && delta <= 250) touch.isDoubleTap = true
                    touch.last = now
                    longTapTimeout = setTimeout(longTap, longTapDelay)
                    // adds the current touch contact for IE gesture recognition
                    if (gesture && _isPointerType) gesture.addPointer(e.pointerId);
                })
                .on('touchmove MSPointerMove pointermove', function(e){
                    e=e.originalEvent;
                    if((_isPointerType = isPointerEventType(e, 'move')) &&
                        !isPrimaryTouch(e)) return
                    firstTouch = _isPointerType ? e : e.touches[0]
                    cancelLongTap()
                    touch.x2 = firstTouch.pageX
                    touch.y2 = firstTouch.pageY

                    deltaX += Math.abs(touch.x1 - touch.x2)
                    deltaY += Math.abs(touch.y1 - touch.y2)
                })
                .on('touchend MSPointerUp pointerup', function(e){
                    e=e.originalEvent;
                    if((_isPointerType = isPointerEventType(e, 'up')) &&
                        !isPrimaryTouch(e)) return
                    cancelLongTap()

                    // swipe
                    if ((touch.x2 && Math.abs(touch.x1 - touch.x2) > 30) ||
                        (touch.y2 && Math.abs(touch.y1 - touch.y2) > 30))

                        swipeTimeout = setTimeout(function() {
                            touch.el.trigger('swipe')
                            touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)))
                            touch = {}
                        }, 0)

                    // normal tap
                    else if ('last' in touch)
                    // don't fire tap when delta position changed by more than 30 pixels,
                    // for instance when moving to a point and back to origin
                        if (deltaX < 30 && deltaY < 30) {
                            // delay by one tick so we can cancel the 'tap' event if 'scroll' fires
                            // ('tap' fires before 'scroll')
                            tapTimeout = setTimeout(function() {

                                // trigger universal 'tap' with the option to cancelTouch()
                                // (cancelTouch cancels processing of single vs double taps for faster 'tap' response)
                                var event = $.Event('tap')
                                event.cancelTouch = cancelAll
                                touch.el.trigger(event)

                                // trigger double tap immediately
                                if (touch.isDoubleTap) {
                                    if (touch.el) touch.el.trigger('doubleTap')
                                    touch = {}
                                }

                                // trigger single tap after 250ms of inactivity
                                else {
                                    touchTimeout = setTimeout(function(){
                                        touchTimeout = null
                                        if (touch.el) touch.el.trigger('singleTap')
                                        touch = {}
                                    }, 250)
                                }
                            }, 0)
                        } else {
                            touch = {}
                        }
                    deltaX = deltaY = 0

                })
                // when the browser window loses focus,
                // for example when a modal dialog is shown,
                // cancel all ongoing events
                .on('touchcancel MSPointerCancel pointercancel', cancelAll)

            // scrolling the window indicates intention of the user
            // to scroll, not tap or swipe, so cancel all ongoing events
            $(window).on('scroll', cancelAll)
        });
        if(typeof [].forEach=="function"){
         ['swipe', 'swipeLeft', 'swipeRight', 'swipeUp', 'swipeDown',
            'doubleTap', 'tap', 'singleTap', 'longTap'].forEach(function(eventName){
                $.fn[eventName] = function(callback){ return this.on(eventName, callback) }
            })
        }

    })(jq);
    }

    return {
        init : init
    };
});
