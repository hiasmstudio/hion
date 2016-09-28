var drag_x = 0;
var drag_y = 0;
var drag_obj = null;
var actionState = 0;

/* global ModalFrame, Builder */

function GetPos(offTrial) {
	var offL=0;
	var offT=0;

	while(offTrial) {
		offL+=offTrial.offsetLeft - offTrial.scrollLeft;
		offT+=offTrial.offsetTop - offTrial.scrollTop;
		offTrial=offTrial.offsetParent;
	}

	return {left:offL , top:offT};
} 

window.HTMLElement.prototype.dialog = function(options) {
	var body = this;
	
	if(!body.running) {
		body.running = true;
		
		body.className = "dialog";
		
		body.onresize = function(){};
		body.onclose = function(){ return true; };
		
		if(options.destroy) {
			body.hide = function() {
				this.className = "";
				this.innerHTML = "";
				body.running = false;
				window.HTMLElement.prototype.hide.call(this);
				$.removeChild(this);
			};
		}
		
		body.getCursorState = function(event) {
			var pos = GetPos(this);
			var x = event.clientX - pos.left;
			var y = event.clientY - pos.top;
		
			if(x >= body.offsetWidth - 7 && y >= body.offsetHeight - 7) {
				return 5;
			}
			else if(x < 3) {
				return 1;
			}
			else if(x >= body.offsetWidth - 3) {
				return 2;
			}
			else if(y < 3) {
				return 3;
			}
			else if(y >= body.offsetHeight - 3) {
				return 4;
			}
			
			return 0;
		};
		
		if(options.resize) {
			body.setAttribute("resize", true);
			body.oldState = 0;
			body.onmousedown = function(event) {
				actionState = this.getCursorState(event);
				if(actionState) {
					drag_obj = this;
					drag_x = event.clientX;
					drag_y = event.clientY;
				}
			};

			body.onmousemove = function(event) {
				var state = this.getCursorState(event);
				if(!drag_obj && body.oldState != state) {
					body.oldState = state;
					this.style.cursor = ["", "w-resize", "e-resize", "n-resize", "s-resize", "se-resize"][state];
				}
			};

			body.onmouseup = function() {
				actionState = 0;
			};
		}

		var cap = new Builder().n("div").class("caption");
		
		if(options.icon) {
			cap.style("backgroundImage", "url('" + options.icon + "')");
		}

		cap.n("div").class("text").html(options.title).on("onmousedown", function(event) {
			drag_obj = body;
			drag_x = event.clientX;
			drag_y = event.clientY;
		});

		cap.n("div").class("close").on("onclick", function() {
			body.close();
		});

		var frmBody = document.createElement("div");
		frmBody.className = "body";

		var last = null;
		for(var i = body.childNodes.length-1; i >= 0; i--) {
			var node = body.removeChild(body.childNodes[i]);
			frmBody.insertBefore(node, last);
			last = node;
		}
		
		body.appendChild(cap.element);
		body.appendChild(frmBody);
		
		if(options.buttons) {
			var tools = new Builder().n("div").class("tools");
			for(var i in options.buttons) {
				var btn = options.buttons[i];
				tools.n("button").html(btn.text).attr("parent", btn).on("onclick", function(btn) {
					this.parent.click(body);
				});
			}
			body.appendChild(tools.element);
		}
	}
	
	this.getButton = function(index) {
		return this.lastChild.childNodes[index];
	};
	
	this.body = function() {
		return body.childNodes[1];
	};
	
	this.show = function(opt) {
		this.removeAttribute("visible");

		if(!(opt && opt.noCenter)) {
			this.move((document.childNodes[1].offsetWidth - this.offsetWidth)/2,  (document.childNodes[1].offsetHeight - this.offsetHeight)/2);
		}
		if(opt && opt.fullScreen) {
			this.move(0, 0);
			this.style.height = this.style.width = "100%";
		}
		if(options.modal || options.modal === undefined) {
			this.mframe = new ModalFrame(this);
		}
		
		window.addEventListener("keydown", this.onkeypress);
	};
	
	this.close = function() {
		if(this.onclose()) {
			this.hide();
			if(this.mframe) {
				this.mframe.close();
				this.mframe = null;
			}
			
			window.removeEventListener("keydown", this.onkeypress);
		}
	};
	
	this.onkeypress = function(event) {
		if(event.keyCode === 27) {
			body.close();
		}
	};
	
	this.setCaption = function(value) {
		body.childNodes[0].childNodes[0].innerHTML = value;
	};
	
	return this;
};

window.addEventListener("load", function(){
	var body = document.getElementsByTagName("body")[0];
	body.onmousedown = function() {
		if(drag_obj) {
			return false;
		}
	};
	body.onmouseup = function() {
		drag_obj = null;
	};
	body.onmousemove = function(event) {
		if(drag_obj) {
			var x = event.clientX;
			var y = event.clientY;
			if(actionState) {
				var dx = (x - drag_x);
				var dy = (y - drag_y);
				switch(actionState) {
					case 1:
						drag_obj.move(drag_obj.offsetLeft + dx, drag_obj.offsetTop);
						drag_obj.width(drag_obj.offsetWidth - 6 - dx);
						break;
					case 2:
						drag_obj.width(drag_obj.offsetWidth - 6 + dx);
						break;
					case 3:
						drag_obj.move(drag_obj.offsetLeft, drag_obj.offsetTop + dy);
						drag_obj.height(drag_obj.offsetHeight - 6 - dy);
						break;
					case 4:
						drag_obj.height(drag_obj.offsetHeight - 6 + dy);
						break;
					case 5:
						drag_obj.width(drag_obj.offsetWidth - 6 + dx);
						drag_obj.height(drag_obj.offsetHeight - 6 + dy);
						break;
				}
				drag_obj.onresize(drag_obj.offsetWidth - 6, drag_obj.offsetHeight - 6);
				drag_x = x;
				drag_y = y;
			}
			else {
				drag_obj.move(drag_obj.offsetLeft + (x - drag_x), drag_obj.offsetTop + (y - drag_y));
				drag_x = x;
				drag_y = y;
			}
		}
	};
});
