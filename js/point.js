/* global POINT_SPACE */
/* global POINT_OFF */

const pt_work = 1;
const pt_event = 2;
const pt_var = 3;
const pt_data = 4;

function Point(parent, name, type) {
	this.parent = parent;
	this.name = name;
	this.pos = {x: 0, y: 0, next: null, prev: null};
	if (type < 3) {
		this.pos.x = parent.x + ((type === 1) ? 0 : parent.w);
		this.pos.y = parent.y + 6 + parent.psize[type - 1] * 7;
	} else {
		this.pos.x = parent.x + 6 + parent.psize[type - 1] * 7;
		this.pos.y = parent.y + ((type === 4) ? 0 : parent.h);
	}
	this.point = null;
	this.type = type;

	if(type === 2 || type === 4) {
		this.call = function(data) {
			return on_event(this.point, data === undefined ? "" : data);
		};
	}
}

Point.prototype.getPair = function() { return this.type + (this.isPrimary() ? -1 : 1); };
Point.prototype.isPrimary = function() { return this.type % 2 == 0; };
Point.prototype.isFree = function() { return this.point === null; };

Point.prototype.connect = function(pair) {
//		if(p.type === 1) {
//			this.parent[this.name].call = p.parent[p.name].onevent;
//			this.parent[this.name].parent = p.parent;
//		}
	if(this.isPrimary()) {
		this.point = pair;
		pair.point = this;
		this.pos.next = pair.pos;
		pair.pos.prev = this.pos;
	}
	else {
		pair.connect(this);
	}
	
	return this;
};

// find best link
Point.prototype.connectWithPath = function(pairs) {
	var best = null;
	var bestLevel = 0;
	for(var pair of pairs) {
		if(pair.isFree()) {
			this.clear();
			this.connect(pair).createPath();
			var pp = this.pos;
			var bl = 0;
			while(pp.next) {
				bl++;
				pp = pp.next;
			}
			if(!best || bl < bestLevel) {
				best = pair;
				bestLevel = bl;
			}
		}
	}

	if(best && best != this.point) {
		this.clear();
		this.connect(best).createPath();
	}
};

function addLinePoint(lp, x, y) {
	var np = {};

	if(lp) {
		np.next = lp.next;
		np.prev = lp;
		lp.next = np;
		if(np.next) np.next.prev = np;
	}
	else {
		np.next = null;
		np.prev = null;
	}

	np.x = x;
	np.y = y;

	return np;
}

const kx = [1,0,-1,0];
const ky = [0,1,0,-1];

function moveVector(v, l) {
	if(l*kx[v.side] > 0) v.x += l;
	if(l*ky[v.side] > 0) v.y += l;
}

function crossVectors(v1, v2, cxy) {
	cxy.x = 0;
	cxy.y = 0;

	if(Math.abs(v1.side - v2.side) % 2 == 0)
		return false;

	// todo
	if(kx[v1.side] == 0) {
		cxy.x = Math.round((v1.x - v2.x)/kx[v2.side]);
		if(cxy.x == 0) cxy.x = -POINT_SPACE;
		if(cxy.x < 0) return false;
	}
	else {
		cxy.x = Math.round((v2.x - v1.x)/kx[v1.side]);
		if(cxy.x == 0) cxy.x = -POINT_SPACE;
		if(cxy.x < 0) return false;
	}

	if(ky[v1.side] == 0) {
		cxy.y = Math.round((v1.y - v2.y)/ky[v2.side]);
		if(cxy.y == 0) cxy.y = -POINT_SPACE;
		if(cxy.y < 0) return false;
	}
	else {
		cxy.y = Math.round((v2.y - v1.y)/ky[v1.side]);
		if(cxy.y == 0) cxy.y = -POINT_SPACE;
		if(cxy.y < 0) return false;
	}

	return true;
}

function rotateRight(v) {
	if(v.side == 3)
		v.side = 0;
	else v.side++;
}

function rotateLeft(v) {
	if(v.side == 0)
		v.side = 3;
	else v.side--;
}

function calcIncX(v1, v2) {
	if(v1.side == v2.side && v2.y != v1.y)
		return v2.x + kx[v2.side]*v2.l - v1.x;
	else
		return Math.round((v2.x - v1.x)/2);
}

function calcIncY(v1, v2) {
	if(v1.side == v2.side && v2.x != v1.x)
		return v2.y + ky[v2.side]*v2.l - v1.y;
	else
		return Math.round((v2.y - v1.y)/2);
}

