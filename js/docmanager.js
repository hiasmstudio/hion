'use strict';

/* global TabControl,Builder,commander */

//------------------------------------------------------------------------------

function getFileNode(location) {
	if(location === "") {
		return null;
	}
	
	var fs;
	if(location.startsWith("/local")) {
		fs = new LocalFS();
	}
	else {
		fs = new RemoteFS();
	}
	
	var node = new FSNode(fs, location);
	return node;
}

function FSNode (fs, location) {
	if(location) {
		var p = fs.getPath(location);
		this.name = p.name;
		this.path = p.path;
	}
	else {
		this.name = "";
		this.path = "";
	}
	this.mime = "";
	this.size = 0;
	this.fs = fs;
	this.isFile = false;
}

FSNode.prototype.location = function() {
	return this.path + "/" + this.name;
};

FSNode.prototype.read = function(callback) {
	this.fs.read(this.location(), callback);
};

FSNode.prototype.readArray = function(callback) {
	this.read(callback);
};

FSNode.prototype.write = function(data, callback) {
	this.fs.write(this.location(), data, callback);
};

FSNode.prototype.remove = function(callback) {
	this.fs.remove(this.location(), callback);
};

FSNode.prototype.list = function(callback) {
	this.fs.list(this.location(), callback);
};

FSNode.prototype.mkdir = function(callback) {
	this.fs.mkdir(this.location(), callback);
};

FSNode.prototype.sizeDisplay = function() {
	var size = 0;
	if(this.size < 1024) {
		size = this.size;
	}
	else if(this.size < 1024*1024) {
		size = Math.floor(this.size / 1024 * 10)/10 + "Kb";
	}
	else if(this.size < 1024*1024*1024) {
		size = Math.floor(this.size / (1024*1024) * 10)/10 + "Mb";
	}
	return size;
};

function DesktopFSNode(desktopFile) {
	FSNode.call(this, null);
	
	this.isFile = true;
	this.name = desktopFile.name;
	this.size = desktopFile.size;
	this.mime = desktopFile.type;
	this.desktopFile = desktopFile;
}

DesktopFSNode.prototype = Object.create(FSNode.prototype);

DesktopFSNode.prototype.read = function(callback) {
	var reader = new FileReader();
	reader.onload = function(e) {
		callback(0, e.target.result);
	};
	reader.readAsText(this.desktopFile);
};

DesktopFSNode.prototype.readArray = function(callback) {
	var reader = new FileReader();
	reader.onload = function(e) {
		callback(0, e.target.result);
	};
	reader.readAsArrayBuffer(this.desktopFile);
};

//------------------------------------------------------------------------------

function FS () {
	
}

FS.prototype.getPath = function(location) {
	if(location.charAt(location.length-1) === "/") {
		location = location.substr(0, location.length-1);
	}
	var i = location.lastIndexOf("/");
	return {path: location.substr(0, i), name: location.substr(i+1)};
};

FS.prototype.__supportError = function() { console.error("Not supported"); };

FS.prototype.list = function(dir, callback) { this.__supportError(); };
FS.prototype.mkdir = function(dir, callback) { this.__supportError(); };
FS.prototype.rmdir = function(dir, callback) { this.__supportError(); };

FS.prototype.remove = function(file, callback) { this.__supportError(); };
FS.prototype.move = function(fileOld, fileNew, callback) {
	this.read(fileOld, function(error, data) {
		if(error === 0) {
			this.remove(fileOld, function(error) {
				if(error === 0) {
					this.write(fileNew, data, function(error) {
						if(error === 0) {
							callback(0);
						}
						else {
							callback(3);
						}
					});
				}
				else {
					callback(2);
				}
			});
		}
		else {
			callback(1);
		}
	});
};
FS.prototype.read = function(file, callback) { this.__supportError(); };
FS.prototype.write = function(file, data, callback) { this.__supportError(); };

function LocalFS () {
	FS.call(this);
}

LocalFS.prototype = Object.create(FS.prototype);

