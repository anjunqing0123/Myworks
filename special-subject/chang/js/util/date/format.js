define(function(require, exports){
    var prefixInteger = function(num, length) {
        return (num / Math.pow(10, length)).toFixed(length).substr(2);
    }
	var formatDate = function(date, format){
        var self = this;
        if (arguments.length < 2 && !date.getTime) {
            format = date;
            date = new Date();
        }
        typeof format != 'string' && (format = 'YYYY年MM月DD日 hh时mm分ss秒');
        var week = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', '日', '一', '二', '三', '四', '五', '六'];
        return format.replace(/YYYY|YY|MM|DD|hh|mm|ss|星期|周|www|week/g, function(a) {
            switch (a) {
            case "YYYY": return date.getFullYear();
            case "YY": return (date.getFullYear()+"").slice(2);
            case "MM": return prefixInteger(date.getMonth() + 1,2);
            case "DD": return prefixInteger(date.getDate(),2);
            case "hh": return prefixInteger(date.getHours(),2);
            case "mm": return prefixInteger(date.getMinutes(),2);
            case "ss": return prefixInteger(date.getSeconds(),2);
            case "星期": return "星期" + week[date.getDay() + 7];
            case "周": return "周" +  week[date.getDay() + 7];
            case "week": return week[date.getDay()];
            case "www": return week[date.getDay()].slice(0,3);
            }
        });
    }
    return formatDate;
});