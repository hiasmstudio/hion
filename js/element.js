"use strict";

// element flags
var IS_SELECT     = 0x01;
var IS_PARENT     = 0x02;
var IS_NODELETE   = 0x04;

// property flags
var PROP_FLAG_DEFAULT = 0x01;	// default property for double click
var PROP_FLAG_POINT   = 0x02;	// can create point by property

// element config
var POINT_OFF = 3;
var POINT_SPACE = 7;

//const
var DATA_NONE     = 0;
var DATA_INT      = 1;
var DATA_STR      = 2;
var DATA_DATA     = 3;
var DATA_ENUM     = 4;
var DATA_LIST     = 5;
var DATA_REAL     = 7;
var DATA_COLOR    = 8;
var DATA_ENUMEX   = 14;

function ElementProperty(parent, inherit, template) {
	this.value = this.def = template.def;
	this.type = template.type;
	this.name = template.name;
	this.parent = parent;
	this.inherit = inherit;
	if(template.title) {
		this.title = template.title;
	}
	if(template.list) {
		this.list = template.list.split(",");
	}
	this.flags = template.flags ? template.flags : 0;
	if(template.group) {
		this.group = template.group;
	}
	if(template.editor) {
		this.editor = template.editor;
	}
}

ElementProperty.prototype.isDef = function() { return this.value === this.def; };
ElementProperty.prototype.isDefaultEdit = function() { return this.flags & PROP_FLAG_DEFAULT; };
ElementProperty.prototype.isPoint = function() { return this.flags & PROP_FLAG_POINT; };
ElementProperty.prototype.serialize = function() {
	function serializeString(value) {
		var arr = value.toString().replace(/\r/g, "\\r").split("\n");
		var s = "#";
		for(var i in arr) {
			s += arr[i].length + ":" + arr[i] + "|";
		}
		return s;
	}
	
	switch(this.type) {
		case DATA_LIST:
		case DATA_STR:
			return serializeString(this.value.toString());
		case DATA_DATA:
			if(typeof this.value == "string") {
				return "String(" + this.value + ")";
			}
			else {
				return "Real(" + this.value + ")";
			}
	}
	
	return this.value.toString();
};
ElementProperty.prototype.getText = function() {
	switch(this.type) {
		case DATA_ENUM:
		case DATA_ENUMEX:
			return this.list[this.value];
	}
	
	return this.value.toString().replace(/</g, "&lt;");
};
ElementProperty.prototype.getInfo = function() {
	return this.inherit + "." + this.name;
};
ElementProperty.prototype.setValue = function(value) {
	this.parent.setProperty(this.name, value);
};

ElementProperty.prototype.getTranslateValue = function() {
	return window.translate ? window.translate.translate(this.value) : this.value;
};

//******************************************************************************
// Element
//******************************************************************************

/**
 * Create base element
 * @constructor
 * @param {string} name - The element name from template
 */
function SdkElement(name) {
	this.name = name;
	this.w = this.h = this.minW = this.minH = 32;
	/**
     * Hash map of element points
     * @type {Object}
     */
	this.points = {};
	this.psize = [0, 0, 0, 0];
	this.props = {};
	this.sys = {};
	this.hints = [];
	
	this.pointsEx = [];

	this.info = "el." + name;
	this.flags = 0;
}

function PReader(){}
PReader.prototype.read = function(name) {
	var p = this.element.points[name];
	if(p && p.point) {
		return p.point.onevent(this.data);
	}
	else if(this.element.props[name] && (!this.element.props[name].isDef() || !this.data && this.data !== 0)) {
		return this.element.props[name].value;
	}
	var d = this.data;
	this.data = "";
	return d;
};
PReader.prototype.readInt = function(name) {
	var p = this.element.points[name];
	if(p && p.point) {
		var v = p.point.onevent(this.data);
		return v ? parseInt(v) : 0;
	}
	else if(this.element.props[name] && (!this.element.props[name].isDef() || !this.data)) {
		return this.element.props[name].value;
	}
	else if(this.data) {
		var d = this.data;
		this.data = 0;
		return parseInt(d);
	}
	return 0;
};
PReader.prototype.readFloat = function(name) {
	var p = this.element.points[name];
	if(p && p.point) {
		var v = p.point.onevent(this.data);
		return v ? parseFloat(v) : 0.0;
	}
	else if(this.element.props[name] && (!this.element.props[name].isDef() || !this.data)) {
		return this.element.props[name].value;
	}
	else if(this.data) {
		var d = this.data;
		this.data = 0;
		return parseFloat(d);
	}
	return 0.0;
};

SdkElement.prototype.d = function(data) {
	return Object.create(PReader.prototype, {data: {value: data, writable: true}, element: {value: this}});
};

SdkElement.prototype.setSDK = function(sdk, x, y) {
	this.parent = sdk;
	this.x = x;
	this.y = y;
};

SdkElement.prototype.loadFromTemplate = function() {
	function loadTemplate(element, tid) {
		var template = element.parent.pack.elements[tid];
		if(template.inherit) {
			loadTemplate(element, template.inherit);
		}
		// create points
		for(var index in template.points) {
			var point = template.points[index];
			if(point.flags & 0x01) {
				element.pointsEx.push(point);
			}
			else {
				// TODO оптимизировать
				for(var p in element.pointsEx) {
					if(element.pointsEx[p].name === point.name) {
						element.pointsEx.splice(p, 1);
						break;
					}
				}
				element.addPoint(point.name, point.type).args = point.args;
			}
		}
		// create propertyes
		for(var index in template.props) {
			var prop = template.props[index];
			if(element.props[prop.name]) {
				element.props[prop.name].value = prop.def;
				element.props[prop.name].def = prop.def;
			}
			else {
				element.props[prop.name] = new ElementProperty(element, tid, prop);
			}
		}
		// create system propertyes
		for(var index in template.sys) {
			var prop = template.sys[index];
			if(element.sys[prop.name]) {
				element.sys[prop.name].value = prop.def;
				element.sys[prop.name].def = prop.def;
			}
			else {
				element.sys[prop.name] = new ElementProperty(element, tid, prop);
			}
		}
	}
	
	loadTemplate(this, "element");
	loadTemplate(this, this.name);
	
	this.img = this.parent.pack.elements[this.name].icon;
};

SdkElement.prototype.insertInLine = function(point, pos) {
	if(point.type == pt_event) {
		var work = this.getFirstFreePoint(pt_work);
		var event = this.getFirstFreePoint(pt_event);
		if(!work || !event) {
			var sp = point.point;
			point.clear();
			if(work)  point.connect(work).createPath();
			if(event) event.connect(sp).createPath();
		}
		else {
			var p2 = pos.next;
			this.injectElementAtLine(point, work, event, pos);
			if(pos.y == p2.y)
				this.move(0, pos.y - event.pos.y);
		}
	}
	else if(point.type == pt_data) {
		var v = this.getFirstFreePoint(pt_var);
		var d = this.getFirstFreePoint(pt_data);
		if(!v || !d) {
			var sp = point.point;
			point.clear();
			if(v) point.connect(v).createPath();
			if(d) d.connect(sp).createPath();
		}
		else {
			var p2 = pos.next;
			this.injectElementAtLine(point, v, d, pos);
			if(pos.y == p2.y)
				this.move(0, pos.y - d.pos.y);
		}
	}
};
SdkElement.prototype.injectElementAtLine = function(pl1, pl2, pl3, p1) {
	var pl4 = pl1.point;
	var p2 = p1.next;

	var op;
	if(pl1.pos.next === pl4.pos)
		op = null;
	else
		op = pl1.pos.next;

	pl1.connect(pl2);

	if(op) {
		pl1.pos.next = op;
		p1.next = pl2.pos;
		pl2.pos.prev = p1;
	}

	if(pl4.pos.prev === pl1.pos)
		op = null;
	else
		op = pl4.pos.prev;

	pl4.connect(pl3);

	if(op) {
		pl4.pos.prev = op;
		p2.prev = pl3.pos;
		pl3.pos.next = p2;
	}
};

// Place element in sdkEditor
SdkElement.prototype.place = function(x, y) { };

SdkElement.prototype.erase = function () {
	var pta = [null, null, null, null];
	for (var i in this.points) {
		var point = this.points[i];
		if(point.point) {
			if(!pta[point.type-1]) {
				pta[point.type-1] = point.point;
			}
		}
		point.clear();
	}
	if(pta[0] && pta[1]) {
		pta[0].connect(pta[1]).createPath();
	}
	if(pta[2] && pta[3]) {
		pta[2].connect(pta[3]).createPath();
	}
};

SdkElement.prototype.inPoint = function(x, y) {
	return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h;
};
SdkElement.prototype.inRect = function(x1, y1, x2, y2) {
	return !(x2 < this.x || y2 < this.y || x1 > this.x+this.w || y1 > this.y+this.h);
};

SdkElement.prototype.updateSizes = function() {
	var width = Math.max(Math.max(this.psize[2], this.psize[3])*7 + POINT_OFF, this.minW);
	this.w = width;
	var height = Math.max(Math.max(this.psize[0], this.psize[1])*7 + POINT_OFF, this.minH);
	this.h = height;
};

// mouse operations
SdkElement.prototype.getCursor = function(x, y) { return null; };
SdkElement.prototype.mouseDown = function(x, y, button) { return false; };
SdkElement.prototype.mouseMove = function(x, y) { };
SdkElement.prototype.mouseUp = function(x, y, button) { };
SdkElement.prototype.mouseGetPoint = function() { return true; };

// points
SdkElement.prototype.addPoint = function(name, type) {
	var point = new Point(this, name, type);
	
	this.points[name] = point;
	if(this[name] === undefined) {
		this[name] = point;
	}
	this.psize[type - 1]++;
	this.updateSizes();
	this.rePosPoints();
	
	return point;
};
SdkElement.prototype.removePoint = function(name) {
	this.points[name].clear();
	this.psize[this.points[name].type - 1]--;
	if(this[name] instanceof Point) {
		delete this[name];
	}
	delete this.points[name];
	this.updateSizes();
	this.rePosPoints();
};
SdkElement.prototype.removePoints = function() {
	for(var i in this.points) {
		delete this[i];
	}
	this.points = {};
	for(var i in this.psize) {
		this.psize[i] = 0;
	}
	this.updateSizes();
};
SdkElement.prototype.rePosPoints = function() {
	var sizes = [0, 0, 0, 0];
	for(var name in this.points) {
		var p = this.points[name];
		if (p.type < 3) {
			p.pos.x = this.x + ((p.type === 1) ? 0 : this.w);
			p.pos.y = this.y + 6 + sizes[p.type - 1] * 7;
		} else {
			p.pos.x = this.x + 6 + sizes[p.type - 1] * 7;
			p.pos.y = this.y + ((p.type === 4) ? 0 : this.h);
		}
		sizes[p.type - 1]++;
	}
};
SdkElement.prototype.findPointByName = function (name) {
	return this.points[name];
};
SdkElement.prototype.getFirstFreePoint = function(type) {
	for(var p in this.points) {
		var point = this.points[p];
		if(point.type === type && !point.point) {
			return point;
		}
	}
	return null;
};
SdkElement.prototype.connectToPoint = function(point) {
	var fp = this.getFirstFreePoint(point.getPair());
	if(fp) {
		point.connect(fp).createPath();
	}
};
SdkElement.prototype.getPointInfo = function(point) {
	return this.name + "." + point.name;	
};

// draw
SdkElement.prototype.draw = function(ctx) {
	this.drawHints(ctx);
	this.drawBody(ctx);
	this.drawIcon(ctx);
	this.drawPoints(ctx);
};
SdkElement.prototype.drawBody = function(ctx) {
	ctx.strokeStyle = "rgb(150,150,150)";
	ctx.fillStyle = this.isSelect() ? "rgb(100,100,100)" : this.sys.Color.value;
	ctx.fillRect(this.x, this.y, this.w, this.h);
	ctx.strokeRect(this.x, this.y, this.w, this.h);
};
SdkElement.prototype.drawIcon = function(ctx) {
	// firefox fix: +0.5
	ctx.drawImage(this.img, this.x + 4.5, this.y + 4.5);
};
SdkElement.prototype.drawHints = function(ctx) {
	ctx.font = "12px Arial";
	for(var h of this.hints) {
		var x = this.x + h.x;
		var y = this.y + h.y;
		
		var text = h.prop ? h.prop.getText() : "(empty)";
		var m = ctx.measureText(text);
		h.width = m.width + 8;
		h.height = 12 + 6;
		
		// line
		var px = this.x + this.w / 2;
		var py = this.y + this.h / 2;
		var mx = this.x + h.x + h.width / 2;
		var my = this.y + h.y + h.height / 2;
	
		ctx.strokeStyle = "navy";
		ctx.setLineDash([3,3]);
		ctx.beginPath();
		ctx.moveTo(px, py);
		if(!(h.x + m.width < 0 || h.x > this.w))
			ctx.lineTo((px + mx) / 2, my);
		else if(h.x < 0)
			ctx.lineTo((px + this.x + h.x + m.width) / 2, my);
		else
			ctx.lineTo((px + this.x + h.x) / 2, my);
		ctx.lineTo(mx, my);
		ctx.stroke();
		ctx.setLineDash([]);
		
		// rect
		ctx.strokeStyle = "#808080";
		ctx.fillStyle = "#ffffe1";
		ctx.fillRect(x, y, h.width, h.height);
		ctx.strokeRect(x, y, h.width, h.height);

		// text
		ctx.fillStyle = "black";
		ctx.fillText(text, x + 2, y + 12 + 1);
	}
};
SdkElement.prototype.drawPoints = function(ctx) {
	ctx.fillStyle = "#0f0";
	ctx.strokeStyle = "rgb(150,150,150)";
	if(!this.hidePoints) {
		for (var j in this.points) {
			var p = this.points[j].pos;
			if(this.points[j].selected) {
				ctx.fillStyle = "#0b0";
			}
			ctx.beginPath();
			ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI, true);
			ctx.fill();
			ctx.stroke();
			if(this.points[j].selected) {
				ctx.fillStyle = "#0f0";
			}
		}
	}
};

