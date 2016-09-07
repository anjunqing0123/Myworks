/*! 一唱成名 create by ErickSong */
define("util/pub/suggest", [ "core/jquery/1.8.3/jquery", "../cookie/cookie", "../loader/loader", "../log/log", "../platform/plt", "../browser/browser", "../net/urlquery", "./searchlog", "../user/user", "client" ], function(require, exports) {
    var $ = require("core/jquery/1.8.3/jquery"), cookie = require("../cookie/cookie"), loader = require("../loader/loader"), searchlog = require("./searchlog"), urlHash = require("../net/urlquery");
    var IE6 = !window.XMLHttpRequest;
    var iPad = navigator.userAgent.indexOf("iPad") >= 0;
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    //将str中的$替换成data中的值
    function tmpl(str, data) {
        str = str || "";
        for (var i in data) {
            str = str.replace(new RegExp("\\$" + i, "g"), data[i]);
        }
        return str;
    }
    //去除字符串首尾空格
    function trim(str) {
        return (str || "").replace(/(^\s+)|(\s+$)/gm, "");
    }
    function isInt(s) {
        var ex = /^\d+$/;
        return ex.test(s);
    }
    //字符串截取
    function str_truncate(str, len, ae) {
        var tl = 0, ts = [], tt = str.length;
        for (var i = 0; i < tt; i++) {
            if (str.charCodeAt(i) > 255) {
                tl += 2;
            } else {
                tl++;
            }
            if (tl > len) {
                break;
            }
        }
        return ae && i < tt ? str.substring(0, i) + "..." : str.substring(0, i);
    }
    var urlHash = function() {
        var str = window.location.search;
        if (str.indexOf("?") === 0 || str.indexOf("#") === 0) {
            str = str.substring(1, str.length);
        }
        var qs = {};
        var tt = str.split("&");
        for (var item in tt) {
            var ss = tt[item] && tt[item].split ? tt[item].split("=") : 0;
            if (ss.length == 2) {
                qs[ss[0]] = decodeURIComponent(ss[1]);
            }
        }
        return qs;
    }();
    var iframeHTML = '<iframe style="position:absolute;top:0px;left:0px;width:100%;border:0px;opacity:0;filter:alpha(opacity=0);z-index:1;" src="about:blank"></iframe>';
    var tp_wrap = '<div class="hd-search-result" style="display:none"><h4 class="top_search_txt">今日热搜</h4><ul class="list_contain"></ul><iframe frameborder="0" style="position:absolute; left:0; top:0; z-index:-1; width:100%; height:100%; border: 0px; opacity: 0; filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);position:absolute; display: block;" src="about:blank"></iframe></div>';
    var tp_li = '<li rank="$index" data-hasInfo="$hasInfo" data-title="$title"><div class="close"><span class="$numclass" style="display:$numdisplay">$num</span><a href="$href" title="$title" keyword="$keyword" channelid="$channelId" stitle="$title" rank="$index" class="ltit" target="$target">$title</a><i class="arrow" style="display:$arrowdisplay"></i></div><div class="open" style="display:none;"><span class="loading"></span></div></li>';
    var tp_op = '<span class="$numclass" style="display:$numdisplay">$num</span><i class="arrow"></i><dl class="cf"><dt><a href="$href" target="_blank" rank="$index" stitle="$title" channelid="$channelId" keyword="$keyword"><img src="$imgsrc" alt="$title" /></a></dt><dd class="$updateClass"><a href="$href" title="$title" class="stit" target="_blank" rank="$index" stitle="$title" channelid="$channelId" keyword="$keyword">$title</a><em>$subtitle</em></dd>$dd</dl>';
    //针对搜索页面，从url中获取搜索的内容
    var locationurl = window.location.href, keys = "";
    if (/(\/s_video\/)||(search\.pptv\.com)/.test(locationurl)) {
        locationurl = decodeURIComponent(locationurl);
        var href = locationurl.indexOf("#") > 0 ? locationurl.slice(0, locationurl.indexOf("#")) : locationurl;
        //php后端在输出URL时，会把空格换成加号+，rawurlencode、urldecode
        if (urlHash.kw) {
            urlHash.kw = urlHash.kw.replace(/\+/g, " ");
        }
        keys = urlHash.kw || urlHash.search_query || "";
    }
    var Suggest = function(form, input, submit) {
        if (!form) {
            return;
        }
        var self = this, form = $(form), input = input ? $(input) : form.find(":text"), submit = submit ? $(submit) : form.find(":button"), wrap, topSearchTxt, ul, ul_list;
        if (!form.length) {
            return {
                init: function() {}
            };
        }
        var suggestUrl = "http://searchapi.pptv.com/query/nt", topSearchUrl = "http://searchapi.pptv.com/query/topSearch.api", detailUrl = "http://epg.api.pptv.com/detail.api", action = "http://search.pptv.com/s_video?kw=", textList = [], textListIndex = 0, defTxt = "", openListIndex = -1, //存储当前展开list的index值
        chooseListIndex = -1, //存储当前选中list的index值
        infoCache = [], isTopSearch = false, keyword = "", UID = cookie.get("UID"), topDataCache;
        var switchInterval, loadTimer, loadTimer2;
        //获取输入框内容
        function getTxt() {
            return trim(input.attr("value"));
        }
        //回写输入框
        function writeTxt(txt) {
            input.attr("value", str_truncate(txt, 20, false));
        }
        //PPI处理
        var codePPI = {
            parsePPI: function(key) {
                var ppi = key || cookie.get("ppi") ? cookie.get("ppi") : "", bytes = [], str = [];
                if (!ppi || ppi == null || ppi == "") {
                    this._cache = [ 0, 2 ];
                    return this._cache;
                }
                for (var i = 0, length = ppi.length; i < length - 1; i += 2) {
                    bytes.push(parseInt(ppi.substr(i, 2), 16));
                }
                str = String.fromCharCode.apply(String, bytes);
                str = str.split(",");
                this._cache = str;
                return this._cache;
            },
            getCityCode: function(key) {
                //取缓存
                if (this._cache) {
                    return this._cache[1];
                }
                return this.parsePPI(key)[1];
            },
            getUserType: function(key) {
                if (this._cache) {
                    return this._cache[0];
                }
                return this.parsePPI(key)[0];
            }
        };
        //获取参数，数据
        function initEvn(option) {
            textList = (input.attr("data-textlist") || "").split(",");
            defTxt = keys || input.attr("value") || textList[0] || "搜索视频、直播...";
            if (option && !option.emptyValue) {
                input.attr("value", defTxt);
            }
            location.href.indexOf("http://search.pptv.com") === 0 ? form.attr("target", "_self") : form.attr("target", "_blank");
            wrap = form.find(".hd-search-result");
            if (wrap.length < 1) {
                form.append(tp_wrap);
            }
            wrap = form.find(".hd-search-result");
            ul = wrap.children(".list_contain");
            topSearchTxt = wrap.children(".top_search_txt");
        }
        //绑定表单事件
        function bindFormEvent() {
            form.submit(function() {});
            input.focus(function() {
                if (getTxt() == defTxt && !/search\.pptv\.com/.test(locationurl)) {
                    $(this).attr("value", "");
                }
                $("#search_box .searchtxt").addClass("searchtxt-selected");
                loadData(getTxt());
            });
            input.blur(function() {
                var self = this;
                setTimeout(function() {
                    if (!getTxt()) {
                        $(self).attr("value", defTxt);
                    }
                    $("#search_box .searchtxt").removeClass("searchtxt-selected");
                    hideSearchResult();
                }, 500);
            });
            input.keydown(function(ev) {
                switch (ev.keyCode) {
                  case 38:
                    //向上箭头
                    prevList();
                    break;

                  case 40:
                    //向下箭头
                    nextList();
                    break;

                  case 27:
                    //Esc
                    hideSearchResult();
                    break;

                  case 13:
                    //回车
                    break;
                }
            });
            input.keyup(function(ev) {
                clearTimeout(loadTimer);
                if (",27,37,38,39,40,13".indexOf("," + ev.keyCode) > -1) {
                    return;
                }
                loadTimer = setTimeout(function() {
                    loadData(getTxt());
                }, 200);
            });
        }
        function prevList() {
            clearTimeout(loadTimer2);
            if (ul_list) {
                var i;
                if (ul_list[chooseListIndex - 1]) {
                    i = chooseListIndex - 1;
                } else {
                    i = ul_list.length - 1;
                }
                if ($(ul_list[i]).attr("data-hasInfo") == "true") {
                    loadTimer2 = setTimeout(function() {
                        closeList(ul_list[openListIndex]);
                        openList(ul_list[i]);
                        openListIndex = i;
                    }, 200);
                }
                selectList(ul_list[i]);
                reselectList(ul_list[chooseListIndex]);
                chooseListIndex = i;
                writeTxt($(ul_list[i]).attr("data-title"));
            }
        }
        function nextList() {
            clearTimeout(loadTimer2);
            if (ul_list) {
                var i;
                if (ul_list[chooseListIndex + 1]) {
                    i = chooseListIndex + 1;
                } else {
                    i = 0;
                }
                if ($(ul_list[i]).attr("data-hasInfo") == "true") {
                    loadTimer2 = setTimeout(function() {
                        closeList(ul_list[openListIndex]);
                        openList(ul_list[i]);
                        openListIndex = i;
                    }, 200);
                }
                selectList(ul_list[i]);
                reselectList(ul_list[chooseListIndex]);
                chooseListIndex = i;
                writeTxt($(ul_list[i]).attr("data-title"));
            }
        }
        function selectList(ix) {
            var list;
            if (typeof ix == "number" && ix < 10) {
                list = wrap.find("ul li")[ix];
            } else {
                list = ix;
            }
            $(list).addClass("hover");
        }
        function reselectList(ix) {
            var list;
            if (typeof ix == "number" && ix < 10) {
                list = wrap.find("ul li")[ix];
            } else {
                list = ix;
            }
            $(list).removeClass("hover");
        }
        function openList(ix) {
            var list;
            if (typeof ix == "number" && ix < 10) {
                list = wrap.find("ul li")[ix];
            } else {
                list = ix;
            }
            $(list).children(".close").hide();
            $(list).children(".open").show();
            $(list).addClass("hover-drop");
            if (!$(list).hasClass("loaded")) {
                loadDetail($(list).attr("rank"));
            }
        }
        function closeList(ix) {
            var list;
            if (typeof ix == "number" && ix < 10) {
                list = wrap.find("ul li")[ix];
            } else {
                list = ix;
            }
            $(list).children(".close").show();
            $(list).children(".open").hide();
            $(list).removeClass("hover-drop");
        }
        function hideSearchResult() {
            wrap.hide();
        }
        function showSearchResult() {
            wrap.show();
        }
        function bindHoverEvent() {
            ul_list.mouseover(function(ev) {
                clearTimeout(loadTimer2);
                var self = $(this);
                reselectList(chooseListIndex);
                selectList(this);
                chooseListIndex = parseInt(self.attr("rank"));
                if (self.attr("data-hasInfo") == "true") {
                    loadTimer2 = setTimeout(function() {
                        closeList(openListIndex);
                        openList(self);
                        openListIndex = chooseListIndex;
                    }, 200);
                }
            });
        }
        function hasInfo(o) {
            /**
             * A、Bktype=0（电影），都会显示右侧内容
             * B、bktype=2（综艺），vt=22，显示右侧内容
             * C、bktype=3（动漫），vt=3，显示右侧内容
             * D、所有bktype，vt=21，显示右侧内容
             */
            var t = o.bkType, vt = o.vt;
            return o.channelId > 0 && (t == 0 || t == 1 || t == 2 || t == 3) && (t == 0 || t == 2 && vt == 22 || t == 3 && vt == 3 || vt == 21);
        }
        function getRedirectURL(item, chid, vt) {
            var cid = chid ? chid : item.channelId;
            var videoType = vt ? vt : item.vt;
            return "http://v.pptv.com/redirect/" + videoType + "/" + cid + "/" + item.isVirtual;
        }
        //虚拟频道的返回年份
        //真实频道正在更新的返回更新至？集
        //真实频道已完结的返回年份
        function getItemMask(data, ix) {
            if (infoCache[ix].isVirtual) {
                return /^\d{4}$/.test(infoCache[ix].years) ? infoCache[ix].years : "";
            } else {
                return parseInt(data.vsValue) == 4 ? data.vsTitle ? "更新至" + data.vsTitle : "" : /^\d{4}$/.test(infoCache[ix].years) ? infoCache[ix].years : "";
            }
        }
        //填充展开后图片右边部分、标题下边部分
        //由于这一部分逻辑太多，独立成一个function
        //对于电视剧、动漫有5种显示方式
        //1、2、3、4、5、6、7
        //1、2、3、4、5、6、...
        //1、2、3、4、5、...、15
        //7、6、5、4、3、2、1
        //15、14、13、12、11、...、1
        function getItemDD(data, ix) {
            var tp_a = '<a href="$href" title="$title1" class="$a_class" target="_blank" rank="' + ix + '" stitle="' + infoCache[ix].name + '" keyword="' + keyword + '" channelid="' + infoCache[ix].channelId + '">$title2</a>';
            var tp_a2 = '<a href="$href" title="$title1" class="$a_class" target="_blank" rank="' + ix + '" stitle="' + infoCache[ix].name + '" keyword="' + keyword + '" channelid="' + infoCache[ix].channelId + '" style="width:auto;">$title2</a>';
            var tp_dd = '<dd><em>$director</em>$d_name</dd><dd class="actor"><em>$actor</em>$a_name</dd>';
            var dd = "";
            var item = infoCache[ix];
            var redirectUrl = getRedirectURL(item);
            var detail = [];
            //如果只有一集接口返回的是对象，如果有很多集接口返回的数组，需要做转化
            var isVirtual = item.isVirtual;
            var isEnd, sNum;
            if (isVirtual && item.bkType != 0) {
                data.virtual[0].episode.length ? detail = data.virtual[0].episode : detail.push(data.virtual[0].episode);
                isEnd = true;
                sNum = detail.length;
            } else if (item.bkType != 0) {
                data.video_list.video.length ? detail = data.video_list.video : detail.push(data.video_list.video);
                isEnd = parseInt(data.vsValue) == 4 ? false : true;
                data.video_list_count = Number(data.video_list_count);
                sNum = data.video_list_count ? data.video_list_count : detail.length;
            }
            if (item.bkType == 2) {
                var temp = "";
                for (var i = 0, length = sNum > 3 ? 3 : sNum; i < length; i++) {
                    temp += tmpl(tp_a, {
                        href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                        title1: detail[i]._attributes.title,
                        title2: detail[i]._attributes.title,
                        a_class: ""
                    });
                }
                dd = '<dd class="zylist">' + temp + "</dd>";
            } else if (item.bkType == 0 || item.bkType == 1 || item.bkType == 3) {
                var directors = data.director.split(",");
                var actors = data.act.split(",");
                var temp_dname = "", temp_aname = "";
                temp_dname = directors[0] ? tmpl(tp_a, {
                    href: action + encodeURIComponent(directors[0]),
                    title1: directors[0],
                    title2: directors[0],
                    a_class: ""
                }) : "--";
                for (var i = 0, length = actors.length; i < length; i++) {
                    temp_aname += tmpl(tp_a, {
                        href: action + encodeURIComponent(actors[i]),
                        title1: actors[i],
                        title2: actors[i],
                        a_class: ""
                    });
                }
                dd = tmpl(tp_dd, {
                    director: item.bkType == 3 ? "监督：" : "导演：",
                    actor: item.bkType == 3 ? "声优：" : "演员：",
                    d_name: temp_dname,
                    a_name: temp_aname
                });
                if (item.bkType == 1 || item.bkType == 3) {
                    var temp = [];
                    if (isEnd && sNum <= 7) {
                        for (var i = 0; i < sNum; i++) {
                            temp.push({
                                href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1: detail[i]._attributes.title,
                                title2: detail[i]._attributes.title,
                                a_class: ""
                            });
                        }
                    } else if (isVirtual && sNum > 7) {
                        for (var i = 0; i < 6; i++) {
                            temp.push({
                                href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1: detail[i]._attributes.title,
                                title2: detail[i]._attributes.title,
                                a_class: ""
                            });
                        }
                        temp.push({
                            href: redirectUrl,
                            title1: "更多",
                            title2: "...",
                            a_class: ""
                        });
                    } else if (!isVirtual && isEnd && sNum > 7) {
                        for (var i = 0; i < 5; i++) {
                            temp.push({
                                href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1: detail[i]._attributes.title,
                                title2: detail[i]._attributes.title,
                                a_class: ""
                            });
                        }
                        temp.push({
                            href: redirectUrl,
                            title1: "更多",
                            title2: "...",
                            a_class: ""
                        });
                        temp.push({
                            href: getRedirectURL(item, detail[sNum - 1]._attributes.id, detail[sNum - 1]._attributes.vt),
                            title1: detail[sNum - 1]._attributes.title,
                            title2: detail[sNum - 1]._attributes.title,
                            a_class: ""
                        });
                    } else if (!isEnd && sNum <= 7 && !isVirtual) {
                        temp.push({
                            href: getRedirectURL(item, detail[sNum - 1]._attributes.id, detail[sNum - 1]._attributes.vt),
                            title1: detail[sNum - 1]._attributes.title,
                            title2: detail[sNum - 1]._attributes.title + '<i class="ui-icon-point-new"></i>',
                            a_class: "nohidden"
                        });
                        for (var i = sNum - 2; i >= 0; i--) {
                            temp.push({
                                href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1: detail[i]._attributes.title,
                                title2: detail[i]._attributes.title,
                                a_class: ""
                            });
                        }
                    } else if (!isEnd && sNum > 7 && !isVirtual) {
                        temp.push({
                            href: getRedirectURL(item, detail[sNum - 1]._attributes.id, detail[sNum - 1]._attributes.vt),
                            title1: detail[sNum - 1]._attributes.title,
                            title2: detail[sNum - 1]._attributes.title + '<i class="ui-icon-point-new"></i>',
                            a_class: "nohidden"
                        });
                        for (var i = sNum - 2; i > sNum - 6; i--) {
                            temp.push({
                                href: getRedirectURL(item, detail[i]._attributes.id, detail[i]._attributes.vt),
                                title1: detail[i]._attributes.title,
                                title2: detail[i]._attributes.title,
                                a_class: ""
                            });
                        }
                        temp.push({
                            href: redirectUrl,
                            title1: "更多",
                            title2: "...",
                            a_class: ""
                        });
                        temp.push({
                            href: getRedirectURL(item, detail[0]._attributes.id, detail[0]._attributes.vt),
                            title1: detail[0]._attributes.title,
                            title2: detail[0]._attributes.title,
                            a_class: ""
                        });
                    }
                    var temp2 = "";
                    for (var i = 0; i < temp.length; i++) {
                        if (temp[i] && (isInt(temp[i].title1) || temp[i].title2 == "...")) {
                            temp2 += tmpl(tp_a, temp[i]);
                        } else {
                            temp2 += tmpl(tp_a2, temp[i]);
                        }
                    }
                    dd += '<dd class="tvlist cf">' + temp2 + "</dd>";
                }
            }
            return dd;
        }
        function fillData(data) {
            ul.html("");
            var key = data[0];
            data = data[1];
            if (!data || data.length < 1) {
                ul_list = [];
                hideSearchResult();
                return;
            }
            var item;
            for (var i = 0; i < data.length; i++) {
                item = data[i];
                infoCache[i] = {
                    name: item.name,
                    years: item.years,
                    picUrl: item.picUrl ? /^http:\/\//.test(item.picUrl) ? item.picUrl : "http://img6.pplive.cn/sp75/" + item.picUrl : "http://static9.pplive.cn/pptv/index/v_20120627103907/css/pptv.png",
                    channelId: item.channelId,
                    bkType: item.bkType,
                    vt: item.vt,
                    isVirtual: item.isVirtual
                };
                ul.append(tmpl(tp_li, {
                    channelId: item.channelId,
                    keyword: keyword,
                    index: i,
                    hasInfo: hasInfo(item) ? "true" : "false",
                    numclass: i > 2 ? "num" : "num topnum",
                    numdisplay: isTopSearch ? "" : "none",
                    num: i + 1,
                    href: hasInfo(item) ? getRedirectURL(item) : action + decodeURIComponent(item.name),
                    title: item.name,
                    arrowdisplay: hasInfo(item) ? "" : "none",
                    target: location.href.indexOf("http://search.pptv.com") === 0 ? "_self" : "_blank"
                }));
            }
            ul_list = ul.children("li");
            searchlog.suggestClick(ul);
            bindHoverEvent();
            if (!isTopSearch) {
                topSearchTxt.hide();
            }
            setTimeout(showSearchResult, 100);
        }
        //加上loaded样式
        //填充展开后的内容
        function fillDetail(data, ix) {
            var odv = $(ul_list[ix]).children(".open");
            odv.html("");
            if (!data || data.length < 1) {
                $(ul_list[ix]).attr("data-hasInfo", "false");
                closeList(ix);
                openListIndex = -1;
            }
            infoCache[ix].mask = getItemMask(data, ix);
            infoCache[ix].dd = getItemDD(data, ix);
            var item = infoCache[ix];
            odv.append(tmpl(tp_op, {
                numclass: ix > 2 ? "num" : "num topnum",
                numdisplay: isTopSearch ? "" : "none",
                num: parseInt(ix) + 1,
                href: getRedirectURL(item),
                imgsrc: item.picUrl,
                title: item.name,
                subtitle: item.mask,
                updateClass: item.mask ? "" : "noupdate",
                dd: item.dd,
                index: ix,
                channelId: item.channelId,
                keyword: keyword
            }));
            searchlog.suggestClick(odv);
            $(ul_list[ix]).addClass("loaded");
        }
        /**
         * [loadData description]
         * @param  {[type]} key [key为空加载热搜，否则加载搜索]
         * @return {[type]}     [description]
         */
        function loadData(key) {
            keyword = key;
            if (!key) {
                isTopSearch = true;
                if (topDataCache) {
                    fillData(topDataCache);
                    openList(0);
                    openListIndex = 0;
                    chooseListIndex = 0;
                    return;
                }
                $.ajax({
                    type: "GET",
                    cache: true,
                    dataType: "jsonp",
                    jsonp: "cb",
                    jsonpCallback: "recTopData",
                    url: topSearchUrl,
                    data: {
                        platform: "ikan",
                        hasVirtual: "0",
                        areaCode: codePPI.getCityCode(),
                        coolUser: codePPI.getUserType(),
                        cnt: 10
                    },
                    success: function(data) {
                        if (!data[0] || data[0].length <= 0) {
                            return;
                        }
                        var d = [];
                        d[0] = "";
                        d[1] = [];
                        for (var i = 0, length = data[0].length; i < length; i++) {
                            d[1][i] = {};
                            d[1][i].name = data[0][i].title;
                            d[1][i].years = data[0][i].year;
                            d[1][i].picUrl = data[0][i].coverPic;
                            d[1][i].channelId = data[0][i].id;
                            d[1][i].bkType = data[0][i].bkType;
                            d[1][i].vt = data[0][i].videoType;
                            d[1][i].isVirtual = data[0][i].isVirtual;
                        }
                        topDataCache = d;
                        fillData(d);
                        openList(0);
                        openListIndex = 0;
                        chooseListIndex = 0;
                    }
                });
            } else {
                isTopSearch = false;
                $.ajax({
                    type: "GET",
                    cache: true,
                    dataType: "jsonp",
                    jsonp: "cb",
                    jsonpCallback: "recSearchData",
                    url: suggestUrl,
                    data: {
                        q: key,
                        cm: "ikan",
                        colordis: "red",
                        hasVirtual: "1",
                        vipdis: codePPI.getUserType(),
                        fm: codePPI.getCityCode(),
                        cnt: 10
                    },
                    success: function(data) {
                        if (!data[1] || data[1].length <= 0) {
                            return;
                        }
                        var d = [];
                        d[0] = data[0];
                        d[1] = [];
                        for (var i = 0; i < data[1].length; i++) {
                            d[1][i] = {};
                            d[1][i].name = data[1][i].name;
                            d[1][i].years = data[1][i].years;
                            d[1][i].picUrl = data[1][i].picUrl;
                            d[1][i].channelId = data[1][i].channelId;
                            d[1][i].bkType = data[1][i].bkType;
                            d[1][i].vt = data[1][i].vt;
                            d[1][i].isVirtual = data[1][i].isVirtual;
                        }
                        fillData(d);
                        chooseListIndex = -1;
                        openListIndex = -1;
                    }
                });
            }
        }
        //加载每一条的详细信息
        function loadDetail(ix) {
            $.ajax({
                type: "GET",
                cache: true,
                dataType: "jsonp",
                jsonp: "cb",
                jsonpCallback: "recDetailData",
                url: detailUrl,
                data: {
                    auth: UID ? UID : "noauth",
                    vid: infoCache[ix].channelId,
                    mode: "onlyset",
                    virtual: 1,
                    series: 1,
                    platform: "ikan",
                    userLevel: codePPI.getUserType()
                },
                success: function(data) {
                    if (data.err) {
                        return;
                    }
                    fillDetail(data.v, ix);
                }
            });
        }
        //初始化文字轮换
        function initSwitch(open) {
            if (open) {
                switchInterval = setInterval(function() {
                    if (getTxt() == defTxt) {
                        textListIndex++;
                        if (textListIndex == textList.length) {
                            textListIndex = 0;
                        }
                        input.attr("value", textList[textListIndex]);
                        defTxt = input.attr("value");
                    }
                }, 5 * 1e3);
            } else {
                clearInterval(switchInterval);
            }
        }
        $(window).on("scroll", function() {
            hideSearchResult();
            input.blur();
        });
        this.init = function(opt) {
            if (!form) {
                return;
            }
            var option = opt || {};
            initEvn(option);
            bindFormEvent();
            if (textList.length > 0) {
                initSwitch(!keys);
            }
        };
    };
    return Suggest;
});

