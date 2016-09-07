define(function(require,exports) {
	var validator=require('./validator');
	var $=require('jquery');
	var urls=require('../../../util/linkcfg/interfaceurl');
	var user=require('../../../util/user/user');
	var login=require('../../../util/login/login');
	var loader=require('../../../util/loader/loader');
	var isClient = function(){
        //是否是客户端
        try{
            if(external && external.GetObject){
                return true;
            }
        }catch(e){}
        return false;
    }();
    // 添加报名协议
    var $confirmContract=$(".confirm-contract");
    var $link=$confirmContract.find('a');
    if(!!isClient){
    	var link=urls['redirect']['contract_client'];
    	$link.attr('href',link);
    }else{
    	var link=urls['redirect']['contract_pc'];
    	$link.attr('href',link);
    	$link.attr('target','_blank');
    }
	//添加登录报名验证
	var client_suffix='?plt=clt';
	user.loginEvents.add(function(){
    	var username=user.info.UserName;
    	loader.load(urls['interface']['checkSign'],{},function(data){
			if(data.status==-1){
				//已经报过名
				var urlComplete=urls['redirect']['registrationComplete'];
				if(!!isClient){
					window.location=urlComplete+client_suffix;
				}else{
					window.location=urlComplete;
				}
			}else if(data.status==1){
				//未报名
				//不作任何操作
			}
		});
	});
	//console.log(user);
	// 注册成功跳转逻辑
	var registerDirectTemplate='<div class="grid"><div class="wc100 pdt30 cf"><div class="module-register-redirect"><h2>您已报名一唱成名</h2><p class="mt5">将于<em class="js-direct-time">5</em>s后跳转至您的<span><a href="#">个人中心</a></span></p></div></div></div>';
	function counter(dom,count){
		setTimeout(function(){
			dom.text(--count);
			if(count!=0){
				counter(dom,count);
			}else{
				if(!!isClient){
					window.location=urls['redirect']['usercenter']+'?from=clt';
				}else{
					window.location=urls['redirect']['oneSingTab'];
				}
			}
		},1000);
	}
	function registerDirect(type){
		if(!type){
			var $wrap=$(".bgGrey");
			$wrap.html(registerDirectTemplate);
			var timeDom=$wrap.find('.js-direct-time');
			counter(timeDom,5);
		}else{

		}
	}
	//判断未登录，提示用户登录
	if(!login.isLogined()){
		login.init({
			 type:'login',
			 tip: encodeURIComponent("亲，需要登录后才能报名哦")
		});
	}else{
		//registerDirect();
	}
	// 图片上传
	var iframeUpload=require('./iframeUpload');
	//初始化三级联动
	//城市联动下拉框
	var dropdownSelect=require('./dropdownSelect');
	var dropAddress=dropdownSelect.create({
		dropIcon:'.curval'
	});
	var dropdownNormal=require('./dropdown');
	// 身份证下拉框 ，证件类型默认是身份证
	var card_type=1;
	dropdownNormal.create({
		container:'.drop-card',
		dropIcon:'.curval,.dropdown-icon',
		afterSelect:function(type,val){
			$(".drop-card").next().text('');
			if(val=='身份证'){
				card_type=1;
			}else{
				card_type=2;
			}
		}
	});
	// bdayjson数据组装
	var bday="";
	var bdayObj=require('./bdaydrop');
	var bdayJson={};
	for(var i=1900;i<=2014;i++){
		bdayJson[i]=bdayObj;
	}
	var dropBday=dropdownSelect.create({
		container:'.drop-bday',
		groupDataArr:bdayJson,
		dropIcon:'.curval,.dropdown-icon'
	});
	// bdayjson数据组装结束
	//清空值
	var btnTimeout;
	$(".btn-close").on('click',function(){
		clearTimeout(btnTimeout);
		btnTimeout=null;
		$(this).prev().val('');
	});
	//上传图片的地址
	var photo='';
	var iframeObj=new iframeUpload({
		afterUpload:function(type,data,obj){
			photo=data;
			$("#photoNative").val($(".input-file-main").val());
			obj.removeClass('btn-disabled').find('span').text('重新上传');
			$(".upload-inprogress").addClass('hidden');
			obj.next().addClass('hidden');
			obj.siblings('.form-error').text('');
			$(".previewBox-image").css('backgroundImage','none');
		},
		inProgress:function(){
			$("#imageError").html('');
			$(".upload-inprogress").removeClass('hidden');
		},
		error:function(type,errorInfo,obj){
			if(errorInfo=='login'){
				login.init({
				    type:'login'
				});
				obj.removeClass('btn-disabled').find('span').text('上传');
				obj.next().addClass('hidden');
				obj.siblings('.form-error').text('请先登录');
			}else if(errorInfo=='upload'){
				obj.siblings('.form-error').text('上传出错，请稍后再试');
			}
		},
		errorType:function(type,errorInfo,obj){
			obj.removeClass('btn-disabled').find('span').text('上传');
			obj.next().addClass('hidden');
			$("#imageError").text('上传的图片类型不正确');
		},
		errorSize:function(type,errorInfo,obj){
			obj.removeClass('btn-disabled').find('span').text('上传');
			obj.next().addClass('hidden');
			$("#imageError").text(errorInfo);
		}
	});
	// 尝试使用 imagepreview
	/*var imagepreview=require('./imagePreview');
	imagepreview.create({
		container:'#person-info',
		imgContainer:'.previewBox-image',
		bigImage:'#bigImage',
		smallImage:'#smallImage',
		fileBtn:'.input-file-main',
		errorType:function(){
			$("#imageError").text('上传的图片类型不正确');
		},
		errorSize:function(type,msg){
			$("#imageError").text(msg);
		}
	});*/
	function hasPlaceholderSupport() {
	    return "placeholder" in document.createElement("input");
	}
	//单个验证
	function validate(obj){
		var type=obj.attr('data-check');
		if(!type){
			return false;
		}
		var digit;
		var idx;
		if(~(idx=type.indexOf('|'))){
			digit=type.substr(idx+1);
			type=type.substr(0,idx);
		}
		if(type=='card'){
			digit=card_type;
		}
		var msg=obj.attr('data-error')||validator.msg[type];
		var tempVal=$.trim(obj.val());
		if(!validator[type](tempVal,digit)||obj.val()=="请输入组合名称"||obj.val()=='请输入您的姓名'||obj.val()=='请选择您的认证照片'||obj.val()=='请输入您的联系地址'){
			obj.parents('.form-item').find('.form-error').removeClass('form-success').text(msg);
			obj.addClass('in-error');
			return false;
		}else{
			obj.parents('.form-item').find('.form-error').text('');
			obj.removeClass('in-error');
			return true;
		}
	}
	function focusNormal(obj){
		obj.removeClass('in-error');
		obj.addClass('in-edit');
		obj.next('.btn-close').removeClass('hidden');
		if(obj.attr('placeholder')=='请输入组合名称'){
			obj.parents('.form-item').find('.form-error').addClass('form-success').text('以下个人信息填写组合队长信息');
		}
	}
	function blurNormal(obj){
		obj.removeClass('in-edit');
		var isvalidate=validate(obj);
		if(!!isvalidate){
			obj.removeClass('in-error');
		}else{
			if(obj.attr('placeholder')=='请输入组合名称'){
				obj.parents('.form-item').find('.form-error').removeClass('form-success');
			}
			obj.addClass('in-error');
		}
		obj.next('.btn-close').addClass('hidden');
	}
	// 绑定placeholder
	var inputArr=$("input[type=text]").not($('#photoNative'));
	if(!hasPlaceholderSupport()){
		inputArr.each(function(){
			var obj=$(this);
			var placeVal=obj.attr('placeholder');
			obj.val(placeVal);
			obj.on('focus',function(){
				if(obj.val()==placeVal){
					obj.val('');
				}
				focusNormal(obj);
			}).on('blur',function(e){
				btnTimeout=setTimeout(function(){
					blurNormal(obj);
					if($.trim(obj.val())==''){
						obj.val(placeVal);
					}
				},500);
			});
		});
		$(".input-text-file").val('请选择您的认证照片');
	}else{
		inputArr.each(function(){
			var obj=$(this);
			obj.on('focus',function(){
				focusNormal(obj);
			}).on('blur',function(){
				btnTimeout=setTimeout(function(){
					blurNormal(obj);
				},500);
			});
		});
	}
	// input radio check
	//是否组合
	var isgroup=0;
	//性别
	var sex=1;
	// sex error dom
	var sexErrorDom=$("#js-sex").find('.form-error');
	$(".input-radio").on("click",function(){
		var obj=$(this);
		obj.siblings('.input-radio').removeClass("input-radio-check");
		obj.addClass("input-radio-check");
		var formContainer=$(".form-group-name");
		if(obj.parents('.form-isGroup').length!=0){
			//组合名称逻辑
			if(obj.prev().text()=='是'){
				isgroup=1;
				formContainer.removeClass('hidden');
				formContainer.find('input').attr('data-check','required');
				formContainer.find('.form-error').addClass('form-success').text('以下个人信息填写组合队长信息');
			}else{
				isgroup=0;
				$(".form-group-name").addClass('hidden');
				formContainer.find('input').removeAttr('data-check','required');
				formContainer.find('.form-error').removeClass('form-success').text('');
			}
		}else{
			sexErrorDom.text('');
			if(obj.prev().text()=='男'){
				sex=1;
			}else{
				sex=0;
			}
		}
	});
	// 是否开启不让发验证码的倒计时
	var capBool=false;
	// 验证码按钮
	var cpaBtn=$(".cpaBtn");
	cpaBtn.on('click',function(e){
		e.preventDefault();
		var mobile=$("[data-check=mobile]");
		var errorDom=mobile.parents('.form-item').find('.form-error');
		var type=mobile.attr('data-check');
		var tempVal=mobile.val();
		var msg=mobile.attr('data-error')||validator.msg[type];
		if(!login.isLogined()){
			errorDom.text('需要登录哦，亲');
			//提醒用户登录
			login.init({
			    type:'login'
			});
			return false;
		}
		if(!!capBool){
			errorDom.text('验证码发送过于频繁，请稍后再试');
			return false;
		}
		if(!validator[type](tempVal)){
			errorDom.text(msg);
		}else{
			//开始发送验证码
			loader.ajax({
				url:urls['interface']['phonetoken'],
				data:{
					telphone:tempVal
				},
				success:function(data){
					//验证码已经发送
					if(data.status==1){
						errorDom.text('验证码发送成功');
						errorDom.addClass('form-success');
						setTimeout(function(){
							errorDom.removeClass('form-success').addClass('hidden');
						},3000);
						//执行60s不让发的逻辑
						capBool=true;
						var time=60;
						function buildTxt(time){
							return '验证码已经发送('+time+'S)';
						}
						cpaBtn.text(buildTxt(time));
						cpaBtn.addClass('btn-disabled');
						var timerInterval=setInterval(function(){
							time--;
							cpaBtn.text(buildTxt(time));
							if(time==0){
								capBool=false;
								clearInterval(timerInterval);
								cpaBtn.removeClass('btn-disabled').text('再次发送验证码');
							}
						},1000);
					}else if(data.status==0){
						errorDom.text('需要登录哦，亲');
						//提醒用户登录
						login.init({
						    type:'login'
						});
					}else if(data.status==-2){
						errorDom.text('手机号已经绑定，请更换手机号');
					}else if(data.status==-4){
						errorDom.text('验证码发送过于频繁，请稍后再试');
					}
				},
				error:function(){
					errorDom.text('服务器正忙,请稍后再试');
				}
			});
		}
	});
	$('#confirmCheck').on("change",function(){
		var obj=$(this);
		if(obj.prop('checked')==true){
			$('.confrimError').addClass('hidden');
		}
	});
	var triExpand=$(".confirm-contract .tri-expand");
	$(".confirm-contract .tri-drop").on('mouseenter',function(){
		triExpand.removeClass('hidden');
		$('.confrimError').addClass('hidden');
	});
	triExpand.on('mouseleave',function(){
		triExpand.addClass('hidden');
	});
	//提交按钮
	$(".input-submit-main").on('click',function(e){
		e.preventDefault();
		var isChecked=$("#confirmCheck");
		if(isChecked.prop('checked')!=true){
			$('.confrimError').removeClass('hidden');
			return false;
		}
		var isValidate=true;
		//验证性别是否勾选
		var checkDomWrap=$("#js-sex");
		var checkDom=checkDomWrap.find('.input-radio-check');
		if(checkDom.length==0){
			checkDomWrap.find('.form-error').text('请选择性别');
			isValidate=false;
		}
		//检查是不是外国友人
		var reg=/^[A-Za-z]+$/;
		var tempName=$('[name=cname]').val();
		if(reg.test(tempName)){
			//是外国友人
			if(card_type==1){
				$(".drop-card").next().text('证件类型必须为护照');
			}
		}
		var formCheckItem=$(".form-item").find('[data-check]');
		formCheckItem.each(function(){
			var obj=$(this);
			var singleValidate=validate(obj);
			if(singleValidate==false){
				isValidate=false;
			}
		});
		if(!!isValidate&&!iframeObj.islock()){
			bday=dropBday.getGroupval('-');
			// if(bday=="1900-01-01"){
			// 	$("#error-bday").removeClass('hidden');
			// 	return false;
			// }
			var totalAddress=dropAddress.getGroupval('-')+'-'+$("#inputAddress").val();
			//开始组建表单数据准备提交
			var obj={
				isgroup:isgroup,
				sex:sex,
				card_type:card_type,
				photo:photo,
				bday:bday,
				address:totalAddress
			}
			var objStr=$.param(obj);
			var formObj=$("#person-info").serialize();
			var submitStr=formObj+'&'+objStr;
			loader.ajax({
				url:urls['interface']['sign'],
				data:submitStr,
				success:function(data){
					//注册成功，最好使用modal框
					var status=data.status;
					//console.log(status);
					switch(status){
						case '1':
						//执行跳转的逻辑,跳转个人中心
						if(!!isClient){
							window.location=urls['redirect']['usercenter']+'?from=clt';
						}else{
							window.location=urls['redirect']['oneSingTab'];
						}
						case '-8':
						$("#err_default").text('当前注册人数过多，请稍后再试');
						//进入成功逻辑
						case '-1':
						case '-14':
						//手机验证码错误
						$("#error-mobile").text('手机验证码错误');
						break;
						case '-2':
						//真实的中文名不符合中文格式
						$("#err_default").text('姓名为英文证件类型必须是护照');
						break;
						case '-10':
						$("#card_num").text('证件号已经被注册');
						break;
						case '-5':
						$("#err_default").text('该用户已经报名');
						break;
						case '-9':
						$("#error-pnum").text('该手机号已经被绑定');
						break;
					}
				},
				error:function(){
					alert('当前注册人数过多，请稍后再试');
				}
			});
		}
	});
});
