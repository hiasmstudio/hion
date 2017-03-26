'use strict';

//vars
var mainMenu = null;
var userMenu = null;
var popupElement = null;
var popupSDK = null;
var popupLine = null;

var translate = null;
var palette = null;
var propEditor = null;
var fileManager = null;
var commander = null;
var mainToolBar = null;
var packMan = null;
var infoPanel = new InfoPanel();
var docManager = null;

var user = null;

var KEY_DELETE = 46;

//------------------------------------------------------------------------------
// Main workspace

function Workspace(options) {
	UIContainer.call(this);
	
	this._ctl = new Builder().n("div").class("ui-workspace").element;
	
	this.setOptions(options);
	this.layout = new HLayout(this, {});
}

Workspace.prototype = Object.create(UIContainer.prototype);

//------------------------------------------------------------------------------

function readProperty(data, point, prop) {
	if(point.point)
		return point.point.onevent(data);
	else if(prop)
		return prop;
	else if(data)
		return data;
	return ""; 
}
 
function readInt(data, point, prop) {
	var p = parseInt(prop);
	if(point && point.point)
		return parseInt(point.point.onevent(data));
	else if(prop)
		return p;
	else if(data)
		return parseInt(data);
	return 0;
}

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

function toStep(v) { return v < 0 ? Math.ceil(v/7)*7 : Math.floor(v/7)*7; }

function printError(text) {
	new Builder($("state")).n("div").html(text);
}

function makeItems(peCommands) {
	var items = [];
	for(var i in peCommands) {
		var cmd = peCommands[i];
		if(cmd === "-") {
			items.push({title: cmd});
		}
		else {
			items.push({
				icon: commander.haveIcon(cmd),
				title: commander.getCaption(cmd),
				command: cmd,
				click: function() {
					commander.execCommand(this.command);
				}
			});
		}
	}
	return items;
}

function createPopup(peCommands) {
	return new PopupMenu(makeItems(peCommands));
}

function createMainmenu(mmCommands) {
	var mmMenu = [];
 	for(var mItem in mmCommands) {
 		mmMenu.push({
 			title: translate.translate("menu." + mItem),
 			items: makeItems(mmCommands[mItem])
 		});
 	}
 	return new MainMenu(mmMenu);
}

function displayError(error) {
	var text = "Unknown error, code = " + error.code + (error.info ? ", " + error.info : "");
	var code = "error." + error.code;
	var tText = translate.translate(code);
	
	infoPanel.error(tText === code ? text : tText + (error.info ? ": " + error.info : ""));
}

function changeUser() {
	window.location.reload();
}

function Runner(project, callback) {
	this.run = function(args, overrideCallback) {
		if(this.sdk) {
			this.sdk.run(window.FLAG_USE_RUN);
			if(this.e && args) {
				if(callback || overrideCallback) {
					this.e.onreturn = callback || overrideCallback;
				}
				this.e.onInit.call(args);
			}
		}
		else {
			var __run = this;
			$.get((project.indexOf("/") >= 0 ? project : "gui/" + project) + ".sha", function(data) {
				var sdk = new SDK(packMan.getPack("webapp"));
//				sdk.clearProject();
				sdk.load(data);
				sdk.run(window.FLAG_USE_RUN);
				var e = sdk.getElementById("hcTransmitter");
				if(e) {
					if(callback || overrideCallback) {
						e.onreturn = callback || overrideCallback;
					}
					if(args) {
						e.onInit.call(args);
					}
				}
				__run.sdk = sdk;
				__run.e = e;
			});
		}
	};
}

