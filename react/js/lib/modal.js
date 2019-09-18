var modalFactory = require('boron/modalFactory');
var insertKeyframesRule = require('domkit/insertKeyframesRule');
var appendVendorPrefix = require('domkit/appendVendorPrefix');

var animation = {
    show: {
        animationDuration: '0s',
        animationTimingFunction: 'cubic-bezier(0.6,0,0.4,1)'
    },
    hide: {
        animationDuration: '0s',
        animationTimingFunction: 'ease-out'
    },
    showContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0,
            transform: 'scale3d(0, 0, 1)'
        },
        '100%': {
            opacity: 1,
            transform: 'scale3d(1, 1, 1)'
        }
    }),

    hideContentAnimation: insertKeyframesRule({
        '0%': {
            opacity: 1
        },
        '100%': {
            opacity: 0,
            transform: 'scale3d(0.5, 0.5, 1)'
        }
    }),

    showBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0
        },
        '100%': {
            opacity: 0.9
        },
    }),

    hideBackdropAnimation: insertKeyframesRule({
        '0%': {
            opacity: 0.9
        },
        '100%': {
            opacity: 0
        }
    })
};

var showAnimation = animation.show;
var hideAnimation = animation.hide;
var showContentAnimation = animation.showContentAnimation;
var hideContentAnimation = animation.hideContentAnimation;
var showBackdropAnimation = animation.showBackdropAnimation;
var hideBackdropAnimation = animation.hideBackdropAnimation;

const factory = modalFactory({
    getRef: function(willHidden) {
        return 'content';
    },
    getModalStyle: function(willHidden) {
        return appendVendorPrefix({
            zIndex: 1050,
            position: "fixed",
            width: "500px",
            transform: "translate3d(-50%, -50%, 0)",
            top: "50%",
            left: "50%"
        })
    },
    getBackdropStyle: function(willHidden) {
        return appendVendorPrefix({
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            zIndex: 1040,
            backgroundColor: "#373A47",
            animationFillMode: 'forwards',
            animationDuration: '0s',
            animationName: willHidden ? hideBackdropAnimation : showBackdropAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        });
    },
    getContentStyle: function(willHidden) {
        return appendVendorPrefix({
            margin: 0,
            backgroundColor: "white",
            animationDuration: (willHidden ? hideAnimation : showAnimation).animationDuration,
            animationFillMode: 'forwards',
            animationName: willHidden ? hideContentAnimation : showContentAnimation,
            animationTimingFunction: (willHidden ? hideAnimation : showAnimation).animationTimingFunction
        })
    }
});

export const defaultModalStyle = {
    width: '80%',
    maxWidth: '1200px',
    scrollX: 'auto',
    overflow: 'scroll',
    maxHeight: '100%'

};
export default factory;