/**
 *cookie操作封装
 *mirongxu
 */
define("util/cookie/cookie", [], function(require) {
    var doc = document, MILLISECONDS_OF_DAY = 24 * 60 * 60 * 1e3, encode = encodeURIComponent, decode = decodeURIComponent;
    function isValidParamValue(val) {
        var t = typeof val;
        // If the type of val is null, undefined, number, string, boolean, return true.
        return val == null || t !== "object" && t !== "function";
    }
    function isNotEmptyString(val) {
        return isValidParamValue(val) && val !== "";
    }
    return {
        /**
         * Returns the cookie value for given name
         * @return {String} name The name of the cookie to retrieve
         */
        get: function(name) {
            var ret, m;
            if (isNotEmptyString(name)) {
                if (m = String(doc.cookie).match(new RegExp("(?:^| )" + name + "(?:(?:=([^;]*))|;|$)"))) {
                    ret = m[1] ? decode(m[1]) : "";
                }
            }
            return ret;
        },
        /**
         * Set a cookie with a given name and value
         * @param {String} name The name of the cookie to set
         * @param {String} val The value to set for cookie
         * @param {Number|Date} expires
         * if Number secified how many days this cookie will expire
         * @param {String} domain set cookie's domain
         * @param {String} path set cookie's path
         * @param {Boolean} secure whether this cookie can only be sent to server on https
         */
        set: function(name, val, expires, domain, path, secure) {
            var text = String(encode(val)), date = expires;
            // 从当前时间开始，多少天后过期
            if (typeof date === "number") {
                date = new Date();
                date.setTime(date.getTime() + expires * MILLISECONDS_OF_DAY);
            }
            // expiration date
            if (date instanceof Date) {
                if (expires === 0) {
                    text += ";";
                } else {
                    text += "; expires=" + date.toUTCString();
                }
            }
            // domain
            if (isNotEmptyString(domain)) {
                text += "; domain=" + domain;
            }
            // path
            if (isNotEmptyString(path)) {
                text += "; path=" + path;
            }
            // secure
            if (secure) {
                text += "; secure";
            }
            doc.cookie = name + "=" + text;
        },
        /**
         * Remove a cookie from the machine by setting its expiration date to sometime in the past
         * @param {String} name The name of the cookie to remove.
         * @param {String} domain The cookie's domain
         * @param {String} path The cookie's path
         * @param {String} secure The cookie's secure option
         */
        remove: function(name, domain, path, secure) {
            this.set(name, "", -1, domain, path, secure);
        }
    };
});