SdkElement.prototype.addHint = function(x, y, prop) {
	var h = {x: x, y: y, prop: prop, e: this};
	this.hints.push(h);
	return h;
};

SdkElement.prototype.setProperty = function(prop, value) {
	var p = this.props[prop];
	if(!p) {
		p = this.sys[prop];
	}
	switch(p.type) {
		case DATA_INT:
		case DATA_ENUM:
		case DATA_ENUMEX:
			p.value = parseInt(value);
			break;
		default:
			p.value = value;
	}
	this.onpropchange(p);
};

SdkElement.prototype.move = function (dx, dy) {
	this.x += dx;
	this.y += dy;
	for (var j in this.points) {
		var p = this.points[j].pos;
		var sel = this.points[j].point && (this.points[j].point.parent.isSelect());
		if (p.next) {
			if (sel) {
				var n = p.next;
				while (n.next) {
					n.x += dx;
					n.y += dy;
					n = n.next;
				}
			} else if (p.next.next) {
				if (p.next.x === p.x)
					p.next.x += dx;
				else if (p.next.y === p.y)
					p.next.y += dy;
			}
		}
		if (!sel && p.prev && p.prev.prev) {
			if (p.prev.x === p.x)
				p.prev.x += dx;
			else if (p.prev.y === p.y)
				p.prev.y += dy;
		}
		p.x += dx;
		p.y += dy;
	}
};

SdkElement.prototype.isSelect = function() {
	return this.flags & IS_SELECT;
};
	
SdkElement.prototype.onpropchange = function(prop) {};
SdkElement.prototype.oninit = function() {};

SdkElement.prototype.loadFromText = function(line) { return false; };
SdkElement.prototype.saveToText = function() { return ""; };

SdkElement.prototype.initPointHandler = function(name, handler) {
	if(this.points[name]) {
		this.points[name].onevent = handler;
	}
};


function getClass(pack, id) {
	var template = pack.elements[id];
	if(template.class) {
		return template.class;
	}
	if(template.inherit) {
		return getClass(pack, template.inherit);
	}
	return null;
}

/* global Button,CheckBox,RadioButton,Edit,Memo,Label,ProgressBar,UIImage,Youtube */

