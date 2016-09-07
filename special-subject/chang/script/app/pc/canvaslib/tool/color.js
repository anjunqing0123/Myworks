/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/tool/color", [ "../tool/util", "../dep/excanvas" ], function(require, exports, module) {
    /**
 * 颜色辅助模块
 * @module zrender/tool/color
 */
    var util = require("../tool/util");
    var _ctx;
    // Color palette is an array containing the default colors for the chart's
    // series.
    // When all colors are used, new colors are selected from the start again.
    // Defaults to:
    // 默认色板
    var palette = [ "#ff9277", " #dddd00", " #ffc877", " #bbe3ff", " #d5ffbb", "#bbbbff", " #ddb000", " #b0dd00", " #e2bbff", " #ffbbe3", "#ff7777", " #ff9900", " #83dd00", " #77e3ff", " #778fff", "#c877ff", " #ff77ab", " #ff6600", " #aa8800", " #77c7ff", "#ad77ff", " #ff77ff", " #dd0083", " #777700", " #00aa00", "#0088aa", " #8400dd", " #aa0088", " #dd0000", " #772e00" ];
    var _palette = palette;
    var highlightColor = "rgba(255,255,0,0.5)";
    var _highlightColor = highlightColor;
    // 颜色格式
    /*jshint maxlen: 330 */
    var colorRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i;
    var _nameColors = {
        aliceblue: "#f0f8ff",
        antiquewhite: "#faebd7",
        aqua: "#0ff",
        aquamarine: "#7fffd4",
        azure: "#f0ffff",
        beige: "#f5f5dc",
        bisque: "#ffe4c4",
        black: "#000",
        blanchedalmond: "#ffebcd",
        blue: "#00f",
        blueviolet: "#8a2be2",
        brown: "#a52a2a",
        burlywood: "#deb887",
        cadetblue: "#5f9ea0",
        chartreuse: "#7fff00",
        chocolate: "#d2691e",
        coral: "#ff7f50",
        cornflowerblue: "#6495ed",
        cornsilk: "#fff8dc",
        crimson: "#dc143c",
        cyan: "#0ff",
        darkblue: "#00008b",
        darkcyan: "#008b8b",
        darkgoldenrod: "#b8860b",
        darkgray: "#a9a9a9",
        darkgrey: "#a9a9a9",
        darkgreen: "#006400",
        darkkhaki: "#bdb76b",
        darkmagenta: "#8b008b",
        darkolivegreen: "#556b2f",
        darkorange: "#ff8c00",
        darkorchid: "#9932cc",
        darkred: "#8b0000",
        darksalmon: "#e9967a",
        darkseagreen: "#8fbc8f",
        darkslateblue: "#483d8b",
        darkslategray: "#2f4f4f",
        darkslategrey: "#2f4f4f",
        darkturquoise: "#00ced1",
        darkviolet: "#9400d3",
        deeppink: "#ff1493",
        deepskyblue: "#00bfff",
        dimgray: "#696969",
        dimgrey: "#696969",
        dodgerblue: "#1e90ff",
        firebrick: "#b22222",
        floralwhite: "#fffaf0",
        forestgreen: "#228b22",
        fuchsia: "#f0f",
        gainsboro: "#dcdcdc",
        ghostwhite: "#f8f8ff",
        gold: "#ffd700",
        goldenrod: "#daa520",
        gray: "#808080",
        grey: "#808080",
        green: "#008000",
        greenyellow: "#adff2f",
        honeydew: "#f0fff0",
        hotpink: "#ff69b4",
        indianred: "#cd5c5c",
        indigo: "#4b0082",
        ivory: "#fffff0",
        khaki: "#f0e68c",
        lavender: "#e6e6fa",
        lavenderblush: "#fff0f5",
        lawngreen: "#7cfc00",
        lemonchiffon: "#fffacd",
        lightblue: "#add8e6",
        lightcoral: "#f08080",
        lightcyan: "#e0ffff",
        lightgoldenrodyellow: "#fafad2",
        lightgray: "#d3d3d3",
        lightgrey: "#d3d3d3",
        lightgreen: "#90ee90",
        lightpink: "#ffb6c1",
        lightsalmon: "#ffa07a",
        lightseagreen: "#20b2aa",
        lightskyblue: "#87cefa",
        lightslategray: "#789",
        lightslategrey: "#789",
        lightsteelblue: "#b0c4de",
        lightyellow: "#ffffe0",
        lime: "#0f0",
        limegreen: "#32cd32",
        linen: "#faf0e6",
        magenta: "#f0f",
        maroon: "#800000",
        mediumaquamarine: "#66cdaa",
        mediumblue: "#0000cd",
        mediumorchid: "#ba55d3",
        mediumpurple: "#9370d8",
        mediumseagreen: "#3cb371",
        mediumslateblue: "#7b68ee",
        mediumspringgreen: "#00fa9a",
        mediumturquoise: "#48d1cc",
        mediumvioletred: "#c71585",
        midnightblue: "#191970",
        mintcream: "#f5fffa",
        mistyrose: "#ffe4e1",
        moccasin: "#ffe4b5",
        navajowhite: "#ffdead",
        navy: "#000080",
        oldlace: "#fdf5e6",
        olive: "#808000",
        olivedrab: "#6b8e23",
        orange: "#ffa500",
        orangered: "#ff4500",
        orchid: "#da70d6",
        palegoldenrod: "#eee8aa",
        palegreen: "#98fb98",
        paleturquoise: "#afeeee",
        palevioletred: "#d87093",
        papayawhip: "#ffefd5",
        peachpuff: "#ffdab9",
        peru: "#cd853f",
        pink: "#ffc0cb",
        plum: "#dda0dd",
        powderblue: "#b0e0e6",
        purple: "#800080",
        red: "#f00",
        rosybrown: "#bc8f8f",
        royalblue: "#4169e1",
        saddlebrown: "#8b4513",
        salmon: "#fa8072",
        sandybrown: "#f4a460",
        seagreen: "#2e8b57",
        seashell: "#fff5ee",
        sienna: "#a0522d",
        silver: "#c0c0c0",
        skyblue: "#87ceeb",
        slateblue: "#6a5acd",
        slategray: "#708090",
        slategrey: "#708090",
        snow: "#fffafa",
        springgreen: "#00ff7f",
        steelblue: "#4682b4",
        tan: "#d2b48c",
        teal: "#008080",
        thistle: "#d8bfd8",
        tomato: "#ff6347",
        turquoise: "#40e0d0",
        violet: "#ee82ee",
        wheat: "#f5deb3",
        white: "#fff",
        whitesmoke: "#f5f5f5",
        yellow: "#ff0",
        yellowgreen: "#9acd32"
    };
    /**
     * 自定义调色板
     */
    function customPalette(userPalete) {
        palette = userPalete;
    }
    /**
     * 复位默认色板
     */
    function resetPalette() {
        palette = _palette;
    }
    /**
     * 获取色板颜色
     * @memberOf module:zrender/tool/color
     * @param {number} idx 色板位置
     * @param {Array.<string>} [userPalete] 自定义色板
     * @return {string} 颜色
     */
    function getColor(idx, userPalete) {
        idx = idx | 0;
        userPalete = userPalete || palette;
        return userPalete[idx % userPalete.length];
    }
    /**
     * 自定义默认高亮颜色
     */
    function customHighlight(userHighlightColor) {
        highlightColor = userHighlightColor;
    }
    /**
     * 重置默认高亮颜色
     */
    function resetHighlight() {
        _highlightColor = highlightColor;
    }
    /**
     * 获取默认高亮颜色
     */
    function getHighlightColor() {
        return highlightColor;
    }
    /**
     * 径向渐变
     * @memberOf module:zrender/tool/color
     * @param {number} x0 渐变起点
     * @param {number} y0
     * @param {number} r0
     * @param {number} x1 渐变终点
     * @param {number} y1
     * @param {number} r1
     * @param {Array} colorList 颜色列表
     * @return {CanvasGradient}
     */
    function getRadialGradient(x0, y0, r0, x1, y1, r1, colorList) {
        if (!_ctx) {
            _ctx = util.getContext();
        }
        var gradient = _ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        for (var i = 0, l = colorList.length; i < l; i++) {
            gradient.addColorStop(colorList[i][0], colorList[i][1]);
        }
        gradient.__nonRecursion = true;
        return gradient;
    }
    /**
     * 线性渐变
     * @param {Object} x0 渐变起点
     * @param {Object} y0
     * @param {Object} x1 渐变终点
     * @param {Object} y1
     * @param {Array} colorList 颜色列表
     */
    function getLinearGradient(x0, y0, x1, y1, colorList) {
        if (!_ctx) {
            _ctx = util.getContext();
        }
        var gradient = _ctx.createLinearGradient(x0, y0, x1, y1);
        for (var i = 0, l = colorList.length; i < l; i++) {
            gradient.addColorStop(colorList[i][0], colorList[i][1]);
        }
        gradient.__nonRecursion = true;
        return gradient;
    }
    /**
     * 获取两种颜色之间渐变颜色数组
     * @param {color} start 起始颜色
     * @param {color} end 结束颜色
     * @param {number} step 渐变级数
     * @return {Array}  颜色数组
     */
    function getStepColors(start, end, step) {
        start = toRGBA(start);
        end = toRGBA(end);
        start = getData(start);
        end = getData(end);
        var colors = [];
        var stepR = (end[0] - start[0]) / step;
        var stepG = (end[1] - start[1]) / step;
        var stepB = (end[2] - start[2]) / step;
        var stepA = (end[3] - start[3]) / step;
        // 生成颜色集合
        // fix by linfeng 颜色堆积
        for (var i = 0, r = start[0], g = start[1], b = start[2], a = start[3]; i < step; i++) {
            colors[i] = toColor([ adjust(Math.floor(r), [ 0, 255 ]), adjust(Math.floor(g), [ 0, 255 ]), adjust(Math.floor(b), [ 0, 255 ]), a.toFixed(4) - 0 ], "rgba");
            r += stepR;
            g += stepG;
            b += stepB;
            a += stepA;
        }
        r = end[0];
        g = end[1];
        b = end[2];
        a = end[3];
        colors[i] = toColor([ r, g, b, a ], "rgba");
        return colors;
    }
    /**
     * 获取指定级数的渐变颜色数组
     * @memberOf module:zrender/tool/color
     * @param {Array.<string>} colors 颜色组
     * @param {number} [step=20] 渐变级数
     * @return {Array.<string>}  颜色数组
     */
    function getGradientColors(colors, step) {
        var ret = [];
        var len = colors.length;
        if (step === undefined) {
            step = 20;
        }
        if (len === 1) {
            ret = getStepColors(colors[0], colors[0], step);
        } else if (len > 1) {
            for (var i = 0, n = len - 1; i < n; i++) {
                var steps = getStepColors(colors[i], colors[i + 1], step);
                if (i < n - 1) {
                    steps.pop();
                }
                ret = ret.concat(steps);
            }
        }
        return ret;
    }
    /**
     * 颜色值数组转为指定格式颜色,例如:<br/>
     * data = [60,20,20,0.1] format = 'rgba'
     * 返回：rgba(60,20,20,0.1)
     * @param {Array} data 颜色值数组
     * @param {string} format 格式,默认rgb
     * @return {string} 颜色
     */
    function toColor(data, format) {
        format = format || "rgb";
        if (data && (data.length === 3 || data.length === 4)) {
            data = map(data, function(c) {
                return c > 1 ? Math.ceil(c) : c;
            });
            if (format.indexOf("hex") > -1) {
                return "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + +data[2]).toString(16).slice(1);
            } else if (format.indexOf("hs") > -1) {
                var sx = map(data.slice(1, 3), function(c) {
                    return c + "%";
                });
                data[1] = sx[0];
                data[2] = sx[1];
            }
            if (format.indexOf("a") > -1) {
                if (data.length === 3) {
                    data.push(1);
                }
                data[3] = adjust(data[3], [ 0, 1 ]);
                return format + "(" + data.slice(0, 4).join(",") + ")";
            }
            return format + "(" + data.slice(0, 3).join(",") + ")";
        }
    }
    /**
     * 颜色字符串转换为rgba数组
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {Array.<number>} 颜色值数组
     */
    function toArray(color) {
        color = trim(color);
        if (color.indexOf("rgba") < 0) {
            color = toRGBA(color);
        }
        var data = [];
        var i = 0;
        color.replace(/[\d.]+/g, function(n) {
            if (i < 3) {
                n = n | 0;
            } else {
                // Alpha
                n = +n;
            }
            data[i++] = n;
        });
        return data;
    }
    /**
     * 颜色格式转化
     *
     * @param {string} color 颜色值数组
     * @param {string} format 格式,默认rgb
     * @return {string} 颜色
     */
    function convert(color, format) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var data = getData(color);
        var alpha = data[3];
        if (typeof alpha === "undefined") {
            alpha = 1;
        }
        if (color.indexOf("hsb") > -1) {
            data = _HSV_2_RGB(data);
        } else if (color.indexOf("hsl") > -1) {
            data = _HSL_2_RGB(data);
        }
        if (format.indexOf("hsb") > -1 || format.indexOf("hsv") > -1) {
            data = _RGB_2_HSB(data);
        } else if (format.indexOf("hsl") > -1) {
            data = _RGB_2_HSL(data);
        }
        data[3] = alpha;
        return toColor(data, format);
    }
    /**
     * 转换为rgba格式的颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} rgba颜色，rgba(r,g,b,a)
     */
    function toRGBA(color) {
        return convert(color, "rgba");
    }
    /**
     * 转换为rgb数字格式的颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} rgb颜色，rgb(0,0,0)格式
     */
    function toRGB(color) {
        return convert(color, "rgb");
    }
    /**
     * 转换为16进制颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 16进制颜色，#rrggbb格式
     */
    function toHex(color) {
        return convert(color, "hex");
    }
    /**
     * 转换为HSV颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSVA颜色，hsva(h,s,v,a)
     */
    function toHSVA(color) {
        return convert(color, "hsva");
    }
    /**
     * 转换为HSV颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSV颜色，hsv(h,s,v)
     */
    function toHSV(color) {
        return convert(color, "hsv");
    }
    /**
     * 转换为HSBA颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSBA颜色，hsba(h,s,b,a)
     */
    function toHSBA(color) {
        return convert(color, "hsba");
    }
    /**
     * 转换为HSB颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSB颜色，hsb(h,s,b)
     */
    function toHSB(color) {
        return convert(color, "hsb");
    }
    /**
     * 转换为HSLA颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSLA颜色，hsla(h,s,l,a)
     */
    function toHSLA(color) {
        return convert(color, "hsla");
    }
    /**
     * 转换为HSL颜色
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} HSL颜色，hsl(h,s,l)
     */
    function toHSL(color) {
        return convert(color, "hsl");
    }
    /**
     * 转换颜色名
     * 
     * @param {string} color 颜色
     * @return {string} 颜色名
     */
    function toName(color) {
        for (var key in _nameColors) {
            if (toHex(_nameColors[key]) === toHex(color)) {
                return key;
            }
        }
        return null;
    }
    /**
     * 移除颜色中多余空格
     * 
     * @param {string} color 颜色
     * @return {string} 无空格颜色
     */
    function trim(color) {
        return String(color).replace(/\s+/g, "");
    }
    /**
     * 颜色规范化
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 规范化后的颜色
     */
    function normalize(color) {
        // 颜色名
        if (_nameColors[color]) {
            color = _nameColors[color];
        }
        // 去掉空格
        color = trim(color);
        // hsv与hsb等价
        color = color.replace(/hsv/i, "hsb");
        // rgb转为rrggbb
        if (/^#[\da-f]{3}$/i.test(color)) {
            color = parseInt(color.slice(1), 16);
            var r = (color & 3840) << 8;
            var g = (color & 240) << 4;
            var b = color & 15;
            color = "#" + ((1 << 24) + (r << 4) + r + (g << 4) + g + (b << 4) + b).toString(16).slice(1);
        }
        // 或者使用以下正则替换，不过 chrome 下性能相对差点
        // color = color.replace(/^#([\da-f])([\da-f])([\da-f])$/i, '#$1$1$2$2$3$3');
        return color;
    }
    /**
     * 颜色加深或减淡，当level>0加深，当level<0减淡
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @param {number} level 升降程度,取值区间[-1,1]
     * @return {string} 加深或减淡后颜色值
     */
    function lift(color, level) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var direct = level > 0 ? 1 : -1;
        if (typeof level === "undefined") {
            level = 0;
        }
        level = Math.abs(level) > 1 ? 1 : Math.abs(level);
        color = toRGB(color);
        var data = getData(color);
        for (var i = 0; i < 3; i++) {
            if (direct === 1) {
                data[i] = data[i] * (1 - level) | 0;
            } else {
                data[i] = (255 - data[i]) * level + data[i] | 0;
            }
        }
        return "rgb(" + data.join(",") + ")";
    }
    /**
     * 颜色翻转,[255-r,255-g,255-b,1-a]
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @return {string} 翻转颜色
     */
    function reverse(color) {
        if (!isCalculableColor(color)) {
            return color;
        }
        var data = getData(toRGBA(color));
        data = map(data, function(c) {
            return 255 - c;
        });
        return toColor(data, "rgb");
    }
    /**
     * 简单两种颜色混合
     * @memberOf module:zrender/tool/color
     * @param {string} color1 第一种颜色
     * @param {string} color2 第二种颜色
     * @param {number} weight 混合权重[0-1]
     * @return {string} 结果色,rgb(r,g,b)或rgba(r,g,b,a)
     */
    function mix(color1, color2, weight) {
        if (!isCalculableColor(color1) || !isCalculableColor(color2)) {
            return color1;
        }
        if (typeof weight === "undefined") {
            weight = .5;
        }
        weight = 1 - adjust(weight, [ 0, 1 ]);
        var w = weight * 2 - 1;
        var data1 = getData(toRGBA(color1));
        var data2 = getData(toRGBA(color2));
        var d = data1[3] - data2[3];
        var weight1 = ((w * d === -1 ? w : (w + d) / (1 + w * d)) + 1) / 2;
        var weight2 = 1 - weight1;
        var data = [];
        for (var i = 0; i < 3; i++) {
            data[i] = data1[i] * weight1 + data2[i] * weight2;
        }
        var alpha = data1[3] * weight + data2[3] * (1 - weight);
        alpha = Math.max(0, Math.min(1, alpha));
        if (data1[3] === 1 && data2[3] === 1) {
            // 不考虑透明度
            return toColor(data, "rgb");
        }
        data[3] = alpha;
        return toColor(data, "rgba");
    }
    /**
     * 随机颜色
     * 
     * @return {string} 颜色值，#rrggbb格式
     */
    function random() {
        return "#" + (Math.random().toString(16) + "0000").slice(2, 8);
    }
    /**
     * 获取颜色值数组,返回值范围： <br/>
     * RGB 范围[0-255] <br/>
     * HSL/HSV/HSB 范围[0-1]<br/>
     * A透明度范围[0-1]
     * 支持格式：
     * #rgb
     * #rrggbb
     * rgb(r,g,b)
     * rgb(r%,g%,b%)
     * rgba(r,g,b,a)
     * hsb(h,s,b) // hsv与hsb等价
     * hsb(h%,s%,b%)
     * hsba(h,s,b,a)
     * hsl(h,s,l)
     * hsl(h%,s%,l%)
     * hsla(h,s,l,a)
     *
     * @param {string} color 颜色
     * @return {Array.<number>} 颜色值数组或null
     */
    function getData(color) {
        color = normalize(color);
        var r = color.match(colorRegExp);
        if (r === null) {
            throw new Error("The color format error");
        }
        var d;
        var a;
        var data = [];
        var rgb;
        if (r[2]) {
            // #rrggbb
            d = r[2].replace("#", "").split("");
            rgb = [ d[0] + d[1], d[2] + d[3], d[4] + d[5] ];
            data = map(rgb, function(c) {
                return adjust(parseInt(c, 16), [ 0, 255 ]);
            });
        } else if (r[4]) {
            // rgb rgba
            var rgba = r[4].split(",");
            a = rgba[3];
            rgb = rgba.slice(0, 3);
            data = map(rgb, function(c) {
                c = Math.floor(c.indexOf("%") > 0 ? parseInt(c, 0) * 2.55 : c);
                return adjust(c, [ 0, 255 ]);
            });
            if (typeof a !== "undefined") {
                data.push(adjust(parseFloat(a), [ 0, 1 ]));
            }
        } else if (r[5] || r[6]) {
            // hsb hsba hsl hsla
            var hsxa = (r[5] || r[6]).split(",");
            var h = parseInt(hsxa[0], 0) / 360;
            var s = hsxa[1];
            var x = hsxa[2];
            a = hsxa[3];
            data = map([ s, x ], function(c) {
                return adjust(parseFloat(c) / 100, [ 0, 1 ]);
            });
            data.unshift(h);
            if (typeof a !== "undefined") {
                data.push(adjust(parseFloat(a), [ 0, 1 ]));
            }
        }
        return data;
    }
    /**
     * 设置颜色透明度
     * @memberOf module:zrender/tool/color
     * @param {string} color 颜色
     * @param {number} a 透明度,区间[0,1]
     * @return {string} rgba颜色值
     */
    function alpha(color, a) {
        if (!isCalculableColor(color)) {
            return color;
        }
        if (a === null) {
            a = 1;
        }
        var data = getData(toRGBA(color));
        data[3] = adjust(Number(a).toFixed(4), [ 0, 1 ]);
        return toColor(data, "rgba");
    }
    // 数组映射
    function map(array, fun) {
        if (typeof fun !== "function") {
            throw new TypeError();
        }
        var len = array ? array.length : 0;
        for (var i = 0; i < len; i++) {
            array[i] = fun(array[i]);
        }
        return array;
    }
    // 调整值区间
    function adjust(value, region) {
        // < to <= & > to >=
        // modify by linzhifeng 2014-05-25 because -0 == 0
        if (value <= region[0]) {
            value = region[0];
        } else if (value >= region[1]) {
            value = region[1];
        }
        return value;
    }
    function isCalculableColor(color) {
        return color instanceof Array || typeof color === "string";
    }
    // 参见 http:// www.easyrgb.com/index.php?X=MATH
    function _HSV_2_RGB(data) {
        var H = data[0];
        var S = data[1];
        var V = data[2];
        // HSV from 0 to 1
        var R;
        var G;
        var B;
        if (S === 0) {
            R = V * 255;
            G = V * 255;
            B = V * 255;
        } else {
            var h = H * 6;
            if (h === 6) {
                h = 0;
            }
            var i = h | 0;
            var v1 = V * (1 - S);
            var v2 = V * (1 - S * (h - i));
            var v3 = V * (1 - S * (1 - (h - i)));
            var r = 0;
            var g = 0;
            var b = 0;
            if (i === 0) {
                r = V;
                g = v3;
                b = v1;
            } else if (i === 1) {
                r = v2;
                g = V;
                b = v1;
            } else if (i === 2) {
                r = v1;
                g = V;
                b = v3;
            } else if (i === 3) {
                r = v1;
                g = v2;
                b = V;
            } else if (i === 4) {
                r = v3;
                g = v1;
                b = V;
            } else {
                r = V;
                g = v1;
                b = v2;
            }
            // RGB results from 0 to 255
            R = r * 255;
            G = g * 255;
            B = b * 255;
        }
        return [ R, G, B ];
    }
    function _HSL_2_RGB(data) {
        var H = data[0];
        var S = data[1];
        var L = data[2];
        // HSL from 0 to 1
        var R;
        var G;
        var B;
        if (S === 0) {
            R = L * 255;
            G = L * 255;
            B = L * 255;
        } else {
            var v2;
            if (L < .5) {
                v2 = L * (1 + S);
            } else {
                v2 = L + S - S * L;
            }
            var v1 = 2 * L - v2;
            R = 255 * _HUE_2_RGB(v1, v2, H + 1 / 3);
            G = 255 * _HUE_2_RGB(v1, v2, H);
            B = 255 * _HUE_2_RGB(v1, v2, H - 1 / 3);
        }
        return [ R, G, B ];
    }
    function _HUE_2_RGB(v1, v2, vH) {
        if (vH < 0) {
            vH += 1;
        }
        if (vH > 1) {
            vH -= 1;
        }
        if (6 * vH < 1) {
            return v1 + (v2 - v1) * 6 * vH;
        }
        if (2 * vH < 1) {
            return v2;
        }
        if (3 * vH < 2) {
            return v1 + (v2 - v1) * (2 / 3 - vH) * 6;
        }
        return v1;
    }
    function _RGB_2_HSB(data) {
        // RGB from 0 to 255
        var R = data[0] / 255;
        var G = data[1] / 255;
        var B = data[2] / 255;
        var vMin = Math.min(R, G, B);
        // Min. value of RGB
        var vMax = Math.max(R, G, B);
        // Max. value of RGB
        var delta = vMax - vMin;
        // Delta RGB value
        var V = vMax;
        var H;
        var S;
        // HSV results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        } else {
            S = delta / vMax;
            var deltaR = ((vMax - R) / 6 + delta / 2) / delta;
            var deltaG = ((vMax - G) / 6 + delta / 2) / delta;
            var deltaB = ((vMax - B) / 6 + delta / 2) / delta;
            if (R === vMax) {
                H = deltaB - deltaG;
            } else if (G === vMax) {
                H = 1 / 3 + deltaR - deltaB;
            } else if (B === vMax) {
                H = 2 / 3 + deltaG - deltaR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        H = H * 360;
        S = S * 100;
        V = V * 100;
        return [ H, S, V ];
    }
    function _RGB_2_HSL(data) {
        // RGB from 0 to 255
        var R = data[0] / 255;
        var G = data[1] / 255;
        var B = data[2] / 255;
        var vMin = Math.min(R, G, B);
        // Min. value of RGB
        var vMax = Math.max(R, G, B);
        // Max. value of RGB
        var delta = vMax - vMin;
        // Delta RGB value
        var L = (vMax + vMin) / 2;
        var H;
        var S;
        // HSL results from 0 to 1
        if (delta === 0) {
            H = 0;
            S = 0;
        } else {
            if (L < .5) {
                S = delta / (vMax + vMin);
            } else {
                S = delta / (2 - vMax - vMin);
            }
            var deltaR = ((vMax - R) / 6 + delta / 2) / delta;
            var deltaG = ((vMax - G) / 6 + delta / 2) / delta;
            var deltaB = ((vMax - B) / 6 + delta / 2) / delta;
            if (R === vMax) {
                H = deltaB - deltaG;
            } else if (G === vMax) {
                H = 1 / 3 + deltaR - deltaB;
            } else if (B === vMax) {
                H = 2 / 3 + deltaG - deltaR;
            }
            if (H < 0) {
                H += 1;
            }
            if (H > 1) {
                H -= 1;
            }
        }
        H = H * 360;
        S = S * 100;
        L = L * 100;
        return [ H, S, L ];
    }
    module.exports = {
        customPalette: customPalette,
        resetPalette: resetPalette,
        getColor: getColor,
        getHighlightColor: getHighlightColor,
        customHighlight: customHighlight,
        resetHighlight: resetHighlight,
        getRadialGradient: getRadialGradient,
        getLinearGradient: getLinearGradient,
        getGradientColors: getGradientColors,
        getStepColors: getStepColors,
        reverse: reverse,
        mix: mix,
        lift: lift,
        trim: trim,
        random: random,
        toRGB: toRGB,
        toRGBA: toRGBA,
        toHex: toHex,
        toHSL: toHSL,
        toHSLA: toHSLA,
        toHSB: toHSB,
        toHSBA: toHSBA,
        toHSV: toHSV,
        toHSVA: toHSVA,
        toName: toName,
        toColor: toColor,
        toArray: toArray,
        alpha: alpha,
        getData: getData
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
