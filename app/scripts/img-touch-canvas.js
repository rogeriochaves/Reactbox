/*
=================================
img-touch-canvas - v0.1 - edited for reactbox by @_rchaves_
http://github.com/rombdn/img-touch-canvas

(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License
=================================
*/


(function() {
    var root = this; //global object

    var ImgTouchCanvas = function(options) {
        if( !options || !options.canvas || !options.path) {
            throw 'ImgZoom constructor: missing arguments canvas or path';
        }

        var self = this;
        this.canvas         = options.canvas;
        this.canvas.width   = this.canvas.clientWidth;
        this.canvas.height  = this.canvas.clientHeight;
        this.context        = this.canvas.getContext('2d');

        this.desktop = options.desktop || false; //non touch events
        
        this.position = {
            x: 0,
            y: 0
        };
        this.scale = {
            x: 1,
            y: 1
        };
        this.imgTexture = new Image();
        this.imgTexture.src = options.path;
        this.imgTexture.onload = function() {
            self.originalWidth = self.imgTexture.width;
            self.originalHeight = self.imgTexture.height;
        };

        this.lastZoomScale = null;
        this.lastX = null;
        this.lastY = null;

        this.mdown = false; //desktop drag

        this.init = false;
        this.touches = {};
        this.checkRequestAnimationFrame();
        requestAnimationFrame(this.animate.bind(this));

        this.setEventListeners();
    };


    ImgTouchCanvas.prototype = {
        animate: function() {
            if(this.detached) return;
            //set scale such as image cover all the canvas
            if(!this.init) {
                /*if(this.imgTexture.width) {
                    var scaleRatio = null;
                    if(this.canvas.clientWidth > this.canvas.clientHeight) {
                        scaleRatio = this.canvas.clientWidth / this.imgTexture.width;
                    }
                    else {
                        scaleRatio = this.canvas.clientHeight / this.imgTexture.height;
                    }

                    this.scale.x = scaleRatio;
                    this.scale.y = scaleRatio;
                    this.init = true;
                }*/
            }

            if(!this.originalWidth){
                this.originalWidth = this.imgTexture.width;
                this.originalHeight = this.imgTexture.height;
            }else{
                if(this.canvas.height > this.originalHeight){
                    var scale = this.canvas.height / this.originalHeight;
                    this.scale.y = scale;
                    this.scale.x = scale;
                }
                if(this.canvas.width > this.originalWidth){
                    var scale = this.canvas.width / this.originalWidth;
                    if(scale > this.scale.x){
                        this.scale.x = scale;
                        this.scale.y = scale;
                    }
                }
            }

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.context.drawImage(
                this.imgTexture, 
                this.position.x, this.position.y, 
                this.scale.x * this.imgTexture.width, 
                this.scale.y * this.imgTexture.height);

            requestAnimationFrame(this.animate.bind(this));
        },

        remove: function(){
            this.detached = true;
        },

        gesturePinchZoom: function(event) {
            var zoom = false;

            if( typeof event.targetTouches !== "undefined" && event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];
                var zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); //euclidian distance

                if( this.lastZoomScale ) {
                    zoom = zoomScale - this.lastZoomScale;
                }

                this.lastZoomScale = zoomScale;
            }else if( typeof event.targetTouches === "undefined" && typeof this.touches[0] !== "undefined" && typeof this.touches[1] !== "undefined" ){ // Windows Phone

                var p1 = this.touches[0].e;
                var p2 = this.touches[1].e;
                var zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); //euclidian distance

                if( this.lastZoomScale ) {
                    zoom = zoomScale - this.lastZoomScale;
                }

                this.lastZoomScale = zoomScale;

            }

            return zoom;
        },

        doZoom: function(zoom) {
            if(!zoom) return;

            //new scale
            var currentScale = this.scale.x;
            var newScale = this.scale.x + zoom/100;
            

            //some helpers
            var deltaScale = newScale - currentScale;
            var currentWidth    = (this.imgTexture.width * this.scale.x);
            var currentHeight   = (this.imgTexture.height * this.scale.y);
            var deltaWidth  = this.imgTexture.width*deltaScale;
            var deltaHeight = this.imgTexture.height*deltaScale;


            //by default scale doesnt change position and only add/remove pixel to right and bottom
            //so we must move the image to the left to keep the image centered
            //ex: coefX and coefY = 0.5 when image is centered <=> move image to the left 0.5x pixels added to the right
            var canvasmiddleX = this.canvas.clientWidth / 2;
            var canvasmiddleY = this.canvas.clientHeight / 2;
            var xonmap = (-this.position.x) + canvasmiddleX;
            var yonmap = (-this.position.y) + canvasmiddleY;
            var coefX = -xonmap / (currentWidth);
            var coefY = -yonmap / (currentHeight);
            var newPosX = this.position.x + deltaWidth*coefX;
            var newPosY = this.position.y + deltaHeight*coefY;

            //edges cases
            var newWidth = currentWidth + deltaWidth;
            var newHeight = currentHeight + deltaHeight;
            
            if( newWidth < this.canvas.clientWidth ) return;
            if( newPosX > 0 ) { newPosX = 0; }
            if( newPosX + newWidth < this.canvas.clientWidth ) { newPosX = this.canvas.clientWidth - newWidth;}
            
            if( newHeight < this.canvas.clientHeight ) return;
            if( newPosY > 0 ) { newPosY = 0; }
            if( newPosY + newHeight < this.canvas.clientHeight ) { newPosY = this.canvas.clientHeight - newHeight; }


            //finally affectations
            this.scale.x    = newScale;
            this.scale.y    = newScale;
            this.position.x = newPosX;
            this.position.y = newPosY;
        },

        doMove: function(relativeX, relativeY) {
            if(this.lastX && this.lastY) {
              var deltaX = relativeX - this.lastX;
              var deltaY = relativeY - this.lastY;
              var currentWidth = (this.imgTexture.width * this.scale.x);
              var currentHeight = (this.imgTexture.height * this.scale.y);

              this.position.x += deltaX;
              this.position.y += deltaY;


              //edge cases
              if( this.position.x > 0 ) {
                this.position.x = 0;
              }
              else if( this.position.x + currentWidth < this.canvas.clientWidth ) {
                this.position.x = this.canvas.clientWidth - currentWidth;
              }
              if( this.position.y > 0 ) {
                this.position.y = 0;
              }
              else if( this.position.y + currentHeight < this.canvas.clientHeight ) {
                this.position.y = this.canvas.clientHeight - currentHeight;
              }
            }

            this.lastX = relativeX;
            this.lastY = relativeY;
        },

        touchStart: function(self) {
            return function(e){
                self.lastX          = null;
                self.lastY          = null;
                self.lastZoomScale  = null;
            }
        },

        touchMove: function(self) {
            return function(e){
                e.preventDefault();

                // Windows Phone Support
                if(!e.targetTouches){
                    var pos = (e.isPrimary ? 0 : 1);
                    if(!self.touches) self.touches = {};
                    self.touches[pos] = {
                        e: e,
                        timeout: (function(pos){
                            setTimeout(function(){
                                delete self.touches[pos];
                            }, 100);
                        })(pos)
                    };
                }
                
                if(/* All mobile browsers */ (typeof e.targetTouches !== "undefined" && e.targetTouches.length == 2) ||
                   /* Windows Phone */ (typeof e.targetTouches === "undefined" && typeof self.touches[0] !== "undefined" && typeof self.touches[1] !== "undefined")) { //pinch
                    self.doZoom(self.gesturePinchZoom(e));
                }
                else if((typeof e.targetTouches !== "undefined" && e.targetTouches.length === 1) || (typeof e.targetTouches === "undefined" && typeof self.touches[0] !== "undefined" && typeof self.touches[1] === "undefined")) {
                    if(typeof e.targetTouches !== "undefined"){ /* All mobile browsers */
                        var relativeX = e.targetTouches[0].pageX - self.canvas.getBoundingClientRect().left;
                        var relativeY = e.targetTouches[0].pageY - self.canvas.getBoundingClientRect().top;    
                    }else{ /* Windows Phone */
                        var relativeX = self.touches[0].e.pageX - self.canvas.getBoundingClientRect().left;
                        var relativeY = self.touches[0].e.pageY - self.canvas.getBoundingClientRect().top;
                    }            
                    self.doMove(relativeX, relativeY);
                }
            }
        },

        setEventListeners: function() {
            //if (typeof this.canvas.style.msTouchAction != 'undefined')
            //    this.canvas.style.msTouchAction = "none";

            // touch
            this.canvas.addEventListener('touchstart', this.touchStart(this).bind(this));
            this.canvas.addEventListener('touchmove', this.touchMove(this).bind(this));
            this.canvas.addEventListener('MSPointerDown', this.touchStart(this).bind(this));
            this.canvas.addEventListener('MSPointerMove', this.touchMove(this).bind(this));

            if(!this.canvas.style.msTouchAction && this.desktop) {
                // keyboard+mouse
                window.addEventListener('keyup', function(e) {
                    if(e.keyCode == 187 || e.keyCode == 61) { //+
                        this.doZoom(5);
                    }
                    else if(e.keyCode == 54) {//-
                        this.doZoom(-5);
                    }
                }.bind(this));

                window.addEventListener('mousedown', function(e) {
                    this.mdown = true;
                    this.lastX = null;
                    this.lastY = null;
                }.bind(this));

                window.addEventListener('mouseup', function(e) {
                    this.mdown = false;
                }.bind(this));

                window.addEventListener('mousemove', function(e) {
                    var relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

                    if(e.target == this.canvas && this.mdown) {
                        this.doMove(relativeX, relativeY);
                    }

                    if(relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
                        this.mdown = false;
                    }
                }.bind(this));
            }
        },

        checkRequestAnimationFrame: function() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                window.cancelAnimationFrame = 
                  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = function(callback, element) {
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                      timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }

            if (!window.cancelAnimationFrame) {
                window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }
    };

    root.ImgTouchCanvas = ImgTouchCanvas;
}).call(this);