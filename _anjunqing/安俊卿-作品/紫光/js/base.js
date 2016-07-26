/* 
* @Author: Administrator
* @Date:   2016-03-08 20:07:39
* @Last Modified by:   奥特M的小怪S
* @Last Modified time: 2016-03-31 18:35:49
*/

 $(function() {
    $('li.mr0').css('margin-right', 0);
    var top1=$('.top')
    var nav=$('.nav');

    var postop=$('.postop');
    $(window).scroll(function(event) {
         //吸附导航
        // if ($(window).scrollTop()>35) {
          
        //     nav.addClass('current')
        // }else{
        //     nav.removeClass('current')
        // };
        //极速回顶部
        if ($(window).scrollTop()>=$(window).height()) {
        postop.show();
        } else{
        postop.hide();
        };
    });


  // 解决方案自动轮播
  
    var myMarginLeft=0;
    var CshemeUl=$('.cshemein-ul');


    var timer;
    var fangXiang='left';

        function leftFn(){

                //更改方向
                fangXiang='left';
                //myMarginLeft在不断变小
                myMarginLeft=myMarginLeft-1;

                //-1200
                //如果一个轮回走完了，要回到轮回开始的地方
                //极值是-1200，因为要让四个小丫头都能走到最左边
                if(myMarginLeft<=-2080){
                    myMarginLeft=0;
                }

                CshemeUl.css('margin-left', myMarginLeft);

        }
        function rightFn(){

                //更改方向
                fangXiang='right';
                //myMarginLeft在不断变大
                myMarginLeft=myMarginLeft+1;
                //一旦加了，就会露出破绽，所以要回到轮回结束（第4个小丫头完全进去的位置）的地方
                if(myMarginLeft>0){
                    myMarginLeft=-2080;
                }
                CshemeUl.css('margin-left', myMarginLeft);

        }

        // 自动滑动
        timer=setInterval(leftFn, 30);
        // 获取左按钮
        //单击右按钮，调用往右走功能
        var aLi=$('.cshemein-ul li');
        // 鼠标移入列表时候停止自动滑动
            aLi.hover(function() {
                
                //停止定时器，并且突出展示
                clearInterval(timer);
                // $(this).stop().fadeTo('slow',1);
                // $(this).siblings().stop().fadeTo('slow',0.5);

            }, function() {

                //先清空，再重启
                clearInterval(timer);

                //重启的时候，要进行判断，如果当前方向是左，调用leftFn；
                //如果当前方向是右，调用rightFn
                if(fangXiang=='left'){
                    timer=setInterval(leftFn, 30);
                }else{
                    timer=setInterval(rightFn, 30);
                }
                
                // aLi.stop().fadeTo('slow',1);
                
            });


            //单击右按钮，调用往右走功能
            var rightBtn=$('.r');
            rightBtn.click(function(event) {
                //先停止往左走的功能：停止定时器
                clearInterval(timer);
                //再重启，并且调用往右走功能
                //记得一定再用timer存储一下，因为下一次可能还要停止
                timer=setInterval(rightFn, 30);
            });

            //单击左按钮，调用往左走功能
            var leftBtn=$('.l');
            leftBtn.click(function(event) {
                //先停止往右走的功能：停止定时器
                clearInterval(timer);
                //再重启，并且调用往左走功能
                //记得一定再用timer存储一下，因为下一次可能还要停止
                timer=setInterval(leftFn, 30);
            });





});        