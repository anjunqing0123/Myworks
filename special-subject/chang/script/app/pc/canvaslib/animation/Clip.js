/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/animation/Clip", [ "./easing" ], function(require, exports, module) {
    /**
 * 动画主控制器
 * @config target 动画对象，可以是数组，如果是数组的话会批量分发onframe等事件
 * @config life(1000) 动画时长
 * @config delay(0) 动画延迟时间
 * @config loop(true)
 * @config gap(0) 循环的间隔时间
 * @config onframe
 * @config easing(optional)
 * @config ondestroy(optional)
 * @config onrestart(optional)
 */
    var Easing = require("./easing");
    function Clip(options) {
        this._targetPool = options.target || {};
        if (!(this._targetPool instanceof Array)) {
            this._targetPool = [ this._targetPool ];
        }
        // 生命周期
        this._life = options.life || 1e3;
        // 延时
        this._delay = options.delay || 0;
        // 开始时间
        this._startTime = new Date().getTime() + this._delay;
        // 单位毫秒
        // 结束时间
        this._endTime = this._startTime + this._life * 1e3;
        // 是否循环
        this.loop = typeof options.loop == "undefined" ? false : options.loop;
        this.gap = options.gap || 0;
        this.easing = options.easing || "Linear";
        this.onframe = options.onframe;
        this.ondestroy = options.ondestroy;
        this.onrestart = options.onrestart;
    }
    Clip.prototype = {
        step: function(time) {
            var percent = (time - this._startTime) / this._life;
            // 还没开始
            if (percent < 0) {
                return;
            }
            percent = Math.min(percent, 1);
            var easingFunc = typeof this.easing == "string" ? Easing[this.easing] : this.easing;
            var schedule = typeof easingFunc === "function" ? easingFunc(percent) : percent;
            this.fire("frame", schedule);
            // 结束
            if (percent == 1) {
                if (this.loop) {
                    this.restart();
                    // 重新开始周期
                    // 抛出而不是直接调用事件直到 stage.update 后再统一调用这些事件
                    return "restart";
                }
                // 动画完成将这个控制器标识为待删除
                // 在Animation.update中进行批量删除
                this._needsRemove = true;
                return "destroy";
            }
            return null;
        },
        restart: function() {
            var time = new Date().getTime();
            var remainder = (time - this._startTime) % this._life;
            this._startTime = new Date().getTime() - remainder + this.gap;
            this._needsRemove = false;
        },
        fire: function(eventType, arg) {
            for (var i = 0, len = this._targetPool.length; i < len; i++) {
                if (this["on" + eventType]) {
                    this["on" + eventType](this._targetPool[i], arg);
                }
            }
        },
        constructor: Clip
    };
    module.exports = Clip;
});

