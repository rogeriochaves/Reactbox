(function($){

	var template = '														\
		<div id="reactbox-fade"></div>										\
		<div id="reactbox-lightbox">										\
			<div class="reactbox-close">x</div>								\
			<div class="reactbox-loading">Carregando...</div>				\
			<div class="contents">											\
				<img src="{{href}}" class="reactbox-image" />				\
			</div>															\
		</div>																\
	';

	$.fn.reactbox = function(opts) {
		var open = false;
		var fade, lightbox, image, canvas, target;//iframe;
		//var viewportmeta = document.querySelector('meta[name="viewport"]');
		var w = $(window).width();
		var h = $(window).height();
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
			remove_reactbox();
			target = $(this);
			opts.href = target.attr('href');
			$('body').append(Mustache.to_html(template, opts));
			fade = $('#reactbox-fade');
			lightbox = $('#reactbox-lightbox');
			image = $('#reactbox-lightbox .reactbox-image');
			loading = $('#reactbox-lightbox .reactbox-loading');
			close = $('#reactbox-lightbox .reactbox-close');

			fade.css({opacity: 0}).show().animate({opacity: 0.5}, 300);
			lightbox.css({opacity: 0}).show().animate({opacity: 1}, 300);
			image.hide();
			on_resize();
			$.get(opts.href, function(data){
				// Abre a lightbox
				loading.hide();
				image.show();
				fade.click(close_reactbox);
				close.click(close_reactbox);
				//lightbox.delegate('canvas', 'dblclick', dblclick_close);

				// Define o tamanho real da imagem
				image.css({position: 'fixed'});
				opts.maxWidth = image.width();
				opts.maxHeight = image.height();
				image.css({position: 'static'});

				open = true;
				$(window).resize(on_resize);
				on_resize();
				if(w > 480){
					if(target.children('img').length == 1){
						var targetImg = target.children('img:first');
						var bounds = [image.width(), image.height(), lightbox.offset().top, lightbox.offset().left]
						image.css({width: targetImg.width(), height: targetImg.height() });
						lightbox.css({top: targetImg.offset().top, left: targetImg.offset().left});
						image.animate({width: bounds[0], height: bounds[1]});
						lightbox.animate({top: bounds[2], left: bounds[3]});
					}else{
						image.hide();
						image.fadeIn();
					}
				}
				close.fadeIn();
			}).error(function(){
				fade.click(close_reactbox);
				loading.html("Um erro ocorreu ao tentar carregar a imagem");
				on_resize();
			});
		});

		function remove_reactbox(){
			$('#reactbox-fade, #reactbox-lightbox').remove();
			fade = null; lightbox = null; image = null; canvas = null; target = null;
			open = false;
			$(window).unbind('resize', on_resize);
		}

		function close_reactbox(){
			fade.animate({opacity: 0}, 300, remove_reactbox);
			lightbox.animate({opacity: 0}, 300, remove_reactbox);
		}

		/*function dblclick_close(){
			if(w <= 480) close_reactbox();
		}*/

		function on_resize(){
			w = $(window).width();
			h = $(window).height();
			if(w <= 480){
				lightbox.css({width: '100%', height: '100%', top: 0, left: 0});
				if(open && opts.maxWidth && opts.maxHeight){
					//image.css({width: opts.maxWidth, height: opts.maxHeight});
					image.hide();
					if(canvas) canvas.remove();
					lightbox.append('<canvas id="reactbox-canvas" style="width: 100%; height: 100%"></canvas>');
					canvas = lightbox.find('canvas');
					var gesturableImg = new ImgTouchCanvas({
			            canvas: document.getElementById('reactbox-canvas'),
			            path: image.attr('src'),
			            desktop: true
			        });

					/*lightbox.iframe({body: image, head: '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=2.0, user-scalable=yes" />'});
					iframe = lightbox.find('iframe');*/
				}
			}else{
				if(canvas){
					image.show();
					canvas.remove();
					canvas = null;
					//image.appendTo(lightbox);
					//iframe.remove();
					//iframe = null;
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
				/*setTimeout(function(){
					boxTop = h / 2 - imgHeight / 2;
					boxLeft = w / 2 - imgWidth / 2;
					lightbox.css({top: boxTop, left: boxLeft});
				}, 0);*/
			}
		}
	};

	

})(jQuery);