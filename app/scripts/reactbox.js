/*
=================================
reactbox - v0.1
http://github.com/rogeriochaves/reactbox

(c) 2013 Rogério Chaves
This code may be freely distributed under the MIT License
=================================
*/

(function($){

	var template = '														\
		<div id="reactbox-fade"></div>										\
		<div id="reactbox-lightbox">										\
			<div class="reactbox-loading"><span>Carregando...</span></div>	\
			<div class="contents">											\
				<img src="{{href}}" class="reactbox-image" />				\
			</div>															\
		</div>																\
		<div id="reactbox-close">x</div>									\
		<div id="reactbox-arrows">											\
			<div class="arrow arrow-next">&gt;</div>						\
			<div class="arrow arrow-prev">&lt;</div>						\
		</div>																\
	';

	window.addEventListener("MSPointerDown", function(){
		e.preventDefault();
	}, false);
	window.addEventListener("MSPointerMove", function(){
		e.preventDefault();
	}, false);
	window.addEventListener("MSPointerUp", function(){
		e.preventDefault();
	}, false);

	$.fn.reactbox = function(opts) {
		var gallery = $(this);
		var open = false;
		var loaded = {};
		var fade, lightbox, image, canvas, target, gesturableImg, initialized;
		var w = $(window).width();
		var h = $(window).height();
		var smallDevice = (w <= 480);
		var defaults = {
			type: "image",
			href: null,
			maxWidth: null,
			maxHeight: null
		};
		opts = jQuery.extend(defaults, opts);

		this.click(function(e){
			e.preventDefault(); 

			// Seta a lightbox
			removeReactbox();
			target = $(this);
			opts.href = target.attr('href');
			$('body').append(Mustache.to_html(template, opts));
			fade = $('#reactbox-fade');
			lightbox = $('#reactbox-lightbox');
			image = $('#reactbox-lightbox .reactbox-image');
			loading = $('#reactbox-lightbox .reactbox-loading');
			arrows = $('#reactbox-arrows');
			buttonClose = $('#reactbox-close');
			initialized = false;

			if(gallery.length > 1){
				smallDevice ? arrows.show() : arrows.fadeIn();
			}else{
				arrows.hide();
			}
			

			if(smallDevice){
				buttonClose.show();
				fade.css({opacity: 0.5}).show();
				lightbox.css({opacity: 1}).show();
				if($('#reactbox-wrapper').length === 0){
					$('<div />', { id: 'reactbox-wrapper' }).appendTo('body');
					$('body').children().append($('#reactbox-wrapper'));
				}
			}else{
				buttonClose.fadeIn();
				fade.css({opacity: 0}).show().animate({opacity: 0.5}, 300);
				lightbox.css({opacity: 0}).show().animate({opacity: 1}, 300);
			}

			image.hide();
			onResize();
			loadImage();
		});

		function openImage(){
			// Abre a lightbox
			loading.hide();
			image.show();
			addListeners();

			// Define o tamanho real da imagem
			image.attr('src', opts.href);
			image.load(function(){
				image.css({position: 'fixed', width: 'auto', height: 'auto'});
				opts.maxWidth = image.width();
				opts.maxHeight = image.height();
				image.css({position: 'static'});

				open = true;
				onResize();
				if(!initialized && !smallDevice){
					if(target.children('img').length == 1){
						var targetImg = target.children('img:first');
						var bounds = [image.width(), image.height(), lightbox.offset().top, lightbox.offset().left];
						image.css({width: targetImg.width(), height: targetImg.height() });
						lightbox.css({top: targetImg.offset().top, left: targetImg.offset().left});
						image.animate({width: bounds[0], height: bounds[1]}, 500);
						lightbox.stop().css({opacity: 1}).animate({top: bounds[2], left: bounds[3]}, 500);
					}else{
						image.hide();
						image.fadeIn();
					}
				}
				initialized = true;
			});
		}

		function loadImage(){
			if(loaded[opts.href]){
				openImage();
			}else{
				$.get(opts.href, function(){
					loaded[opts.href] = true;
					openImage();
				}).error(function(){
					fade.click(closeReactbox);
					loading.html("Um erro ocorreu ao tentar carregar a imagem");
					onResize();
				});
			}
		}

		function addListeners(){
			if(initialized) return;
			$(window).resize(onResize);
			fade.click(closeReactbox);
			buttonClose.click(closeReactbox);
			arrows.find('.arrow').click(nextPrevItem);
		}

		function removeReactbox(){
			$('#reactbox-wrapper').children().appendTo($('body'));
			$('#reactbox-wrapper').remove();
			$('#reactbox-fade, #reactbox-lightbox, #reactbox-arrows, #reactbox-close').remove();
			fade = null; lightbox = null; image = null; canvas = null; target = null;
			open = false;
			if(gesturableImg) gesturableImg.remove();
			gesturableImg = null;
			$(window).unbind('resize', onResize);
		}

		function closeReactbox(){
			if(!smallDevice && target.children('img').length == 1){
				var targetImg = target.children('img:first');
				var bounds = [targetImg.width(), targetImg.height(), targetImg.offset().top, targetImg.offset().left];

				buttonClose.fadeOut();
				arrows.fadeOut();
				fade.animate({opacity: 0}, 300);
				image.animate({width: bounds[0], height: bounds[1]}, 500);
				lightbox.animate({top: bounds[2], left: bounds[3]}, 500, function(){
					lightbox.animate({opacity: 0}, 300, removeReactbox);
				});
			}else{
				if(smallDevice){
					fade.css({opacity: 0});
					lightbox.css({opacity: 0});
					arrows.hide();
					removeReactbox();
				}else{
					fade.animate({opacity: 0}, 300);
					arrows.fadeOut();
					lightbox.animate({opacity: 0}, 300, removeReactbox);
				}
			}
		}

		function nextPrevItem(){
			var next;
			var current = gallery.index(target);
			if($(this).hasClass('arrow-prev')){
				next = gallery.eq(current - 1); 
				if(next.length == 0){
					next = gallery.eq(-1); 
				}
			}else{
				next = gallery.eq(current + 1); 
				if(next.length == 0){
					next = gallery.eq(0); 
				}
			}
			target = next;
			opts.href = target.attr('href');
			if(!loaded[opts.href]) loading.show();
			loadImage();
		}

		function onResize(){
			w = $(window).width();
			h = $(window).height();
			smallDevice = (w <= 480);
			if(smallDevice){
				lightbox.css({width: '100%', height: '100%', top: 0, left: 0});
				$('#reactbox-wrapper').css({overflow: 'hidden', width: w, height: h, position: 'absolute', top:0, left: 0});

				if(open && opts.maxWidth && opts.maxHeight){
					image.hide();
					if(canvas) canvas.remove();
					lightbox.append('<canvas id="reactbox-canvas" style="width: 100%; height: 100%"></canvas>');
					canvas = lightbox.find('canvas');
					if(gesturableImg) gesturableImg.remove();
					gesturableImg = new ImgTouchCanvas({
			            canvas: document.getElementById('reactbox-canvas'),
			            path: image.attr('src'),
			            desktop: true
			        });
				}
			}else{
				if(canvas){
					image.show();
					canvas.remove();
					canvas = null;
				}
				if(open && opts.maxWidth && opts.maxHeight && !isNaN(opts.maxWidth) && !isNaN(opts.maxHeight)){
					var imgHeight = h > opts.maxHeight ? opts.maxHeight : h;
					var imgWidth = w > opts.maxWidth ? opts.maxWidth : w;
					var proporcao = opts.maxWidth / opts.maxHeight;
					if(imgWidth / proporcao > imgHeight * proporcao){
						imgWidth = imgHeight * proporcao;
						if(imgWidth > w){
							imgWidth = w;
							imgHeight = imgWidth / proporcao;
						}
					}else{
						imgHeight = imgWidth / proporcao;
						if(imgHeight > h){
							imgHeight = h;
							imgWidth = imgHeight * proporcao;
						}
					}
					imgWidth -= 30;
					imgHeight -= 30;
					image.css({width: imgWidth, height: imgHeight});
				}

				lightbox.css({width: 'auto', height: 'auto'});
				var boxTop = h / 2 - (imgHeight || lightbox.height()) / 2;
				var boxLeft = w / 2 - (imgWidth || lightbox.width()) / 2;
				lightbox.css({top: boxTop, left: boxLeft});
			}
		}
	};

	

})(jQuery);