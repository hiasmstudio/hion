var _hint = null;
function Hint() {
	this.builder = new Builder().n("div").class("hint");
	this.builder.element.hide();
	$.appendChild(this.builder.element);
	
	this.body = function() {
		return this.builder.html("");
	};
	
	this.show = function(x, y) {
		if(this.timer) {
			clearTimeout(this.timer);
		}
		this.timer = setTimeout(function(hint){
			return function(){
				hint.builder.element.show();
				if(x + hint.builder.element.offsetWidth + 5 > window.innerWidth)
					x = window.innerWidth - hint.builder.element.offsetWidth - 5;
				if(y + hint.builder.element.offsetHeight + 5 > window.innerHeight)
					y = window.innerHeight - hint.builder.element.offsetHeight - 5;
				hint.builder.element.move(x, y);
				_hint = hint;
			};
		}(this), 400);
	};
	
	this.close = function() {
		if(this.timer) {
			clearTimeout(this.timer);
			this.timer = 0;
		}
		this.builder.element.hide();
	};
}

var html = document.getElementsByTagName("html")[0];
function closeHint() {
	if(_hint) {
		_hint.close();
		_hint = null;
	}
}
html.addEventListener("mousemove", closeHint, false);
html.addEventListener("touchstart", closeHint, false);
