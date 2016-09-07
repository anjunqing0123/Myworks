/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/shape/util/PathProxy", [ "../../tool/vector" ], function(require, exports, module) {
    /**
 * Path 代理，可以在`buildPath`中用于替代`ctx`, 会保存每个path操作的命令到pathCommands属性中
 * 可以用于 isInsidePath 判断以及获取boundingRect
 * 
 * @module zrender/shape/tool/PathProxy
 * @author pissang (http://www.github.com/pissang)
 * 
 * @example
 *     var SomeShape = function() {
 *         this._pathProxy = new PathProxy();
 *         ...
 *     }
 *     SomeShape.prototype.buildPath = function(ctx, style) {
 *         this._pathProxy.begin(ctx);
 *             .moveTo(style.x, style.y);
 *             .lineTo(style.x1, style.y1);
 *         ...
 *             .closePath();
 *     },
 *     SomeShape.prototype.getRect = function(style) {
 *         if (!style._rect) {
 *             // 这里必须要在 buildPath 之后才能调用
 *             style._rect = this._pathProxy.fastBoundingRect();
 *         }
 *         return this.style._rect;
 *     },
 *     SomeShape.prototype.isCover = function(x, y) {
 *         var rect = this.getRect(this.style);
 *         if (x >= rect.x
 *             && x <= (rect.x + rect.width)
 *             && y >= rect.y
 *             && y <= (rect.y + rect.height)
 *         ) {
 *             return area.isInsidePath(
 *                 this._pathProxy.pathCommands, 0, 'fill', x, y
 *             );
 *         }
 *     }
 */
    var vector = require("../../tool/vector");
    // var computeBoundingBox = require('../../tool/computeBoundingBox');
    var PathSegment = function(command, points) {
        this.command = command;
        this.points = points || null;
    };
    /**
     * @alias module:zrender/shape/tool/PathProxy
     * @constructor
     */
    var PathProxy = function() {
        /**
         * Path描述的数组，用于`isInsidePath`的判断
         * @type {Array.<Object>}
         */
        this.pathCommands = [];
        this._ctx = null;
        this._min = [];
        this._max = [];
    };
    /**
     * 快速计算Path包围盒（并不是最小包围盒）
     * @return {Object}
     */
    PathProxy.prototype.fastBoundingRect = function() {
        var min = this._min;
        var max = this._max;
        min[0] = min[1] = Infinity;
        max[0] = max[1] = -Infinity;
        for (var i = 0; i < this.pathCommands.length; i++) {
            var seg = this.pathCommands[i];
            var p = seg.points;
            switch (seg.command) {
              case "M":
                vector.min(min, min, p);
                vector.max(max, max, p);
                break;

              case "L":
                vector.min(min, min, p);
                vector.max(max, max, p);
                break;

              case "C":
                for (var j = 0; j < 6; j += 2) {
                    min[0] = Math.min(min[0], min[0], p[j]);
                    min[1] = Math.min(min[1], min[1], p[j + 1]);
                    max[0] = Math.max(max[0], max[0], p[j]);
                    max[1] = Math.max(max[1], max[1], p[j + 1]);
                }
                break;

              case "Q":
                for (var j = 0; j < 4; j += 2) {
                    min[0] = Math.min(min[0], min[0], p[j]);
                    min[1] = Math.min(min[1], min[1], p[j + 1]);
                    max[0] = Math.max(max[0], max[0], p[j]);
                    max[1] = Math.max(max[1], max[1], p[j + 1]);
                }
                break;

              case "A":
                var cx = p[0];
                var cy = p[1];
                var rx = p[2];
                var ry = p[3];
                min[0] = Math.min(min[0], min[0], cx - rx);
                min[1] = Math.min(min[1], min[1], cy - ry);
                max[0] = Math.max(max[0], max[0], cx + rx);
                max[1] = Math.max(max[1], max[1], cy + ry);
                break;
            }
        }
        return {
            x: min[0],
            y: min[1],
            width: max[0] - min[0],
            height: max[1] - min[1]
        };
    };
    /**
     * @param  {CanvasRenderingContext2D} ctx
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.begin = function(ctx) {
        this._ctx = ctx || null;
        // 清空pathCommands
        this.pathCommands.length = 0;
        return this;
    };
    /**
     * @param  {number} x
     * @param  {number} y
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.moveTo = function(x, y) {
        this.pathCommands.push(new PathSegment("M", [ x, y ]));
        if (this._ctx) {
            this._ctx.moveTo(x, y);
        }
        return this;
    };
    /**
     * @param  {number} x
     * @param  {number} y
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.lineTo = function(x, y) {
        this.pathCommands.push(new PathSegment("L", [ x, y ]));
        if (this._ctx) {
            this._ctx.lineTo(x, y);
        }
        return this;
    };
    /**
     * @param  {number} x1
     * @param  {number} y1
     * @param  {number} x2
     * @param  {number} y2
     * @param  {number} x3
     * @param  {number} y3
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
        this.pathCommands.push(new PathSegment("C", [ x1, y1, x2, y2, x3, y3 ]));
        if (this._ctx) {
            this._ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3);
        }
        return this;
    };
    /**
     * @param  {number} x1
     * @param  {number} y1
     * @param  {number} x2
     * @param  {number} y2
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.quadraticCurveTo = function(x1, y1, x2, y2) {
        this.pathCommands.push(new PathSegment("Q", [ x1, y1, x2, y2 ]));
        if (this._ctx) {
            this._ctx.quadraticCurveTo(x1, y1, x2, y2);
        }
        return this;
    };
    /**
     * @param  {number} cx
     * @param  {number} cy
     * @param  {number} r
     * @param  {number} startAngle
     * @param  {number} endAngle
     * @param  {boolean} anticlockwise
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.arc = function(cx, cy, r, startAngle, endAngle, anticlockwise) {
        this.pathCommands.push(new PathSegment("A", [ cx, cy, r, r, startAngle, endAngle - startAngle, 0, anticlockwise ? 0 : 1 ]));
        if (this._ctx) {
            this._ctx.arc(cx, cy, r, startAngle, endAngle, anticlockwise);
        }
        return this;
    };
    // TODO
    PathProxy.prototype.arcTo = function(x1, y1, x2, y2, radius) {
        if (this._ctx) {
            this._ctx.arcTo(x1, y1, x2, y2, radius);
        }
        return this;
    };
    // TODO
    PathProxy.prototype.rect = function(x, y, w, h) {
        if (this._ctx) {
            this._ctx.rect(x, y, w, h);
        }
        return this;
    };
    /**
     * @return {module:zrender/shape/util/PathProxy}
     */
    PathProxy.prototype.closePath = function() {
        this.pathCommands.push(new PathSegment("z"));
        if (this._ctx) {
            this._ctx.closePath();
        }
        return this;
    };
    /**
     * 是否没有Path命令
     * @return {boolean}
     */
    PathProxy.prototype.isEmpty = function() {
        return this.pathCommands.length === 0;
    };
    PathProxy.PathSegment = PathSegment;
    module.exports = PathProxy;
});

