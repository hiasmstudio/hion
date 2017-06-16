namespace Hion {
	export class Rect {
		constructor(public x1: number, public y1: number, public x2: number, public y2: number) {}
		width(): number {
			return this.x2 - this.x1;
		}
		height(): number {
			return this.y2 - this.y1;
		}
	}

	export class SelectManager { 
		items:SdkElement[] = [];
		selectEvent: boolean = true;
		onselect = () => {};

		constructor (public sdk: SDK) {}

		doSelect() {
			if(this.selectEvent) {
				this.onselect();
			}
		}

		beginSelect() {
			this.selectEvent = false;
		}
		
		endSelect() {
			this.selectEvent = true;
			this.doSelect();
		}

		add(e: SdkElement) {
			this.items.push(e);
			e.flags |= IS_SELECT;
			this.doSelect();
		}
		
		select(e: SdkElement) {
			this.beginSelect();
			this.clear();
			this.add(e);
			this.endSelect();
		}

		unselect = function(e: SdkElement) {
			for(let i in this.items) {
				if(this.items[i] === e) {
					e.flags ^= IS_SELECT;
					this.items.splice(i, 1);
					this.doSelect();
					break;
				}
			}
		}

		selRect(ox1: number, oy1: number, ox2: number, oy2: number) {
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
		}
		
		selectAll() {
			this.beginSelect();
			this.clear();
			for(let e of this.sdk.imgs) {
				this.add(e);
			}
			this.endSelect();
		}

		clear() {
			for(let e of this.items)
				e.flags ^= IS_SELECT;
			this.items = [];
			this.doSelect();
		}

		setProp(name: string, value: any) {
			for(let e of this.items)
				e.setProperty(name, value);
		}

		changePoint(name: string, checked: boolean) {
			let pName = "do" + name;
			for(let e of this.items) {
				if(checked && !e.points[pName]) {
					e.addPoint(pName, pt_work);
				}
				else {
					if(e.points[pName]) {
						e.removePoint(pName);
					}
				}
			}
		}

		move(dx: number, dy: number) {
			for(let e of this.items) {
				e.move(dx, dy);
			}
		}

		erase() {
			for(let e of this.items) {
				if(e.canDelete()) {
					for(var j = 0; j < this.sdk.imgs.length; j++) {
						if(e === this.sdk.imgs[j]) {
							this.sdk.deleteElement(j);
							break;
						}
					}
				}
				else {
					e.flags ^= IS_SELECT;
				}
			}
			this.items = [];
			this.doSelect();
		}

		isEmpty(): boolean {
			return this.items.length === 0;
		}

		size(): number {
			return this.items.length;
		}

		eath = function(callback: (element: SdkElement) => void) {
			for(let e of this.items) {
				callback(e);
			}
		}

		normalizePosition() {
			let minX = 0, minY = 0;
			for(let e of this.items) {
				if(e.x < minX) {
					minX = e.x;
				}
				if(e.y < minY) {
					minY = e.y;
				}
			}
			
			if(minX || minY) {
				this.move(-minX + POINT_SPACE, -minY + POINT_SPACE);
			}
		}

		normalizeLinks() {
			for(let e of this.items) {
				for(var p in e.points) {
					var point = e.points[p];
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
		}

		getRect(): Rect {
			var minX = 32768;
			var minY = 32768;
			var maxX = -32768;
			var maxY = -32768;
			for(var item of this.items) {
				if(item.x < minX) minX = item.x;
				if(item.y < minY) minY = item.y;
				if(item.x + item.w > maxX) maxX = item.x + item.w;
				if(item.y + item.h > maxY) maxY = item.y + item.h;
			}
			
			return new Rect(minX, minY, maxX, maxY);
		}
	}
}