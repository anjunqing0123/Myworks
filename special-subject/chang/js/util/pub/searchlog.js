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
define(function(require) {
    var $ = require('jquery'),
        cookie = require('../cookie/cookie'),
        user = require('../user/user');
    var image = new Image();
    var host = 'http://plt.data.pplive.com/search/1.html';
    var radr = document.referrer.replace(/&/g, '%26').replace(/#/g, '%23');
    var plt = 'ikan';
    var commonData = {
        _cache: {},
        parsePPI: function(key) {
            var ppi = key || cookie.get('ppi') ? cookie.get('ppi') : '',
                bytes = [],
                str = [];
            if (!ppi || ppi === null || ppi === '') {
                return ['0', '2'];
            }
            for (var i = 0, length = ppi.length; i < length - 1; i += 2) {
                bytes.push(parseInt(ppi.substr(i, 2), 16));
            }
            str = String.fromCharCode.apply(String, bytes);
            str = str.split(',');
            return str;
        },
        getPUID: function() {
            if (this._cache.puid) {
                return this._cache.puid;
            }
            this._cache.puid = cookie.get('PUID');
            return this._cache.puid;
        },
        getVIP: function() {
            if (this._cache.vip) {
                return this._cache.vip;
            }
            this._cache.vip = user.isLogined ? (user.info.isVip != '0' ? 2 : 1) : 0;
            return this._cache.vip;
        },
        getUID: function() {
            if (this._cache.uid) {
                return this._cache.uid;
            }
            this._cache.uid = user.isLogined ? user.info.UserName : '';
            return this._cache.uid;
        },
        getUT: function() {
            if (this._cache.ut) {
                return this._cache.ut;
            }
            var ut = this.parsePPI()[0];
            //网站端0代表非真实用户，1代表真实用户
            //接口1代表非真实用户，2代表真实用户
            if (ut == '0') {
                this._cache.ut = 1;
            } else {
                this._cache.ut = 2;
            }
            return this._cache.ut;
        }
    };

    function sendDac(data) {
        var url = host + '?' + getHash(data);
        image.src = url;
    }

    function getHash(urlhash) {
        var ss = [];
        for (var p in urlhash) {
            ss.push([p, '=', urlhash[p]].join(''));
        }
        return ss.join('&');
    }

    function suggestClick(e, data) {
        var d = data || {};
        var elements = $(e).find('a');
        elements.on('click', function() {
            var el = $(this);
            var href = el.attr('href'),
                keyword = d.keyword || el.attr('keyword'),
                channelid = d.channelid || el.attr('channelid'),
                stitle = d.stitle || el.attr('stitle'),
                rank = d.rank || el.attr('rank');
            sendDac({
                puid: encodeURIComponent(commonData.getPUID()),
                vip: commonData.getVIP(),
                uid: encodeURIComponent(commonData.getUID()),
                ut: commonData.getUT(),
                adr: encodeURIComponent(href),
                radr: encodeURIComponent(radr),
                act: 'aclk',
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
        suggestClick: suggestClick //搜索补全点击日志
    };
});
