"use strict";
!function () {

}();

var e = {
    init: function () {
        e.aosFunc();


    },

    isVariableDefined: function (el) {
        return typeof !!el && (el) != 'undefined' && el != null;
    },

    select: function (selectors) {
        return document.querySelector(selectors);
    },

    // START: 08 AOS Animation
    aosFunc: function () {
        var aos = e.select('.aos');
        if (e.isVariableDefined(aos)) {
            AOS.init({
                duration: 500,
                easing: 'ease-out-quart',
                once: true
            });
        }
    },
    // END: AOS Animation


};
e.init();
