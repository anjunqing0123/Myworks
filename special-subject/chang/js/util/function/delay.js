define(function(require, exports){
    function delay(fn, time){
        var t, flag = true, ct = clearTimeout, f = function(){
            ct(t);
        if(typeof time != 'number' || time<0){
            time = 300;
        }
            var args = f.arg = arguments;
            flag = true;
            t = setTimeout(function(){
                flag && fn.apply(window, args);
            }, time);
        }
        f.cancel = function(){flag = false;}
        return f;
    }
    return delay
});