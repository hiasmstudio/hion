var _selMan = null;

namespace Hion {

	export class PropertyEditor extends UIContainer {
		showSysProps: boolean = true;

		private currentSelectProp = null;
		private groupState = {};

		private selMan: SelectManager;
		
		private editor: UIPropertyEditor;
		private points: ListBox;
		private infoBox: Label;
		private panel: HTMLElement;

		onpropchange = (prop: ElementProperty) => {};
		onadveditor = (item: PropertyEditorItem) => {};

		constructor (options) {
			super(options);

			this._ctl = new Builder().div("props").element;
		
			this.setOptions(options);
			this.layout = new VLayout(this, {});

			this.editor = new UIPropertyEditor({});
			
			var tb = new ToolBar([
				{
					title: "",
					tag: "props",
					icon: 40,
					click: () => {
						if(tb.getButtonByTag("props").checked == "true")
							this.visible = false;
						this.points.hide();
						this.editor.show();
						tb.getButtonByTag("props").checked = true;
						tb.getButtonByTag("events").checked = false;
					}
				},
				{
					title: "",
					tag: "events",
					icon: 48,
					click: () => {
						this.points.show();
						this.editor.hide();
						tb.getButtonByTag("events").checked = true;
						tb.getButtonByTag("props").checked = false;
					}
				}
			]);
			tb.getButtonByTag("props").checked = true;
			this.add(tb);
			this.panel = new Builder(this._ctl).div("pan").div("content").element;
			
			this.points = new ListBox({checkboxes: true});
			this.points.hide();
			this.points.oncheck = (item, text) => {
				var e = this.selMan.items[0];
				if(e.findPointByName(item.point.name)) {
					e.removePoint(item.point.name);
				}
				else {
					e.showDefaultPoint(item.point.name);
				}
				this.onpropchange(null);
			};
			this.points.onselect = (item, text) => {
				var e = this.selMan.items[0];
				this.infoBox.caption = this.editor.translator.translate(e.getPointInfo(item.point));
			};
			this.panel.appendChild(this.points.getControl());
			
			var iPanel = new Panel({height: getOptionInt("prop_info_height", 50)});
			iPanel.layout.setOptions({padding: 3});
			this.infoBox = new Label({});
			iPanel.add(this.infoBox);
			this.add(iPanel);
			
			var splitter = new Splitter({edge: 0});
			splitter.setManage(iPanel);
			splitter.onresize = () => setOptionInt("prop_info_height", iPanel.height);
			
			this.editor.oncheck = (item, checked) => {
				this.selMan.changePoint(item.name, checked);
				this.onpropchange(null);
			}
			this.editor.onchange = (item, value) => {
				if(item.type === DATA_STR || item.type === DATA_LIST) {
					item.value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
				}
				else {
					item.value = value;
				}
				this.selMan.setProp(item.name, item.value);
				this.selMan.eath((e) => this.onpropchange(e.props[item.name] || e.sys[item.name]));
			};
			this.editor.onadveditor = (item) => this.onadveditor(item);
			this.editor.onselect = (item) => {
				this.infoBox.caption = item ? this.editor.translator.translate(item.info) : "";
			};
			this.panel.appendChild(this.editor.getControl());
		}

