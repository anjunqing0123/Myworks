/*! 一唱成名 create by ErickSong */
define("app/pc/canvaslib/Storage", [ "./tool/util", "./dep/excanvas", "./Group", "./tool/guid", "./mixin/Transformable", "./tool/matrix", "./tool/vector", "./mixin/Eventful" ], function(require, exports, module) {
    /**
 * Storage内容仓库模块
 * @module zrender/Storage
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 * @author errorrik (errorrik@gmail.com)
 * @author pissang (https://github.com/pissang/)
 */
    "use strict";
    var util = require("./tool/util");
    var Group = require("./Group");
    var defaultIterateOption = {
        hover: false,
        normal: "down",
        update: false
    };
    function shapeCompareFunc(a, b) {
        if (a.zlevel == b.zlevel) {
            if (a.z == b.z) {
                return a.__renderidx - b.__renderidx;
            }
            return a.z - b.z;
        }
        return a.zlevel - b.zlevel;
    }
    /**
         * 内容仓库 (M)
         * @alias module:zrender/Storage
         * @constructor
         */
    var Storage = function() {
        // 所有常规形状，id索引的map
        this._elements = {};
        // 高亮层形状，不稳定，动态增删，数组位置也是z轴方向，靠前显示在下方
        this._hoverElements = [];
        this._roots = [];
        this._shapeList = [];
        this._shapeListOffset = 0;
    };
    /**
         * 遍历迭代器
         * 
         * @param {Function} fun 迭代回调函数，return true终止迭代
         * @param {Object} [option] 迭代参数，缺省为仅降序遍历普通层图形
         * @param {boolean} [option.hover=true] 是否是高亮层图形
         * @param {string} [option.normal='up'] 是否是普通层图形，迭代时是否指定及z轴顺序
         * @param {boolean} [option.update=false] 是否在迭代前更新形状列表
         * 
         */
    Storage.prototype.iterShape = function(fun, option) {
        if (!option) {
            option = defaultIterateOption;
        }
        if (option.hover) {
            // 高亮层数据遍历
            for (var i = 0, l = this._hoverElements.length; i < l; i++) {
                var el = this._hoverElements[i];
                el.updateTransform();
                if (fun(el)) {
                    return this;
                }
            }
        }
        if (option.update) {
            this.updateShapeList();
        }
        // 遍历: 'down' | 'up'
        switch (option.normal) {
          case "down":
            // 降序遍历，高层优先
            var l = this._shapeList.length;
            while (l--) {
                if (fun(this._shapeList[l])) {
                    return this;
                }
            }
            break;

          // case 'up':
            default:
            // 升序遍历，底层优先
            for (var i = 0, l = this._shapeList.length; i < l; i++) {
                if (fun(this._shapeList[i])) {
                    return this;
                }
            }
            break;
        }
        return this;
    };
    /**
         * 返回hover层的形状数组
         * @param  {boolean} [update=false] 是否在返回前更新图形的变换
         * @return {Array.<module:zrender/shape/Base>}
         */
    Storage.prototype.getHoverShapes = function(update) {
        // hoverConnect
        var hoverElements = [];
        for (var i = 0, l = this._hoverElements.length; i < l; i++) {
            hoverElements.push(this._hoverElements[i]);
            var target = this._hoverElements[i].hoverConnect;
            if (target) {
                var shape;
                target = target instanceof Array ? target : [ target ];
                for (var j = 0, k = target.length; j < k; j++) {
                    shape = target[j].id ? target[j] : this.get(target[j]);
                    if (shape) {
                        hoverElements.push(shape);
                    }
                }
            }
        }
        hoverElements.sort(shapeCompareFunc);
        if (update) {
            for (var i = 0, l = hoverElements.length; i < l; i++) {
                hoverElements[i].updateTransform();
            }
        }
        return hoverElements;
    };
    /**
         * 返回所有图形的绘制队列
         * @param  {boolean} [update=false] 是否在返回前更新该数组
         * 详见{@link module:zrender/shape/Base.prototype.updateShapeList}
         * @return {Array.<module:zrender/shape/Base>}
         */
    Storage.prototype.getShapeList = function(update) {
        if (update) {
            this.updateShapeList();
        }
        return this._shapeList;
    };
    /**
         * 更新图形的绘制队列。
         * 每次绘制前都会调用，该方法会先深度优先遍历整个树，更新所有Group和Shape的变换并且把所有可见的Shape保存到数组中，
         * 最后根据绘制的优先级（zlevel > z > 插入顺序）排序得到绘制队列
         */
    Storage.prototype.updateShapeList = function() {
        this._shapeListOffset = 0;
        for (var i = 0, len = this._roots.length; i < len; i++) {
            var root = this._roots[i];
            this._updateAndAddShape(root);
        }
        this._shapeList.length = this._shapeListOffset;
        for (var i = 0, len = this._shapeList.length; i < len; i++) {
            this._shapeList[i].__renderidx = i;
        }
        this._shapeList.sort(shapeCompareFunc);
    };
    Storage.prototype._updateAndAddShape = function(el, clipShapes) {
        if (el.ignore) {
            return;
        }
        el.updateTransform();
        if (el.type == "group") {
            if (el.clipShape) {
                // clipShape 的变换是基于 group 的变换
                el.clipShape.parent = el;
                el.clipShape.updateTransform();
                // PENDING 效率影响
                if (clipShapes) {
                    clipShapes = clipShapes.slice();
                    clipShapes.push(el.clipShape);
                } else {
                    clipShapes = [ el.clipShape ];
                }
            }
            for (var i = 0; i < el._children.length; i++) {
                var child = el._children[i];
                // Force to mark as dirty if group is dirty
                child.__dirty = el.__dirty || child.__dirty;
                this._updateAndAddShape(child, clipShapes);
            }
            // Mark group clean here
            el.__dirty = false;
        } else {
            el.__clipShapes = clipShapes;
            this._shapeList[this._shapeListOffset++] = el;
        }
    };
    /**
         * 修改图形(Shape)或者组(Group)
         * 
         * @param {string} elId 唯一标识
         * @param {Object} [params] 参数
         */
    Storage.prototype.mod = function(elId, params) {
        var el = this._elements[elId];
        if (el) {
            el.modSelf();
            if (params) {
                // 如果第二个参数直接使用 shape
                // parent, _storage, __startClip 三个属性会有循环引用
                // 主要为了向 1.x 版本兼容，2.x 版本不建议使用第二个参数
                if (params.parent || params._storage || params.__startClip) {
                    var target = {};
                    for (var name in params) {
                        if (name == "parent" || name == "_storage" || name == "__startClip") {
                            continue;
                        }
                        if (params.hasOwnProperty(name)) {
                            target[name] = params[name];
                        }
                    }
                    util.merge(el, target, true);
                } else {
                    util.merge(el, params, true);
                }
            }
        }
        return this;
    };
    /**
         * 移动指定的图形(Shape)或者组(Group)的位置
         * @param {string} shapeId 形状唯一标识
         * @param {number} dx
         * @param {number} dy
         */
    Storage.prototype.drift = function(shapeId, dx, dy) {
        var shape = this._elements[shapeId];
        if (shape) {
            shape.needTransform = true;
            if (shape.draggable === "horizontal") {
                dy = 0;
            } else if (shape.draggable === "vertical") {
                dx = 0;
            }
            if (!shape.ondrift || shape.ondrift && !shape.ondrift(dx, dy)) {
                shape.drift(dx, dy);
            }
        }
        return this;
    };
    /**
         * 添加高亮层数据
         * 
         * @param {module:zrender/shape/Base} shape
         */
    Storage.prototype.addHover = function(shape) {
        shape.updateNeedTransform();
        this._hoverElements.push(shape);
        return this;
    };
    /**
         * 清空高亮层数据
         */
    Storage.prototype.delHover = function() {
        this._hoverElements = [];
        return this;
    };
    /**
         * 是否有图形在高亮层里
         * @return {boolean}
         */
    Storage.prototype.hasHoverShape = function() {
        return this._hoverElements.length > 0;
    };
    /**
         * 添加图形(Shape)或者组(Group)到根节点
         * @param {module:zrender/shape/Shape|module:zrender/Group} el
         */
    Storage.prototype.addRoot = function(el) {
        if (el instanceof Group) {
            el.addChildrenToStorage(this);
        }
        this.addToMap(el);
        this._roots.push(el);
    };
    /**
         * 删除指定的图形(Shape)或者组(Group)
         * @param  {string|Array.<string>} [elId] 如果为空清空整个Storage
         */
    Storage.prototype.delRoot = function(elId) {
        if (typeof elId == "undefined") {
            // 不指定elId清空
            for (var i = 0; i < this._roots.length; i++) {
                var root = this._roots[i];
                if (root instanceof Group) {
                    root.delChildrenFromStorage(this);
                }
            }
            this._elements = {};
            this._hoverElements = [];
            this._roots = [];
            this._shapeList = [];
            this._shapeListOffset = 0;
            return;
        }
        if (elId instanceof Array) {
            for (var i = 0, l = elId.length; i < l; i++) {
                this.delRoot(elId[i]);
            }
            return;
        }
        var el;
        if (typeof elId == "string") {
            el = this._elements[elId];
        } else {
            el = elId;
        }
        var idx = util.indexOf(this._roots, el);
        if (idx >= 0) {
            this.delFromMap(el.id);
            this._roots.splice(idx, 1);
            if (el instanceof Group) {
                el.delChildrenFromStorage(this);
            }
        }
    };
    Storage.prototype.addToMap = function(el) {
        if (el instanceof Group) {
            el._storage = this;
        }
        el.modSelf();
        this._elements[el.id] = el;
        return this;
    };
    Storage.prototype.get = function(elId) {
        return this._elements[elId];
    };
    Storage.prototype.delFromMap = function(elId) {
        var el = this._elements[elId];
        if (el) {
            delete this._elements[elId];
            if (el instanceof Group) {
                el._storage = null;
            }
        }
        return this;
    };
    /**
         * 清空并且释放Storage
         */
    Storage.prototype.dispose = function() {
        this._elements = this._renderList = this._roots = this._hoverElements = null;
    };
    module.exports = Storage;
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

define("app/pc/canvaslib/Group", [ "app/pc/canvaslib/tool/guid", "app/pc/canvaslib/tool/util", "app/pc/canvaslib/dep/excanvas", "app/pc/canvaslib/mixin/Transformable", "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/vector", "app/pc/canvaslib/mixin/Eventful" ], function(require, exports, module) {
    /**
 * Group是一个容器，可以插入子节点，Group的变换也会被应用到子节点上
 * @module zrender/Group
 * @example
 *     var Group = require('zrender/Group');
 *     var Circle = require('zrender/shape/Circle');
 *     var g = new Group();
 *     g.position[0] = 100;
 *     g.position[1] = 100;
 *     g.addChild(new Circle({
 *         style: {
 *             x: 100,
 *             y: 100,
 *             r: 20,
 *             brushType: 'fill'
 *         }
 *     }));
 *     zr.addGroup(g);
 */
    var guid = require("app/pc/canvaslib/tool/guid");
    var util = require("app/pc/canvaslib/tool/util");
    var Transformable = require("app/pc/canvaslib/mixin/Transformable");
    var Eventful = require("app/pc/canvaslib/mixin/Eventful");
    /**
     * @alias module:zrender/Group
     * @constructor
     * @extends module:zrender/mixin/Transformable
     * @extends module:zrender/mixin/Eventful
     */
    var Group = function(options) {
        options = options || {};
        /**
         * Group id
         * @type {string}
         */
        this.id = options.id || guid();
        for (var key in options) {
            this[key] = options[key];
        }
        /**
         * @type {string}
         */
        this.type = "group";
        /**
         * 用于裁剪的图形(shape)，所有 Group 内的图形在绘制时都会被这个图形裁剪
         * 该图形会继承Group的变换
         * @type {module:zrender/shape/Base}
         * @see http://www.w3.org/TR/2dcontext/#clipping-region
         */
        this.clipShape = null;
        this._children = [];
        this._storage = null;
        this.__dirty = true;
        // Mixin
        Transformable.call(this);
        Eventful.call(this);
    };
    /**
     * 是否忽略该 Group 及其所有子节点
     * @type {boolean}
     * @default false
     */
    Group.prototype.ignore = false;
    /**
     * 复制并返回一份新的包含所有儿子节点的数组
     * @return {Array.<module:zrender/Group|module:zrender/shape/Base>}
     */
    Group.prototype.children = function() {
        return this._children.slice();
    };
    /**
     * 获取指定 index 的儿子节点
     * @param  {number} idx
     * @return {module:zrender/Group|module:zrender/shape/Base}
     */
    Group.prototype.childAt = function(idx) {
        return this._children[idx];
    };
    /**
     * 添加子节点，可以是Shape或者Group
     * @param {module:zrender/Group|module:zrender/shape/Base} child
     */
    // TODO Type Check
    Group.prototype.addChild = function(child) {
        if (child == this) {
            return;
        }
        if (child.parent == this) {
            return;
        }
        if (child.parent) {
            child.parent.removeChild(child);
        }
        this._children.push(child);
        child.parent = this;
        if (this._storage && this._storage !== child._storage) {
            this._storage.addToMap(child);
            if (child instanceof Group) {
                child.addChildrenToStorage(this._storage);
            }
        }
    };
    /**
     * 移除子节点
     * @param {module:zrender/Group|module:zrender/shape/Base} child
     */
    // TODO Type Check
    Group.prototype.removeChild = function(child) {
        var idx = util.indexOf(this._children, child);
        this._children.splice(idx, 1);
        child.parent = null;
        if (this._storage) {
            this._storage.delFromMap(child.id);
            if (child instanceof Group) {
                child.delChildrenFromStorage(this._storage);
            }
        }
    };
    /**
     * 遍历所有子节点
     * @param  {Function} cb
     * @param  {}   context
     */
    Group.prototype.eachChild = function(cb, context) {
        var haveContext = !!context;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (haveContext) {
                cb.call(context, child);
            } else {
                cb(child);
            }
        }
    };
    /**
     * 深度优先遍历所有子孙节点
     * @param  {Function} cb
     * @param  {}   context
     */
    Group.prototype.traverse = function(cb, context) {
        var haveContext = !!context;
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            if (haveContext) {
                cb.call(context, child);
            } else {
                cb(child);
            }
            if (child.type === "group") {
                child.traverse(cb, context);
            }
        }
    };
    Group.prototype.addChildrenToStorage = function(storage) {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.addToMap(child);
            if (child.type === "group") {
                child.addChildrenToStorage(storage);
            }
        }
    };
    Group.prototype.delChildrenFromStorage = function(storage) {
        for (var i = 0; i < this._children.length; i++) {
            var child = this._children[i];
            storage.delFromMap(child.id);
            if (child.type === "group") {
                child.delChildrenFromStorage(storage);
            }
        }
    };
    Group.prototype.modSelf = function() {
        this.__dirty = true;
    };
    util.merge(Group.prototype, Transformable.prototype, true);
    util.merge(Group.prototype, Eventful.prototype, true);
    module.exports = Group;
});