function loadWorkspace() {
	var workspace = new Workspace({});
	workspace.appendTo($("workspace"));
	
	var loader = new Loader({havestate: true});
	loader.onload = function() {
		var tbcommands = ["-", "new", "open", "save", "saveas", "-", "formedit", "bind_rect", "bind_center", "bind_padding", "-", "back", "forward", "-", "delete", "-", "run", "build", "-", "about"];
		var buttons = [];
		for(var i in tbcommands) {
			var cmd = tbcommands[i];
			if(cmd === "-") {
				buttons.push({title: "-"});
			}
			else {
				buttons.push({
					icon: commander.haveIcon(cmd),
					tag: cmd,
					title: commander.getTitle(cmd),
					click: function() { commander.execCommand(this.tag); }
				});
			}
		}
		mainToolBar = new ToolBar(buttons);
	
		popupElement = createPopup(["copy", "cut", "comment", "-", "delete", "-", "bringtofront", "sendtoback"]);
		popupSDK = createPopup(["paste", "selectall", "statistic", "-", "undo", "redo"]);
		popupLine = createPopup(["paste_debug", "paste_dodata", "paste_hub", "-", "linecolor", "lineinfo"]);

	 	var mmCommands = {
	 		file: ["new", "open", "save", "saveas", "-", "share", "addcatalog", "-", "capture", "sha_source"],
	 		edit: ["cut", "paste", "copy", "delete", "-", "bringtofront", "sendtoback", "-", "comment", "-", "moveto", "-", "tools"],
	 		editor: ["undo", "redo", "-", "slidedown", "slideright", "-", "zoomin", "zoomout", "-", "selectall", "-", "makehint", "remove_lh"],
	 		view: ["fullscreen", "-", "formedit", "statistic", "-", "history", "-", "output", "showgraph"],
	 		help: ["forum", "opencatalog", "mail", "sendbug", "-", "about"]
	 	};
		mainMenu = createMainmenu(mmCommands);
		userMenu = new MainMenu([{
			title: user.login,
			items: makeItems(["login", "profile", "-", "plan", "-", "logout"])
		}]);
		
		var propsToolBar = new ToolBar([{
			icon: 40,
			title: "",
			click: function() { propEditor.visible = true; }
		}]);
		
		$("toolbar").appendChild(mainMenu.control);
		$("toolbar").appendChild(mainToolBar.getControl());
		$("toolbar").appendChild(new Builder().n("div").class("separator").element);
		$("toolbar").appendChild(new Builder().n("div").class("user").append(userMenu.control).element);
		$("toolbar").appendChild(new Builder().n("div").class("hion").attr("title", "hion v1.5.2").element);
		$("toolbar").appendChild(propsToolBar.getControl());
	
		commander.reset();

		fileManager.updateUser();

		docManager.init();

		$("splash").parentNode.removeChild($("splash"));
		
		if(window.location.hash.startsWith("#/public")) {
			docManager.open(window.location.hash.substring(1));
		}
	};
	loader.add(new LoaderTask(function(){
		$.get("server/core.php?cfg", function(data, task) {
			try {
				user = JSON.parse(data);
			}
			catch(e) {
				console.error("Config load failed")
				user = {login: "guest", uid: 1};
			}
			task.taskComplite("Config loaded.");
		}, this);
	}));
	loader.add(new LoaderTask(function(){
		translate = new Translate();
		window._T = translate.translate;
		translate.task = this;
		translate.onload = function(){
			this.task.taskComplite("Translate loaded.");
			delete this.task;
		};
		translate.load();
	}));
	loader.add(new LoaderTask(function(){
		packMan = new PackManager();
		packMan.onload = function() {
			this.task.taskComplite("Packs load.");
			delete this.task;
		};
		packMan.task = this;
		packMan.load(["base", "webapp", "modules"]);
	}));

	loader.run();

	palette = new Palette({width: window.localStorage.getItem("palette_width", 142)});
	palette.onselect = function(obj) {
		commander.execCommand("addelement", obj);
	};
	workspace.add(palette);
	var splitter = new Splitter({edge: 3});
	splitter.setManage(palette);
	splitter.onresize = function(){ window.localStorage.setItem("palette_width", palette.width) };
	
	docManager = new DocumentManageer({});
	docManager.ontabselect = docManager.ontabopen = function(tab){
		if(tab && tab.sdkEditor && tab.sdkEditor.sdk) {
			// set palette elements
			var pack = tab.sdkEditor.sdk.pack;
			palette.show(pack);

			// set make menu
			if(pack.make) {
				var btn = mainToolBar.getButtonByTag("build");
				var items = [];
				for(var make of pack.make) {
					items.push({
						title: make.name,
						cmd: make.cmd,
						click: function() {
							commander.execCommand("make", this.command);
						}
					});
				}
				btn.setSubMenu(items);
			}
		}
		else {
			palette.show(null);
		}
	};
	workspace.add(docManager);

	propEditor = new PropertyEditor({width: window.localStorage.getItem("prop_width", 173)});
	workspace.add(propEditor);
	var splitter = new Splitter({edge: 1, theme: "prop-splitter"});
	splitter.setManage(propEditor);
	splitter.onresize = function(){ window.localStorage.setItem("prop_width", propEditor.width) };

	fileManager = new FileManager();
	fileManager.onfilename = function(fileName){
		if(fileManager.openSave) {
			docManager.save(fileName);
		}
		else {
			docManager.open(fileName);
		}
		fileManager.form.close();
	};
	fileManager.onerror = function(error) {
		displayError(error);
	};
	
	commander = new Commander({
		new: {
			def: true, icon: 19,
			key: 78, ctl: true // don't work...
		},
		open: {
			def: true, icon: 8,
			exec: function() { fileManager.open(); }
		},
		save: {
			icon: 43,
			key: 83, ctl: true
		},
		saveas: { icon: 39 },
		back: { icon: 5	},
		forward: { icon: 20 },
		formedit: { icon: 24 },
		delete: { icon: 9, key: KEY_DELETE },
		run: { icon: 21	},
		about: {
			icon: 26,
			def: true,
			exec: function() {
				new Runner("about").run();
			}
		},
		login: {
			icon: 54,
			exec: function() {
				new Runner("login", changeUser).run();
			}
		},
		plan: {
			def: true,
			exec: function() {
				new Runner("plan").run();
			}
		},
		logout: {
			exec: function() {
				$.get("/server/core.php?logout", function(data) {
					changeUser();
				});
			}
		},
		profile: {
			icon: 55, def: true,
			exec: function() {
				window.open("http://forum.hiasm.com/profilemain/" + user.uid, '_blank');
			}
		},
		cut: { icon: 42, exec: function(){ this.execCommand("copy").execCommand("delete"); } },
		copy: { icon: 27 },
		comment: { icon: 33 },
		paste: { icon: 30 },
		slidedown: { icon: 18 },
		slideright: { icon: 15 },
		selectall: { },
		forum: {
			def: true,
			exec: function() { window.open("http://forum.hiasm.com", '_blank'); }
		},
		mail: {
			def: true, icon: 1,
			exec: function() { window.location.href =  "mailto:support@hiasm.com"; }
		},
		bringtofront: { icon: 37 },
		sendtoback: { icon: 51 },
		makehint: { icon: 44 },
		remove_lh: { icon: 38 },
		zoomin: { icon: 29 },
		zoomout: { icon: 49 },
		capture: { icon: 11 },
		sha_source: { },
		paste_debug: { icon: 10, def: true },
		paste_dodata: { icon: 2, def: true },
		paste_hub: { icon: 14, def: true },
		addelement: {},
		share: { icon: 56 },
		undo: { icon: 23, key: 90, ctl: true },
		redo: { icon: 34 },
		statistic: { icon: 45 },
		tools: {
			icon: 4, def: true,
			exec: function() {
				new Runner("settings", function(){ /* update options */ }).run();
			}
		},
		build: { icon: 58 },
		history: { },
		make: { },
		output: {  },
		moveto: {  },
		bind_rect: { icon: 41 },
		bind_center: { icon: 36 },
		bind_padding: { icon: 46 },
		linecolor: { icon: 32 },
		lineinfo: { def: true },
		showgraph: { def: false },
		sendbug: {
			def: true,
			exec: function(){ window.open("http://forum.hiasm.com/userissues/0#7", '_blank'); }
		},
		addcatalog: { },
		opencatalog: { icon: 13, def: true,
			exec: function() {
				window.open("http://apps.hiasm.com/main/", '_blank');
			}
		},
		fullscreen: { def: true,
			exec: function() {
				if(isInFullscreen())
					fullScreenCancel();
				else
					fullScreen(document.body);
			}
		},
	});
	commander.onupdate = function() {
		docManager.updateCommands(commander);

		if(user.uid === 1) {
			this.enabled("login");
		}
		else {
			this.enabled("logout");
		}
		
		function updatePopup(menu) {
			menu.each(function(index, item){
				this.enabled(index, commander.isEnabled(item.command));
			});
		}
		updatePopup(popupElement);
		updatePopup(popupSDK);
		mainToolBar.each(function(item){
			item.enabled = commander.isEnabled(item.tag);
			item.checked = commander.isChecked(item.tag);
//			if(item.haveSubMenu()) {
//				item.submenu.each(function(index, item){
//					this.enabled(index, commander.isEnabled(item.command));
//					this.checked(index, commander.isChecked(item.command));
//				});
//			}
		});
		var i = 0;
		while(mainMenu.menuItem(i)) {
			updatePopup(mainMenu.menuItem(i++).menu);
		}
		i = 0;
		while(userMenu.menuItem(i)) {
			updatePopup(userMenu.menuItem(i++).menu);
		}
	};
	commander.onexec = function(command, data) {
		docManager.execCommand(command, data);
	};
}

window.addEventListener("keydown", function(event){
	// console.log(event.keyCode)
	if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") && commander.execShortCut(event)) {
		event.preventDefault();
		return false;
	}
	return true;
});

window.onload = loadWorkspace;

window.getOption = function(name, defValue) {
	return window.localStorage["gv_" + name] || defValue;
};

window.getOptionBool = function(name, defValue) {
	return parseInt(window.getOption(name, defValue)) === 1;
};

window.getOptionInt = function(name, defValue) {
	return parseInt(window.getOption(name, defValue));
};

// Fullscreen WEB API polyfill
function fullScreen(element) {
  if(element.requestFullscreen) {
    element.requestFullscreen();
  } else if(element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if(element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  }
}

function fullScreenCancel() {
  if(document.exitFullscreen) {
    document.exitFullscreen();
  } else if(document.webkitExitFullscreen ) {
    document.webkitExitFullscreen();
  } else if(document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  }
}

function isInFullscreen() {
	return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
}