define(function() {
	var parseNum = function(num) {
		num = Number(num);
		if (num < 10000) {
			return num;
		} else if (num >= 10000 && num < 100000000) {
			num = String(Math.round(num / 1000) / 10) + '万';
			return num;
		} else if (num >= 100000000 && num < 100000000000) {
			num = String(Math.round(num / 10000000) / 10) + '亿';
		}
	};
	return parseNum;
});