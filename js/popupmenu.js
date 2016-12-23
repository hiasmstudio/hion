/* global Builder */

var popup = null;

var html = document.getElementsByTagName("html")[0];
html.addEventListener("mousedown", function(event){
	if(popup) {
		if(event.clientX < popup.offsetLeft || event.clientY < popup.offsetTop || event.clientX > popup.offsetLeft + popup.offsetWidth || event.clientY > popup.offsetTop + popup.offsetHeight) {
			popup.hide();
			popup.parent.onclose();
			popup = null;
		}
	}
}, false);
	
function PopupMenu(items) {
	
	this.onclose = function(){};
	
	var body = new Builder().n("div").class("popup").attr("parent", this).on("oncontextmenu", function(){return false;});
	this.body = body.element;
	this.body.hide();
	$.appendChild(this.body);
	
	this.up = function(x, y) {
		popup = this.body;
		popup.show();
		if(y + popup.offsetHeight > window.innerHeight) {
			y = window.innerHeight - popup.offsetHeight;
		}
		if(x + popup.offsetWidth > window.innerWidth) {
			x = window.innerWidth - popup.offsetWidth;
		}
		popup.move(x, y);
	};
	for(var i in items) {
		var item = items[i];
		if(item.title === "-") {
			body.n("div").class("splitter");
		}
		else {
			var popupItem = body.n("div").class("item").attr("parent", item);
	
			var icon = item.icon || 0;
			popupItem.n("div").class("icon").style("backgroundPosition", "-" + (icon % 16)*16 + "px -" + (icon >> 4)*16 + "px");
			popupItem.n("span").class("title").html(item.title);
			
			popupItem.on("onclick",  function() {
				this.parent.click();
				popup.hide();
				popup.parent.onclose();
				popup = null;
			});
		}
	}
}

PopupMenu.prototype.close = function() {
	popup.hide();
	this.onclose();
	popup = null;
};

PopupMenu.prototype.size = function() {
	return this.body.childNodes.length;
};

PopupMenu.prototype.enabled = function(index, value) {
	this.body.childNodes[index].setAttribute("enabled", value);
};

PopupMenu.prototype.checked = function(index, value) {
	this.body.childNodes[index].setAttribute("checked", value);
};

PopupMenu.prototype.getItem = function(index) {
	return this.body.childNodes[index].parent;
};

PopupMenu.prototype.each = function(callback) {
	for(var i = 0; i < this.body.childNodes.length; i++) {
		if(this.body.childNodes[i].parent) {
			callback.call(this, i, this.body.childNodes[i].parent);
		}
	}
};