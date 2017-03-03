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
var ELEMENT_BORDER_COLOR = "rgb(150,150,150)";
var ELEMENT_SELECT_COLOR = "rgb(100,100,100)";

//const
var DATA_NONE     = 0;
var DATA_INT      = 1;
var DATA_STR      = 2;
var DATA_DATA     = 3;
var DATA_ENUM     = 4;
var DATA_LIST     = 5;
var DATA_ICON     = 6; // save as binary data
var DATA_REAL     = 7;
var DATA_COLOR    = 8;
var DATA_STREAM   = 10; // save as binary data
var DATA_BITMAP   = 11; // save as binary data
var DATA_ARRAY    = 13;
var DATA_ENUMEX   = 14;
var DATA_FONT     = 15;
var DATA_JPEG     = 17; // save as binary data
var DATA_MANAGER  = 20;
var DATA_FLAGS    = 21;  // no support

function Font(name, size, flags, color, charset) {
	this.name = name || "Courier New";
	this.size = size || 8;
	this.flags = flags || 0;
	this.color = color || 0;
	this.charset = charset || 0;
	this.updateFont();
}

Font.prototype.updateFont = function() {
	this.fontText = (this.isItalic() ? "italic " : "") + (this.isBold() ? "bold " : "") + this.size + "px " + this.name;
	if(typeof this.color === "number")
		this.fontColor = '#' + hex(this.color & 0xff) + hex((this.color >> 8) & 0xff) + hex(this.color >> 16);
	else
		this.fontColor = this.color;
};

Font.prototype.apply = function(ctx) {
	ctx.fillStyle = this.fontColor;
	ctx.font = this.fontText;
//	ctx.textBaseline = "top";
};

Font.prototype.valueOf = function() {
	return this.name + "," + this.size + "," + this.flags + "," + this.color + "," + this.charset;
};
Font.prototype.isBold = function() { return this.flags & 0x1; };
Font.prototype.isItalic = function() { return this.flags & 0x2; };
Font.prototype.isUnderline = function() { return false; };

function ElementProperty(parent, inherit, template) {
	this.type = template.type;
	this.name = template.name;
	this.parse(template.def);
	this.def = this.value;
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
	this.parent = parent;
}

ElementProperty.prototype.isDef = function() {
	switch(this.type) {
		case DATA_FONT:
			return this.value.valueOf() === this.def.valueOf();
	}
	return this.value === this.def;
};
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
		case DATA_MANAGER:
			return '"' + this.value + '"';
		case DATA_FONT:
			return '[' + this.value.valueOf() + ']';
		case DATA_ICON:
		case DATA_BITMAP:
		case DATA_JPEG:
		case DATA_STREAM:
			return '[ZIP' + this.value + ']';
		case DATA_ARRAY:
			return "";
	}
	
	return this.value.toString();
};
function parseStringValue(value) {
	var fIndex = 1;
	var p1 = 0;
	var lines = [];
	var counter = 0;
	while( (p1 = value.indexOf(":", fIndex)) > 0 && counter < 2000) {
		var len = parseInt(value.substr(fIndex, p1-fIndex));
		lines.push(len ? value.substr(p1+1, len) : "");
		fIndex = p1 + len + 2;
		counter++;
	}
	if(counter == 2000) {
		console.error("To many lines in project!");
	}
	return lines.join("\n").replace(/\\r/g, "\r");
}
function hex(v) {
	var r = v.toString(16);
	return r.length == 1 ? "0" + r : r;
}
ElementProperty.prototype.parse = function(value) {
	switch(this.type) {
		case DATA_LIST:
		case DATA_STR:
			if(value) {
				var c = value.charAt(0);
				if(c === "#" && value.charAt(1) !== "#") {
					this.value = parseStringValue(value);
				}
				else if(c === "\"") {
					this.value = value.substr(1, value.length-2);
				}
				else {
					this.value = value;
				}
			}
			else {
				this.value = "";
			}
			break;
		case DATA_DATA:
			if(typeof value === "string" && (value.startsWith("Integer(") || value.startsWith("String(") || value.startsWith("Real("))) {
				var i = value.indexOf("(");
				var type = value.substr(0, i);
				var v = value.substr(i + 1, value.length - i - 2);
				if(type === "String") {
					this.value = v.substr(0, 1) == "#" ? parseStringValue(v) : v;
				}
				else if(type === "Integer") {
					this.value = parseInt(v);
				}
				else if(type === "Real") {
					this.value = parseFloat(v);
				}
			}
			else if(typeof value === "string" && value.startsWith("#")) {
				this.value = parseStringValue(value);
			}
			else {
				var pvalue = parseFloat(value);
				if(!isNaN(pvalue) && value == pvalue) {
					this.value = pvalue;
				}
				else {
					this.value = value;
				}
			}
			break;
		case DATA_REAL:
			this.value = value ? parseFloat(value) : 0.0;
			break;
		case DATA_INT:
		case DATA_ENUM:
		case DATA_ENUMEX:
			this.value = value ? parseInt(value) : 0;
			break;
		case DATA_MANAGER:
			this.value = value.indexOf('"') == 0 ? value.substr(1, value.length - 2) : value;
			break;
		case DATA_COLOR:
			if(typeof value === "number" || value.charAt(0) >= '0' && value.charAt(0) <= '9') {
				var v = parseInt(value);
				this.value = '#' + hex(v & 0xff) + hex((v >> 8) & 0xff) + hex(v >> 16);
			}
			else {
				this.value = value;
			}
			break;
		case DATA_FONT:
			if(value) {
				var args = value.substr(1, value.length - 2).split(",");
				this.value = new Font(args[0], parseInt(args[1]) || args[1], parseInt(args[2]), parseInt(args[3]), parseInt(args[4]));
			}
			else {
				this.value = new Font();
			}
			break;
		case DATA_ICON:
		case DATA_BITMAP:
		case DATA_JPEG:
		case DATA_STREAM:
			var icon = value.substr(1, value.length - 2);
			if(icon.startsWith("ZIP")) {
				// convert from ZIP
				this.value = icon.substr(3);
			}
			else {
				this.value = icon;
			}
			break;
		case DATA_ARRAY:
			this.value = [];
			this.value.type = parseInt(value);
			break;
		default:
			console.error("Property[", this.name, "] with type", this.type, "not support.")
			this.value = value;
	}
	
	if(this.parent)
		this.parent.onpropchange(this);
};

