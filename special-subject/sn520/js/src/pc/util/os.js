/*
 * @author  Zhan Wang
 * @date    2016/5/7 14:51
 * @email   ijingzhan@gmail.com
 * @info    
 *
 */


define(function (require) {
    var ua = navigator.userAgent,
        isWindowsPhone = /(?:Windows Phone)/gi.test(ua),
        isSymbian = /(?:SymbianOS)/gi.test(ua) || isWindowsPhone,
        isAndroid = /(?:Android)/gi.test(ua), isFireFox = /(?:Firefox)/gi.test(ua),
        isChrome = /(?:Chrome|CriOS)/gi.test(ua),
        isTablet = /(?:iPad|PlayBook)/gi.test(ua) || (isAndroid && !/(?:Mobile)/gi.test(ua)) || (isFireFox && /(?:Tablet)/gi.test(ua)),
        isPhone = /(?:iPhone)/gi.test(ua) && !isTablet,
        isiPad = /iPad/gi.test(ua),
        isPc = !isPhone && !isAndroid && !isSymbian && !isTablet && !isWindowsPhone;
    
    return {isTablet: isTablet, isPhone: isPhone, isAndroid: isAndroid, isPc: isPc, isiPad: isiPad};
});
 
 
 