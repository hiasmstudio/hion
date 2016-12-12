'use strict';

/* global Dialog,Panel,ListBox,VLayout,Label,Button */

function FileManager() {
	var __files__ = this;
	
	this.location = "/examples";
	this.onfilename = function(fileName){};
	this.onerror = function(error){};
	
	this.form = new Dialog({
		resize: true,
		width: 540,
		height: 340,
		buttons: [{
			text: "Save/Open",
			click: function(dialog) {
				__files__._openSave();
			}
		}]
	});

	this._openSave = function() {
		var text = __files__.fileName.text;
		if(text) {
			var fileName = __files__.location + "/" + text;
			__files__.onfilename(fileName);
		}
		else if(__files__.selDir) {
			__files__.navigate(__files__.location + "/" + __files__.selDir);
		}
	};
	
	this.form.layout = new VLayout(this.form, {});
	
	var hpanel = new Panel({theme: "panel-clear"});
	hpanel.setLayoutOptions({shrink: 0});
	hpanel.layout.setOptions({padding: 5});
	this.fileName = new Edit({});
	this.fileName.setLayoutOptions({grow: 1});
	hpanel.add(new Label({caption: "File name: ", width: 100}));
	hpanel.add(this.fileName);
	this.form.add(hpanel);
	
	hpanel = new Panel({theme: "panel-clear"});
	hpanel.setLayoutOptions({shrink: 0});
	hpanel.layout.setOptions({padding: 5});
	hpanel.add(this.direction = new Label({width: 100}));
	
	this.address = new Panel({theme: "panel-clear"});
	this.address.setLayoutOptions({grow: 1});
	hpanel.add(this.address);
	
	this.btn = new Button({caption: "Create folder"});
	this.btn.addListener("click", function(){
		var folder = prompt("Enter folder name", "");
		if(folder) {
			var node = getFileNode(__files__.location + "/" + folder);
			node.mkdir(function(error) {
				if(error) {
					__files__.onerror({code: error, info: node.location()});
				}
				else {
					__files__.navigate(node.location());
				}
			});
		}
	});
	hpanel.add(this.btn);
	this.form.add(hpanel);
	
	hpanel = new Panel({theme: "panel-clear"});
	hpanel.layout.setOptions({padding: 5});
	hpanel.setLayoutOptions({grow: 1});
	hpanel.add(this.places = new ListBox({theme: "borderin"}));
	this.places.width = 100;
	this.places.onselect = function(item, text){
		if(!__files__.selectOnly)
			__files__.navigate("/" + text.toLowerCase());
	};
	
	this.listBox = new UISimpleTable({theme: "borderin", showgrid: false, lineheight: 13,
		columns: [
			{title: "", width: "22px", type: "image", align: "center"},
			{title: "File"},
			{title: "Size", width: "30px"},
			{title: "Date", width: "130px", align: "center"}
		]});
	this.listBox.tabIndex = 0;
	this.listBox.setLayoutOptions({grow: 1});
	this.listBox.onrowselect = function(item, index) {
		var text = item.data[1];
		if(item.data[4]) {
			if(!__files__.openSave) {
				__files__.fileName.text = "";
			}
			__files__.selDir = text;
		}
		else {
			__files__.fileName.text = text;
		}
	};
	this.listBox.onrowclick = function(item, index) {
		var text = item.data[1];
		if(item.data[4]) {
			if(text === "..") {
				__files__.navigate(__files__.location.substr(0, __files__.location.lastIndexOf("/")));
			}
			else {
				__files__.navigate(__files__.location + "/" + text);
			}
		}
		else {
			__files__._openSave();
		}
	};
	this.listBox.addListener("keydown", function(event) {
		if(event.keyCode === 46) {
			var row = __files__.listBox.getSelectionRow();
			if(row) {
				var node = getFileNode(__files__.location + "/" + row.data[1]);
				
				node.remove(function(error) {
					if(error) {
						__files__.onerror({code: error, info: node.location()});
					}
					else {
						__files__.listBox.removeSelection();
						if(row.index < __files__.listBox.size())
							__files__.listBox.selectIndex(row.index);
					}
				});
			}
		}
	});
	hpanel.add(this.listBox);
	
	this.form.add(hpanel);
	
	this.setAddress = function(folder) {
		this.location = folder;
		
		var lines = folder.substr(1).split("/");
		this.address.removeAll();
		var addr = "";
		for(var l of lines) {
			addr += "/" + l;
			var btn = new Button({caption: l, theme: "button-dlg"});
			btn.addListener("click", function(addr) { return function(){
				__files__.navigate(addr);
			};}(addr));
			this.address.add(btn);
		}
	};
	
	this.updateUser = function(){
		this.places.clear();
		this.places.addIcon("img/mime-folder.png", "Examples");
		if(window.user) {
			this.places.addIcon("img/mime-folder.png", "Home");
		}
		this.places.addIcon("img/mime-folder.png", "Local");
		if(window.user.uid === 3) {
			this.places.addIcon("img/mime-folder.png", "GUI");
		}
	};
	
	this.open = function() {
		this.openSave = false;
		this.form.caption = "Load project from file";
		this.direction.caption = "Load from folder:";
		this.form.form.getButton(0).innerHTML = "Open";
		this.fileName.text = "";
		this.btn.hide();
		this.navigate(this.location);
		this.form.show();
	};
	
	this.save = function(addr) {
		this.openSave = true;
		var i = addr.lastIndexOf("/");
		if(i > 0) {
			var file = addr.substr(i+1);
			this.fileName.text = file;
			var place = addr.substr(0, i);
			for(var i = 0; i < this.places.size(); i++) {
				if(place.startsWith("/" + this.places.items[i].toLowerCase())) {
					this.selectOnly = true;
					this.places.selectIndex(i);
					delete this.selectOnly;
					break;
				}
			}
			this.navigate(place);
		}
		else {
			this.navigate("/home");
			this.fileName.text = addr;
		}
		this.form.caption = "Save project to file";
		this.direction.caption = "Save in folder:";
		this.form.form.getButton(0).innerHTML = "Save";
		this.btn.show();
		this.form.show();
	};
	
	this._loadList = function(list) {
		this.listBox.clear();

		for(var node of list) {
			var icon = node.isFile ? "img/mime-none.png" : "img/mime-folder.png";
			if(node.name.indexOf(".") > 0) {
				var ext = node.name.split(".").pop();
				if(ext === "sha") {
					icon = "img/sha.png";
				}
			}
			this.listBox.addRow([icon, node.name, node.isFile ? node.sizeDisplay() : "", node.date.substr(0, 10), !node.isFile]);
		}
	};
	
	this.navigate = function(folder) {
		this.listBox.clear();
		this.setAddress(folder);
		
		var node = getFileNode(folder);
		node.list(function(error, list) {
			if(error) {
				__files__.onerror({code: error, info: node.location()});
			}
			else {
				__files__._loadList(list);
			}
		});
	};
}