define("app/pc/canvaslib/tool/vector", [], function(require, exports, module) {
    var ArrayCtor = typeof Float32Array === "undefined" ? Array : Float32Array;
    /**
         * @typedef {Float32Array|Array.<number>} Vector2
         */
    /**
         * 二维向量类
         * @exports zrender/tool/vector
         */
    var vector = {
        /**
             * 创建一个向量
             * @param {number} [x=0]
             * @param {number} [y=0]
             * @return {Vector2}
             */
        create: function(x, y) {
            var out = new ArrayCtor(2);
            out[0] = x || 0;
            out[1] = y || 0;
            return out;
        },
        /**
             * 复制一个向量
             * @return {Vector2} out
             * @return {Vector2} v
             */
        copy: function(out, v) {
            out[0] = v[0];
            out[1] = v[1];
            return out;
        },
        /**
             * 设置向量的两个项
             * @param {Vector2} out
             * @param {number} a
             * @param {number} b
             * @return {Vector2} 结果
             */
        set: function(out, a, b) {
            out[0] = a;
            out[1] = b;
            return out;
        },
        /**
             * 向量相加
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        add: function(out, v1, v2) {
            out[0] = v1[0] + v2[0];
            out[1] = v1[1] + v2[1];
            return out;
        },
        /**
             * 向量缩放后相加
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @param {number} a
             */
        scaleAndAdd: function(out, v1, v2, a) {
            out[0] = v1[0] + v2[0] * a;
            out[1] = v1[1] + v2[1] * a;
            return out;
        },
        /**
             * 向量相减
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        sub: function(out, v1, v2) {
            out[0] = v1[0] - v2[0];
            out[1] = v1[1] - v2[1];
            return out;
        },
        /**
             * 向量长度
             * @param {Vector2} v
             * @return {number}
             */
        len: function(v) {
            return Math.sqrt(this.lenSquare(v));
        },
        /**
             * 向量长度平方
             * @param {Vector2} v
             * @return {number}
             */
        lenSquare: function(v) {
            return v[0] * v[0] + v[1] * v[1];
        },
        /**
             * 向量乘法
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        mul: function(out, v1, v2) {
            out[0] = v1[0] * v2[0];
            out[1] = v1[1] * v2[1];
            return out;
        },
        /**
             * 向量除法
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             */
        div: function(out, v1, v2) {
            out[0] = v1[0] / v2[0];
            out[1] = v1[1] / v2[1];
            return out;
        },
        /**
             * 向量点乘
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
        dot: function(v1, v2) {
            return v1[0] * v2[0] + v1[1] * v2[1];
        },
        /**
             * 向量缩放
             * @param {Vector2} out
             * @param {Vector2} v
             * @param {number} s
             */
        scale: function(out, v, s) {
            out[0] = v[0] * s;
            out[1] = v[1] * s;
            return out;
        },
        /**
             * 向量归一化
             * @param {Vector2} out
             * @param {Vector2} v
             */
        normalize: function(out, v) {
            var d = vector.len(v);
            if (d === 0) {
                out[0] = 0;
                out[1] = 0;
            } else {
                out[0] = v[0] / d;
                out[1] = v[1] / d;
            }
            return out;
        },
        /**
             * 计算向量间距离
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
        distance: function(v1, v2) {
            return Math.sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]));
        },
        /**
             * 向量距离平方
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @return {number}
             */
        distanceSquare: function(v1, v2) {
            return (v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]);
        },
        /**
             * 求负向量
             * @param {Vector2} out
             * @param {Vector2} v
             */
        negate: function(out, v) {
            out[0] = -v[0];
            out[1] = -v[1];
            return out;
        },
        /**
             * 插值两个点
             * @param {Vector2} out
             * @param {Vector2} v1
             * @param {Vector2} v2
             * @param {number} t
             */
        lerp: function(out, v1, v2, t) {
            // var ax = v1[0];
            // var ay = v1[1];
            out[0] = v1[0] + t * (v2[0] - v1[0]);
            out[1] = v1[1] + t * (v2[1] - v1[1]);
            return out;
        },
        /**
             * 矩阵左乘向量
             * @param {Vector2} out
             * @param {Vector2} v
             * @param {Vector2} m
             */
        applyTransform: function(out, v, m) {
            var x = v[0];
            var y = v[1];
            out[0] = m[0] * x + m[2] * y + m[4];
            out[1] = m[1] * x + m[3] * y + m[5];
            return out;
        },
        /**
             * 求两个向量最小值
             * @param  {Vector2} out
             * @param  {Vector2} v1
             * @param  {Vector2} v2
             */
        min: function(out, v1, v2) {
            out[0] = Math.min(v1[0], v2[0]);
            out[1] = Math.min(v1[1], v2[1]);
            return out;
        },
        /**
             * 求两个向量最大值
             * @param  {Vector2} out
             * @param  {Vector2} v1
             * @param  {Vector2} v2
             */
        max: function(out, v1, v2) {
            out[0] = Math.max(v1[0], v2[0]);
            out[1] = Math.max(v1[1], v2[1]);
            return out;
        }
    };
    vector.length = vector.len;
    vector.lengthSquare = vector.lenSquare;
    vector.dist = vector.distance;
    vector.distSquare = vector.distanceSquare;
    module.exports = vector;
});