		edit(selMan: SelectManager) {
			this.selMan = selMan;

			this.points.clear();		
			this.editor.clear();
			this.infoBox.caption = "";
			if(selMan === null || selMan.size() === 0) {
				return;
			}
			this.editor.translator = selMan.sdk.pack;
			
			// properties
			function getSimilarProps(sys: boolean): Array<ElementProperty> {
				var items = {};
				var init = true;
				selMan.eath(function(e: SdkElement){
					var props = sys ? e.sys : e.props;
					if(init) {
						for(var i in props) {
							let p = props[i];
							items[p.name] = p;
						}
						init = false;
					}
					else {
						for(var i in items) {
							let p = items[i];
							if(!props[p.name]) {
								delete items[p.name];
							}
						}
					}
				});
				var arr = [];
				for(var i in items) {
					arr.push(items[i]);
				}
				return arr;
			};
			var e = selMan.items[0];
			function makeProp(prop: ElementProperty): PropertyEditorItem {
				return {
					name: prop.name,
					title: prop.title || prop.name,
					value: prop.value,
					type: prop.type,
					check: prop.isPoint(),
					checked: prop.parent.findPointByName("do" + prop.name) != null,
					defvalue: prop.def,
					default: prop.isDefaultEdit(),
					list: prop.getList(),
					group: prop.group ? prop.inherit + "." + prop.group : null,
					info: prop.getInfo(),
					header: false
				};
			};
			let items: Array<PropertyEditorItem> = [{title: translate.translate("ui.self_props"), header: true, info: ""}];
			for(let p of getSimilarProps(false)) {
				items.push(makeProp(p));
			}
			items.push({title: translate.translate("ui.sys_props"), header: true, info: ""});
			for(let p of getSimilarProps(true)) {
				items.push(makeProp(p));
			}
			this.editor.edit(items);

			// points
			let names = ["func", "event", "var", "prop"];
			for(let pName in e.pointsEx) {
				let point = e.pointsEx[pName];
				let item = this.points.addIcon("img/icons/sc_" + names[point.type-1] + ".png", point.name);
				item.point = point;
				this.points.checked(item, e.findPointByName(point.name));
			}
		}
	}

	var colors = [
		"Red",
		"IndianRed",
		"LightCoral",
		"Salmon",
		"Crimson",
		"DarkRed",
		"Pink",
		"HotPink",
		"DeepPink",
		"MediumVioletRed",
		"Coral",
		"Tomato",
		"OrangeRed",
		"Orange",
		"Khaki",
		"DarkKhaki",
		"Gold",
		"Yellow",
		"Lavender",
		"Violet",
		"Magenta",
		"MediumPurple",
		"DarkViolet",
		"Purple",
		"Lime",
		"LimeGreen",
		"LightGreen",
		"SpringGreen",
		"SeaGreen",
		"Green",
		"Olive",
		"Cyan",
		"DarkCyan",
		"Aquamarine",
		"SteelBlue",
		"Blue",
		"Navy",
		"SkyBlue",
		"Cornsilk",
		"NavajoWhite",
		"BurlyWood",
		"RosyBrown",
		"Peru",
		"Brown",
		"Maroon",
		"SaddleBrown",
		"White",
		"Silver",
		"DarkGray",
		"Gray",
		"DimGray",
		"Black"
	];

	interface PropertyEditorItem {
		name?: string;
		title: string;
		header: boolean;
		info: string;
		value?: any;
		type?: number;
		check?: boolean;
		checked?: boolean;
		defvalue?: any;
		default?: boolean;
		list?: Array<string>;
		group?: string;
	}
	interface PropertyRow extends HTMLElement {
		item: PropertyEditorItem;
	}

	class UIPropertyEditor extends UIControl {
		oncheck = (item: PropertyEditorItem, checked) => {};
		onchange = (item: PropertyEditorItem, value) => {};
		onadveditor = (item: PropertyEditorItem) => {};
		onselect = (item: PropertyEditorItem) => {};

		translator: {translate:(text: string) => string};
		
		private groupState = {};
		private body: Builder;
		private selected: PropertyRow;

		constructor(options) {
			super(options);
			
			this.body = new Builder().n("table").class("ui-property-editor").attr("parent", this).on("onmousedown", function(event) {
				this.__moved = true;
				this.parent._clickRow(this, event);
			}).on("onmousemove", function(event) {
				if(this.__moved) {
					this.parent._clickRow(this, event);
					this.__moved = true;
				}
			}).on("onmouseup", function(event) {
				this.__moved = false;
			});
			
			this._ctl = this.body.element;
			
			this.setOptions(options);
		}

		_clickRow(obj, event) {
			if(obj.childNodes.length) {
				var index = Math.floor((event.clientY - obj.parentNode.parentNode.offsetTop + obj.parentNode.scrollTop) / obj.childNodes[0].offsetHeight);
				
				var cur = 0;
				for(var i = 0; i < obj.childNodes.length; i++) {
					if(!obj.childNodes[i].hasAttribute("visible")) {
						if(cur === index) {
							if(!this._selectRow(obj.childNodes[i])) {
								obj.__moved = false;
							}
							break;
						}
						cur++;
					}
				}
			}
		}

