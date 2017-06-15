namespace Hion {
	// element flags
	export const IS_SELECT     = 0x01;
	export const IS_PARENT     = 0x02;
	export const IS_NODELETE   = 0x04;

	// property flags
	export const PROP_FLAG_DEFAULT = 0x01;	// default property for double click
	export const PROP_FLAG_POINT   = 0x02;	// can create point by property

	// element config
	export const POINT_OFF = 3;
	export const POINT_SPACE = 7;
	export const ELEMENT_BORDER_COLOR = "rgb(150,150,150)";
	export const ELEMENT_SELECT_COLOR = "rgb(100,100,100)";

	//const
	export const DATA_NONE     = 0;
	export const DATA_INT      = 1;
	export const DATA_STR      = 2;
	export const DATA_DATA     = 3;
	export const DATA_ENUM     = 4;
	export const DATA_LIST     = 5;
	export const DATA_ICON     = 6; // save as binary data
	export const DATA_REAL     = 7;
	export const DATA_COLOR    = 8;
	export const DATA_STREAM   = 10; // save as binary data
	export const DATA_BITMAP   = 11; // save as binary data
	export const DATA_ARRAY    = 13;
	export const DATA_ENUMEX   = 14;
	export const DATA_FONT     = 15;
	export const DATA_JPEG     = 17; // save as binary data
	export const DATA_MANAGER  = 20;
	export const DATA_FLAGS    = 21;  // no support

	interface PointsList {
		[key:string]: Point;
	}

	class PReader {
		private element: SdkElement;
		private data: any;

		read(name: string) {
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
		}
		readInt(name: string): number {
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
		}
		readFloat(name: string): number {
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
		}
	}

	interface PointTemplateList {
		[name: string]: PointTemplate;
	}
	interface ElementPropertyList {
		[name: string]: ElementProperty;
	}
	class PropertyHint {
		width: number;
		height: number;

		constructor(public x: number, public y: number, public prop: ElementProperty, public e: SdkElement) {}
	}

	export interface ElementMouseState {
		startX: number;
		startY: number;
	}

	/**
	 * Create base element
	 * @constructor
	 * @param {string} name - The element name from template
	 */
	export class SdkElement {
		// geometry
		x: number;
		y: number;
		w: number;
		h: number;
		minW: number;
		minH: number;

		// settings
		eid: number;
		flags: number;
		hidePoints: boolean;
		info: string;
		parent: SDK;
		interfaces: Array<string>;
		img: HTMLImageElement;

		// objects
		props: ElementPropertyList;
		sys: ElementPropertyList;
		points: PointsList;
		pointsEx: PointTemplateList;
		psize: Array<number>;
		hints: Array<PropertyHint>;
		elinkList: Array<SdkElement>;

		// special
		sdk: SDK;

		constructor(public name: string) {
			this.w = this.h = this.minW = this.minH = 32;
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

		d(data): PReader {
			return Object.create(PReader.prototype, {data: {value: data, writable: true}, element: {value: this}});
		}
		
		setSDK(sdk: SDK, x: number, y: number) {
			this.parent = sdk;
			this.x = x;
			this.y = y;
		}

		loadFromTemplate() {
			function loadTemplate(element: SdkElement, tid: string) {
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
		}

		insertInLine(point: Point, pos: PointPosition) {
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
		}
		
		injectElementAtLine(pl1: Point, pl2: Point, pl3: Point, p1: PointPosition) {
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
		}

		place(x, y) { }

		erase () {
			var pta = [null, null, null, null];
			for (let i in this.points) {
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

			if(this.isLink()) {
				for(let i = 0; i < this.elinkList.length; i++) {
					if(this.elinkList[i] === this) {
						this.elinkList.splice(i, 1);
					}
				}
				if(this.elinkList.length == 1) {
					delete this.elinkList[0].elinkList;
				}
			}
		}

		inPoint(x, y): boolean {
			return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h;
		}
		inRect(x1, y1, x2, y2): boolean {
			return !(x2 < this.x || y2 < this.y || x1 > this.x+this.w || y1 > this.y+this.h);
		}

		updateSizes() {
			var width = Math.max(Math.max(this.psize[2], this.psize[3])*7 + POINT_OFF, this.minW);
			this.w = width;
			var height = Math.max(Math.max(this.psize[0], this.psize[1])*7 + POINT_OFF, this.minH);
			this.h = height;
		}

		// mouse operations
		getCursor(x: number, y: number): string { return null; }
		mouseDown(x: number, y: number, button: number, flags: number): boolean { return false; }
		mouseMove(x: number, y: number, state: ElementMouseState) { }
		mouseUp(x, y, button, state: ElementMouseState) { }
		mouseGetPoint(): boolean { return true; }

		// points
		addPoint(name: string, type: number): Point {
			var point = new Point(this, name, type);
			
			this.points[name] = point;
			if(this[name] === undefined) {
				this[name] = point;
			}
			this.psize[type - 1]++;
			this.updateSizes();
			this.rePosPoints();
			
			return point;
		}
		addPointFromTemplate(template: PointTemplate): Point {
			var point = this.addPoint(template.name, template.type);
			point.args = template.args;
			point.inherit = template.inherit;
			return point;
		}
		removePoint(name: string) {
			this.points[name].clear();
			this.psize[this.points[name].type - 1]--;
			if(this[name] instanceof Point) {
				delete this[name];
			}
			delete this.points[name];
			this.updateSizes();
			this.rePosPoints();
		}
		removePoints() {
			for(var i in this.points) {
				delete this[i];
			}
			this.points = {};
			for(var i in this.psize) {
				this.psize[i] = 0;
			}
			this.updateSizes();
		}
		rePosPoints() {
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
		}
		movePointToEnd(name: string) {
			var point = this.points[name];
			delete this.points[name];
			this.points[name] = point;
		}
		findPointByName(name: string): Point {
			return this.points[name];
		}
		getFirstFreePoint(type: number): Point {
			for(var p in this.points) {
				var point = this.points[p];
				if(point.type === type && !point.point) {
					return point;
				}
			}
			return null;
		}
		connectToPoint(point: Point) {
			var fp = this.getFirstFreePoint(point.getPair());
			if(fp) {
				point.connect(fp).createPath();
			}
		}
		getPointInfo(point: Point) {
			return point.inherit + "." + point.name;	
		}
		showDefaultPoint(name: string): Point {
			if(this.pointsEx[name]) {
				return this.addPointFromTemplate(this.pointsEx[name]);
			}
			
			return null;
		}
		getLinkedPoint(point: Point): Point {
			return point;
		}
		calcSide(point: Point): number { return 0; }
		/**
		 * Get a point for the new connection in the editor after dropping
		 */
		getPointToLink(type: number): Point {
			return this.getFirstFreePoint(type);
		}
		/**
		 * Removing the connection between points in the editor
		 */
		clearPoint(point: Point) {
			point.clear();
		}

		// draw
		draw(ctx: CanvasRenderingContext2D) {
			this.drawHints(ctx);
			this.drawBody(ctx);
			this.drawIcon(ctx);
			this.drawPoints(ctx);
		}
		drawBody(ctx: CanvasRenderingContext2D) {
			ctx.strokeStyle = ELEMENT_BORDER_COLOR;
			ctx.fillStyle = this.isSelect() ? ELEMENT_SELECT_COLOR : this.sys.Color.value;
			ctx.fillRect(this.x, this.y, this.w, this.h);
			ctx.strokeRect(this.x, this.y, this.w, this.h);
			
			if(this.isLink()) {
				ctx.fillStyle = this.isMainLink() ? "silver" : "white";
				var size = 4;
				ctx.fillRect(this.x + this.w - size, this.y + this.h - size, size + 1, size + 1);
				ctx.strokeRect(this.x + this.w - size, this.y + this.h - size, size + 1, size + 1);
			}
		}
		drawIcon(ctx: CanvasRenderingContext2D) {
			// firefox fix: +0.5
			ctx.drawImage(this.img, this.x + (this.w - 24)/2 + 0.5, this.y + (this.h - 24)/2 + 0.5);
		}
		drawHints(ctx: CanvasRenderingContext2D) {
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
		}
		drawPoints(ctx: CanvasRenderingContext2D) {
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
		}

		addHint(x: number, y: number, prop: ElementProperty): PropertyHint {
			let h = new PropertyHint(x, y, prop, this);
			this.hints.push(h);
			return h;
		}

		setProperty(name: string, value: any) {
			var prop = this.props[name] || this.sys[name];
			if(!prop)
				console.error("Property", name, "not found.")
			prop.parse(value);
		}

		move(dx: number, dy: number) {
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
		}

		isSelect(): boolean {
			return (this.flags & IS_SELECT) > 0;
		}
		canDelete() {
			return (this.flags & IS_PARENT) === 0 && (this.flags & IS_NODELETE) === 0;
		}
			
		onpropchange(prop) {}

		run(flags: number): UIControl { return null; }
		oninit() {}
		onfree(flags: number) {}
		getChild(): UIContainer { return null; }
		
		onformeditorupdate() {}

		loadFromText(line: string): boolean { return false; };
		save(selection: boolean, tab: string, link: boolean = false): string {
			var text = "Add(" + this.name + "," + this.eid + "," + this.x + "," + this.y + ")\n";
			text += "{\n";
			if(link || this.isLink() && !this.isMainLink())
				text += "  elink(" + (link ? this.eid : this.getMainLink().eid) + ")\n";
			var propPoints = "";
			var pointColors = "";
			var pointInfo = "";
			for (let p in this.props) {
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
				let p = this.points[j];
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
				let p = this.points[j];
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
		}
		saveToText(): string { return ""; }

		initPointHandler(name: string, handler) {
			if(this.points[name]) {
				this.points[name].onevent = handler;
			}
		}

		isLink() { return this.elinkList; };
		isMainLink() { return this.isLink() && this.elinkList[0] === this; };
		getMainLink(): SdkElement { return this.isLink() ? this.elinkList[0] : null; };
		makeMainLink() {
			if(!this.isLink()) {
				this.elinkList = [this];
			}
		}
		makeLink(element: SdkElement) {
			element.makeMainLink();
			this.elinkList = element.elinkList;
			this.elinkList.push(this);
			this.props = element.props;
		}
	}

	function getClass(pack: Pack, id: string): string {
		var template = pack.elements[id];
		if(!template) {
			console.error("Element config not found: ", id);
			return null;
		}
		if(template.class) {
			if(!Hion[template.class])
				console.error("Element class not found: ", template.class);
			return template.class;
		}
		if(template.inherit) {
			return getClass(pack, template.inherit.split(",")[0]);
		}
		return null;
	}

	export function createElement(sdk: SDK, id: string, x: number, y: number) {
		let element = new Hion[getClass(sdk.pack, id) || "SdkElement"](id);
		element.setSDK(sdk, x, y);
		element.loadFromTemplate();
		sdk.pack.initElement(element);
		return element;
	}

	//******************************************************************************
	// HubsEx
	//******************************************************************************

	export class HubsEx extends SdkElement {
		protected pIndex: Array<string>;

		constructor(name) {
			super(name);

			this.hidePoints = true;
			this.w = this.h = this.minH = this.minW = 11;
		}

		mouseGetPoint(): boolean { return this.isSelect(); }
		updateSizes() {}

		loadFromTemplate() {
			super.loadFromTemplate();
			
			this.onpropchange(this.props.Angle);
		}

		connectToPoint(point: Point) {
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
		}

		hubDirection(pp1: PointPosition, pp2: PointPosition, t: number) {
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

		private hx_dirs = [
			[1, 0, 0, 2],
			[1, 0, 2, 0],
			[0, 0, 1, 2],
			[1, 0, 0, 2] ];
			
		insertInLine(point: Point, pos: PointPosition) {
			var i = this.hubDirection(pos, pos.next, this.name === "HubEx" ? 0 : 1);
			var k;
			k = i;

			this.props.Angle.setValue(i);
			var p2 = pos.next;
			var pointOne = this.points[this.pIndex[3]];
			this.injectElementAtLine(point, this.points[ this.pIndex[this.hx_dirs[i][k]] ], pointOne, pos);
			if(pos.x === p2.x)
				this.move(pos.x - pointOne.pos.x, 0);
			else if(pos.y === p2.y)
				this.move(0, pos.y - pointOne.pos.y);
		}

		getLinkedPoint(point: Point): Point {
			var pointOne = this.points[this.pIndex[3]];
			if(point !== pointOne) {
				return pointOne;
			}
			return SdkElement.prototype.getLinkedPoint.call(this, point);
		}
	}

	//------------------------------------------------------------------------------

	export class HubEx extends HubsEx {
		doWork2: Point;
		doWork1: Point;
		doWork3: Point;
		onEvent: Point;

		constructor (name: string) {
			super(name);
			
			this.pIndex = ["doWork1", "doWork2", "doWork3", "onEvent"];
		}

		onpropchange() {
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
		}

		draw(ctx: CanvasRenderingContext2D) {
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
		}

		calcSide(point: Point): number {
			var hs = {doWork1: 0, doWork2: 1, doWork3: 2, onEvent: 3};
			var i = hs[point.name];
			var vals = [[3, 2, 1, 0], [3, 2, 0, 1], [3, 0, 1, 2], [0, 2, 1, 3]];
			return vals[this.props.Angle.value][i];
		}
	}

	export class GetDataEx extends HubsEx {
		Var1: Point;
		Var2: Point;
		Var3: Point;
		Data: Point;

		constructor (name: string) {
			super(name);
			
			this.pIndex = ["Var1", "Var2", "Var3", "Data"];
		}

		onpropchange() {
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
		}

		draw(ctx: CanvasRenderingContext2D) {
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
		}

		calcSide(point: Point): number {
			var hs = {Var1: 0, Var2: 1, Var3: 2, Data: 3};
			var i = hs[point.name];
			var vals = [[2, 1, 0, 3], [2, 1, 3, 0], [2, 3, 0, 1], [3, 1, 0, 2]];
			return vals[this.props.Angle.value][i];
		}
	}

	//******************************************************************************
	// SizeElement
	//******************************************************************************

	export class SizeElement extends SdkElement {
		protected mouseState: number;

		constructor(name: string) { super(name); }

		getState(x, y): number {
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
		}
		mouseDown(x, y, button) {
			var t = this.getState(x, y);
			if(t > 0 && t < 4 || t > 4) {
				this.mouseState = t;
				return true;
			}
			return false;
		}
		mouseMove(x: number, y: number, emouse: ElementMouseState) {
			var deltaX = toStep(emouse.startX - x);
			var deltaY = toStep(emouse.startY - y);
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
		}
		mouseUp(x, y, button, state: ElementMouseState) { this.mouseState = 0; }
		getCursor(x, y) {
			return ["default", "w-resize", "e-resize", "s-resize", "move", "sw-resize", "se-resize"][this.mouseState || this.getState(x, y)];
		}

		onpropchange(prop: ElementProperty) {
			super.onpropchange(prop);
			
			if(prop === this.sys.Width) {
				this.w = prop.value;
			}
			else if(prop === this.sys.Height) {
				this.h = prop.value;
			}
		}
	}

	//******************************************************************************
	// ITElement
	//******************************************************************************

	export class ITElement extends SizeElement {
		constructor(name: string) {
			super(name);
			this.w *= 2;
		}

		private wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): Array<string> {
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

		draw(ctx: CanvasRenderingContext2D) {
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
			
			var lines = this.wrapText(ctx, this.props.Info.value, this.w - 2*offset);
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
		}
		inPoint(x, y) {
			return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h &&
					(x - this.x <= 7 || y - this.y <= 7 || this.x+this.w - x <= 7 || this.y+this.h - y <= 7);
		}
	}

	//******************************************************************************
	// PointHint
	//******************************************************************************

	export class PointHint extends ITElement {
		Data: Point;
		Event: Point;
		Var: Point;
		Method: Point;

		rePosPoints() {
			super.rePosPoints();
			
			if(this.Data) {
				this.Event.pos.y = this.Method.pos.y = this.y + Math.round(this.h/2);
				this.Var.pos.x = this.Data.pos.x = this.x + Math.round(this.w/2);
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
			super.draw(ctx);

			if(this.isSelect())
				super.drawPoints(ctx);
		}
	}

	//******************************************************************************
	// VTElement
	//******************************************************************************

	export class VTElement extends SizeElement {
		constructor(name: string) {
			super(name);
			this.minW = 32;
			this.minH = 18;
		}

		onpropchange(prop: ElementProperty) {
			super.onpropchange(prop);
			
			if(prop === this.sys.Width || prop === this.sys.Height)
				this.rePosPoints();
		}

		draw(ctx: CanvasRenderingContext2D) {
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
		}
	}

	//******************************************************************************
	// LTElement
	//******************************************************************************

	export class LTElement extends SdkElement {
		private needCalcSize: boolean;
		private text: string;
		private link: string;

		constructor (name: string) {
			super(name);
			
			this.h = 18;
			this.needCalcSize = true;
			this.text = "";
			this.link = "";
		}

		loadFromTemplate() {
			super.loadFromTemplate();
			this.onpropchange(this.props.Link);
		}

		onpropchange(prop: ElementProperty) {
			if(prop === this.props.Link) {
				this.needCalcSize = true;
				var args = prop.value.split("=");
				this.text = args[0];
				this.link = args.length == 2 ? args[1] : args[0];
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
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
		}

		mouseDown(x, y, button, flags) {
			if(flags & 0x2) {
				if(this.link.startsWith("multi")) {
					var eid = parseInt(this.link.substr(8));
					var e = this.parent.findElementById(eid);
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
		}
	}

	//******************************************************************************
	// PTElement
	//******************************************************************************

	export class PTElement extends SdkElement {
		private image: HTMLImageElement;
		private loaded: boolean;

		constructor(name: string) {
			super(name);
			this.image = null;
		}

		onpropchange(prop: ElementProperty) {
			if(prop === this.props.Link) {
				//this.needCalcSize = true;
			}
			else if(prop === this.props.PictureURL) {
				this.loaded = false;
				this.image = new Image();
				this.image.onload = () => {
					this.loaded = true;
					this.w = this.image.width;
					this.h = this.image.height;
					this.parent.ondraw();
				};
				this.image.src = prop.value;
			}
		}

		draw(ctx: CanvasRenderingContext2D) {
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
		}

		mouseDown(x, y, button, flags) {
			if(flags & 0x2 && this.props.Link.value) {
				window.open(this.props.Link.value);
				return true;
			}
			return false;
		}
	}

	//******************************************************************************
	// CapElement
	//******************************************************************************

	export class CapElement extends SdkElement {
		protected prop: ElementProperty;
		protected ctx: CanvasRenderingContext2D;

		constructor(name: string) {
			super(name);

			this.h = this.minH = 16;
			this.w = this.minW = 16;
			this.prop = null;
		}

		loadFromTemplate() {
			super.loadFromTemplate();

			for(var p in this.props) {
				var prop = this.props[p];
				if(prop.isDefaultEdit()) {
					this.prop = prop;
					break;
				}
			}
		}

		drawBody(ctx: CanvasRenderingContext2D) {
			if(!this.ctx) {
				this.ctx = ctx;
				this.onpropchange(this.prop);
			}

			super.drawBody(ctx);
		}

		drawIcon(ctx: CanvasRenderingContext2D) {
			ctx.fillStyle = "#000";
			ctx.font = "12px Arial";
			ctx.fillText(this.prop.value, this.x + 8, this.y + 12);
		}

		onpropchange(prop: ElementProperty) {
			if(prop === this.prop && this.ctx) {
				this.ctx.font = "12px Arial";
				var len = this.ctx.measureText(this.prop.value).width;
				this.w = this.minW = len + 16;
				this.rePosPoints();
			}
		}
	}

	//******************************************************************************
	// DPElement
	//******************************************************************************

	interface DPElementPointsMeta {
		index: number;
		pname: string;
	}
	interface DPElementPointsMetaList {
		[key: string]: DPElementPointsMeta;
	}
	export class DPElement extends SdkElement {
		private dyn: DPElementPointsMetaList = {};

		loadFromTemplate() {
			super.loadFromTemplate();
			
			var template = this.parent.pack.elements[this.name];
			while(!template.sub && template.inherit)
				template = this.parent.pack.elements[template.inherit.split(",")[0]];
			var arr = template.sub.split(",");

			for(var i in arr) {
				if(arr[i]) {
					var kv = arr[i].split("|");
					this.dyn[kv[0]] = { index: parseInt(i), pname: kv[1] };
					this.onpropchange(this.props[kv[0]]);
				}
			}
		}

		onpropchange(prop: ElementProperty) {
			var data = this.dyn[prop.name];
			if(data) {
				this.changePoints(prop, data);
				this.rePosPoints();
			}
		}

		getPointInfo(point: Point): string {
			for(var d in this.dyn) {
				if(this.dyn[d] && this.dyn[d].index === point.type-1) {
					return this._getPointInfo(point, this.dyn[d]);
				}
			}
			
			return super.getPointInfo(point);
		}

		protected changePoints(prop: ElementProperty, data: DPElementPointsMeta) {
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
		}

		protected _getPointInfo(point: Point, data: DPElementPointsMeta): string {
			return this.name + "." + data.pname;
		}

		clearPoint(point: Point) {
			super.clearPoint(point);
			
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
		}

		getPointToLink(type): Point {
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
		}
	}

	//******************************************************************************
	// DPLElement
	//******************************************************************************

	export class DPLElement extends DPElement {

		protected changePoints(prop: ElementProperty, data: DPElementPointsMeta) {
			var lines = prop.value.split("\n");
			var hash = {};
			for(var line of lines) {
				if(line) {
					var arr = line.split("=");
					var newPoint = this.points[arr[0]];
					if(newPoint) {
						this.movePointToEnd(arr[0]);
					}
					else {
						newPoint = this.addPoint(arr[0], data.index + 1);
					}
					newPoint._dplInfo = arr[1] || "";
					hash[arr[0]] = true;
				}
			}
			for(var p in this.points) {
				var point = this.points[p];
				if(data.index == point.type-1 && hash[point.name] !== true) {
					delete point._dplInfo;
					this.removePoint(point.name);
				}
			}
			this.rePosPoints();
		}

		protected _getPointInfo(point: Point, data: DPElementPointsMeta): string {
			return point._dplInfo;
		}

		clearPoint(point) {
			SdkElement.prototype.clearPoint.call(this, point);
		}

		getPointToLink(type): Point {
			return SdkElement.prototype.getPointToLink.call(this, type);
		}
	}

	//******************************************************************************
	// Hub
	//******************************************************************************

	export class Hub extends DPElement {
		constructor (name: string) {
			super(name);
			this.w = this.minW = 13;
			this.h = this.minH = 13;
		}

		drawIcon(ctx: CanvasRenderingContext2D) {
			ctx.strokeStyle = "navy";
			var c = this.x + this.w/2 + 0.5;
			ctx.drawLine(c, this.y + POINT_OFF + 3, c, this.y + this.h - POINT_OFF - 1);
			for(var i = 0; i < Math.max(this.props.InCount.value, this.props.OutCount.value); i++) {
				var y = this.y + i*7 + POINT_OFF + 3;
				var x1 = i < this.props.InCount.value ? this.x : c;
				var x2 = i < this.props.OutCount.value ? this.x + this.w : c;
				ctx.drawLine(x1, y, x2, y);
			}
		}
	}

	//******************************************************************************
	// MultiElementEditor
	//******************************************************************************

	export class MultiElementEditor extends SizeElement {
		constructor (name: string) {
			super(name);
			this.flags |= IS_NODELETE;
		}

		inRect() { return false; }

		loadFromTemplate() {
			super.loadFromTemplate();

			this.w = this.sys.Width.value;
			this.h = this.sys.Height.value;
		}

		rePosPoints() {
			super.rePosPoints();

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
		}

		draw(ctx: CanvasRenderingContext2D) {
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
		}

		inPoint(x: number, y: number): boolean {
			return x >= this.x && y >= this.y && x < this.x+this.w && y < this.y+this.h &&
					(x - this.x <= 5 || y - this.y <= 5 || this.x+this.w - x <= 5 || this.y+this.h - y <= 5 || this.getState(x, y) > 0);
		}

		getState(x, y) {
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

			return super.getState(x, y);
		}

		getCursor(x, y): string {
			var index = this.mouseState || this.getState(x, y);
			if(index == 10) {
				return "row-resize";
			}
			if(index == 11) {
				return "col-resize";
			}

			return super.getCursor(x, y);
		}

		mouseMove(x, y, emouse: ElementMouseState) {
			if(this.mouseState == 10) {
				var deltaY = toStep(emouse.startY - y);
				if(deltaY) {
					emouse.startY -= deltaY;
					this.sys.VOffset.value -= deltaY;
					var h = toStep(this.h - Math.max(this.psize[0], this.psize[1])*7);
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
				var deltaX = toStep(emouse.startX - x);
				if(deltaX) {
					emouse.startX -= deltaX;
					this.sys.HOffset.value -= deltaX;
					var w = toStep(this.w - Math.max(this.psize[2], this.psize[3])*7);
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
				super.mouseMove(x, y, emouse);
			}
		}

		addEvent(point: Point, pointParent: Point) {
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
		}

		onpropchange(prop: ElementProperty) {
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
		}

		addPoint(name, type): Point {
			var oldW = this.w;
			var oldH = this.h;
			
			var newType = type < 3 ? 3 - type : 7 - type;
			var point = super.addPoint(name, type);
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
		}

		removePoint(name: string) {
			var oldW = this.w;
			var oldH = this.h;
			
			super.removePoint(name);
			this.parent.parentElement.removePoint(name);
			
			if(this.w < oldW) {
				this.w = oldW;
			}
			if(this.h < oldH) {
				this.h = oldH;
			}
			this.rePosPoints();
		}

		getPointInfo(point) {
			return "";
		}
	}

	//******************************************************************************
	// MultiElementEditorEx
	//******************************************************************************

	export class MultiElementEditorEx extends MultiElementEditor {
		
		onpropchange(prop: ElementProperty) {
			if(prop === this.props.WorkCount || prop === this.props.EventCount || prop === this.props.VarCount || prop === this.props.DataCount) {
				var names = {WorkCount:0, EventCount:1, VarCount:2, DataCount:3};
				var lines = prop.value.split("\n");
				var t = names[prop.name];
				var newType = t < 2 ? 1 - t : 5 - t;
				
				var hash = {};
				for(var line of lines) {
					if(line) {
						var arr = line.split("=");
						var newPoint;
						if(newPoint = this.points[arr[0]]) {
							this.movePointToEnd(arr[0]);
							this.parent.parentElement.movePointToEnd(arr[0]);
						}
						else {
							newPoint = this.addPoint(arr[0], newType+1);
						}
						newPoint._dplInfo = arr[1] || "";
						this.parent.parentElement.points[arr[0]]._dplInfo = newPoint._dplInfo;
						hash[arr[0]] = true;
					}
				}
				for(var p in this.points) {
					var point = this.points[p];
					if(newType == point.type-1 && hash[point.name] !== true) {
						this.removePoint(point.name);
					}
				}
				this.rePosPoints();
				this.parent.parentElement.rePosPoints();
			}
			else {
				super.onpropchange(prop);
			}
		}

		getPointInfo(point: Point) {
			return point._dplInfo || "";
		}

		showDefaultPoint(name): Point {
			if(this.points[name])
				return this.points[name];

			var p = this.pointsEx[name];
			if(p) {
				var newType = p.type < 3 ? 3 - p.type : 7 - p.type;
				return this.addPoint(name, newType);
			}
			
			return null;
		}
	}

	//******************************************************************************
	// MultiElement
	//******************************************************************************

	export class MultiElement extends SdkElement {
		
		protected getEditorName(): string {
			return "MultiElementEditor";
		}

		loadFromTemplate() {
			super.loadFromTemplate();
			
			this.sdk = new SDK(this.parent.pack);
			this.sdk.parent = this.parent;
			this.sdk.parentElement = this;
			var editor = this.getEditorName();
			if(editor) {
				var offset = getOptionInt("opt_multi_offset", 7);
				this.sdk.add(editor, offset, offset);
			}
		}

		makeLink(element: SdkElement) {
			super.makeLink(element);
			
			this.sdk = element.sdk;
			for(var p in element.points) {
				var point = element.points[p];
				this.addPoint(point.name, point.type);
			}
		}

		getPointInfo(point: Point) {
			return "";
		}
	}

	//******************************************************************************
	// MultiElementEx
	//******************************************************************************

	export class MultiElementEx extends MultiElement {
		getEditorName(): string {
			return "MultiElementEditorEx";
		}

		getPointInfo(point: Point) {
			return this.sdk.imgs[0].points[point.name]._dplInfo;
		}
	}

	//******************************************************************************
	// Debug
	//******************************************************************************

	export class Debug extends SdkElement {
		doEvent: Point;
		Var: Point;

		constructor (name: string) {
			super(name);

			this.w = this.minW = 12;
			this.h = this.minH = 12;
		}

		loadFromTemplate() {
			super.loadFromTemplate();

			this.doEvent.onevent = function(data) {
				console.log(this.parent.props.WEName.value, data);
				this.parent.onEvent.call(data);
			};
			this.Var.onevent = function(data) {
				var m = this.parent.Data.point ? this.parent.Data.point.onevent(data) : "";
				console.log(this.parent.props.VDName.value, m);
				return m;
			};
		}

		draw(ctx: CanvasRenderingContext2D) {
			ctx.fillStyle = this.isSelect() ? "#800" : "red";
			ctx.strokeStyle = "gray";
			var radius = this.w/2;
			ctx.beginPath();
			ctx.arc(this.x + radius, this.y + radius, radius, 0, 2*Math.PI);
			ctx.fill();
			ctx.stroke();
		}
	}

	//******************************************************************************
	// CableElement
	//******************************************************************************

	export class CableElement extends DPLElement {
		constructor(name: string) {
			super(name);
			this.w = this.minW = 13;
			this.minH = 13;
		}

		addPoint(name: string, type: number): Point {
			var point = super.addPoint(name, type);
			
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
		}

		isWE(){
			return this.points.doCable || this.points.onCable;
		}

		drawPoints(ctx: CanvasRenderingContext2D) {
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
		}

		drawIcon(ctx: CanvasRenderingContext2D) {
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
		}

		drawBody(ctx: CanvasRenderingContext2D) {
			if(this.isSelect()) {
				ctx.save();
				ctx.setLineDash([3,3]);
				ctx.rect(this.x-1, this.y-1, this.w+1, this.h+1);
				ctx.strokeStyle = "#000";
				ctx.strokeRect(this.x, this.y, this.w, this.h);
				ctx.restore();
			}
		}
	}
	//******************************************************************************
	// LineBreak
	//******************************************************************************

	export class LineBreak extends CapElement {
		private primary: LineBreak;
		private second: LineBreak;

		loadFromTemplate() {
			super.loadFromTemplate();
			this.onpropchange(this.props.Type);
		}

		onpropchange(prop: ElementProperty) {
			super.onpropchange(prop);
			
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
		}

		setPrimary(element: LineBreak) {
			this.primary = element;
			this.onpropchange(this.props.Type);
		}

		place(x, y) {
			super.place.call(x, y);
			
			this.second = this.parent.add(this.name, toStep(x + 7*5), toStep(y)) as LineBreak;
			this.second.setPrimary(this);
		}

		erase() {
			super.erase();
			
			if(this.second && !this.second.isSelect()) {
				this.second.primary = null;
				this.parent.deleteElementById(this.second.eid);
			}
			else if(this.primary && !this.primary.isSelect()) {
				this.primary.second = null;
				this.parent.deleteElementById(this.primary.eid);
			}
		}

		save(selection: boolean, tab: string, link: boolean = false): string {
			if(this.primary || !selection || this.second.isSelect()) {
				return super.save(selection, tab, link);
			}
			else {
				return this.second.save(selection, tab);
			}
		}

		saveToText(): string {
			var text = super.saveToText();
			if(this.primary) {
				text += "  Primary=[" + this.primary.eid + "," + (this.primary.x - this.x) + "," + (this.primary.y - this.y) + "]\n";
			}
			return text;
		}

		loadFromText(line: string): boolean {
			if(line.substr(0, 7) == "Primary") {
				var data = line.substr(9, line.length - 10);
				var arr = data.split(",");
				var e = this.parent.findElementById(parseInt(arr[0]));
				if(!e) {
					e = this.parent.add(this.name, this.x + parseInt(arr[1]), this.y + parseInt(arr[2]));
					e.eid = parseInt(arr[0]);
					e.props.Caption.value = this.props.Caption.value;
				}
				(e as LineBreak).second = this;
				this.setPrimary(e as LineBreak);
				return true;
			}
			return super.loadFromText(line);
		}

		drawBody(ctx: CanvasRenderingContext2D) {
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
				super.drawBody(ctx);
			}
		}

		getFirstFreePoint(type): Point {
			if(this.second) {
				if(this.props.Type.isDef() && type == pt_event || !this.props.Type.isDef() && type == pt_data)
					return this.second.getFirstFreePoint(type);
			}
			
			return super.getFirstFreePoint(type);
		}

		getLinkedPoint(point: Point): Point {
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
			
			return super.getLinkedPoint(point);
		}
	}

	//******************************************************************************
	// LineBreakEx
	//******************************************************************************

	export class LineBreakEx extends CapElement {
		private pair: SdkElement;
		
		onpropchange(prop: ElementProperty) {
			super.onpropchange(prop);
			
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
		}

		loadFromTemplate() {
			super.loadFromTemplate();
			this.onpropchange(this.props.Type);
		}

		oninit() {
			if(this.props.Type.value % 2 == 0) {
				var prop = this.props.Type.value == 0 ? 1 : 3;
				for(var e of this.parent.imgs) {
					if(e.name == this.name && e.props.Type.value == prop && e.props.Caption.value == this.props.Caption.value) {
						this.pair = e;
						break;
					}
				}
			}
		}

		getLinkedPoint(point) {
			if(this.props.Type.value % 2 == 0) {
				var prop = this.props.Type.value == 0 ? 1 : 3;
				for(var e of this.parent.imgs) {
					if(e.name == this.name && e.props.Type.value == prop && e.props.Caption.value == this.props.Caption.value) {
						return e.points[prop == 1 ? "onEvent" : "_Data"].point;
					}
				}
			}
			
			return super.getLinkedPoint(point);
		}
	}

	//******************************************************************************
	// Version
	//******************************************************************************

	export class Version extends SdkElement {
		
	}

	//******************************************************************************
	// IfElse
	//******************************************************************************

	export class IfElse extends SdkElement {

		drawIcon(ctx: CanvasRenderingContext2D) {
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
		}
	}

	//******************************************************************************
	// WinElement
	//******************************************************************************

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
	export class WinElement extends SdkElement {
		ctl: UIControl;

		doVisible: Point;
		doEnabled: Point;
		doScrollByX: Point;
		doScrollByY: Point;
		onDblClick: Point;
		onFocus: Point;
		onBlur: Point;
		onKeyDown: Point;
		onKeyPress: Point;
		onKeyUp: Point;
		onMouseDown: Point;
		onMouseUp: Point;
		onMouseMove: Point;
		onMouseOut: Point;
		onMouseOver: Point;
		onMouseWheel: Point;
		onContextMenu: Point;
		HTMLElement: Point;

		place(x, y) {
			super.place(x, y);
			
			this.props.Left.value = this.x;
			this.props.Top.value = this.y;
		}

		addPoint(name: string, type: number): Point {
			var point = super.addPoint(name, type);
			point.onevent = _winelement_dmap[name];
			return point;
		}

		run(flags: number): UIControl {
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
			if(this.props.Visible.value === 0 && (flags & FLAG_USE_EDIT) === 0) {
				ctl.hide();
			}
			
			// layer
			var layoutOpt: ElementLayoutOptions = {};
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
		}

		oninit() {
			if(!this.props.Edge.isDef()) {
				new Splitter({manage: this.ctl, edge: this.props.Edge.value, size: this.props.SplitterSize.value});
			}
		}
	}

	export class WinContainer extends WinElement {
		
		getLayoutOptions(): LayoutOptions {
			var options: LayoutOptions = {};
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
		}

		getLayout(parent: UIControl) {
			switch(this.props.Layout.value) {
				case 0: return new FixLayout(parent);
				case 1: return new HLayout(parent, this.getLayoutOptions());
				case 2: return new VLayout(parent, this.getLayoutOptions());
			}
		}
	}
}