LocalFS.prototype.__getKey = function(dir) {
	return dir.replace(/\//g, "_");
};

LocalFS.prototype._loadList = function(folder, data) {
	var nodes = [];
	var lines = JSON.parse(data);
	for(var i in lines) {
		var node = new FSNode(this);
		node.name = i;
		node.isFile = lines[i] == 0;
		node.path = folder;
		node.size = 0;
		node.date = "";
		nodes.push(node);
		node.read(function(error, data){
			if(error === 0)
				node.size = data.length;
		});
	}
	return nodes;
};

LocalFS.prototype.list = function(dir, callback) {
	var key = this.__getKey(dir);
	if(window.localStorage[key]) {
		callback(0, this._loadList(dir, window.localStorage[key]));
	}
};

LocalFS.prototype.mkdir = function(dir, callback) {
	var node = this.getPath(dir);
	var key = this.__getKey(node.path);
	var list = window.localStorage[key] ? JSON.parse(window.localStorage[key]) : {};
	list[node.name] = 1;
	window.localStorage[key] = JSON.stringify(list);
	callback(0);
};

LocalFS.prototype.rmdir = function(dir, callback) {
	var node = this.getPath(dir);
	var key1 = this.__getKey(dir);
	if(!window.localStorage[key1] || window.localStorage[key1] === "{}") {
		var key2 = this.__getKey(node.path);
		
		if(window.localStorage[key2]) {
			var list = JSON.parse(window.localStorage[key2]);
			delete list[node.name];
			window.localStorage[key2] = JSON.stringify(list);
			callback(0);
		}
		else {
			callback(2);
		}
	}
	else {
		callback(1);
	}
};

LocalFS.prototype.remove = function(file, callback) {
	var node = this.getPath(file);
	var key = this.__getKey(node.path);
	var folder = window.localStorage[key];
	if(folder) {
		var list = JSON.parse(window.localStorage[key]);
		delete list[node.name];
		window.localStorage[key] = JSON.stringify(list);
		key = this.__getKey(file);
		delete window.localStorage[key];
		callback(0);
	}
	else {
		callback(1);
	}
};

LocalFS.prototype.read = function(file, callback) {
	var key = this.__getKey(file);
	var data = window.localStorage[key];
	if(data) {
		callback(0, data);
	}
	else {
		callback(1);
	}
};

LocalFS.prototype.write = function(file, data, callback) {
	var node = this.getPath(file);
	var key1 = this.__getKey(node.path);
	var fList = window.localStorage[key1];
	if(!fList) {
		fList = "{}";
	}
	if(fList) {
		var list = JSON.parse(fList);
		if(!list[node.name]) {
			list[node.name] = 0;
			window.localStorage[key1] = JSON.stringify(list);
		}
		var key2 = this.__getKey(file);
		window.localStorage[key2] = data;
		callback(0);
	}
	else {
		callback(1);
	}
};

function RemoteFS () {
	FS.call(this);
}

RemoteFS.prototype = Object.create(FS.prototype);

RemoteFS.prototype._loadList = function(folder, data) {
	var nodes = [];
	var files = JSON.parse(data);
	for(var file of files) {
		var node = new FSNode(this);
		node.name = file.name;
		node.isFile = file.folder === 0;
		node.path = folder;
		node.size = file.size;
		node.date = file.date;
		nodes.push(node);
	}
	return nodes;
};

RemoteFS.prototype.list = function(dir, callback) {
	var __fs = this;
	$.get("server/core.php?dir=" + dir, function(data){
		callback(0, __fs._loadList(dir, data));
	});
};

RemoteFS.prototype.mkdir = function(dir, callback) {
	$.post("server/core.php", {mkdir: dir}, function(data) {
		if(data) {
			var error = JSON.parse(data);
			callback(error.code);
		}
		else {
			callback(0);
		}
	});
};

RemoteFS.prototype.rmdir = function(dir, callback) {
	$.post("server/core.php", {rm: dir}, function(data){
		if(data) {
			var error = JSON.parse(data);
			callback(error.code);
		}
		else {
			callback(0);
		}	
	});
};

RemoteFS.prototype.remove = function(file, callback) {
	this.rmdir(file, callback);
};

RemoteFS.prototype.read = function(file, callback) {
	$.post("server/core.php", {name: file, load: true}, function(data) {
		if(this.status == 200) {
    		callback(0, data);
		}
		else {
			var error = JSON.parse(data);
			callback(error.code);
		}
	});
};

RemoteFS.prototype.write = function(file, data, callback) {
	$.post("server/core.php", {name: file, sha: data, save: true}, function(data){
		if(data) {
			var error = JSON.parse(data);
			callback(error.code);
		}
		else {
			callback(0);
		}
	});
};

//------------------------------------------------------------------------------

function DocumentTab(file) {
	UIControl.call(this);
	
    this.manager = null;
    this.tab = null;
    this.saved = true;
}

DocumentTab.prototype = Object.create(UIControl.prototype);

DocumentTab.prototype.getControl = function(){
    return this._ctl;
};

DocumentTab.prototype.open = function(file, asnew) { if(!asnew) this.file = file; };
DocumentTab.prototype.save = function(file) { this.file = file; };
DocumentTab.prototype.init = function() {};
DocumentTab.prototype.resize = function() {};
DocumentTab.prototype.close = function() {
	if(this.saved || confirm("Are you sure?")) {
		this.hide();
		return true;
	}
	return false;
};
DocumentTab.prototype.getTitle = function() {
    if(this.file) {
	    var fName = this.file.name;
	    var i = fName.indexOf(".");
	    return i > 0 ? fName.substr(0, i) : fName;
    }
    
    return "";
};

DocumentTab.prototype.show = function() { this.getControl().show(); };
DocumentTab.prototype.hide = function() { this.getControl().hide(); };

DocumentTab.prototype.updateCommands = function(commander) {};
DocumentTab.prototype.execCommand = function(cmd, data) {};

//------------------------------------------------------------------------------

var buffer = "";
var hintLink = null;

function SHATab(file) {
	this.container = new Panel({theme: "doc-sha"});
	this.container.layuot = new VLayout(this.container, {});
    this.sdkEditor = new SdkEditor();
    this.sdkEditor.hide();
    this._ctl = this.container.getControl();
    this.container.add(this.sdkEditor);
    this.loader = new UILoader({size: 64, radius: 5});
    this.container.add(this.loader);
    
    this.statusBar = new Panel({theme: "statusbar"});
    this.statusBar.hide();
    this.container.add(this.statusBar);
    this.address = new Panel({theme: "panel-clear"});
    this.address.setLayoutOptions({grow: 1});
    this.statusBar.add(this.address);

    // this.statusBar.add(new Button({caption: "+", width: 20}));
    // this.statusBar.add(new Label({caption: "100%", width: 40, halign: 1}));
    // this.statusBar.add(new Button({caption: "-", width: 20}));
    this.zoom = new TrackBar({min: 0, max: 5, step: 1, width: 60});
    this.zoom.position = 2;
    var __editor = this;
    this.zoom.addListener("input", function () {
		__editor.sdkEditor.zoom(0.25 * (1 << __editor.zoom.position));
		commander.reset();
	});
    this.statusBar.add(this.zoom);
	
	this.buildMode = "";
	this.bindFlags = 0;

    DocumentTab.call(this, file);
}

SHATab.prototype = Object.create(DocumentTab.prototype);

SHATab.prototype.getTitle = function(){
    return DocumentTab.prototype.getTitle.call(this) || "Project";
};

SHATab.prototype.createFromData = function(data) {
    var sdk = new SDK(packMan.getPack("webapp"));
	this.sdkEditor.edit(sdk);
	//this.sdkEditor.createNew();
	if(data) {
		this.sdkEditor.loadFromText(data);
	}
	this.loader.free();
	this.sdkEditor.show();
	this.statusBar.show();
	this.resize();
	this.buildMode = sdk.pack.make ? sdk.pack.make[0].cmd : "";
};

SHATab.prototype.open = function(file, asnew) {
    DocumentTab.prototype.open.call(this, file, asnew);
    
	var __editor = this;
	this.tab.load(true);
	file.read(function(error, data){
		if(error === 0) {
			__editor.createFromData(data);
			__editor.tab.load(false);
			__editor.tab.icon = __editor.sdkEditor.sdk.pack.getSmallIcon();
			commander.reset();
			__editor.manager._ontabopen(__editor);
		}
		else {
			displayError({code: error, info: file.location()});
		}
	});
};

SHATab.prototype.save = function (file) {
	DocumentTab.prototype.save.call(this, file);

	this.saveSDKtoFile();
};

SHATab.prototype.init = function() {
    this.resize();
    
	var __editor__ = this;
    this.sdkEditor.onselectelement = function(selMan) {
		propEditor.show(selMan);
		if(__editor__.fEditor) {
			__editor__.fEditor.update();
		}
		commander.reset();
	};
	this.sdkEditor.onstatuschange = function(text) {
		$("state").innerHTML = text;
	};
	this.sdkEditor.onpopupmenu = function(type, x, y, obj) {
		switch(type) {
			case POPUP_MENU_ELEMENT:
				popupElement.up(x, y);
				break;
			case POPUP_MENU_SDK:
				popupSDK.up(x, y);
				break;
			case POPUP_MENU_HINT_LINK:
				var items = [];
				for(var collection of [obj.e.props, obj.e.sys]) {
					for(var p in collection) {
						var prop = collection[p];
						items.push({
							title: prop.name,
							click: function() {
								obj.prop = obj.e.props[this.title] || obj.e.sys[this.title];
								__editor__.sdkEditor.draw();
							}
						});
					}
					if(collection === obj.e.props) {
						items.push({title: "-"});
					}
				}
				hintLink = new PopupMenu(items);
				hintLink.up(x, y);
				break;
			case POPUP_MENU_LINE:
				popupLine.up(x, y);
				break;
		}
	};
	this.sdkEditor.oneditprop = function(prop) {
		propEditor.onadveditor(prop);
	};
	this.sdkEditor.onsdkchange = function() {
		if(__editor__.saved) {
			__editor__.saved = false;
			commander.reset();
		}
	};
	this.sdkEditor.onsdkselect = function(){
		__editor__.updateAddress();
	};
};

SHATab.prototype.resize = function() {
	this.sdkEditor.resize();
};

var runners = {};

SHATab.prototype.show = function() {
	DocumentTab.prototype.show.call(this);
	
	this.sdkEditor.getControl().focus();
	//setTimeout(function(){console.log(__editor__.sdkEditor.getControl()); __editor__.sdkEditor.getControl().focus();}, 2);
	
	var __editor__ = this;
	propEditor.onpropchange = function(prop) {
		__editor__.sdkEditor.draw();
		__editor__.sdkEditor.onsdkchange();
		
		if(__editor__.fEditor) {
			__editor__.fEditor.update();
		}
	};
	propEditor.onadveditor = function(item) {
		var e = __editor__.sdkEditor.sdk.selMan.items[0];
		var prop = e.props[item.name] || e.sys[item.name];
		var customEditor = null;
		// check self editor
		if(prop.editor)
			customEditor = {name: prop.editor, path: __editor__.sdkEditor.sdk.pack.getEditorsPath()};
		// check property type editor
		if(!customEditor) {
			customEditor = __editor__.sdkEditor.sdk.pack.getPropertyEditor(item.type);
		}
		if(customEditor && customEditor.name.indexOf(":") != 0) {
			var key = customEditor.path + customEditor.name;
			if(!runners[key]) {
				runners[key] = new Runner(customEditor.path + customEditor.name);
			}
			runners[key].run([item.name, item.value, e.props], function(data) {
				__editor__.sdkEditor.sdk.selMan.setProp(item.name, data[0]);
				__editor__.sdkEditor.onselectelement(__editor__.sdkEditor.sdk.selMan);
				propEditor.onpropchange(null);
			});
		}
		else {
			var m = new Builder().n("div");
			var e = m.n("div").style("flexGrow", 1);
			$.appendChild(m.element);
			var editor = CodeMirror(e.element, {
				value: item.value.toString(),
				lineNumbers: window.getOptionBool("opt_ce_line_numbers", 1),
				lineWrapping: window.getOptionBool("opt_ce_line_wrapping", 0),
				matchBrackets: true,
				mode: {name: customEditor ? customEditor.name.substring(1) : ''},
				extraKeys: {"Ctrl-Space": "autocomplete"},
				indentUnit: 4, // Длина отступа в пробелах.
				indentWithTabs: true,
				enterMode: "keep",
				tabMode: "shift"
			});
			
			m.element.dialog({
				title: "Edit property " + item.name, resize: true, modal: true, destroy: true,
				buttons: [{
					text: "Save",
					click: function (dialog) {
						__editor__.sdkEditor.sdk.selMan.setProp(item.name, editor.getValue());
						dialog.close();
						__editor__.sdkEditor.onselectelement(__editor__.sdkEditor.sdk.selMan);
						propEditor.onpropchange(null);
					}
				}]
			}).width(700).height(400).show();
			
			editor.focus();
		}
	};

	if(this.sdkEditor.sdk) {
		this.sdkEditor.onselectelement(this.sdkEditor.sdk.selMan);
	}
	this.resize();
};

SHATab.prototype.hide = function() {
	DocumentTab.prototype.hide.call(this);
	
	propEditor.onpropchange = function() {};
	propEditor.onadveditor = function() {};
	propEditor.show(null);
};

SHATab.prototype.goInto = function(element) {
	// return into root
	while(this.sdkEditor.canBack())
		this.sdkEditor.back();
	
	// create path from elements
	var path = [];
	var sdk = element.parent;
	while(element) {
		path.push(element);
		element = element.parent.parentElement;
	}
	
	// goto container
	for(var i = path.length-1; i >= 0; i--) {
		this.sdkEditor.sdk.selMan.select(path[i]);
		commander.execCommand("forward");
	}
};

SHATab.prototype.updateAddress = function() {
	var sdk = this.sdkEditor.sdk;

	var __editor = this;
	this.address.removeAll();

	var last = null;
	while(sdk) {
		var c = sdk.parentElement ? sdk.parentElement.sys.Comment.value : "ROOT";
		if(!c) {
			c = "Container";
		}
		
		var l = new Label({caption: c, theme: sdk !== this.sdkEditor.sdk ? "link" : ""});
		last ? this.address.insert(l, last) : this.address.add(l);
		if(sdk.parentElement) {
			this.address.insert(last = new Label({width: 10, caption: "\\", halign: 1}), l);
		}
		
		if(sdk !== this.sdkEditor.sdk) {
			l.getControl().tag = sdk;
			l.addListener("click", function() {
				if(__editor.fEditor) {
					__editor.formEditor();
				}
				__editor.sdkEditor.edit(this.tag);
			});
		}
		sdk = sdk.parent;
	}
};

SHATab.prototype.updateCommands = function(commander) {
    if(this.sdkEditor.sdk) {
    	commander.enabled("addelement");
    	
		commander.enabled("saveas");
		commander.enabled("run");
		commander.enabled("selectall");
		commander.enabled("slidedown");
		commander.enabled("slideright");
		commander.enabled("makehint");
		commander.enabled("remove_lh");
		commander.enabled("capture");
		commander.enabled("sha_source");
		commander.enabled("statistic");
		commander.enabled("paste");
		commander.enabled("linecolor");

		if(this.sdkEditor.canFormEdit()) {
			commander.enabled("formedit");
			if(this.fEditor)
				commander.checked("formedit");
		}
		
		if(this.file && this.file.path.startsWith("/home")) {
			if(window.user.plan.share == 1)
				commander.enabled("share");
			if(window.user.plan.history == 1)
				commander.enabled("history");
			if(window.user.plan.catalog == 1)
				commander.enabled("addcatalog");
		}
		
		if(this.sdkEditor.canZoomIn()) commander.enabled("zoomin");
		if(this.sdkEditor.canZoomOut()) commander.enabled("zoomout");
		
		if(this.sdkEditor.canUndo()) commander.enabled("undo");
		if(this.sdkEditor.canRedo()) commander.enabled("redo");

		if(!this.saved) commander.enabled("save");
		if(this.sdkEditor.canBringToFront()) commander.enabled("bringtofront");
		if(this.sdkEditor.canSendToBack()) commander.enabled("sendtoback");
		
		if(!this.sdkEditor.sdk.selMan.isEmpty()) commander.enabled("moveto");
		
		if(this.fEditor) {
			commander.enabled("bind_rect");
			if(this.bindFlags & 0x1)
				commander.checked("bind_rect");
			commander.enabled("bind_center");
			if(this.bindFlags & 0x2)
				commander.checked("bind_center");
			commander.enabled("bind_padding");
			if(this.bindFlags & 0x4)
				commander.checked("bind_padding");
		}
		
		if(this.buildMode) {
			commander.enabled("build");
			commander.enabled("make");
//			if(this.buildMode === 0)
//				commander.checked("make");
//			else
//				commander.checked("make_nwjs");
		}
    }
    
	if(this.sdkEditor.sdk && !this.sdkEditor.sdk.selMan.isEmpty()) {
		commander.enabled("cut");
		commander.enabled("copy");
		commander.enabled("delete");
		if(this.sdkEditor.sdk.selMan.size() == 1) {
			commander.enabled("comment");
		}
	}  

	if(this.sdkEditor.canBack()) {
		commander.enabled("back");
	}
	if(this.sdkEditor.canForward()) {
		commander.enabled("forward");
	}
};

SHATab.prototype.saveSDKtoFile = function() {
	var __editor = this;
	this.tab.save(true);
	this.file.write(this.sdkEditor.getMainSDK().save(false), function(error){
		if(error === 0) {
			__editor.saved = true;
			commander.reset();
			__editor.tab.caption = __editor.getTitle();
			__editor.tab.title = __editor.file.location();
		}
		else {
 			displayError({code: error});
			if(error == 6)
				new Runner("plan").run();
 		}
		__editor.tab.save(false);
	});
};

SHATab.prototype.formEditor = function() {
	if(this.fEditor) {
		this.fEditor.edit(null);
		this.fEditor = null;
		this.sdkEditor.show();
		this.resize();
	}
	else {
		this.fEditor = new FormEditor(this.sdkEditor);
		this.fEditor.setBindFlags(this.bindFlags);
		var ctl = this.fEditor.edit(this.sdkEditor.sdk);
		if(ctl) {
			this.sdkEditor.hide();
			this.container.insert(ctl, this.container.get(1));
			this.fEditor.update();
		}
	}
	commander.reset();
};



SHATab.prototype.showStatistic = function() {
	var stat = [
		[translate.translate("ui.statecount"), 0],
		[translate.translate("ui.statincursdk"), 0],
		[translate.translate("ui.statsdknum"), 0],
		[translate.translate("ui.statintel"), 0],
		[translate.translate("ui.statlinkednum"), 0],
		[translate.translate("ui.statlinkedpoints"), 0]
	];
	
	function fill(sdk) {
		if(sdk) {
			stat[0][1] += sdk.imgs.length;
			for(var e of sdk.imgs) {
				if(e instanceof ITElement || e instanceof HubsEx || e instanceof Debug) {
					stat[3][1]++;
				}
				for(var p in e.points) {
					if(!e.points[p].isFree()) {
						stat[5][1] ++;
					}
				}
				if(e.sdk) {
					stat[2][1] ++;
					fill(e.sdk);
				}
			}
		}
	};
	
	stat[1][1] = this.sdkEditor.sdk.imgs.length;
	fill(this.sdkEditor.getMainSDK());
	
	new Runner("statistic").run(stat);
};

SHATab.prototype.moveto = function() {
	var list = [];
	for(var e in this.sdkEditor.sdk.pack.elements) {
		var element = this.sdkEditor.sdk.pack.elements[e];
		if(element.class == "MultiElement" || element.class == "MultiElementEx") {
			list.push([this.sdkEditor.sdk.pack.getRoot() + "/icons/" + e + ".ico", e, this.sdkEditor.sdk.pack.translate("el." + e)]);
		}
	}
	var sdke = this.sdkEditor;
	new Runner("movein", function(data){
		var cont = data[0][1];
		var rect = sdke.sdk.selMan.getRect();
		var saved = sdke.sdk.save(true);
		var links = [{count:0, points:{}}, {count:0, points:{}}, {count:0, points:{}}, {count:0, points:{}}];
		sdke.sdk.selMan.eath(function(item){
			for(var p in item.points) {
				var point = item.points[p];
				if(!point.isFree() && !point.point.parent.isSelect()) {
					var lnk = links[point.type-1];
					var pn = point.name;
					if(lnk.points[pn])
						pn += lnk.count;
					lnk.points[pn] = {point: point.point, id: point.parent.eid, name: point.name};
					lnk.count ++;
				}
			}
		});
		sdke.deleteSelected();
		var e = sdke.addElement(cont, (rect.x1 + rect.x2 - 32)/2, (rect.y1 + rect.y2 - 32)/2);
		var size = e.sdk.imgs.length;
		e.sdk.load(saved);
		e.sdk.selMan.selectAll();
		if(size)
			e.sdk.selMan.unselect(e.sdk.imgs[0]);
		rect = e.sdk.selMan.getRect();
		e.sdk.selMan.move(-rect.x1 + POINT_SPACE*5, -rect.y1 + POINT_SPACE*5);
		e.sdk.selMan.clear();
		
		var arr = {WorkCount:0, EventCount:1, VarCount:2, DataCount:3};
		for(var p in arr) {
			if(e.sdk.imgs[0].props[p].type === 1)
				e.sdk.imgs[0].props[p].value = links[arr[p]].count;
			else {
				var val = "";
				for(var i in links[arr[p]].points) {
					val += i + "\n";
				}
				e.sdk.imgs[0].props[p].value = val;
			}
			e.sdk.imgs[0].onpropchange(e.sdk.imgs[0].props[p]);
			
			for(var i in links[arr[p]].points) {
				var point = links[arr[p]].points[i];
				var newe = e.sdk.getElementByEId(point.id);
				var newp = newe.findPointByName(point.name);
				newp.connect(e.sdk.imgs[0].getFirstFreePoint(newp.getPair())).createPath();
				
				point.point.clear();
				point.point.connect(e.getFirstFreePoint(point.point.getPair())).createPath();
			}
		}
		
		sdke.draw();
	}).run(list);
};

SHATab.prototype.build = function(mode, callback) {
	if(user.plan.builds <= user.plan.totalbuilds) {
		new Runner("plan").run();
		return;
	}
		
	this.manager.state.set("Build...");
	var state = this.manager.state;
	var name = this.file ? this.file.name : "Project.sha";
	this.sdkEditor.build();
	$.post("server/core.php", {
			build: name,
			mode: mode,
			code: this.sdkEditor.getMainSDK().save(false)
		},
		function(data, file) {
			state.clear();
			if(this.status === 200) {
				for(var line of data.split("\n")) {
					if(line.startsWith("CODEGEN")) {
						var text = line.substring(9);
						var color = "";
						if(text.startsWith("~")) {
							color = "gray";
						}
						else if(text.startsWith("@")) {
							color = "silver";
						}
						else if(text.startsWith("!")) {
							color = "red";
						}
						else if(text.startsWith("#")) {
							color = "blue";
						}
						state.add(text.substring(1), color);
					}
					else {
						state.add(line);
					}
				}
				if(callback)
					callback();
			}
			else {
				state.add(this.statusText, "red");
			}
		},
		name.substring(0, name.length - 4)
	);
};

SHATab.prototype.run = function() {
	var run = this.sdkEditor.sdk.pack.run;
	var _editor_ = this;
	if(run.mode == "internal")
		this.sdkEditor.run();
	else if(run.mode == "url") {
		var url = run.url.replace("%uid%", user.uid).replace("%pname%", this.getTitle().toLowerCase());
		this.build(this.buildMode, function(){
			if(!_editor_.runapp || _editor_.runapp.closed)
				_editor_.runapp = window.open(window.location.origin + url + "?b=" + _editor_.sdkEditor.getBuild());
			else
				_editor_.runapp.location = window.location.origin + url + "?b=" + _editor_.sdkEditor.getBuild();
		});
	}
}

SHATab.prototype.setLineColor = function() {
	var ed = this;
	new Runner("coloreditor", function(data){
		ed.sdkEditor.setLineColor(data[0]);
	}).run(this.sdkEditor.pasteObj.point.getColor());
};

SHATab.prototype.setLineInfo = function() {
	var ed = this;
	var info = this.sdkEditor.pasteObj.point.getInfo();
	new Runner("lineinfo", function(data){
		ed.sdkEditor.setLineInfo({text: data[0], direction: data[1]});
	}).run([info.text, info.direction]);
};

SHATab.prototype.loadFromHistory = function() {
	var ed = this;
	new Runner("history", function(data){
		ed.manager.open("/history/" + data[0], ed.file.name + "(rev: " + data[0] + ")");
	}).run([this.file.location()]);
};

SHATab.prototype.execCommand = function(cmd, data) {
    switch(cmd) {
    	case "addelement":
    		this.sdkEditor.beginAddElement(data);
    		if(this.fEditor) {
    			this.fEditor.beginAddElement(data, this.sdkEditor.cursorNormal);
    			this.sdkEditor.endOperation();
    		}
    		break
    	
        case "run":
        	this.run();
        	if(this.file && !this.saved && window.getOptionBool("opt_save_edit", 0)) {
        		this.saveSDKtoFile();
        	}
        	break;
        case "save":
            if(this.file) {
                this.saveSDKtoFile();
            }
            else {
                commander.execCommand("saveas");
            }
            break;
		case "saveas": fileManager.save(this.file ? this.file.location() : "Project.sha"); break;
        
        case "back":
        	if(this.fEditor) {
        		this.formEditor();
        	}
        	window.history.back();
        	commander.reset();
        	break;
        case "forward": this.sdkEditor.forward(); commander.reset(); break;
        
        case "formedit": this.formEditor(); break;
        
        case "delete": this.sdkEditor.deleteSelected(); break;
        case "copy":
        	buffer = this.sdkEditor.sdk.save(true);
        	if(data) {
        		data.setData('text/plain', buffer);
        	}
        	commander.reset();
        	break;
        case "paste":
        	var text = data ? data.getData("text/plain") : buffer;
        	if(text.substr(0, 4) == "Make" || text.substr(0, 4) == "Add(") {
        		this.sdkEditor.pasteFromText(text);
        	}
        	break;
        
        case "comment": this.sdkEditor.oneditprop(this.sdkEditor.sdk.selMan.items[0].sys["Comment"]); break;
        
        case "slidedown": this.sdkEditor.beginOperation(window.ME_SLIDE_DOWN); break;
        case "slideright": this.sdkEditor.beginOperation(window.ME_SLIDE_RIGHT); break;
        case "selectall": this.sdkEditor.selectAll(); break;
        
        case "bringtofront": this.sdkEditor.bringToFront(); commander.reset(); break;
        case "sendtoback": this.sdkEditor.sendToBack(); commander.reset(); break;
        
        case "makehint": this.sdkEditor.beginOperation(window.ME_MAKE_LH); break;
        case "remove_lh": this.sdkEditor.beginOperation(window.ME_REMOVE_LH); break;
        
        case "zoomin": this.sdkEditor.zoomIn(); this.zoom.position++; commander.reset(); break;
        case "zoomout": this.sdkEditor.zoomOut(); this.zoom.position--; commander.reset(); break;
        
        case "capture": window.open(this.sdkEditor.control.toDataURL("image/png")); break;
        case "sha_source": this.sdkEditor.download(this.file ? this.file.location() : "Project.sha"); break;
        
        case "paste_debug": this.sdkEditor.pasteLineElement("Debug"); break;
        case "paste_dodata": this.sdkEditor.pasteLineElement("DoData"); break;
        case "paste_hub": this.sdkEditor.pasteLineElement("Hub"); break;
        
		case "linecolor": this.setLineColor(); break;
		case "lineinfo": this.setLineInfo(); break;
        
        case "share": new Runner("share", function(){}).run([this.file.location(), 0]); break;
        case "addcatalog": new Runner("catalog", function(){}).run(this.file.location()); break;
        
        case "undo": this.sdkEditor.undo(); commander.reset(); break;
        case "redo": this.sdkEditor.redo(); commander.reset(); break;
        
        case "statistic": this.showStatistic(); break;
        
        case "build": this.build(this.buildMode); break;
        case "make": this.buildMode = data; commander.reset(); break;
		
		case "moveto": this.moveto(); break;
		
		case "bind_rect": this.bindFlags ^= 0x1; this.fEditor.setBindFlags(this.bindFlags); commander.reset(); break;
		case "bind_center": this.bindFlags ^= 0x2; this.fEditor.setBindFlags(this.bindFlags); commander.reset(); break;
		case "bind_padding": this.bindFlags ^= 0x4; this.fEditor.setBindFlags(this.bindFlags); commander.reset(); break;
		
		case "history": this.loadFromHistory(); break;
        
        default:
            DocumentTab.prototype.execCommand.call(this, cmd, data);
    }
};

//------------------------------------------------------------------------------

function CodeTab(file) {
    DocumentTab.call(this, file);
    
	var memo = new Builder().n("div").class("doc-code");
	memo.n("textarea").id("text-edit-form-memo").style("flexGrow", 1);
	this._ctl = memo.element;
}

CodeTab.prototype = Object.create(DocumentTab.prototype);

CodeTab.prototype.init = function() {
	this.editor = CodeMirror.fromTextArea(this._ctl.childNodes[0], {
		lineNumbers: true, // Нумеровать каждую строчку.
		matchBrackets: true,
		mode: "text/javascript",
		indentUnit: 2, // Длина отступа в пробелах.
		indentWithTabs: true,
		enterMode: "keep",
		tabMode: "shift"
	});
	this.editor.focus();
};

CodeTab.prototype.open = function(file) {
	DocumentTab.prototype.open.call(this, file);
	
	if(file) {
		var __editor = this;
		file.read(function(error, data) {
			if(error === 0) {
				__editor.editor.setValue(data);
			}
		});
	}
};

//------------------------------------------------------------------------------

function OggTab(file) {
    DocumentTab.call(this, file);
    
	var audio = new Builder().n("audio").attr("controls", "controls");
	this._ctl = audio.element;
}

OggTab.prototype = Object.create(DocumentTab.prototype);

OggTab.prototype.open = function(file) {
	DocumentTab.prototype.open.call(this, file);
	
	var __editor = this;
	file.readArray(function(error, data){
		if(error === 0) {
			var blob = new Blob([data], {type : 'audio/ogg'});
			var url = URL.createObjectURL(blob);
			__editor._ctl.src = url;
		}
	});
};

//------------------------------------------------------------------------------

function ImageTab(file) {
    DocumentTab.call(this, file);
    
	this.panel = new Panel({theme: "doc-image"});
	this.setLayoutOptions({grow:1});
	this.image = new UIImage({mode: 1});
	this.panel.add(this.image);
	this._ctl = this.panel.getControl();
}

ImageTab.prototype = Object.create(DocumentTab.prototype);

ImageTab.prototype.open = function(file) {
	DocumentTab.prototype.open.call(this, file);

	var __editor = this;
	file.readArray(function(error, data){
		if(error === 0) {
			var blob = new Blob([data], {type : file.mime});
			var url = URL.createObjectURL(blob);
			__editor.image.url = url;
		}
	});
};

//------------------------------------------------------------------------------

function StartupTab(file) {
    DocumentTab.call(this, file);
    
    this.startup = new Builder().n("div").class("startup");
	this.startup.n("div").class("button").style("backgroundImage", "url('img/new.png')").on("onclick", function(){ commander.execCommand('new'); }).html("Create New...");
	this.startup.n("div").class("button").style("backgroundImage", "url('img/folder.png')").on("onclick", function(){ commander.execCommand('open'); }).html("Open exists");
	this._ctl = this.startup.element;
}

StartupTab.prototype = Object.create(DocumentTab.prototype);

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function StatePanel(options) {
	this.list = new Builder().n("div").class("state");
	this._ctl = this.list.element;

	this.setOptions(options);
}

StatePanel.prototype = Object.create(UIControl.prototype);

StatePanel.prototype.set = function(text) {
	this.list.html(text);
};

StatePanel.prototype.add = function(text, color) {
	var line = this.list.n("div").html(text);
	if(color) {
		line.style("color", color);
	}
};

StatePanel.prototype.clear = function() {
	this.list.html('');
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function ShaGraph(options) {
	this.body = new Builder().n("div").class("graph");
	this._ctl = this.body.element;
	
	this.sdkTab = null;
	
	this.setOptions(options);
}

ShaGraph.prototype = Object.create(UIControl.prototype);

ShaGraph.prototype.clear = function() {
	this.body.html('');
};

ShaGraph.prototype.parse = function(sdk) {
	this.clear();
	
	var ed = this;
	
	function parse(sdk, level) {
		for(var e of sdk.imgs) {
			if(e.sdk) {
				var node = ed.body.n("div").class("node").attr("level", level);
				for(var i = 0; i < level; i++)
					node.n("div").class("cell");
				var item = node.n("div").class("item").attr("element", e).on("onclick", function(){
					ed.sdkTab.goInto(this.element);
				});
				item.n("img").attr("src", e.img.src);
				item.n("div").html(e.sys.Comment.value || e.name);
				for(var l = ed.body.childs()-1; l > 0 && ed.body.child(l).level >= level; l--) {
					var cls = ed.body.child(l).childNodes[level-1].className;
					if(cls == "cell")
						ed.body.child(l).childNodes[level-1].className = l == ed.body.childs()-1 ? "tree-end" : "tree";
					else if(cls == "tree-end")
						ed.body.child(l).childNodes[level-1].className = "tree-center";
				}
				parse(e.sdk, level + 1);
			}
		}
	}

	for(var e of sdk.imgs) {
		if(e.flags & IS_PARENT) {
			var node = this.body.n("div").class("node").n("div").class("item").attr("element", e).on("onclick", function(){
				ed.sdkTab.goInto(this.element);
			});
			node.n("img").attr("src", e.img.src);
			node.n("div").html(e.name);
			parse(sdk, 1);
			break;
		}
	}
};

//------------------------------------------------------------------------------

function DocumentManageer(options) {
	UIContainer.call(this);
	
	this._ctl = new Builder().n("div").class("docmanager").element;
	
	this.ontabselect = function(tab){};
	this.ontabopen = function(tab){};
	
	// called by child
	this._ontabopen = function(tab){ if(this.currentTab == tab) this.ontabopen(tab); };
	
	this.setOptions(options);
	this.layout = new VLayout(this, {});
    
    var extMap = [
        { ext: /.*\.sha$/i, tab: SHATab },
        { ext: /.*\.(txt|js|hws|sql|php|ini|html|css|scss)$/i, tab: CodeTab },
        { ext: /.*\.ogg$/i, tab: OggTab },
        { ext: /.*\.(png|jpg|ico|gif|jpeg|bmp)$/i, tab: ImageTab }
    ];
    
    var dm = this;
    
    this.tabs = new TabControl();
	this.add(this.tabs);
	this.tabs.onclose = function(tab) {
	    if(tab.content.close()) {
    	    dm.remove(tab.content);
    	    return true;
	    }
	    
	    return false;
	};
	this.tabs.onselect = function(tab) {
		dm.currentTab.hide();
		dm.currentTab = tab ? tab.content : dm.startup;
		if(dm.currentTab) {
			dm.currentTab.show();
			commander.reset();
			if(dm.graph.visible === "true")
				dm.showGraph(true);
		}

		dm.saveOpenTabs();
		dm.ontabselect(tab ? tab.content : null);
	};
	
	this.graph = new ShaGraph({height: window.localStorage.getItem("prop_graph_height", 140)});
	this.add(this.graph);
	this.splitter2 = new Splitter({edge: 0});
	this.splitter2.setManage(this.graph);
	this.splitter2.onresize = function(){ window.localStorage.setItem("prop_graph_height", dm.graph.height) };
	this.showGraph(false);
	
	this.state = new StatePanel({height: window.localStorage.getItem("prop_state_height", 140)});
	this.add(this.state);
	this.splitter = new Splitter({edge: 0});
	this.splitter.setManage(this.state);
	this.splitter.onresize = function(){ window.localStorage.setItem("prop_state_height", dm.state.height) };
	this.showState(false);
	
	this.startup = new StartupTab("Startup");

    this._showTab = function(tab) {
        this.currentTab = tab;
        this.insert(tab, this.splitter2);
    };

	this.openByType = function(Class, file, title, asnew) {
	    if(file && !asnew) {
	    	console.log("Open: ", file.location());
	    }
	    
        var content = new Class(file);
        content.manager = this;
        var tab = this.tabs.addTab("", "");
        tab.content = content;
        content.tab = tab;
        this._showTab(tab.content);
        tab.content.init();
        tab.content.open(file, asnew);
        tab.content.show();
        tab.title = file ? file.location() : "";
        tab.caption = title || content.getTitle();
		
		this.ontabselect(content);
        
        commander.reset();
        this.saveOpenTabs();
	};
	
	this.openFile = function(file, title) {
		for(var obj of extMap) {
			if(file.name.match(obj.ext)) {
				this.openByType(obj.tab, file, title);
				return;
			}
		}
		
		this.openByType(SHATab, file, title, false);
	};
	
	this.open = function(fileName, title) {
		// tab is already open?
		var fTab = null;
		this.tabs.each(function(tab){
			if(tab.content && tab.content.file && tab.content.file.location() == fileName) {
				fTab = tab;
			}
		});
		
		if(fTab) {
			this.tabs.select(fTab);
		}
		else {
			this.openFile(getFileNode(fileName), title);
		}
	};
	
	this.save = function(file) {
		this.currentTab.save(getFileNode(file));
	};
	
	this.resize = function() {
	    this.tabs.each(function(tab) {
	        tab.content.resize();
	    });
	};
	
	this.execCommand = function(cmd, data) {
		this.currentTab.execCommand(cmd, data);

        switch(cmd) {
            case "new": this.openNew(); break;
            case "output": this.showState(this.state.visible == "false"); break;
            case "build": if(this.state.visible == "false") this.showState(true); break;
			case "showgraph": this.showGraph(this.graph.visible == "false"); break;
       }
	};
	
	this.updateCommands = function(commander) {
		commander.enabled("output");
		commander.enabled("showgraph");

		this.currentTab.updateCommands(commander);
	};
	
	this.openNew = function() {
		var args = [];
		for(var pack in packMan.packs) {
			if(packMan.packs[pack].projects.length) {
				var proj = [];
				for(var p of packMan.packs[pack].projects) {
					proj.push({entry: p, info: packMan.packs[pack].translate("el." + p)});
				}
				args.push({
					name: pack,
					title: packMan.packs[pack].title,
					projects: proj
				});
			}
		}
		var doc = this;
	    new Runner("new", function(data) {
			doc.openByType(SHATab, getFileNode("/pack/" + data[0] + "/new/" + data[1] + ".sha"), "", true);
		}).run(args);
	};
	
	this.saveOpenTabs = function() {
		if(window.getOptionBool("opt_save_tabs", 1)) {
			var openFiles = [];
			this.tabs.each(function(tab){
				if(tab.content && tab.content.file) {
					openFiles.push(tab.content.file.location());
				}
			});
			window.localStorage['opentabs'] = JSON.stringify(openFiles);
		}
	};
	
	this.init = function() {
		if(window.getOptionBool("opt_save_tabs", 1)) {
			var data = window.localStorage['opentabs'];
			if(data) {
				var openFiles = JSON.parse(data);
				for(var file of openFiles) {
					this.open(file);
				}
			}
		}
		else {
			if(window.getOptionBool("opt_new_project", 0)) {
				commander.execCommand("new");
			}
		}
	};
	
	document.body.onbeforeunload = function() {
		var saved = true;
		dm.tabs.each(function(tab){
			if(tab.content) {
				saved = saved && tab.content.saved;
			}
		});
		
		return saved ? null : 'Your most recent changes have not been saved. If you leave before saving, your changes will be lost.';
	};
	
    this._showTab(this.startup);
    
    window.addEventListener("resize", function(){
        dm.resize();
    });
    document.addEventListener("paste", function(e) {
        if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
        	commander.execCommand("paste", e.clipboardData);
			e.preventDefault();
			return false;
		}
		return true;
    });
    document.addEventListener("copy", function(e) {
        if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
        	commander.execCommand("copy", e.clipboardData);
        	e.preventDefault();
			return false;
		}
		return true;
    });
    document.addEventListener("cut", function(e) {
        if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
        	commander.execCommand("copy", e.clipboardData);
        	commander.execCommand("delete");
        	e.preventDefault();
			return false;
		}
		return true;
    });
    
	// drop files
	var __doc = this;
	this.getControl().ondrop = function(event){
		event.preventDefault();
		for(var i = 0; i < event.dataTransfer.files.length; i++) {
			__doc.openFile(new DesktopFSNode(event.dataTransfer.files[i]));
		}
    	
    	this.removeAttribute("drop");
		
		return false;
	};
	this.getControl().ondragover = function(event){
		this.setAttribute("drop", "");
		return false;
	};
	this.getControl().ondragleave = function(event){
		this.removeAttribute("drop");
		return false;
	};
}

DocumentManageer.prototype = Object.create(UIContainer.prototype);

DocumentManageer.prototype.showState = function(value) {
	this.state.setVisible(value);
	this.splitter.setVisible(value);
}

DocumentManageer.prototype.showGraph = function(value) {
	if(value && this.currentTab.sdkEditor) {
		this.graph.parse(this.currentTab.sdkEditor.getMainSDK());
		this.graph.sdkTab = this.currentTab;
	}
	else
		this.graph.clear();
	this.graph.setVisible(value);
	this.splitter2.setVisible(value);
}