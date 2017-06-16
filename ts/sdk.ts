namespace Hion {
	/** Run flags */
	export const FLAG_USE_RUN  = 0x01;
	export const FLAG_USE_EDIT = 0x02;
	export const FLAG_USE_CHILD= 0x04;

	/** Howto sha paste to sdk */
	export const SDK_PARSE_FILE = 0x01;
	export const SDK_PARSE_PASTE = 0x02;

	/** Object types */
	export const OBJ_TYPE_ELEMENT	= 1;
	export const OBJ_TYPE_POINT		= 2;
	export const OBJ_TYPE_LINE		= 3;
	export const OBJ_TYPE_LINEPOINT	= 4;
	export const OBJ_TYPE_HINT		= 5;

	function Test(v1: number, v2: number, tp: number) {
		if(v2 < v1)
			return (v2-4 < tp) && (tp < v1+4);
		return (v1-4 < tp) && (tp < v2+4);
	}

	function isLine(x: number, y: number, lx1: number, ly1: number, lx2: number, ly2: number) {
		if( Test(lx1,lx2,x) && Test(ly1,ly2,y) ) {
			var p = ly2 - ly1;
			var k = lx2 - lx1;
			var C = ly1*k - lx1*p;
			return Math.abs(p*x - k*y + C);
		}
		else
			return 500;
	}

	export class SDK {
		imgs: SdkElement[] = [];
		buildCounter: number = 0;
		selMan: SelectManager;
		parent: SDK;
		parentElement: SdkElement;
		scrollX: number;
		scrollY: number;
		undo: UndoManager;
		
		ondraw = () => {};
		onaddelement = (element: SdkElement) => {};
		onremoveelement = (element: SdkElement) => {};

		constructor(public pack: Pack) {
			this.selMan = new SelectManager(this);
			this.resetID();
		}
		
		deleteElement(index: number) {
			let e = this.imgs.splice(index, 1);
			e[0].erase();
			this.onremoveelement(e[0]);
		}
		deleteElementById(eid: number) {
			for(let i = 0; i < this.imgs.length; i++) {
				if(this.imgs[i].eid === eid) {
					this.deleteElement(i);
					break;
				}
			}
		}

		linebypos(p, x: number, y: number) {
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
		}

		getElementById(id: string): SdkElement {
			for(let e of this.imgs) {
				if(e.name === id) {
					return e;
				}
			}
			return null;
		}

		findElementById(eid: number): SdkElement {
			for (let e of this.imgs) {
				if (e.eid === eid)
					return e;
			}
			return null;
		}

		getObjectAtPos(x: number, y: number) {
			for (let i = this.imgs.length - 1; i >= 0; i--) {
				let element = this.imgs[i];
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
		}

		draw(ctx: CanvasRenderingContext2D) {
			//links
			for (var e of this.imgs) {
				for (var i in e.points) {
					var p = e.points[i];
					if (p.type % 2 === 0 && p.point) {
						if(p.selected || p.point.selected) {
							ctx.lineWidth = 2;
						}
						ctx.strokeStyle = p.getColor();
						ctx.beginPath();
						ctx.moveTo(p.pos.x, p.pos.y);
						let n = p.pos.next;
						while (n) {
							ctx.lineTo(n.x, n.y);
							n = n.next;
						}
						ctx.stroke();
						if(p.selected || p.point.selected) {
							ctx.lineWidth = 1;
						}
						
						if(p.info) {
							ctx.font = "9px monospace";
							var lines = p.info.text.split("\n");
							var wl = [];
							var maxW = 0;
							if(p.info.wl) {
								wl = p.info.wl;
								maxW = p.info.maxW;
							}
							else {
								for(var line of lines) {
									var m = ctx.measureText(line);
									wl.push(m.width);
									if(m.width > maxW)
										maxW = m.width;
								}
								p.info.wl = wl;
								p.info.maxW = maxW;
							}
							let n = p.pos;
							do {
								var delta = Math.abs(n.next.x - n.x);
								if(maxW + 4 < delta) {
									var y = n.y;
									for(var l in lines) {
										var x = Math.min(n.next.x, n.x);
										if(p.info.direction == 1) {
											x += delta/2 - wl[l]/2;
										}
										else if(p.info.direction == 2) {
											x += delta - wl[l] - 4;
										}
										ctx.fillStyle = "white";
										ctx.fillRect(x + 2, y - 9, wl[l], 8);
										ctx.fillStyle = "black";
										ctx.fillText(lines[l], x + 2, y - 2);
										y += 10;
									}
									break;
								}
								n = n.next
							} while(n.next);
						}
					}
				}
			}

			//elements
			for (var e of this.imgs) {
				e.draw(ctx);
			}
		}

		clearProject() {
			this.imgs = new Array();
			this.add(this.pack.projects[0], 56, 56);
		}
		
		getRootSDK(): MSDK {
			let sdk: SDK = this;
			while(sdk.parent) {
				sdk = sdk.parent;
			}
			return sdk as MSDK;
		}

		getNextID(): number {
			return this.getRootSDK().eids++;
		}

		getCurrentID() {
			return this.getRootSDK().eids;
		}

		resetID() {
			this.setID(1);
		}

		setID(value: number) {
			this.getRootSDK().eids = value;
		}

		add(id: string, x: number, y: number): SdkElement {
			var e = createElement(this, this.pack.mapElementName(id), x, y);
			e.eid = this.getNextID();
			this.imgs.push(e);
			this.onaddelement(e);
			return e;
		}
		
		save(selection: boolean = false): string {
			var savePart = this.parent || selection;
			var text = savePart ? "" : "Make(" + this.pack.name + ")\n";
			if(this.buildCounter && !savePart)
				text += "Build(" + this.buildCounter + ")\n";
			for (var e of this.imgs) {
				if(selection && !e.isSelect()) {
					continue;
				}
				text += e.save(selection, "");
			}
			return text;
		}

		saveLink(): string {
			var e = this.selMan.items[0];
			var text = (e.getMainLink() || e).save(true, "", true);
			return text;
		}

		load(text: string, start?: number, flags?: number): number {
			var arr = text.split("\r\n"); // opera like...
			if (arr.length < 2)
				arr = text.split("\n");
			var links = [];
			var pointColors = [];
			var pointInfo = [];
			var e = null;
			var index = start ? start : 0;

			var replacedIDS = {};
			var _sdk = this;
			function getElementById(id) {
				return flags & SDK_PARSE_PASTE ? replacedIDS[id] : _sdk.findElementById(id);
			}

			if(index === 0 && (flags & SDK_PARSE_FILE)) {
				this.resetID();
			}
			
			for (; index < arr.length; index++) {
				var line = arr[index].trim();
				if (line.length === 0)
					continue;

				if (line.substr(0, 5) === "Make(") {
					var packName = line.substr(5, line.length - 6);
					//----------------- TEMP
					if(packName == "base")
						packName = "webapp";
					//---------------------
					this.pack = packMan.getPack(packName);
					if(!this.pack)
						console.error("Pack", packName, "not found!")
				} else if (line.startsWith("Build(")) {
					this.buildCounter = parseInt(line.substr(6, line.length - 7));
				} else if (line.substr(0, 4) === "Add(") {
					var l = line.substr(4, line.length - 5).split(",");
					var isEntry = this.pack.isEntry(l[0]);
					if (isEntry && this.imgs.length && this.imgs[0].name === l[0]) {
						e = this.imgs[0];
						e.move(parseInt(l[2]) - e.x, parseInt(l[3]) - e.y);
					} else {
						e = this.add(l[0], parseInt(l[2]), parseInt(l[3]));
						if(isEntry && !this.parent)
							e.flags |= IS_PARENT;
					}
					if(flags & SDK_PARSE_PASTE)
						replacedIDS[parseInt(l[1])] = e;
					else {
						e.eid = parseInt(l[1]);
						if (e.eid >= this.getCurrentID())
							this.setID(e.eid + 1);
					}
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
					index = e.sdk.load(text, index + 1, flags);
					e.sdk.imgs[0].parentElement = e;
				} else if (line === "END_SDK") {
					break;
				} else if(line.substr(0, 1) === "@") {
					var pSys = line.substr(1, line.length - 1).split("=");
					var name = pSys[0];
					// support hiasm4
					if(name == "Hint")
						name = "Comment";
					
					if(e.sys[name])
						e.sys[name].parse(pSys[1]);
					else
						printError("System property not found: " + name + ", " + line);
				} else if(line.substr(0, 7) === "AddHint") {
					var name = line.substr(8, line.length - 9);
					var hintParams = name.split(",");
					var propName = hintParams[4];
					
					// support hiasm4
					if(propName === "@Hint")
						propName = "@Comment";
						
					var prop = propName.startsWith("@") ? e.sys[propName.substr(1)] : e.props[propName];
					e.addHint(parseInt(hintParams[0]), parseInt(hintParams[1]), prop);
				} else if(line.substr(0, 5) === "Point") {
					var name = line.substr(6, line.length - 7);
					
					if(!e.showDefaultPoint(name)) {
						e.addPoint(name, pt_work);
					}
				} else if(line.startsWith("PColor")) {
					var val = line.substr(7, line.length - 8);
					var i = val.indexOf(",");
					pointColors.push({name: val.substr(0, i), color: val.substr(i+1), element: e})
				} else if(line.startsWith("PInfo")) {
					var val = line.substr(6, line.length - 7);
					var i = val.indexOf(",");
					pointInfo.push({name: val.substr(0, i), direction: val.substr(i+1, 1), text: val.substr(i+3).replace("\\n", "\n"), element: e})
				} else if(line.startsWith("elink")) {
					var eid = parseInt(line.substr(6, line.length - 7));
					var le = this.findElementById(eid);
					e.makeLink(le);
				} else if (e) {
					var ind = line.indexOf("=");
					var name = line.substr(0, ind).trim();
					if (e.props[name]) {
						e.props[name].parse(line.substr(ind+1));
					}
					else if(e.loadFromText(line)) {
						// do nothing
					}
					else {
						// hiasm 4 support
						if(e.sys[name])
							e.sys[name].parse(line.substr(ind+1));
						else {
							printError("Property not found: " + name + ", " + line);
							console.log("Property not found:", name, e.name)
						}
					}
				}
			}
			// restore links
			for (let i in links) {
				var e1 = links[i].srce;
				var e2 = getElementById(links[i].dste);
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
			
			// restore point colors
			for(var rec of pointColors) {
				if(rec.element.points[rec.name]) {
					if(rec.color.charAt(0) >= '0' && rec.color.charAt(0) <= '9') {
						var v = parseInt(rec.color);
						rec.color = 'rgb(' + (v & 0xff) + ',' + ((v >> 8) & 0xff) + ',' + (v >> 16) + ')';
					}
					rec.element.points[rec.name].color = rec.color;
				}
				else {
					console.log("Point for color", rec.name, "not found", rec.element.name);
				}
			}
			// restore point info
			for(var rec of pointInfo) {
				if(rec.element.points[rec.name]) {
					rec.element.points[rec.name].info = {text: rec.text, direction: rec.direction};
				}
				else {
					console.log("Point for info", rec.name, "not found", rec.element.name);
				}
			}
			
			return index;
		}
		
		run(flags: number): UIContainer {
			var prn: SdkElement = null;
			for(var i of this.imgs) {
				if(i.flags & IS_PARENT) {
					prn = i;
					break;
				}
			}
			var parent: UIContainer = null;
			if(prn) {
				parent = prn.run(flags) as UIContainer;
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
				if(e !== prn)
					e.oninit();
			}
			if(prn)
				prn.oninit();
			return prn ? prn.getChild() : parent;
		}
		
		stop(flags) {
			for(var e of this.imgs) {
				e.onfree(flags);
			}
		}

		getParams(): Rect {
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
			
			return new Rect(minX, minY, maxX, maxY);
		}

		indexOf(element: SdkElement): number {
			for(var i = 0; i < this.imgs.length; i++) {
				if(this.imgs[i] === element) {
					return i;
				}
			}
			
			return -1;
		}
	}

	interface SdkElementList {
		[uid: number]: SdkElement;
	}
	class SDKLib {
		items:SdkElementList;

		add(element) {
			this.items[element.eid] = element;
		}

		getElementById(eid): SdkElement {
			return this.items[eid];
		}

		remove(element) {
			delete this.items[element.eid];
		}
	}

	export class MSDK extends SDK {
		sdkLib: SDKLib;
		eids: number;
		fileName: string;

		constructor(pack: Pack) {
			super(pack);
			this.sdkLib = new SDKLib();
			this.eids = 0;
		}
	}
}