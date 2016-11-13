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
var DATA_MANAGER  = 20;

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
		case DATA_MANAGER:
			return '"' + this.value + '"';
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
		var textOffset = h.prop.type == DATA_COLOR ? 18 : 0;
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
		
		if(h.prop.type == DATA_COLOR) {
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
SdkElement.prototype.onfree = function() {};

SdkElement.prototype.loadFromText = function(line) { return false; };
SdkElement.prototype.saveToText = function() { return ""; };

SdkElement.prototype.initPointHandler = function(name, handler) {
	if(this.points[name]) {
		this.points[name].onevent = handler;
	}
};


function getClass(pack, id) {
	var template = pack.elements[id];
	if(!template) {
		console.error("Element config not found: ", id);
	}
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
	
	if(sdk.pack.name == "modules")
		initCoreElement(i);

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
	ctx.fillStyle = "#000";
	ctx.font = "12px Arial";
	
	var lines = wrapText(ctx, this.props.Info.value, this.w - 2*offset);
	var y = this.y + 12;
	var lineHeight = 14;
	if(this.props.VAlign.value === 1) {
		y += (this.h - 14*lines.length)/2;
	}
	else if(this.props.VAlign.value === 2) {
		y += this.h - 14*lines.length - offset;
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
// LTElement
//******************************************************************************

function LTElement(id) {
	SdkElement.call(this, id);
	this.h = 18;
	this.needCalcSize = true;
}

LTElement.prototype = Object.create(SdkElement.prototype);

LTElement.prototype.onpropchange = function(prop) {
	if(prop === this.props.Link) {
		this.needCalcSize = true;
	}
};

LTElement.prototype.draw = function(ctx) {
	ctx.font = "12px Arial";

	if(this.needCalcSize) {
		var metrics = ctx.measureText(this.props.Link.value);
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
	ctx.fillText(this.props.Link.value, this.x + 2, this.y + 1 + 12);
};

LTElement.prototype.mouseDown = function(x, y, button, flags) {
	if(flags & 0x2) {
		window.open(this.props.Link.value);
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
					this.addEvent(point, pointParent);
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

//******************************************************************************
// MultiElementEditorEx
//******************************************************************************

function MultiElementEditorEx(id) {
	MultiElementEditor.call(this, id);
}

MultiElementEditorEx.prototype = Object.create(MultiElementEditor.prototype);

MultiElementEditorEx.prototype.onpropchange = function(prop) {
	if(prop === this.props.WorkCount || prop === this.props.EventCount || prop === this.props.VarCount || prop === this.props.DataCount) {
		var oldW = this.w;
		var oldH = this.h;

		var arr = {WorkCount:0, EventCount:1, VarCount:2, DataCount:3};
		var lines = prop.value.split("\n");
		var t = arr[prop.name];
		var newType = t < 2 ? 1 - t : 5 - t;
		
		var hash = {};
		for(var line of lines) {
			if(line) {
				var arr = line.split("=");
				var newPoint = this.points[arr[0]] || this.addPoint(arr[0], newType+1);
				var pointParent = this.parent.parentElement.points[arr[0]] || this.parent.parentElement.addPoint(arr[0], t+1);
				this.addEvent(newPoint, pointParent);
				newPoint._dplInfo = arr[1] || "";
				hash[arr[0]] = true;
			}
		}
		for(var p in this.points) {
			var point = this.points[p];
			if(newType == point.type-1 && hash[point.name] !== true) {
				this.removePoint(point.name);
				this.parent.parentElement.removePoint(point.name);
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
	else {
		MultiElementEditor.prototype.onpropchange.call(this, prop);
	}
};

MultiElementEditorEx.prototype.getPointInfo = function(point) {
	return point._dplInfo || "";
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
	var offset = window.getOptionInt("opt_multi_offset", 7);
	this.sdk.add(this.getEditorName(), offset, offset);
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