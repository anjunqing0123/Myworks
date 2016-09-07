/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/tool/area", [ "./util", "../dep/excanvas", "./curve", "./vector" ], function(require, exports, module) {
    /**
 * zrender: 图形空间辅助类
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang (https://www.github.com/pissang)
 *
 * isInside：是否在区域内部
 * isOutside：是否在区域外部
 * getTextWidth：测算单行文本宽度
 */
    "use strict";
    var util = require("./util");
    var curve = require("./curve");
    var _ctx;
    var _textWidthCache = {};
    var _textHeightCache = {};
    var _textWidthCacheCounter = 0;
    var _textHeightCacheCounter = 0;
    var TEXT_CACHE_MAX = 5e3;
    var PI2 = Math.PI * 2;
    function normalizeRadian(angle) {
        angle %= PI2;
        if (angle < 0) {
            angle += PI2;
        }
        return angle;
    }
    /**
         * 包含判断
         *
         * @param {Object} shape : 图形
         * @param {Object} area ： 目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         */
    function isInside(shape, area, x, y) {
        if (!area || !shape) {
            // 无参数或不支持类型
            return false;
        }
        var zoneType = shape.type;
        _ctx = _ctx || util.getContext();
        // 未实现或不可用时(excanvas不支持)则数学运算，主要是line，brokenLine，ring
        var _mathReturn = _mathMethod(shape, area, x, y);
        if (typeof _mathReturn != "undefined") {
            return _mathReturn;
        }
        if (shape.buildPath && _ctx.isPointInPath) {
            return _buildPathMethod(shape, _ctx, area, x, y);
        }
        // 上面的方法都行不通时
        switch (zoneType) {
          case "ellipse":
            // Todo，不精确
            return true;

          // 旋轮曲线  不准确
            case "trochoid":
            var _r = area.location == "out" ? area.r1 + area.r2 + area.d : area.r1 - area.r2 + area.d;
            return isInsideCircle(area, x, y, _r);

          // 玫瑰线 不准确
            case "rose":
            return isInsideCircle(area, x, y, area.maxr);

          // 路径，椭圆，曲线等-----------------13
            default:
            return false;
        }
    }
    /**
         * 用数学方法判断，三个方法中最快，但是支持的shape少
         *
         * @param {Object} shape : 图形
         * @param {Object} area ：目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         * @return {boolean=} true表示坐标处在图形中
         */
    function _mathMethod(shape, area, x, y) {
        var zoneType = shape.type;
        // 在矩形内则部分图形需要进一步判断
        switch (zoneType) {
          // 贝塞尔曲线
            case "bezier-curve":
            if (typeof area.cpX2 === "undefined") {
                return isInsideQuadraticStroke(area.xStart, area.yStart, area.cpX1, area.cpY1, area.xEnd, area.yEnd, area.lineWidth, x, y);
            }
            return isInsideCubicStroke(area.xStart, area.yStart, area.cpX1, area.cpY1, area.cpX2, area.cpY2, area.xEnd, area.yEnd, area.lineWidth, x, y);

          // 线
            case "line":
            return isInsideLine(area.xStart, area.yStart, area.xEnd, area.yEnd, area.lineWidth, x, y);

          // 折线
            case "broken-line":
            return isInsideBrokenLine(area.pointList, area.lineWidth, x, y);

          // 圆环
            case "ring":
            return isInsideRing(area.x, area.y, area.r0, area.r, x, y);

          // 圆形
            case "circle":
            return isInsideCircle(area.x, area.y, area.r, x, y);

          // 扇形
            case "sector":
            var startAngle = area.startAngle * Math.PI / 180;
            var endAngle = area.endAngle * Math.PI / 180;
            if (!area.clockWise) {
                startAngle = -startAngle;
                endAngle = -endAngle;
            }
            return isInsideSector(area.x, area.y, area.r0, area.r, startAngle, endAngle, !area.clockWise, x, y);

          // 多边形
            case "path":
            return isInsidePath(area.pathArray, Math.max(area.lineWidth, 5), area.brushType, x, y);

          case "polygon":
          case "star":
          case "isogon":
            return isInsidePolygon(area.pointList, x, y);

          // 文本
            case "text":
            var rect = area.__rect || shape.getRect(area);
            return isInsideRect(rect.x, rect.y, rect.width, rect.height, x, y);

          // 矩形
            case "rectangle":
          // 图片
            case "image":
            return isInsideRect(area.x, area.y, area.width, area.height, x, y);
        }
    }
    /**
         * 通过buildPath方法来判断，三个方法中较快，但是不支持线条类型的shape，
         * 而且excanvas不支持isPointInPath方法
         *
         * @param {Object} shape ： shape
         * @param {Object} context : 上下文
         * @param {Object} area ：目标区域
         * @param {number} x ： 横坐标
         * @param {number} y ： 纵坐标
         * @return {boolean} true表示坐标处在图形中
         */
    function _buildPathMethod(shape, context, area, x, y) {
        // 图形类实现路径创建了则用类的path
        context.beginPath();
        shape.buildPath(context, area);
        context.closePath();
        return context.isPointInPath(x, y);
    }
    /**
         * !isInside
         */
    function isOutside(shape, area, x, y) {
        return !isInside(shape, area, x, y);
    }
    /**
         * 线段包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
    function isInsideLine(x0, y0, x1, y1, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        var _a = 0;
        var _b = x0;
        // Quick reject
        if (y > y0 + _l && y > y1 + _l || y < y0 - _l && y < y1 - _l || x > x0 + _l && x > x1 + _l || x < x0 - _l && x < x1 - _l) {
            return false;
        }
        if (x0 !== x1) {
            _a = (y0 - y1) / (x0 - x1);
            _b = (x0 * y1 - x1 * y0) / (x0 - x1);
        } else {
            return Math.abs(x - x0) <= _l / 2;
        }
        var tmp = _a * x - y + _b;
        var _s = tmp * tmp / (_a * _a + 1);
        return _s <= _l / 2 * _l / 2;
    }
    /**
         * 三次贝塞尔曲线描边包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  x2
         * @param  {number}  y2
         * @param  {number}  x3
         * @param  {number}  y3
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
    function isInsideCubicStroke(x0, y0, x1, y1, x2, y2, x3, y3, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        // Quick reject
        if (y > y0 + _l && y > y1 + _l && y > y2 + _l && y > y3 + _l || y < y0 - _l && y < y1 - _l && y < y2 - _l && y < y3 - _l || x > x0 + _l && x > x1 + _l && x > x2 + _l && x > x3 + _l || x < x0 - _l && x < x1 - _l && x < x2 - _l && x < x3 - _l) {
            return false;
        }
        var d = curve.cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, null);
        return d <= _l / 2;
    }
    /**
         * 二次贝塞尔曲线描边包含判断
         * @param  {number}  x0
         * @param  {number}  y0
         * @param  {number}  x1
         * @param  {number}  y1
         * @param  {number}  x2
         * @param  {number}  y2
         * @param  {number}  lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {boolean}
         */
    function isInsideQuadraticStroke(x0, y0, x1, y1, x2, y2, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        // Quick reject
        if (y > y0 + _l && y > y1 + _l && y > y2 + _l || y < y0 - _l && y < y1 - _l && y < y2 - _l || x > x0 + _l && x > x1 + _l && x > x2 + _l || x < x0 - _l && x < x1 - _l && x < x2 - _l) {
            return false;
        }
        var d = curve.quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, null);
        return d <= _l / 2;
    }
    /**
         * 圆弧描边包含判断
         * @param  {number}  cx
         * @param  {number}  cy
         * @param  {number}  r
         * @param  {number}  startAngle
         * @param  {number}  endAngle
         * @param  {boolean}  anticlockwise
         * @param  {number} lineWidth
         * @param  {number}  x
         * @param  {number}  y
         * @return {Boolean}
         */
    function isInsideArcStroke(cx, cy, r, startAngle, endAngle, anticlockwise, lineWidth, x, y) {
        if (lineWidth === 0) {
            return false;
        }
        var _l = Math.max(lineWidth, 5);
        x -= cx;
        y -= cy;
        var d = Math.sqrt(x * x + y * y);
        if (d - _l > r || d + _l < r) {
            return false;
        }
        if (Math.abs(startAngle - endAngle) >= PI2) {
            // Is a circle
            return true;
        }
        if (anticlockwise) {
            var tmp = startAngle;
            startAngle = normalizeRadian(endAngle);
            endAngle = normalizeRadian(tmp);
        } else {
            startAngle = normalizeRadian(startAngle);
            endAngle = normalizeRadian(endAngle);
        }
        if (startAngle > endAngle) {
            endAngle += PI2;
        }
        var angle = Math.atan2(y, x);
        if (angle < 0) {
            angle += PI2;
        }
        return angle >= startAngle && angle <= endAngle || angle + PI2 >= startAngle && angle + PI2 <= endAngle;
    }
    function isInsideBrokenLine(points, lineWidth, x, y) {
        var lineWidth = Math.max(lineWidth, 10);
        for (var i = 0, l = points.length - 1; i < l; i++) {
            var x0 = points[i][0];
            var y0 = points[i][1];
            var x1 = points[i + 1][0];
            var y1 = points[i + 1][1];
            if (isInsideLine(x0, y0, x1, y1, lineWidth, x, y)) {
                return true;
            }
        }
        return false;
    }
    function isInsideRing(cx, cy, r0, r, x, y) {
        var d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        return d < r * r && d > r0 * r0;
    }
    /**
         * 矩形包含判断
         */
    function isInsideRect(x0, y0, width, height, x, y) {
        return x >= x0 && x <= x0 + width && y >= y0 && y <= y0 + height;
    }
    /**
         * 圆形包含判断
         */
    function isInsideCircle(x0, y0, r, x, y) {
        return (x - x0) * (x - x0) + (y - y0) * (y - y0) < r * r;
    }
    /**
         * 扇形包含判断
         */
    function isInsideSector(cx, cy, r0, r, startAngle, endAngle, anticlockwise, x, y) {
        return isInsideArcStroke(cx, cy, (r0 + r) / 2, startAngle, endAngle, anticlockwise, r - r0, x, y);
    }
    /**
         * 多边形包含判断
         * 与 canvas 一样采用 non-zero winding rule
         */
    function isInsidePolygon(points, x, y) {
        var N = points.length;
        var w = 0;
        for (var i = 0, j = N - 1; i < N; i++) {
            var x0 = points[j][0];
            var y0 = points[j][1];
            var x1 = points[i][0];
            var y1 = points[i][1];
            w += windingLine(x0, y0, x1, y1, x, y);
            j = i;
        }
        return w !== 0;
    }
    function windingLine(x0, y0, x1, y1, x, y) {
        if (y > y0 && y > y1 || y < y0 && y < y1) {
            return 0;
        }
        if (y1 == y0) {
            return 0;
        }
        var dir = y1 < y0 ? 1 : -1;
        var t = (y - y0) / (y1 - y0);
        var x_ = t * (x1 - x0) + x0;
        return x_ > x ? dir : 0;
    }
    // 临时数组
    var roots = [ -1, -1, -1 ];
    var extrema = [ -1, -1 ];
    function swapExtrema() {
        var tmp = extrema[0];
        extrema[0] = extrema[1];
        extrema[1] = tmp;
    }
    function windingCubic(x0, y0, x1, y1, x2, y2, x3, y3, x, y) {
        // Quick reject
        if (y > y0 && y > y1 && y > y2 && y > y3 || y < y0 && y < y1 && y < y2 && y < y3) {
            return 0;
        }
        var nRoots = curve.cubicRootAt(y0, y1, y2, y3, y, roots);
        if (nRoots === 0) {
            return 0;
        } else {
            var w = 0;
            var nExtrema = -1;
            var y0_, y1_;
            for (var i = 0; i < nRoots; i++) {
                var t = roots[i];
                var x_ = curve.cubicAt(x0, x1, x2, x3, t);
                if (x_ < x) {
                    // Quick reject
                    continue;
                }
                if (nExtrema < 0) {
                    nExtrema = curve.cubicExtrema(y0, y1, y2, y3, extrema);
                    if (extrema[1] < extrema[0] && nExtrema > 1) {
                        swapExtrema();
                    }
                    y0_ = curve.cubicAt(y0, y1, y2, y3, extrema[0]);
                    if (nExtrema > 1) {
                        y1_ = curve.cubicAt(y0, y1, y2, y3, extrema[1]);
                    }
                }
                if (nExtrema == 2) {
                    // 分成三段单调函数
                    if (t < extrema[0]) {
                        w += y0_ < y0 ? 1 : -1;
                    } else if (t < extrema[1]) {
                        w += y1_ < y0_ ? 1 : -1;
                    } else {
                        w += y3 < y1_ ? 1 : -1;
                    }
                } else {
                    // 分成两段单调函数
                    if (t < extrema[0]) {
                        w += y0_ < y0 ? 1 : -1;
                    } else {
                        w += y3 < y0_ ? 1 : -1;
                    }
                }
            }
            return w;
        }
    }
    function windingQuadratic(x0, y0, x1, y1, x2, y2, x, y) {
        // Quick reject
        if (y > y0 && y > y1 && y > y2 || y < y0 && y < y1 && y < y2) {
            return 0;
        }
        var nRoots = curve.quadraticRootAt(y0, y1, y2, y, roots);
        if (nRoots === 0) {
            return 0;
        } else {
            var t = curve.quadraticExtremum(y0, y1, y2);
            if (t >= 0 && t <= 1) {
                var w = 0;
                var y_ = curve.quadraticAt(y0, y1, y2, t);
                for (var i = 0; i < nRoots; i++) {
                    var x_ = curve.quadraticAt(x0, x1, x2, roots[i]);
                    if (x_ > x) {
                        continue;
                    }
                    if (roots[i] < t) {
                        w += y_ < y0 ? 1 : -1;
                    } else {
                        w += y2 < y_ ? 1 : -1;
                    }
                }
                return w;
            } else {
                var x_ = curve.quadraticAt(x0, x1, x2, roots[0]);
                if (x_ > x) {
                    return 0;
                }
                return y2 < y0 ? 1 : -1;
            }
        }
    }
    // TODO
    // Arc 旋转
    function windingArc(cx, cy, r, startAngle, endAngle, anticlockwise, x, y) {
        y -= cy;
        if (y > r || y < -r) {
            return 0;
        }
        var tmp = Math.sqrt(r * r - y * y);
        roots[0] = -tmp;
        roots[1] = tmp;
        if (Math.abs(startAngle - endAngle) >= PI2) {
            // Is a circle
            startAngle = 0;
            endAngle = PI2;
            var dir = anticlockwise ? 1 : -1;
            if (x >= roots[0] + cx && x <= roots[1] + cx) {
                return dir;
            } else {
                return 0;
            }
        }
        if (anticlockwise) {
            var tmp = startAngle;
            startAngle = normalizeRadian(endAngle);
            endAngle = normalizeRadian(tmp);
        } else {
            startAngle = normalizeRadian(startAngle);
            endAngle = normalizeRadian(endAngle);
        }
        if (startAngle > endAngle) {
            endAngle += PI2;
        }
        var w = 0;
        for (var i = 0; i < 2; i++) {
            var x_ = roots[i];
            if (x_ + cx > x) {
                var angle = Math.atan2(y, x_);
                var dir = anticlockwise ? 1 : -1;
                if (angle < 0) {
                    angle = PI2 + angle;
                }
                if (angle >= startAngle && angle <= endAngle || angle + PI2 >= startAngle && angle + PI2 <= endAngle) {
                    if (angle > Math.PI / 2 && angle < Math.PI * 1.5) {
                        dir = -dir;
                    }
                    w += dir;
                }
            }
        }
        return w;
    }
    /**
         * 路径包含判断
         * 与 canvas 一样采用 non-zero winding rule
         */
    function isInsidePath(pathArray, lineWidth, brushType, x, y) {
        var w = 0;
        var xi = 0;
        var yi = 0;
        var x0 = 0;
        var y0 = 0;
        var beginSubpath = true;
        var firstCmd = true;
        brushType = brushType || "fill";
        var hasStroke = brushType === "stroke" || brushType === "both";
        var hasFill = brushType === "fill" || brushType === "both";
        // var roots = [-1, -1, -1];
        for (var i = 0; i < pathArray.length; i++) {
            var seg = pathArray[i];
            var p = seg.points;
            // Begin a new subpath
            if (beginSubpath || seg.command === "M") {
                if (i > 0) {
                    // Close previous subpath
                    if (hasFill) {
                        w += windingLine(xi, yi, x0, y0, x, y);
                    }
                    if (w !== 0) {
                        return true;
                    }
                }
                x0 = p[p.length - 2];
                y0 = p[p.length - 1];
                beginSubpath = false;
                if (firstCmd && seg.command !== "A") {
                    // 如果第一个命令不是M, 是lineTo, bezierCurveTo
                    // 等绘制命令的话，是会从该绘制的起点开始算的
                    // Arc 会在之后做单独处理所以这里忽略
                    firstCmd = false;
                    xi = x0;
                    yi = y0;
                }
            }
            switch (seg.command) {
              case "M":
                xi = p[0];
                yi = p[1];
                break;

              case "L":
                if (hasStroke) {
                    if (isInsideLine(xi, yi, p[0], p[1], lineWidth, x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingLine(xi, yi, p[0], p[1], x, y);
                }
                xi = p[0];
                yi = p[1];
                break;

              case "C":
                if (hasStroke) {
                    if (isInsideCubicStroke(xi, yi, p[0], p[1], p[2], p[3], p[4], p[5], lineWidth, x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingCubic(xi, yi, p[0], p[1], p[2], p[3], p[4], p[5], x, y);
                }
                xi = p[4];
                yi = p[5];
                break;

              case "Q":
                if (hasStroke) {
                    if (isInsideQuadraticStroke(xi, yi, p[0], p[1], p[2], p[3], lineWidth, x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingQuadratic(xi, yi, p[0], p[1], p[2], p[3], x, y);
                }
                xi = p[2];
                yi = p[3];
                break;

              case "A":
                // TODO Arc 旋转
                // TODO Arc 判断的开销比较大
                var cx = p[0];
                var cy = p[1];
                var rx = p[2];
                var ry = p[3];
                var theta = p[4];
                var dTheta = p[5];
                var x1 = Math.cos(theta) * rx + cx;
                var y1 = Math.sin(theta) * ry + cy;
                // 不是直接使用 arc 命令
                if (!firstCmd) {
                    w += windingLine(xi, yi, x1, y1);
                } else {
                    firstCmd = false;
                    // 第一个命令起点还未定义
                    x0 = x1;
                    y0 = y1;
                }
                // zr 使用scale来模拟椭圆, 这里也对x做一定的缩放
                var _x = (x - cx) * ry / rx + cx;
                if (hasStroke) {
                    if (isInsideArcStroke(cx, cy, ry, theta, theta + dTheta, 1 - p[7], lineWidth, _x, y)) {
                        return true;
                    }
                }
                if (hasFill) {
                    w += windingArc(cx, cy, ry, theta, theta + dTheta, 1 - p[7], _x, y);
                }
                xi = Math.cos(theta + dTheta) * rx + cx;
                yi = Math.sin(theta + dTheta) * ry + cy;
                break;

              case "z":
                if (hasStroke) {
                    if (isInsideLine(xi, yi, x0, y0, lineWidth, x, y)) {
                        return true;
                    }
                }
                beginSubpath = true;
                break;
            }
        }
        if (hasFill) {
            w += windingLine(xi, yi, x0, y0, x, y);
        }
        return w !== 0;
    }
    /**
         * 测算多行文本宽度
         * @param {Object} text
         * @param {Object} textFont
         */
    function getTextWidth(text, textFont) {
        var key = text + ":" + textFont;
        if (_textWidthCache[key]) {
            return _textWidthCache[key];
        }
        _ctx = _ctx || util.getContext();
        _ctx.save();
        if (textFont) {
            _ctx.font = textFont;
        }
        text = (text + "").split("\n");
        var width = 0;
        for (var i = 0, l = text.length; i < l; i++) {
            width = Math.max(_ctx.measureText(text[i]).width, width);
        }
        _ctx.restore();
        _textWidthCache[key] = width;
        if (++_textWidthCacheCounter > TEXT_CACHE_MAX) {
            // 内存释放
            _textWidthCacheCounter = 0;
            _textWidthCache = {};
        }
        return width;
    }
    /**
         * 测算多行文本高度
         * @param {Object} text
         * @param {Object} textFont
         */
    function getTextHeight(text, textFont) {
        var key = text + ":" + textFont;
        if (_textHeightCache[key]) {
            return _textHeightCache[key];
        }
        _ctx = _ctx || util.getContext();
        _ctx.save();
        if (textFont) {
            _ctx.font = textFont;
        }
        text = (text + "").split("\n");
        // 比较粗暴
        var height = (_ctx.measureText("国").width + 2) * text.length;
        _ctx.restore();
        _textHeightCache[key] = height;
        if (++_textHeightCacheCounter > TEXT_CACHE_MAX) {
            // 内存释放
            _textHeightCacheCounter = 0;
            _textHeightCache = {};
        }
        return height;
    }
    module.exports = {
        isInside: isInside,
        isOutside: isOutside,
        getTextWidth: getTextWidth,
        getTextHeight: getTextHeight,
        isInsidePath: isInsidePath,
        isInsidePolygon: isInsidePolygon,
        isInsideSector: isInsideSector,
        isInsideCircle: isInsideCircle,
        isInsideLine: isInsideLine,
        isInsideRect: isInsideRect,
        isInsideBrokenLine: isInsideBrokenLine,
        isInsideCubicStroke: isInsideCubicStroke,
        isInsideQuadraticStroke: isInsideQuadraticStroke
    };
});

define("app/pc/canvaslib/tool/util", [ "app/pc/canvaslib/dep/excanvas" ], function(require, exports, module) {
    /**
 * zrender: 公共辅助函数
 *
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *
 * clone：深度克隆
 * merge：合并源对象的属性到目标对象
 * getContext：获取一个自由使用的canvas 2D context，使用原生方法，如isPointInPath，measureText等
 */
    // 用于处理merge时无法遍历Date等对象的问题
    var BUILTIN_OBJECT = {
        "[object Function]": 1,
        "[object RegExp]": 1,
        "[object Date]": 1,
        "[object Error]": 1,
        "[object CanvasGradient]": 1
    };
    /**
         * 对一个object进行深度拷贝
         *
         * @param {Any} source 需要进行拷贝的对象
         * @return {Any} 拷贝后的新对象
         */
    function clone(source) {
        if (typeof source == "object" && source !== null) {
            var result = source;
            if (source instanceof Array) {
                result = [];
                for (var i = 0, len = source.length; i < len; i++) {
                    result[i] = clone(source[i]);
                }
            } else if (!BUILTIN_OBJECT[Object.prototype.toString.call(source)]) {
                result = {};
                for (var key in source) {
                    if (source.hasOwnProperty(key)) {
                        result[key] = clone(source[key]);
                    }
                }
            }
            return result;
        }
        return source;
    }
    function mergeItem(target, source, key, overwrite) {
        if (source.hasOwnProperty(key)) {
            if (typeof target[key] == "object" && !BUILTIN_OBJECT[Object.prototype.toString.call(target[key])]) {
                // 如果需要递归覆盖，就递归调用merge
                merge(target[key], source[key], overwrite);
            } else if (overwrite || !(key in target)) {
                // 否则只处理overwrite为true，或者在目标对象中没有此属性的情况
                target[key] = source[key];
            }
        }
    }
    /**
         * 合并源对象的属性到目标对象
         * modify from Tangram
         * @param {*} target 目标对象
         * @param {*} source 源对象
         * @param {boolean} overwrite 是否覆盖
         */
    function merge(target, source, overwrite) {
        for (var i in source) {
            mergeItem(target, source, i, overwrite);
        }
        return target;
    }
    var _ctx;
    function getContext() {
        if (!_ctx) {
            require("app/pc/canvaslib/dep/excanvas");
            /* jshint ignore:start */
            if (window["G_vmlCanvasManager"]) {
                var _div = document.createElement("div");
                _div.style.position = "absolute";
                _div.style.top = "-1000px";
                document.body.appendChild(_div);
                _ctx = G_vmlCanvasManager.initElement(_div).getContext("2d");
            } else {
                _ctx = document.createElement("canvas").getContext("2d");
            }
        }
        return _ctx;
    }
    var _canvas;
    var _pixelCtx;
    var _width;
    var _height;
    var _offsetX = 0;
    var _offsetY = 0;
    /**
         * 获取像素拾取专用的上下文
         * @return {Object} 上下文
         */
    function getPixelContext() {
        if (!_pixelCtx) {
            _canvas = document.createElement("canvas");
            _width = _canvas.width;
            _height = _canvas.height;
            _pixelCtx = _canvas.getContext("2d");
        }
        return _pixelCtx;
    }
    /**
         * 如果坐标处在_canvas外部，改变_canvas的大小
         * @param {number} x : 横坐标
         * @param {number} y : 纵坐标
         * 注意 修改canvas的大小 需要重新设置translate
         */
    function adjustCanvasSize(x, y) {
        // 每次加的长度
        var _v = 100;
        var _flag;
        if (x + _offsetX > _width) {
            _width = x + _offsetX + _v;
            _canvas.width = _width;
            _flag = true;
        }
        if (y + _offsetY > _height) {
            _height = y + _offsetY + _v;
            _canvas.height = _height;
            _flag = true;
        }
        if (x < -_offsetX) {
            _offsetX = Math.ceil(-x / _v) * _v;
            _width += _offsetX;
            _canvas.width = _width;
            _flag = true;
        }
        if (y < -_offsetY) {
            _offsetY = Math.ceil(-y / _v) * _v;
            _height += _offsetY;
            _canvas.height = _height;
            _flag = true;
        }
        if (_flag) {
            _pixelCtx.translate(_offsetX, _offsetY);
        }
    }
    /**
         * 获取像素canvas的偏移量
         * @return {Object} 偏移量
         */
    function getPixelOffset() {
        return {
            x: _offsetX,
            y: _offsetY
        };
    }
    /**
         * 查询数组中元素的index
         */
    function indexOf(array, value) {
        if (array.indexOf) {
            return array.indexOf(value);
        }
        for (var i = 0, len = array.length; i < len; i++) {
            if (array[i] === value) {
                return i;
            }
        }
        return -1;
    }
    /**
         * 构造类继承关系
         * 
         * @param {Function} clazz 源类
         * @param {Function} baseClazz 基类
         */
    function inherits(clazz, baseClazz) {
        var clazzPrototype = clazz.prototype;
        function F() {}
        F.prototype = baseClazz.prototype;
        clazz.prototype = new F();
        for (var prop in clazzPrototype) {
            clazz.prototype[prop] = clazzPrototype[prop];
        }
        clazz.constructor = clazz;
    }
    module.exports = {
        inherits: inherits,
        clone: clone,
        merge: merge,
        getContext: getContext,
        getPixelContext: getPixelContext,
        getPixelOffset: getPixelOffset,
        adjustCanvasSize: adjustCanvasSize,
        indexOf: indexOf
    };
});

define("app/pc/canvaslib/dep/excanvas", [], function(require, exports, module) {
    // Copyright 2006 Google Inc.
    //
    // Licensed under the Apache License, Version 2.0 (the "License");
    // you may not use this file except in compliance with the License.
    // You may obtain a copy of the License at
    //
    //   http://www.apache.org/licenses/LICENSE-2.0
    //
    // Unless required by applicable law or agreed to in writing, software
    // distributed under the License is distributed on an "AS IS" BASIS,
    // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    // See the License for the specific language governing permissions and
    // limitations under the License.
    // Known Issues:
    //
    // * Patterns only support repeat.
    // * Radial gradient are not implemented. The VML version of these look very
    //   different from the canvas one.
    // * Clipping paths are not implemented.
    // * Coordsize. The width and height attribute have higher priority than the
    //   width and height style values which isn't correct.
    // * Painting mode isn't implemented.
    // * Canvas width/height should is using content-box by default. IE in
    //   Quirks mode will draw the canvas using border-box. Either change your
    //   doctype to HTML5
    //   (http://www.whatwg.org/specs/web-apps/current-work/#the-doctype)
    //   or use Box Sizing Behavior from WebFX
    //   (http://webfx.eae.net/dhtml/boxsizing/boxsizing.html)
    // * Non uniform scaling does not correctly scale strokes.
    // * Optimize. There is always room for speed improvements.
    // AMD by kener.linfeng@gmail.com
    // Only add this code if we do not already have a canvas implementation
    if (!document.createElement("canvas").getContext) {
        (function() {
            // alias some functions to make (compiled) code shorter
            var m = Math;
            var mr = m.round;
            var ms = m.sin;
            var mc = m.cos;
            var abs = m.abs;
            var sqrt = m.sqrt;
            // this is used for sub pixel precision
            var Z = 10;
            var Z2 = Z / 2;
            var IE_VERSION = +navigator.userAgent.match(/MSIE ([\d.]+)?/)[1];
            /**
   * This funtion is assigned to the <canvas> elements as element.getContext().
   * @this {HTMLElement}
   * @return {CanvasRenderingContext2D_}
   */
            function getContext() {
                return this.context_ || (this.context_ = new CanvasRenderingContext2D_(this));
            }
            var slice = Array.prototype.slice;
            /**
   * Binds a function to an object. The returned function will always use the
   * passed in {@code obj} as {@code this}.
   *
   * Example:
   *
   *   g = bind(f, obj, a, b)
   *   g(c, d) // will do f.call(obj, a, b, c, d)
   *
   * @param {Function} f The function to bind the object to
   * @param {Object} obj The object that should act as this when the function
   *     is called
   * @param {*} var_args Rest arguments that will be used as the initial
   *     arguments when the function is called
   * @return {Function} A new function that has bound this
   */
            function bind(f, obj, var_args) {
                var a = slice.call(arguments, 2);
                return function() {
                    return f.apply(obj, a.concat(slice.call(arguments)));
                };
            }
            function encodeHtmlAttribute(s) {
                return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
            }
            function addNamespace(doc, prefix, urn) {
                if (!doc.namespaces[prefix]) {
                    doc.namespaces.add(prefix, urn, "#default#VML");
                }
            }
            function addNamespacesAndStylesheet(doc) {
                addNamespace(doc, "g_vml_", "urn:schemas-microsoft-com:vml");
                addNamespace(doc, "g_o_", "urn:schemas-microsoft-com:office:office");
                // Setup default CSS.  Only add one style sheet per document
                if (!doc.styleSheets["ex_canvas_"]) {
                    var ss = doc.createStyleSheet();
                    ss.owningElement.id = "ex_canvas_";
                    ss.cssText = "canvas{display:inline-block;overflow:hidden;" + // default size is 300x150 in Gecko and Opera
                    "text-align:left;width:300px;height:150px}";
                }
            }
            // Add namespaces and stylesheet at startup.
            addNamespacesAndStylesheet(document);
            var G_vmlCanvasManager_ = {
                init: function(opt_doc) {
                    var doc = opt_doc || document;
                    // Create a dummy element so that IE will allow canvas elements to be
                    // recognized.
                    doc.createElement("canvas");
                    doc.attachEvent("onreadystatechange", bind(this.init_, this, doc));
                },
                init_: function(doc) {
                    // find all canvas elements
                    var els = doc.getElementsByTagName("canvas");
                    for (var i = 0; i < els.length; i++) {
                        this.initElement(els[i]);
                    }
                },
                /**
     * Public initializes a canvas element so that it can be used as canvas
     * element from now on. This is called automatically before the page is
     * loaded but if you are creating elements using createElement you need to
     * make sure this is called on the element.
     * @param {HTMLElement} el The canvas element to initialize.
     * @return {HTMLElement} the element that was created.
     */
                initElement: function(el) {
                    if (!el.getContext) {
                        el.getContext = getContext;
                        // Add namespaces and stylesheet to document of the element.
                        addNamespacesAndStylesheet(el.ownerDocument);
                        // Remove fallback content. There is no way to hide text nodes so we
                        // just remove all childNodes. We could hide all elements and remove
                        // text nodes but who really cares about the fallback content.
                        el.innerHTML = "";
                        // do not use inline function because that will leak memory
                        el.attachEvent("onpropertychange", onPropertyChange);
                        el.attachEvent("onresize", onResize);
                        var attrs = el.attributes;
                        if (attrs.width && attrs.width.specified) {
                            // TODO: use runtimeStyle and coordsize
                            // el.getContext().setWidth_(attrs.width.nodeValue);
                            el.style.width = attrs.width.nodeValue + "px";
                        } else {
                            el.width = el.clientWidth;
                        }
                        if (attrs.height && attrs.height.specified) {
                            // TODO: use runtimeStyle and coordsize
                            // el.getContext().setHeight_(attrs.height.nodeValue);
                            el.style.height = attrs.height.nodeValue + "px";
                        } else {
                            el.height = el.clientHeight;
                        }
                    }
                    return el;
                }
            };
            function onPropertyChange(e) {
                var el = e.srcElement;
                switch (e.propertyName) {
                  case "width":
                    el.getContext().clearRect();
                    el.style.width = el.attributes.width.nodeValue + "px";
                    // In IE8 this does not trigger onresize.
                    el.firstChild.style.width = el.clientWidth + "px";
                    break;

                  case "height":
                    el.getContext().clearRect();
                    el.style.height = el.attributes.height.nodeValue + "px";
                    el.firstChild.style.height = el.clientHeight + "px";
                    break;
                }
            }
            function onResize(e) {
                var el = e.srcElement;
                if (el.firstChild) {
                    el.firstChild.style.width = el.clientWidth + "px";
                    el.firstChild.style.height = el.clientHeight + "px";
                }
            }
            G_vmlCanvasManager_.init();
            // precompute "00" to "FF"
            var decToHex = [];
            for (var i = 0; i < 16; i++) {
                for (var j = 0; j < 16; j++) {
                    decToHex[i * 16 + j] = i.toString(16) + j.toString(16);
                }
            }
            function createMatrixIdentity() {
                return [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ 0, 0, 1 ] ];
            }
            function matrixMultiply(m1, m2) {
                var result = createMatrixIdentity();
                for (var x = 0; x < 3; x++) {
                    for (var y = 0; y < 3; y++) {
                        var sum = 0;
                        for (var z = 0; z < 3; z++) {
                            sum += m1[x][z] * m2[z][y];
                        }
                        result[x][y] = sum;
                    }
                }
                return result;
            }
            function copyState(o1, o2) {
                o2.fillStyle = o1.fillStyle;
                o2.lineCap = o1.lineCap;
                o2.lineJoin = o1.lineJoin;
                o2.lineWidth = o1.lineWidth;
                o2.miterLimit = o1.miterLimit;
                o2.shadowBlur = o1.shadowBlur;
                o2.shadowColor = o1.shadowColor;
                o2.shadowOffsetX = o1.shadowOffsetX;
                o2.shadowOffsetY = o1.shadowOffsetY;
                o2.strokeStyle = o1.strokeStyle;
                o2.globalAlpha = o1.globalAlpha;
                o2.font = o1.font;
                o2.textAlign = o1.textAlign;
                o2.textBaseline = o1.textBaseline;
                o2.scaleX_ = o1.scaleX_;
                o2.scaleY_ = o1.scaleY_;
                o2.lineScale_ = o1.lineScale_;
            }
            var colorData = {
                aliceblue: "#F0F8FF",
                antiquewhite: "#FAEBD7",
                aquamarine: "#7FFFD4",
                azure: "#F0FFFF",
                beige: "#F5F5DC",
                bisque: "#FFE4C4",
                black: "#000000",
                blanchedalmond: "#FFEBCD",
                blueviolet: "#8A2BE2",
                brown: "#A52A2A",
                burlywood: "#DEB887",
                cadetblue: "#5F9EA0",
                chartreuse: "#7FFF00",
                chocolate: "#D2691E",
                coral: "#FF7F50",
                cornflowerblue: "#6495ED",
                cornsilk: "#FFF8DC",
                crimson: "#DC143C",
                cyan: "#00FFFF",
                darkblue: "#00008B",
                darkcyan: "#008B8B",
                darkgoldenrod: "#B8860B",
                darkgray: "#A9A9A9",
                darkgreen: "#006400",
                darkgrey: "#A9A9A9",
                darkkhaki: "#BDB76B",
                darkmagenta: "#8B008B",
                darkolivegreen: "#556B2F",
                darkorange: "#FF8C00",
                darkorchid: "#9932CC",
                darkred: "#8B0000",
                darksalmon: "#E9967A",
                darkseagreen: "#8FBC8F",
                darkslateblue: "#483D8B",
                darkslategray: "#2F4F4F",
                darkslategrey: "#2F4F4F",
                darkturquoise: "#00CED1",
                darkviolet: "#9400D3",
                deeppink: "#FF1493",
                deepskyblue: "#00BFFF",
                dimgray: "#696969",
                dimgrey: "#696969",
                dodgerblue: "#1E90FF",
                firebrick: "#B22222",
                floralwhite: "#FFFAF0",
                forestgreen: "#228B22",
                gainsboro: "#DCDCDC",
                ghostwhite: "#F8F8FF",
                gold: "#FFD700",
                goldenrod: "#DAA520",
                grey: "#808080",
                greenyellow: "#ADFF2F",
                honeydew: "#F0FFF0",
                hotpink: "#FF69B4",
                indianred: "#CD5C5C",
                indigo: "#4B0082",
                ivory: "#FFFFF0",
                khaki: "#F0E68C",
                lavender: "#E6E6FA",
                lavenderblush: "#FFF0F5",
                lawngreen: "#7CFC00",
                lemonchiffon: "#FFFACD",
                lightblue: "#ADD8E6",
                lightcoral: "#F08080",
                lightcyan: "#E0FFFF",
                lightgoldenrodyellow: "#FAFAD2",
                lightgreen: "#90EE90",
                lightgrey: "#D3D3D3",
                lightpink: "#FFB6C1",
                lightsalmon: "#FFA07A",
                lightseagreen: "#20B2AA",
                lightskyblue: "#87CEFA",
                lightslategray: "#778899",
                lightslategrey: "#778899",
                lightsteelblue: "#B0C4DE",
                lightyellow: "#FFFFE0",
                limegreen: "#32CD32",
                linen: "#FAF0E6",
                magenta: "#FF00FF",
                mediumaquamarine: "#66CDAA",
                mediumblue: "#0000CD",
                mediumorchid: "#BA55D3",
                mediumpurple: "#9370DB",
                mediumseagreen: "#3CB371",
                mediumslateblue: "#7B68EE",
                mediumspringgreen: "#00FA9A",
                mediumturquoise: "#48D1CC",
                mediumvioletred: "#C71585",
                midnightblue: "#191970",
                mintcream: "#F5FFFA",
                mistyrose: "#FFE4E1",
                moccasin: "#FFE4B5",
                navajowhite: "#FFDEAD",
                oldlace: "#FDF5E6",
                olivedrab: "#6B8E23",
                orange: "#FFA500",
                orangered: "#FF4500",
                orchid: "#DA70D6",
                palegoldenrod: "#EEE8AA",
                palegreen: "#98FB98",
                paleturquoise: "#AFEEEE",
                palevioletred: "#DB7093",
                papayawhip: "#FFEFD5",
                peachpuff: "#FFDAB9",
                peru: "#CD853F",
                pink: "#FFC0CB",
                plum: "#DDA0DD",
                powderblue: "#B0E0E6",
                rosybrown: "#BC8F8F",
                royalblue: "#4169E1",
                saddlebrown: "#8B4513",
                salmon: "#FA8072",
                sandybrown: "#F4A460",
                seagreen: "#2E8B57",
                seashell: "#FFF5EE",
                sienna: "#A0522D",
                skyblue: "#87CEEB",
                slateblue: "#6A5ACD",
                slategray: "#708090",
                slategrey: "#708090",
                snow: "#FFFAFA",
                springgreen: "#00FF7F",
                steelblue: "#4682B4",
                tan: "#D2B48C",
                thistle: "#D8BFD8",
                tomato: "#FF6347",
                turquoise: "#40E0D0",
                violet: "#EE82EE",
                wheat: "#F5DEB3",
                whitesmoke: "#F5F5F5",
                yellowgreen: "#9ACD32"
            };
            function getRgbHslContent(styleString) {
                var start = styleString.indexOf("(", 3);
                var end = styleString.indexOf(")", start + 1);
                var parts = styleString.substring(start + 1, end).split(",");
                // add alpha if needed
                if (parts.length != 4 || styleString.charAt(3) != "a") {
                    parts[3] = 1;
                }
                return parts;
            }
            function percent(s) {
                return parseFloat(s) / 100;
            }
            function clamp(v, min, max) {
                return Math.min(max, Math.max(min, v));
            }
            function hslToRgb(parts) {
                var r, g, b, h, s, l;
                h = parseFloat(parts[0]) / 360 % 360;
                if (h < 0) h++;
                s = clamp(percent(parts[1]), 0, 1);
                l = clamp(percent(parts[2]), 0, 1);
                if (s == 0) {
                    r = g = b = l;
                } else {
                    var q = l < .5 ? l * (1 + s) : l + s - l * s;
                    var p = 2 * l - q;
                    r = hueToRgb(p, q, h + 1 / 3);
                    g = hueToRgb(p, q, h);
                    b = hueToRgb(p, q, h - 1 / 3);
                }
                return "#" + decToHex[Math.floor(r * 255)] + decToHex[Math.floor(g * 255)] + decToHex[Math.floor(b * 255)];
            }
            function hueToRgb(m1, m2, h) {
                if (h < 0) h++;
                if (h > 1) h--;
                if (6 * h < 1) return m1 + (m2 - m1) * 6 * h; else if (2 * h < 1) return m2; else if (3 * h < 2) return m1 + (m2 - m1) * (2 / 3 - h) * 6; else return m1;
            }
            var processStyleCache = {};
            function processStyle(styleString) {
                if (styleString in processStyleCache) {
                    return processStyleCache[styleString];
                }
                var str, alpha = 1;
                styleString = String(styleString);
                if (styleString.charAt(0) == "#") {
                    str = styleString;
                } else if (/^rgb/.test(styleString)) {
                    var parts = getRgbHslContent(styleString);
                    var str = "#", n;
                    for (var i = 0; i < 3; i++) {
                        if (parts[i].indexOf("%") != -1) {
                            n = Math.floor(percent(parts[i]) * 255);
                        } else {
                            n = +parts[i];
                        }
                        str += decToHex[clamp(n, 0, 255)];
                    }
                    alpha = +parts[3];
                } else if (/^hsl/.test(styleString)) {
                    var parts = getRgbHslContent(styleString);
                    str = hslToRgb(parts);
                    alpha = parts[3];
                } else {
                    str = colorData[styleString] || styleString;
                }
                return processStyleCache[styleString] = {
                    color: str,
                    alpha: alpha
                };
            }
            var DEFAULT_STYLE = {
                style: "normal",
                variant: "normal",
                weight: "normal",
                size: 12,
                //10
                family: "微软雅黑"
            };
            // Internal text style cache
            var fontStyleCache = {};
            function processFontStyle(styleString) {
                if (fontStyleCache[styleString]) {
                    return fontStyleCache[styleString];
                }
                var el = document.createElement("div");
                var style = el.style;
                var fontFamily;
                try {
                    style.font = styleString;
                    fontFamily = style.fontFamily.split(",")[0];
                } catch (ex) {}
                return fontStyleCache[styleString] = {
                    style: style.fontStyle || DEFAULT_STYLE.style,
                    variant: style.fontVariant || DEFAULT_STYLE.variant,
                    weight: style.fontWeight || DEFAULT_STYLE.weight,
                    size: style.fontSize || DEFAULT_STYLE.size,
                    family: fontFamily || DEFAULT_STYLE.family
                };
            }
            function getComputedStyle(style, element) {
                var computedStyle = {};
                for (var p in style) {
                    computedStyle[p] = style[p];
                }
                // Compute the size
                var canvasFontSize = parseFloat(element.currentStyle.fontSize), fontSize = parseFloat(style.size);
                if (typeof style.size == "number") {
                    computedStyle.size = style.size;
                } else if (style.size.indexOf("px") != -1) {
                    computedStyle.size = fontSize;
                } else if (style.size.indexOf("em") != -1) {
                    computedStyle.size = canvasFontSize * fontSize;
                } else if (style.size.indexOf("%") != -1) {
                    computedStyle.size = canvasFontSize / 100 * fontSize;
                } else if (style.size.indexOf("pt") != -1) {
                    computedStyle.size = fontSize / .75;
                } else {
                    computedStyle.size = canvasFontSize;
                }
                // Different scaling between normal text and VML text. This was found using
                // trial and error to get the same size as non VML text.
                //computedStyle.size *= 0.981;
                return computedStyle;
            }
            function buildStyle(style) {
                return style.style + " " + style.variant + " " + style.weight + " " + style.size + "px '" + style.family + "'";
            }
            var lineCapMap = {
                butt: "flat",
                round: "round"
            };
            function processLineCap(lineCap) {
                return lineCapMap[lineCap] || "square";
            }
            /**
   * This class implements CanvasRenderingContext2D interface as described by
   * the WHATWG.
   * @param {HTMLElement} canvasElement The element that the 2D context should
   * be associated with
   */
            function CanvasRenderingContext2D_(canvasElement) {
                this.m_ = createMatrixIdentity();
                this.mStack_ = [];
                this.aStack_ = [];
                this.currentPath_ = [];
                // Canvas context properties
                this.strokeStyle = "#000";
                this.fillStyle = "#000";
                this.lineWidth = 1;
                this.lineJoin = "miter";
                this.lineCap = "butt";
                this.miterLimit = Z * 1;
                this.globalAlpha = 1;
                // this.font = '10px sans-serif';
                this.font = "12px 微软雅黑";
                // 决定还是改这吧，影响代价最小
                this.textAlign = "left";
                this.textBaseline = "alphabetic";
                this.canvas = canvasElement;
                var cssText = "width:" + canvasElement.clientWidth + "px;height:" + canvasElement.clientHeight + "px;overflow:hidden;position:absolute";
                var el = canvasElement.ownerDocument.createElement("div");
                el.style.cssText = cssText;
                canvasElement.appendChild(el);
                var overlayEl = el.cloneNode(false);
                // Use a non transparent background.
                overlayEl.style.backgroundColor = "#fff";
                //red, I don't know why, it work! 
                overlayEl.style.filter = "alpha(opacity=0)";
                canvasElement.appendChild(overlayEl);
                this.element_ = el;
                this.scaleX_ = 1;
                this.scaleY_ = 1;
                this.lineScale_ = 1;
            }
            var contextPrototype = CanvasRenderingContext2D_.prototype;
            contextPrototype.clearRect = function() {
                if (this.textMeasureEl_) {
                    this.textMeasureEl_.removeNode(true);
                    this.textMeasureEl_ = null;
                }
                this.element_.innerHTML = "";
            };
            contextPrototype.beginPath = function() {
                // TODO: Branch current matrix so that save/restore has no effect
                //       as per safari docs.
                this.currentPath_ = [];
            };
            contextPrototype.moveTo = function(aX, aY) {
                var p = getCoords(this, aX, aY);
                this.currentPath_.push({
                    type: "moveTo",
                    x: p.x,
                    y: p.y
                });
                this.currentX_ = p.x;
                this.currentY_ = p.y;
            };
            contextPrototype.lineTo = function(aX, aY) {
                var p = getCoords(this, aX, aY);
                this.currentPath_.push({
                    type: "lineTo",
                    x: p.x,
                    y: p.y
                });
                this.currentX_ = p.x;
                this.currentY_ = p.y;
            };
            contextPrototype.bezierCurveTo = function(aCP1x, aCP1y, aCP2x, aCP2y, aX, aY) {
                var p = getCoords(this, aX, aY);
                var cp1 = getCoords(this, aCP1x, aCP1y);
                var cp2 = getCoords(this, aCP2x, aCP2y);
                bezierCurveTo(this, cp1, cp2, p);
            };
            // Helper function that takes the already fixed cordinates.
            function bezierCurveTo(self, cp1, cp2, p) {
                self.currentPath_.push({
                    type: "bezierCurveTo",
                    cp1x: cp1.x,
                    cp1y: cp1.y,
                    cp2x: cp2.x,
                    cp2y: cp2.y,
                    x: p.x,
                    y: p.y
                });
                self.currentX_ = p.x;
                self.currentY_ = p.y;
            }
            contextPrototype.quadraticCurveTo = function(aCPx, aCPy, aX, aY) {
                // the following is lifted almost directly from
                // http://developer.mozilla.org/en/docs/Canvas_tutorial:Drawing_shapes
                var cp = getCoords(this, aCPx, aCPy);
                var p = getCoords(this, aX, aY);
                var cp1 = {
                    x: this.currentX_ + 2 / 3 * (cp.x - this.currentX_),
                    y: this.currentY_ + 2 / 3 * (cp.y - this.currentY_)
                };
                var cp2 = {
                    x: cp1.x + (p.x - this.currentX_) / 3,
                    y: cp1.y + (p.y - this.currentY_) / 3
                };
                bezierCurveTo(this, cp1, cp2, p);
            };
            contextPrototype.arc = function(aX, aY, aRadius, aStartAngle, aEndAngle, aClockwise) {
                aRadius *= Z;
                var arcType = aClockwise ? "at" : "wa";
                var xStart = aX + mc(aStartAngle) * aRadius - Z2;
                var yStart = aY + ms(aStartAngle) * aRadius - Z2;
                var xEnd = aX + mc(aEndAngle) * aRadius - Z2;
                var yEnd = aY + ms(aEndAngle) * aRadius - Z2;
                // IE won't render arches drawn counter clockwise if xStart == xEnd.
                if (xStart == xEnd && !aClockwise) {
                    xStart += .125;
                }
                var p = getCoords(this, aX, aY);
                var pStart = getCoords(this, xStart, yStart);
                var pEnd = getCoords(this, xEnd, yEnd);
                this.currentPath_.push({
                    type: arcType,
                    x: p.x,
                    y: p.y,
                    radius: aRadius,
                    xStart: pStart.x,
                    yStart: pStart.y,
                    xEnd: pEnd.x,
                    yEnd: pEnd.y
                });
            };
            contextPrototype.rect = function(aX, aY, aWidth, aHeight) {
                this.moveTo(aX, aY);
                this.lineTo(aX + aWidth, aY);
                this.lineTo(aX + aWidth, aY + aHeight);
                this.lineTo(aX, aY + aHeight);
                this.closePath();
            };
            contextPrototype.strokeRect = function(aX, aY, aWidth, aHeight) {
                var oldPath = this.currentPath_;
                this.beginPath();
                this.moveTo(aX, aY);
                this.lineTo(aX + aWidth, aY);
                this.lineTo(aX + aWidth, aY + aHeight);
                this.lineTo(aX, aY + aHeight);
                this.closePath();
                this.stroke();
                this.currentPath_ = oldPath;
            };
            contextPrototype.fillRect = function(aX, aY, aWidth, aHeight) {
                var oldPath = this.currentPath_;
                this.beginPath();
                this.moveTo(aX, aY);
                this.lineTo(aX + aWidth, aY);
                this.lineTo(aX + aWidth, aY + aHeight);
                this.lineTo(aX, aY + aHeight);
                this.closePath();
                this.fill();
                this.currentPath_ = oldPath;
            };
            contextPrototype.createLinearGradient = function(aX0, aY0, aX1, aY1) {
                var gradient = new CanvasGradient_("gradient");
                gradient.x0_ = aX0;
                gradient.y0_ = aY0;
                gradient.x1_ = aX1;
                gradient.y1_ = aY1;
                return gradient;
            };
            contextPrototype.createRadialGradient = function(aX0, aY0, aR0, aX1, aY1, aR1) {
                var gradient = new CanvasGradient_("gradientradial");
                gradient.x0_ = aX0;
                gradient.y0_ = aY0;
                gradient.r0_ = aR0;
                gradient.x1_ = aX1;
                gradient.y1_ = aY1;
                gradient.r1_ = aR1;
                return gradient;
            };
            contextPrototype.drawImage = function(image, var_args) {
                var dx, dy, dw, dh, sx, sy, sw, sh;
                // to find the original width we overide the width and height
                var oldRuntimeWidth = image.runtimeStyle.width;
                var oldRuntimeHeight = image.runtimeStyle.height;
                image.runtimeStyle.width = "auto";
                image.runtimeStyle.height = "auto";
                // get the original size
                var w = image.width;
                var h = image.height;
                // and remove overides
                image.runtimeStyle.width = oldRuntimeWidth;
                image.runtimeStyle.height = oldRuntimeHeight;
                if (arguments.length == 3) {
                    dx = arguments[1];
                    dy = arguments[2];
                    sx = sy = 0;
                    sw = dw = w;
                    sh = dh = h;
                } else if (arguments.length == 5) {
                    dx = arguments[1];
                    dy = arguments[2];
                    dw = arguments[3];
                    dh = arguments[4];
                    sx = sy = 0;
                    sw = w;
                    sh = h;
                } else if (arguments.length == 9) {
                    sx = arguments[1];
                    sy = arguments[2];
                    sw = arguments[3];
                    sh = arguments[4];
                    dx = arguments[5];
                    dy = arguments[6];
                    dw = arguments[7];
                    dh = arguments[8];
                } else {
                    throw Error("Invalid number of arguments");
                }
                var d = getCoords(this, dx, dy);
                var w2 = sw / 2;
                var h2 = sh / 2;
                var vmlStr = [];
                var W = 10;
                var H = 10;
                var scaleX = scaleY = 1;
                // For some reason that I've now forgotten, using divs didn't work
                vmlStr.push(" <g_vml_:group", ' coordsize="', Z * W, ",", Z * H, '"', ' coordorigin="0,0"', ' style="width:', W, "px;height:", H, "px;position:absolute;");
                // If filters are necessary (rotation exists), create them
                // filters are bog-slow, so only create them if abbsolutely necessary
                // The following check doesn't account for skews (which don't exist
                // in the canvas spec (yet) anyway.
                if (this.m_[0][0] != 1 || this.m_[0][1] || this.m_[1][1] != 1 || this.m_[1][0]) {
                    var filter = [];
                    var scaleX = this.scaleX_;
                    var scaleY = this.scaleY_;
                    // Note the 12/21 reversal
                    filter.push("M11=", this.m_[0][0] / scaleX, ",", "M12=", this.m_[1][0] / scaleY, ",", "M21=", this.m_[0][1] / scaleX, ",", "M22=", this.m_[1][1] / scaleY, ",", "Dx=", mr(d.x / Z), ",", "Dy=", mr(d.y / Z), "");
                    // Bounding box calculation (need to minimize displayed area so that
                    // filters don't waste time on unused pixels.
                    var max = d;
                    var c2 = getCoords(this, dx + dw, dy);
                    var c3 = getCoords(this, dx, dy + dh);
                    var c4 = getCoords(this, dx + dw, dy + dh);
                    max.x = m.max(max.x, c2.x, c3.x, c4.x);
                    max.y = m.max(max.y, c2.y, c3.y, c4.y);
                    vmlStr.push("padding:0 ", mr(max.x / Z), "px ", mr(max.y / Z), "px 0;filter:progid:DXImageTransform.Microsoft.Matrix(", filter.join(""), ", SizingMethod='clip');");
                } else {
                    vmlStr.push("top:", mr(d.y / Z), "px;left:", mr(d.x / Z), "px;");
                }
                vmlStr.push(' ">');
                // Draw a special cropping div if needed
                if (sx || sy) {
                    // Apply scales to width and height
                    vmlStr.push('<div style="overflow: hidden; width:', Math.ceil((dw + sx * dw / sw) * scaleX), "px;", " height:", Math.ceil((dh + sy * dh / sh) * scaleY), "px;", " filter:progid:DxImageTransform.Microsoft.Matrix(Dx=", -sx * dw / sw * scaleX, ",Dy=", -sy * dh / sh * scaleY, ');">');
                }
                // Apply scales to width and height
                vmlStr.push('<div style="width:', Math.round(scaleX * w * dw / sw), "px;", " height:", Math.round(scaleY * h * dh / sh), "px;", " filter:");
                // If there is a globalAlpha, apply it to image
                if (this.globalAlpha < 1) {
                    vmlStr.push(" progid:DXImageTransform.Microsoft.Alpha(opacity=" + this.globalAlpha * 100 + ")");
                }
                vmlStr.push(" progid:DXImageTransform.Microsoft.AlphaImageLoader(src=", image.src, ',sizingMethod=scale)">');
                // Close the crop div if necessary            
                if (sx || sy) vmlStr.push("</div>");
                vmlStr.push("</div></div>");
                this.element_.insertAdjacentHTML("BeforeEnd", vmlStr.join(""));
            };
            contextPrototype.stroke = function(aFill) {
                var lineStr = [];
                var lineOpen = false;
                var W = 10;
                var H = 10;
                lineStr.push("<g_vml_:shape", ' filled="', !!aFill, '"', ' style="position:absolute;width:', W, "px;height:", H, 'px;"', ' coordorigin="0,0"', ' coordsize="', Z * W, ",", Z * H, '"', ' stroked="', !aFill, '"', ' path="');
                var newSeq = false;
                var min = {
                    x: null,
                    y: null
                };
                var max = {
                    x: null,
                    y: null
                };
                for (var i = 0; i < this.currentPath_.length; i++) {
                    var p = this.currentPath_[i];
                    var c;
                    switch (p.type) {
                      case "moveTo":
                        c = p;
                        lineStr.push(" m ", mr(p.x), ",", mr(p.y));
                        break;

                      case "lineTo":
                        lineStr.push(" l ", mr(p.x), ",", mr(p.y));
                        break;

                      case "close":
                        lineStr.push(" x ");
                        p = null;
                        break;

                      case "bezierCurveTo":
                        lineStr.push(" c ", mr(p.cp1x), ",", mr(p.cp1y), ",", mr(p.cp2x), ",", mr(p.cp2y), ",", mr(p.x), ",", mr(p.y));
                        break;

                      case "at":
                      case "wa":
                        lineStr.push(" ", p.type, " ", mr(p.x - this.scaleX_ * p.radius), ",", mr(p.y - this.scaleY_ * p.radius), " ", mr(p.x + this.scaleX_ * p.radius), ",", mr(p.y + this.scaleY_ * p.radius), " ", mr(p.xStart), ",", mr(p.yStart), " ", mr(p.xEnd), ",", mr(p.yEnd));
                        break;
                    }
                    // TODO: Following is broken for curves due to
                    //       move to proper paths.
                    // Figure out dimensions so we can do gradient fills
                    // properly
                    if (p) {
                        if (min.x == null || p.x < min.x) {
                            min.x = p.x;
                        }
                        if (max.x == null || p.x > max.x) {
                            max.x = p.x;
                        }
                        if (min.y == null || p.y < min.y) {
                            min.y = p.y;
                        }
                        if (max.y == null || p.y > max.y) {
                            max.y = p.y;
                        }
                    }
                }
                lineStr.push(' ">');
                if (!aFill) {
                    appendStroke(this, lineStr);
                } else {
                    appendFill(this, lineStr, min, max);
                }
                lineStr.push("</g_vml_:shape>");
                this.element_.insertAdjacentHTML("beforeEnd", lineStr.join(""));
            };
            function appendStroke(ctx, lineStr) {
                var a = processStyle(ctx.strokeStyle);
                var color = a.color;
                var opacity = a.alpha * ctx.globalAlpha;
                var lineWidth = ctx.lineScale_ * ctx.lineWidth;
                // VML cannot correctly render a line if the width is less than 1px.
                // In that case, we dilute the color to make the line look thinner.
                if (lineWidth < 1) {
                    opacity *= lineWidth;
                }
                lineStr.push("<g_vml_:stroke", ' opacity="', opacity, '"', ' joinstyle="', ctx.lineJoin, '"', ' miterlimit="', ctx.miterLimit, '"', ' endcap="', processLineCap(ctx.lineCap), '"', ' weight="', lineWidth, 'px"', ' color="', color, '" />');
            }
            function appendFill(ctx, lineStr, min, max) {
                var fillStyle = ctx.fillStyle;
                var arcScaleX = ctx.scaleX_;
                var arcScaleY = ctx.scaleY_;
                var width = max.x - min.x;
                var height = max.y - min.y;
                if (fillStyle instanceof CanvasGradient_) {
                    // TODO: Gradients transformed with the transformation matrix.
                    var angle = 0;
                    var focus = {
                        x: 0,
                        y: 0
                    };
                    // additional offset
                    var shift = 0;
                    // scale factor for offset
                    var expansion = 1;
                    if (fillStyle.type_ == "gradient") {
                        var x0 = fillStyle.x0_ / arcScaleX;
                        var y0 = fillStyle.y0_ / arcScaleY;
                        var x1 = fillStyle.x1_ / arcScaleX;
                        var y1 = fillStyle.y1_ / arcScaleY;
                        var p0 = getCoords(ctx, x0, y0);
                        var p1 = getCoords(ctx, x1, y1);
                        var dx = p1.x - p0.x;
                        var dy = p1.y - p0.y;
                        angle = Math.atan2(dx, dy) * 180 / Math.PI;
                        // The angle should be a non-negative number.
                        if (angle < 0) {
                            angle += 360;
                        }
                        // Very small angles produce an unexpected result because they are
                        // converted to a scientific notation string.
                        if (angle < 1e-6) {
                            angle = 0;
                        }
                    } else {
                        var p0 = getCoords(ctx, fillStyle.x0_, fillStyle.y0_);
                        focus = {
                            x: (p0.x - min.x) / width,
                            y: (p0.y - min.y) / height
                        };
                        width /= arcScaleX * Z;
                        height /= arcScaleY * Z;
                        var dimension = m.max(width, height);
                        shift = 2 * fillStyle.r0_ / dimension;
                        expansion = 2 * fillStyle.r1_ / dimension - shift;
                    }
                    // We need to sort the color stops in ascending order by offset,
                    // otherwise IE won't interpret it correctly.
                    var stops = fillStyle.colors_;
                    stops.sort(function(cs1, cs2) {
                        return cs1.offset - cs2.offset;
                    });
                    var length = stops.length;
                    var color1 = stops[0].color;
                    var color2 = stops[length - 1].color;
                    var opacity1 = stops[0].alpha * ctx.globalAlpha;
                    var opacity2 = stops[length - 1].alpha * ctx.globalAlpha;
                    var colors = [];
                    for (var i = 0; i < length; i++) {
                        var stop = stops[i];
                        colors.push(stop.offset * expansion + shift + " " + stop.color);
                    }
                    // When colors attribute is used, the meanings of opacity and o:opacity2
                    // are reversed.
                    lineStr.push('<g_vml_:fill type="', fillStyle.type_, '"', ' method="none" focus="100%"', ' color="', color1, '"', ' color2="', color2, '"', ' colors="', colors.join(","), '"', ' opacity="', opacity2, '"', ' g_o_:opacity2="', opacity1, '"', ' angle="', angle, '"', ' focusposition="', focus.x, ",", focus.y, '" />');
                } else if (fillStyle instanceof CanvasPattern_) {
                    if (width && height) {
                        var deltaLeft = -min.x;
                        var deltaTop = -min.y;
                        lineStr.push("<g_vml_:fill", ' position="', deltaLeft / width * arcScaleX * arcScaleX, ",", deltaTop / height * arcScaleY * arcScaleY, '"', ' type="tile"', // TODO: Figure out the correct size to fit the scale.
                        //' size="', w, 'px ', h, 'px"',
                        ' src="', fillStyle.src_, '" />');
                    }
                } else {
                    var a = processStyle(ctx.fillStyle);
                    var color = a.color;
                    var opacity = a.alpha * ctx.globalAlpha;
                    lineStr.push('<g_vml_:fill color="', color, '" opacity="', opacity, '" />');
                }
            }
            contextPrototype.fill = function() {
                this.stroke(true);
            };
            contextPrototype.closePath = function() {
                this.currentPath_.push({
                    type: "close"
                });
            };
            function getCoords(ctx, aX, aY) {
                var m = ctx.m_;
                return {
                    x: Z * (aX * m[0][0] + aY * m[1][0] + m[2][0]) - Z2,
                    y: Z * (aX * m[0][1] + aY * m[1][1] + m[2][1]) - Z2
                };
            }
            contextPrototype.save = function() {
                var o = {};
                copyState(this, o);
                this.aStack_.push(o);
                this.mStack_.push(this.m_);
                this.m_ = matrixMultiply(createMatrixIdentity(), this.m_);
            };
            contextPrototype.restore = function() {
                if (this.aStack_.length) {
                    copyState(this.aStack_.pop(), this);
                    this.m_ = this.mStack_.pop();
                }
            };
            function matrixIsFinite(m) {
                return isFinite(m[0][0]) && isFinite(m[0][1]) && isFinite(m[1][0]) && isFinite(m[1][1]) && isFinite(m[2][0]) && isFinite(m[2][1]);
            }
            function setM(ctx, m, updateLineScale) {
                if (!matrixIsFinite(m)) {
                    return;
                }
                ctx.m_ = m;
                ctx.scaleX_ = Math.sqrt(m[0][0] * m[0][0] + m[0][1] * m[0][1]);
                ctx.scaleY_ = Math.sqrt(m[1][0] * m[1][0] + m[1][1] * m[1][1]);
                if (updateLineScale) {
                    // Get the line scale.
                    // Determinant of this.m_ means how much the area is enlarged by the
                    // transformation. So its square root can be used as a scale factor
                    // for width.
                    var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
                    ctx.lineScale_ = sqrt(abs(det));
                }
            }
            contextPrototype.translate = function(aX, aY) {
                var m1 = [ [ 1, 0, 0 ], [ 0, 1, 0 ], [ aX, aY, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), false);
            };
            contextPrototype.rotate = function(aRot) {
                var c = mc(aRot);
                var s = ms(aRot);
                var m1 = [ [ c, s, 0 ], [ -s, c, 0 ], [ 0, 0, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), false);
            };
            contextPrototype.scale = function(aX, aY) {
                var m1 = [ [ aX, 0, 0 ], [ 0, aY, 0 ], [ 0, 0, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), true);
            };
            contextPrototype.transform = function(m11, m12, m21, m22, dx, dy) {
                var m1 = [ [ m11, m12, 0 ], [ m21, m22, 0 ], [ dx, dy, 1 ] ];
                setM(this, matrixMultiply(m1, this.m_), true);
            };
            contextPrototype.setTransform = function(m11, m12, m21, m22, dx, dy) {
                var m = [ [ m11, m12, 0 ], [ m21, m22, 0 ], [ dx, dy, 1 ] ];
                setM(this, m, true);
            };
            /**
   * The text drawing function.
   * The maxWidth argument isn't taken in account, since no browser supports
   * it yet.
   */
            contextPrototype.drawText_ = function(text, x, y, maxWidth, stroke) {
                var m = this.m_, delta = 1e3, left = 0, right = delta, offset = {
                    x: 0,
                    y: 0
                }, lineStr = [];
                var fontStyle = getComputedStyle(processFontStyle(this.font), this.element_);
                var fontStyleString = buildStyle(fontStyle);
                var elementStyle = this.element_.currentStyle;
                var textAlign = this.textAlign.toLowerCase();
                switch (textAlign) {
                  case "left":
                  case "center":
                  case "right":
                    break;

                  case "end":
                    textAlign = elementStyle.direction == "ltr" ? "right" : "left";
                    break;

                  case "start":
                    textAlign = elementStyle.direction == "rtl" ? "right" : "left";
                    break;

                  default:
                    textAlign = "left";
                }
                // 1.75 is an arbitrary number, as there is no info about the text baseline
                switch (this.textBaseline) {
                  case "hanging":
                  case "top":
                    offset.y = fontStyle.size / 1.75;
                    break;

                  case "middle":
                    break;

                  default:
                  case null:
                  case "alphabetic":
                  case "ideographic":
                  case "bottom":
                    offset.y = -fontStyle.size / 2.25;
                    break;
                }
                switch (textAlign) {
                  case "right":
                    left = delta;
                    right = .05;
                    break;

                  case "center":
                    left = right = delta / 2;
                    break;
                }
                var d = getCoords(this, x + offset.x, y + offset.y);
                lineStr.push('<g_vml_:line from="', -left, ' 0" to="', right, ' 0.05" ', ' coordsize="100 100" coordorigin="0 0"', ' filled="', !stroke, '" stroked="', !!stroke, '" style="position:absolute;width:1px;height:1px;">');
                if (stroke) {
                    appendStroke(this, lineStr);
                } else {
                    // TODO: Fix the min and max params.
                    appendFill(this, lineStr, {
                        x: -left,
                        y: 0
                    }, {
                        x: right,
                        y: fontStyle.size
                    });
                }
                var skewM = m[0][0].toFixed(3) + "," + m[1][0].toFixed(3) + "," + m[0][1].toFixed(3) + "," + m[1][1].toFixed(3) + ",0,0";
                var skewOffset = mr(d.x / Z) + "," + mr(d.y / Z);
                lineStr.push('<g_vml_:skew on="t" matrix="', skewM, '" ', ' offset="', skewOffset, '" origin="', left, ' 0" />', '<g_vml_:path textpathok="true" />', '<g_vml_:textpath on="true" string="', encodeHtmlAttribute(text), '" style="v-text-align:', textAlign, ";font:", encodeHtmlAttribute(fontStyleString), '" /></g_vml_:line>');
                this.element_.insertAdjacentHTML("beforeEnd", lineStr.join(""));
            };
            contextPrototype.fillText = function(text, x, y, maxWidth) {
                this.drawText_(text, x, y, maxWidth, false);
            };
            contextPrototype.strokeText = function(text, x, y, maxWidth) {
                this.drawText_(text, x, y, maxWidth, true);
            };
            contextPrototype.measureText = function(text) {
                if (!this.textMeasureEl_) {
                    var s = '<span style="position:absolute;' + "top:-20000px;left:0;padding:0;margin:0;border:none;" + 'white-space:pre;"></span>';
                    this.element_.insertAdjacentHTML("beforeEnd", s);
                    this.textMeasureEl_ = this.element_.lastChild;
                }
                var doc = this.element_.ownerDocument;
                this.textMeasureEl_.innerHTML = "";
                this.textMeasureEl_.style.font = this.font;
                // Don't use innerHTML or innerText because they allow markup/whitespace.
                this.textMeasureEl_.appendChild(doc.createTextNode(text));
                return {
                    width: this.textMeasureEl_.offsetWidth
                };
            };
            /******** STUBS ********/
            contextPrototype.clip = function() {};
            contextPrototype.arcTo = function() {};
            contextPrototype.createPattern = function(image, repetition) {
                return new CanvasPattern_(image, repetition);
            };
            // Gradient / Pattern Stubs
            function CanvasGradient_(aType) {
                this.type_ = aType;
                this.x0_ = 0;
                this.y0_ = 0;
                this.r0_ = 0;
                this.x1_ = 0;
                this.y1_ = 0;
                this.r1_ = 0;
                this.colors_ = [];
            }
            CanvasGradient_.prototype.addColorStop = function(aOffset, aColor) {
                aColor = processStyle(aColor);
                this.colors_.push({
                    offset: aOffset,
                    color: aColor.color,
                    alpha: aColor.alpha
                });
            };
            function CanvasPattern_(image, repetition) {
                assertImageIsValid(image);
                switch (repetition) {
                  case "repeat":
                  case null:
                  case "":
                    this.repetition_ = "repeat";
                    break;

                  case "repeat-x":
                  case "repeat-y":
                  case "no-repeat":
                    this.repetition_ = repetition;
                    break;

                  default:
                    throwException("SYNTAX_ERR");
                }
                this.src_ = image.src;
                this.width_ = image.width;
                this.height_ = image.height;
            }
            function throwException(s) {
                throw new DOMException_(s);
            }
            function assertImageIsValid(img) {
                if (!img || img.nodeType != 1 || img.tagName != "IMG") {
                    throwException("TYPE_MISMATCH_ERR");
                }
                if (img.readyState != "complete") {
                    throwException("INVALID_STATE_ERR");
                }
            }
            function DOMException_(s) {
                this.code = this[s];
                this.message = s + ": DOM Exception " + this.code;
            }
            var p = DOMException_.prototype = new Error();
            p.INDEX_SIZE_ERR = 1;
            p.DOMSTRING_SIZE_ERR = 2;
            p.HIERARCHY_REQUEST_ERR = 3;
            p.WRONG_DOCUMENT_ERR = 4;
            p.INVALID_CHARACTER_ERR = 5;
            p.NO_DATA_ALLOWED_ERR = 6;
            p.NO_MODIFICATION_ALLOWED_ERR = 7;
            p.NOT_FOUND_ERR = 8;
            p.NOT_SUPPORTED_ERR = 9;
            p.INUSE_ATTRIBUTE_ERR = 10;
            p.INVALID_STATE_ERR = 11;
            p.SYNTAX_ERR = 12;
            p.INVALID_MODIFICATION_ERR = 13;
            p.NAMESPACE_ERR = 14;
            p.INVALID_ACCESS_ERR = 15;
            p.VALIDATION_ERR = 16;
            p.TYPE_MISMATCH_ERR = 17;
            // set up externs
            G_vmlCanvasManager = G_vmlCanvasManager_;
            CanvasRenderingContext2D = CanvasRenderingContext2D_;
            CanvasGradient = CanvasGradient_;
            CanvasPattern = CanvasPattern_;
            DOMException = DOMException_;
        })();
    } else {
        // make the canvas test simple by kener.linfeng@gmail.com
        G_vmlCanvasManager = false;
    }
    module.exports = G_vmlCanvasManager;
});

define("app/pc/canvaslib/tool/curve", [ "app/pc/canvaslib/tool/vector" ], function(require, exports, module) {
    /**
 * 曲线辅助模块
 * @module zrender/tool/curve
 * @author pissang(https://www.github.com/pissang)
 */
    var vector = require("app/pc/canvaslib/tool/vector");
    "use strict";
    var EPSILON = 1e-4;
    var THREE_SQRT = Math.sqrt(3);
    var ONE_THIRD = 1 / 3;
    // 临时变量
    var _v0 = vector.create();
    var _v1 = vector.create();
    var _v2 = vector.create();
    // var _v3 = vector.create();
    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /*
    function evalCubicCoeff(a, b, c, d, t) {
        return ((a * t + b) * t + c) * t + d;
    }
    */
    /** 
     * 计算三次贝塞尔值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return onet * onet * (onet * p0 + 3 * t * p1) + t * t * (t * p3 + 3 * onet * p2);
    }
    /** 
     * 计算三次贝塞尔导数值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @return {number}
     */
    function cubicDerivativeAt(p0, p1, p2, p3, t) {
        var onet = 1 - t;
        return 3 * (((p1 - p0) * onet + 2 * (p2 - p1) * t) * onet + (p3 - p2) * t * t);
    }
    /**
     * 计算三次贝塞尔方程根，使用盛金公式
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} val
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function cubicRootAt(p0, p1, p2, p3, val, roots) {
        // Evaluate roots of cubic functions
        var a = p3 + 3 * (p1 - p2) - p0;
        var b = 3 * (p2 - p1 * 2 + p0);
        var c = 3 * (p1 - p0);
        var d = p0 - val;
        var A = b * b - 3 * a * c;
        var B = b * c - 9 * a * d;
        var C = c * c - 3 * b * d;
        var n = 0;
        if (isAroundZero(A) && isAroundZero(B)) {
            if (isAroundZero(b)) {
                roots[0] = 0;
            } else {
                var t1 = -c / b;
                //t1, t2, t3, b is not zero
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        } else {
            var disc = B * B - 4 * A * C;
            if (isAroundZero(disc)) {
                var K = B / A;
                var t1 = -b / a + K;
                // t1, a is not zero
                var t2 = -K / 2;
                // t2, t3
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            } else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var Y1 = A * b + 1.5 * a * (-B + discSqrt);
                var Y2 = A * b + 1.5 * a * (-B - discSqrt);
                if (Y1 < 0) {
                    Y1 = -Math.pow(-Y1, ONE_THIRD);
                } else {
                    Y1 = Math.pow(Y1, ONE_THIRD);
                }
                if (Y2 < 0) {
                    Y2 = -Math.pow(-Y2, ONE_THIRD);
                } else {
                    Y2 = Math.pow(Y2, ONE_THIRD);
                }
                var t1 = (-b - (Y1 + Y2)) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            } else {
                var T = (2 * A * b - 3 * a * B) / (2 * Math.sqrt(A * A * A));
                var theta = Math.acos(T) / 3;
                var ASqrt = Math.sqrt(A);
                var tmp = Math.cos(theta);
                var t1 = (-b - 2 * ASqrt * tmp) / (3 * a);
                var t2 = (-b + ASqrt * (tmp + THREE_SQRT * Math.sin(theta))) / (3 * a);
                var t3 = (-b + ASqrt * (tmp - THREE_SQRT * Math.sin(theta))) / (3 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
                if (t3 >= 0 && t3 <= 1) {
                    roots[n++] = t3;
                }
            }
        }
        return n;
    }
    /**
     * 计算三次贝塞尔方程极限值的位置
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {Array.<number>} extrema
     * @return {number} 有效数目
     */
    function cubicExtrema(p0, p1, p2, p3, extrema) {
        var b = 6 * p2 - 12 * p1 + 6 * p0;
        var a = 9 * p1 + 3 * p3 - 3 * p0 - 9 * p2;
        var c = 3 * p1 - 3 * p0;
        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
            }
        } else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                extrema[0] = -b / (2 * a);
            } else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    extrema[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    extrema[n++] = t2;
                }
            }
        }
        return n;
    }
    /**
     * 细分三次贝塞尔曲线
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} p3
     * @param  {number} t
     * @param  {Array.<number>} out
     */
    function cubicSubdivide(p0, p1, p2, p3, t, out) {
        var p01 = (p1 - p0) * t + p0;
        var p12 = (p2 - p1) * t + p1;
        var p23 = (p3 - p2) * t + p2;
        var p012 = (p12 - p01) * t + p01;
        var p123 = (p23 - p12) * t + p12;
        var p0123 = (p123 - p012) * t + p012;
        // Seg0
        out[0] = p0;
        out[1] = p01;
        out[2] = p012;
        out[3] = p0123;
        // Seg1
        out[4] = p0123;
        out[5] = p123;
        out[6] = p23;
        out[7] = p3;
    }
    /**
     * 投射点到三次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} [out] 投射点
     * @return {number}
     */
    function cubicProjectPoint(x0, y0, x1, y1, x2, y2, x3, y3, x, y, out) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = .005;
        var d = Infinity;
        _v0[0] = x;
        _v0[1] = y;
        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += .05) {
            _v1[0] = cubicAt(x0, x1, x2, x3, _t);
            _v1[1] = cubicAt(y0, y1, y2, y3, _t);
            var d1 = vector.distSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;
        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = cubicAt(x0, x1, x2, x3, prev);
            _v1[1] = cubicAt(y0, y1, y2, y3, prev);
            var d1 = vector.distSquare(_v1, _v0);
            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            } else {
                // t + interval
                _v2[0] = cubicAt(x0, x1, x2, x3, next);
                _v2[1] = cubicAt(y0, y1, y2, y3, next);
                var d2 = vector.distSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                } else {
                    interval *= .5;
                }
            }
        }
        // t
        if (out) {
            out[0] = cubicAt(x0, x1, x2, x3, t);
            out[1] = cubicAt(y0, y1, y2, y3, t);
        }
        // console.log(interval, i);
        return Math.sqrt(d);
    }
    /**
     * 计算二次方贝塞尔值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticAt(p0, p1, p2, t) {
        var onet = 1 - t;
        return onet * (onet * p0 + 2 * t * p1) + t * t * p2;
    }
    /**
     * 计算二次方贝塞尔导数值
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @return {number}
     */
    function quadraticDerivativeAt(p0, p1, p2, t) {
        return 2 * ((1 - t) * (p1 - p0) + t * (p2 - p1));
    }
    /**
     * 计算二次方贝塞尔方程根
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @param  {number} t
     * @param  {Array.<number>} roots
     * @return {number} 有效根数目
     */
    function quadraticRootAt(p0, p1, p2, val, roots) {
        var a = p0 - 2 * p1 + p2;
        var b = 2 * (p1 - p0);
        var c = p0 - val;
        var n = 0;
        if (isAroundZero(a)) {
            if (isNotAroundZero(b)) {
                var t1 = -c / b;
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            }
        } else {
            var disc = b * b - 4 * a * c;
            if (isAroundZero(disc)) {
                var t1 = -b / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
            } else if (disc > 0) {
                var discSqrt = Math.sqrt(disc);
                var t1 = (-b + discSqrt) / (2 * a);
                var t2 = (-b - discSqrt) / (2 * a);
                if (t1 >= 0 && t1 <= 1) {
                    roots[n++] = t1;
                }
                if (t2 >= 0 && t2 <= 1) {
                    roots[n++] = t2;
                }
            }
        }
        return n;
    }
    /**
     * 计算二次贝塞尔方程极限值
     * @memberOf module:zrender/tool/curve
     * @param  {number} p0
     * @param  {number} p1
     * @param  {number} p2
     * @return {number}
     */
    function quadraticExtremum(p0, p1, p2) {
        var divider = p0 + p2 - 2 * p1;
        if (divider === 0) {
            // p1 is center of p0 and p2 
            return .5;
        } else {
            return (p0 - p1) / divider;
        }
    }
    /**
     * 投射点到二次贝塞尔曲线上，返回投射距离。
     * 投射点有可能会有一个或者多个，这里只返回其中距离最短的一个。
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x
     * @param {number} y
     * @param {Array.<number>} out 投射点
     * @return {number}
     */
    function quadraticProjectPoint(x0, y0, x1, y1, x2, y2, x, y, out) {
        // http://pomax.github.io/bezierinfo/#projections
        var t;
        var interval = .005;
        var d = Infinity;
        _v0[0] = x;
        _v0[1] = y;
        // 先粗略估计一下可能的最小距离的 t 值
        // PENDING
        for (var _t = 0; _t < 1; _t += .05) {
            _v1[0] = quadraticAt(x0, x1, x2, _t);
            _v1[1] = quadraticAt(y0, y1, y2, _t);
            var d1 = vector.distSquare(_v0, _v1);
            if (d1 < d) {
                t = _t;
                d = d1;
            }
        }
        d = Infinity;
        // At most 32 iteration
        for (var i = 0; i < 32; i++) {
            if (interval < EPSILON) {
                break;
            }
            var prev = t - interval;
            var next = t + interval;
            // t - interval
            _v1[0] = quadraticAt(x0, x1, x2, prev);
            _v1[1] = quadraticAt(y0, y1, y2, prev);
            var d1 = vector.distSquare(_v1, _v0);
            if (prev >= 0 && d1 < d) {
                t = prev;
                d = d1;
            } else {
                // t + interval
                _v2[0] = quadraticAt(x0, x1, x2, next);
                _v2[1] = quadraticAt(y0, y1, y2, next);
                var d2 = vector.distSquare(_v2, _v0);
                if (next <= 1 && d2 < d) {
                    t = next;
                    d = d2;
                } else {
                    interval *= .5;
                }
            }
        }
        // t
        if (out) {
            out[0] = quadraticAt(x0, x1, x2, t);
            out[1] = quadraticAt(y0, y1, y2, t);
        }
        // console.log(interval, i);
        return Math.sqrt(d);
    }
    module.exports = {
        cubicAt: cubicAt,
        cubicDerivativeAt: cubicDerivativeAt,
        cubicRootAt: cubicRootAt,
        cubicExtrema: cubicExtrema,
        cubicSubdivide: cubicSubdivide,
        cubicProjectPoint: cubicProjectPoint,
        quadraticAt: quadraticAt,
        quadraticDerivativeAt: quadraticDerivativeAt,
        quadraticRootAt: quadraticRootAt,
        quadraticExtremum: quadraticExtremum,
        quadraticProjectPoint: quadraticProjectPoint
    };
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