ElementProperty.prototype.getText = function() {
	switch(this.type) {
		case DATA_ENUM:
		case DATA_ENUMEX:
			return this.list[this.value];
		case DATA_FONT:
			return this.value.name + "," + this.value.size;
	}
	
	return this.value.toString().replace(/</g, "&lt;");
};
ElementProperty.prototype.getList = function() {
	switch(this.type) {
		case DATA_MANAGER:
			var list = [];
			for(var e of this.parent.parent.imgs) {
				if(e.props.Name && e.props.Name.value) {
					for(var i of e.interfaces) {
						for(var ie of this.list) {
							if(i == ie) {
								list.push(e.props.Name.value);
							}
						}
					}
				}
			}
			list.push(this.def);
			return list;
	}
	return this.list;
};
ElementProperty.prototype.getElement = function() {
	var sdk = this.parent.parent;
	for(var item of this.list) {
		for(var e of sdk.imgs) {
			if(e.name === item && e.props.Name.value === this.value) {
				return e;
			}
		}
	}
	return null;
};
ElementProperty.prototype.getInfo = function() {
	return this.inherit + "." + this.name;
};
ElementProperty.prototype.setValue = function(value) {
	this.value = value;
	this.parent.onpropchange(this);
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
	
	this.pointsEx = {};
	this.interfaces = [];

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
			var arr = template.inherit.split(",");
			for(var c of arr)
				loadTemplate(element, c);
		}
		if(template.interfaces) {
			var arr = template.interfaces.split(",");
			element.interfaces = element.interfaces.concat(arr);
		}
		
		// create points
		for(var index in template.points) {
			var point = template.points[index];
			if(point.flags & 0x01) {
				element.pointsEx[point.name] = point;
			}
			else {
				if(element.pointsEx[point.name]) {
					delete element.pointsEx[point.name];
				}
				element.addPointFromTemplate(point);
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
SdkElement.prototype.addPointFromTemplate = function(template) {
	var point = this.addPoint(template.name, template.type);
	point.args = template.args;
	point.inherit = template.inherit;
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
	return point.inherit + "." + point.name;	
};
SdkElement.prototype.showDefaultPoint = function(name) {
	if(this.pointsEx[name]) {
		return this.addPointFromTemplate(this.pointsEx[name]);
	}
	
	return null;
};
SdkElement.prototype.getLinkedPoint = function(point) {
	return point;
};
/**
 * Get a point for the new connection in the editor after dropping
 */
SdkElement.prototype.getPointToLink = function(type) {
	return this.getFirstFreePoint(type);
};
/**
 * Removing the connection between points in the editor
 */
SdkElement.prototype.clearPoint = function(point) {
	point.clear();
};

// draw
SdkElement.prototype.draw = function(ctx) {
	this.drawHints(ctx);
	this.drawBody(ctx);
	this.drawIcon(ctx);
	this.drawPoints(ctx);
};
SdkElement.prototype.drawBody = function(ctx) {
	ctx.strokeStyle = ELEMENT_BORDER_COLOR;
	ctx.fillStyle = this.isSelect() ? ELEMENT_SELECT_COLOR : this.sys.Color.value;
	ctx.fillRect(this.x, this.y, this.w, this.h);
	ctx.strokeRect(this.x, this.y, this.w, this.h);
	
	if(this.link) {
		ctx.fillStyle = "white";
		var size = 4;
		ctx.fillRect(this.x + this.w - size, this.y + this.h - size, size + 1, size + 1);
		ctx.strokeRect(this.x + this.w - size, this.y + this.h - size, size + 1, size + 1);
	}
};
SdkElement.prototype.drawIcon = function(ctx) {
	// firefox fix: +0.5
	ctx.drawImage(this.img, this.x + (this.w - 24)/2 + 0.5, this.y + (this.h - 24)/2 + 0.5);
};
SdkElement.prototype.drawHints = function(ctx) {
	ctx.font = "12px Arial";
	for(var h of this.hints) {
		var x = this.x + h.x;
		var y = this.y + h.y;
		
		var text = h.prop ? h.prop.getText() : "(empty)";
		var m = ctx.measureText(text);
		var textOffset = h.prop && h.prop.type == DATA_COLOR ? 18 : 0;
		h.width = m.width + 8 + textOffset;
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
		var radius = 5;
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + h.width - radius, y);
		ctx.quadraticCurveTo(x + h.width, y, x + h.width, y + radius);
		ctx.lineTo(x + h.width, y + h.height - radius);
		ctx.quadraticCurveTo(x + h.width, y + h.height, x + h.width - radius, y + h.height);
		ctx.lineTo(x + radius, y + h.height);
		ctx.quadraticCurveTo(x, y + h.height, x, y + h.height - radius);
		ctx.lineTo(x, y + radius);
		ctx.quadraticCurveTo(x, y, x + radius, y);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		//ctx.fillRect(x, y, h.width, h.height);
		//ctx.strokeRect(x, y, h.width, h.height);

		// text
		ctx.fillStyle = "black";
		ctx.fillText(text, x + 2 + textOffset, y + 12 + 1);
		
		if(h.prop && h.prop.type == DATA_COLOR) {
			ctx.strokeStyle = "#808080";
			ctx.fillStyle = h.prop.value;
			ctx.beginPath();
			ctx.rect(x + 6, y + 4, 10, 10);
			ctx.closePath();
			ctx.fill();
			ctx.stroke();
		}
	}
};
SdkElement.prototype.drawPoints = function(ctx) {
	if(!this.hidePoints) {
		ctx.fillStyle = "#0f0";
		ctx.strokeStyle = "rgb(150,150,150)";
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

SdkElement.prototype.setProperty = function(name, value) {
	var prop = this.props[name] || this.sys[name];
	if(!prop)
		console.error("Property", name, "not found.")
	prop.parse(value);
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
SdkElement.prototype.canDelete = function() {
	return (this.flags & IS_PARENT) === 0 && (this.flags & IS_NODELETE) === 0;
};
	
SdkElement.prototype.onpropchange = function(prop) {};
SdkElement.prototype.oninit = function() {};
SdkElement.prototype.onfree = function() {};

SdkElement.prototype.loadFromText = function(line) { return false; };
SdkElement.prototype.save = function(selection, tab) {
	var text = "Add(" + this.name + "," + this.eid + "," + this.x + "," + this.y + ")\n";
	text += "{\n";
	var propPoints = "";
	var pointColors = "";
	var pointInfo = "";
	for (var p in this.props) {
		var prop = this.props[p];
		if(!prop.isDef()) {
			text += "  " + p + "=" + prop.serialize() + "\n";
		}
		if(prop.isPoint() && this.findPointByName("do" + prop.name)) {
			propPoints += "  Point(do" + prop.name + ")\n";
		}
	}
	for (var p in this.sys) {
		var prop = this.sys[p];
		if(!prop.isDef()) {
			text += "  @" + p + "=" + prop.serialize() + "\n";
		}
	}
	for (var j in this.points) {
		var p = this.points[j];
		if(this.pointsEx[p.name]) {
			propPoints += "  Point(" + p.name + ")\n";
		}
		if(p.color) {
			pointColors += "  PColor(" + p.name + "," + p.color + ")\n";
		}
		if(p.info) {
			pointInfo += "  PInfo(" + p.name + "," + p.info.direction + "," + p.info.text.replace("\n", "\\n") + ")\n";
		}
	}
	text += propPoints;
	text += pointColors;
	text += pointInfo;
	for(var h of this.hints) {
		if(h.prop) {
			text += "  AddHint(" + h.x + "," + h.y + ",0,0," + (this.sys[h.prop.name] ? "@" : "") + h.prop.name + ")\n";
		}
	}
	for (var j in this.points) {
		var p = this.points[j];
		if (p.type % 2 === 0 && p.point && (!selection || p.point.parent.isSelect())) {
			text += "  link(" + p.name + "," + p.point.parent.eid + ":" + p.point.name + ",[";
			var n = p.pos.next;
			while (n.next) {
				text += "(" + n.x + "," + n.y + ")";
				n = n.next;
			}
			text += "])\n";
		}
	}
	text += this.saveToText();
	text += "}\n";
	if(this.sdk) {
		text += "BEGIN_SDK\n";
		text += this.sdk.save();
		text += "END_SDK\n";
	}

	return text;
};
SdkElement.prototype.saveToText = function() { return ""; };

SdkElement.prototype.initPointHandler = function(name, handler) {
	if(this.points[name]) {
		this.points[name].onevent = handler;
	}
};

SdkElement.prototype.makeLink = function(element) { this.link = element; };

function getClass(pack, id) {
	var template = pack.elements[id];
	if(!template) {
		console.error("Element config not found: ", id);
		return null;
	}
	if(template.class) {
		if(!window[template.class])
			console.error("Element class not found: ", template.class);
		return template.class;
	}
	if(template.inherit) {
		return getClass(pack, template.inherit.split(",")[0]);
	}
	return null;
}

/* global Button,CheckBox,RadioButton,Edit,Memo,Label,ProgressBar,UIImage,Youtube */

function createElement(sdk, id, x, y) {
	var i = new window[getClass(sdk.pack, id) || "SdkElement"](id);
	i.setSDK(sdk, x, y);
	i.loadFromTemplate();

	i.run = function() { return null; };
	sdk.pack.initElement(i);

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

HubsEx.prototype.loadFromTemplate = function() {
	SdkElement.prototype.loadFromTemplate.call(this);
	
	this.onpropchange(this.props.Angle);
};

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

HubsEx.prototype.getLinkedPoint = function(point) {
	var pointOne = this.points[this.pIndex[3]];
	if(point !== pointOne) {
		return pointOne;
	}
	return SdkElement.prototype.getLinkedPoint.call(this, point);
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

function wrapText(context, text, maxWidth) {
	var cars = text.split("\n");
	var lines = [];

	for (var ii = 0; ii < cars.length; ii++) {
		var line = "";
		var words = cars[ii].split(" ");

		for (var n = 0; n < words.length; n++) {
			var testLine = line + words[n] + " ";
			var metrics = context.measureText(testLine);
			var testWidth = metrics.width;

			if (testWidth > maxWidth) {
				lines.push(line);
				line = words[n] + " ";
			}
			else {
				line = testLine;
			}
		}

		lines.push(line);
	}
	
	return lines;
}

ITElement.prototype.draw = function(ctx) {
	ctx.save();
	if(!this.isSelect() && this.props.Frame.value === 0) {
		ctx.setLineDash([3,3]);
	}
	var offset = this.props.Margin.value;
	ctx.strokeStyle = this.isSelect() ? "#000" : this.sys.Color.value;
	if(this.isSelect() || this.props.Frame.value != 1)
		ctx.strokeRect(this.x, this.y, this.w, this.h);
	ctx.rect(this.x + offset, this.y + offset, this.w - 2*offset, this.h - 2*offset);
	ctx.clip();
	this.props.Font.value.apply(ctx);
	
	var lines = wrapText(ctx, this.props.Info.value, this.w - 2*offset);
	var y = this.y + this.props.Font.value.size;
	var lineHeight = this.props.Font.value.size + 2;
	if(this.props.VAlign.value === 1) {
		y += (this.h - lineHeight*lines.length)/2 - 2;
	}
	else if(this.props.VAlign.value === 2) {
		y += this.h - lineHeight*lines.length - offset - 2;
	}
	else {
		y += offset;
	}
	
	for(var line of lines) {
		var len = ctx.measureText(line).width;
		var x = this.x;
		if(this.props.HAlign.value === 1) {
			x += (this.w - len)/2;
		}
		else if(this.props.HAlign.value === 2) {
			x += this.w - len - offset;
		}
		else {
			x += offset;
		}
		ctx.fillText(line, x, y);
		y += lineHeight;
	}
	ctx.restore();
};
ITElement.prototype.inPoint = function(x, y) {
	return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h &&
			(x - this.x <= 7 || y - this.y <= 7 || this.x+this.w - x <= 7 || this.y+this.h - y <= 7);
};

//******************************************************************************
// PointHint
//******************************************************************************

function PointHint(id) {
	ITElement.call(this, id);
}

PointHint.prototype = Object.create(ITElement.prototype);

PointHint.prototype.rePosPoints = function() {
	ITElement.prototype.rePosPoints.call(this);
	
	if(this.Data) {
		this.Event.pos.y = this.Method.pos.y = this.y + Math.round(this.h/2);
		this.Var.pos.x = this.Data.pos.x = this.x + Math.round(this.w/2);
	}
};

PointHint.prototype.draw = function(ctx) {
	ITElement.prototype.draw.call(this, ctx);
	if(this.isSelect())
		SdkElement.prototype.drawPoints.call(this, ctx);
};

//******************************************************************************
// VTElement
//******************************************************************************

function VTElement(id) {
	SizeElement.call(this, id);
	
	this.minW = 32;
	this.minH = 18;
}

VTElement.prototype = Object.create(SizeElement.prototype);

VTElement.prototype.onpropchange = function(prop) {
	SizeElement.prototype.onpropchange.call(this, prop);
	
	if(prop === this.sys.Width || prop === this.sys.Height)
		this.rePosPoints();
};

VTElement.prototype.draw = function(ctx) {
	var offset = 2;
	ctx.fillStyle = "white";
	ctx.fillRect(this.x, this.y, this.w, this.h);
	ctx.strokeStyle = this.isSelect() ? "#000" : this.sys.Color.value;
	ctx.strokeRect(this.x, this.y, this.w, this.h);
	ctx.rect(this.x + offset, this.y + offset, this.w - 2*offset, this.h - 2*offset);
	
	ctx.fillStyle = "#000";
	ctx.font = "12px Arial";
	var x = this.x;
	var y = this.y + 12;
	ctx.fillText(this.props.Lines.value, x, y);
	
	this.drawPoints(ctx);
};

//******************************************************************************
// LTElement
//******************************************************************************

function LTElement(id) {
	SdkElement.call(this, id);
	
	this.h = 18;
	this.needCalcSize = true;
	this.text = "";
	this.link = "";
}

LTElement.prototype = Object.create(SdkElement.prototype);

LTElement.prototype.loadFromTemplate = function() {
	SdkElement.prototype.loadFromTemplate.call(this);
	this.onpropchange(this.props.Link);
};

LTElement.prototype.onpropchange = function(prop) {
	if(prop === this.props.Link) {
		this.needCalcSize = true;
		var args = prop.value.split("=");
		this.text = args[0];
		this.link = args.length == 2 ? args[1] : args[0];
	}
};

LTElement.prototype.draw = function(ctx) {
	ctx.font = "12px Arial";

	if(this.needCalcSize) {
		var metrics = ctx.measureText(this.text);
		this.w = metrics.width + 4;
		this.needCalcSize = false;
	}

	if(this.isSelect()) {
		ctx.setLineDash([3,3]);
		ctx.strokeStyle = "#000";
		ctx.strokeRect(this.x, this.y, this.w, this.h);
		ctx.setLineDash([]);
	}
	
	ctx.fillStyle = this.sys.Color.value;
	ctx.fillText(this.text, this.x + 2, this.y + 1 + 12);
	ctx.strokeStyle = this.sys.Color.value;
	ctx.drawLine(this.x + 2, this.y + this.h - 2, this.x + this.w - 2, this.y + this.h - 2);
};

LTElement.prototype.mouseDown = function(x, y, button, flags) {
	if(flags & 0x2) {
		if(this.link.startsWith("multi")) {
			var eid = parseInt(this.link.substr(8));
			var e = this.parent.getElementByEId(eid);
			if(e) {
				this.parent.selMan.select(e);
				if(e.sdk) {
					commander.execCommand("forward");
				}
			}
		}
		else {
			window.open(this.link);
		}
		return true;
	}
	return false;
};

//******************************************************************************
// PTElement
//******************************************************************************

function PTElement(id) {
	SdkElement.call(this, id);
	this.image = null;
}

PTElement.prototype = Object.create(SdkElement.prototype);

PTElement.prototype.onpropchange = function(prop) {
	if(prop === this.props.Link) {
		//this.needCalcSize = true;
	}
	else if(prop === this.props.PictureURL) {
		this.loaded = false;
		this.image = new Image()
		var img = this;
		this.image.onload = function(){
			img.loaded = true;
			img.w = this.width;
			img.h = this.height;
			img.parent.ondraw();
		};
		this.image.src = prop.value;
	}
};

PTElement.prototype.draw = function(ctx) {
	if(this.loaded) {
		ctx.drawImage(this.image, this.x, this.y);
	}
	
	if(!this.isSelect() && this.props.Frame.value === 0) {
		ctx.setLineDash([3,3]);
	}
	ctx.strokeStyle = this.isSelect() ? "#000" : this.sys.Color.value;
	if(this.isSelect() || this.props.Frame.value != 1)
		ctx.strokeRect(this.x, this.y, this.w, this.h);
	
	ctx.setLineDash([]);
};

PTElement.prototype.mouseDown = function(x, y, button, flags) {
	if(flags & 0x2 && this.props.Link.value) {
		window.open(this.props.Link.value);
		return true;
	}
	return false;
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

DPElement.prototype.loadFromTemplate = function() {
	SdkElement.prototype.loadFromTemplate.call(this);
	
	var template = this.parent.pack.elements[this.name];
	while(!template.sub && template.inherit)
		template = this.parent.pack.elements[template.inherit.split(",")[0]];
	var arr = template.sub.split(",");
	this.dyn = {};
	for(var i in arr) {
		if(arr[i]) {
			var kv = arr[i].split("|");
			this.dyn[kv[0]] = { index: parseInt(i), pname: kv[1] };
			this.onpropchange(this.props[kv[0]]);
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

DPElement.prototype.clearPoint = function(point) {
	SdkElement.prototype.clearPoint.call(this, point);
	
	var last = null;
	for(var p in this.points) {
		var pt = this.points[p];
		if(pt.type === point.type) {
			last = pt;
		}
	}
	
	if(last == point) {
		var prop = null;
		for(var d in this.dyn) {
			if(this.dyn[d] && this.dyn[d].index === point.type-1) {
				this.props[d].value--;
				this.onpropchange(this.props[d]);
			}
		}
	}
};

DPElement.prototype.getPointToLink = function(type) {
	var point = this.getFirstFreePoint(type);
	if(point)
		return point;
	
	for(var d in this.dyn) {
		if(this.dyn[d] && this.dyn[d].index === type-1) {
			this.props[d].value++;
			this.onpropchange(this.props[d]);
			return this.getFirstFreePoint(type);
		}
	}
	return null;
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

DPLElement.prototype.clearPoint = function(point) {
	SdkElement.prototype.clearPoint.call(this, point);
};

DPLElement.prototype.getPointToLink = function(type) {
	return SdkElement.prototype.getPointToLink.call(this, type);
};

//******************************************************************************
// Hub
//******************************************************************************

function Hub(id) {
	DPElement.call(this, id);
	
	this.w = this.minW = 13;
	this.h = this.minH = 13;
}

Hub.prototype = Object.create(DPElement.prototype);

Hub.prototype.drawIcon = function(ctx) {
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

//******************************************************************************
// MultiElementEditor
//******************************************************************************

function MultiElementEditor(id) {
	SizeElement.call(this, id);
	
	this.flags |= IS_NODELETE;
}

MultiElementEditor.prototype = Object.create(SizeElement.prototype);

MultiElementEditor.prototype.inRect = function() { return false; };

MultiElementEditor.prototype.loadFromTemplate = function() {
	SizeElement.prototype.loadFromTemplate.call(this);
	this.w = this.sys.Width.value;
	this.h = this.sys.Height.value;
};

MultiElementEditor.prototype.rePosPoints = function() {
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

MultiElementEditor.prototype.draw = function(ctx) {
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

MultiElementEditor.prototype.inPoint = function(x, y) {
	return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h &&
			(x - this.x <= 5 || y - this.y <= 5 || this.x+this.w - x <= 5 || this.y+this.h - y <= 5 || this.getState(x, y));
};

MultiElementEditor.prototype.getState = function(x, y) {
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

MultiElementEditor.prototype.getCursor = function(x, y) {
	var index = this.mouseState || this.getState(x, y);
	if(index == 10) {
		return "row-resize";
	}
	if(index == 11) {
		return "col-resize";
	}

	return SizeElement.prototype.getCursor.call(this, x, y);
};

MultiElementEditor.prototype.mouseMove = function(x, y, emouse) {
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

MultiElementEditor.prototype.addEvent = function(point, pointParent) {
	if(pointParent.type === 1) {
		pointParent.onevent = function(data) {
			var e = this.parent.sdk.imgs[0];
			e[this.name].call(data);
		};
	}
	else if(pointParent.type === 2) {
		point.onevent = function(data) {
			this.parent.parent.parentElement[this.name].call(data);
		};
	}
	else if(pointParent.type === 3) {
		pointParent.onevent = function(data) {
			var e = this.parent.sdk.imgs[0];
			return e[this.name].call(data);
		};
	}
	else if(pointParent.type === 4) {
		point.onevent = function(data) {
			return this.parent.parent.parentElement[this.name].point.onevent(data);
		};
	}
};

MultiElementEditor.prototype.onpropchange = function(prop) {
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
		var arr = {WorkCount:0, EventCount:1, VarCount:2, DataCount:3};
		var arrNames = ["doWork", "onEvent", "Var", "Data"];
		var t = arr[prop.name];
		{
			var newType = t < 2 ? 1 - t : 5 - t;
			var eDelta = prop.value - this.psize[newType];
			if(eDelta > 0) {
				for(var i = 0; i < eDelta; i++) {
					var _name = arrNames[t] + (this.psize[newType] + 1);

					var point = this.addPoint(_name, newType+1);
				}
			}
			else if(eDelta < 0) {
				for(var i = 0; i < -eDelta; i++) {
					var _name = arrNames[t] + this.psize[newType];
					if(this.points[_name].isFree() && this.parent.parentElement.points[_name].isFree()) {
						this.removePoint(_name);
					}
					else {
						prop.value += -eDelta - i;
						break;
					}
				}
			}
		}
	}
};

MultiElementEditor.prototype.addPoint = function(name, type) {
	var oldW = this.w;
	var oldH = this.h;
	
	var newType = type < 3 ? 3 - type : 7 - type;
	var point = SdkElement.prototype.addPoint.call(this, name, type);
	var pointParent = this.parent.parentElement.addPoint(name, newType);
	this.addEvent(point, pointParent);
	
	if(this.w < oldW) {
		this.w = oldW;
	}
	if(this.h < oldH) {
		this.h = oldH;
	}
	this.rePosPoints();
	
	return point;
};

MultiElementEditor.prototype.removePoint = function(name) {
	var oldW = this.w;
	var oldH = this.h;
	
	SdkElement.prototype.removePoint.call(this, name);
	this.parent.parentElement.removePoint(name);
	
	if(this.w < oldW) {
		this.w = oldW;
	}
	if(this.h < oldH) {
		this.h = oldH;
	}
	this.rePosPoints();
};

MultiElementEditor.prototype.getPointInfo = function(point) {
	return "";
};

//******************************************************************************
// MultiElementEditorEx
//******************************************************************************

function MultiElementEditorEx(id) {
	MultiElementEditor.call(this, id);
}

MultiElementEditorEx.prototype = Object.create(MultiElementEditor.prototype);

MultiElementEditorEx.prototype.onpropchange = function(prop) {
	if(prop === this.props.WorkCount || prop === this.props.EventCount || prop === this.props.VarCount || prop === this.props.DataCount) {
		var arr = {WorkCount:0, EventCount:1, VarCount:2, DataCount:3};
		var lines = prop.value.split("\n");
		var t = arr[prop.name];
		var newType = t < 2 ? 1 - t : 5 - t;
		
		var hash = {};
		for(var line of lines) {
			if(line) {
				var arr = line.split("=");
				if(!this.points[arr[0]]) {
					var newPoint = this.addPoint(arr[0], newType+1);
					newPoint._dplInfo = arr[1] || "";
				}
				hash[arr[0]] = true;
			}
		}
		for(var p in this.points) {
			var point = this.points[p];
			if(newType == point.type-1 && hash[point.name] !== true) {
				this.removePoint(point.name);
			}
		}
	}
	else {
		MultiElementEditor.prototype.onpropchange.call(this, prop);
	}
};

MultiElementEditorEx.prototype.getPointInfo = function(point) {
	return point._dplInfo || "";
};

MultiElementEditorEx.prototype.showDefaultPoint = function(name) {
	if(this.points[name])
		return this.points[name];

	var p = this.pointsEx[name];
	if(p) {
		var newType = p.type < 3 ? 3 - p.type : 7 - p.type;
		return this.addPoint(name, newType);
	}
	
	return null;
};

//******************************************************************************
// MultiElement
//******************************************************************************

function MultiElement(id) {
	SdkElement.call(this, id);
}

MultiElement.prototype = Object.create(SdkElement.prototype);

MultiElement.prototype.getEditorName = function() {
	return "MultiElementEditor";
};

MultiElement.prototype.loadFromTemplate = function() {
	SdkElement.prototype.loadFromTemplate.call(this);
	
	this.sdk = new SDK(this.parent.pack);
	this.sdk.parent = this.parent;
	this.sdk.parentElement = this;
	var editor = this.getEditorName();
	if(editor) {
		var offset = window.getOptionInt("opt_multi_offset", 7);
		this.sdk.add(editor, offset, offset);
	}
};

MultiElement.prototype.makeLink = function(element) {
	SdkElement.prototype.makeLink.call(this, element);
	
	this.sdk = element.sdk;
	for(var p in element.points) {
		var point = element.points[p];
		this.addPoint(point.name, point.type);
	}
};

MultiElement.prototype.getPointInfo = function(point) {
	return "";
};

//******************************************************************************
// MultiElementEx
//******************************************************************************

function MultiElementEx(id) {
	MultiElement.call(this, id);
}

MultiElementEx.prototype = Object.create(MultiElement.prototype);

MultiElementEx.prototype.getEditorName = function() {
	return "MultiElementEditorEx";
};

MultiElementEx.prototype.getPointInfo = function(point) {
	return this.sdk.imgs[0].points[point.name]._dplInfo;
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
		var point;
		if(prop.isDef()) {
			if(this.primary) {
				point = this.addPoint("Out", pt_event);
			}
			else {
				point = this.addPoint("In", pt_work);
				point.onevent = function(data) {
					if(this.parent.second) {
						this.parent.second.Out.call(data);
					}
				};
			}
		}
		else {
			if(this.primary) {
				point = this.addPoint("Data", pt_data);
			}
			else {
				point = this.addPoint("Var", pt_var);
				point.onevent = function(data) {
					if(this.parent.second) {
						return this.parent.second.Data.call(data);
					}
				};
			}
		}
		point.inherit = this.name;
		
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

LineBreak.prototype.save = function(selection, tab) {
	if(this.primary || !selection || this.second.isSelect()) {
		return SdkElement.prototype.save.call(this, selection, tab);
	}
	else {
		return this.second.save(selection, tab);
	}
};

LineBreak.prototype.saveToText = function() {
	var text = CapElement.prototype.saveToText.call(this);
	if(this.primary) {
		text += "  Primary=[" + this.primary.eid + "," + (this.primary.x - this.x) + "," + (this.primary.y - this.y) + "]\n";
	}
	return text;
};

LineBreak.prototype.loadFromText = function(line) {
	if(line.substr(0, 7) == "Primary") {
		var data = line.substr(9, line.length - 10);
		var arr = data.split(",");
		var e = this.parent.getElementByEId(parseInt(arr[0]));
		if(!e) {
			e = this.parent.add(this.name, this.x + parseInt(arr[1]), this.y + parseInt(arr[2]));
			e.eid = parseInt(arr[0]);
			e.props.Caption.value = this.props.Caption.value;
		}
		e.second = this;
		this.setPrimary(e);
		return true;
	}
	return CapElement.prototype.loadFromText.call(this, line);
};

LineBreak.prototype.drawBody = function(ctx) {
	if(!this.ctx) {
		this.ctx = ctx;
		this.onpropchange(this.prop);
	}

	if(this.props.Type.isDef()) {
		var offset = 3;
		ctx.strokeStyle = ELEMENT_BORDER_COLOR;
		ctx.fillStyle = this.isSelect() ? ELEMENT_SELECT_COLOR : this.sys.Color.value;
		ctx.beginPath();
		if(this.second) {
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x + this.w, this.y);
			ctx.lineTo(this.x + this.w + offset, this.y + this.h/2);
			ctx.lineTo(this.x + this.w, this.y + this.h);
			ctx.lineTo(this.x, this.y + this.h);
		}
		else {
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(this.x + this.w, this.y);
			ctx.lineTo(this.x + this.w, this.y + this.h);
			ctx.lineTo(this.x, this.y + this.h);
			ctx.lineTo(this.x + offset, this.y + this.h/2);
		}
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	}
	else {
		CapElement.prototype.drawBody.call(this, ctx);
	}
};

LineBreak.prototype.getFirstFreePoint = function(type) {
	if(this.second) {
		if(this.props.Type.isDef() && type == pt_event || !this.props.Type.isDef() && type == pt_data)
			return this.second.getFirstFreePoint(type);
	}
	
	return CapElement.prototype.getFirstFreePoint.call(this, type);
};

LineBreak.prototype.getLinkedPoint = function(point) {
	if(this.second) {
		if(point.type == pt_work)
			return this.second.points["Out"].point;
		if(point.type == pt_var)
			return this.second.points["Data"].point;
	}
	if(this.primary) {
		if(point.type == pt_event)
			return this.primary.points["In"].point;
		if(point.type == pt_data)
			return this.primary.points["Var"].point;
	}
	
	return SdkElement.prototype.getLinkedPoint.call(this, point);
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
		var point;
		switch(prop.value) {
			case 0:
				point = this.addPoint("doWork", pt_work);
				point.onevent = function(data) {
					if(this.parent.pair) {
						this.parent.pair.onEvent.call(data);
					}
				};
				break;
			case 1:
				point = this.addPoint("onEvent", pt_event);
				break;
			case 2:
				point = this.addPoint("getVar", pt_var);
				point.onevent = function(data) {
					if(this.parent.pair) {
						return this.parent.pair._Data.call(data);
					}
				};
				break;
			case 3:
				point = this.addPoint("_Data", pt_data);
		}
		point.inherit = this.name;
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
			if(e.name == this.name && e.props.Type.value == prop && e.props.Caption.value == this.props.Caption.value) {
				this.pair = e;
				break;
			}
		}
	}
};

LineBreakEx.prototype.getLinkedPoint = function(point) {
	if(this.props.Type.value % 2 == 0) {
		var prop = this.props.Type.value == 0 ? 1 : 3;
		for(var e of this.parent.imgs) {
			if(e.name == this.name && e.props.Type.value == prop && e.props.Caption.value == this.props.Caption.value) {
				return e.points[prop == 1 ? "onEvent" : "_Data"].point;
			}
		}
	}
	
	return SdkElement.prototype.getLinkedPoint.call(this, point);
};

//******************************************************************************
// Version
//******************************************************************************

function Version(id) {
	SdkElement.call(this, id);
}

Version.prototype = Object.create(SdkElement.prototype);


//******************************************************************************
// IfElse
//******************************************************************************

function IfElse(id) {
	SdkElement.call(this, id);
}

IfElse.prototype = Object.create(SdkElement.prototype);

IfElse.prototype.drawIcon = function(ctx) {
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
	if(this['doScrollByX']) {
		this.doScrollByX.onevent = function(data) {
			this.parent.ctl.getControl().scrollLeft = data;
		}
	}
	if(this['doScrollByY']) {
		this.doScrollByY.onevent = function(data) {
			this.parent.ctl.getControl().scrollTop = data;
		}
	}
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
	if(this['HTMLElement']) {
		this.HTMLElement.onevent = function() {
			return this.parent.ctl.getControl();
		}
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