		_getDisplayValue(item: PropertyEditorItem) {
			var value = item.value.toString().replace(/\n/g, "\\n"); // .replace(/\"/g, "&quot;")
			switch(item.type) {
				case DATA_ENUM:
				case DATA_ENUMEX:
					value = item.list[value];
					break;
				case DATA_DATA:
					if(typeof item.value === "string" && item.value.length) {
						return "#" + value;
					}
					break;
				case DATA_FONT:
					return item.value.name + ", " + item.value.size;
				case DATA_ICON:
					return "[Icon]";
				case DATA_BITMAP:
					return "[Picture]";
				case DATA_JPEG:
					return "[Jpeg]";
				case DATA_STREAM:
					return "[Stream]";
				case DATA_ARRAY:
					return "[Array]";
			}
			return value;
		}

		_getEditValue(cell: Builder, item: PropertyEditorItem) {
			switch(item.type) {
				case DATA_COLOR:
					cell.html("");
					cell.div("color").style("backgroundColor", item.value);
					cell.n("div").html(item.value);
					break;
				default:
					cell.html(this._getDisplayValue(item).replace(/&/g, "&amp;").replace(/</g, "&lt;"));
			}
			this._updateChanged(cell, item);
		}

		_updateChanged(input: Builder, item: PropertyEditorItem) {
			var def = item.type == DATA_FONT ? item.defvalue.valueOf() == item.value.valueOf() : item.defvalue == item.value;
			if(!def) {
				input.htmlAttr("changed", "");
			}
			else {
				input.element.removeAttribute("changed");
			}
		}

		_clearSelection() {
			for(var i = 0; i < this.body.childs(); i++) {
				var c = this.body.child(i) as PropertyRow;
				if(c.hasAttribute("selected")) {
					c.removeAttribute("selected");
					if(c.item && !c.item.header) {
						this._getEditValue(new Builder(c.childNodes[1].childNodes[0].childNodes[0] as HTMLElement), c.item);
					}
					break;
				}
			}
		}

		_fillDataList(item: PropertyEditorItem, edit: Builder, combo: Builder) {
			var pEditor = this;
			combo.html("");
			var index = 0;
			var isEnum = item.type == DATA_ENUM || item.type == DATA_ENUMEX || item.type == DATA_MANAGER;
			var indexAsValue = item.type == DATA_ENUM || item.type == DATA_ENUMEX;
			var list = isEnum ? item.list : colors;
			for(let option of list) {
				let optionValue = indexAsValue ? index : option;
				let line = combo.n("div").attr("value", optionValue).on("onmousedown", function(event) {
					event.stopPropagation();

					pEditor.onchange(item, this.value);
					combo.hide();
					edit.attr("value", pEditor._getDisplayValue(item));
				});
				
				if(isEnum) {
					line.html(option.replace("<", "&lt;"));
				}
				else {
					line.div("color").style("backgroundColor", option);
					line.n("div").html(option);
				}
				
				if(optionValue == item.defvalue) {
					line.htmlAttr("default", "");
				}
				if(optionValue == item.value) {
					line.htmlAttr("selected", "");
				}
				index++;
			}
		}

		haveTextEditor(prop: PropertyEditorItem) {
			return !(prop.type === DATA_ARRAY || prop.type === DATA_ICON || prop.type === DATA_BITMAP || prop.type === DATA_JPEG || prop.type === DATA_STREAM || prop.type === DATA_FONT);
		}