function createElement(sdk, id, x, y) {
	var i = new window[getClass(sdk.pack, id) || "SdkElement"](id);
	i.setSDK(sdk, x, y);
	i.loadFromTemplate();

	i.run = function() { return null; };

	switch (i.name) {
		case "Button":
			i.run = function (flags) {
				this.ctl = new Button({
					caption: this.props.Caption.getTranslateValue(),
					url: this.props.URL.value
				});
				if(!this.props.Align.isDef()) {
					this.ctl.layout = new HLayout(this.ctl, {reverse: this.props.Align.value === 2, alignItems: 2, justifyContent: 2});
				}
				this.ctl.addListener("click", function () {
					i.onClick.call(i.props.Data.value);
				});
				return WinElement.prototype.run.call(this, flags);
			};
			i.addPoint = function(name, type) {
				var point = WinElement.prototype.addPoint.call(this, name, type);
				if(name === "doCaption") {
					point.onevent = function(data) {
						this.parent.ctl.caption = data;
					};
				}
				return point;
			};
			break;
		case "CheckBox":
			i.doCheck.onevent = function (data) {
				this.parent.ctl.checked = parseInt(data);
			};
			i.Checked.onevent = function (data) {
				return this.parent.ctl.checked ? 1 : 0;
			};
			i.run = function (flags) {
				this.ctl = new CheckBox({
					caption: this.props.Caption.getTranslateValue(),
					checked: this.props.Checked.value
				});
				this.ctl.addListener("checked", function () {
					i.onCheck.call(i.ctl.checked ? 1 : 0);
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "RadioButton":
			i.doCheck.onevent = function (data) {
				this.parent.ctl.checked = parseInt(data);
			};
			i.Checked.onevent = function (data) {
				return this.parent.ctl.checked ? 1 : 0;
			};
			i.run = function (flags) {
				this.ctl = new RadioButton({
					name: this.props.Name.value,
					caption: this.props.Caption.getTranslateValue(),
					checked: this.props.Checked.value
				});
				this.ctl.addListener("checked", function () {
					i.onCheck.call(i.ctl.checked ? 1 : 0);
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Edit":
			i.doText.onevent = function (data) {
				this.parent.ctl.text = this.parent.d(data).read("Str");
			};
			i.Text.onevent = function (data) {
				return this.parent.ctl.text;
			};
			i.run = function (flags) {
				this.ctl = new Edit({
					text: this.props.Text.value,
					placeHolder: this.props.PlaceHolder.getTranslateValue(),
					password: this.props.Password.value,
					pattern: this.props.Pattern.value
				});
				this.ctl.addListener("change", function () {
					i.onChange.call(i.ctl.text);
				});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "NumberEdit":
			i.doNumber.onevent = function (data) {
				this.parent.ctl.number = readProperty(data, this.parent.Value);
			};
			i.Number.onevent = function (data) {
				return this.parent.ctl.number;
			};
			i.run = function (flags) {
				this.ctl = new NumberEdit({
					number: this.props.Number.value,
					min: this.props.Min.value,
					max: this.props.Max.value,
					step: this.props.Step.value,
					placeHolder: this.props.PlaceHolder.value
				});
				this.ctl.addListener("input", function () {
					i.onChange.call(i.ctl.number);
				});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Memo":
			i.doAdd.onevent = function (data) {
				this.parent.ctl.add(readProperty(data, this.parent.Str));
			};
			i.doText.onevent = function (data) {
				this.parent.ctl.text = readProperty(data, this.parent.Str);
			};
			i.Text.onevent = function (data) {
				return this.parent.ctl.text;
			};
			i.run = function (flags) {
				this.ctl = new Memo({text: this.props.Text.value});

				if(i.Position) {
					i.Position.onevent = function (data) {
						return this.parent.ctl.caretStart;
					};
				}

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "ListBox":
			i.onpropchange = function(prop) {
				this.onSelect.args = this.props.Select.getText();
				this.onClick.args = this.props.Select.getText();
			};
			i.doAdd.onevent = function (data) {
				this.parent.ctl.add(this.parent.d(data).read("Str"));
			};
			i.doText.onevent = function (data) {
				this.parent.ctl.setText(data);
			};
			i.SelectIndex.onevent = function () {
				return this.parent.ctl.getSelectIndex();
			};
			i.SelectString.onevent = function () {
				return this.parent.ctl.getSelectString();
			};
			i.run = function (flags) {
				this.ctl = new ListBox();
				this.ctl.e = this;

				var text = this.props.Strings.value;
				try {
					var a = JSON.parse(text);
					for(var item of a) {
						this.ctl.addIcon(item[1], item[0]);
					}
				}
				catch(err) {
					this.ctl.setText(text);
				}
				
				this.ctl.onclick = function(item, text) {
					if(this.e.props.Select.value === 0) {
						this.e.onClick.call(item.index);
					}
					else {
						this.e.onClick.call(text);
					}
				};
				this.ctl.onselect = function(item, text) {
					if(this.e.props.Select.value === 0) {
						this.e.onSelect.call(item.index);
					}
					else {
						this.e.onSelect.call(text);
					}
				};
				
				this.initPointHandler("doReplace", function(data){
					this.parent.ctl.replaceSelect(data);
				});
				this.initPointHandler("doSelectIndex", function (data) {
					if(data >= 0 && data < this.parent.ctl.size()) {
						this.parent.ctl.selectIndex(data);
					}
				});
				this.initPointHandler("doSelectText", function (data) {
					this.parent.ctl.selectString(data);
				});
				this.initPointHandler("Text", function () {
					return this.parent.ctl.text();
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "ComboBox":
			i.onpropchange = function(prop) {
				this.onSelect.args = this.props.Select.getText();
			};
			i.doAdd.onevent = function (data) {
				this.parent.ctl.add(this.parent.d(data).read("Str"));
			};
			i.doText.onevent = function (data) {
				this.parent.ctl.setText(data);
			};
			i.SelectIndex.onevent = function () {
				return this.parent.ctl.getSelectIndex();
			};
			i.SelectString.onevent = function () {
				return this.parent.ctl.getSelectString();
			};
			i.run = function (flags) {
				this.ctl = new ComboBox();
				this.ctl.e = this;
				
				this.ctl.setText(this.props.Strings.value);
				
				this.ctl.onselect = function(item, text) {
					if(this.e.props.Select.value === 0) {
						this.e.onSelect.call(item.index);
					}
					else {
						this.e.onSelect.call(text);
					}
				};
				
				this.initPointHandler("doSelectIndex", function (data) {
					if(data >= 0 && data < this.parent.ctl.size()) {
						this.parent.ctl.selectIndex(data);
					}
				});
				this.initPointHandler("doSelectText", function (data) {
					this.parent.ctl.selectString(data);
				});
				this.initPointHandler("Text", function () {
					return this.parent.ctl.text();
				});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Label":
			i.doCaption.onevent = function (data) {
				this.parent.ctl.caption = data;
			};
			i.run = function (flags) {
				this.ctl = new Label({
					caption: this.props.Caption.getTranslateValue(),
					halign: this.props.HAlign.value,
					valign: this.props.VAlign.value,
					theme: this.props.Link.isDef() ? "" : "link"
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "PaintBox":
			i.doDraw.onevent = function (data) {
				this.parent.ctl.clear();
				this.parent.onDraw.call(this.parent.ctl.canvas);
			};
			i.Canvas.onevent = function () {
				return this.parent.ctl.canvas;
			};
			i.run = function (flags) {
				this.ctl = new Canvas({theme: flags & window.FLAG_USE_EDIT ? "borderin" : ""});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "PointXY":
			i.Point.onevent = function() {
				var d = this.parent.d(0);
				return {x: d.readInt("X"), y: d.readInt("Y")};
			};
			break;
		case "Line":
			i.doDraw.onevent = function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				var point1 = d.read("Point1");
				var point2 = d.read("Point2");
				var props = this.parent.props;
				canvas.beginPath();
				canvas.moveTo(point1.x || props.X1.value, point1.y || props.Y1.value);
				canvas.lineTo(point2.x || props.X2.value, point2.y || props.Y2.value);
				canvas.stroke();
				this.parent.onDraw.call(canvas);
			};
			break;
		case "Rectangle":
			i.doDraw.onevent = function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				var point1 = d.read("Point1");
				var point2 = d.read("Point2");
				var props = this.parent.props;
				var x1 = point1.x || props.X1.value;
				var y1 = point1.y || props.Y1.value;
				var x2 = point2.x || props.X2.value;
				var y2 = point2.y || props.Y2.value;
				if(this.parent.props.Type.value !== 1) {
					canvas.fillRect(x1, y1, x2, y2);
				}
				if(this.parent.props.Type.value !== 0) {
					canvas.strokeRect(x1, y1, x2, y2);
				}
				this.parent.onDraw.call(canvas);
			};
			break;
		case "Circle":
			i.doDraw.onevent = function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				var point = d.read("Point");
				var radius = d.read("Radius");
				var props = this.parent.props;
				var x = point.x || props.X.value;
				var y = point.y || props.Y.value;
				canvas.beginPath();
				canvas.arc(x, y, radius, 0, 2*Math.PI);
				if(this.parent.props.Type.value !== 1) {
					canvas.fill();
				}
				if(this.parent.props.Type.value !== 0) {
					canvas.stroke();
				}
				this.parent.onDraw.call(canvas);
			};
			break;
		case "DrawText":
			i.doDraw.onevent = function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				var point = d.read("Point");
				var text = d.read("Text");
				var props = this.parent.props;
				var x = point.x || props.X.value;
				var y = point.y || props.Y.value;
				if(this.parent.props.Align.value == 1) {
					x -= canvas.measureText(text).width/2;
				}
				else if(this.parent.props.Align.value == 2) {
					x -= canvas.measureText(text).width;
				}
				if(this.parent.props.Align.value == 1) {
					
				}
				canvas.font = props.Font.value;
				if(this.parent.props.Type.value !== 1) {
					canvas.fillText(text, x, y);
				}
				if(this.parent.props.Type.value !== 0) {
					canvas.strokeText(text, x, y);
				}
				this.parent.onDraw.call(canvas);
			};
			break;
		case "DrawImage":
			i.doDraw.onevent = function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				var point = d.read("Point");
				var image = d.read("Image");
				var props = this.parent.props;
				var x = point.x || props.X.value;
				var y = point.y || props.Y.value;
				canvas.drawImage(image, x, y);
				this.parent.onDraw.call(canvas);
			};
			break;
		case "DrawImageRegion":
			i.doDraw.onevent = function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				var point = d.read("Point");
				var image = d.read("Image");
				var props = this.parent.props;
				var x = point.x || props.X.value;
				var y = point.y || props.Y.value;
				canvas.drawImage(image, this.parent.sourceX, this.parent.sourceY, props.SourceWidth.value, props.SourceHeight.value, x, y, props.SourceWidth.value, props.SourceHeight.value);
				this.parent.onDraw.call(canvas);
			};
			i.run = function(){
				this.sourceX = this.props.SourceX.value;
				this.sourceY = this.props.SourceY.value;
				
				if(this.doSourceX) {
					this.doSourceX.onevent = function(data) {
						this.parent.sourceX = parseInt(data);
					};
				}
				if(this.doSourceY) {
					this.doSourceY.onevent = function(data) {
						this.parent.sourceY = parseInt(data);
					};
				}
			};
			break;
		case "FillStyle":
			i.doFill.onevent=  function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				canvas.fillStyle = d.read("Color");
				this.parent.onFill.call(canvas);
			};
			break;
		case "StrokeStyle":
			i.doStroke.onevent=  function(data) {
				var d = this.parent.d(data);
				var canvas = d.read("Canvas");
				canvas.strokeStyle = d.read("Color");
				canvas.lineWidth = d.read("Width");
				this.parent.onStroke.call(canvas);
			};
			break;
		case "RGB":
			i.doRGB.onevent=  function(data) {
				var d = this.parent.d(data);
				var r = d.readInt("R");
				var g = d.readInt("G");
				var b = d.readInt("B");
				var a = d.readFloat("A");
				switch(this.parent.props.Type.value) {
					case 0:
						this.parent.color = "rgb(" + r + "," + g + "," + b + ")";
						break;
					case 1:
						this.parent.color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
						break;
					case 2:
						this.parent.color = r + (g << 8) + (b << 16);
						break;
				}
				this.parent.onRGB.call(this.parent.color);
			};
			i.Color.onevent = function(){
				return this.parent.color;
			};
			break;
		case "ProgressBar":
			i.doPosition.onevent = function (data) {
				this.parent.ctl.position = data;
			};
			i.Position.onevent = function (data) {
				return this.parent.ctl.position;
			};

			i.run = function (flags) {
				this.ctl = new ProgressBar({
					max: this.props.Max.value,
					position: this.props.Position.value,
					custom: this.props.Engine.isDef()
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "TrackBar":
			i.doPosition.onevent = function (data) {
				this.parent.ctl.position = data;
			};
			i.Value.onevent = function() {
				return this.parent.ctl.position;
			};
			i.run = function (flags) {
				this.ctl = new TrackBar({
					min: this.props.Min.value,
					max: this.props.Max.value,
					step: this.props.Step.value,
					position: this.props.Value.value
				});
				
				this.ctl.addListener("input", function () {
					i.onPosition.call(i.ctl.position);
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Panel":
			i.run = function (flags) {
				this.ctl = new Panel({});
				this.ctl.layout = this.getLayout(this.ctl);

				return WinElement.prototype.run.call(this, flags);
			};
			i.getChild = function(){
				return this.ctl;
			};
			
			if(i.parent.parent) {
				i.flags |= window.IS_PARENT;
			}
			break;
		case "ScrollBox":
			i.run = function (flags) {
				this.ctl = new Panel({theme: "ui-scrollbox"});
				this.ctl.layout = this.getLayout(this.ctl);

				return WinElement.prototype.run.call(this, flags);
			};
			i.getChild = function(){
				return this.ctl;
			};
			
			if(i.parent.parent) {
				i.flags |= window.IS_PARENT;
			}
			break;
		case "Spoiler":
			i.run = function (flags) {
				this.ctl = new Spoiler({caption: "Spoil me"});
				this.ctl.layout = this.getLayout(this.ctl);

				return WinElement.prototype.run.call(this, flags);
			};
			i.getChild = function(){
				return this.ctl;
			};
			
			if(i.parent.parent) {
				i.flags |= window.IS_PARENT;
			}
			break;
		case "Hub":
			i.w = i.minW = 13;
			i.minH = 13;
			i.drawIcon = function(ctx) {
				ctx.strokeStyle = "navy";
				var c = this.x + this.w/2 + 0.5;
				ctx.drawLine(c, this.y + POINT_OFF + 3, c, this.y + this.h - POINT_OFF - 1);
				for(var i = 0; i < Math.max(this.props.InCount.value, this.props.OutCount.value); i++) {
					var y = this.y + i*7 + POINT_OFF + 3;
					var x1 = i < this.props.InCount.value ? this.x : c;
					var x2 = i < this.props.OutCount.value ? this.x + this.w : c;
					ctx.drawLine(x1, y, x2, y);
				}
			};
			i.onpropchange = function(prop) {
				DPElement.prototype.onpropchange.call(this, prop);
				if(prop.name === "InCount") {
					for(var i in this.points) {
						if(this.points[i].type === pt_work) {
							this.points[i].onevent = function(data) {
								for (var i = 0; i < this.parent.props.OutCount.value; i++) {
									this.parent.points["onEvent" + (i+1)].call(data);
								}
							};
						}
					}
				}
			};
			i.onpropchange(i.props.InCount);
			i.onpropchange(i.props.OutCount);
			break;
		case "HubEx":
			i.onpropchange(i.props.Angle);
			for(var p = 0; p < 3; p++) {
				i[i.pIndex[p]].onevent = function(data) { this.parent.onEvent.call(data); };
			}
			break;
		case "GetDataEx":
			for(var p = 0; p < 3; p++) {
				i[i.pIndex[p]].onevent = function(data) { return readProperty(data, this.parent.Data); };
			}
			i.onpropchange(i.props.Angle);
			break;
		case "Case":
			i.doCase.onevent = function(data) {
				if(data == this.parent.props.Value.value) {
					this.parent.onTrue.call(this.parent.props.DataOnTrue.value);
				}
				else {
					this.parent.onNextCase.call(data);
				}
			};
			break;
		case "IndexToChannel":
			i.doEvent.onevent = function(data) {
				var name = "onEvent" + (this.parent.d(data).readInt("Index") + 1);
				if(this.parent[name]) {
					this.parent[name].call(this.parent.props.Data.value);
				}
			};
			i.onpropchange(i.props.Count);
			break;
		case "ChannelToIndex":
			i.onpropchange = function(prop) {
				DPElement.prototype.onpropchange.call(this, prop);
				for(var j = 0; j < this.props.Count.value; j++) {
					this["doWork" + (j + 1)].onevent = function(index){ return function(data) { this.parent.onIndex.call(index); } }(j);
				}
			};
			i.onpropchange(i.props.Count);
			break;
		case "TimeCounter":
			i.doStart.onevent = function(data){
				this.parent.counter = window.performance.now();
				this.parent.onStart.call(data);
			};
			i.doStop.onevent = function(){
				this.parent.elapsed = window.performance.now() - this.parent.counter;
				this.parent.onStop.call(this.parent.elapsed);
			};
			i.Elapsed.onevent = function(){ return this.parent.elapsed; };
			i.run = function(){ this.counter = this.elapsed = 0; };
			break;
		case "Switch":
			i.getValue = function() {
				var r = this.d("");
				return this.state ? r.read("DataOn") : r.read("DataOff");
			};
			i.change = function() {
				var data = this.getValue();
				this.onSwitch.call(data);
				if(this.state) {
					this.onOn && this.onOn.call(data);
				}
				else {
					this.onOff && this.onOff.call(data);
				}
			};
			i.doSwitch.onevent = function(){
				this.parent.state = !this.parent.state;
				this.parent.change();
			};
			i.doReset.onevent = function(){
				if(this.parent.state) {
					this.parent.state = false;
					this.parent.change();
				}
			};
			i.State.onevent = function(){ return this.parent.getValue(); };
			i.run = function(){
				this.state = !this.props.Default.isDef();
				
				if(this.doOn) {
					this.doOn.onevent = function(){
						if(!this.parent.state) {
							this.parent.state = true;
							this.parent.change();
						}
					};
				}
			};
			break;
		case "ArraySplit":
			i.doSplit.onevent = function(data) {
				this.parent.onSplit.call(readProperty(data, this.parent.String).split(this.parent.props.Delimiter.value));
			};
			break;
		case "ArrayBuilder":
			i.doBuild.onevent = function(data) {
				var array = [];
				var d = this.parent.d(data);
				for(var i in this.parent.points) {
					var point = this.parent.points[i];
					if(point.type === pt_data) {
						array.push(d.read(point.name));
					}
				}
				this.parent.onBuild.call(array);
			};
			break;
		case "JSON":
			i.doConvert.onevent = function(data) {
				var d = this.parent.d(data).read("Data");
				if(this.parent.props.Mode.isDef()) {
					this.parent.result = JSON.parse(d);
				}
				else {
					this.parent.result = JSON.stringify(d);
				}
				this.parent.onConvert.call(this.parent.result);
			};
			i.Result.onevent = function(data) {
				return this.parent.result;
			};
			break;
		case "JSON_Field":
			i.doGet.onevent = function(data) {
				var d = this.parent.d(data);
				var object = d.read("Object");
				var name = d.read("Name");
				this.parent.onGet.call(this.parent.result = object[name]);
			};
			i.Result.onevent = function() {
				return this.parent.result;
			};
			break;
		case "JSON_Field_Set":
			i.doSet.onevent = function(data) {
				var d = this.parent.d(data);
				var object = d.read("Object");
				var name = d.read("Name");
				object[name] = d.read("Value");
				this.parent.onSet.call(object);
			};
			break;
		case "JSON_Enum":
			i.doEnum.onevent = function(data) {
				var d = this.parent.d(data);
				var object = d.read("Object");
				for(var name in object) {
					this.parent.onEnum.call(name);
				}
				this.parent.onEndEnum.call();
			};
			break;
		case "FormatStr":
			i.doString.onevent = function(data) {
				var r = this.parent.d(data);
				var _data = this.parent.props.Mask.value;
				for(var s = 1; s <= this.parent.props.DataCount.value; s++) {
					_data = _data.replace(new RegExp("%" + s, 'g'), r.read("Str" + s));
				}
				this.parent.onFString.call(this.parent.result = _data);
			};
			i.FString.onevent = function() {
				return this.parent.result;
			};
			i.run = function() { this.result = ""; };
			i.onpropchange(i.props.DataCount);
			break;
		case "Counter":
			i.cnt = 0;
			i.doNext.onevent = function (data) {
				var e = this.parent;
				e.cnt += e.props.Step.value;
				if (e.cnt > e.props.Max.value)
					e.cnt = e.props.Min.value;
				e.onCounter.call(e.cnt);
			};
			i.doReset.onevent = function (data) {
				this.parent.run();
				this.parent.onCounter.call(this.parent.cnt);
			};
			i.Value.onevent = function () {
				return this.parent.cnt;
			};
			i.run = function () {
				this.cnt = this.props.Default.value;
				return null;
			};
			break;
		case "Message":
			i.doMessage.onevent = function (data) {
				alert(readProperty(data, this.parent.Text, this.parent.props.Text.value));
				this.parent.onMessage.call(data);
			};
			break;
		case "DoData":
			i.doData.onevent = function (data) {
				this.parent.onEventData.call(readProperty("", this.parent.Data, this.parent.props.Data.value));
			};
			break;
		case "For":
			i.doFor.onevent = function (data) {
				var e = this.parent;
				var r = e.d(data);
				var end = r.readInt("End");
				var start = r.readInt("Start");
				var s = e.props.Step.value;
				for (e.cnt = start; e.cnt < end; e.cnt += s) {
					e.onEvent.call(e.cnt);
				}
				e.onStop.call();
			};
			i.doStop.onevent = function() {
				this.parent.cnt = this.parent.props.End.value;
			};
			i.Position.onevent = function (data) {
				return this.parent.cnt;
			};
			i.run = function(){ this.cnt = 0; };
			break;
		case "Random":
			i.rnd = 0.0;
			i.doRandom.onevent = function (data) {
				this.parent.onRandom.call(this.parent.rnd = Math.random());
			};
			i.Result.onevent = function (data) {
				return this.parent.rnd;
			};
			i.run = function () {
				this.rnd = 0.0;
				return null;
			};
			break;
		case "Memory":
			i.data = "";
			i.doValue.onevent = function (data) {
				this.parent.data = data;
				this.parent.onData.call(data);
			};
			i.doClear.onevent = function (data) {
				this.parent.data = this.parent.props.Default.value;
				this.parent.onData.call("");
			};
			i.Value.onevent = function (data) {
				return this.parent.data;
			};
			i.run = function () {
				this.data = this.props.Default.value;
				return null;
			};
			break;
		case "Image":
			i.doLoad.onevent = function (data) {
				this.parent.ctl.url = readProperty(data, this.parent.URL);
			};
			i.Image.onevent = function (data) {
				return this.parent.ctl.getControl();
			};
			i.run = function (flags) {
				this.ctl = new UIImage({
					url: this.props.URL.value,
					mode: this.props.Mode.value
				});
				
				this.ctl.addListener("load", function() {
					i.onLoad.call();
				});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Figure":
			i.run = function (flags) {
				this.ctl = new SVG({
					shape: this.props.Shape.value,
					fill: this.props.Fill.value,
					stroke: this.props.Stroke.value,
					strokeWidth: this.props.StrokeWidth.value
				});
				if(i.doFill) {
					i.doFill.onevent = function(data) {
						this.parent.ctl.fill(data);
					};
				}

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Loader":
			i.run = function (flags) {
				this.ctl = new UILoader({
					size: this.props.Size.value,
					radius: this.props.Radius.value
				});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "Switcher":
			i.State.onevent = function(){
				return this.parent.ctl.on ? 1: 0;
			};
			i.run = function (flags) {
				this.ctl = new UISwitcher({
					on: this.props.On.value
				});
				
				this.ctl.addListener("onchange", function(value) {
					i.onState.call(value ? 1: 0);
				});
				
				if(this.doOn) {
					this.doOn.onevent = function(data) {
						this.parent.ctl.on = data;
					};
				}

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "ToolBar":
			i.run = function (flags) {
				var array = [];
				if(!this.props.Buttons.isDef()) {
					array = JSON.parse(this.props.Buttons.value);
					var index = 0;
					for(var a of array) {
						if(a.title !== "-") {
							if(!a.tag) {
								a.tag = index;
							}
							a.click = function(btn) {
								i.onClick.call(this.tag);
							};
							index++;
						}
					}
				}
				this.ctl = new ToolBar(array, {url: this.props.URL.value});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "SimpleTable":
			i.onpropchange = function(prop) {
				this.onSelect.args = this.props.Select.getText();
				this.onClick.args = this.props.Select.getText();
			};
			i.run = function (flags) {
				var columns = this.props.Columns.isDef() ? null : JSON.parse(this.props.Columns.value);
				if(columns && translate) {
					for(var col of columns) {
						col.title = translate.translate(col.title);
					}
				}
				this.ctl = new UISimpleTable({
					columns: columns,
					lineheight: this.props.LineHeight.isDef() ? 0 : this.props.LineHeight.value,
					showgrid: this.props.ShowGrid.isDef()
				});
				
				this.ctl.addListener("rowclick", function (item, index) {
					i.onClick.call(i.props.Select.isDef() ? index : item.data);
				});
				this.ctl.addListener("rowselect", function (item, index) {
					i.onSelect.call(i.props.Select.isDef() ? index : item.data);
				});
				this.initPointHandler("doSelectIndex", function (data) {
					if(data >= 0 && data < this.parent.ctl.size()) {
						this.parent.ctl.selectIndex(data);
					}
				});

				return WinElement.prototype.run.call(this, flags);
			};
			i.doAddRow.onevent = function(data) {
				this.parent.ctl.addRow(data);
			};
			i.doClear.onevent = function() {
				this.parent.ctl.clear();
			};
			break;
		case "DropBox":
			i.run = function (flags) {
				this.ctl = new DropBox({
					
				});
				
				this.ctl.addListener("drop", function(file) {
					i.onDropFile.call(file);
				});
				this.ctl.addListener("enddrop", function() {
					i.onEndDrop.call();
				});
				
				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "If_else":
			i.doCompare.onevent = function (data) {
				var d = this.parent.d(data);
				var op1 = d.read("Op1");
				var op2 = d.read("Op2");
				var r;
				switch (this.parent.props.Type.value) {
					case 0:
						r = op1 == op2;
						break;
					case 1:
						r = op1 < op2;
						break;
					case 2:
						r = op1 > op2;
						break;
					case 3:
						r = op1 <= op2;
						break;
					case 4:
						r = op1 >= op2;
						break;
					case 5:
						r = op1 != op2;
						break;
					default:
						r = false;
				}
				if (r)
					this.parent.onTrue.call(data);
				else
					this.parent.onFalse.call(data);
			};
			i.drawIcon = function(ctx) {
				ctx.font = "10px Arial";

				var x = this.x;
				var y = this.y + this.h/2 + 4;
				var text, len;
				ctx.fillStyle = "navy";
				if(!this.props.Op1.isDef()) {
					text = this.props.Op1.value;
					len = ctx.measureText(text).width;
					if(len < 32) {
						ctx.fillText(text, x + (this.w - len)/2, y - 8);
					}
				}
				if(!this.props.Op2.isDef()) {
					text = this.props.Op2.value;
					len = ctx.measureText(text).width;
					if(len < 32) {
						ctx.fillText(text, x + (this.w - len)/2, y + 8);
					}
				}
				ctx.fillStyle = "#000";
				text = this.props.Type.getText();
				len = ctx.measureText(text).width;
				ctx.fillText(text, x + (this.w - len)/2, y);
			};
			i.run = function () {
				return null;
			};
			break;
		case "MathParse":
			i.doCalc.onevent = function (data) {
				var args = [this.parent.result];
				var d = this.parent.d(data);
				for (var name of this.parent.arr) {
					var arg = d.read(name);
					args.push(Array.isArray(arg) ? arg : parseFloat(arg));
				}
				this.parent.result = this.parent.calc(args);
				this.parent.onResult.call(this.parent.result);
			};
			i.doClear.onevent = function (data) {
				this.parent.result = this.parent.props.Default.value;
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.prepareMask = function(mask) {
				var s = mask;
				this.arr = this.props.Args.value.split("\n");
				for(var i = 0; i < this.arr.length; i++) {
					s = s.replace(new RegExp("\\$" + this.arr[i], "g"), "%" + (i+1));
				}
				s = s.replace(/\$result/g, "%0");
				s = s.replace(/([_a-zA-Z]+)/g, function(m, c){ return "Math." + c; });
				s = s.replace(/%([0-9]+)/g, function(m, c){ return "args[" + c + "]"; });
				this.calc = new Function("args", "return " + s);
				Math.point = function(x, y){ return {x: x, y: y}; };
			};
			i.run = function () {
				this.result = this.props.Default.value;
				this.prepareMask(this.props.MathStr.value);
				if(this.doMathStr) {
					this.doMathStr.onevent = function (data) {
						this.parent.prepareMask(data);
					};
				}
				
				return null;
			};
			i.onpropchange = function(prop) {
				DPLElement.prototype.onpropchange.call(this, prop);
				
				if(prop === this.props.DataCount && this.props.Args.isDef()) {
					var arr = [];
					for(var i = 1; i <= prop.value; i++) {
						arr.push("X" + i);
					}
					this.props.Args.value = arr.join("\n");
					this.onpropchange(this.props.Args);
				}
			};
			i.onpropchange(i.props.Args);
			break;
		case "StrCat":
			i.doStrCat.onevent = function (data) {
				var d = this.parent.d(data);
				this.parent.result = d.read("Str1") + d.read("Str2");
				this.parent.onStrCat.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			break;
		case "StrPart":
			i.doSplit.onevent = function (data) {
				var str = this.parent.d(data).read("Str");
				var c = this.parent.props.Char.value;
				var i = str.indexOf(c);
				if(i >= 0) {
					this.parent.onPart.call(this.parent.result = str.substr(0, i));
					this.parent.onSplit.call(str.substr(i+c.length));
				}
				else {
					this.parent.onSplit.call(str);
				}
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			break;
		case "StrList":
			i.doAdd.onevent = function (data) {
				this.parent.array.push(readProperty(data, this.parent.Str));
				this.parent.onChange.call();
			};
			i.doText.onevent = function (data) {
				this.parent.array = data.split("\n");
				this.parent.onChange.call();
			};
			i.Text.onevent = function (data) {
				return this.parent.array.join("\n");
			};
			i.Array.onevent = function (data) {
				return this.parent.array;
			};
			i.run = function () {
				this.array = this.props.Strings.value ? this.props.Strings.value.split("\n") : [];
				if(i.doDelete) {
					i.doDelete.onevent = function(data) {
						this.parent.array.splice(data, 1);
						this.parent.onChange.call();
					};
				}
			};
			break;
		case "Copy":
			i.doCopy.onevent = function (data) {
				var d = this.parent.d(data);
				this.parent.result = d.read("Str").substr(d.readInt("Position"), d.readInt("Count"));
				this.parent.onCopy.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			break;
		case "Position":
			i.doPosition.onevent = function (data) {
				var d = this.parent.d(data);
				this.parent.result = d.read("String").indexOf(d.read("Search"), d.readInt("FromIndex"));
				this.parent.onPosition.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.run = function(){ this.parent.result = -1; };
			break;
		case "Replace":
			i.doReplace.onevent = function (data) {
				var d = this.parent.d(data);
			    this.parent.result = d.read("SrcStr").
			    	replace(this.parent.props.UseRegExp.isDef() ? d.read("SubStr") : new RegExp(d.read("SubStr"), 'g'), d.read("DestStr"));
				this.parent.onReplace.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.run = function(){ this.parent.result = ""; };
			break;
		case "Insert":
			i.doInsert.onevent = function (data) {
				var flow = this.parent.d(data);
				var str = flow.read("Str");
			    var substr = flow.read("SubStr");
			    var pos = flow.read("Position");
			    this.parent.result = str.substr(0, pos) + substr + str.substr(pos);
				this.parent.onInsert.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.run = function(){ this.parent.result = ""; };
			break;
		case "Delete":
			i.doDelete.onevent = function (data) {
				var d = this.parent.d(data);
				var s = d.read("Str");
				var pos = d.readInt("Position");
				var count = d.readInt("Count");
			    this.parent.result = s.substr(0, pos) + s.substr(pos + count);
				this.parent.onDelete.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.run = function(){ this.parent.result = ""; };
			break;
		case "Length":
			i.doLength.onevent = function (data) {
				this.parent.result = readProperty(data, this.parent.Str).toString().length;
				this.parent.onLength.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.run = function(){ this.parent.result = 0; };
			break;
		case "StrCase":
			i.doModify.onevent = function (data) {
				var s = this.parent.d(data).read("Str");
				this.parent.result = this.parent.props.Type.isDef() ? s.toLowerCase() : s.toUpperCase();
				this.parent.onModify.call(this.parent.result);
			};
			i.Result.onevent = function (data) {
				return this.parent.result;
			};
			i.run = function(){ this.parent.result = ""; };
			break;
		case "RE_Search":
			i.doExec.onevent = function(data) {
				var str = readProperty(data, this.parent.String, "");
				var reg = new RegExp(this.parent.props.Mask.value, "");
				var arr = reg.exec(str);
				if(arr) {
					var result = [];
					for(var i = 1; i < arr.length; i++) {
						result.push(arr[i]);
					}
					this.parent.onExec.call(result);
				}
				else {
					this.parent.onNotFound.call();
				}
			};
			break;
		case "FileInfo":
			i.doInfo.onevent = function(data) {
				this.parent.file = readProperty(data, this.parent.File);
				this.parent.onInfo.call(this.parent.file);
			};
			i.Name.onevent = function(){
				return this.parent.file ? this.parent.file.name : "";
			};
			i.Size.onevent = function(){
				return this.parent.file ? this.parent.file.size : -1;
			};
			i.Mime.onevent = function(){
				return this.parent.file ? this.parent.file.type : "";
			};
			i.Time.onevent = function(){
				return this.parent.file ? this.parent.file.lastModified : "";
			};
			break;
		case "FileRead":
			i.doRead.onevent = function(data) {
				var file = readProperty(data, this.parent.File);
				
				var reader = new FileReader();
		    	reader.onload = function(e) {
	    			i.onRead.call(e.target.result);
		    	};
		    	switch(this.parent.props.Type.value) {
		    		case 0: reader.readAsText(file); break;
		    		case 1: reader.readAsBinaryString(file); break;
		    		case 2: reader.readAsDataURL(file); break;
		    	}
			};
			break;
		case "ODialog":
			i.doExecute.onevent = function(data) {
				var input = document.createElement("input");
				input.setAttribute("type", "file");
				if(!this.parent.props.Filter.isDef()) {
					input.setAttribute("accept", this.parent.props.Filter.value);
				}
				if(!this.parent.props.Select.isDef()) {
					input.setAttribute("multiple", "");
				}
				input.click();
				input.addEventListener("change", function(event){
					for(var f = 0; f < this.files.length; f++) {
						i.onExecute.call(this.files[f]);
					}
				});
			};
			break;
		case "Timer":
			var f = {func: function () {
					this.e.onTimer.call();
					if (this.e.auto) {
						this.e.start();
						this.e.auto--;
					}
				}, e: i};
			i.doTimer.onevent = function (data) {
				if (this.parent.props.AutoStop.value) {
					this.parent.auto = this.parent.props.AutoStop.value - 1;
					this.parent.start();
				} else {
					clearInterval(this.id);
					this.parent.id = setInterval(function () {
						f.func.call(f);
					}, this.parent.props.Interval.value);
				}
			};
			i.doStop.onevent = function (data) {
				clearInterval(this.parent.id);
			};
			i.run = function () {
				clearInterval(this.id);
				return null;
			};

			i.start = function () {
				setTimeout(function () {
					f.func.call(f);
				}, this.props.Interval.value);
			};
			break;
		case "GeoLocation":
			i.doLocation.onevent = function(data){
				navigator.geolocation.getCurrentPosition(function(pos){
					i.onLocation.call([pos.coords.latitude, pos.coords.longitude]);
				});
			};
			break;
		case "MainForm":
			i.doShow.onevent = function() {
				this.parent.ctl.show({noCenter: !this.parent.props.Position.isDef()});
			};
			i.doClose.onevent = function() {
				this.parent.ctl.close();
			};
			i.run = function(flags) {
				// if(flags & window.FLAG_USE_EDIT) {
				// 	return null;
				// }

				this.ctl = new Dialog({
					title: this.props.Caption.getTranslateValue(),
					icon: this.props.URL.value,
					destroy: !(flags & window.FLAG_USE_CHILD || flags & window.FLAG_USE_EDIT),
					resize: this.props.Resize.value && !(flags & window.FLAG_USE_EDIT),
					width: this.props.Width.value,
					height: this.props.Height.value,
					modal: !(flags & window.FLAG_USE_EDIT),
					popup: !(flags & window.FLAG_USE_EDIT),
					showcaption: this.props.ShowCaption.isDef(),
					showborder: this.props.ShowBorder.isDef()
				});
				
				if(flags & window.FLAG_USE_EDIT) {
					this.ctl.addListener("close", function(){ return false; });
				}
				
				this.ctl.layout = this.getLayout(this.ctl);
				
				WinElement.prototype.run.call(this, flags);
				if(!(flags & window.FLAG_USE_CHILD)) {
					this.ctl.show({noCenter: !this.props.Position.isDef()});
				}
				return this.ctl
			};
			i.oninit = function() {
				this.onCreate.call();
			};
			i.addPoint = function(name, type) {
				var point = SdkElement.prototype.addPoint.call(this, name, type);
				if(name === "doCaption") {
					point.onevent = function (data) {
						this.parent.ctl.caption = data;
					};
				}
				return point;
			};
			i.getChild = function(){
				return null;
			};

			i.flags |= window.IS_PARENT;
			break;
		case "Host":
			i.doIP.onevent = function() {
				$.get("server/core.php?ip", function(data, object) {
					object.onIP.call(data);
				}, this.parent);
			};
			break;
		case "URLBuilder":
			i.doBuild.onevent = function(data) {
				var d = this.parent.d(data);
				var result = "";
				for(var i in this.parent.points) {
					var point = this.parent.points[i];
					if(point.type === pt_data) {
						if(result) {
							result += "&";
						}
						result += point.name + "=" + encodeURIComponent(d.read(point.name));
					}
				}
				this.parent.onBuild.call(this.parent.result = result);
			};
			i.Result.onevent = function() {
				return this.parent.result;
			};
			i.onpropchange(i.props.Args);
			break;
		case "HTTP_Get":
			i.doDownload.onevent = function(data) {
				$.post("server/core.php", {url: readProperty(data, this.parent.URL, this.parent.props.URL.value)}, function(data, object) {
					if(this.status != 200) {
						var error = JSON.parse(data);
						object.onError.call(error.code);
					}
					else {
						object.onDownload.call(data);
					}
				}, this.parent);
			};
			break;
		case "XMLHttpRequest":
			i.doOpen.onevent = function(data) {
				this.parent.xhr = new XMLHttpRequest();
				var method = this.parent.props.Method.getText();
				this.parent.xhr.open(method, this.parent.d(data).read("URL"), true);
				if(method === "POST") {
					this.parent.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				}
			};
			i.doSend.onevent = function(data) {
				this.parent.xhr.send(this.parent.d(data).read("Content"));
				this.parent.xhr.onload = function() {
					i.data = this.responseText;
					i.onLoad.call(i.data);
				};
			};
			i.Data.onevent = function(data) {
				return this.parent.data;
			};
			break;
		case "MultiElementEditor":
			i.flags |= IS_NODELETE;
			i.w = i.sys.Width.value;
			i.h = i.sys.Height.value;
			i.draw = function(ctx) {
				ctx.strokeStyle = this.sys.Color.value;
				ctx.strokeRect(this.x, this.y, this.w, this.h);
				if(this.isSelect()) {
					ctx.strokeRect(this.x+1, this.y+1, this.w-2, this.h-2);
				}
				
				if(this.isSelect()) {
					ctx.lineWidth = 3;
					ctx.strokeStyle = "#00f";
					var vy = this.y + this.sys.VOffset.value;
					ctx.drawLine(this.x + this.w - 20, vy, this.x + this.w, vy);
					
					var vx = this.x + this.sys.HOffset.value;
					ctx.drawLine(vx, this.y + this.h - 20, vx, this.y + this.h);
					ctx.lineWidth = 1;
				}
				
				this.drawPoints(ctx);
			};
			i.inPoint = function(x, y) {
				return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h &&
						(x - this.x <= 5 || y - this.y <= 5 || this.x+this.w - x <= 5 || this.y+this.h - y <= 5 || this.getState(x, y));
			};
			i.inRect = function() { return false; };
			i.getState = function(x, y) {
				if(this.isSelect()) {
					var _y = this.y + this.sys.VOffset.value;
					if(x > this.x + this.w - 20 && y > _y-1 && y < _y + 3) {
						return 10;
					}
					var _x = this.x + this.sys.HOffset.value;
					if(y > this.y + this.h - 20 && x > _x-1 && x < _x + 3) {
						return 11;
					}
				}
				
				return SizeElement.prototype.getState.call(this, x, y);
			};
			i.getCursor = function(x, y) {
				var index = this.mouseState || this.getState(x, y);
				if(index == 10) {
					return "row-resize";
				}
				if(index == 11) {
					return "col-resize";
				}
				
				return SizeElement.prototype.getCursor.call(this, x, y);
			};
			i.mouseMove = function(x, y, emouse) {
				if(this.mouseState == 10) {
					var deltaY = window.toStep(emouse.startY - y);
					if(deltaY) {
						emouse.startY -= deltaY;
						this.sys.VOffset.value -= deltaY;
						var h = window.toStep(this.h - Math.max(this.psize[0], this.psize[1])*7);
						if(this.sys.VOffset.value > h) {
							this.sys.VOffset.value = h;
						}
						else if(this.sys.VOffset.value < 0) {
							this.sys.VOffset.value = 0;
						}
						this.rePosPoints();
					}
				}
				else if(this.mouseState == 11) {
					var deltaX = window.toStep(emouse.startX - x);
					if(deltaX) {
						emouse.startX -= deltaX;
						this.sys.HOffset.value -= deltaX;
						var w = window.toStep(this.w - Math.max(this.psize[2], this.psize[3])*7);
						if(this.sys.HOffset.value > w) {
							this.sys.HOffset.value = w;
						}
						else if(this.sys.HOffset.value < 0) {
							this.sys.HOffset.value = 0;
						}
						this.rePosPoints();
					}
				}
				else {
					SizeElement.prototype.mouseMove.call(this, x, y, emouse);
				}
			};
			i.onpropchange = function(prop) {
				if(prop === this.sys.Width) {
					this.w = this.sys.Width.value;
					this.rePosPoints();
				}
				else if(prop === this.sys.Height) {
					this.h = this.sys.Height.value;
					this.rePosPoints();
				}
				else if(prop === this.sys.VOffset || prop === this.sys.HOffset) {
					this.rePosPoints();
				}
				else {
					var oldW = this.w;
					var oldH = this.h;

					var arr = {WorkCount:0, EventCount:1, VarCount:2, DataCount:3};
					var arrNames = ["doWork", "onEvent", "Var", "Data"];
					var t = arr[prop.name];
					{
						var newType = t < 2 ? 1 - t : 5 - t;
						var eDelta = prop.value - this.psize[newType];
						if(eDelta > 0) {
							for(var i = 0; i < eDelta; i++) {
								var _name = arrNames[t] + (this.psize[newType] + 1);

								var pointParent = this.parent.parentElement.addPoint(_name, t+1);
								var point = this.addPoint(_name, newType+1);
								if(t === 0) {
									pointParent.onevent = function(data) {
										var e = this.parent.sdk.imgs[0];
										e[this.name].call(data);
									};
								}
								else if(t === 1) {
									point.onevent = function(data) {
										this.parent.parent.parentElement[this.name].call(data);
									};
								}
								else if(t === 2) {
									pointParent.onevent = function(data) {
										var e = this.parent.sdk.imgs[0];
										return e[this.name].call(data);
									};
								}
								else if(t === 3) {
									point.onevent = function(data) {
										return this.parent.parent.parentElement[this.name].point.onevent(data);
									};
								}

							}
						}
						else if(eDelta < 0) {
							for(var i = 0; i < -eDelta; i++) {
								var _name = arrNames[t] + this.psize[newType];
								if(this.points[_name].isFree() && this.parent.parentElement.points[_name].isFree()) {
									this.removePoint(_name);
									this.parent.parentElement.removePoint(_name);
								}
								else {
									prop.value += -eDelta - i;
									break;
								}
							}
						}
					}
					
					if(this.w < oldW) {
						this.w = oldW;
					}
					if(this.h < oldH) {
						this.h = oldH;
					}
					this.rePosPoints();
				}
			};
			i.rePosPoints = function() {
				SdkElement.prototype.rePosPoints.call(this);
				for(var i in this.points) {
					var point = this.points[i];
					if(point.type === 1) {
						point.pos.x += this.w;
						point.pos.y += this.sys.VOffset.value;
					}
					else if(point.type === 2) {
						point.pos.x -= this.w;
						point.pos.y += this.sys.VOffset.value;
					}
					else if(point.type === 3) {
						point.pos.y -= this.h;
						point.pos.x += this.sys.HOffset.value;
					}
					else if(point.type === 4) {
						point.pos.y += this.h;
						point.pos.x += this.sys.HOffset.value;
					}
				}
			};
			break;
		case "MultiElementEx":
			i.sdk = new SDK(i.parent.pack);
			i.sdk.parent = i.parent;
			i.sdk.parentElement = i;
			var offset = window.getOptionInt("opt_multi_offset", 7);
			i.sdk.add("MultiElementEditor", offset, offset);
			i.run = function(flags) {
				// if(flags & window.FLAG_USE_RUN) {
					return this.sdk.run(flags | window.FLAG_USE_CHILD);
				// }
			};
			break;
		case "Array":
			i.doClear.onevent = function(data) {
				this.parent.array = [];
				this.parent.onClear.call();
			};
			i.Array.onevent = function() {
				return this.parent.array;
			};
			i.run = function(){
				this.array = this.props.Array.isDef() ? [] : JSON.parse(this.props.Array.value);
			};
			break;
		case "Matrix":
			i.doClear.onevent = function(data) {
				this.parent.run();
				this.parent.onClear.call(this.parent.array);
			};
			i.Array.onevent = function() {
				return this.parent.array;
			};
			i.run = function() {
				this.array = [];
				if(!this.props.Array.isDef()) {
					this.array = JSON.parse(this.props.Array.value);
				}
				else if(!this.props.Width.isDef() && !this.props.Height.isDef()) {
					for(var x = 0; x < this.props.Height.value; x++) {
						var a = [];
						for(var y = 0; y < this.props.Width.value; y++) {
							a.push(0);
						}
						this.array.push(a);
					}
				}
			};
			break;
		case "ArrayRead":
			i.doRead.onevent = function(data) {
				var d = this.parent.d(data);
				var array = d.read("Array");
				var index = d.readInt("Index");
				if(index >= 0 && index < array.length) {
					this.parent.onRead.call(this.parent.value = array[index]);
				}
			};
			i.Value.onevent = function() {
				return this.parent.value;
			};
			break;
		case "ArrayRemove":
			i.doRemove.onevent = function(data) {
				var d = this.parent.d(data);
				var array = d.read("Array");
				var index = d.readInt("Index");
				array.splice(index, 1);
				this.parent.onRemove.call(array);
			};
			break;
		case "ArrayWrite":
			i.doWrite.onevent = function(data) {
				var d = this.parent.d(data);
				var array = d.read("Array");
				var index = d.readInt("Index");
				array[index] = d.read("Value");
				this.parent.onWrite.call(array);
			};
			break;
		case "ArrayAdd":
			i.doAdd.onevent = function(data) {
				var d = this.parent.d(data);
				var array = d.read("Array");
				array.push(d.read("Value"));
				this.parent.onAdd.call(array);
			};
			break;
		case "ArraySize":
			i.arraySize = -1;
			i.doSize.onevent = function(data) {
				var array = readProperty(data, this.parent.Array);
				this.parent.onSize.call(this.parent.arraySize = array.length);
			};
			i.Size.onevent = function(data) {
				return this.parent.arraySize;
			};
			break;
		case "ArrayEnum":
			i.doEnum.onevent = function(data) {
				var array = readProperty(data, this.parent.Array);
				if(this.parent.props.Direction.value === 0) {
					for(var i in array) {
						this.parent.index = i;
						this.parent.onEnum.call(this.parent.item = array[i]);
					}
				}
				else {
					for(var i = array.length-1; i >= 0; i--) {
						this.parent.index = i;
						this.parent.onEnum.call(this.parent.item = array[i]);
					}
				}
				this.parent.onEnd.call();
			};
			i.Item.onevent = function() {
				return this.parent.item;
			};
			i.Index.onevent = function() {
				return this.parent.index;
			};
 			break;
		case "MatrixEnum":
			i.doEnum.onevent = function(data) {
				var m = this.parent.d(data).read("Matrix");
				for(var row = 0; row < m.length; row++) {
					for(var col = 0; col < m[row].length; col++) {
						this.parent.index = [col,row];
						this.parent.item = m[row][col];
						if(this.parent.props.Data.isDef()) {
							this.parent.onEnum.call(this.parent.item);
						}
						else {
							this.parent.onEnum.call([this.parent.item, col, row]);
						}
					}
				}
				this.parent.onEnd.call();
			};
			i.Item.onevent = function() {
				return this.parent.item;
			};
			i.Index.onevent = function() {
				return this.parent.index;
			};
 			break;
		case "MatrixRead":
			i.doRead.onevent = function(data) {
				var d = this.parent.d(data);
				var m = d.read("Matrix");
				var index = d.read("Index");
				if(index[1] >= 0 && index[1] < m.length) {
					var row = m[index[1]];
					if(index[0] >= 0 && index[0] < row.length) {
						this.parent.onRead.call(this.parent.value = row[index[0]]);
					}
				}
			};
			i.Value.onevent = function() {
				return this.parent.value;
			};
			break;
		case "MatrixWrite":
			i.doWrite.onevent = function(data) {
				var d = this.parent.d(data);
				var m = d.read("Matrix");
				var index = d.read("Index");
				var value = d.read("Value");
				if(index[1] >= 0 && index[1] < m.length) {
					var row = m[index[1]];
					if(index[0] >= 0 && index[0] < row.length) {
						row[index[0]] = value;
						this.parent.onWrite.call(m);
					}
				}
			};
			break;
			
		case "YaMap":
			i.doPlacemark.onevent = function(data) {
				this.parent.ctl.setPlacemark(data[0], data[1], data[2], data[3]);
			};
			i.doGoto.onevent = function(data) {
				this.parent.ctl.setCenter(data[0], data[1]);
			};
			i.run = function (flags) {
				this.ctl = new YaMap();

				return WinElement.prototype.run.call(this, flags);
			};
			i.oninit = function() {
				WinElement.prototype.oninit.call(this);
				
				this.ctl.init();
				this.ctl.addListener("coords", function(posXY) {
					i.onCoords.call(posXY);
				});
			};
			break;
		case "YouTube":
			i.run = function(flags) {
				this.ctl = new YouTube({url: this.props.URL.value});

				return WinElement.prototype.run.call(this, flags);
			};
			break;
		case "ChartData":
			i.Data.onevent = function() {
				if(!this.parent.data) {
					this.parent.init();
				}
				return this.parent.data;
			};
			i.init = function(){
				if(this.props.Array.isDef()) {
					this.data = new window.google.visualization.DataTable();
				}
				else {
					this.data = window.google.visualization.arrayToDataTable(JSON.parse(this.props.Array.value));
				}
			};
			i.run = function(){ this.data = null; };
			break;
		case "ChartDataSet":
			i.doSet.onevent = function(data) {
				var d = this.parent.d(data);
				var dataTable = d.read("Data");
				dataTable.setValue(d.readInt("Row"), d.readInt("Column"), d.read("Value"));
				this.parent.onSet.call(dataTable);
			};
			break;
		case "ChartDataAddColumn":
			i.doAdd.onevent = function(data) {
				var d = this.parent.d(data);
				var dataTable = d.read("Data");
				dataTable.addColumn(["string", "number"][this.parent.props.Type.value], d.read("Title"));
				this.parent.onAdd.call(dataTable);
			};
			break;
		case "ChartDataAddRow":
			i.doAdd.onevent = function(data) {
				var d = this.parent.d(data);
				var dataTable = d.read("Data");
				dataTable.addRow(d.read("Value"));
				this.parent.onAdd.call(dataTable);
			};
			break;
		case "ChartPie":
			i.run = function(flags) {
				this.ctl = new GoogleChart({
					theme: flags & FLAG_USE_EDIT ? "invisible-control" : "",
					chart: "PieChart",
					title: this.props.Title.value,
					pieHole: this.props.Hole.value,
					chartArea: {
						left: this.props.AreaLeft.value,
						top: this.props.AreaTop.value,
						width: this.props.AreaWidth.value,
						height: this.props.AreaHeight.value
					}
				});

				return WinElement.prototype.run.call(this, flags);
			};
			i.doDraw.onevent = function(data) {
				this.parent.ctl.draw(readProperty(data, this.parent.Data));
			};
			i.oninit = function() {
				WinElement.prototype.oninit.call(this);
				
				this.ctl.init();
			};
			break;
		case "ChartGauge":
			i.run = function(flags) {
				this.ctl = new GoogleChart({
					chart: "Gauge"
				});

				return WinElement.prototype.run.call(this, flags);
			};
			i.doDraw.onevent = function(data) {
				this.parent.ctl.draw(readProperty(data, this.parent.Data));
			};
			i.oninit = function() {
				WinElement.prototype.oninit.call(this);
				
				this.ctl.init();
			};
			break;
		case "ChartLine":
			i.run = function(flags) {
				this.ctl = new GoogleChart({
					chart: "LineChart"
				});

				return WinElement.prototype.run.call(this, flags);
			};
			i.doDraw.onevent = function(data) {
				this.parent.ctl.draw(readProperty(data, this.parent.Data));
			};
			i.oninit = function() {
				WinElement.prototype.oninit.call(this);
				
				this.ctl.init();
			};
			break;
		case "Firebase":
			i.run = function(flags) {
				if(!(flags & window.FLAG_USE_EDIT)) {
					var parent = this;
					$.appendScript("https://www.gstatic.com/firebasejs/live/3.0/firebase.js", function(){
						var config = {
							apiKey: parent.props.ApiKey.value,
							authDomain: parent.props.AuthDomain.value,
							databaseURL: parent.props.DatabaseURL.value,
							storageBucket: parent.props.StorageBucket.value,
						};
						parent.fb = firebase.initializeApp(config);
						parent.onInit.call(parent.fb);
						
						firebase.auth().onAuthStateChanged(function(user){
							i.onAuthStateChanged.call(user ? 1 : 0);
						});
					});
				}
			};
			break;
		case "FBNode":
			i.doReference.onevent = function(data) {
				this.parent.node = firebase.database().ref(this.parent.d(data).read("Path"));
				this.parent.onReference.call(this.parent.node);
			};
			i.Node.onevent = function() {
				return this.parent.node;
			};
			break;
		case "FBSendMessage":
			i.doSend.onevent = function(data) {
				var d = this.parent.d(data);
				var node = d.read("Node");
				var msg = d.read("Message");
				switch(this.parent.props.Mode.value) {
					case 0:
						node.set(msg);
						break;
					case 1:
						node.push(msg);
						break;
					case 2:
						node.update(msg);
						break;
				}
				this.parent.onSend.call(node);
			};
			break;
		case "FBFilter":
			i.doFilter.onevent = function(data) {
				var d = this.parent.d(data);
				var node = d.read("Node");
				var value = d.read("Value");
				switch(this.parent.props.Mode.value) {
					case 0:
						node.limitToFirst(value);
						break;
					case 1:
						node.limitToLast(value);
						break;
				}
				this.parent.onFilter.call(node);
			};
			break;
		case "FBListen":
			i.run = function() {
				if(this.node) {
					this.node.off(this.getHandler(), this.handler);
					this.node = null;
				}
			};
			i.getHandler = function() {
				return ["value", "child_added", "child_changed", "child_removed"][this.props.Event.value];
			};
			i.doListen.onevent = function(data) {
				var d = this.parent.d(data);
				this.parent.node = d.read("Node");
				
				this.parent.handler = this.parent.node.on(this.parent.getHandler(), function(data){
					i.onListen.call(data.val());
				});
			};
			break;
		case "FBUserCreate":
			i.doCreate.onevent = function(data) {
				var d = this.parent.d(data);
				var mail = d.read("EMail");
				var pass = d.read("Password");
				firebase.auth().createUserWithEmailAndPassword(mail, pass).then(
					function(){
						i.onCreate.call();
					},
					function(error) {
						i.onError.call([error.code, error.message]);
					}
				);
				
			};
			break;
		case "FBUserSignIn":
			i.doSignIn.onevent = function(data) {
				var d = this.parent.d(data);
				var mail = d.read("EMail");
				var pass = d.read("Password");
				var auth = null;
				switch(this.parent.props.Method.value) {
					case 0:
						auth = firebase.auth().signInWithEmailAndPassword(mail, pass);
						break;
					case 1:
						var provider = new firebase.auth.GoogleAuthProvider();
						auth = firebase.auth().signInWithPopup(provider);
						break;
				}
				auth.then(
					function(){
						i.onSignIn.call();
					},
					function(error) {
						i.onError.call([error.code, error.message]);
					}
				);
				
			};
			i.doSignOut.onevent = function(data) {
				firebase.auth().signOut();
			};
			break;
		case "FBUserProfile":
			i.run = function() {
				if(i.doDisplayName) {
					i.doDisplayName.onevent = function(data) {
						if(firebase.auth().currentUser) {
							firebase.auth().currentUser.updateProfile({
								displayName: data
							}).then(function() {

							}, function(error) {

							});
						}
					};
				}
				if(i.doPhotoURL) {
					i.doPhotoURL.onevent = function(data) {
						if(firebase.auth().currentUser) {
							firebase.auth().currentUser.updateProfile({
								photoURL: data
							}).then(function() {

							}, function(error) {

							});
						}
					};
				}
			};
			i.DisplayName.onevent = function() {
				var user = firebase.auth().currentUser;
				return user ? user.displayName : "guest";
			};
			i.EMail.onevent = function() {
				var user = firebase.auth().currentUser;
				return user ? user.email : "";
			};
			i.PhotoURL.onevent = function() {
				var user = firebase.auth().currentUser;
				return user ? user.photoURL : "";
			};
			i.UID.onevent = function() {
				var user = firebase.auth().currentUser;
				return user ? user.uid : 0;
			};
			break;
		case "VideoPlayer":
			i.run = function(flags) {
				this.ctl = new VideoPlayer({url: this.props.URL.value, controls: this.props.Controls.value, autoplay: this.props.Autoplay.value});
				this.ctl.addListener("ended", function(){
					i.onPlay.call();
				});
				
				if(i.doURL) {
					i.doURL.onevent = function(data) {
						this.parent.ctl.load(data);
					};
				}

				return WinElement.prototype.run.call(this, flags);
			};
			i.doPlay.onevent = function(data) {
				this.parent.ctl.play();
			};
			i.doPause.onevent = function(data) {
				this.parent.ctl.pause();
			};
			i.Paused.onevent = function(data) {
				return this.parent.ctl.paused() ? 1 : 0;
			};
			break;
		case "AudioPlayer":
			i.run = function(flags) {
				this.ctl = new AudioPlayer({url: this.props.URL.value, controls: this.props.Controls.value, autoplay: this.props.Autoplay.value});
				this.ctl.addListener("ended", function(){
					i.onPlay.call();
				});
				
				if(i.doURL) {
					i.doURL.onevent = function(data) {
						this.parent.ctl.load(data);
					};
				}

				return WinElement.prototype.run.call(this, flags);
			};
			i.doPlay.onevent = function(data) {
				this.parent.ctl.play();
			};
			i.doPause.onevent = function(data) {
				this.parent.ctl.pause();
			};
			i.Paused.onevent = function(data) {
				return this.parent.ctl.paused() ? 1 : 0;
			};
			break;
		case "Inline":
			i.run = function() {
				this.script = eval("new Object({" + this.props.Code.value + "})");
				this.script.element = this;
				
				for(var i = 1; i <= this.props.WorkCount.value; i++) {
					this["doWork" + i].onevent = function(element, index) { return function(data) {
						element.script["doWork" + index](data, index-1);
					}}(this, i);
				}
				for(var i = 1; i <= this.props.EventCount.value; i++) {
					this.script["onEvent" + i] = function(index){ return function(data) {
						this.element["onEvent" + index].call(data);
					} }(i);
				}
			};
			break;
		case "Notification":
			i.showNotify = function(data) {
				var text = readProperty(data, this.Text, this.props.Text.value);
				var options = {
					body: readProperty(data, this.Content, this.props.Content.value),
					icon: this.props.IconURL.value
				};
				this.notification = new window.Notification(text, options);
				this.notification.parent = this;
				this.notification.onclose = function(){
					this.parent.onClose.call();
				};
				this.notification.onclick = function(){
					this.parent.onClick.call();
				};
			};
			i.doNotify.onevent = function(data) {
				var notify = this.parent;
				if(window.Notification.permission !== "denied") {
					window.Notification.requestPermission(function (permission) {
						if (permission === "granted") {
							notify.showNotify(data);
						}
				    });
				}
				else if(window.Notification.permission === "granted") {
					this.parent.showNotify(data);
				}
			};
			i.doClose.onevent = function(data) {
				if(this.parent.notification) {
					this.parent.notification.close();
				}
			};
			i.run = function(){ this.notification = null; };
			break;
		case "hcTransmitter":
			i.onreturn = function(data) { console.log("Transmit: ", data); };
			i.doReturn.onevent = function(data) {
				var options = [];
				var d = this.parent.d(data);
				for(var j = 0; j < this.parent.props.DataCount.value; j++) {
					options.push(d.read("Arg" + (j+1)));
				}
				
				this.parent.onreturn(options);
			};
			break;
		case "Converter":
			i.doConvert.onevent = function(data) {
				var result = "";
				switch(this.parent.props.Mode.value) {
					case 0:
						result = this.parent.d(data).read("Data").toString();
						break;
					case 1:
						result = parseInt(this.parent.d(data).read("Data"));
						break;
					case 2:
						result = Math.round(this.parent.d(data).readFloat("Data"));
						break;
					case 3:
						result = this.parent.d(data).read("Data").charCodeAt(0);
						break;
					case 4:
						result = String.fromCharCode(this.parent.d(data).readInt("Data"));
						break;
				}
				this.parent.onConvert.call(this.parent.result = result);
			};
			i.Result.onevent = function(){
				return this.parent.result;
			};
			break;
		case "Stack":
			i.doPush.onevent = function(data) {
				var dt = this.parent.d(data).read("Data");
				this.parent.stack.push(dt);
				this.parent.onPush.call(dt);
			};
			i.doPop.onevent = function(data) {
				if(this.parent.stack.length) {
					this.parent.result = this.parent.stack.pop();
					this.parent.onPop.call(this.parent.result);
				}
			};
			i.Result.onevent = function(){
				return this.parent.result;
			};
			i.run = function(){
				this.stack = [];
				this.result = "";
			};
			break;
		case "GlobalVar":
			Object.defineProperty(i, "var", {
				get: function() {
					return Math["_" + i.props.Name.value];
				},
				set: function(value) {
					Math["_" + i.props.Name.value] = value;
					if(i.props.Save.value) {
						window.localStorage["gv_" + i.props.Name.value] = value;
					}
				}
			});

			i.doValue.onevent = function(data) {
				this.parent.var = data;
				this.parent.onValue.call(data);
			};
			i.Var.onevent = function(){
				return this.parent.var;
			};
			i.run = function() {
				if(this.props.Save.value) {
					this.var = window.localStorage["gv_" + this.props.Name.value] || this.props.Default.value;
				}
				else if(!this.var || !this.props.Default.isDef()) {
					this.var = this.props.Default.value;
				}
			};
			break;
		case "Time":
			i.doTime.onevent = function(data) {
				this.parent.time = data ? new Date(data) : new Date();
				this.parent.onTime.call(this.parent.time);
			};
			i.run = function() {
				this.time = new Date();
			};
			
			i.FormatTime.onevent = function() {
				switch(this.parent.props.Format.value) {
					case 0: return this.parent.time.toUTCString();
					case 1: return this.parent.time.toISOString();
					case 2: return this.parent.time.toLocaleString();
				}
				return this.parent.time.toString();
			};
			i.TimeMillis.onevent = function() {
				return this.parent.time.getTime();
			};
			break;
	}
	
	return i;
}

//******************************************************************************
// HubsEx
//******************************************************************************

function HubsEx(name) {
	SdkElement.call(this, name);

	this.hidePoints = true;
	this.w = this.h = this.minH = this.minW = 11;
}

HubsEx.prototype = Object.create(SdkElement.prototype);

HubsEx.prototype.mouseGetPoint = function() { return this.isSelect(); };

HubsEx.prototype.connectToPoint = function(point) {
	var fp = null;
	var lastDist = 32768;
	for(var p in this.points) {
		var pt = this.points[p];
		var dist = Math.sqrt((pt.pos.x - point.pos.x)*(pt.pos.x - point.pos.x) + (pt.pos.y - point.pos.y)*(pt.pos.y - point.pos.y));
		if(pt.type === point.getPair() && !pt.point && (!fp || dist < lastDist)) {
			fp = pt;
			lastDist = dist;
		}
	}
	if(fp) {
		point.connect(fp).createPath();
	}
};

HubsEx.prototype.updateSizes = function() {};

function hubDirection(pp1, pp2, t) {
	if(pp1.x === pp2.x)
		if(pp1.y > pp2.y)
			return (3 + t) % 4;
		else
			return 1 + t;
	else
		if(pp1.x > pp2.x)
			return 2 + t;
		else
			return t;
}

var hx_dirs = [
      [1, 0, 0, 2],
      [1, 0, 2, 0],
      [0, 0, 1, 2],
      [1, 0, 0, 2] ];
       
HubsEx.prototype.insertInLine = function(point, pos) {
	var i = hubDirection(pos, pos.next, this.name === "HubEx" ? 0 : 1);
	var k;
	k = i;

	this.props.Angle.setValue(i);
    var p2 = pos.next;
    var pointOne = this.points[this.pIndex[3]];
    this.injectElementAtLine(point, this.points[ this.pIndex[hx_dirs[i][k]] ], pointOne, pos);
	if(pos.x === p2.x)
		this.move(pos.x - pointOne.pos.x, 0);
	else if(pos.y === p2.y)
		this.move(0, pos.y - pointOne.pos.y);
};

//------------------------------------------------------------------------------

function HubEx(id) {
	HubsEx.call(this, id);
	
	this.pIndex = ["doWork1", "doWork2", "doWork3", "onEvent"];
}

HubEx.prototype = Object.create(HubsEx.prototype);

HubEx.prototype.onpropchange = function() {
	this.rePosPoints();

	this.doWork2.pos.y = this.doWork1.pos.y;
	this.doWork2.pos.x++;
	this.doWork1.pos.x += POINT_OFF + 1;
	this.doWork1.pos.y -= 3;
	this.doWork3.pos.x += POINT_OFF + 1;
	this.doWork3.pos.y -= 11;
	this.onEvent.pos.x -= 3;

	var ind = 3 - this.props.Angle.value;
	var point = this.points[this.pIndex[ind]];
	var t = point.pos.x;
	point.pos.x = this.onEvent.pos.x;
	this.onEvent.pos.x = t;
	t = point.pos.y;
	point.pos.y = this.onEvent.pos.y;
	this.onEvent.pos.y = t;
};

HubEx.prototype.draw = function(ctx) {
	if(this.isSelect()) {
		ctx.strokeStyle = "#000";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
	}
	ctx.strokeStyle = "#00c";
	ctx.fillStyle = "#00c";
	ctx.beginPath();
	var p1 = this.doWork1;
	var p2 = this.doWork2;
	var p3 = this.doWork3;
	if(this.props.Angle.value === 0 || this.props.Angle.value === 2) {
		p2 = this.doWork3;
		p3 = this.doWork2;
	}
	else if(this.props.Angle.value === 1) {
		p1 = this.doWork3;
		p3 = this.doWork1;
	}
	ctx.moveTo(this.onEvent.pos.x, this.onEvent.pos.y);
	ctx.lineTo(p1.pos.x, p1.pos.y);
	ctx.lineTo(p2.pos.x, p2.pos.y);
	ctx.lineTo(this.onEvent.pos.x, this.onEvent.pos.y);
	ctx.stroke();
	ctx.fill();
	if(p3.point) {
		ctx.moveTo(this.onEvent.pos.x, this.onEvent.pos.y);
		ctx.lineTo(p3.pos.x, p3.pos.y);
		ctx.stroke();
	}
};

HubEx.prototype.calcSide = function(point) {
	var hs = {doWork1: 0, doWork2: 1, doWork3: 2, onEvent: 3};
	var i = hs[point.name];
	var vals = [[3, 2, 1, 0], [3, 2, 0, 1], [3, 0, 1, 2], [0, 2, 1, 3]];
	return vals[this.props.Angle.value][i];
};

function GetDataEx(id) {
	HubsEx.call(this, id);
	
	this.pIndex = ["Var1", "Var2", "Var3", "Data"];
}

GetDataEx.prototype = Object.create(HubsEx.prototype);

GetDataEx.prototype.onpropchange = function() {
	this.rePosPoints();
				
	this.Var2.pos.x = this.Var1.pos.x;
	this.Var2.pos.y--;
	this.Var1.pos.y -= POINT_OFF + 1;
	this.Var1.pos.x -= 3;
	this.Var3.pos.y -= POINT_OFF + 1;
	this.Var3.pos.x -= 11;
	this.Data.pos.y += 3;

	var ind = 3 - this.props.Angle.value;
	var point = this.points[this.pIndex[ind]];
	var t = point.pos.y;
	point.pos.y = this.Data.pos.y;
	this.Data.pos.y = t;
	t = point.pos.x;
	point.pos.x = this.Data.pos.x;
	this.Data.pos.x = t;
};

GetDataEx.prototype.draw = function(ctx) {
	if(this.isSelect()) {
		ctx.strokeStyle = "#000";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
	}
	ctx.strokeStyle = "#c00";
	ctx.fillStyle = "#c00";
	ctx.beginPath();
	var p1 = this.Var1;
	var p2 = this.Var2;
	var p3 = this.Var3;
	if(this.props.Angle.value === 0 || this.props.Angle.value === 2) {
		p2 = this.Var3;
		p3 = this.Var2;
	}
	else if(this.props.Angle.value === 1) {
		p1 = this.Var3;
		p3 = this.Var1;
	}
	ctx.moveTo(this.Data.pos.x, this.Data.pos.y);
	ctx.lineTo(p1.pos.x, p1.pos.y);
	ctx.lineTo(p2.pos.x, p2.pos.y);
	ctx.lineTo(this.Data.pos.x, this.Data.pos.y);
	ctx.stroke();
	ctx.fill();
	if(p3.point) {
		ctx.moveTo(this.Data.pos.x, this.Data.pos.y);
		ctx.lineTo(p3.pos.x, p3.pos.y);
		ctx.stroke();
	}
};

GetDataEx.prototype.calcSide = function(point) {
	var hs = {Var1: 0, Var2: 1, Var3: 2, Data: 3};
	var i = hs[point.name];
	var vals = [[2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [3, 1, 0, 2]];
	return vals[this.props.Angle.value][i];
};

//******************************************************************************
// SizeElement
//******************************************************************************

function SizeElement(id) {
	SdkElement.call(this, id);
}

SizeElement.prototype = Object.create(SdkElement.prototype);

SizeElement.prototype.getState = function(x, y) {
	var mouseState = 0;
	var sx = 0;
	var sy = 0;
	if(x - this.x <= 7) { // left
		sx = 1;
	}
	else if(this.w - (x - this.x) <= 7) { // right
		sx = 2;
	}
	if(this.h - (y - this.y) <= 7) { // bottom
		sy = 1;
	}
	else if(y - this.y <= 7) { // top
		sy = 2;
	}
	
	if(sx == 1 && sy == 1) {	// left bottom
		mouseState = 5;
	}
	else if(sx == 2 && sy == 1) {	// right bottom
		mouseState = 6;
	}
	else if(sx == 1) {
		mouseState = 1;
	}
	else if(sx == 2) {
		mouseState = 2;
	}
	else if(sy == 1) {
		mouseState = 3;
	}
	else if(sy == 2) {
		mouseState = 4;
	}
	return mouseState;
};
SizeElement.prototype.mouseDown = function(x, y, button) {
	var t = this.getState(x, y);
	if(t > 0 && t < 4 || t > 4) {
		this.mouseState = t;
		return true;
	}
	return false;
};
SizeElement.prototype.mouseMove = function(x, y, emouse) {
	var deltaX = window.toStep(emouse.startX - x);
	var deltaY = window.toStep(emouse.startY - y);
	if(deltaX || deltaY) {
		emouse.startX -= deltaX;
		emouse.startY -= deltaY;
		switch(this.mouseState) {
			case 1:
				this.w += deltaX;
				this.x -= deltaX;
				break;
			case 2:
				this.w -= deltaX;
				break;
			case 3:
				this.h -= deltaY;
				break;
			case 5:
				this.w += deltaX;
				this.x -= deltaX;
				this.h -= deltaY;
				break;
			case 6:
				this.w -= deltaX;
				this.h -= deltaY;
				break;
		}
		if(this.w < 1) {
			this.w = 1;
		}
		if(this.h < 1) {
			this.h = 1;
		}
		this.sys.Width.value = this.w;
		this.sys.Height.value = this.h;
		this.rePosPoints();
	}
};
SizeElement.prototype.mouseUp = function() { this.mouseState = 0; };
SizeElement.prototype.getCursor = function(x, y) {
	return ["default", "w-resize", "e-resize", "s-resize", "move", "sw-resize", "se-resize"][this.mouseState || this.getState(x, y)];
};

SizeElement.prototype.onpropchange = function(prop) {
	SdkElement.prototype.onpropchange.call(this, prop);
	
	if(prop === this.sys.Width) {
		this.w = prop.value;
	}
	else if(prop === this.sys.Height) {
		this.h = prop.value;
	}
};

//******************************************************************************
// ITElement
//******************************************************************************

function ITElement(id) {
	SizeElement.call(this, id);
	this.w *= 2;
}

ITElement.prototype = Object.create(SizeElement.prototype);

ITElement.prototype.draw = function(ctx) {
	ctx.save();
	if(!this.isSelect()) {
		ctx.setLineDash([3,3]);
	}
	ctx.rect(this.x-1, this.y-1, this.w+1, this.h+1);
	ctx.strokeStyle = this.isSelect() ? "#000" : this.sys.Color.value;
	ctx.strokeRect(this.x, this.y, this.w, this.h);
	ctx.clip();
	ctx.fillStyle = "#000";
	ctx.font = "14px Arial";
	var len = ctx.measureText(this.props.Info.value).width;
	var x = this.x;
	var y = this.y + 12;
	if(this.props.HAlign.value === 1) {
		x += (this.w - len)/2;
	}
	else if(this.props.HAlign.value === 2) {
		x += this.w - len;
	}
	if(this.props.VAlign.value === 1) {
		y += (this.h - 14)/2;
	}
	else if(this.props.VAlign.value === 2) {
		y += this.h - 14;
	}
	ctx.fillText(this.props.Info.value, x, y);
	ctx.restore();
};
ITElement.prototype.inPoint = function(x, y) {
	return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h &&
			(x - this.x <= 7 || y - this.y <= 7 || this.x+this.w - x <= 7 || this.y+this.h - y <= 7);
};

//******************************************************************************
// CapElement
//******************************************************************************

function CapElement(id) {
	SdkElement.call(this, id);

	this.h = this.minH = 16;
	this.w = this.minW = 16;
	this.prop = null;
}

CapElement.prototype = Object.create(SdkElement.prototype);

CapElement.prototype.loadFromTemplate = function() {
	SdkElement.prototype.loadFromTemplate.call(this);
	for(var p in this.props) {
		var prop = this.props[p];
		if(prop.isDefaultEdit()) {
			this.prop = prop;
			break;
		}
	}
};

CapElement.prototype.drawBody = function(ctx) {
	if(!this.ctx) {
		this.ctx = ctx;
		this.onpropchange(this.prop);
	}

	SdkElement.prototype.drawBody.call(this, ctx);
};

CapElement.prototype.drawIcon = function(ctx) {
	ctx.fillStyle = "#000";
	ctx.font = "12px Arial";
	ctx.fillText(this.prop.value, this.x + 8, this.y + 12);
};

CapElement.prototype.onpropchange = function(prop) {
	if(prop === this.prop && this.ctx) {
		this.ctx.font = "12px Arial";
		var len = this.ctx.measureText(this.prop.value).width;
		this.w = this.minW = len + 16;
		this.rePosPoints();
	}
};

//******************************************************************************
// DPElement
//******************************************************************************

function DPElement(id) {
	SdkElement.call(this, id);
}

DPElement.prototype = Object.create(SdkElement.prototype);

DPElement.prototype.setSDK = function(sdk, x, y) {
	SdkElement.prototype.setSDK.call(this, sdk, x, y);
	
	var template = sdk.pack.elements[this.name];
	var arr = template.sub.split(",");
	this.dyn = {};
	for(var i in arr) {
		if(arr[i]) {
			var kv = arr[i].split("|");
			this.dyn[kv[0]] = { index: parseInt(i), pname: kv[1] };
		}
	}
};

DPElement.prototype.onpropchange = function(prop) {
	var data = this.dyn[prop.name];
	if(data) {
		this._changePoints(prop, data);
		this.rePosPoints();
	}
};

DPElement.prototype.getPointInfo = function(point) {
	for(var d in this.dyn) {
		if(this.dyn[d] && this.dyn[d].index === point.type-1) {
			return this._getPointInfo(point, this.dyn[d]);
		}
	}
	
	return SdkElement.prototype.getPointInfo.call(this, point);
};

DPElement.prototype._changePoints = function(prop, data) {
	var eDelta = prop.value - this.psize[data.index];
	if(eDelta > 0) {
		for(var i = 0; i < eDelta; i++) {
			this.addPoint(data.pname + (this.psize[data.index] + 1), data.index + 1);
		}
	}
	else if(eDelta < 0) {
		for(var i = 0; i < -eDelta; i++) {
			var _name = data.pname + this.psize[data.index];
			if(this.points[_name].isFree()) {
				this.removePoint(_name);
			}
			else {
				prop.value += -eDelta - i;
				break;
			}
		}
	}
};

DPElement.prototype._getPointInfo = function(point, data) {
	return this.name + "." + data.pname;
};

//******************************************************************************
// DPLElement
//******************************************************************************

function DPLElement(id) {
	DPElement.call(this, id);
}

DPLElement.prototype = Object.create(DPElement.prototype);

DPLElement.prototype._changePoints = function(prop, data) {
	var lines = prop.value.split("\n");
	var hash = {};
	for(var line of lines) {
		if(line) {
			var arr = line.split("=");
			var newPoint = this.points[arr[0]] || this.addPoint(arr[0], parseInt(data.index) + 1);
			newPoint._dplInfo = arr[1] || "";
			hash[arr[0]] = true;
		}
	}
	for(var p in this.points) {
		var point = this.points[p];
		if(data.index == point.type-1 && hash[point.name] !== true) {
			this.removePoint(point.name);
		}
	}
};

DPLElement.prototype._getPointInfo = function(point, data) {
	return point._dplInfo;
};

//******************************************************************************
// Debug
//******************************************************************************

function Debug(id) {
	SdkElement.call(this, id);
	
	this.w = this.minW = 12;
	this.h = this.minH = 12;
}

Debug.prototype = Object.create(SdkElement.prototype);

Debug.prototype.loadFromTemplate = function() {
	SdkElement.prototype.loadFromTemplate.call(this);

	this.doEvent.onevent = function(data) {
		console.log(this.parent.props.WEName.value, data);
		this.parent.onEvent.call(data);
	};
	this.Var.onevent = function(data) {
		var m = this.parent.Data.point ? this.parent.Data.point.onevent(data) : "";
		console.log(this.parent.props.VDName.value, m);
		return m;
	};
};

Debug.prototype.draw = function(ctx) {
	ctx.fillStyle = this.isSelect() ? "#800" : "red";
	ctx.strokeStyle = "gray";
	var radius = this.w/2;
	ctx.beginPath();
	ctx.arc(this.x + radius, this.y + radius, radius, 0, 2*Math.PI);
	ctx.fill();
	ctx.stroke();
};

//******************************************************************************
// CableElement
//******************************************************************************

function CableElement(id) {
	DPLElement.call(this, id);
	
	this.w = this.minW = 13;
	this.minH = 13;
}

CableElement.prototype = Object.create(DPLElement.prototype);

CableElement.prototype.addPoint = function(name, type) {
	var point = DPLElement.prototype.addPoint.call(this, name, type);
	
	if(point.name === "doCable") {
		point.onevent = function(data) {
			if(data && data.c) {
				var cp = this.parent.points[data.c];
				if(cp) {
					cp.call(data.d);
				}
			}
		};
	}
	else if(point.type === pt_var && point.name === "Cable") {
		point.onevent = function(data) {
			if(data && data.c) {
				var cp = this.parent.points[data.c];
				if(cp && cp.point) {
					return cp.point.onevent(data.d);
				}
				return "";
			}
		};
	}
	else {
		if(point.type === pt_work) {
			point.onevent = function(data) {
				this.parent.onCable.call({d: data, c: this.name});
			};
		}
		else if(point.type === pt_var) {
			point.onevent = function(data) {
				if(this.parent.Cable.point) {
					return this.parent.Cable.point.onevent({d: data, c: this.name});
				}
				return "";
			};
		}
	}
	
	return point;
};

CableElement.prototype.isWE = function(){
	return this.points.doCable || this.points.onCable;
};

CableElement.prototype.drawPoints = function(ctx) {
	ctx.fillStyle = "#fff";
	ctx.strokeStyle = this.isWE() ? "navy" : "red";
	for (var j in this.points) {
		var p = this.points[j].pos;
		ctx.beginPath();
		if(this.points[j].selected) {
			ctx.fillStyle = "#0b0";
			ctx.strokeStyle = "rgb(150,150,150)";
			ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI, true);
		}
		else {
			ctx.rect(p.x - 1, p.y - 1, 2, 2);
		}
		ctx.fill();
		ctx.stroke();
		if(this.points[j].selected) {
			ctx.fillStyle = "#fff";
			ctx.strokeStyle = this.isWE() ? "navy" : "red";
		}
	}
};

CableElement.prototype.drawIcon = function(ctx) {
	if(this.isWE()) {
		ctx.strokeStyle = "navy";
		var c = this.x + this.w/2 + 0.5;
		ctx.drawLine(c, this.y + POINT_OFF + 3, c, this.y + this.h - POINT_OFF - 1);
		var workCount = this.psize[0];
		var eventCount = this.psize[1];
		for(var i = 0; i < Math.max(workCount, eventCount); i++) {
			var y = this.y + i*7 + POINT_OFF + 3;
			var x1 = i < workCount ? this.x : c;
			var x2 = i < eventCount ? this.x + this.w : c;
			ctx.drawLine(x1, y, x2, y);
		}
	}
	else {
		ctx.strokeStyle = "red";
		var c = this.y + this.h/2 + 0.5;
		ctx.drawLine(this.x + POINT_OFF + 3, c, this.x + this.w - POINT_OFF - 1, c);
		var varCount = this.psize[2];
		var dataCount = this.psize[3];
		for(var i = 0; i < Math.max(varCount, dataCount); i++) {
			var x = this.x + i*7 + POINT_OFF + 3;
			var y1 = i < dataCount ? this.y : c;
			var y2 = i < varCount ? this.y + this.h : c;
			ctx.drawLine(x, y1, x, y2);
		}
	}
};

CableElement.prototype.drawBody = function(ctx) {
	if(this.isSelect()) {
		ctx.save();
		ctx.setLineDash([3,3]);
		ctx.rect(this.x-1, this.y-1, this.w+1, this.h+1);
		ctx.strokeStyle = "#000";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		ctx.restore();
	}
};

//******************************************************************************
// LineBreak
//******************************************************************************

function LineBreak(id) {
	CapElement.call(this, id);
}

LineBreak.prototype = Object.create(CapElement.prototype);

LineBreak.prototype.loadFromTemplate = function() {
	CapElement.prototype.loadFromTemplate.call(this);
	this.onpropchange(this.props.Type);
};

LineBreak.prototype.onpropchange = function(prop) {
	CapElement.prototype.onpropchange.call(this, prop);
	
	if(prop === this.props.Type) {
		this.removePoints();
		if(prop.isDef()) {
			if(this.primary) {
				this.addPoint("Out", pt_event);
			}
			else {
				this.addPoint("In", pt_work).onevent = function(data) {
					if(this.parent.second) {
						this.parent.second.onEvent.call(data);
					}
				};
			}
		}
		else {
			if(this.primary) {
				this.addPoint("Data", pt_data);
			}
			else {
				this.addPoint("Var", pt_var).onevent = function(data) {
					if(this.parent.second) {
						return this.parent.second.Data.call(data);
					}
				};
			}
		}
		
		var se = this.second || this.primary;
		if(se && se.props.Type.value != prop.value) {
			se.props.Type.value = prop.value;
			se.onpropchange(se.props.Type);
		}
	}
	else if(prop.isDefaultEdit()) {
		var se = this.second || this.primary;
		if(se && se.props[prop.name].value != prop.value) {
			se.props[prop.name].value = prop.value;
			se.onpropchange(se.props[prop.name]);
		}
	}
};

LineBreak.prototype.setPrimary = function(element) {
	this.primary = element;
	this.onpropchange(this.props.Type);
};

LineBreak.prototype.place = function(x, y) {
	CapElement.prototype.place.call(this, x, y);
	
	this.second = this.parent.add(this.name, toStep(x + 7*5), toStep(y));
	this.second.setPrimary(this);
};

LineBreak.prototype.erase = function() {
	CapElement.prototype.erase.call(this);
	
	if(this.second && !this.second.isSelect()) {
		this.second.primary = null;
		this.parent.deleteElementById(this.second.eid);
	}
	else if(this.primary && !this.primary.isSelect()) {
		this.primary.second = null;
		this.parent.deleteElementById(this.primary.eid);
	}
};

LineBreak.prototype.saveToText = function() {
	var text = CapElement.prototype.saveToText.call(this);
	if(this.primary) {
		text += "  Primary=[" + this.primary.eid + "," + (this.x - this.primary.x) + "," + (this.y - this.primary.y) + "]\n";
	}
	return text;
};

LineBreak.prototype.loadFromText = function(line) {
	if(line.substr(0, 7) == "Primary") {
		var data = line.substr(9, line.length - 10);
		var arr = data.split(",");
		var e = this.parent.getElementByEId(parseInt(arr[0]));
		e.second = this;
		this.setPrimary(e);
		return true;
	}
	return CapElement.prototype.loadFromText.call(this, line);
};

//******************************************************************************
// LineBreakEx
//******************************************************************************

function LineBreakEx(id) {
	CapElement.call(this, id);
}

LineBreakEx.prototype = Object.create(CapElement.prototype);

LineBreakEx.prototype.onpropchange = function(prop) {
	CapElement.prototype.onpropchange.call(this, prop);
	
	if(prop === this.props.Type) {
		this.removePoints();
		switch(prop.value) {
			case 0:
				this.addPoint("doWork", pt_work).onevent = function(data) {
					if(this.parent.pair) {
						this.parent.pair.onEvent.call(data);
					}
				};
				break;
			case 1:
				this.addPoint("onEvent", pt_event);
				break;
			case 2:
				this.addPoint("getVar", pt_var).onevent = function(data) {
					if(this.parent.pair) {
						return this.parent.pair._Data.call(data);
					}
				};
				break;
			case 3:
				this.addPoint("_Data", pt_data);
		}
	}
};

LineBreakEx.prototype.loadFromTemplate = function() {
	CapElement.prototype.loadFromTemplate.call(this);
	this.onpropchange(this.props.Type);
};

LineBreakEx.prototype.oninit = function() {
	if(this.props.Type.value % 2 == 0) {
		var prop = this.props.Type.value == 0 ? 1 : 3;
		for(var e of this.parent.imgs) {
			if(e.name == this.name && e.props.Type.value == prop) {
				this.pair = e;
				break;
			}
		}
	}
};

//******************************************************************************
// WinElement
//******************************************************************************

function WinElement(id) {
	SdkElement.call(this, id);
}

WinElement.prototype = Object.create(SdkElement.prototype);

WinElement.prototype.place = function(x, y) {
	SdkElement.prototype.place.call(this, x, y);
	
	this.props.Left.value = this.x;
	this.props.Top.value = this.y;
};

var _winelement_dmap = {
	doLeft: function(data) {
		this.parent.ctl.left = data;
	},
	doTop: function(data) {
		this.parent.ctl.top = data;
	},
	doWidth: function(data) {
		this.parent.ctl.width = data;
	},
	doHeight: function(data) {
		this.parent.ctl.height = data;
	}
};

WinElement.prototype.addPoint = function(name, type) {
	var point = SdkElement.prototype.addPoint.call(this, name, type);
	
	point.onevent = _winelement_dmap[name];
	
	return point;
};

WinElement.prototype.run = function(flags) {
	var ctl = this.ctl.getControl();

	// properties
	if(!this.props.Theme.isDef()) {
		this.ctl.setOptions({theme: this.props.Theme.value});
	}
	
	this.ctl.place(this.props.Left.value, this.props.Top.value, this.props.Width.value, this.props.Height.value);
	
	if(this.props.Hint.value) {
		ctl.title = this.props.Hint.getTranslateValue();
	}
	if(!this.props.TabIndex.isDef()) {
		ctl.tabIndex = this.props.TabIndex.value;
	}
	if(this.props.Enabled.value === 0) {
		this.ctl.setDisabled(true);
	}
	if(this.props.Visible.value === 0 && (flags & window.FLAG_USE_EDIT) === 0) {
		ctl.hide();
	}
	
	// layer
	var layoutOpt = {};
	if(!this.props.Grow.isDef()) {
		layoutOpt.grow = this.props.Grow.value;
	}
	if(!this.props.Shrink.isDef()) {
		layoutOpt.shrink = this.props.Shrink.value;
	}
	if(!this.props.AlignSelf.isDef()) {
		layoutOpt.alignSelf = this.props.AlignSelf.value;
	}
	if(!this.props.Margin.isDef()) {
		layoutOpt.margin = this.props.Margin.value;
	}
	this.ctl.setLayoutOptions(layoutOpt);
	
	//set props
	if(this['doVisible']) {
		this.doVisible.onevent = function(data) {
			this.parent.ctl.setVisible(data);
		};
	}
	if(this['doEnabled']) {
		this.doEnabled.onevent = function(data) {
			this.parent.ctl.setDisabled(!data);
		};
	}
	
	// points
	var _ctl_ = this;
	// if(this['onClick']) {
	// 	this.ctl.addListener("click", function(){
	// 		_ctl_.onClick.call();
	// 	});
	// }
	if(this['onDblClick']) {
		this.ctl.addListener("dblclick", function(){
			_ctl_.onDblClick.call();
		});
	}
	if(this['onFocus']) {
		this.ctl.addListener("focus", function(){
			_ctl_.onFocus.call();
		});
	}
	if(this['onBlur']) {
		this.ctl.addListener("blur", function(){
			_ctl_.onBlur.call();
		});
	}
	function makeFlag(event) {
		return (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0);
	}
	if(this['onKeyDown']) {
		this.ctl.addListener("keydown", function(event){
			_ctl_.onKeyDown.call([event.keyCode, makeFlag(event)]);
		});
	}
	if(this['onKeyPress']) {
		this.ctl.addListener("keypress", function(event){
			_ctl_.onKeyPress.call([event.keyCode, makeFlag(event)]);
		});
	}
	if(this['onKeyUp']) {
		this.ctl.addListener("keyup", function(event){
			_ctl_.onKeyUp.call([event.keyCode, makeFlag(event)]);
		});
	}
	if(this['onMouseDown']) {
		this.ctl.addListener("mousedown", function(event){
			_ctl_.onMouseDown.call([event.layerX, event.layerY, event.button, makeFlag(event)]);
		});
	}
	if(this['onMouseUp']) {
		this.ctl.addListener("mouseup", function(event){
			_ctl_.onMouseUp.call([event.layerX, event.layerY, event.button, makeFlag(event)]);
		});
	}
	if(this['onMouseMove']) {
		this.ctl.addListener("mousemove", function(event){
			_ctl_.onMouseMove.call([event.layerX, event.layerY, makeFlag(event)]);
		});
	}
	if(this['onMouseOut']) {
		this.ctl.addListener("mouseout", function(){
			_ctl_.onMouseOut.call();
		});
	}
	if(this['onMouseOver']) {
		this.ctl.addListener("mouseover", function(){
			_ctl_.onMouseOver.call();
		});
	}
	if(this['onMouseWheel']) {
		this.ctl.addListener("wheel", function(event){
			_ctl_.onMouseWheel.call([event.layerX, event.layerY, event.wheelDelta, makeFlag(event)]);
		});
	}
	if(this['onContextMenu']) {
		this.ctl.addListener("contextmenu", function(event){
			_ctl_.onContextMenu.call([event.layerX, event.layerY, makeFlag(event)]);
			event.preventDefault();
			return false;
		});
	}
	
	return this.ctl;
};

WinElement.prototype.oninit = function() {
	if(!this.props.Edge.isDef()) {
		new Splitter({manage: this.ctl, edge: this.props.Edge.value, size: this.props.SplitterSize.value});
	}
};

function WinContainer(id) {
	WinElement.call(this, id);
}

WinContainer.prototype = Object.create(WinElement.prototype);

WinContainer.prototype.getLayoutOptions = function() {
	var options = {};
	if(!this.props.Wrap.isDef()) {
		options.wrap = this.props.Wrap.value;
	}
	if(!this.props.JustifyContent.isDef()) {
		options.justifyContent = this.props.JustifyContent.value;
	}
	if(!this.props.AlignItems.isDef()) {
		options.alignItems = this.props.AlignItems.value;
	}
	if(!this.props.AlignContent.isDef()) {
		options.alignContent = this.props.AlignContent.value;
	}
	if(!this.props.Padding.isDef()) {
		options.padding = this.props.Padding.value;
	}
	return options;
};

WinContainer.prototype.getLayout = function(parent) {
	switch(this.props.Layout.value) {
		case 0: return new FixLayout(parent);
		case 1: return new HLayout(parent, this.getLayoutOptions());
		case 2: return new VLayout(parent, this.getLayoutOptions());
	}
};