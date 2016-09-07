$(document).ready(function(){
		var submit = $("#dmsubmit"),
			inputTxt = $("#dminput"),
			text = $(".text");
			
		var getValue = function(){
			words = inputTxt.val();
			text.html(words);
		}

		var opaNum = [1,0.85,0.7,0.55];

		$("#opacity a").each(function(i,d){
			$(this).click(function(){
				$("#opacity a").removeClass("now");
				$(this).addClass("now");
				text.css("opacity",opaNum[i]);
			})
		})
			
		$(".takecolor a").each(function(i,d){
			$(this).click(function(){
				var curcolor = $(this).attr("data-color");
				$(".rgb").html("#"+curcolor);
				$(".color").css("background","#"+curcolor);
				text.css("color","#"+curcolor);
			})
		})

		$("#setfont").click(function(){
			if($(".dm-input-pop").css("display") == "none"){
				$(".dm-input-pop").show();
			}else{
				$(".dm-input-pop").hide();
			}				
		})
			
		submit.click(function(){	
			getValue();
		})	
	
	})