		_selectRow(row: PropertyRow) {
			if(row === this.selected) {
				return false;
			}
			this.selected = row;
			this._clearSelection();
			row.setAttribute("selected", "");
			
			this.onselect(row.item);
			
			if(!row.item || row.item.header) {
				return true;
			}
			
			var line = new Builder(row.childNodes[1].childNodes[0].childNodes[0] as HTMLElement).html("");
			
			var pEditor = this;

			var value = this._getDisplayValue(row.item);
			
			// input box
			if(this.haveTextEditor(row.item)) {
				var edit = line.inputbox("").value(value.toString());
				edit.on("onkeyup", function() {
					if(row.item.type == DATA_ENUM || row.item.type == DATA_ENUMEX) {
						var index = 0;
						for(var item of row.item.list) {
							if(item.toLowerCase() === this.value.toLowerCase()) {
								pEditor.onchange(row.item, index);
								break;
							}
							index++;
						}
					}
					else {
						var value;
						switch(row.item.type) {
							case DATA_INT:
								try {
									value = parseInt(this.value);
								}
								catch(err) {
									value = 0;
								}
								break;
							case DATA_REAL:
								try {
									value = parseFloat(this.value);
								}
								catch(err) {
									value = 0;
								}
								break;
							case DATA_STR:
							case DATA_LIST:
								value = this.value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
								break;
							case DATA_DATA:
								if(this.value.substr(0,1) == "#") {
									value = this.value.substr(1);
								}
								else {
									value = parseFloat(this.value);
									if(isNaN(value)) {
										value = this.value;
									}
								}
								break;
							default:
								value = this.value;
						}
						pEditor.onchange(row.item, value);
					}
				});
				edit.element.focus();
			}
			else {
				line.div("advanced").html(this._getDisplayValue(row.item));
			}
			
			// button
			if(row.item.type != DATA_INT && row.item.type != DATA_REAL) {
				let isDropList = row.item.type === DATA_ENUM || row.item.type === DATA_ENUMEX || row.item.type === DATA_COLOR || row.item.type === DATA_MANAGER;
				line.n("button").html("..").on("onclick", () => {
					if(isDropList) {
						this._fillDataList(row.item, edit, combo);
						combo.show();
					}
					else {
						this.onadveditor(row.item);
					}
				});
				
				if(isDropList) {
					var combo = line.div("combo").on("onmousedown", (event) => event.stopPropagation());
					combo.hide();
					edit.on("ondblclick", () => {
						switch(row.item.type) {
							case DATA_ENUM:
							case DATA_ENUMEX:
								var val;
								if(row.item.value === row.item.list.length-1) {
									val = 0;
								}
								else {
									val = row.item.value + 1;
								}
								this.onchange(row.item, val);
								edit.attr("value", this._getDisplayValue(row.item));
								break;
						}
					});
				}
			}
			
			return true;
		}

		select(propertyName: string) {
			
		}

		clear() {
			this.body.html("");
			this.selected = null;
		}

		edit(items: Array<PropertyEditorItem>) {
			this.clear();
			
			var group = null;
			for(let item of items) {
				
				// make group row
				if(item.group) {
					if(group && group.name == item.group) {
						
					}
					else {
						group = {name: item.group, items: []};
						let g = this.body.n("tr").n("td").attr("colSpan", 2).div("out pe-title pe-group");
						let div = g.span("checkboxspoiler");
						let checkBox = div.checkbox("").checked(this.groupState[group.name] ? true : false);
						let itemgroup = group;
						div.n("span").on("onclick", () => {
							let checked = !checkBox.checked();
							checkBox.checked(checked);
							for(let item of itemgroup.items) {
								checked ? item.show() : item.hide();
							}
							this.groupState[itemgroup.name] = checked;
						});
						g.span("caption").html(this.translator.translate(group.name));
					}
				}
				else {
					group = null;
				}
				
				// make property and header row
				var row = this.body.n("tr").attr("item", item);
				
				if(item.header) {
					row.n("td").attr("colSpan", 2).div("out pe-title pe-header").html(item.title);
				}
				else {
					var title = row.n("td").style("width", "100px").div("out pe-title");
					if(item.check) {
						let div = title.div("checkboxsmall");
						let checkBox = div.checkbox("").checked(item.checked);
						div.n("span").on("onclick", () => {
							let checked = !checkBox.checked();
							checkBox.checked(checked);
							this.oncheck(item, checked);
						});
					}
					let t = title.div("in").html(item.title);
					if(item.default) {
						t.htmlAttr("default", "");
					}
					if(item.type == DATA_MANAGER) {
						t.htmlAttr("manager", "");
					}
					if(group) {
						t.htmlAttr("ingroup", "");
					}
					
					let disp = row.n("td").div("out pe-value").div("in");
					this._getEditValue(disp, item);
				}
				
				if(group) {
					if(!this.groupState[group.name]) {
						row.hide();
					}
					group.items.push(row);
				}
			}
		}
	}
}