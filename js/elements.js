'use strict';

function Palette(options) {
	UIContainer.call(this);
	
	var p = new Builder().n("div").class("palette");
	this.palette = p.n("div").class("pl-body");
	this._ctl = p.element;

	this.selected = null;
	this.onselect = function(){};
	
	this.hint = new Hint();
	
	this.loadedImages = 0;
	
	this.setOptions(options);
	this.layout = new VLayout(this, {});
	
	this.cache = {};
	this.currentPack = "";
}

Palette.prototype = Object.create(UIContainer.prototype);

Palette.prototype.getContainer = function() {
	return this.palette.element;
};

Palette.prototype.selElement = function(obj) {
	if(this.selected) {
		this.selected.removeAttribute("selected");
	}
	this.selected = obj;
	this.selected.setAttribute("selected", "");
	this.onselect(obj.element);
};

Palette.prototype.unSelect = function() {
	if(this.selected) {
		this.selected.removeAttribute("selected");
		this.selected = null;
	}
};

Palette.prototype.show = function(pack) {
	if(!pack) {
		this.currentPack = "";
		return;
	}
	if(this.currentPack === pack.name) {
		return;
	}
	this.currentPack = pack.name;
	this.removeAll();
	this.palette.html("");
	
	if(this.cache[pack.name]) {
		for(var item of this.cache[pack.name])
			this.palette.append(item);
		return;
	}
	
	function isValidTab(tab) {
		return tab && tab !== "*";
	}
	
	// create tabs
	var tabs = {};
	for (var i in pack.elements) {
		var element = pack.elements[i];
		if(isValidTab(element.tab) && !tabs[element.tab]) {
			var tab = new Spoiler({
				caption: pack.translate("tab." + element.tab)
			});
			tab.name = element.tab;
			tabs[element.tab] = tab;
			this.add(tab);
		}
	}
	
	var __editor = this;
	// elements
	for (var id in pack.elements) {
		var element = pack.elements[id];
		if(isValidTab(element.tab)) {
			if(element.group) {
				tabs[element.tab].body().n("div").class("group").html(pack.translate("group." + id));
			}
			else {
				var e = tabs[element.tab].body().n("div").class("element").attr("eid", id)
					.on("onmouseenter", function(e){
						var tpl = pack.elements[this.eid];
						var h = __editor.hint.body();
						var header = h.n("div").class("header");
						header.html(pack.translate(this.eid));
						h.n("div").html(pack.translate("el." + this.eid));
						__editor.hint.show(e.clientX + 16, e.clientY + 16);
					})
					.on("onmouseleave", function(){__editor.hint.close();});

				e.element.palette = this;
				e.element.element = id;
				e.on("onclick", function(){
					this.palette.selElement(this);
				});
				e.on("onmousedown", function(){
					return false;
				});

				e.element.appendChild(element.icon);
			}
		}
	}
	
	var arr = [];
	for(var i = 0; i < this.palette.childs(); i++)
		arr.push(this.palette.child(i));
	this.cache[pack.name] = arr;
	
	// settings
	for (var tab in tabs) {
		if(window.getOptionBool("opt_palette_groups", 0)) {
			if(window.localStorage.getItem(tabs[tab].name) === "true") {
				tabs[tab].opened = true;
			}
		}
		tabs[tab].addListener("mouseover", function(){
			if(!this.childNodes[0].parent.opened) {
				if(window.getOptionBool("opt_auto_open", 0)) {
					this.childNodes[0].parent.opened = true;
				}
			}
		});
		tabs[tab].addListener("mouseout", function(){
			if(this.childNodes[0].parent.opened) {
				if(window.getOptionBool("opt_auto_open", 0)) {
					this.childNodes[0].parent.opened = false;
				}
			}
		});
		tabs[tab].onchange = function(){
			window.localStorage.setItem(this.name, this.opened);

			if(this.opened && window.getOptionBool("opt_auto_close", 1)) {
				for (var t in tabs) {
					if(tabs[t].opened && tabs[t] !== this) {
						tabs[t].opened = false;
					}
				}
			}
		};
	}
};