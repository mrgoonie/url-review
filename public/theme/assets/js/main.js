/*=== Javascript function indexing hear===========

01.gsapAnimationImageRevel();
02.gsapScrollingText();
03.gsapAnimationImageScale();
04.serviceHoverImageRevel();
05.imageParalax();
06.swiperActivation();
07.tiltAnimation();
08.wowActive();
09.progressAvtivation();
10.counterUp();
11.radialProgress();
12.titleSkewUp();
13.scrollDiwnCircle();
14.bannerBgVideo();
15.textTitleAnimation__1();
16.counterJumpanimation();
17.featureJumpanimation();
18.paragraphBodyAnimation();
19.slideUpSkew();
20.slideUp();
21.slideLeft();
22.slideRight();
23.buttonMoveAnimation();
24.teamAnimation();
25.showRightRevel();
26.caseVarticleScroll();
27.titleOpacityWrap();
28.magicCoursor();
29.portfolioTenSwiper();
30.offcanvasMenu();
31.preloaderWithBannerActivation();
32.isotopeMasonry();
33.stickySidebar();
34.backToTopInit();
35.stickyHeader();
36.countDown();
37.rollingText();

==================================================*/

(function ($) {
    'use strict';
    let device_width = window.innerWidth;
    $.exists = function (selector) {
      return $(selector).length > 0;
    };
  
    gsap.registerPlugin(ScrollTrigger, SplitText);
  
    var rtsJs = {
      m: function (e) {
        rtsJs.d();
        rtsJs.methods();
      },
      d: function (e) {
        this._window = $(window),
          this._document = $(document),
          this._body = $('body'),
          this._html = $('html')
      },
      methods: function (e) {
        rtsJs.swiperActivation();
        rtsJs.wowActive();
        rtsJs.videoActivation();
        rtsJs.counterUp();
        rtsJs.backToTopInit();
        rtsJs.stickyHeader();
        rtsJs.stickySidebar();
        rtsJs.title_animation();
        rtsJs.skew_up();
        rtsJs.gsapAnimationImageScale();
        rtsJs.feedbackCollupsShow();
        rtsJs.imageSlideGsap();
        rtsJs.imageParalax();
        rtsJs.sideMenu();
        rtsJs.metismenu();
        rtsJs.preloader();
      },
  
      swiperActivation: function(){
        $(document).ready(function(){
            var swiper = new Swiper(".mySwiper-testimonials-one", {
                slidesPerView: 3.7,
                spaceBetween: 48,
                pagination: {
                  el: ".swiper-pagination",
                  clickable: true,
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                },
                loop:true,
                breakpoints: {
                  1200: {
                    slidesPerView: 3,
                  },
                  900: {
                    slidesPerView:2,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  580: {
                    slidesPerView: 1,
                  },
                  0: {
                    slidesPerView: 1,
                  }
                },
            });
        })
        $(document).ready(function(){
            var swiper = new Swiper(".mySwiper-service-2", {
                slidesPerView: 3,
                spaceBetween: 48,
                pagination: {
                  el: ".swiper-pagination",
                  clickable: true,
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                },
                loop:true,
                breakpoints: {
                  1200: {
                    slidesPerView: 3,
                  },
                  900: {
                    slidesPerView:2,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  580: {
                    slidesPerView: 1,
                  },
                  0: {
                    slidesPerView: 1,
                  }
                },
            });
        })
        $(document).ready(function(){
            var swiper = new Swiper(".mySwiper-testimonials-3", {
                slidesPerView: 3,
                spaceBetween: 48,
                pagination: {
                  el: ".swiper-pagination",
                  clickable: true,
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                },
                loop:true,
                breakpoints: {
                  1200: {
                    slidesPerView: 3,
                  },
                  900: {
                    slidesPerView:2,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  580: {
                    slidesPerView: 1,
                  },
                  0: {
                    slidesPerView: 1,
                  }
                },
            });
        })
        $(document).ready(function(){
            var swiper = new Swiper(".mySwiper-case-4", {
                slidesPerView: 3.7,
                spaceBetween: 48,
                pagination: {
                  el: ".swiper-pagination",
                  clickable: true,
                },
                navigation: {
                    nextEl: ".swiper-button-next",
                    prevEl: ".swiper-button-prev",
                },
                loop:true,
                breakpoints: {
                  1200: {
                    slidesPerView: 3.7,
                  },
                  991: {
                    slidesPerView: 2.5,
                  },
                  768: {
                    slidesPerView: 2,
                  },
                  580: {
                    slidesPerView: 2,
                  },
                  0: {
                    slidesPerView: 1,
                  }
                },
            });
        })
        $(document).ready(function(){
            var swiper = new Swiper(".rts-brandSlider", {
              slidesPerView: 5,
              spaceBetween: 30,
              slidesPerGroup: 1,
              speed: 1000,
              loop: true,
              loopFillGroupWithBlank: true,
              centeredSlides: false,
              breakpoints: {
                1200: {
                  slidesPerView: 5,
                },
                900: {
                  slidesPerView: 5,
                },
                768: {
                  slidesPerView: 3,
                },
                580: {
                  slidesPerView: 2,
                },
                0: {
                  slidesPerView: 1,
                }
              },
              autoplay: {
                delay: 2500,
                disableOnInteraction: false
              },
            });
        })
        $(document).ready(function(){
            var swiper = new Swiper(".rts-brandSlider-2", {
              slidesPerView: 4,
              spaceBetween: 30,
              slidesPerGroup: 1,
              speed: 1000,
              loop: true,
              loopFillGroupWithBlank: true,
              centeredSlides: false,
              breakpoints: {
                1200: {
                  slidesPerView: 4,
                },
                900: {
                  slidesPerView: 4,
                },
                768: {
                  slidesPerView: 3,
                },
                580: {
                  slidesPerView: 3,
                },
                450: {
                  slidesPerView: 2,
                },
                320: {
                  slidesPerView: 1,
                },
                0: {
                  slidesPerView: 1,
                }
              },
              autoplay: {
                delay: 2500,
                disableOnInteraction: false
              },
            });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-testimonial-six", {
              slidesPerView: 3.7,
              spaceBetween: 40,
              pagination: {
                el: ".swiper-pagination2",
                clickable: true,
              },
              navigation: {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
              },
              loop:true,
              breakpoints: {
                1200: {
                  slidesPerView: 3.7,
                },
                900: {
                  slidesPerView: 3,
                },
                768: {
                  slidesPerView: 2.5,
                },
                580: {
                  slidesPerView: 1.5,
                },
                0: {
                  slidesPerView: 1,
                }
              },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-service-five", {
              slidesPerView: 3.7,
              spaceBetween: 48,
              pagination: {
                el: ".swiper-pagination2",
                clickable: true,
              },
              navigation: {
                  nextEl: ".swiper-button-next",
                  prevEl: ".swiper-button-prev",
              },
              loop:true,
              breakpoints: {
                1200: {
                  slidesPerView: 3.7,
                },
                900: {
                  slidesPerView: 3,
                },
                768: {
                  slidesPerView: 2.5,
                },
                580: {
                  slidesPerView: 1.5,
                },
                0: {
                  slidesPerView: 1,
                }
              },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-testimonials-7", {
            slidesPerView: 3,
            spaceBetween: 30,
            loop: true,
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            breakpoints: {
              1200: {
                slidesPerView: 3,
              },
              1024: {
                slidesPerView: 3,
              },
              768: {
                slidesPerView: 2,
              },
              580: {
                slidesPerView: 1,
              },
              0: {
                slidesPerView: 1,
              }
            },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-testimonials-8", {
            slidesPerView: 1,
            spaceBetween: 0,
            loop: true,
            navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
          },
          pagination: {
            el: ".swiper-pagination",
            clickable: true,
          },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-blog", {
            slidesPerView: 3,
            spaceBetween: 48,
            loop: true,
            navigation: {
              nextEl: ".swiper-button-next",
              prevEl: ".swiper-button-prev",
            },
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            breakpoints: {
              1200: {
                slidesPerView: 3,
              },
              900: {
                slidesPerView: 3,
                spaceBetween: 30,
              },
              768: {
                slidesPerView: 2,
                spaceBetween: 30,
              },
              650: {
                slidesPerView: 2,
              },
              0: {
                slidesPerView: 1,
              }
            },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-brand-1", {
            slidesPerView: 5,
            spaceBetween: 40,
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            loop:true,
            autoplay: {
              delay: 2500,
              disableOnInteraction: true,
            },
            breakpoints: {
              1200: {
                slidesPerView: 5,
              },
              900: {
                slidesPerView: 4,
              },
              768: {
                slidesPerView: 3,
              },
              580: {
                slidesPerView: 3,
              },
              0: {
                slidesPerView: 2,
              }
            },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-brand-2", {
            slidesPerView: 5,
            spaceBetween: 40,
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            loop:true,
            autoplay: {
              delay: 2500,
              disableOnInteraction: true,
            },
            breakpoints: {
              1200: {
                slidesPerView: 5,
              },
              900: {
                slidesPerView: 4,
              },
              768: {
                slidesPerView: 3,
              },
              580: {
                slidesPerView: 2,
              },
              360: {
                slidesPerView: 2,
              },
              0: {
                slidesPerView: 1,
              }
            },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-brand-3", {
            slidesPerView: 5,
            spaceBetween: 40,
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            loop:true,
            autoplay: {
              delay: 2500,
              disableOnInteraction: true,
            },
            breakpoints: {
              1200: {
                slidesPerView: 5,
              },
              900: {
                slidesPerView: 4,
              },
              768: {
                slidesPerView: 3,
              },
              580: {
                slidesPerView: 2,
              },
              360: {
                slidesPerView: 2,
              },
              0: {
                slidesPerView: 1,
              }
            },
          });
        })
        $(document).ready(function(){
          var swiper = new Swiper(".mySwiper-brand-about", {
            slidesPerView: 5,
            spaceBetween: 40,
            pagination: {
              el: ".swiper-pagination",
              clickable: true,
            },
            loop:true,
            autoplay: {
              delay: 2500,
              disableOnInteraction: true,
            },
            breakpoints: {
              1200: {
                slidesPerView: 5,
              },
              900: {
                slidesPerView: 4,
              },
              768: {
                slidesPerView: 3,
              },
              580: {
                slidesPerView: 2,
              },
              360: {
                slidesPerView: 2,
              },
              0: {
                slidesPerView: 1,
              }
            },
          });
        })
      },
      

      wowActive: function () {
        new WOW().init();
      },

      videoActivation: function (e) {
        $(document).ready(function(){
          $('.popup-youtube, .popup-video').magnificPopup({
            disableOn: 700,
            type: 'iframe',
            mainClass: 'mfp-fade',
            removalDelay: 160,
            preloader: false,
            fixedContentPos: false
          });
        });
      },
      preloader:function(){
        window.addEventListener('load',function(){
          document.querySelector('body').classList.add("loaded")  
        });          
    },
      stickySidebar: function (e) {
        // stickySidebar
    if (typeof $.fn.theiaStickySidebar !== "undefined") {
      $(".sticky-coloum-wrap .sticky-coloum-item").theiaStickySidebar({
        additionalMarginTop: 130,
      });
    }
      },

      counterUp: function (e) {
        $('.counter').counterUp({
          delay: 10,
          time: 1000
        });
        $('.counter').addClass('animated fadeInDownBig');
        $('h3').addClass('animated fadeIn');
      },
    // BACK TO TOP BUTTON JS
      backToTopInit: function () {
        $(document).ready(function(){
        "use strict";
    
        var progressPath = document.querySelector('.progress-wrap path');
        var pathLength = progressPath.getTotalLength();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
        progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
        progressPath.style.strokeDashoffset = pathLength;
        progressPath.getBoundingClientRect();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';		
        var updateProgress = function () {
          var scroll = $(window).scrollTop();
          var height = $(document).height() - $(window).height();
          var progress = pathLength - (scroll * pathLength / height);
          progressPath.style.strokeDashoffset = progress;
        }
        updateProgress();
        $(window).scroll(updateProgress);	
        var offset = 50;
        var duration = 550;
        jQuery(window).on('scroll', function() {
          if (jQuery(this).scrollTop() > offset) {
            jQuery('.progress-wrap').addClass('active-progress');
            jQuery('.rts-switcher').addClass('btt__visible');
          } else {
            jQuery('.progress-wrap').removeClass('active-progress');
            jQuery('.rts-switcher').removeClass('btt__visible');
          }
        });				
        jQuery('.progress-wrap').on('click', function(event) {
          event.preventDefault();
          jQuery('html, body').animate({scrollTop: 0}, duration);
          return false;
        })
        
        
      }); 
  
      },
      // sticky header activation
      stickyHeader: function (e) {
        $(window).scroll(function () {
            if ($(this).scrollTop() > 150) {
                $('.header--sticky').addClass('sticky')
            } else {
                $('.header--sticky').removeClass('sticky')
            }
        })
      },

      title_animation : function(){

        gsap.registerPlugin(ScrollTrigger);
        gsap.registerPlugin(SplitText);
        if (window.innerWidth > 768) {
        $(document).ready(function(){
          let addAnimation = function () {
            $(".split-collab").each(function (index) {
              const textInstance = $(this);
              const text = new SplitText(textInstance, {
                type: "chars",
              });
          
              let letters = text.chars;
          
              let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: textInstance,
                  start: "top 85%",
                  end: "top 85%",
                  onComplete: function () {
                    textInstance.removeClass(".split-collab");
                  }
                }
              });
          
              tl.set(textInstance, { opacity: 1 }).from(letters, {
                duration: .5,
                autoAlpha: 0,
                x: 50,
                // scaleY: 0,
                // skewX: 50,
                stagger: { amount: 1 },
                ease: "back.out(1)"
              });
            });
          };
          
          addAnimation();
          
          window.addEventListener("resize", function (event) {
            if ($(window).width() >= 992) {
              addAnimation();
            }
          });

        });
      }

      },

      skew_up: function(){
        gsap.registerPlugin(SplitText);
        if (window.innerWidth > 768) {
       
        $(document).ready(function(){
          let addAnimation = function () {
            $(".skew-up").each(function (index) {
              const text = new SplitType($(this), {
                types: "lines, words",
                lineClass: "word-line"
              });    let textInstance = $(this);
              let line = textInstance.find(".word-line");
              let word = line.find(".word");    let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: textInstance,
                  start: "top 85%",
                  end: "top 85%",
                  onComplete: function () {
                    $(textInstance).removeClass("skew-up");
                  }
                }
              });    
              tl.set(textInstance, { opacity: 1 }).from(word, {
                y: "100%",
                skewX: "-5",
                duration: 2,
                stagger: 0.09,
                ease: "expo.out"
              });
            });
           };
           addAnimation();window.addEventListener("resize", function (event) {
              if ($(window).width() >= 992) {addAnimation(); }
           });
        });
      }


      if (window.innerWidth > 768) {
        $(document).ready(function(){
          let addAnimation = function () {
            $(".skew-up-2").each(function (index) {
              const textInstance = $(this);
              const text = new SplitText(textInstance, {
                type: "chars",
              });
          
              let letters = text.chars;
          
              let tl = gsap.timeline({
                scrollTrigger: {
                  trigger: textInstance,
                  start: "top 85%",
                  end: "top 85%",
                  onComplete: function () {
                    textInstance.removeClass("skew-up-2");
                  }
                }
              });
          
              tl.set(textInstance, { opacity: 1 }).from(letters, {
                duration: .4,
                autoAlpha: 0,
                y: 50,
                // scaleX: 0,
                // skewX: 50,
                stagger: { amount: 1 },
                ease: "back.out(0)"
              });
            });
          };
          
          addAnimation();
          
          window.addEventListener("resize", function (event) {
            if ($(window).width() >= 992) {
              addAnimation();
            }
          });

        });
      }

      },
      gsapAnimationImageScale: function (e) {
        $(document).ready(function () {
  
          let growActive = document.getElementsByClassName('grow');
          if (growActive.length) {
            const growTl = gsap.timeline({
              scrollTrigger: {
                trigger: ".grow",
                scrub: 1,
                start: "top center",
                end: "+=1000",
                ease: "power1.out"
              }
            });
            growTl.to(".grow", {
              duration: 1,
              scale: 1
            });
          }
  
        });
  
      },
      feedbackCollupsShow: function(){

        // feedback button click show start
        document.addEventListener('DOMContentLoaded', function() {
          var rtsBtn = document.querySelector('.button-area-box-shadow .rts-btn');
          var overlaySection = document.querySelector('.overlay-bottom-section');
          var isToggled = false;
  
          if (rtsBtn && overlaySection) {
              rtsBtn.addEventListener('click', function() {
                  if (!isToggled) {
                      // Change margin of .rts-btn
                      rtsBtn.style.margin = '0px auto 0 auto';
                      rtsBtn.innerHTML= 'View less feedbacks';
                      // Remove the overlay-bottom-section class
                      overlaySection.classList.remove('overlay-bottom-section');
                  } else {
                      // Revert margin of .rts-btn
                      rtsBtn.style.margin = '';
                      rtsBtn.innerHTML= 'View all feedbacks';
                      
                      // Add the overlay-bottom-section class back
                      overlaySection.classList.add('overlay-bottom-section');
                  }
                  
                  // Toggle the state
                  isToggled = !isToggled;
              });
          }
      });
      // feedback button click show End
      },

      // image slide gsap
      imageSlideGsap: function () {
        gsap.to(".images", {
          scrollTrigger:{
            // trigger: ".images",
            start: "top bottom", 
            end: "bottom top", 
            scrub: 1,
            // markers: true
          },
          x: 330,
        })
        gsap.to(".images-2", {
          scrollTrigger:{
            // trigger: ".images",
            start: "top bottom", 
            end: "bottom top", 
            scrub: 1,
            // markers: truesw
          },
          y: 330,
        })       
      },

      imageParalax: function () {

        $(document).ready(function(){
          let paralax = document.getElementsByClassName('anim-image-parallax');
          if (paralax.length) {
            $(".anim-image-parallax").each(function () {
    
              // Add wrap <div>.
              $(this).wrap('<div class="anim-image-parallax-wrap"><div class="anim-image-parallax-inner"></div></div>');
    
              // Add overflow hidden.
              $(".anim-image-parallax-wrap").css({
                "overflow": "hidden"
              });
    
              var $animImageParallax = $(this);
              var $aipWrap = $animImageParallax.parents(".anim-image-parallax-wrap");
              var $aipInner = $aipWrap.find(".anim-image-parallax-inner");
    
              // Parallax
              gsap.to($animImageParallax, {
                yPercent: 80,
                ease: "none",
                scrollTrigger: {
                  trigger: $aipWrap,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                  markers: false,
                },
              });
    
              // Zoom in
              let tl_aipZoomIn = gsap.timeline({
                scrollTrigger: {
                  trigger: $aipWrap,
                  start: "top 90%",
                  markers: false,
                }
              });
              tl_aipZoomIn.from($aipInner, {
                duration: 1.5,
                autoAlpha: 0,
                scale: 1.4,
                ease: Power2.easeOut,
                clearProps: "all"
              });
    
            });
          };
        })
        
        $(document).ready(function(){
          let paralax = document.getElementsByClassName('anim-image-parallax-2');
          if (paralax.length) {
            $(".anim-image-parallax-2").each(function () {
              // Add wrap <div>.
              $(this).wrap('<div class="anim-image-parallax-wrap"><div class="anim-image-parallax-inner"></div></div>');
    
              // Add overflow hidden.
              $(".anim-image-parallax-wrap").css({
                "overflow": "hidden"
              });    
              var $animImageParallax = $(this);
              var $aipWrap = $animImageParallax.parents(".anim-image-parallax-wrap");
              var $aipInner = $aipWrap.find(".anim-image-parallax-inner");
    
              // Parallax
              gsap.to($animImageParallax, {
                yPercent: 20,
                ease: "none",
                scrollTrigger: {
                  trigger: $aipWrap,
                  start: "top bottom",
                  end: "bottom top",
                  scrub: true,
                  markers: false,
                },
              });
    
              // Zoom in
              let tl_aipZoomIn = gsap.timeline({
                scrollTrigger: {
                  trigger: $aipWrap,
                  start: "top 90%",
                  markers: false,
                }
              });
              tl_aipZoomIn.from($aipInner, {
                duration: 1.5,
                autoAlpha: 0,
                scale: 1.4,
                ease: Power2.easeOut,
                clearProps: "all"
              });
    
            });
          };
        })

  
      },

      // side menu desktop
      sideMenu:function(){
        $(document).on('click', '#menu-btn', function () {
          $("#side-bar").addClass("show");
          $("#anywhere-home").addClass("bgshow");
        });
        $(document).on('click', '.close-icon-menu', function () {
          $("#side-bar").removeClass("show");
          $("#anywhere-home").removeClass("bgshow");
        });
        $(document).on('click', '#anywhere-home', function () {
          $("#side-bar").removeClass("show");
          $("#anywhere-home").removeClass("bgshow");
        });
        $(document).on('click', '.onepage .mainmenu li a', function () {
          $("#side-bar").removeClass("show");
          $("#anywhere-home").removeClass("bgshow");
        });
      },

      metismenu:function(){
        $('#mobile-menu-active').metisMenu();
      },  
    }
    rtsJs.m(); 

    $(document).ready(function() {
      // Listen for the collapse show event
      $('.working-process-accordion-one .accordion-collapse').on('show.bs.collapse', function () {
        // Find the parent .accordion-item and add the 'show' class
        $(this).closest('.accordion-item').addClass('show');
      });
    
      // Listen for the collapse hide event
      $('.working-process-accordion-one .accordion-collapse').on('hide.bs.collapse', function () {
        // Find the parent .accordion-item and remove the 'show' class
        $(this).closest('.accordion-item').removeClass('show');
      });
      // THEME MODE SWITCHER JS
    var rts_light = $('.rts-dark-light');
    if(rts_light.length){
    var toggle = document.getElementById("rts-data-toggle");
    var storedTheme = localStorage.getItem('fluxi-theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (storedTheme)
        document.documentElement.setAttribute('data-theme', storedTheme)
        toggle.onclick = function() {
        var currentTheme = document.documentElement.getAttribute("data-theme");
        var targetTheme = "light";

        if (currentTheme === "light") {
            targetTheme = "dark";
        }
        document.documentElement.setAttribute('data-theme', targetTheme)
        localStorage.setItem('fluxi-theme', targetTheme);
      };
    }
    });

    
  
  })(jQuery, window)  