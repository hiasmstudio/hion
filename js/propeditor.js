var _selMan = null;

/* global Builder */

function PropertyEditor(options) {
	UIContainer.call(this);
	
	this._ctl = new Builder().n("div").class("props").element;
	
	this.setOptions(options);
	this.layout = new VLayout(this, {});

	this.showSysProps = true;
	this.currentSelectProp = null;
	
	this.onpropchange = function(prop){};
	this.onadveditor = function(item){};

	this.groupState = {};
	this.editor = new UIPropertyEditor({});
	
	var pEditor = this;

	var tb = new ToolBar([
		{
			title: "",
			tag: "props",
			icon: 40,
			click: function(){
				if(tb.getButtonByTag("props").checked == "true")
					pEditor.visible = false;
				pEditor.points.hide();
				pEditor.editor.show();
				tb.getButtonByTag("props").checked = true;
				tb.getButtonByTag("events").checked = false;
			}
		},
		{
			title: "",
			tag: "events",
			icon: 48,
			click: function(){
				pEditor.points.show();
				pEditor.editor.hide();
				tb.getButtonByTag("events").checked = true;
				tb.getButtonByTag("props").checked = false;
			}
		}
	]);
	tb.getButtonByTag("props").checked = true;
	this.add(tb);
	this.panel = new Builder(this._ctl).n("div").class("pan").n("div").class("content").element;
	
	this.points = new ListBox({checkboxes: true});
	this.points.hide();
	this.points.oncheck = function(item, text) {
		var e = pEditor.selMan.items[0];
		if(e.findPointByName(item.point.name)) {
			e.removePoint(item.point.name);
		}
		else {
			e.showDefaultPoint(item.point.name);
		}
		pEditor.onpropchange(null);
	};
	this.points.onselect = function(item, text) {
		var e = pEditor.selMan.items[0];
		pEditor.infoBox.caption = pEditor.editor.translator.translate(e.getPointInfo(item.point));
	};
	this.panel.appendChild(this.points.getControl());
	
	var iPanel = new Panel({height: window.localStorage.getItem("prop_info_height", 50)});
	iPanel.layout.setOptions({padding: 3});
	this.infoBox = new Label({});
	iPanel.add(this.infoBox);
	this.add(iPanel);
	
	var splitter = new Splitter({edge: 0});
	splitter.setManage(iPanel);
	splitter.onresize = function(){ window.localStorage.setItem("prop_info_height", iPanel.height) };
	
	this.editor.oncheck = function(item, checked) {
		pEditor.selMan.changePoint(item.name, checked);
		pEditor.onpropchange(null);
	};
	this.editor.onchange = function(item, value) {
		if(item.type === DATA_STR || item.type === DATA_LIST) {
			item.value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
		}
		else {
			item.value = value;
		}
		pEditor.selMan.setProp(item.name, item.value);
		pEditor.selMan.eath(function(e){
			pEditor.onpropchange(e.props[item.name] || e.sys[item.name]);
		});
	};
	this.editor.onadveditor = function(item) {
		pEditor.onadveditor(item);
	};
	this.editor.onselect = function(item) {
		pEditor.infoBox.caption = item ? this.translator.translate(item.info) : "";
	};
	this.panel.appendChild(this.editor.getControl());

	this.show = function (selMan) {
		this.selMan = selMan;

		this.points.clear();		
		this.editor.clear();
		this.infoBox.caption = "";
		if(selMan === null || selMan.items.length === 0) {
			return;
		}
		this.editor.translator = selMan.sdk.pack;
		
		// properties
		function getSimilarProps(sys) {
			var items = {};
			var init = true;
			selMan.eath(function(e){
				var props = sys ? e.sys : e.props;
				if(init) {
					for(var i in props) {
						var p = props[i];
						items[p.name] = p;
					}
					init = false;
				}
				else {
					for(var i in items) {
						var p = items[i];
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
		function makeProp(p) {
			return {
				name: p.name,
				title: p.title || p.name,
				value: p.value,
				type: p.type,
				check: p.isPoint(),
				checked: e.findPointByName("do" + p.name),
				defvalue: p.def,
				default: p.isDefaultEdit(),
				list: p.getList(),
				group: p.group ? p.inherit + "." + p.group : null,
				info: p.getInfo()
			};
		};
		var items = [{title: translate.translate("ui.self_props"), header: true, info: ""}];
		for(var p of getSimilarProps(0)) {
			items.push(makeProp(p));
		}
		items.push({title: translate.translate("ui.sys_props"), header: true, info: ""});
		for(var p of getSimilarProps(1)) {
			items.push(makeProp(p));
		}
		this.editor.edit(items);

		// points
		var names = ["func", "event", "var", "prop"];
		for(var pName in e.pointsEx) {
			var point = e.pointsEx[pName];
			var item = this.points.addIcon("img/icons/sc_" + names[point.type-1] + ".png", point.name);
			item.point = point;
			this.points.checked(item, e.findPointByName(point.name));
		}
	};
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

function UIPropertyEditor(options) {
	this.oncheck = function(item, checked) {};
	this.onchange = function(item) {};
	this.onadveditor = function(item) {};
	this.onselect = function(item) {};
	
	this.groupState = {};
	
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

UIPropertyEditor.prototype = Object.create(UIControl.prototype);

UIPropertyEditor.prototype._clickRow = function(obj, event) {
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
};

UIPropertyEditor.prototype._getDisplayValue = function(item) {
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
};

UIPropertyEditor.prototype._getEditValue = function(cell, item) {
	switch(item.type) {
		case DATA_COLOR:
			cell.html("");
			cell.n("div").class("color").style("backgroundColor", item.value);
			cell.n("div").html(item.value);
			break;
		default:
			cell.html(this._getDisplayValue(item).replace(/&/g, "&amp;").replace(/</g, "&lt;"));
	}
	this._updateChanged(cell, item);
};

UIPropertyEditor.prototype._updateChanged = function(input, item) {
	var def = item.type == DATA_FONT ? item.defvalue.valueOf() == item.value.valueOf() : item.defvalue == item.value;
	if(!def) {
		input.element.setAttribute("changed", "");
	}
	else {
		input.element.removeAttribute("changed");
	}
};

UIPropertyEditor.prototype._clearSelection = function() {
	for(var i = 0; i < this.body.childs(); i++) {
		var c = this.body.child(i);
		if(c.hasAttribute("selected")) {
			c.removeAttribute("selected");
			if(c.item && !c.item.header) {
				this._getEditValue(new Builder(c.childNodes[1].childNodes[0].childNodes[0]), c.item);
			}
			break;
		}
	}
};

UIPropertyEditor.prototype._fillDataList = function(item, edit, combo) {
	var pEditor = this;
	combo.html("");
	var index = 0;
	var isEnum = item.type == DATA_ENUM || item.type == DATA_ENUMEX || item.type == DATA_MANAGER;
	var indexAsValue = item.type == DATA_ENUM || item.type == DATA_ENUMEX;
	var list = isEnum ? item.list : colors;
	for(var option of list) {
		var optionValue = indexAsValue ? index : option;
		var line = combo.n("div").attr("value", optionValue).on("onmousedown", function(event) {
			event.stopPropagation();

			pEditor.onchange(item, this.value);
			this.parentNode.hide();
			edit.attr("value", pEditor._getDisplayValue(item));
		});
		
		if(isEnum) {
			line.html(option);
		}
		else {
			line.n("div").class("color").style("backgroundColor", option);
			line.n("div").html(option);
		}
		
		if(optionValue == item.defvalue) {
			line.element.setAttribute("default", "");
		}
		if(optionValue == item.value) {
			line.element.setAttribute("selected", "");
		}
		index++;
	}
};

UIPropertyEditor.prototype.haveTextEditor = function(prop) {
	return !(prop.type === DATA_ARRAY || prop.type === DATA_ICON || prop.type === DATA_BITMAP || prop.type === DATA_JPEG || prop.type === DATA_STREAM || prop.type === DATA_FONT);
};

UIPropertyEditor.prototype._selectRow = function (row) {
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
	
	var line = new Builder(row.childNodes[1].childNodes[0].childNodes[0]).html("");
	
	var pEditor = this;

	var value = this._getDisplayValue(row.item);
	
	// input box
	if(this.haveTextEditor(row.item)) {
		var edit = line.n("input").attr("type", "text").attr("value", value.toString());
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
		line.n("div").class("advanced").html(this._getDisplayValue(row.item));
	}
	
	// button
	if(row.item.type != DATA_INT && row.item.type != DATA_REAL) {
		line.n("button").html("..").on("onclick", function(){
			switch(row.item.type) {
				case DATA_MANAGER:
				case DATA_ENUM:
				case DATA_ENUMEX:
				case DATA_COLOR:
					pEditor._fillDataList(row.item, edit, combo);
					this.parentNode.lastChild.show();
					break;
				default:
					pEditor.onadveditor(row.item);
			}
		});
		
		if(row.item.type === DATA_ENUM || row.item.type === DATA_ENUMEX || row.item.type === DATA_COLOR || row.item.type === DATA_MANAGER) {
			var combo = line.n("div").class("combo").on("onmousedown", function(event){
				event.stopPropagation();
			});
			combo.element.hide();
			edit.on("ondblclick", function() {
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
						pEditor.onchange(row.item, val);
						edit.attr("value", pEditor._getDisplayValue(row.item));
						break;
				}
			});
		}
	}
	
	return true;
}

UIPropertyEditor.prototype.select = function(propertyName) {
	
};

UIPropertyEditor.prototype.clear = function() {
	this.body.html("");
	this.selected = null;
};

UIPropertyEditor.prototype.edit = function(items) {
	this.clear();
	
	var group = null;
	for(var item of items) {
		
		// make group row
		if(item.group) {
			if(group && group.name == item.group) {
				
			}
			else {
				var __editor = this;
				group = {name: item.group, items: []};
				var g = this.body.n("tr").n("td").attr("colSpan", 2).n("div").class("out pe-title pe-group").attr("group", group);
				var div = g.n("span").class("checkboxspoiler");
				div.n("input").attr("type", "checkbox").element.checked = this.groupState[group.name] ? true : false;
				div.n("span").on("onclick", function(){
					var checked = !this.parentNode.childNodes[0].checked;
					this.parentNode.childNodes[0].checked = checked;
					for(var item of this.parentNode.parentNode.group.items) {
						if(checked) {
							item.element.show();
						}
						else {
							item.element.hide();
						}
					}
					__editor.groupState[this.parentNode.parentNode.group.name] = checked;
				});
				g.n("span").class("caption").html(this.translator.translate(group.name));
			}
		}
		else {
			group = null;
		}
		
		// make property and header row
		var row = this.body.n("tr").attr("item", item);
		
		if(item.header) {
			row.n("td").attr("colSpan", 2).n("div").class("out pe-title pe-header").html(item.title);
		}
		else {
			var title = row.n("td").style("width", "100px").n("div").class("out pe-title");
			if(item.check) {
				var div = title.n("div").class("checkboxsmall");
				div.n("input").attr("type", "checkbox").attr("checked", item.checked);
				div.n("span").attr("parent", this).on("onclick", function(){
					var checked = !this.parentNode.childNodes[0].checked;
					this.parentNode.childNodes[0].checked = checked;
					this.parent.oncheck(this.parentNode.parentNode.parentNode.parentNode.item, checked);
				});
			}
			var t = title.n("div").class("in").html(item.title).element;
			if(item.default) {
				t.setAttribute("default", "");
			}
			if(item.type == DATA_MANAGER) {
				t.setAttribute("manager", "");
			}
			if(group) {
				t.setAttribute("ingroup", "");
			}
			
			var disp = row.n("td").n("div").class("out pe-value").n("div").class("in");
			this._getEditValue(disp, item);
		}
		
		if(group) {
			if(!this.groupState[group.name]) {
				row.element.hide();
			}
			group.items.push(row);
		}
	}
};

PropertyEditor.prototype = Object.create(UIContainer.prototype);