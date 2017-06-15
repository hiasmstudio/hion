namespace Hion {
	const UNDO_ADD_ELEMENT = 1;
	const UNDO_DEL_ELEMENT = 2;
	const UNDO_MOVE_ELEMENT = 3;
	const UNDO_LINK = 4;
	const UNDO_DEL_LINK = 5;
	const UNDO_CHANGE_LINK = 6;
	const UNDO_ADD_LINK_POINT = 7;
	const UNDO_DEL_LINK_POINT = 8;

	const UCMD_ADD_ELEMENT = 1;
	const UCMD_DEL_ELEMENT = 2;
	const UCMD_LOAD_FROM_TEXT = 3;
	const UCMD_DEL_ELEMENTS = 4;
	const UCMD_MOVE_ELEMENTS = 5;
	const UCMD_DEL_LINK = 6;
	const UCMD_ADD_LINK = 7;
	const UCMD_LINK_PATH = 8;

	interface UndoRecord {
		type: number;
		id?: number;
		id1?: number;
		id2?: number;
		ids?: Array<number>;
		name?: string;
		x?: number;
		y?: number;
		dx?: number;
		dy?: number;
		point?: string;
		point1?: string;
		point2?: string;
		nodes?: Array<Position2D>;
		data?: any;
	}
	interface HistoryRecord {
		type: number;
		undo: Array<UndoRecord>;
		redo: Array<UndoRecord>;
	}

	export class UndoManager {
		private index: number;
		private items: Array<HistoryRecord>;
		private enabled: boolean;
		private data: any;
		// private handlers: Array<(obj: UndoRecord) => void>;

		constructor (public sdk: SDK) {
			this.items = [];
			this.index = -1;
			this.enabled = true;
		}

		canUndo(): boolean {
			return this.index >= 0;
		}

		canRedo(): boolean {
			return this.index < this.items.length-1;
		}

		private _exec(obj: UndoRecord) {
			switch(obj.type) {
				case UCMD_DEL_ELEMENT:
					this.sdk.deleteElementById(obj.id);
					break;
				case UCMD_ADD_ELEMENT:
					let e = this.sdk.add(obj.name, obj.x, obj.y);
					e.eid = obj.id;
					break;
				case UCMD_LOAD_FROM_TEXT:
					let eid = this.sdk.getCurrentID();
					this.sdk.load(obj.data, 0, 0);
					this.sdk.setID(eid);
					break;
				case UCMD_DEL_ELEMENTS:
					for(let id of obj.ids) {
						this.sdk.deleteElementById(id);
					}
					break;
				case UCMD_MOVE_ELEMENTS:
					this.sdk.selMan.clear();
					for(let id of obj.ids) {
						this.sdk.selMan.add(this.sdk.findElementById(id));
					}
					this.sdk.selMan.move(-obj.dx, -obj.dy);
					break;
				case UCMD_DEL_LINK: {
					let e = this.sdk.findElementById(obj.id);
					if(e) {
						e.points[obj.point].clear();
					}
					break;
				}
				case UCMD_ADD_LINK:
					let e1 = this.sdk.findElementById(obj.id1);
					let e2 = this.sdk.findElementById(obj.id2);
					if(e1 && e2) {
						e1.points[obj.point1].clear();
						e1.points[obj.point1].connect(e2.points[obj.point2]);
					}
					break;
				case UCMD_LINK_PATH: {
					let e = this.sdk.findElementById(obj.id);
					if(e) {
						e.points[obj.point].clearPath();
						let pp = e.points[obj.point].pos;
						for(let n of obj.nodes) {
							pp = Hion.addLinePoint(pp, n.x, n.y);
						}
					}
					break;
				}
			}
		}

		undo() {
			if(this.canUndo()) {
				for(var cmd of this.items[this.index].undo) {
					this._exec(cmd);
				}
				this.index--;
			}
		}

		redo() {
			if(this.canRedo()) {
				this.index++;
				for(var cmd of this.items[this.index].redo) {
					this._exec(cmd);
				}
			}
		}

		private _prepare() {
			if(this.index < this.items.length-1) {
				this.items.splice(this.index+1, this.items.length - this.index);
			}
		}

		private _add(type: number, undo: Array<UndoRecord>, redo: Array<UndoRecord>) {
			this._prepare();
			this.items.push({type:type, undo: undo, redo: redo});
			this.index ++;
		}

		addElement(element: SdkElement) {
			this._add(
				UNDO_ADD_ELEMENT,
				[{type: UCMD_DEL_ELEMENT, id: element.eid}],
				[{type: UCMD_ADD_ELEMENT, id: element.eid, name: element.name, x:element.x, y:element.y}]
			);
		}

		delElement(selMan: SelectManager) {
			var ids = [];
			var savedLinks: Array<UndoRecord> = [{type: UCMD_LOAD_FROM_TEXT, data: this.sdk.save(true)}];
			selMan.eath(function(e){
				ids.push(e.eid);
				for(var i in e.points) {
					var point = e.points[i];
					if(!point.isFree() && !point.point.parent.isSelect()) {
						var p = point.isPrimary() ? point : point.point;
						savedLinks.push({type: UCMD_ADD_LINK, id1: p.parent.eid, point1: p.name, id2: p.point.parent.eid, point2: p.point.name});
						savedLinks.push({type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()});
					}
				}
			});
			this._add(
				UNDO_DEL_ELEMENT,
				savedLinks,
				[{type: UCMD_DEL_ELEMENTS, ids: ids}]
			);
		}

		makeLink(point: Point) {
			var p = point.isPrimary() ? point : point.point;
			this._add(
				UNDO_LINK,
				[{type: UCMD_DEL_LINK, id: p.parent.eid, point: p.name}],
				[{type: UCMD_ADD_LINK, id1: p.parent.eid, point1: p.name, id2: p.point.parent.eid, point2: p.point.name}]
			);
		}

		delLink(point: Point) {
			if(!point.isFree()) {
				var p = point.isPrimary() ? point : point.point;
				this._add(
					UNDO_DEL_LINK,
					[
						{type: UCMD_ADD_LINK, id1: p.parent.eid, point1: p.name, id2: p.point.parent.eid, point2: p.point.name},
						{type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()}
					],
					[{type: UCMD_DEL_LINK, id: p.parent.eid, point: p.name}]
				);
			}
		}

		moveElementsBegin(selMan: SelectManager) {
			var data = [];
			selMan.eath(function(e){
				for(var i in e.points) {
					var point = e.points[i];
					if(!point.isFree() && !point.point.parent.isSelect()) {
						var p = point.isPrimary() ? point : point.point;
						data.push({type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()});
					}
				}
			});
			this.data = {data: data, sx: selMan.items[0].x, sy: selMan.items[0].y};
		}

		moveElementsEnd(selMan: SelectManager) {
			var dx = this.data.sx - selMan.items[0].x;
			var dy = this.data.sy - selMan.items[0].y;
			
			if(dx || dy) {
				var ids = [];
				var savedLinks: Array<UndoRecord> = [{type: UCMD_MOVE_ELEMENTS, ids: ids, dx: dx, dy: dy}];
				selMan.eath(function(e){
					ids.push(e.eid);
					for(var i in e.points) {
						var point = e.points[i];
						if(!point.isFree() && !point.point.parent.isSelect()) {
							var p = point.isPrimary() ? point : point.point;
							savedLinks.push({type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()});
						}
					}
				});
				
				this._add(
					UNDO_MOVE_ELEMENT,
					[{type: UCMD_MOVE_ELEMENTS, ids: ids, dx: -dx, dy: -dy}].concat(this.data.data),
					savedLinks
				);
			}
		}

		changeLinkBegin(point: Point) {
			var p = point.isPrimary() ? point : point.point;
			this._add(
				UNDO_CHANGE_LINK,
				[{type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()}],
				null
			);
			this.data = p;
		}

		changeLinkEnd(point: Point) {
			var p = this.data;
			this.items[this.index].redo = [{type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()}];
		}
	}
}