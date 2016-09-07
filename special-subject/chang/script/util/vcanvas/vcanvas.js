/*! 一唱成名 create by ErickSong */
/* 
* @Author: WhiteWang
* @Date:   2015-09-08 20:41:16
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-10-28 15:40:39
*/
//效果见页面：http://static9.pptv.com/chang/pages/pc/60out/client.html
define("util/vcanvas/vcanvas", [], function(require) {
    /**
     * [VCanvas description]
     * opt.canvas   canvas的ID
     * opt.nColor   数组，两个值，代表数字的两种颜色
     */
    var VCanvas = function() {
        function extend(target, options) {
            for (name in options) {
                var copy = options[name];
                if (copy instanceof Array) {
                    target[name] = extend([], copy);
                } else if (copy instanceof Object) {
                    target[name] = extend({}, copy);
                } else {
                    target[name] = options[name];
                }
            }
            return target;
        }
        //画数字
        function drawNumbers(ctx, opt) {
            var numbers = opt.numbers;
            len = numbers.length;
            for (var i = 0; i < len; i++) {
                var deg = Math.PI * (1 - i / (len - 1));
                var x = opt.cp.x + opt.radius * Math.cos(deg);
                var y = opt.cp.y - opt.radius * Math.sin(deg);
                var fillStyle = opt.color[0];
                // if(i>len/2){
                //     fillStyle = opt.color[1];
                // }
                ctx.fillStyle = fillStyle;
                ctx.textAlign = "center";
                ctx.font = opt.font;
                ctx.fillText(numbers[i], x, y);
            }
        }
        function drawDisc(ctx, opt) {
            var len = opt.lineNumber;
            var arr = [];
            var oRadius = opt.radius;
            //外半径
            var iRadius = oRadius - opt.lineLength;
            //内半径
            for (var i = 0; i < len; i++) {
                var obj = {};
                var deg = Math.PI * (1 - i / (len - 1));
                obj.x1 = opt.cp.x + oRadius * Math.cos(deg);
                obj.y1 = opt.cp.y - oRadius * Math.sin(deg);
                obj.x2 = opt.cp.x + iRadius * Math.cos(deg);
                obj.y2 = opt.cp.y - iRadius * Math.sin(deg);
                obj.color = opt.color;
                obj.lineWidth = opt.lineWidth;
                // drawLine(ctx, obj);
                arr.push(obj);
            }
            return arr;
        }
        function drawLine(ctx, opt) {
            ctx.beginPath();
            ctx.strokeStyle = opt.color;
            ctx.lineWidth = opt.lineWidth;
            ctx.moveTo(opt.x1, opt.y1);
            ctx.lineTo(opt.x2, opt.y2);
            ctx.stroke();
        }
        //计算圆心坐标
        function getCenterPos(w, h) {
            return {
                x: parseInt(w / 2),
                y: h
            };
        }
        //计算半径
        function computeRadius(w, h) {
            var halfWidth = parseInt(w / 2);
            var radius = halfWidth;
            if (halfWidth > h) {
                radius = h;
            }
            return radius;
        }
        function clearCircle(ctx, opt) {
            ctx.beginPath();
            ctx.arc(opt.x, opt.y, opt.r, 0, 2 * Math.PI);
            ctx.clip();
            ctx.clearRect(0, 0, opt.width, opt.height);
        }
        function repaintDisc(ctx, opt) {
            var time = 300;
            var disc = opt.disc;
            var colors = opt.colors;
            var len = disc.length;
            var n = Math.round(len * opt.percent);
            var lineArr = [];
            for (var i = 0; i < n; i++) {
                disc[i].color = colors[0];
                drawLine(ctx, disc[i]);
            }
            for (var i = n; i < len; i++) {
                disc[i].color = colors[1];
                drawLine(ctx, disc[i]);
            }
        }
        return function(opt) {
            opt = extend({
                canvas: "speed",
                //canvas id
                nColor: [ "#bd7845", "#922f2b" ],
                //数字颜色
                lineWidth: 1,
                //线粗细
                lineLength: 15,
                //线长度
                lColor: [ "#ec904c", "#d5d5d5" ],
                //线颜色
                lineNumber: 30,
                //线个数,
                scale: 1,
                font: "12px Arial"
            }, opt);
            var canvas = document.getElementById(opt.canvas);
            var ctx = canvas.getContext("2d");
            ctx.scale(opt.scale, opt.scale);
            var width = parseInt(canvas.width / opt.scale);
            var height = parseInt(canvas.height / opt.scale);
            var cp = getCenterPos(width, height);
            var cRadius = computeRadius(width, height);
            var textRadius = opt.textRadius ? opt.textRadius : cRadius - 10 / opt.scale;
            var lineRadius = opt.lineRadius ? opt.lineRadius : cRadius - 18 / opt.scale;
            drawNumbers(ctx, {
                width: width,
                height: height,
                numbers: [ "0", "1", "2", "3", "4", "5" ],
                font: opt.font,
                color: opt.nColor,
                cp: cp,
                scale: opt.scale,
                radius: textRadius
            });
            var disc = drawDisc(ctx, {
                lineWidth: opt.lineWidth,
                lineLength: opt.lineLength,
                color: opt.lColor[1],
                lineNumber: opt.lineNumber,
                radius: lineRadius,
                cp: cp,
                scale: opt.scale
            });
            var currPercent = 0;
            this.redraw = function(positive, negtive) {
                clearCircle(ctx, {
                    x: cp.x,
                    y: cp.y,
                    r: lineRadius + 1,
                    width: width,
                    height: height
                });
                // var percent = 0;
                if (positive == 0) {
                    percent = 0;
                } else {
                    percent = positive / (positive + negtive);
                }
                repaintDisc(ctx, {
                    disc: disc,
                    percent: percent,
                    colors: opt.lColor
                });
            };
        };
    }();
    return VCanvas;
});
