define(function() {
	var dateFormat = function(dateObj, format) {
		if (typeof dateObj === 'number') {
			dateObj = new Date(dateObj);
		}
		var weekCn = ['日','一','二','三','四','五','六'];
		var reg = /yyyy|MM|dd|hh|mm|ss|w/g;
		var map = {
			yyyy: dateObj.getFullYear(),
			MM: dateObj.getMonth() + 1,
			dd: dateObj.getDate(),
			w: weekCn[dateObj.getDay()],
			hh: dateObj.getHours(),
			mm: dateObj.getMinutes(),
			ss: dateObj.getSeconds()
		};
		return format.replace(reg, function(str) {
			if (str.length === 4 || str === 'w') {
				return String(map[str]);
			} else {
				return ('0' + String(map[str])).slice(-2);
			}
		});
	};
	return dateFormat;
});
	