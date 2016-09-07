define(function () {
    return function (n) {
        var b = parseInt(n).toString();
        var len = b.length;
        if (len <= 3) {
            return b;
        }
        var r = len % 3;
        return r > 0 ? b.slice(0, r) + "," + b.slice(r, len).match(/\d{3}/g).join(",") : b.slice(r, len).match(/\d{3}/g).join(",");
    }
});