function tracePath(p, v1, v2) {
	if(v1.side != v2.side) {
		if(v1.x == v2.x) {
			if( (ky[v1.side] == 1 && v1.y < v2.y) ||
				(ky[v2.side] == 1 && v2.y < v1.y)) return;
		}
		else if(v1.y == v2.y) {
			if( (kx[v1.side] == 1 && v1.x < v2.x) ||
				(kx[v2.side] == 1 && v2.x < v1.x)) return;
		}
	}

	var t = v1, old;
	//unsigned char step = 0;
	var cxy = {};
	while(!crossVectors(t, v2, cxy)) {
		old = {x: t.x, y: t.y};
		if(kx[t.side]) moveVector(t, calcIncX(t, v2));
		if(ky[t.side]) moveVector(t, calcIncY(t, v2));
		if(/*step == 0 &&*/ old.x == t.x && old.y == t.y) {
			t.x += t.l*kx[t.side];
			t.y += t.l*ky[t.side];
		}
		p = addLinePoint(p, t.x, t.y);
		switch(t.side) {
			case 0:	if(v2.y > t.y) rotateRight(t); else rotateLeft(t); break;
			case 1:	if(v2.x > t.x) rotateLeft(t); else rotateRight(t); break;
			case 2:	if(v2.y > t.y) rotateLeft(t); else rotateRight(t); break;
			case 3: if(v2.x > t.x) rotateRight(t); else rotateLeft(t); break;
		}
	}
	t.x += cxy.x*kx[t.side];
	t.y += cxy.y*ky[t.side];
	addLinePoint(p, t.x, t.y);
}

Point.prototype.createPath = function() {
	if(!this.point.point) return;

	var point1 = this.isPrimary() ? this : this.point;
	var point2 = point1.point;

	var v1 = {x: point1.pos.x, y: point1.pos.y};

	if(point1.parent.name === "HubEx" || point1.parent.name === "GetDataEx") {
		v1.side = point1.parent.calcSide(point1);
		v1.l = 2*POINT_OFF;
	}
	else {
		v1.l = POINT_SPACE*2;
		switch(point1.type) {
			case pt_event: v1.side = 0; break;
			case pt_data: v1.side = 3; break;
			case pt_work: v1.side = 2; break;
			case pt_var: v1.side = 1; break;
		}
	}

	var v2 = {x: point2.pos.x, y: point2.pos.y};

	if(point2.parent.name === "HubEx" || point2.parent.name === "GetDataEx") {
		v2.side = point2.parent.calcSide(point2);
		v2.l = 2*POINT_OFF;
	}
	else {
		v2.l = POINT_SPACE*2;
		switch(point2.type) {
			case pt_event: v2.side = 0; break;
			case pt_data: v2.side = 3; break;
			case pt_work: v2.side = 2; break;
			case pt_var: v2.side = 1; break;
		}
	}
	tracePath(point1.pos, v1, v2);
};

Point.prototype.clearPath = function () {
	if(!this.isFree()) {
		this.pos.next = this.point.pos;
		this.point.pos.prev = this.pos;
	}
};

Point.prototype.clear = function () {
	if(this.point) {
		var p = this.point;
		this.point = null;
		this.pos.next = null;
		p.pos.prev = null;
		p.point = null;
	}
};

Point.prototype.getIcon = function() {
	var items = ["sc_func", "sc_event", "sc_var", "sc_prop"];
	return "img/icons/" + items[this.type-1] + ".png";
};

Point.prototype.getNodes = function() {
	var nodes = [];
	var pp = this.pos.next;
	while(pp && pp.next) {
		nodes.push({x: pp.x, y: pp.y});
		pp = pp.next;
	}
	return nodes;
};

Point.prototype.select = function() {
	if(this.selected)
		return;
	this.selected = true;
	var p = this.point;
	if(p) {
		var res = p.parent.getLinkedPoint(p);
		if(res && res !== p) {
			res.select();
			p = res;
		}
	}
};

Point.prototype.unselect = function() {
	if(this.selected) {
		delete this.selected;
		var p = this.point;
		if(p) {
			var res = p.parent.getLinkedPoint(p);
			if(res && res !== p) {
				res.unselect();
				p = res;
			}
		}
	}
};

Point.prototype.setColor = function(value) {
	value = value.toLowerCase();
	if(value === this.getDefaultColor())
		delete this.color;
	else
		this.color = value;
	var p = this.isPrimary() ? this.point : this;
	if(p) {
		var res = p.parent.getLinkedPoint(p);
		if(res !== p) {
			res.setColor(value);
			p = res;
		}
	}
};

Point.prototype.getDefaultColor = function() {
	return this.type < 3 ? "#00c" : "#c00"
};

Point.prototype.getColor = function() {
	return this.color || this.getDefaultColor();
};

Point.prototype.setInfo = function(data) {
	if(data.text)
		this.info = data;
	else if(this.info)
		delete this.info;
};

Point.prototype.getInfo = function() {
	return this.info || {text:"", direction: 0};
};

function on_event(point, data) {
	if (point) {
		return point.onevent(on_event.arguments.length === 2 ? data : "");
	}
	return "";
}