define(function(require, exports){
	var _ = require('underscore');

	function Group(info){
		_.extend(this,info);
	}

	_.extend(Group.prototype, {
		next: function(){},
		prev: function(){}
	});


	return Group;
});