/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    loader - 加载器

 * Loader.load('url', params, sucessCallback, errorcallback, beforeSend, scope);

 * Loader.load('ordersvc/v1/getLastNews.json?', {
 *     type : 'hoster',
 *     roomid : webcfg.roomid,
 *     limit : 20,
 *     __config__ : {
 *        cache : true,
 *        callback : 'getCallback'
 *     }
 * }, function(d){
 *     if(d && d.err === 0 && d.data){
 *        GIftRender($('#gift ul'), d.data);
 *    }
 * });
 *
 */
define("util/loader/loader", [ "core/jquery/1.8.3/jquery", "util/log/log", "util/platform/plt", "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var $ = require("core/jquery/1.8.3/jquery");
    var log = require("util/log/log");
    var loaderParams = require("util/platform/plt");
    var Loader = {}, N = 0;
    function load(url, params, callback, errorcallback, beforecallback, scope) {
        log("Loader load====", url, params);
        var sevurl = url, _config = {}, _cdn, prefix = "pplive_callback_", callbackName = "", beforeCallback = beforecallback || $.noop, errorCallback = typeof errorcallback == "function" ? errorcallback : $.noop, opts = {
            from: "chang",
            version: "2.1.0",
            format: "jsonp"
        };
        params = $.extend(opts, loaderParams, params);
        if (params.__config__) {
            _config = params.__config__;
            delete params.__config__;
        }
        _cdn = _config.cache === true || _config.cdn === true && _config.callback ? true : false;
        sevurl = sevurl.indexOf("?") > -1 ? sevurl + "&" : sevurl + "?";
        sevurl += $.param(params);
        sevurl = sevurl.replace(/&&/, "&").replace(/\?\?/, "?");
        if (sevurl.match(/cb=.*/i)) {
            callbackName = /cb=(.*?(?=&)|.*)/.exec(sevurl)[1];
            sevurl = sevurl.replace(/(.*)?(cb=.*?\&+)/, "$1");
        } else {
            callbackName = _cdn ? _config.callback : prefix + N++;
        }
        $.ajax({
            dataType: "jsonp",
            type: "GET",
            cache: _config.cache === 0 ? false : true,
            url: sevurl,
            jsonp: "cb",
            jsonpCallback: function() {
                return callbackName;
            },
            beforeSend: function(XMLHttpRequest) {
                beforeCallback();
            },
            success: function(data) {
                _config = null;
                if (callback && typeof callback == "function") {
                    callback.apply(scope, arguments);
                }
            },
            timeout: 1e4,
            statusCode: {
                404: function() {
                    errorCallback();
                },
                500: function() {
                    errorCallback();
                },
                502: function() {
                    errorCallback();
                },
                504: function() {
                    errorCallback();
                },
                510: function() {
                    errorCallback();
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                log("Ajax Load error: ", sevurl, XMLHttpRequest, textStatus, errorThrown);
                errorCallback();
            }
        });
    }
    function ajax(option) {
        var opt = $.extend({
            type: "GET",
            dataType: "jsonp",
            cache: true,
            jsonp: "cb",
            success: function() {},
            error: function() {}
        }, loaderParams, option);
        var success = opt.success;
        opt.success = function(data) {
            if (!data.err) {
                success(data);
            } else {}
        };
        return $.ajax(opt);
    }
    Loader = {
        load: load,
        ajax: ajax
    };
    module.exports = Loader;
});

/**
 * @author  Erick Song
 * @date    2012-08-22
 * @email   ahschl0322@gmail.com
 * @info    console.log moudle
 *
 * 2014-03-20   增加sendLog方法发送错误日志
 *
 */
define("util/log/log", [], function(require) {
    var logdiv, logstr = "", doc = document, curl = window.location.href, encode = encodeURIComponent, isDebug = window.DEBUG || curl.slice(-4) === "-deb" ? true : false;
    var pe = {
        serviceUrl: "http://web.data.pplive.com/pe/1.html?",
        newImg: new Image(),
        adr: curl,
        sadr: "log",
        et: "js",
        n: "ERROR_"
    };
    var sendLog = function(e, prefix) {
        prefix = prefix || "default";
        pe.newImg.src = pe.serviceUrl + "et=" + pe.et + "&adr=" + encode(pe.adr) + "&sadr=" + encode(pe.sadr) + "&n=" + encode(pe.n + prefix + "_" + (e.message || e));
    };
    if (!window.console) {
        window.console = {};
        window.console.log = function() {
            return;
        };
    }
    //log
    window.log = function() {
        if (isDebug && this.console) {
            console.log(date2str(new Date(), "hh:mm:ss"), [].slice.call(arguments));
        }
    };
    log.sendLog = sendLog;
    if (isDebug) {
        log.sendLog = function() {};
    }
    //firelite + log
    if (curl.indexOf("firelite=1") > -1) {
        var a = doc.createElement("A");
        a.href = 'javascript:if(!window.firebug){window.firebug=document.createElement("script");firebug.setAttribute("src","http://getfirebug.com/releases/lite/1.2/firebug-lite-compressed.js");document.body.appendChild(firebug);(function(){if(window.firebug.version){firebug.init()}else{setTimeout(arguments.callee)}})();void (firebug);if(window.log){(function(){if(window.firebug&&window.firebug.version){for(var a=0;a<log.history.length;a++){console.log(log.history[a])}}else{setTimeout(arguments.callee,100)}})()}};';
        a.style.cssText = "position:absolute;right:0;top:0;color:#000;font-size:12px;border:1px solid #f00";
        a.innerHTML = "Filelite + Log";
        doc.body.appendChild(a);
    }
    /*else if(curl.indexOf('log=1') > -1){
        for(var i = 0, l = arguments.length; i < l; i ++){ logstr += arguments[i] + " ## " ;}
        if(typeof(logdiv) == 'undefined'){
            logdiv = doc.createElement('div');
            logdiv.style.cssText = 'position:absolute;left:0;bottom:0;width:400px;height:200px;overflow:hidden;overflow-y:auto;border:1px solid #f00;z-index:10000;background:#ccc';
            doc.body.appendChild(logdiv);
        }
        logdiv.innerHTML += logstr + '<br />';
    }else{}*/
    function date2str(x, y) {
        var z = {
            M: x.getMonth() + 1,
            d: x.getDate(),
            h: x.getHours(),
            m: x.getMinutes(),
            s: x.getSeconds()
        };
        y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
            return ((v.length > 1 ? "0" : "") + eval("z." + v.slice(-1))).slice(-2);
        });
        return y.replace(/(y+)/g, function(v) {
            return x.getFullYear().toString().slice(-v.length);
        });
    }
    return log;
});

