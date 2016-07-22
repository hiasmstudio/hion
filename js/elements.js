'use strict';

function Palette(htmlObj) {
	this.palette = htmlObj;

	this.selected = null;
	this.onselect = function(){};
	this.onload = function(){};
	
	this.hint = new Hint();
	
	this.selElement = function(obj) {
		if(this.selected) {
			this.selected.removeAttribute("selected");
		}
		this.selected = obj;
		this.selected.setAttribute("selected", "");
		this.onselect(obj.element);
	};
	
	this.loadedImages = 0;
	
	this.load = function(pack) {
		this.task.parent.state("Create tabs...");
		// create tabs
		var tabs = {};
		for (var i in pack.elements) {
			var element = pack.elements[i];
			if(element.tab && !tabs[element.tab]) {
				var tab = new Spoiler({
					caption: window.translate.translate("tab." + element.tab)
				});
				tab.name = element.tab;
				tabs[element.tab] = tab;
				tab.appendTo(this.palette);
			}
		}
		
		var __editor = this;
		// elements
		for (var id in pack.elements) {
			var element = pack.elements[id];
			if(element.tab) {
				if(element.group) {
					tabs[element.tab].body().n("div").class("group").html(window.translate.translate("group." + id));
				}
				else {
					var e = tabs[element.tab].body().n("div").class("element").attr("eid", id)
						.on("onmouseenter", function(e){
							var tpl = pack.elements[this.eid];
							var h = __editor.hint.body();
							var header = h.n("div").class("header");
							header.html(window.translate.translate(this.eid));
							h.n("div").html(window.translate.translate("el." + this.eid));
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

		this.onload();
	};

	this.unSelect = function() {
		if(this.selected) {
			this.selected.removeAttribute("selected");
			this.selected = null;
		}
	};

}
