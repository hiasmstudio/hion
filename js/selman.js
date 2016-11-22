function SelectManager(sdk) { 
	this.sdk = sdk;
	this.items = new Array();
	
	this.selectEvent = true;
	this.onselect = function() {};

	this.doSelect = function() {
		if(this.selectEvent) {
			this.onselect();
		}
	};
	this.beginSelect = function() {
		this.selectEvent = false;
	};
	this.endSelect = function() {
		this.selectEvent = true;
		this.doSelect();
	};
	this.add = function(e) {
		this.items[this.items.length] = e;
		e.flags |= window.IS_SELECT;
		this.doSelect();
	};
	this.select = function(e) {
		this.beginSelect();
		this.clear();
		this.add(e);
		this.endSelect();
	};
	this.unselect = function(e) {
		for(var i in this.items) {
			if(this.items[i] === e) {
				e.flags ^= window.IS_SELECT;
				this.items.splice(i, 1);
				this.doSelect();
				break;
			}
		}
	};
	this.selRect = function(ox1, oy1, ox2, oy2) {
		this.beginSelect();
		var x1 = Math.min(ox1, ox2);
		var y1 = Math.min(oy1, oy2);
		var x2 = Math.max(ox1, ox2);
		var y2 = Math.max(oy1, oy2);
		for(var i in this.sdk.imgs) {
			var e = this.sdk.imgs[i];
			if(!e.isSelect() && e.inRect(x1, y1, x2, y2))
				this.add(e);
		}
		this.endSelect();
	};
	this.selectAll = function() {
		this.beginSelect();
		this.clear();
		for(var i in this.sdk.imgs) {
			this.add(this.sdk.imgs[i]);
		}
		this.endSelect();
	};
	this.clear = function() {
		for(var i = 0; i < this.items.length; i++)
			this.items[i].flags ^= window.IS_SELECT;
		this.items = new Array();
		this.doSelect();
	};
	this.setProp = function(name, value) {
		for(var i = 0; i < this.items.length; i++) {
			this.items[i].setProperty(name, value);
		}
	};
	this.changePoint = function(name, checked) {
		var pName = "do" + name;
		for(var i = 0; i < this.items.length; i++) {
			var e = this.items[i];
			if(checked && !e.points[pName]) {
				e.addPoint(pName, pt_work);
			}
			else {
				if(e.points[pName]) {
					e.removePoint(pName);
				}
			}
		}
	};
	this.move = function(dx, dy) {
		for(var i = 0; i < this.items.length; i++) {
			this.items[i].move(dx, dy);
		}
	};
	this.erase = function() {
		for(var i = 0; i < this.items.length; i++) {
			if(this.items[i].canDelete()) {
				for(var j = 0; j < this.sdk.imgs.length; j++) {
					if(this.items[i] === this.sdk.imgs[j]) {
						this.sdk.deleteElement(j);
						break;
					}
				}
			}
			else {
				this.items[i].flags ^= window.IS_SELECT;
			}
		}
		this.items = new Array();
		this.doSelect();
	};
	this.isEmpty = function() {
		return this.items.length === 0;
	};
	this.size = function() {
		return this.items.length;
	};
	this.eath = function(callback) {
		for(var i in this.items) {
			callback(this.items[i]);
		}
	};
	this.normalizePosition = function() {
		var minX = 0, minY = 0;
		for(var i in this.items) {
			if(this.items[i].x < minX) {
				minX = this.items[i].x;
			}
			if(this.items[i].y < minY) {
				minY = this.items[i].y;
			}
		}
		
		if(minX || minY) {
			this.move(-minX + POINT_SPACE, -minY + POINT_SPACE);
		}
	};
	this.normalizeLinks = function() {
		for(var i in this.items) {
			for(var p in this.items[i].points) {
				var point = this.items[i].points[p];
				if(!point.isFree()) {
					if(!point.isPrimary()) {
						point = point.point;
					}

					// create new path
					if(point.pos.next === point.point.pos) {
						point.createPath();
						continue;
					}
					
					// clear old path
					var n = point.pos.next;
					var inLine = true;
					while (n) {
						if(point.type === pt_event && n.y != point.pos.y) {
							inLine = false;
						}
						else if(point.type === pt_data && n.x != point.pos.x) {
							inLine = false;
						}
						n = n.next;
					}
					if(inLine) {
						point.clearPath();
					}
				}
			}
		}
	};
	this.getRect = function() {
		var minX = 32768;
		var minY = 32768;
		var maxX = -32768;
		var maxY = -32768;
		for(var i in this.items) {
			var item = this.items[i];
			if(item.x < minX) minX = item.x;
			if(item.y < minY) minY = item.y;
			if(item.x + item.w > maxX) maxX = item.x + item.w;
			if(item.y + item.h > maxY) maxY = item.y + item.h;
		}
		
		return {x1:minX, y1:minY, x2:maxX, y2:maxY};
	};
}
