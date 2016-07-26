
$(function() {
	

	// var lisbg=$('footer li span');
	// var lis=$('footer li');
	// lisbg.each(function(index, el) {

	// 	// alert($(this).index());
	// 	var x=index*-15;
	// 	$(el).css('background-position', x+'px -15px');

		
	// });
	
	// lis.mouseenter(function(event) {

	// 	var s=0,i=$(this).index();
	// 	alert(i);
	// 	s=-15*i;
	// 	alert(s);
	// 	lis.removeClass('current');
	// 	$(this).addClass('current');
	// 	$(this).children('a span').css('background-position', s+'px 0');
	// });
	var btns=$('.cover button');
	var cov=$('.cover')
	btns.click(function(event) {
		
		$(this).addClass('current').siblings().removeClass('current');
		// cov.hide();
	});
	btns.eq(2).click(function(event) {
		cov.hide();
	});
});