/* 
* @Author: WhiteWang
* @Date:   2015-08-21 11:21:58
* @Last Modified by:   weifengwang
* @Last Modified time: 2015-11-12 15:05:49
*/
define(function(require, exports, module){
/**
 * [一唱成名投票模块]
 * @param {[type]} options [description]
 *
 * dom
 *     非必需  可以是jquery对象，也可以是dom选择字符串
 *     会对dom绑定click事件，点击以后向对应id投票
 *     dom上需有data-voteid属性，投票id
 *     如果没传，需要调用this.vote方法投票
 * beforeVote
 *     非必需  function
 *     调用投票接口前
 * afterVote
 *     非必需  function
 *     投票接口返回结果之后
 *     afterVote(
 *         data.counter 当前实时票数
 *         data.errors 投票出错
 *         el   当定义ChangVote对象时传了dom参数，el代表当前点击的dom，否则el为null
 *     )
 *
 * this.vote(
 *     voteId   投票id
 * )    这一方法供没传dom参数时使用
 */
    var $=require('jquery');
    var pageToken;
    var cookie = require('../cookie/cookie');
    var voteTokeApi = 'http://api.vote.pptv.com/vote/csrf';
    var loader=require('../loader/loader');
    var user = require('../user/user');
    var tookieTry=0;
    //console.log(token);
    //var SID=cookie.get('SID');
    //console.log(SID);
    //console.log(document.cookie.indexOf('SID'));
    function isClient(){
        try {
            if (external && external.GetObject('@pplive.com/ui/mainwindow;1')) {
                return true;
            }
        } catch (e) {}
        return false;
    }
    function getUserName(){
        if(isClient()){
            if(external.GetObject('@pplive.com/passport;1').state == 0){
                return external.GetObject('@pplive.com/passport;1').userName;
            }
        } else {
            var ppname = cookie.get('PPName');
            if(ppname){
                var nameList = ppname.split('$');
                return decodeURIComponent(nameList[0]);
            }
        }
        return '';
    }
    var username = getUserName();
    user.loginEvents.add(function(){username = getUserName()});
    user.logoutEvents.add(function(){username = getUserName()});

    function getVoteApi(voteId){
        return 'http://api.vote.pptv.com/vote/'+voteId+'/increase';
    }
    function ChangVote(options){
        var opt = $.extend({
            dom: null,
            beforeVote: function(){return true;},
            afterVote: function(){}
        }, options || {});
        var that = this;
        if(opt.dom){
            var $dom = $(opt.dom);
            this.$el=$dom;
            if(!!opt.container){
                $(opt.container).on('click.vote',opt.dom,function(ev){
                    ev.preventDefault();
                    var $obj=$(this);
                    var voteId = $obj.attr(opt.voteAttr||'data-voteid');
                    if(typeof voteId=="undefined"){
                        return false;
                    }
                    that.vote(voteId, $obj);
                });
            }else{
                $dom.on('click.vote',function(ev){
                    ev.preventDefault();
                    var $obj=$(this);
                    var voteId = $obj.attr(opt.voteAttr||'data-voteid');
                    if(typeof voteId=="undefined"){
                        return false;
                    }
                    that.vote(voteId, $obj);
                });
            }
        }
        var getVoteToken = function(callback){
            var token = cookie.get('ch_tk')||pageToken;
            if(!token){
                loader.load(voteTokeApi,{},function(data){
                    if(data.token){
                        cookie.set('ch_tk',data.token,1/12,'.pptv.com','/');
                        pageToken=data.token;
                        callback(data.token);
                    } else {
                        opt.afterVote.call(that, {errors: {message: 'token获取失败', code:401}});
                    }
                    },function(jqXHR, status){
                        opt.afterVote.call(that, {errors: {message: 'token获取失败', code:401}});
                    });
            } else {
                callback(token);
            }
        }
        this.vote = function(voteId, el){
            var self=this;
            var id=voteId;
            var $el=el;
            getVoteToken(function(token){
                var ifValidate=opt.beforeVote.call(that, {id: voteId}, el);
                if(ifValidate!=false){
                    loader.load(getVoteApi(voteId),{_token: token, username: username},function(data){
                        //invalid token
                        if(!!data.errors&&data.errors.code==89){
                            cookie.remove('ch_tk','.pptv.com','/');
                            tookieTry++;
                            if(tookieTry>2){
                                return false;
                            }
                            self.vote(id,$el);
                            return false;
                        } else if(!!data.errors && data.errors.code==88){
                            $('.vote-error-limit').show();
                        }
                        opt.afterVote.call(that, data, el);
                    },function(jqXHR, status){
                        opt.afterVote.call(that, {errors: {message: status, code:400}}, el);
                    });
                }
            });
        }
        this.unbind=function(){
            this.$el.off('click.vote');
        }
    }
    return ChangVote;

    
});