define("app/pc/canvaslib/tool/guid", [], function(require, exports, module) {
    /**
 * zrender: 生成唯一id
 *
 * @author errorrik (errorrik@gmail.com)
 */
    var idStart = 2311;
    module.exports = function() {
        return "zrender__" + idStart++;
    };
});

define("app/pc/canvaslib/mixin/Transformable", [ "app/pc/canvaslib/tool/matrix", "app/pc/canvaslib/tool/vector" ], function(require, exports, module) {
    /**
 * 提供变换扩展
 * @module zrender/mixin/Transformable
 * @author pissang (https://www.github.com/pissang)
 */
    "use strict";
    var matrix = require("app/pc/canvaslib/tool/matrix");
    var vector = require("app/pc/canvaslib/tool/vector");
    var origin = [ 0, 0 ];
    var EPSILON = 5e-5;
    function isAroundZero(val) {
        return val > -EPSILON && val < EPSILON;
    }
    function isNotAroundZero(val) {
        return val > EPSILON || val < -EPSILON;
    }
    /**
     * @alias module:zrender/mixin/Transformable
     * @constructor
     */
    var Transformable = function() {
        if (!this.position) {
            /**
             * 平移
             * @type {Array.<number>}
             * @default [0, 0]
             */
            this.position = [ 0, 0 ];
        }
        if (typeof this.rotation == "undefined") {
            /**
             * 旋转，可以通过数组二三项指定旋转的原点
             * @type {Array.<number>}
             * @default [0, 0, 0]
             */
            this.rotation = [ 0, 0, 0 ];
        }
        if (!this.scale) {
            /**
             * 缩放，可以通过数组三四项指定缩放的原点
             * @type {Array.<number>}
             * @default [1, 1, 0, 0]
             */
            this.scale = [ 1, 1, 0, 0 ];
        }
        this.needLocalTransform = false;
        /**
         * 是否有坐标变换
         * @type {boolean}
         * @readOnly
         */
        this.needTransform = false;
    };
    Transformable.prototype = {
        constructor: Transformable,
        updateNeedTransform: function() {
            this.needLocalTransform = isNotAroundZero(this.rotation[0]) || isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1]) || isNotAroundZero(this.scale[0] - 1) || isNotAroundZero(this.scale[1] - 1);
        },
        /**
         * 判断是否需要有坐标变换，更新needTransform属性。
         * 如果有坐标变换, 则从position, rotation, scale以及父节点的transform计算出自身的transform矩阵
         */
        updateTransform: function() {
            this.updateNeedTransform();
            if (this.parent) {
                this.needTransform = this.needLocalTransform || this.parent.needTransform;
            } else {
                this.needTransform = this.needLocalTransform;
            }
            if (!this.needTransform) {
                return;
            }
            var m = this.transform || matrix.create();
            matrix.identity(m);
            if (this.needLocalTransform) {
                if (isNotAroundZero(this.scale[0]) || isNotAroundZero(this.scale[1])) {
                    origin[0] = -this.scale[2] || 0;
                    origin[1] = -this.scale[3] || 0;
                    var haveOrigin = isNotAroundZero(origin[0]) || isNotAroundZero(origin[1]);
                    if (haveOrigin) {
                        matrix.translate(m, m, origin);
                    }
                    matrix.scale(m, m, this.scale);
                    if (haveOrigin) {
                        origin[0] = -origin[0];
                        origin[1] = -origin[1];
                        matrix.translate(m, m, origin);
                    }
                }
                if (this.rotation instanceof Array) {
                    if (this.rotation[0] !== 0) {
                        origin[0] = -this.rotation[1] || 0;
                        origin[1] = -this.rotation[2] || 0;
                        var haveOrigin = isNotAroundZero(origin[0]) || isNotAroundZero(origin[1]);
                        if (haveOrigin) {
                            matrix.translate(m, m, origin);
                        }
                        matrix.rotate(m, m, this.rotation[0]);
                        if (haveOrigin) {
                            origin[0] = -origin[0];
                            origin[1] = -origin[1];
                            matrix.translate(m, m, origin);
                        }
                    }
                } else {
                    if (this.rotation !== 0) {
                        matrix.rotate(m, m, this.rotation);
                    }
                }
                if (isNotAroundZero(this.position[0]) || isNotAroundZero(this.position[1])) {
                    matrix.translate(m, m, this.position);
                }
            }
            // 保存这个变换矩阵
            this.transform = m;
            // 应用父节点变换
            if (this.parent && this.parent.needTransform) {
                if (this.needLocalTransform) {
                    matrix.mul(this.transform, this.parent.transform, this.transform);
                } else {
                    matrix.copy(this.transform, this.parent.transform);
                }
            }
        },
        /**
         * 将自己的transform应用到context上
         * @param {Context2D} ctx
         */
        setTransform: function(ctx) {
            if (this.needTransform) {
                var m = this.transform;
                ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
            }
        },
        /**
         * 设置图形的朝向
         * @param  {Array.<number>|Float32Array} target
         * @method
         */
        lookAt: function() {
            var v = vector.create();
            return function(target) {
                if (!this.transform) {
                    this.transform = matrix.create();
                }
                var m = this.transform;
                vector.sub(v, target, this.position);
                if (isAroundZero(v[0]) && isAroundZero(v[1])) {
                    return;
                }
                vector.normalize(v, v);
                // Y Axis
                // TODO Scale origin ?
                m[2] = v[0] * this.scale[1];
                m[3] = v[1] * this.scale[1];
                // X Axis
                m[0] = v[1] * this.scale[0];
                m[1] = -v[0] * this.scale[0];
                // Position
                m[4] = this.position[0];
                m[5] = this.position[1];
                this.decomposeTransform();
            };
        }(),
        /**
         * 分解`transform`矩阵到`position`, `rotation`, `scale`
         */
        decomposeTransform: function() {
            if (!this.transform) {
                return;
            }
            var m = this.transform;
            var sx = m[0] * m[0] + m[1] * m[1];
            var position = this.position;
            var scale = this.scale;
            var rotation = this.rotation;
            if (isNotAroundZero(sx - 1)) {
                sx = Math.sqrt(sx);
            }
            var sy = m[2] * m[2] + m[3] * m[3];
            if (isNotAroundZero(sy - 1)) {
                sy = Math.sqrt(sy);
            }
            position[0] = m[4];
            position[1] = m[5];
            scale[0] = sx;
            scale[1] = sy;
            scale[2] = scale[3] = 0;
            rotation[0] = Math.atan2(-m[1] / sy, m[0] / sx);
            rotation[1] = rotation[2] = 0;
        }
    };
    module.exports = Transformable;
});

