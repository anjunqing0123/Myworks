/**
 * @author   Yan Yang
 * @email    yyfireman@163.com
 * @version  v1.1.0
 * @info     兼容app和native的UI（功能）创建，根据环境调用app接口或js方法。
 */

 /*************************
注：
1)目前版本有缺陷，回调方法在app环境中只能存在一个，
  而在非app中才是正常的回调队列。
2)LM.whenApp()必须是在监测到extenal存在的情况下才会执行，
  并且，LM.isApp()在获得参数plt=app时返回true，但是无法获得external后会返回false
*************************/

/*
    example:

    LM.callback('userLogin', function(s){
        console.log('userLogin callback1:' + s);
    });

    LM.callback('userLogin', function(s){
        console.log('userLogin callback2:' + s);
    });

    LM.method('userLogin', function(promise){
        confirm('userLogin method') && promise.done('userLogin promise'[, argu1[, argu2[, argu3[...]]);
    });

    document.getElementById('login').onclick = function(){
        LM.exec('userLogin');
    };

    LM.whenApp(function(){
        alert('In App!!!');
    });


*/
define(function(require, exports, module){
    (function(module, global){
        // console.log('start')
        var getParam = function(s){
            var m = location.search.substring(1).match(new RegExp(s + '=(.*?)(&|$)'));
            return m && m.length > 0 ? m[1] : '';
        };

        var extend = function(s, o){
            for(var n in o){
                s[n] = o[n];
            }
        };

        // 回调类
        var Callback = function(){
            this.fns = [];
        };

        Callback.prototype = {
            add: function(fn) {
                this.fns[this.fns.length] = fn;
            },
            remove: function(fn) {
                for (var i = 0; i < this.fns.length; i++) {
                    if (this.fns[i] === fn) {
                        delete (this.fns[i]);
                        return;
                    }
                }
            },
            empty: function(){
                this.fns = [];
            },
            fire: function() {
                for (var i = 0; i < this.fns.length; i++) {
                    if (typeof this.fns[i] === 'function') {
                        this.fns[i].apply(global, arguments);
                    }
                }
            }
        };

        var Ready = new Callback();
        Ready.add = function(callback){
            // console.log(externalProxy.readyStatus())
            if(externalProxy.readyStatus() > 0){
                callback(false);
            }else if(externalProxy.readyStatus() < 0){
                callback(true);
            }else{
                Callback.prototype.add.call(this, callback);
            }
        };

        // 调用app的对象
        var externalProxy = {
            // 设备external准备完毕
            _ready: 0, //1 : success | -1 : failed
            _plt: getParam('plt'),
            // 执行external
            proxy: function(name, params){
                var callbackName = '__' + name;
                var param = params;
                param.push(callbackName);
                external[name].apply(external, param);

                // console.log('[externalProxy | run method | external['+ name +']('+ param +')] _ready ? ' + this._ready + ' | name: ' + name + ' | param: ' + param);
                // console.log(global[callbackName]);
            },
            // 当_ready == true
            ready: function(){
                this._ready = 1;
            },
            // external调用失败
            loadFailed: function(){
                this._plt = '';
                this._ready = -1;
            },
            // isApp: function(){return this._plt === 'app';},
            // 不需要 plt=app 的参数，始终运行
            isApp : function () {return true},
            readyStatus: function(){return this._ready;}
        };

        Ready.add(function(err){
            if(!err){
                externalProxy.ready();
            }else{
                externalProxy.loadFailed();
            }
        });

        // 回调类
        var Promise = function(callback, content){
            this.cb = callback;
            this.content = content;
        };

        Promise.prototype.done = function(){
            this.cb.apply(this.content, arguments);
        };

        // 创建公共方法&回调 （只有非app使用）
        var webUiInterface = function(){
            var callback = new Callback();
            return {
                method: function(promise){
                    promise.done();
                },
                callback: callback
            };
        };

        extend(module, {
            _webUiInterface: {},
            appProxy: externalProxy,
            whenApp: function(callback){
                Ready.add(function(err){
                    if(!err){
                        callback();
                    }
                });
            },
            getInterface: function(name){
                !this._webUiInterface[name] && (this._webUiInterface[name] = new webUiInterface());
                return this._webUiInterface[name];
            },
            // 运行功能
            exec: function(name){
                var args = arguments;
                Ready.add(function(err){
                    if(!err){
                        module.appProxy.proxy(name, Array.prototype.slice.call(args, 1));
                    }else{
                        // 创建约定，在method执行以后完成约定。
                        var promise = new Promise(function(){
                            var cb = module.getInterface(name).callback;
                            cb.fire.apply(cb, arguments);
                        }, module);
                        module.getInterface(name).method(promise);
                    }
                });
            },
            // 定义功能创建方法（一个功能只有唯一方法）
            method: function(name, method){
                Ready.add(function(err){
                    if(err){
                        module.getInterface(name).method = function(promise){
                            if(!module.appProxy.isApp()){
                                method(promise);
                            }
                        };
                    }
                });
            },
            // 定义功能回调（方法数组）
            callback: function(name, callback, content){
                Ready.add(function(err){
                    if(!err){
                        global['__' + name] = function(){
                            callback.apply(content || global, arguments);
                        };
                    }else{
                        module.getInterface(name).callback.add(callback);
                    }
                });
            },
            removeCallback: function(name, callback){
                Ready.add(function(err){
                    if(!err){
                        global['__' + name] = function(){};
                    }else{
                        module.getInterface(name).callback.remove(callback);
                    }
                });
            },
            emptyCallback: function(name){
                Ready.add(function(err){
                    if(!err){
                        global['__' + name] = function(){};
                    }else{
                        module.getInterface(name).callback.empty(callback);
                    }
                });
            }
        });

        if(externalProxy.isApp()){
            // console.log('wait external ready');
            var maxTimes = 500, times = 10, sid, done = false;
            var checkExternal = function(){
                 //console.log('...');
                try{
                    if(external && external.userLogin){
                        done = true;
                        Ready.fire(false); // err = false
                        // console.log('external ready');
                    }
                }catch(e){}
                if((times += 50) >= maxTimes){
                    // console.log('external timeout');
                    done = true;
                    Ready.fire(true); // err = true
                }
                !done && (sid = setTimeout(function(){checkExternal();}, times));
            };

            checkExternal(); //4.1不支持setTimeout？ android 注入快，基本不存在需要延迟的情况，ios 注入不稳定会需要。
            //sid = setTimeout(function(){ checkExternal();}, times);

        }else{
            Ready.fire(true); // err = true
        }
    })('object' === typeof module ? module.exports : (this.LM = {}), this);
});

