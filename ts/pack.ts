namespace Hion {
	declare interface PackList {
		[name: string]: Pack;
	}
	declare interface TranslateList {
		[key: string]: string;
	}
	export interface PointTemplate {
		name: string;
		type: number;
		args: string;
		flags: number;
		/** Runtime added */
		inherit: string;
	}
	export interface PropertyTemplate {
		name: string;
		type: number;
		def: any;
		list: string;
		editor: string;
		flags: number;
	}
	export interface ElementTemplate {
		tab: string;
		class: string;
		inherit: string;
		sub: string;
		group: string;
		points: Array<PointTemplate>;
		props: Array<PropertyTemplate>;
		sys: Array<PropertyTemplate>;
		interfaces: string;
		/** Runtime added */
		icon: HTMLImageElement;
	}
	declare interface ElementTemplateList {
		[name: string]: ElementTemplate;
	}
	declare interface CoreModule {
		init: (element: string) => void;
	}
	declare interface Make {
		name: string;
		cmd: string;
		/** Runtime added */
		selected: boolean;
	}

	export class PackManager {
		packs: PackList = {};
		private counter: number;
		onload = () => {};
		/** TODO */
		task: any;
		
		load(packs: string[]) {
			var pm = this;
			
			this.counter = 0;
			let packName = packs[this.counter];
			var p = new Pack(packName);
			var base = p;
			pm.state(packName);
			p.onload = function() {
				pm.packs[packName] = p;
				pm.counter++;
				
				if(pm.counter < packs.length) {
					packName = packs[pm.counter];
					let np = new Pack(packName);
					np.parent = base;
					np.onload = p.onload;
					p = np;
					pm.state(packName);
					np.load();
				}
				else {
					pm.onload();
				}
			};
			p.load();
		};
		
		state(text: string) {
			this.task.parent.state("Load " + text + "...");
		}
		
		getPack(name: string): Pack {
			return this.packs[name];
		}
	}

	interface RunRecord {
		mode: string;
		url: string;
	}
	export class Pack {
		parent: Pack = null;

		elements: ElementTemplateList = {};
		onload = function(){};
		loadedImages = 0;
		projects: string[] = [];
		make: Make[] = [];
		namesmap = {};
		strings: TranslateList = {};
		editors = {};
		run: RunRecord;
		title = "";
		core: CoreModule;

		constructor (public name: string) {}

		isEntry(name: string): boolean {
			for(let prj of this.projects)
				if(name == prj)
					return true;
			return false;
		}

		getRoot() {
			return "pack/" + this.name;
		}

		getEditorsPath() {
			return this.getRoot() + "/editors/";
		}

		getSmallIcon() {
			return this.getRoot() + "/icon.png";
		}

		getCodeFilename(element: string) {
			return "/" + this.getRoot() + "/code/hi" + element + ".hws";
		}

		load() {
			$.get(this.getRoot() + "/lang/" + translate.getLang() + ".json", (data) => {
				this.strings = JSON.parse(data);

				$.get(this.getRoot() + "/pack.json", (data) => {
					let js = JSON.parse(data);
					this.projects = js.projects;
					this.make = js.make || [];
					if(this.make.length)
						this.make[0].selected = true;
					this.title = js.title;
					this.run = js.run || { mode: "none" };
					if(js.namesmap)
						this.namesmap = js.namesmap;
					if(js.editors) {
						for(let e in js.editors) {
							if(window[e]) {
								this.editors[window[e]] = js.editors[e];
							}
						}
					}
					if(js.style) {
						let styles = document.createElement('link');
						styles.rel = 'stylesheet';
						styles.type = 'text/css';
						styles.href = this.getRoot() + '/' + js.style;
						document.getElementsByTagName('head')[0].appendChild(styles);
					}

					$.get(this.getRoot() + "/elements.json", (data) => {
						this.elements = JSON.parse(data);
						for(let e in this.elements) {
							let element = this.elements[e];
							if(element.points) {
								for(let point of element.points) {
									point.inherit = e;
								}
							}
							// lang info generator
							// var k = "el." + e;
							// if(element.points && pack.translate(k) === k) {
							// 	var info = '"' + k + '": "",\n';
							// 	for(var point of element.points) {
							// 		info += '"' + e + "." + point.name + '": "",\n';
							// 	}
							// 	console.log(info);
							// }
							// check translation 
							// if(pack.name == "modules") {
							// 	if(element.points) {
							// 		for(var point of element.points) {
							// 			if(pack.translate(e + "." + point.name) === e + "." + point.name)
							// 				console.log(e, point.name);
							// 		}
							// 	}
							// 	if(element.props) {
							// 		for(var prop of element.props) {
							// 			if(pack.translate(e + "." + prop.name) === e + "." + prop.name)
							// 				console.log(e, prop.name);
							// 		}
							// 	}
							// }
						}
						// inherit elements from base package
						if(this.parent) {
							for(let e in this.elements) {
								if(this.parent.elements[e]) {
									let newElement = {};
									// inherit parent element
									(<any>Object).assign(newElement, this.parent.elements[e]);
									// overflow parent fields
									(<any>Object).assign(newElement, this.elements[e]);
									this.elements[e] = newElement as ElementTemplate;

									// create new instance of icon
									if(this.elements[e].icon) {
										let icon = new Image();
										icon.src = this.elements[e].icon.src;
										this.elements[e].icon = icon;
									}
								}
							}
						}
						
						$.appendScript(this.getRoot() + "/core.js", () => {
							this.core = new window[this.name]();
							this.loadIcons();
						});
					});
				});
			});
		}

		loadIcons() {
			for (let id in this.elements) {
				let element = this.elements[id];
				if(element.tab && !element.group && !element.icon) {
					this.loadedImages++;
					
					let icon = new Image();
					icon.src = this.getRoot() + "/icons/" + id + ".ico";
					icon.onerror = function() {
						(this as HTMLImageElement).src = "/pack/base/icons/nil.png";
					};
					icon.onload = () => this._loadImage();
					
					element.icon = icon;
				}
			}
		}

		private _loadImage() {
			this.loadedImages--;
			if(this.loadedImages === 0) {
				this.onload();
			}
		}

		mapElementName(name: string) {
			return this.namesmap[name] || name;
		}

		translate = function(text: string) {
			if(this.strings[text])
				return this.strings[text];
			if(this.parent && this.parent.strings[text])
				return this.parent.strings[text];
			
			return text;
		}

		initElement(element: string) {
			if(this.parent)
				this.parent.core.init(element);
			this.core.init(element);
		}

		getPropertyEditor(propType) {
			if(this.editors[propType])
				return {name: this.editors[propType], path: this.getEditorsPath()};
			
			if(this.parent)
				return this.parent.getPropertyEditor(propType);
			
			return null;
		}

		selectMake(cmd: string) {
			for(let m of this.make) {
				m.selected = m.cmd == cmd;
			}
		}

		getSelectedMake(): string {
			for(let m of this.make) {
				if(m.selected)
					return m.cmd;
			}
			return "";
		}
	}
}