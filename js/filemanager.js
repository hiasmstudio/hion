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
			var fileName = __files__.location + "/" + folder;
			if(fileName.startsWith("/local")) {
				var key = __files__.location.replace(/\//g, "_");
				var list = window.localStorage[key] ? JSON.parse(window.localStorage[key]) : {};
				list[folder] = 1;
				window.localStorage[key] = JSON.stringify(list);
			}
			else {
				$.post("server/core.php", {mkdir: fileName}, function(data) {
					if(data) {
						__files__.onerror(JSON.parse(data));
					}
					else {
						__files__.navigate(fileName);
					}
				});
			}
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
			var f = __files__.location + "/" + __files__.listBox.getSelectText();
			$.post("server/core.php", {rm: f}, function(){
				
			});
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
			this.navigate(addr.substr(0, i));
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
	
	this._loadList = function(folder, data) {
		this.listBox.clear();
		// if(folder.lastIndexOf("/") > 0) {
		// 	this.listBox.addIcon("img/mime-folder.png", "..").directory = true;
		// 	this.listBox.addRow("", "..").directory = true;
		// }
		var lines = JSON.parse(data);
		if(lines.push) {
			for(var node of lines) {
				var size = 0;
				if(node.size < 1024) {
					size = node.size;
				}
				else if(node.size < 1024*1024) {
					size = Math.floor(node.size / 1024 * 10)/10 + "Kb";
				}
				else if(node.size < 1024*1024*1024) {
					size = Math.floor(node.size / (1024*1024) * 10)/10 + "Mb";
				}
				var icon = "img/mime-none.png";
				if(node.folder) {
					icon = "img/mime-folder.png";
				}
				else if(node.name.indexOf(".") > 0) {
					var ext = node.name.split(".").pop();
					if(ext === "sha") {
						icon = "img/sha.png";
					}
				}
				this.listBox.addRow([icon, node.name, node.folder ? "" : size, node.date.substr(0, 10), node.folder]);
			}
		}
		else {
			for(var i in lines) {
				this.listBox.addRow([lines[i] ? "img/mime-folder.png" : "img/mime-none.png", i, "", "", lines[i]]);
			}
		}
	};
	
	this.navigate = function(folder) {
		this.listBox.clear();
		this.setAddress(folder);
		
		if(folder.startsWith("/local")) {
			var key = folder.replace(/\//g, "_");
			this._loadList(folder, window.localStorage[key] || "{}");
		}
		else {
			$.get("server/core.php?dir=" + folder, function(data){
				if(__files__.location === folder) {
					__files__._loadList(folder, data);
				}
			});
		}
	};
}