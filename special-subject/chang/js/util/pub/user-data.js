define(function(require, exports){
    var
        $         = require('jquery')
        ,user_fix = require('../user/user-fix')
        ,user     = require('../user/user')
        ,loader     = require('../loader/loader')
        ,cookie   = require('../cookie/cookie')
        ,history  = require('./history')
        ,_        = require('underscore')
        ,JSON     = require('../json/json')
    ;

    var webcfg = window.webcfg || {};
    var FROM = webcfg.isClient ? 'clt' : 'web';

    /*数据模块start*/

    //播放记录
    var playhistorySync = {
        api: 'http://sync.pptv.com/v6/',
        errData: {
            200: '成功',
            304: '成功',
            401: '权限出错',
            404: '资源不存在',
            422: '参数或内容不可处理',
            500: '系统内部错误'
        },
        getUserName: function(username) {
            var _username = username || user.info.UserName;
            return _username;
        },
        getUrl: function(params) {
            var _url = this.api + this.getUserName(params.username) + '/';
            if (!params.type) {
                log('type can not be null!');
                return false;
            }
            _url += (params.type + '/');
            if (params.cid) {
                _url += params.cid + '/';
            }
            log('_url : >>> ', _url);
            return _url += '?';
        },
        go: function(params, callback) {
            if (!this.getUserName(params.username)) {
                log('Not Login!');
                return false;
            }
            if (webcfg && webcfg.IsCloudOpen === false) {
                log('由于接口有问题，云同步已经关闭....', webcfg.IsCloudOpen);
                return false;
            }

            return loader.ajax({
                url: this.getUrl(params),
                data: params.parms
            }).done(function(d){
                log('Data >>>>', d);
                if (callback && typeof(callback) == 'function') {
                    callback.apply(null, arguments);
                }
            });
        }
    };


    var playhistory = {
        get: function(callback, sort){
            // 取缓存
            if(this._cache_playhistory){
                callback(this._cache_playhistory);
                return;
            }
            if(user.isLogined){
                playhistorySync.go({
                    type: 'Recent',
                    parms: {
                        from: FROM,
                        tk: cookie.get('ppToken') || ''
                    }
                }).done(function(data){
                    // data = {0:{}, 1:{}}
                    playhistory._cache_playhistory = typeof sort === 'function' ?
                         _.sortBy(_.toArray(data), sort) :
                         _.toArray(data);

                    callback && callback(playhistory._cache_playhistory);
                });
            }else{
                history.PlayHistory.get(function(data){
                    /*
                    data = {error: 0, message: "操作成功", value: [
                        index: 0
                        value: "{"Id":8006303,"SubId":17413248,"Name":"哎哟好正点-20140707-第四期","Pos":91,"Duration":"3012","link":"gHLeXSpmjMotqxM","VideoType":3,"_mt":"1404895274103"}"
                    ]}
                    */

                    if(!data.error){
                        var ndata;
                        if(data.value && data.value.length){
                            ndata = _.map(data.value, function(n){
                                var t = $.parseJSON(n.value);
                                t.index = n.index;
                                return t;
                            })
                        }
                        playhistory._cache_playhistory = typeof sort === 'function' ?
                             _.sortBy(ndata, sort) :
                             ndata;
                        callback && callback(playhistory._cache_playhistory);
                    }else{
                        log(data.message);
                        callback && callback([]);
                    }
                });
            }
        },
        delCache: function(){
            this._cache_playhistory = null;
        },
        del: function(id, success, fail){
            var cache = this._cache_playhistory, index = -1;
            if(cache){
                $.each(cache, function(i, n){
                    // Id || SubId || index
                    if(n && (n.Id == id || n.index == id || n.SubId == id)){
                        index = i;
                        return false;
                    }
                });

                if(index !== -1 && cache[index]){
                    if(user.isLogined){
                        playhistorySync.go({
                            type: 'Recent',
                            cid: id,
                            parms: {
                                _method: 'delete',
                                from: FROM,
                                tk: cookie.get('ppToken') || ''
                            }
                        }).done(function(d){
                            if (d && (d.errCode == 200 || d.errCode == 304)) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log('[remove playhistory error]', d)
                                fail && fail(d);
                            }
                        })
                    }else{
                        history.PlayHistory.remove(id, function(d) {
                            if (d && d.error === 0) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log('[remove playhistory error]', d)
                                fail && fail(d);
                            }
                        });
                    }
                }
            }
        }
    };

    //云播播放记录
    var cloudhistory = {
        get: function(callback, sort){
            if(this._cache_cloudhistory){
                callback(this._cache_cloudhistory);
                return;
            }
            if(user.isLogined){
                playhistorySync.go({
                    type: 'CpRecent',
                    parms: {
                        from: FROM,
                        tk: cookie.get('ppToken') || ''
                    }
                }).done(function(data){
                    cloudhistory._cache_cloudhistory = typeof sort === 'function' ?
                         _.sortBy(_.toArray(data), sort) :
                         _.toArray(data);
                    callback && callback(cloudhistory._cache_cloudhistory);
                });
            }
        }
    };

    var favorite = {
        get: function(callback, sort){
            // 取缓存
            var cache;
            if(this._cache_favorite){
                callback(this._cache_favorite);
                return;
            }

            if(user.isLogined){
                playhistorySync.go({
                    type: 'Favorites',
                    parms: {
                        from: FROM,
                        tk: cookie.get('ppToken') || ''
                    }
                }).done(function(data){
                    // data = {0:{}, 1:{}}
                    favorite._cache_favorite = typeof sort === 'function' ?
                         _.sortBy(_.toArray(data), sort) :
                         _.toArray(data);
                    callback && callback(favorite._cache_favorite);
                })
            }else{
                // 未登录用户没有收藏功能
                callback && callback([]);
            }
        },
        set: function(id, success, fail){
            var FavoriteObject = {
                Id: id,
                Pos: 0
            };
            playhistorySync.go({
                type: 'Favorites',
                cid: id,
                parms: {
                    from: 'web',
                    _method: 'post',
                    _json: decodeURIComponent(JSON.stringify(FavoriteObject)),
                    tk: cookie.get('ppToken') || ''
                }
            }, function(d) {
                favorite._cache_favorite.push({
                    Id: id
                });
                success && success(d);
            }, null, function() {
                fail && fail();
            });
        },
        delCache: function(){
            this._cache_favorite = null;
        },
        del: function(id, success, fail){
            var cache = this._cache_favorite, index = -1;
            if(cache){
                $.each(cache, function(i, n){
                    if(n && n.Id === id){
                        index = i;
                        return false;
                    }
                });
                if(index !== -1 && cache[index]){
                    if(user.isLogined){
                        playhistorySync.go({
                            type: 'Favorites',
                            cid: cache[index].Id,
                            parms: {
                                _method: 'delete',
                                from: FROM,
                                tk: cookie.get('ppToken') || ''
                            }
                        }).done(function(d){
                            if (d && (d.errCode == 200 || d.errCode == 304)) {
                                success && success(d);
                                delete cache[index];
                            } else {
                                log('[remove favorites error]', d)
                                fail && fail(d);
                            }
                        })
                    }
                }
            }
        }
    };

    var recommend = {
        get: function(callback, sort){
            // 取缓存
            var cache
            if(this._cache_recommend){
                callback(this._cache_recommend, recommend._cache_uuid);
                return;
            }

            var option = {params:{}};
            if(typeof sort != 'function'){
                option = sort;
                sort = option.sort;
            }

            $.extend(option.params, {
                "format"    : "jsonp"
                ,"callback" : "getRec"
            });

            /*文档地址：http://sharepoint/tech/datadivision/Shared%20Documents/Forms/AllItems.aspx?RootFolder=%2Ftech%2Fdatadivision%2FShared%20Documents%2Frecommend&FolderCTID=0x012000C0777BE34EFFDB41A199ECB0A77193B9&View={AB4A77E1-A2B8-4E2D-B0AD-136B7CDAAF4E}*/
            /*原接口：http://svcdn.pptv.com/show/v1/recommend.json?cb=getRec&long_video=1&ppi=302c32&num=30*/
            /*
            --- params -----
            参数                               = 网站/客户端
            appplt[*产品线]                    = ikan/client
            appid[*&产品线id]                  = 111/110
            appver[产品版本]                   = 1.0/1.0
            src[*&产品线]                      = 71/63
            video[频道id]                      = null
            uid[用户id]                        = username || uid
            num[返回数量]                      = 18
            area[地域屏蔽]                     = P
            userLevel[??]                      = 0
            vipUser[用户等级0|1]               = 0
            removeVideoIds[要过滤的频道ID列表] =
            extraFields[返回域]                =all
            format                             =jsonp
            callback                           =func
            */

            loader.ajax({
                url: 'http://api.v.pptv.com/api/pg_recommend?',
                jsonpCallback: 'getRec',
                data: option.params
            }).done(function(data){
                if(!data.error){
                    var
                        urlFormat     = data.data.urlFormat
                        ,picUrlFormat = data.data.picUrlFormat
                    ;

                    recommend._cache_uuid = data.requestUUID;
                    recommend._cache_recommend = typeof sort === 'function' ?
                         _.sortBy(data.videos, sort) :
                         _.toArray(data.videos);

                    _.map(recommend._cache_recommend, function(n){
                        n.id = n.pic;
                        n.pic = picUrlFormat.replace('[PIC]', n.pic).replace('[SN]', n.sn);
                        n.url = urlFormat.replace('[URL]', n.url);
                        return n;
                    });

                    callback && callback(recommend._cache_recommend, recommend._cache_uuid);
                }else{
                    log('load http://recommend.pptv.com/recommend error!', data);
                }

            })
        }
    };

    // 清缓存
    var clearCache = function(){
        playhistory._cache_playhistory = null;
        favorite._cache_favorite = null;
        recommend._cache_recommend = null;
    };

    user_fix().onLogin(clearCache).onLogout(clearCache);

    var userDetail = {
        read: function(callback){
            var self = this;
            var detail = this.detail = {};
            var cb = callback || function(){};
            this.load = false;

            if(!this.load){
                if(!user.isLogined){
                    return;
                }
                loader.ajax({
                    url: 'http://api.usergrowth.pptv.com/getUserBilling?',
                    data:{
                        username: user.info.UserName,
                        from: 'web',
                        format: 'jsonp',
                        token: cookie.get('ppToken') || ''
                    }
                }).done(function(data){
                    if(!data.flag){
                        self.load = true;
                        self.data = data.result;
                        callback && callback(data.result);
                    }

                });
            }else{
                cb(this.data);
            }
        },
        getPb: function(callback){
            var UserInfo = user.info;
            loader.ajax({
                url: 'http://pb.pptv.com/getmemberinfo?',
                data: {
                    username: UserInfo.UserName,
                    token: cookie.get('ppToken') || '',
                    format: 'jsonp'
                }
            }).done(function(d) {
                var msg = {
                    '1': 'decode token exception',
                    '2': 'token content illegal',
                    '3': 'token expired',
                    '4': 'username not match',
                    '5': 'get pb member exception'
                };
                if (d.errcode === 0) {
                    callback && callback(d.pbamount);
                } else {
                    log('pb -> getmemberinfo', d.errcode, msg[d.errcode]);
                }
            });
        },
        clear: function(){
            self.load = false;
            self.data = {};
        }
    };
    /*数据模块end*/

    return {
        playhistory: playhistory,
        PlayHistory : playhistorySync,
        favorite: favorite,
        recommend: recommend,
        clearCache: clearCache,
        userDetail: userDetail,
        cloudhistory: cloudhistory
    };
});
