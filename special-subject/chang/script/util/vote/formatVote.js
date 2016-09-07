/*! 一唱成名 create by ErickSong */
define("util/vote/formatVote", [], function(require, exports) {
    function zeroPadding(digit, num) {
        if (!num) {
            num = "0";
        }
        return new Array(digit + 1).join(num);
    }
    function formatVote(num, digit) {
        //测试千万数据
        //num=12235400;
        //测试亿数据
        //num=123500000;
        //num=12000;
        //digit=2;
        if (num == null || num == 0) {
            return 0;
        }
        var intNum = parseFloat(num);
        if (isNaN(intNum)) {
            return false;
        }
        if (typeof digit == "undefined") {
            var digit = 1;
        }
        var len = num.toString().length;
        if (len > 4) {
            //百万
            if (len > 6) {
                //亿
                if (len > 8) {
                    var finalNum = num / 1e8;
                    var finalArr = finalNum.toString().split(".");
                    if (finalArr.length == 1) {
                        var digitNum = zeroPadding(digit);
                    } else {
                        var digitStr = finalArr[1].toString();
                        if (digitStr.length < digit) {
                            var paddNum = digit - digitStr.length;
                            var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                        } else {
                            var digitNum = digitStr.substring(0, digit);
                        }
                    }
                    return finalArr[0] + "." + digitNum + "亿";
                } else if (len > 7) {
                    var finalNum = num / 1e7;
                    var finalArr = finalNum.toString().split(".");
                    if (finalArr.length == 1) {
                        var digitNum = zeroPadding(digit);
                    } else {
                        var digitStr = finalArr[1].toString();
                        if (digitStr.length < digit) {
                            var paddNum = digit - digitStr.length;
                            var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                        } else {
                            var digitNum = digitStr.substring(0, digit);
                        }
                    }
                    return finalArr[0] + "." + digitNum + "千万";
                } else {
                    var finalNum = num / 1e6;
                    var finalArr = finalNum.toString().split(".");
                    if (finalArr.length == 1) {
                        var digitNum = zeroPadding(digit);
                    } else {
                        var digitStr = finalArr[1].toString();
                        if (digitStr.length < digit) {
                            var paddNum = digit - digitStr.length;
                            var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                        } else {
                            var digitNum = digitStr.substring(0, digit);
                        }
                    }
                    return finalArr[0] + "." + digitNum + "百万";
                }
            } else {
                //万
                var finalNum = num / 1e4;
                var finalArr = finalNum.toString().split(".");
                if (finalArr.length == 1) {
                    var digitNum = zeroPadding(digit);
                } else {
                    var digitStr = finalArr[1].toString();
                    if (digitStr.length < digit) {
                        var paddNum = digit - digitStr.length;
                        var digitNum = digitStr.substring(0, digit) + zeroPadding(paddNum);
                    } else {
                        var digitNum = digitStr.substring(0, digit);
                    }
                }
                return finalArr[0] + "." + digitNum + "万";
            }
        } else {
            return num;
        }
    }
    return formatVote;
});