define("app/pc/canvaslib/animation/easing", [], function(require, exports, module) {
    /**
         * 缓动代码来自 https://github.com/sole/tween.js/blob/master/src/Tween.js
         * @see http://sole.github.io/tween.js/examples/03_graphs.html
         * @exports zrender/animation/easing
         */
    var easing = {
        // 线性
        /**
             * @param {number} k
             * @return {number}
             */
        Linear: function(k) {
            return k;
        },
        // 二次方的缓动（t^2）
        /**
             * @param {number} k
             * @return {number}
             */
        QuadraticIn: function(k) {
            return k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuadraticOut: function(k) {
            return k * (2 - k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuadraticInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k;
            }
            return -.5 * (--k * (k - 2) - 1);
        },
        // 三次方的缓动（t^3）
        /**
             * @param {number} k
             * @return {number}
             */
        CubicIn: function(k) {
            return k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CubicOut: function(k) {
            return --k * k * k + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CubicInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k * k;
            }
            return .5 * ((k -= 2) * k * k + 2);
        },
        // 四次方的缓动（t^4）
        /**
             * @param {number} k
             * @return {number}
             */
        QuarticIn: function(k) {
            return k * k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuarticOut: function(k) {
            return 1 - --k * k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuarticInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k * k * k;
            }
            return -.5 * ((k -= 2) * k * k * k - 2);
        },
        // 五次方的缓动（t^5）
        /**
             * @param {number} k
             * @return {number}
             */
        QuinticIn: function(k) {
            return k * k * k * k * k;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuinticOut: function(k) {
            return --k * k * k * k * k + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        QuinticInOut: function(k) {
            if ((k *= 2) < 1) {
                return .5 * k * k * k * k * k;
            }
            return .5 * ((k -= 2) * k * k * k * k + 2);
        },
        // 正弦曲线的缓动（sin(t)）
        /**
             * @param {number} k
             * @return {number}
             */
        SinusoidalIn: function(k) {
            return 1 - Math.cos(k * Math.PI / 2);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        SinusoidalOut: function(k) {
            return Math.sin(k * Math.PI / 2);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        SinusoidalInOut: function(k) {
            return .5 * (1 - Math.cos(Math.PI * k));
        },
        // 指数曲线的缓动（2^t）
        /**
             * @param {number} k
             * @return {number}
             */
        ExponentialIn: function(k) {
            return k === 0 ? 0 : Math.pow(1024, k - 1);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ExponentialOut: function(k) {
            return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ExponentialInOut: function(k) {
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if ((k *= 2) < 1) {
                return .5 * Math.pow(1024, k - 1);
            }
            return .5 * (-Math.pow(2, -10 * (k - 1)) + 2);
        },
        // 圆形曲线的缓动（sqrt(1-t^2)）
        /**
             * @param {number} k
             * @return {number}
             */
        CircularIn: function(k) {
            return 1 - Math.sqrt(1 - k * k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CircularOut: function(k) {
            return Math.sqrt(1 - --k * k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        CircularInOut: function(k) {
            if ((k *= 2) < 1) {
                return -.5 * (Math.sqrt(1 - k * k) - 1);
            }
            return .5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
        },
        // 创建类似于弹簧在停止前来回振荡的动画
        /**
             * @param {number} k
             * @return {number}
             */
        ElasticIn: function(k) {
            var s;
            var a = .1;
            var p = .4;
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * 2 * Math.PI / p));
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ElasticOut: function(k) {
            var s;
            var a = .1;
            var p = .4;
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            return a * Math.pow(2, -10 * k) * Math.sin((k - s) * 2 * Math.PI / p) + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        ElasticInOut: function(k) {
            var s;
            var a = .1;
            var p = .4;
            if (k === 0) {
                return 0;
            }
            if (k === 1) {
                return 1;
            }
            if (!a || a < 1) {
                a = 1;
                s = p / 4;
            } else {
                s = p * Math.asin(1 / a) / (2 * Math.PI);
            }
            if ((k *= 2) < 1) {
                return -.5 * a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * 2 * Math.PI / p);
            }
            return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * 2 * Math.PI / p) * .5 + 1;
        },
        // 在某一动画开始沿指示的路径进行动画处理前稍稍收回该动画的移动
        /**
             * @param {number} k
             * @return {number}
             */
        BackIn: function(k) {
            var s = 1.70158;
            return k * k * ((s + 1) * k - s);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BackOut: function(k) {
            var s = 1.70158;
            return --k * k * ((s + 1) * k + s) + 1;
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BackInOut: function(k) {
            var s = 1.70158 * 1.525;
            if ((k *= 2) < 1) {
                return .5 * k * k * ((s + 1) * k - s);
            }
            return .5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
        },
        // 创建弹跳效果
        /**
             * @param {number} k
             * @return {number}
             */
        BounceIn: function(k) {
            return 1 - easing.BounceOut(1 - k);
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BounceOut: function(k) {
            if (k < 1 / 2.75) {
                return 7.5625 * k * k;
            } else if (k < 2 / 2.75) {
                return 7.5625 * (k -= 1.5 / 2.75) * k + .75;
            } else if (k < 2.5 / 2.75) {
                return 7.5625 * (k -= 2.25 / 2.75) * k + .9375;
            } else {
                return 7.5625 * (k -= 2.625 / 2.75) * k + .984375;
            }
        },
        /**
             * @param {number} k
             * @return {number}
             */
        BounceInOut: function(k) {
            if (k < .5) {
                return easing.BounceIn(k * 2) * .5;
            }
            return easing.BounceOut(k * 2 - 1) * .5 + .5;
        }
    };
    module.exports = easing;
});
