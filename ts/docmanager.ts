namespace Hion {

	export class DocumentTab extends UIControl {
		protected manager: DocumentManageer;
		protected tab: Tab;
		public saved: boolean;
		public file: FSNode;

		constructor (options) {
			super(options);

			this.manager = null;
			this.tab = null;
			this.saved = true;
		}

		open(file: FSNode, asnew: boolean) { if(!asnew) this.file = file; }
		save(file: FSNode) { this.file = file; }
		init() {}
		resize() {}
		close(): boolean {
			if(this.saved || confirm("Are you sure?")) {
				this.hide();
				return true;
			}
			return false;
		}
		getTitle(): string {
			if(this.file) {
				var fName = this.file.name;
				var i = fName.indexOf(".");
				return i > 0 ? fName.substr(0, i) : fName;
			}
			
			return "";
		}

		show() { this.getControl().show(); }
		hide() { this.getControl().hide(); }

		updateCommands(commander) {}
		execCommand(cmd, data) {}
	}

	//------------------------------------------------------------------------------

	var buffer = "";
	var hintLink = null;

	class SHATab extends DocumentTab {
		private container: Panel;
		private loader: UILoader;
		private statusBar: Panel;
		private address: Panel;
		private zoom: TrackBar;
		public sdkEditor: SdkEditor;
		private fEditor: FormEditor;

		private bindFlags: number;
		private runners = {};
		private runapp: Window;

		constructor(options) {
			super(options);
			
			this.container = new Panel({theme: "doc-sha"});
			this.container.layout = new VLayout(this.container, {});
			this.sdkEditor = new SdkEditor({});
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

			this.zoom.addListener("input", () => {
				this.sdkEditor.zoom(0.25 * (1 << this.zoom.position));
				commander.reset();
			});
			this.statusBar.add(this.zoom);
			
			this.bindFlags = 0;
		}

		getTitle(): string {
			return super.getTitle() || "Project";
		}

		private createFromData(data: string) {
			var sdk = new MSDK(packMan.getPack("webapp"));
			this.sdkEditor.edit(sdk);
			//this.sdkEditor.createNew();
			if(data) {
				this.sdkEditor.loadFromText(data, "");
			}
			this.loader.free();
			this.sdkEditor.show();
			this.statusBar.show();
			this.resize();
		}

		open(file: FSNode, asnew: boolean) {
			super.open(file, asnew);
			
			this.tab.load(true);
			file.read((error: number, data: string) => {
				if(error === 0) {
					this.createFromData(data);
					this.tab.load(false);
					this.tab.icon = this.sdkEditor.sdk.pack.getSmallIcon();
					commander.reset();
					this.manager._ontabopen(this);
				}
				else {
					displayError({code: error, info: file.location()});
				}
			});
		}

		save(file: FSNode) {
			super.save(file);

			this.saveSDKtoFile();
		}

		init() {
			this.resize();
			
			this.sdkEditor.onselectelement = (selMan) => {
				propEditor.edit(selMan);
				if(this.fEditor) {
					this.fEditor.update();
				}
				commander.reset();
			};
			this.sdkEditor.onstatuschange = (text) => {
				$("state").innerHTML = text;
			};
			this.sdkEditor.onpopupmenu = (type: PopupMenuType, x, y, obj) => {
				switch(type) {
					case PopupMenuType.POPUP_MENU_ELEMENT:
						popupElement.up(x, y);
						break;
					case PopupMenuType.POPUP_MENU_SDK:
						popupSDK.up(x, y);
						break;
					case PopupMenuType.POPUP_MENU_HINT_LINK:
						var items = [];
						for(var collection of [obj.e.props, obj.e.sys]) {
							for(let p in collection) {
								let prop = collection[p];
								items.push({
									title: prop.name,
									click: () => {
										obj.prop = prop; //obj.e.props[this.title] || obj.e.sys[this.title];
										this.sdkEditor.draw();
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
					case PopupMenuType.POPUP_MENU_LINE:
						popupLine.up(x, y);
						break;
				}
			};
			this.sdkEditor.oneditprop = (prop) => propEditor.onadveditor(prop as any);
			this.sdkEditor.onsdkchange = () => {
				if(this.saved) {
					this.saved = false;
					commander.reset();
				}
			};
			this.sdkEditor.onsdkselect = () => this.updateAddress();
		}

		resize() {
			this.sdkEditor.resize();
		}

		show() {
			super.show();
			
			this.sdkEditor.getControl().focus();
			//setTimeout(function(){console.log(__editor__.sdkEditor.getControl()); __editor__.sdkEditor.getControl().focus();}, 2);
			
			propEditor.onpropchange = (prop) => {
				this.sdkEditor.draw();
				this.sdkEditor.onsdkchange();
				
				if(this.fEditor) {
					this.fEditor.update();
				}
			};
			var __editor__ = this;
			propEditor.onadveditor = function(item) {
				let e = __editor__.sdkEditor.sdk.selMan.items[0];
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
					if(!__editor__.runners[key]) {
						__editor__.runners[key] = new Runner(customEditor.path + customEditor.name);
					}
					__editor__.runners[key].run([item.name, item.value, e.props], function(data) {
						__editor__.sdkEditor.sdk.selMan.setProp(item.name, data[0]);
						__editor__.sdkEditor.onselectelement(__editor__.sdkEditor.sdk.selMan);
						propEditor.onpropchange(null);
					});
				}
				else {
					var m = new Builder().n("div");
					let e = m.n("div").style("flexGrow", 1);
					m.render();
					var editor = CodeMirror(e.element, {
						value: item.value.toString(),
						lineNumbers: getOptionBool("opt_ce_line_numbers", 1),
						lineWrapping: getOptionBool("opt_ce_line_wrapping", 0),
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
		}

		hide() {
			super.hide();
			
			propEditor.onpropchange = () => {};
			propEditor.onadveditor = () => {};
			propEditor.edit(null);
		}

		goInto(element: SdkElement) {
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
		}

		updateAddress() {
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
					let _sdk = sdk;
					l.addListener("click", () => {
						if(this.fEditor) {
							this.formEditor();
						}
						this.sdkEditor.edit(_sdk);
					});
				}
				sdk = sdk.parent;
			}
		}

		updateCommands(commander: Commander) {
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
					if(user.plan.share == 1)
						commander.enabled("share");
					if(user.plan.history == 1)
						commander.enabled("history");
					if(user.plan.catalog == 1)
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
				
				if(this.sdkEditor.sdk.pack.getSelectedMake()) {
					commander.enabled("build");
					commander.enabled("make");
				}
			}
			
			if(this.sdkEditor.sdk && !this.sdkEditor.sdk.selMan.isEmpty()) {
				commander.enabled("cut");
				commander.enabled("copy");
				commander.enabled("delete");
				if(this.sdkEditor.sdk.selMan.size() == 1) {
					commander.enabled("comment");
					commander.enabled("copy_link");
				}
				commander.enabled("sha_pas");
			}  

			if(this.sdkEditor.canBack()) {
				commander.enabled("back");
			}
			if(this.sdkEditor.canForward()) {
				commander.enabled("forward");
			}
		}

		private saveSDKtoFile() {
			this.tab.save(true);
			this.file.write(this.sdkEditor.getMainSDK().save(false), (error) => {
				if(error === 0) {
					this.saved = true;
					commander.reset();
					this.tab.caption = this.getTitle();
					this.tab.title = this.file.location();
				}
				else {
					displayError({code: error});
					if(error == 6)
						new Runner("plan").run();
				}
				this.tab.save(false);
			});
		}

		formEditor() {
			if(this.fEditor) {
				this.fEditor.edit(null);
				this.fEditor = null;
				this.sdkEditor.show();
				this.resize();
			}
			else {
				this.fEditor = new Hion.FormEditor(this.sdkEditor);
				this.fEditor.setBindFlags(this.bindFlags);
				var ctl = this.fEditor.edit(this.sdkEditor.sdk);
				if(ctl) {
					this.sdkEditor.hide();
					this.container.insert(ctl, this.container.get(1));
					this.fEditor.update();
				}
			}
			commander.reset();
		}

		showStatistic() {
			var stat: Array<[string, number]> = [
				[translate.translate("ui.statecount"), 0],
				[translate.translate("ui.statincursdk"), 0],
				[translate.translate("ui.statsdknum"), 0],
				[translate.translate("ui.statintel"), 0],
				[translate.translate("ui.statlinkednum"), 0],
				[translate.translate("ui.statlinkedpoints"), 0]
			];
			
			function fill(sdk: SDK) {
				if(sdk) {
					stat[0][1] += sdk.imgs.length;
					for(let e of sdk.imgs) {
						if(e instanceof ITElement || e instanceof HubsEx || e instanceof Debug) {
							stat[3][1]++;
						}
						if(e.isLink() && !e.isMainLink()) {
							stat[4][1]++;
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
		}

		moveto() {
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
						var newe = e.sdk.findElementById(point.id);
						var newp = newe.findPointByName(point.name);
						newp.connect(e.sdk.imgs[0].getFirstFreePoint(newp.getPair())).createPath();
						
						point.point.clear();
						point.point.connect(e.getFirstFreePoint(point.point.getPair())).createPath();
					}
				}
				
				sdke.draw();
			}).run(list);
		}

		build(mode: string, callback?:() => void) {
			if(user.plan.builds <= user.plan.totalbuilds) {
				new Runner("plan").run();
				return;
			}
				
			this.manager.state.set("Build...");
			var state = this.manager.state;
			var name = this.file ? this.file.name : "Project.sha";
			this.sdkEditor.build();
			$.post(API_BUILD_URL, {
					build: name,
					mode: mode,
					code: this.sdkEditor.getMainSDK().save(false)
				},
				function(data: string, file) {
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
		}

		run() {
			var run = this.sdkEditor.sdk.pack.run;
			if(run.mode == "internal")
				this.sdkEditor.run();
			else if(run.mode == "url") {
				var url = run.url.replace("%uid%", user.uid).replace("%pname%", this.getTitle().toLowerCase());
				this.build(this.sdkEditor.sdk.pack.getSelectedMake(), () => {
					if(!this.runapp || this.runapp.closed)
						this.runapp = window.open(window.location.origin + url + "?b=" + this.sdkEditor.getBuild());
					else
						this.runapp.location.href = window.location.origin + url + "?b=" + this.sdkEditor.getBuild();
				});
			}
		}

		setLineColor() {
			new Runner("coloreditor", (data) => {
				this.sdkEditor.setLineColor(data[0]);
			}).run(this.sdkEditor.pasteObj.point.getColor());
		}

		setLineInfo() {
			var info = this.sdkEditor.pasteObj.point.getInfo();
			new Runner("lineinfo", (data) => {
				this.sdkEditor.setLineInfo({text: data[0], direction: data[1]});
			}).run([info.text, info.direction]);
		}

		loadFromHistory() {
			new Runner("history", (data) => {
				this.manager.open("/history/" + data[0], this.file.name + "(rev: " + data[0] + ")");
			}).run([this.file.location()]);
		}

		execCommand(cmd: string, data: any) {
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
					if(this.file && !this.saved && getOptionBool("opt_save_edit", 0)) {
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
				case "copy_link":
					buffer = this.sdkEditor.sdk.saveLink();;
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
				
				case "slidedown": this.sdkEditor.beginOperation(ME_SLIDE_DOWN); break;
				case "slideright": this.sdkEditor.beginOperation(ME_SLIDE_RIGHT); break;
				case "selectall": this.sdkEditor.selectAll(); break;
				
				case "bringtofront": this.sdkEditor.bringToFront(); commander.reset(); break;
				case "sendtoback": this.sdkEditor.sendToBack(); commander.reset(); break;
				
				case "makehint": this.sdkEditor.beginOperation(ME_MAKE_LH); break;
				case "remove_lh": this.sdkEditor.beginOperation(ME_REMOVE_LH); break;
				
				case "zoomin": this.sdkEditor.zoomIn(); this.zoom.position++; commander.reset(); break;
				case "zoomout": this.sdkEditor.zoomOut(); this.zoom.position--; commander.reset(); break;
				
				case "capture": this.sdkEditor.saveAsPNG(); break;
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
				
				case "build": this.build(this.sdkEditor.sdk.pack.getSelectedMake()); break;
				case "make": this.sdkEditor.sdk.pack.selectMake(data); commander.reset(); break;
				
				case "moveto": this.moveto(); break;
				
				case "bind_rect": this.bindFlags ^= 0x1; this.fEditor.setBindFlags(this.bindFlags); commander.reset(); break;
				case "bind_center": this.bindFlags ^= 0x2; this.fEditor.setBindFlags(this.bindFlags); commander.reset(); break;
				case "bind_padding": this.bindFlags ^= 0x4; this.fEditor.setBindFlags(this.bindFlags); commander.reset(); break;
				
				case "history": this.loadFromHistory(); break;

				case "sha_pas": this.manager.open(this.sdkEditor.sdk.pack.getCodeFilename(this.sdkEditor.sdk.selMan.items[0].name), ""); break;
				
				default:
					super.execCommand(cmd, data);
			}
		}
	}

	//------------------------------------------------------------------------------

	class CodeTab extends DocumentTab {
		private editor: any;

		constructor (options) {
			super(options);
			
			var memo = new Builder().div("doc-code");
			memo.n("textarea").style("flexGrow", 1);
			this._ctl = memo.element;
			this.saved = true;
		}
		init() {}

		open(file: FSNode, asnew: boolean) {
			super.open(file, asnew);
			
			var mime = null;
			
			var mimes = [
				{ext: /.*\.(js|ts)$/i, mime: "text/javascript"},
				{ext: /.*\.(hws)$/i, mime: "text/hws"},
				{ext: /.*\.(css|scss)$/i, mime: "text/css"}
			];
			for(var e of mimes) {
				if(file.name.match(e.ext)) {
					mime = e.mime;
					break;
				}
			}

			this.editor = CodeMirror.fromTextArea(this._ctl.childNodes[0], {
				lineNumbers: true, // Нумеровать каждую строчку.
				matchBrackets: true,
				mode: mime,
				indentUnit: 4, // Длина отступа в пробелах.
				indentWithTabs: true,
				enterMode: "keep",
				tabMode: "shift"
			});
			this.editor.focus();
			
			var first = true;
			this.editor.on("change", () => {
				if(first) {
					first = false;
					return;
				}
				this.saved = false;
				commander.reset();
			});

			if(file) {
				this.tab.save(true);
				file.read((error, data) => {
					if(error === 0) {
						this.editor.setValue(data);
						this.tab.save(false);
					}
				});
			}

			this.tab.icon = "/img/icons/sha_pas.png";
		}

		updateCommands(commander: Commander) {
			if(!this.saved)
				commander.enabled("save");
		}

		execCommand(cmd, data) {
			switch(cmd) {
				case "save":
					this.save();
					break;
			}
		}

		save() {
			this.tab.save(true);
			this.file.write(this.editor.getValue(), (error) => {
				if(error === 0) {
					this.saved = true;
					commander.reset();
					// __editor.tab.caption = __editor.getTitle();
					// __editor.tab.title = __editor.file.location();
				}
				else {
					displayError({code: error});
				}
				this.tab.save(false);
			});
		}
	}

	//------------------------------------------------------------------------------

	class OggTab extends DocumentTab {
		constructor (options) {
			super(options);
		
			var audio = new Builder().n("audio").attr("controls", "controls");
			this._ctl = audio.element;
		}
		
		open(file: FSNode, asnew: boolean) {
			super.open(file, asnew);
			
			file.readArray((error, data) => {
				if(error === 0) {
					var blob = new Blob([data], {type : 'audio/ogg'});
					var url = URL.createObjectURL(blob);
					(this._ctl as HTMLAudioElement).src = url;
				}
			});
		};
	}

	//------------------------------------------------------------------------------

	class ImageTab extends DocumentTab {
		private panel: Panel;
		private image: UIImage;

		constructor (options) {
			super(options);
		
			this.panel = new Panel({theme: "doc-image"});
			this.setLayoutOptions({grow:1});
			this.image = new UIImage({mode: 1});
			this.panel.add(this.image);
			this._ctl = this.panel.getControl();
		}

		open(file: FSNode, asnew: boolean) {
			super.open(file, asnew);

			file.readArray((error, data) => {
				if(error === 0) {
					var blob = new Blob([data], {type : file.mime});
					var url = URL.createObjectURL(blob);
					this.image.url = url;
				}
			});
		}
	}

	//------------------------------------------------------------------------------

	class StartupTab extends DocumentTab {
		constructor (options) {
			super(options);
		
			let startup = new Builder().div("startup");
			startup.div("button").style("backgroundImage", "url('img/new.png')").on("onclick", () => commander.execCommand('new')).html("Create New...");
			startup.div("button").style("backgroundImage", "url('img/folder.png')").on("onclick", () => commander.execCommand('open')).html("Open exists");
			this._ctl = startup.element;
		}
	}

	//------------------------------------------------------------------------------
	//------------------------------------------------------------------------------
	//------------------------------------------------------------------------------

	class StatePanel extends UIControl {
		private list: Builder;

		constructor (options) {
			super(options);

			this.list = new Builder().div("state");
			this._ctl = this.list.element;

			this.setOptions(options);
		}

		set(text) {
			this.list.html(text);
		}

		add(text: string, color?: string) {
			var line = this.list.n("div").html(text);
			if(color) {
				line.style("color", color);
			}
		}

		clear() {
			this.list.html('');
		}
	}

	//------------------------------------------------------------------------------
	//------------------------------------------------------------------------------
	//------------------------------------------------------------------------------

	class ShaGraph extends UIControl {
		private body: Builder;
		public sdkTab: SHATab;

		constructor (options) {
			super(options);

			this.body = new Builder().div("graph");
			this._ctl = this.body.element;
			
			this.sdkTab = null;
			
			this.setOptions(options);
		}

		clear() {
			this.body.html('');
		}

		parse(sdk: SDK) {
			this.clear();
			
			var ed = this;
			
			function parse(sdk: SDK, level) {
				for(let e of sdk.imgs) {
					if(e.sdk) {
						var node = ed.body.div("node").attr("level", level);
						for(var i = 0; i < level; i++)
							node.div("cell");
						var item = node.div("item").attr("element", e).on("onclick", () => {
							ed.sdkTab.goInto(e);
						});
						item.n("img").attr("src", e.img.src);
						item.n("div").html(e.sys.Comment.value || e.name);
						for(var l = ed.body.childs()-1; l > 0 && ed.body.child(l).level >= level; l--) {
							var cls = (ed.body.child(l).childNodes[level-1] as HTMLElement).className;
							if(cls == "cell")
								(ed.body.child(l).childNodes[level-1] as HTMLElement).className = l == ed.body.childs()-1 ? "tree-end" : "tree";
							else if(cls == "tree-end")
								(ed.body.child(l).childNodes[level-1] as HTMLElement).className = "tree-center";
						}
						parse(e.sdk, level + 1);
					}
				}
			}

			for(let e of sdk.imgs) {
				if(e.flags & IS_PARENT) {
					let node = this.body.div("node").div("item").on("onclick", () => {
						this.sdkTab.goInto(e);
					});
					node.n("img").attr("src", e.img.src);
					node.n("div").html(e.name);
					parse(sdk, 1);
					break;
				}
			}
		};
	}

	//------------------------------------------------------------------------------

	var extMap = [
		{ ext: /.*\.sha$/i, tab: SHATab },
		{ ext: /.*\.(txt|js|hws|sql|php|ini|html|css|scss)$/i, tab: CodeTab },
		{ ext: /.*\.ogg$/i, tab: OggTab },
		{ ext: /.*\.(png|jpg|ico|gif|jpeg|bmp)$/i, tab: ImageTab }
	];

	interface ContentTab extends Tab {
		content: DocumentTab;
	}
	export class DocumentManageer extends UIContainer {

		private tabs: TabControl;
		private currentTab: DocumentTab;
		private startup: StartupTab;
		private graph: ShaGraph;
		private splitter: Splitter;
		private splitter2: Splitter;
		public state: StatePanel;
		ontabselect = (tab) => {};
		ontabopen = (tab) => {};
		
		constructor (options) {
			super(options);

			this._ctl = new Builder().div("docmanager").element;
			
			this.setOptions(options);
			this.layout = new VLayout(this, {});
			
			var dm = this;
			
			this.tabs = new TabControl({});
			this.add(this.tabs);
			this.tabs.onclose = (tab: ContentTab) => {
				if(tab.content.close()) {
					this.remove(tab.content);
					return true;
				}
				
				return false;
			};
			this.tabs.onselect = (tab: ContentTab) => {
				this.currentTab.hide();
				this.currentTab = tab ? tab.content : this.startup;
				if(this.currentTab) {
					this.currentTab.show();
					commander.reset();
					if(this.graph.visible === true)
						this.showGraph(true);
				}

				this.saveOpenTabs();
				this.ontabselect(tab ? tab.content : null);
			};
			
			this.graph = new ShaGraph({height: getOptionInt("prop_graph_height", 140)});
			this.add(this.graph);
			this.splitter2 = new Splitter({edge: 0});
			this.splitter2.setManage(this.graph);
			this.splitter2.onresize = () => setOptionInt("prop_graph_height", this.graph.height);
			this.graph.visible = this.splitter2.visible = false;
			
			this.state = new StatePanel({height: getOptionInt("prop_state_height", 140)});
			this.add(this.state);
			this.splitter = new Splitter({edge: 0});
			this.splitter.setManage(this.state);
			this.splitter.onresize = () => setOptionInt("prop_state_height", this.state.height);
			this.state.visible = this.splitter.visible = false;
			
			this.startup = new StartupTab("Startup");
			this._showTab(this.startup);

			document.body['onbeforeunload'] = () => {
				var saved = true;
				this.tabs.each(function(tab: ContentTab){
					if(tab.content) {
						saved = saved && tab.content.saved;
					}
				});
				
				return saved ? null : 'Your most recent changes have not been saved. If you leave before saving, your changes will be lost.';
			};
			
			window.addEventListener("resize", () => this.resize());
			
			document.addEventListener("paste", function(e: ClipboardEvent) {
				if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
					commander.execCommand("paste", e.clipboardData);
					e.preventDefault();
					return false;
				}
				return true;
			});
			document.addEventListener("copy", function(e: ClipboardEvent) {
				if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
					commander.execCommand("copy", e.clipboardData);
					e.preventDefault();
					return false;
				}
				return true;
			});
			document.addEventListener("cut", function(e: ClipboardEvent) {
				if((!document.activeElement || document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA")) {
					commander.execCommand("copy", e.clipboardData);
					commander.execCommand("delete");
					e.preventDefault();
					return false;
				}
				return true;
			});
			
			// drop files
			this.getControl().ondrop = (event) => {
				event.preventDefault();
				for(let i = 0; i < event.dataTransfer.files.length; i++) {
					this.openFile(new DesktopFSNode(event.dataTransfer.files[i]), "");
				}
				
				this.getControl().removeAttribute("drop");
				
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

		_ontabopen(tab: DocumentTab) {
			if(this.currentTab == tab)
				this.ontabopen(tab);
		}

		private _showTab(tab: DocumentTab) {
			this.currentTab = tab;
			this.insert(tab, this.splitter2);
		}

		openByType(Class, file: FSNode, title: string, asnew: boolean) {
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
		}
		
		openFile(file: FSNode, title: string) {
			for(var obj of extMap) {
				if(file.name.match(obj.ext)) {
					this.openByType(obj.tab, file, title, false);
					return;
				}
			}
			
			this.openByType(SHATab, file, title, false);
		}
		
		open(fileName: string, title: string) {
			// tab is already open?
			var fTab = null;
			this.tabs.each(function(tab: ContentTab){
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
		}
		
		save(file: string) {
			this.currentTab.save(getFileNode(file));
		}
		
		resize() {
			this.tabs.each(function(tab: ContentTab) {
				tab.content.resize();
			});
		}
		
		execCommand(cmd: string, data) {
			this.currentTab.execCommand(cmd, data);

			switch(cmd) {
				case "new": this.openNew(); break;
				case "output": this.showState(!this.state.visible); break;
				case "build": if(!this.state.visible) this.showState(true); break;
				case "showgraph": this.showGraph(!this.graph.visible); break;
			}
		}
		
		updateCommands(commander: Commander) {
			commander.enabled("output");
			commander.enabled("showgraph");
			if(this.graph.visible)
				commander.checked("showgraph");
			if(this.state.visible)
				commander.checked("output");

			this.currentTab.updateCommands(commander);
		}
		
		openNew() {
			var args = [];
			for(var packName in packMan.packs) {
				var pack = packMan.packs[packName];
				if(pack.projects.length) {
					var proj = [];
					for(var p of pack.projects) {
						proj.push({entry: p, info: pack.translate("el." + p)});
					}
					args.push({
						name: packName,
						title: pack.title,
						info: pack.translate("pack.info." + packName),
						projects: proj
					});
				}
			}
			new Runner("new", (data) => {
				this.openByType(SHATab, getFileNode("/pack/" + data[0] + "/new/" + data[1] + ".sha"), "", true);
			}).run(args);
		}
		
		saveOpenTabs() {
			if(getOptionBool("opt_save_tabs", 1)) {
				var openFiles = [];
				this.tabs.each(function(tab: ContentTab){
					if(tab.content && tab.content.file) {
						openFiles.push(tab.content.file.location());
					}
				});
				setOption('opentabs', JSON.stringify(openFiles));
			}
		}
		
		init() {
			if(getOptionBool("opt_save_tabs", 1)) {
				var data = getOption('opentabs', '');
				if(data) {
					var openFiles = JSON.parse(data);
					for(var file of openFiles) {
						this.open(file, "");
					}
				}
			}
			else {
				if(getOptionBool("opt_new_project", 0)) {
					commander.execCommand("new");
				}
			}
		}
		
		showState(value) {
			this.state.visible = value;
			this.splitter.visible = value;
			commander.reset();
		}

		showGraph(value) {
			if(value && this.currentTab instanceof SHATab) {
				this.graph.parse((this.currentTab as SHATab).sdkEditor.getMainSDK());
				this.graph.sdkTab = this.currentTab as SHATab;
			}
			else
				this.graph.clear();
			this.graph.visible = value;
			this.splitter2.visible = value;
			commander.reset();
		}
	}
}