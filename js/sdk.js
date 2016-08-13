'use strict';

var FLAG_USE_RUN  = 0x01;
var FLAG_USE_EDIT = 0x02;
var FLAG_USE_CHILD= 0x04;

var OBJ_TYPE_ELEMENT	= 1;
var OBJ_TYPE_POINT		= 2;
var OBJ_TYPE_LINE		= 3;
var OBJ_TYPE_LINEPOINT	= 4;
var OBJ_TYPE_HINT		= 5;

function SDK(pack) {
	this.imgs = new Array();
	this.pack = pack;
	/**
	 * {SelectManager}
	 */
	this.selMan = new SelectManager(this);
	
	this.ondraw = function(){};
	this.onaddelement = function(element) {};
	this.onremoveelement = function(element) {};
	
	this.deleteElement = function (ind) {
		var e = this.imgs.splice(ind, 1);
		e[0].erase();
		this.onremoveelement(e[0]);
	};
	this.deleteElementById = function (eid) {
		for(var i = 0; i < this.imgs.length; i++) {
			if(this.imgs[i].eid === eid) {
				this.deleteElement(i);
				break;
			}
		}
	};

	function Test(v1,v2,tp) {
		if(v2 < v1)
			return (v2-4 < tp) && (tp < v1+4);
		return (v1-4 < tp) && (tp < v2+4);
	}

	function isLine(x,y, lx1,ly1,lx2,ly2) {
		if( Test(lx1,lx2,x) && Test(ly1,ly2,y) ) {
			var p = ly2 - ly1;
			var k = lx2 - lx1;
			var C = ly1*k - lx1*p;
			return Math.abs(p*x - k*y + C);
		}
		else
			return 500;
	}

	this.linebypos = function (p, x, y) {
		if(p.point === null)
			return null;
		var fp = p.pos;
		var sp = fp.next;
		while(sp) {
			if(isLine(x,y, fp.x, fp.y, sp.x, sp.y) < 200)
				return fp;
			fp = sp;
			sp = sp.next;
		}

		return null;
	};

	this.getElementById = function(id) {
		for(var e of this.imgs) {
			if(e.name === id) {
				return e;
			}
		}
		return null;
	};

	this.getElementByEId = function(id) {
		for(var e of this.imgs) {
			if(e.eid === id) {
				return e;
			}
		}
		return null;
	};

	this.getObjectAtPos = function (x, y) {
		for (var i = this.imgs.length - 1; i >= 0; i--) {
			var element = this.imgs[i];
			// point
			if(element.mouseGetPoint()) {
				for (var pIndex in element.points) {
					var p = element.points[pIndex];
					var dx = x - p.pos.x;
					var dy = y - p.pos.y;
					if (dx <= 4 && dx >= -3 && dy <= 4 && dy >= -3)
						return {type: OBJ_TYPE_POINT, obj: p};
				}
			}
			// element
			if (element.inPoint(x, y)) {
				return {type: OBJ_TYPE_ELEMENT, obj: this.imgs[i]};
			}
			
			// element hint
			for(var h of element.hints) {
				if (x > element.x + h.x && x < element.x + h.x + h.width && y > element.y + h.y && y < element.y + h.y + h.height)
					return {type: OBJ_TYPE_HINT, obj: h};
			}
		}

		for (var i = this.imgs.length - 1; i >= 0; i--) {
			for (var j in this.imgs[i].points) {
				var p = this.imgs[i].points[j];
				if (p.type % 2 === 0 && p.point) {
					// line point
					var pt = p.pos;
					while (pt) {
						if (Math.abs(x - pt.x) <= 3 && Math.abs(y - pt.y) <= 3)
							return {type: OBJ_TYPE_LINEPOINT, obj: pt, point: p};
						pt = pt.next;
					}
					// line
					var line = this.linebypos(p, x, y);
					if (line)
						return {type: OBJ_TYPE_LINE, obj: line, point: p};
				}
			}
		}
		return null;
	};

	this.draw = function (ctx) {
		//links
		for (var e of this.imgs) {
			for (var i in e.points) {
				var p = e.points[i];
				if (p.type % 2 === 0 && p.point) {
					if(p.selected || p.point.selected) {
						ctx.lineWidth = 2;
					}
					ctx.strokeStyle = p.type < 3 ? "#00c" : "#c00";
					ctx.beginPath();
					ctx.moveTo(p.pos.x, p.pos.y);
					var n = p.pos.next;
					while (n) {
						ctx.lineTo(n.x, n.y);
						n = n.next;
					}
					ctx.stroke();
					if(p.selected || p.point.selected) {
						ctx.lineWidth = 1;
					}
				}
			}
		}

		//elements
		for (var e of this.imgs) {
			e.draw(ctx);
		}
	};

	this.clearProject = function () {
		this.imgs = new Array();
		this.add(this.pack.entry, 56, 56);
	};
	
	this.getRootSDK = function() {
		var sdk = this;
		while(sdk.parent) {
			sdk = sdk.parent;
		}
		return sdk;
	};
	this.getNextID = function() {
		return this.getRootSDK().eids++;
	};
	this.getCurrentID = function() {
		return this.getRootSDK().eids;
	};
	this.resetID = function() {
		this.setID(1);
	};
	this.setID = function(value) {
		this.getRootSDK().eids = value;
	};

	this.add = function (id, x, y) {
		var e = createElement(this, id, x, y);
		e.eid = this.getNextID();
		this.imgs.push(e);
		this.onaddelement(e);
		return e;
	};
	
	this.save = function (selection) {
		var text = "Make(webapp)\n";
		for (var e of this.imgs) {
			if(selection && !e.isSelect()) {
				continue;
			}
			text += "Add(" + e.name + "," + e.eid + "," + e.x + "," + e.y + ")\n";
			text += "{\n";
			var propPoints = "";
			for (var p in e.props) {
				var prop = e.props[p];
				if(!prop.isDef()) {
					text += "  " + p + "=" + prop.serialize() + "\n";
				}
				if(prop.isPoint() && e.findPointByName("do" + prop.name)) {
					propPoints += "  Point(do" + prop.name + ")\n";
				}
			}
			for (var p in e.sys) {
				var prop = e.sys[p];
				if(!prop.isDef()) {
					text += "  @" + p + "=" + prop.serialize() + "\n";
				}
			}
			for(var p of e.pointsEx) {
				if(e.findPointByName(p.name)) {
					propPoints += "  Point(" + p.name + ")\n";
				}
			}
			text += propPoints;
			for(var h of e.hints) {
				if(h.prop) {
					text += "  AddHint(" + h.x + "," + h.y + ",0,0," + h.prop.name + ")\n";
				}
			}
			for (var j in e.points) {
				var p = e.points[j];
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
			text += e.saveToText();
			text += "}\n";
			if(e.sdk) {
				text += "BEGIN_SDK\n";
				text += e.sdk.save();
				text += "END_SDK\n";
			}
		}
		return text;
	};

	this.findElementById = function (id) {
		for (var e of this.imgs) {
			if (e.eid === id)
				return e;
		}
		return null;
	};

	this.load = function (text, start) {
		var arr = text.split("\r\n"); // opera like...
		if (arr.length < 2)
			arr = text.split("\n");
		var links = new Array();
		var e = null;
		var index = start ? start : 0;

		if(index === 0) {
			this.resetID();
		}
		
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
		function parseProperty(name, prop, value) {
			if(prop.type === DATA_LIST || prop.type === DATA_STR) {
				if(value.substr(0, 1) === "#") {
					value = parseStringValue(value);
				}
			}
			else if(prop.type === DATA_DATA) {
				var i = value.indexOf("(");
				if(i > 0) {
					var type = value.substr(0, i);
					var v = value.substr(i + 1, value.length - i - 2);
					if(type === "String") {
						value = v.substr(0, 1) == "#" ? parseStringValue(v) : v;
					}
					else if(type === "Integer") {
						value = parseInt(v);
					}
					else if(type === "Real") {
						value = parseFloat(v);
					}
				}
				else {
					value = parseStringValue(value);
					if(!isNaN(parseInt(value))) {
						value = parseInt(value);
					}
					else if(!isNaN(parseFloat(value))) {
						value = parseFloat(value);
					}
				}
			}
			e.setProperty(name, value);
		}

		for (; index < arr.length; index++) {
			var line = arr[index].trim();
			if (line.length === 0)
				continue;

			if (line.substr(0, 4) === "Make(") {
				
			} else if (line.substr(0, 4) === "Add(") {
				var l = line.substr(4, line.length - 5).split(",");
				if (l[0] === this.pack.entry && this.imgs[0].name === l[0]) {
					e = this.imgs[0];
					e.move(parseInt(l[2]) - e.x, parseInt(l[3]) - e.y);
				} else {
					e = this.add(l[0], parseInt(l[2]), parseInt(l[3]));
				}
				e.eid = parseInt(l[1]);
				if (e.eid >= this.getCurrentID())
					this.setID(e.eid + 1);
			} else if (line.substr(0, 5) === "link(") {
				var pa = line.substr(5, line.length - 6).split(",");
				var sp = pa[1].split(":");
				var s = "";
				for (var j = 2; j < pa.length; j++) // TODO: realgoritmic
					s += pa[j] + ",";
				links[links.length] = {srce: e, srcp: pa[0], dste: parseInt(sp[0]), dstp: sp[1], links: s};
			} else if (line.substr(0, 1) === "{") {
			} else if (line.substr(0, 1) === "}") {
				
			} else if (line === "BEGIN_SDK") {
				e.sdk.imgs = [];
				index = e.sdk.load(text, index + 1);
				e.sdk.imgs[0].parentElement = e;
			} else if (line === "END_SDK") {
				break;
			} else if(line.substr(0, 1) === "@") {
				var pSys = line.substr(1, line.length - 1).split("=");
				var name = pSys[0];
				//e.setProperty(p[0], p[1]);
				parseProperty(name, e.sys[name], pSys[1]);
			} else if(line.substr(0, 7) === "AddHint") {
				var name = line.substr(8, line.length - 9);
				var hintParams = name.split(",");
				e.addHint(parseInt(hintParams[0]), parseInt(hintParams[1]), e.props[hintParams[4]] || e.sys[hintParams[4]]);
			} else if(line.substr(0, 5) === "Point") {
				var name = line.substr(6, line.length - 7);
				// TODO оптимизировать
				for(var p of e.pointsEx) {
					if(p.name === name) {
						e.addPoint(name, p.type);
						break;
					}
				}
				if(!e.findPointByName(name)) {
					e.addPoint(name, pt_work);
				}
			} else if (e) {
				var ind = line.indexOf("=");
				var name = line.substr(0, ind).trim();
				if (e.props[name]) {
					parseProperty(name, e.props[name], line.substr(ind+1));
				}
				else if(e.loadFromText(line)) {
					// do nothing
				}
				else
					printError("Property not found: " + name + ", " + line);
			}
		}
		for (var i in links) {
			var e1 = links[i].srce;
			var e2 = this.findElementById(links[i].dste);
			if (e1 && e2) {
				var p1 = e1.findPointByName(links[i].srcp);
				var p2 = e2.findPointByName(links[i].dstp);
				if (p1 && p2) {
					p1.connect(p2);
					var lk = links[i].links.substr(2, links[i].links.length - 5);
					if (lk) {
						var pts = lk.split(")(");
						var n = p1.pos;
						for (var j = 0; j < pts.length; j++) {
							var coord = pts[j].split(",");
							n.next = {x: parseInt(coord[0]), y: parseInt(coord[1]), next: n.next, prev: n};
							n.next.next.prev = n.next;
							n = n.next;
						}
					}
				} else
					printError("Point not found! " + links[i].dstp);
			} else
				printError("Element not found! " + links[i].dste);
		}
		return index;
	};
	
	this.run = function(flags) {
		var prn = null;
		for(var i of this.imgs) {
			if(i.flags & window.IS_PARENT) {
				prn = i;
				break;
			}
		}
		var parent = null;
		if(prn) {
			parent = prn.run(flags);
		}
		for(var e of this.imgs) {
			if(e !== prn) {
				var ctl = e.run(flags);
				if(ctl && parent) {
					parent.add(ctl);
				}
			}
		}
		for(var e of this.imgs) {
			e.oninit();
		}
		return prn ? prn.getChild() : parent;
	};
	
	this.stop = function(flags) {
		for(var e of this.imgs) {
			e.onfree(flags);
		}
	};
	
	this.resetID();
}

SDK.prototype.getParams = function() {
	var minX = 32768;
	var minY = 32768;
	var maxX = -32768;
	var maxY = -32768;
	for(var i of this.imgs) {
		if(i.x < minX) minX = i.x;
		if(i.y < minY) minY = i.y;
		if(i.x + i.w > maxX) maxX = i.x + i.w;
		if(i.y + i.h > maxY) maxY = i.y + i.h;
	}
	
	return {x1: minX, y1: minY, x2: maxX, y2: maxY};
};

SDK.prototype.indexOf = function(element) {
	for(var i = 0; i < this.imgs.length; i++) {
		if(this.imgs[i] === element) {
			return i;
		}
	}
	
	return -1;
};