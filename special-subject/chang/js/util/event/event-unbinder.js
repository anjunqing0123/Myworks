define(function (require, exports) {
    var noop = function(){};
    function EventUnbinder(){
        this.events = [];
    }

    EventUnbinder.prototype.add = function(name, fn, binder, scope, unbinder){
        var e = this.events;
        var t = {
            name      : name
            ,fn       : fn
            ,binder   : binder
            ,scope    : scope
            ,unbinder : unbinder
        }

        t.binder.call(t.scope, t.name, t.fn);

        e[e.length] = t;
    }

    EventUnbinder.prototype.clear = function(){
        for(var i = 0, n; n = this.events[i++];){
            if(n.unbinder){
                n.unbinder.call(n.scope, n.name, n.fn);
            }else{
                n.fn = noop;
            }
        }
        //console.log('clear!!', this);
    }

    return EventUnbinder;
});
