/*! 一唱成名 create by ErickSong */
define("util/parse_num/parse_num", [], function() {
    var parseNum = function(num) {
        num = Number(num);
        if (num < 1e4) {
            return num;
        } else if (num >= 1e4 && num < 1e8) {
            num = String(Math.round(num / 1e3) / 10) + "万";
            return num;
        } else if (num >= 1e8 && num < 1e11) {
            num = String(Math.round(num / 1e7) / 10) + "亿";
        }
    };
    return parseNum;
});
