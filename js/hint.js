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
				hint.builder.element.move(x, y);
				hint.builder.element.show();
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
html.addEventListener("mousemove", function(){
	if(_hint) {
		_hint.close();
		_hint = null;
	}
}, false);