define("app/pc/canvaslib/tool/matrix", [], function(require, exports, module) {
    var ArrayCtor = typeof Float32Array === "undefined" ? Array : Float32Array;
    /**
         * 3x2矩阵操作类
         * @exports zrender/tool/matrix
         */
    var matrix = {
        /**
             * 创建一个单位矩阵
             * @return {Float32Array|Array.<number>}
             */
        create: function() {
            var out = new ArrayCtor(6);
            matrix.identity(out);
            return out;
        },
        /**
             * 设置矩阵为单位矩阵
             * @param {Float32Array|Array.<number>} out
             */
        identity: function(out) {
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            out[4] = 0;
            out[5] = 0;
            return out;
        },
        /**
             * 复制矩阵
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} m
             */
        copy: function(out, m) {
            out[0] = m[0];
            out[1] = m[1];
            out[2] = m[2];
            out[3] = m[3];
            out[4] = m[4];
            out[5] = m[5];
            return out;
        },
        /**
             * 矩阵相乘
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} m1
             * @param {Float32Array|Array.<number>} m2
             */
        mul: function(out, m1, m2) {
            out[0] = m1[0] * m2[0] + m1[2] * m2[1];
            out[1] = m1[1] * m2[0] + m1[3] * m2[1];
            out[2] = m1[0] * m2[2] + m1[2] * m2[3];
            out[3] = m1[1] * m2[2] + m1[3] * m2[3];
            out[4] = m1[0] * m2[4] + m1[2] * m2[5] + m1[4];
            out[5] = m1[1] * m2[4] + m1[3] * m2[5] + m1[5];
            return out;
        },
        /**
             * 平移变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
        translate: function(out, a, v) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4] + v[0];
            out[5] = a[5] + v[1];
            return out;
        },
        /**
             * 旋转变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {number} rad
             */
        rotate: function(out, a, rad) {
            var aa = a[0];
            var ac = a[2];
            var atx = a[4];
            var ab = a[1];
            var ad = a[3];
            var aty = a[5];
            var st = Math.sin(rad);
            var ct = Math.cos(rad);
            out[0] = aa * ct + ab * st;
            out[1] = -aa * st + ab * ct;
            out[2] = ac * ct + ad * st;
            out[3] = -ac * st + ct * ad;
            out[4] = ct * atx + st * aty;
            out[5] = ct * aty - st * atx;
            return out;
        },
        /**
             * 缩放变换
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
        scale: function(out, a, v) {
            var vx = v[0];
            var vy = v[1];
            out[0] = a[0] * vx;
            out[1] = a[1] * vy;
            out[2] = a[2] * vx;
            out[3] = a[3] * vy;
            out[4] = a[4] * vx;
            out[5] = a[5] * vy;
            return out;
        },
        /**
             * 求逆矩阵
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             */
        invert: function(out, a) {
            var aa = a[0];
            var ac = a[2];
            var atx = a[4];
            var ab = a[1];
            var ad = a[3];
            var aty = a[5];
            var det = aa * ad - ab * ac;
            if (!det) {
                return null;
            }
            det = 1 / det;
            out[0] = ad * det;
            out[1] = -ab * det;
            out[2] = -ac * det;
            out[3] = aa * det;
            out[4] = (ac * aty - ad * atx) * det;
            out[5] = (ab * atx - aa * aty) * det;
            return out;
        },
        /**
             * 矩阵左乘向量
             * @param {Float32Array|Array.<number>} out
             * @param {Float32Array|Array.<number>} a
             * @param {Float32Array|Array.<number>} v
             */
        mulVector: function(out, a, v) {
            var aa = a[0];
            var ac = a[2];
            var atx = a[4];
            var ab = a[1];
            var ad = a[3];
            var aty = a[5];
            out[0] = v[0] * aa + v[1] * ac + atx;
            out[1] = v[0] * ab + v[1] * ad + aty;
            return out;
        }
    };
    module.exports = matrix;
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

define("app/pc/canvaslib/mixin/Eventful", [], function(require, exports, module) {
    /**
 * 事件扩展
 * @module zrender/mixin/Eventful
 * @author Kener (@Kener-林峰, kener.linfeng@gmail.com)
 *         pissang (https://www.github.com/pissang)
 */
    /**
     * 事件分发器
     * @alias module:zrender/mixin/Eventful
     * @constructor
     */
    var Eventful = function() {
        this._handlers = {};
    };
    /**
     * 单次触发绑定，dispatch后销毁
     * 
     * @param {string} event 事件名
     * @param {Function} handler 响应函数
     * @param {Object} context
     */
    Eventful.prototype.one = function(event, handler, context) {
        var _h = this._handlers;
        if (!handler || !event) {
            return this;
        }
        if (!_h[event]) {
            _h[event] = [];
        }
        _h[event].push({
            h: handler,
            one: true,
            ctx: context || this
        });
        return this;
    };
    /**
     * 绑定事件
     * @param {string} event 事件名
     * @param {Function} handler 事件处理函数
     * @param {Object} context
     */
    Eventful.prototype.bind = function(event, handler, context) {
        var _h = this._handlers;
        if (!handler || !event) {
            return this;
        }
        if (!_h[event]) {
            _h[event] = [];
        }
        _h[event].push({
            h: handler,
            one: false,
            ctx: context || this
        });
        return this;
    };
    /**
     * 解绑事件
     * @param {string} event 事件名
     * @param {Function} [handler] 事件处理函数
     */
    Eventful.prototype.unbind = function(event, handler) {
        var _h = this._handlers;
        if (!event) {
            this._handlers = {};
            return this;
        }
        if (handler) {
            if (_h[event]) {
                var newList = [];
                for (var i = 0, l = _h[event].length; i < l; i++) {
                    if (_h[event][i]["h"] != handler) {
                        newList.push(_h[event][i]);
                    }
                }
                _h[event] = newList;
            }
            if (_h[event] && _h[event].length === 0) {
                delete _h[event];
            }
        } else {
            delete _h[event];
        }
        return this;
    };
    /**
     * 事件分发
     * 
     * @param {string} type 事件类型
     */
    Eventful.prototype.dispatch = function(type) {
        if (this._handlers[type]) {
            var args = arguments;
            var argLen = args.length;
            if (argLen > 3) {
                args = Array.prototype.slice.call(args, 1);
            }
            var _h = this._handlers[type];
            var len = _h.length;
            for (var i = 0; i < len; ) {
                // Optimize advise from backbone
                switch (argLen) {
                  case 1:
                    _h[i]["h"].call(_h[i]["ctx"]);
                    break;

                  case 2:
                    _h[i]["h"].call(_h[i]["ctx"], args[1]);
                    break;

                  case 3:
                    _h[i]["h"].call(_h[i]["ctx"], args[1], args[2]);
                    break;

                  default:
                    // have more than 2 given arguments
                    _h[i]["h"].apply(_h[i]["ctx"], args);
                    break;
                }
                if (_h[i]["one"]) {
                    _h.splice(i, 1);
                    len--;
                } else {
                    i++;
                }
            }
        }
        return this;
    };
    /**
     * 带有context的事件分发, 最后一个参数是事件回调的context
     * @param {string} type 事件类型
     */
    Eventful.prototype.dispatchWithContext = function(type) {
        if (this._handlers[type]) {
            var args = arguments;
            var argLen = args.length;
            if (argLen > 4) {
                args = Array.prototype.slice.call(args, 1, args.length - 1);
            }
            var ctx = args[args.length - 1];
            var _h = this._handlers[type];
            var len = _h.length;
            for (var i = 0; i < len; ) {
                // Optimize advise from backbone
                switch (argLen) {
                  case 1:
                    _h[i]["h"].call(ctx);
                    break;

                  case 2:
                    _h[i]["h"].call(ctx, args[1]);
                    break;

                  case 3:
                    _h[i]["h"].call(ctx, args[1], args[2]);
                    break;

                  default:
                    // have more than 2 given arguments
                    _h[i]["h"].apply(ctx, args);
                    break;
                }
                if (_h[i]["one"]) {
                    _h.splice(i, 1);
                    len--;
                } else {
                    i++;
                }
            }
        }
        return this;
    };
    module.exports = Eventful;
});
