namespace Hion {
	//------------------------------------------------------------------------------
	// menu
	export var mainMenu: MainMenu = null;
	export var userMenu: MainMenu = null;
	export var popupElement: PopupMenu = null;
	export var popupSDK: PopupMenu = null;
	export var popupLine: PopupMenu = null;

	//------------------------------------------------------------------------------
	// modules
	export var translate: Translate = null;
	export var palette: Palette = null;
	export var propEditor: PropertyEditor = null;
	export var fileManager: FileManager = null;
	export var commander: Commander = null;
	export var mainToolBar: ToolBar = null;
	export var packMan: PackManager = null;
	export var docManager: DocumentManageer = null;

	export var user = null;

	//------------------------------------------------------------------------------
	// Main workspace

	class Workspace extends UIContainer {
		constructor (options) {
			super(options);

			this._ctl = new Builder().div("ui-workspace").element;
			
			this.setOptions(options);
			this.layout = new HLayout(this, {});
		}
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

	function changeUser() {
		window.location.reload();
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
				edit: ["cut", "paste", "copy", "delete", "-", "bringtofront", "sendtoback", "-", "copy_link", "comment", "-", "moveto", "-", "tools"],
				editor: ["undo", "redo", "-", "slidedown", "slideright", "-", "zoomin", "zoomout", "-", "selectall", "-", "makehint", "remove_lh"],
				view: ["fullscreen", "-", "formedit", "statistic", "-", "history", "-", "output", "showgraph"],
				help: ["forum", "help", "-", "opencatalog", "mail", "sendbug", "-", "about"]
			};
			mainMenu = createMainmenu(mmCommands);
			userMenu = new Hion.MainMenu([{
				title: user.login,
				items: makeItems(["login", "profile", "-", "plan", "-", "logout"])
			}]);
			
			var propsToolBar = new ToolBar([{
				icon: 40,
				title: "",
				click: function() { propEditor.visible = true; }
			}]);
			
			$("toolbar").appendChild(mainMenu.getControl());
			$("toolbar").appendChild(mainToolBar.getControl());
			$("toolbar").appendChild(new Builder().n("div").class("separator").element);
			$("toolbar").appendChild(new Builder().n("div").class("user").append(userMenu.getControl()).element);
			$("toolbar").appendChild(new Builder().n("div").class("hion").attr("title", CONFIG_VERSION).element);
			$("toolbar").appendChild(propsToolBar.getControl());
		
			commander.reset();

			fileManager.updateUser();

			docManager.init();

			$("splash").parentNode.removeChild($("splash"));
			
			if(window.location.hash.startsWith("#/public") || window.location.hash.startsWith("#/examples") || window.location.hash.startsWith("#/pack")) {
				docManager.open(window.location.hash.substring(1), "");
			}
		};
		var packList = [];
		loader.add(new LoaderTask(function(){
			$.get("/pack/list.txt", function(data, task) {
				packList = data.trim().split("\n");
				task.taskComplite("Pack list loaded.");
			}, this);
		}));
		loader.add(new LoaderTask(function(){
			$.get(API_CONFIG_URL, function(data, task) {
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
			_T = translate.translate;
			translate.onload = () => this.taskComplite("Translate loaded.");
			translate.load();
		}));
		loader.add(new LoaderTask(function(){
			packMan = new PackManager();
			packMan.onload = () => this.taskComplite("Packs load.");
			packMan.task = this;
			packMan.load(packList);
		}));

		loader.run();

		palette = new Palette({width: getOptionInt("palette_width", 142)});
		palette.onselect = function(obj) {
			commander.execCommand("addelement", obj);
		};
		workspace.add(palette);
		var splitter = new Splitter({edge: 3});
		splitter.setManage(palette);
		splitter.onresize = function(){ setOptionInt("palette_width", palette.width) };
		
		docManager = new DocumentManageer({});
		docManager.ontabselect = docManager.ontabopen = function(tab){
			if(tab && tab.sdkEditor && tab.sdkEditor.sdk) {
				// set palette elements
				var pack = tab.sdkEditor.sdk.pack;
				palette.view(pack);

				// set make menu
				if(pack.make) {
					var btn = mainToolBar.getButtonByTag("build");
					var items = [];
					for(var make of pack.make) {
						items.push({
							title: make.name,
							command: make.cmd,
							checked: make.selected,
							click: function() {
								commander.execCommand("make", this.command);
							}
						});
					}
					btn.setSubMenu(items);
				}
			}
			else {
				palette.view(null);
			}
		};
		workspace.add(docManager);

		propEditor = new PropertyEditor({width: getOptionInt("prop_width", 173)});
		workspace.add(propEditor);
		var splitter = new Splitter({edge: 1, theme: "prop-splitter"});
		splitter.setManage(propEditor);
		splitter.onresize = () => setOptionInt("prop_width", propEditor.width);

		fileManager = new FileManager();
		fileManager.onfilename = function(fileName){
			if(fileManager.openSave) {
				docManager.save(fileName);
			}
			else {
				docManager.open(fileName, "");
			}
			fileManager.close();
		};
		fileManager.onerror = (error) => displayError(error);
		
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
					$.get(API_LOGOUT_URL, function(data) {
						changeUser();
					});
				}
			},
			profile: {
				icon: 55, def: true,
				exec: function() {
					window.open(CONFIG_PROFILE + user.uid, '_blank');
				}
			},
			cut: { icon: 42, exec: function(){ this.execCommand("copy").execCommand("delete"); } },
			copy: { icon: 27 },
			comment: { icon: 33 },
			paste: { icon: 30 },
			copy_link: {},
			slidedown: { icon: 18 },
			slideright: { icon: 15 },
			selectall: { },
			forum: {
				def: true,
				exec: function() { window.open(CONFIG_FORUM, '_blank'); }
			},
			mail: {
				def: true, icon: 1,
				exec: function() { window.location.href =  "mailto:" + CONFIG_EMAIL; }
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
				exec: function(){ window.open(CONFIG_BUG_REPORT, '_blank'); }
			},
			addcatalog: { },
			opencatalog: { icon: 13, def: true,
				exec: function() {
					window.open(CONFIG_APP_CATALOG, '_blank');
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
			help: { icon: 3, def: true,
				exec: function() {
					window.open(CONFIG_HELP, '_blank');
				}
			},
			sha_pas: { key: 70, ctl: true }
		} as any);
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
					this.checked(index, commander.isChecked(item.command));
				});
			}
			updatePopup(popupElement);
			updatePopup(popupSDK);
			mainToolBar.each(function(item){
				item.enabled = commander.isEnabled(item.tag);
				item.checked = commander.isChecked(item.tag);
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
}