/**
 * @author  Erick Song
 * @date    2015-09-28
 * @email   ahschl0322@gmail.com
 * @info    返回三个维度信息
 *
 * 平台 - 网站|客户端|多终端
 * plt = pc|clt|mut
 *
 * 系统平台
 * platform = mobile|ipad|web|clt
 *
 * 浏览器信息
 * device = ie|moz|chrome|safari|opear|weixin|iphone|ipad|android|winphone
 *
 */
define("util/platform/plt", [ "util/browser/browser", "util/net/urlquery" ], function(require, exports, module) {
    var browser = require("util/browser/browser");
    var query = require("util/net/urlquery");
    var params = {};
    var SPLITCHAT = {
        plt: [ "WEB", "CLT", "MUT" ],
        platform: [ "IPAD", "MOBILE", "WEB", "CLT" ],
        device: [ "IE", "MOZ", "CHROME", "SAFARI", "OPERA", "WEIXIN", "IPHONE", "IPAD", "ANDROID", "ITOUCH", "WINPHONE" ]
    };
    for (var key in SPLITCHAT) {
        for (var k = 0, lenk = SPLITCHAT[key].length; k < lenk; k++) {
            var mapKey = SPLITCHAT[key][k];
            if (browser[mapKey]) {
                params[key] = mapKey.toLowerCase();
                break;
            }
        }
    }
    //merge if the key in params
    for (var i in query) {
        if (params[i]) params[i] = query[i];
    }
    return params;
});

