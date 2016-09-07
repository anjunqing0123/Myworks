/*! 一唱成名 create by ErickSong */
define("app/pc/index/group", [ "core/underscore/1.8.3/underscore" ], function(require, exports) {
    var _ = require("core/underscore/1.8.3/underscore");
    function Group(info) {
        _.extend(this, info);
    }
    _.extend(Group.prototype, {
        next: function() {},
        prev: function() {}
    });
    return Group;
});
