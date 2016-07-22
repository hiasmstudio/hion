/* global Builder */

function MainMenu(items) {
	var p = new Builder().n("div").class("mainmenu");
	
	this._opened = null;
	
	for(var i in items) {
		var item = items[i];
		var mainItem = p.n("div").class("item").html(item.title).attr("parent", this);
		
		mainItem.on("open", function(){
			this.parent._opened = this;
			this.className = "item active";
			this.menu.up(this.offsetLeft, this.offsetHeight);
		});
		mainItem.on("close", function(){
			if(this.parent._opened === this) {
				this.parent._opened = null;
				this.className = "item";
				this.menu.close();
			}
		});
		
		mainItem.on("onmouseover", function(){
			if(this.parent._opened) {
				this.parent._opened.close();
				this.open();
			}
		});
		mainItem.on("onclick", function(){
			this.open();
		});

		var menu = new PopupMenu(item.items);
		menu.parent = mainItem.element;
		mainItem.attr("menu", menu);
		menu.onclose = function() {
			this.parent.close();
		};
	}
	
	this.control = p.element;
	
	this.menuItem = function(index) {
		return this.control.childNodes[index];
	};
}