/**
 * @author: xuxin | seanxu@pptv.com
 * @Date: 13-7-18
 * @history
 */
define("util/browser/browser", [], function(require, exports, module) {
    var ua = navigator.userAgent.toLowerCase();
    var external = window.external || "";
    var core, m, extra, version, os;
    var isMobile = function() {
        var check = false;
        (function(a, b) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
                check = true;
            }
        })(navigator.userAgent || navigator.vendor || window.opera);
        check = ua.match(/(iphone|ipod|android|ipad|blackberry|webos|windows phone)/i) ? true : false;
        return check;
    }();
    var numberify = function(s) {
        var c = 0;
        return parseFloat(s.replace(/\./g, function() {
            return c++ == 1 ? "" : ".";
        }));
    };
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    try {
        if (/windows|win32/i.test(ua)) {
            os = "windows";
        } else if (/macintosh/i.test(ua)) {
            os = "macintosh";
        } else if (/rhino/i.test(ua)) {
            os = "rhino";
        }
        if ((m = ua.match(/applewebkit\/([^\s]*)/)) && m[1]) {
            core = "webkit";
            version = numberify(m[1]);
        } else if ((m = ua.match(/presto\/([\d.]*)/)) && m[1]) {
            core = "presto";
            version = numberify(m[1]);
        } else if (m = ua.match(/msie\s([^;]*)/)) {
            core = "trident";
            version = 1;
            if ((m = ua.match(/trident\/([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        } else if (/gecko/.test(ua)) {
            core = "gecko";
            version = 1;
            if ((m = ua.match(/rv:([\d.]*)/)) && m[1]) {
                version = numberify(m[1]);
            }
        }
        if (/world/.test(ua)) {
            extra = "world";
        } else if (/360se/.test(ua)) {
            extra = "360";
        } else if (/maxthon/.test(ua) || typeof external.max_version == "number") {
            extra = "maxthon";
        } else if (/tencenttraveler\s([\d.]*)/.test(ua)) {
            extra = "tt";
        } else if (/se\s([\d.]*)/.test(ua)) {
            extra = "sogou";
        }
    } catch (e) {}
    var ret = {
        OS: os,
        CORE: core,
        Version: version,
        EXTRA: extra ? extra : false,
        IE: /msie/.test(ua) || /trident/.test(ua) && /rv[:\s]\d+/.test(ua),
        OPERA: /opera/.test(ua),
        MOZ: /gecko/.test(ua) && !/(compatible|webkit)/.test(ua),
        IE5: /msie 5 /.test(ua),
        IE55: /msie 5.5/.test(ua),
        IE6: /msie 6/.test(ua),
        IE7: /msie 7/.test(ua),
        IE8: /msie 8/.test(ua),
        IE9: /msie 9/.test(ua),
        SAFARI: !/chrome\/([\d.]*)/.test(ua) && /\/([\da-f.]*) safari/.test(ua),
        CHROME: /chrome\/([\d.]*)/.test(ua),
        //!!window["chrome"]
        IPAD: /\(ipad/i.test(ua),
        IPHONE: /\(iphone/i.test(ua),
        ITOUCH: /\(itouch/i.test(ua),
        ANDROID: /android|htc/i.test(ua) || /linux/i.test(ua.platform + ""),
        IOS: /iPhone|iPad|iPod|iOS/i.test(ua),
        MOBILE: isMobile,
        WEIXIN: /micromessenger/i.test(ua),
        WINPHONE: /windows phone/i.test(ua),
        WEB: !/iPhone|iPad|iPod|iOS/i.test(ua) && !/android|htc/i.test(ua) && !/windows phone/i.test(ua),
        CLT: isClient
    };
    ret["MUT"] = !ret.WEB && !ret.CLIENT;
    return ret;
});

/**
 * 获取url参数，返回一个对象
 */
define("util/net/urlquery", [], function(require) {
    var queryStr = window.location.search;
    if (queryStr.indexOf("?") === 0 || queryStr.indexOf("#") === 0) {
        queryStr = queryStr.substring(1, queryStr.length);
    }
    var queryObj = {};
    var tt = queryStr.split("&");
    for (var i in tt) {
        var ss = typeof tt[i] == "string" ? tt[i].split("=") : [];
        if (ss.length == 2) {
            queryObj[ss[0]] = decodeURIComponent(ss[1]);
        }
    }
    return queryObj;
});

/**
 * 搜索日志
 */
/**
自动补全点击日志：suggestClick(element,data)
对element内的所有a标签绑定点击事件，发送点击日志
a标签上需要有属性kw、channelid
或者传参数data
keyword 用户的检索词
channelid 频道id
stitle 点击频道的标题
rank 点击频道的搜索结果排序
 */
define("util/pub/searchlog", [ "core/jquery/1.8.3/jquery", "util/cookie/cookie", "util/user/user", "client" ], function(require) {
    var $ = require("core/jquery/1.8.3/jquery"), cookie = require("util/cookie/cookie"), user = require("util/user/user");
    var image = new Image();
    var host = "http://plt.data.pplive.com/search/1.html";
    var radr = document.referrer.replace(/&/g, "%26").replace(/#/g, "%23");
    var plt = "ikan";
    var commonData = {
        _cache: {},
        parsePPI: function(key) {
            var ppi = key || cookie.get("ppi") ? cookie.get("ppi") : "", bytes = [], str = [];
            if (!ppi || ppi === null || ppi === "") {
                return [ "0", "2" ];
            }
            for (var i = 0, length = ppi.length; i < length - 1; i += 2) {
                bytes.push(parseInt(ppi.substr(i, 2), 16));
            }
            str = String.fromCharCode.apply(String, bytes);
            str = str.split(",");
            return str;
        },
        getPUID: function() {
            if (this._cache.puid) {
                return this._cache.puid;
            }
            this._cache.puid = cookie.get("PUID");
            return this._cache.puid;
        },
        getVIP: function() {
            if (this._cache.vip) {
                return this._cache.vip;
            }
            this._cache.vip = user.isLogined ? user.info.isVip != "0" ? 2 : 1 : 0;
            return this._cache.vip;
        },
        getUID: function() {
            if (this._cache.uid) {
                return this._cache.uid;
            }
            this._cache.uid = user.isLogined ? user.info.UserName : "";
            return this._cache.uid;
        },
        getUT: function() {
            if (this._cache.ut) {
                return this._cache.ut;
            }
            var ut = this.parsePPI()[0];
            //网站端0代表非真实用户，1代表真实用户
            //接口1代表非真实用户，2代表真实用户
            if (ut == "0") {
                this._cache.ut = 1;
            } else {
                this._cache.ut = 2;
            }
            return this._cache.ut;
        }
    };
    function sendDac(data) {
        var url = host + "?" + getHash(data);
        image.src = url;
    }
    function getHash(urlhash) {
        var ss = [];
        for (var p in urlhash) {
            ss.push([ p, "=", urlhash[p] ].join(""));
        }
        return ss.join("&");
    }
    function suggestClick(e, data) {
        var d = data || {};
        var elements = $(e).find("a");
        elements.on("click", function() {
            var el = $(this);
            var href = el.attr("href"), keyword = d.keyword || el.attr("keyword"), channelid = d.channelid || el.attr("channelid"), stitle = d.stitle || el.attr("stitle"), rank = d.rank || el.attr("rank");
            sendDac({
                puid: encodeURIComponent(commonData.getPUID()),
                vip: commonData.getVIP(),
                uid: encodeURIComponent(commonData.getUID()),
                ut: commonData.getUT(),
                adr: encodeURIComponent(href),
                radr: encodeURIComponent(radr),
                act: "aclk",
                plt: plt,
                kw: encodeURIComponent(keyword),
                jump: /search.pptv.com/.test(href) ? 0 : 1,
                chn: channelid,
                title: encodeURIComponent(stitle),
                rk: rank
            });
        });
    }
    return {
        suggestClick: suggestClick
    };
});

/**
 *用户登陆请求和用户数据信息读取
 * mirongxu
 */
define("util/user/user", [ "core/jquery/1.8.3/jquery", "client", "util/cookie/cookie" ], function(require) {
    var jq = require("core/jquery/1.8.3/jquery"), clientCommon = require("client"), cookie = require("util/cookie/cookie"), encode = encodeURIComponent, infoKeys = [ "Gender", //性别
    "PpNum", //用户极点
    "ExpNum", //用户经验值
    "LevelName", //用户等级
    "NextLevelName", //下一等级名称
    "NextLevelExpNum", //下一等级相差经验值
    "Area", //省市
    "Subscribe", //用户一天的节目订阅数
    "UnreadNotes", //未读的小纸条数
    "HeadPic", //用户图像
    "Email", //用户Email
    "OnlineTime", //在线时间
    "Birthday", //生日
    "BlogAddress", //blog地址
    "Signed", //签名档
    "Type", //节目类型
    "Nickname", //昵称
    "isVip", //vip -> 0|1|2
    "VipDate", //vip过期日期
    "IsNoad", //去广告
    "NoadDate", //
    "IsSpdup", //加速
    "SpdupDate", "IsRtmp", //低延迟直播RTMP
    "RtmpDate", //
    "IsUgspeed", //UGS等级加速
    "UgspeedDate" ], domain = "pptv.com", path = "/", loginUrl = "http://passport.pptv.com/weblogin.do?";
    //登陆，退出defer
    var loginDefer = jq.Deferred(), logoutDefer = jq.Deferred(), loginPromise = jq.when(loginDefer), logoutPromise = jq.when(logoutDefer);
    function htmlEncode(s) {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }
    var isClient = function() {
        //是否是客户端
        try {
            if (external && external.GetObject) {
                return true;
            }
        } catch (e) {}
        return false;
    }();
    // var clientCommon = window.clientCommon;
    var User = {
        /**
         * 用户信息对象
         */
        info: {},
        isLogined: false,
        /**
         * 读取用户cookie，并触发登陆或者退出
         */
        readInfo: function(notify) {
            //在UDI存在时，用UDI中的信息填充info
            //UDI若不存在，判断是否是客户端
            //  若不是客户端，代表没有登录，触发logout通知
            //  若是客户端，调用客户端接口判断是否登录
            //      若登录，从客户端中读取info信息，客户端中只能读到部分信息
            var udi = cookie.get("UDI");
            var ppname = cookie.get("PPName");
            if (udi == null || ppname == null) {
                if (isClient && clientCommon && clientCommon.userIsLogin()) {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    this.info["UserName"] = passport.userName;
                    this.info["Nickname"] = passport.nickName;
                    this.info["HeadPic"] = passport.facePictureURL;
                    this.info["isVip"] = passport.isVipUser;
                } else {
                    //触发logout通知
                    if (notify) {
                        this.logoutEvents.fire();
                        logoutDefer.resolve();
                    }
                    return this.info;
                }
            } else {
                // Java的URLEncode是把空格encode为加号，因此要先进行替换
                var infoList = udi.replace(/\+/g, "%20").replace(/\%/g, "%25").split("$");
                //把UDI字段拆分存放到info对象中
                for (var i = 0; i < infoList.length; i++) {
                    this.info[infoKeys[i]] = infoList[i];
                }
                this.info["Nickname"] = decodeURIComponent(this.info["Nickname"]);
                //把PPName字段信息拆分存放info对象中
                var nameList = ppname.split("$");
                this.info["UserName"] = decodeURIComponent(nameList[0]);
            }
            if (isClient && clientCommon && clientCommon.userIsLogin()) {
                this.info["token"] = external.GetObject("@pplive.com/passport;1").token;
            } else {
                this.info["token"] = cookie.get("ppToken");
            }
            this.isLogined = true;
            if (notify) {
                if (loginDefer.state() == "resolved" || loginDefer.state() == "pending") {
                    this.loginEvents.fire(this.info);
                }
                loginDefer.resolve(this.info);
            }
            return this.info;
        },
        /**
         * 登陆
         */
        login: function(name, password, callback) {
            var self = this;
            jq.ajax({
                url: loginUrl,
                dataType: "jsonp",
                jsonp: "cb",
                data: {
                    username: name,
                    password: password
                },
                success: function(statu, json) {
                    if (statu == 1) {
                        self._writeInfo(json);
                    }
                    callback(statu, self.info);
                    loginDefer.resolve(self.info);
                    self.loginEvents.fire(self.info);
                }
            });
            return this;
        },
        /**
         * 退出
         */
        logout: function() {
            if (isClient && clientCommon) {
                try {
                    var passport = external.GetObject("@pplive.com/passport;1");
                    passport.Logout();
                } catch (e) {}
            }
            cookie.remove("PPKey", domain, path);
            cookie.remove("UDI", domain, path);
            cookie.remove("PPName", domain, path);
            cookie.remove("ppToken", domain, path);
            this.isLogined = false;
            logoutDefer.resolve();
            this.logoutEvents.fire();
            return this;
        },
        /**
         * 写入用户信息到pptv.com根域下
         */
        _writeInfo: function(data) {
            for (var i in data) {
                cookie.set(i, data[i], 7, domain, path);
            }
        },
        /**
         * 登陆事件回调
         */
        loginEvents: jq.Callbacks(),
        /**
         *退出事件回调
         */
        logoutEvents: jq.Callbacks(),
        /**
         * 登陆消息处理，并添加到登陆事件
         */
        onLogin: function(fn) {
            loginPromise.then(fn);
            this.loginEvents.add(fn);
            return this;
        },
        /**
         * 退出消息处理，并添加到退出事件
         */
        onLogout: function(fn) {
            logoutPromise.then(fn);
            this.logoutEvents.add(fn);
            return this;
        },
        //海沟计划之真实用户识别,针对有插用户发送diskid和name，设置白名单用户cookie标识
        white: function(flag) {
            var ppi = cookie.get("ppi");
            var self = this;
            var url = "http://tools.aplusapi.pptv.com/get_ppi";
            if (flag || !ppi) {
                var diskId;
                var defer = jq.Deferred();
                getDiskId();
                defer.then(function() {
                    var userName = null;
                    if (diskId !== undefined) {
                        url += "?b=" + encode(diskId);
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "&a=" + encode(userName);
                        }
                    } else {
                        userName = self.info["UserName"] ? self.info["UserName"] : null;
                        if (userName) {
                            url += "?a=" + encode(userName);
                        }
                    }
                    window.wn = window.wn || function() {};
                    jq.ajax({
                        type: "GET",
                        url: url,
                        jsonp: "cb",
                        cache: true,
                        dataType: "jsonp",
                        contentType: "text/json; charset=utf-8",
                        jsonpCallback: "wn",
                        async: true,
                        success: function(data) {
                            if (data.ppi) {
                                cookie.set("ppi", data.ppi, 1, "pptv.com", "/");
                            }
                        },
                        complete: function(xhr, textStatus) {}
                    });
                });
            }
            //获取插件
            function getDiskId() {
                var obj;
                try {
                    if (navigator.userAgent.indexOf("IE") > -1) {
                        obj = new ActiveXObject("PPLive.Lite");
                        diskId = obj.getDiskID();
                    } else {
                        if (window.navigator.mimeTypes["application/x-pptv-plugin"]) {
                            var id = "PPTVPlayer_plugin_detect_" + +new Date();
                            var div = document.createElement("div");
                            div.style.cssText = "width:1px;height:1px;line-height:0px;font-size:0px;overflow:hidden;";
                            div.innerHTML = '<object width="1px" height="1px" id="' + id + '" type="application/x-pptv-plugin"><param value="false" name="enableupdate"><param value="false" name="enabledownload"><param name="type" value="2"/></object>';
                            document.body.appendChild(div);
                            obj = document.getElementById(id);
                            diskId = obj.getDiskID();
                        }
                    }
                    defer.resolve();
                } catch (e) {
                    jq.ajax({
                        type: "GET",
                        dataType: "jsonp",
                        jsonp: "cb",
                        jsonpCallback: "synacast_json",
                        cache: true,
                        url: "http://127.0.0.1:9000/synacast.json",
                        timeout: 1e3,
                        success: function(data) {
                            diskId = data.k;
                            defer.resolve();
                        },
                        error: function() {
                            defer.resolve();
                        }
                    });
                }
            }
        }
    };
    //脚本载入自动读取用户cookie,并触发消息通知
    User.readInfo(true);
    if (!isClient) {
        User.white();
        var FlashApi = window.player || window.PLAYER;
        //登录时白名单检查
        User.loginEvents.add(function() {
            User.white(true);
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                var UserInfo = {
                    ppToken: encode(cookie.get("ppToken")),
                    PPKey: encode(cookie.get("PPKey")),
                    PPName: encode(cookie.get("PPName")),
                    UDI: encode(cookie.get("UDI"))
                };
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: UserInfo
                    }
                });
            }
        });
        User.logoutEvents.add(function() {
            cookie.remove("ppi", "pptv.com", "/");
            if (!FlashApi) FlashApi = window.player || window.PLAYER;
            if (FlashApi && FlashApi.onNotification) {
                FlashApi.onNotification({
                    header: {
                        type: "userinfo"
                    },
                    body: {
                        data: {}
                    }
                });
            }
        });
    }
    return User;
});
