namespace Hion {
	
	export const ME_NONE       		= 0;  // no operation
	export const ME_ELEMENT			= 1;  // move element
	export const ME_POINTLINK			= 2;  // link two points
	export const ME_ADDELEMENT			= 3;  // create new element
	export const ME_SELRECT			= 4;  // select elements
	export const ME_LINEPOINT			= 5;  // move point of line
	export const ME_SLIDE_DOWN			= 6;  // select elements after horizont line
	export const ME_SLIDE_RIGHT		= 7;  // select elements after horizont line
	export const ME_ELEMENT_MOUSE		= 8;  // handle by element
	export const ME_MAKE_LH			= 9;  // make link hint
	export const ME_REMOVE_LH			= 10; // remove link hint
	export const ME_MOVE_LH			= 11; // move link hint
	export const ME_ADDELEMENT_POINT	= 12; // add new element and link with point
	export const ME_POPUP_MENU			= 13; // show popup menu
	export const ME_SCROLL_EDITOR		= 14; // change scroll bars positions
	export const ME_SCALE_EDITOR		= 15; // change editor scale factor

	export const enum PopupMenuType {
		POPUP_MENU_ELEMENT,
		POPUP_MENU_SDK,
		POPUP_MENU_HINT_LINK,
		POPUP_MENU_LINE
	}

	interface MouseState {
		obj: any;
		sobj: any;
	}
	interface PasteObject {
		point: Point;
		obj: PointPosition;
	}

	class MouseOperation {
		static startX: number;
		static startY: number;
		static curX: number;
		static curY: number;

		constructor (protected editor: SdkEditor) {}
		moveCursorStart(x: number, y: number) {
			MouseOperation.startX = x;
			MouseOperation.startY = y;
			this.moveCursor(x, y);
		}
		moveCursor(x: number, y: number) {
			MouseOperation.curX = x;
			MouseOperation.curY = y;
		}
		begin() {}
		down(x: number, y: number, button: number, obj, flags: number) {}
		move(x: number, y: number, obj) {}
		up(x: number, y: number, button: number, obj, flags: number) { return true; }
		cursor(x: number, y: number, obj) { return ""; }
		draw(ctx: CanvasRenderingContext2D) {}
	}

	class MouseOperationNone extends MouseOperation {
		down(x, y, button, obj, flags) {
			if(button === 1) {
				this.editor.beginOperation(ME_SCROLL_EDITOR, null);
			}
			else if (obj) {
				switch (obj.type) {
					case OBJ_TYPE_ELEMENT:
						if(obj.obj.mouseDown(x, y, button, flags)) {
							this.editor.beginOperation(ME_ELEMENT_MOUSE, obj.obj);
						}
						else {
							if(!obj.obj.isSelect()) {
								this.editor.sdk.selMan.select(obj.obj);
							}
							if(button === 0) {
								this.editor.beginOperation(ME_ELEMENT, obj.obj);
							}
							else if(button === 2) {
								this.editor.beginOperation(ME_POPUP_MENU, obj);
							}
						}
						break;
					case OBJ_TYPE_POINT:
						if(button === 2) {
							if(this.editor.sdk.undo) {
								this.editor.sdk.undo.delLink(obj.obj);
							}
							obj.obj.clear();
							this.editor.onsdkchange();
						}
						else {
							var o = obj.obj;
							if (o.point) {
								var p = o.point;
								o = p;
								if(this.editor.sdk.undo) {
									this.editor.sdk.undo.delLink(obj.obj);
								}
								obj.obj.parent.clearPoint(obj.obj);
							}
							this.moveCursorStart(o.pos.x, o.pos.y);
							this.moveCursor(x, y);
							this.editor.beginOperation(ME_POINTLINK, o);
						}
						break;
					case OBJ_TYPE_LINE:
						if (button === 0) {
							if(this.editor.sdk.undo) {
								this.editor.sdk.undo.changeLinkBegin(obj.point);
							}
							obj.obj.next = {x: x, y: y, next: obj.obj.next, prev: obj.obj};
							obj.obj.next.next.prev = obj.obj.next;
							this.editor.beginOperation(ME_LINEPOINT, obj.obj.next);
						}
						else if (button === 2) {
							this.editor.beginOperation(ME_POPUP_MENU, obj);
						}
						break;
					case OBJ_TYPE_LINEPOINT:
						if (button === 0) {
							this.editor.beginOperation(ME_LINEPOINT, obj.obj);
							if(this.editor.sdk.undo) {
								this.editor.sdk.undo.changeLinkBegin(obj.point);
							}
						} else {
							if(this.editor.sdk.undo) {
								this.editor.sdk.undo.changeLinkBegin(obj.point);
							}
							var pt = obj.point.pos;
							while (pt.next !== obj.obj)
								pt = pt.next;
							pt.next = pt.next.next;
							pt.next.prev = pt;
							if(this.editor.sdk.undo) {
								this.editor.sdk.undo.changeLinkEnd(obj.point);
							}
							this.editor.onsdkchange();
						}
						break;
					case OBJ_TYPE_HINT:
						if (button === 0) {
							this.editor.beginOperation(ME_MOVE_LH, obj.obj);
						}
						break;
				}
			} else {
				if(button === 0) {
					if((flags & 0x1) === 0) {
						this.editor.sdk.selMan.clear();
					}
					this.editor.beginOperation(ME_SELRECT, null);
					setTimeout(() => {
						if(this.editor.isOperation(ME_SELRECT) && Math.abs(MouseOperation.curX - x) < 5 && Math.abs(MouseOperation.curY - y) < 5) {
							this.editor.beginOperation(ME_SCROLL_EDITOR, null);
						}
					}, 300);
				}
				else if(button === 2) {
					this.editor.sdk.selMan.clear();
					this.editor.beginOperation(ME_POPUP_MENU, null);
				}
			}
		}
		cursor(x, y, obj) {
			var cur = "default";
			if (obj) {
				switch (obj.type) {
					case 1:
						var c = obj.obj.getCursor(x, y);
						if(c) {
							cur = c;
						}
						break;
					case 2:
						cur = "pointer";
						break;
					case 3:
						cur = "crosshair";
						break;
					case 4:
						cur = "move";
						break;
				}
			}
			return cur;
		}
	}

	class MouseOperationMoveElement extends MouseOperation {
		begin() {
			if(this.editor.sdk.undo) {
				this.editor.sdk.undo.moveElementsBegin(this.editor.sdk.selMan);
			}
		}
		move(x: number, y: number, obj) {
			var dx = toStep(x - MouseOperation.startX);
			var dy = toStep(y - MouseOperation.startY);
			if (dx || dy) {
				this.editor.sdk.selMan.move(dx, dy);
				MouseOperation.startX += dx;
				MouseOperation.startY += dy;
				this.editor.onsdkchange();
				this.editor.draw();
			}
		}
		up(x, y, button, obj, flags) {
			this.editor.sdk.selMan.normalizePosition();
			if(this.editor.sdk.undo) {
				this.editor.sdk.undo.moveElementsEnd(this.editor.sdk.selMan);
			}
			this.editor.sdk.selMan.normalizeLinks();
			return true;
		}
		cursor() { return "move"; }
	}

	class MouseOperationPointsLink extends MouseOperation {
		move(x: number, y: number, obj) {
			this.moveCursor(x, y);
			this.editor.draw();
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			if(obj && obj.type === OBJ_TYPE_LINE) {
				// insert hubex
				
				var e = this.editor.sdk.add(obj.point.type == 2 ? "HubEx" : "GetDataEx", toStep(x), toStep(y));
				e.insertInLine(obj.point, obj.obj);
				e.connectToPoint(this.editor.emouse.obj);
				this.editor.onsdkchange();
				if(this.editor.sdk.undo) {
					this.editor.sdk.undo.addElement(e);
					this.editor.sdk.undo.makeLink(this.editor.emouse.obj);
				}
				return true;
			}
			if(obj && obj.type === OBJ_TYPE_LINEPOINT) {
				// link point
				var pt = obj.point.pos;
				while (pt.next !== obj.obj)
					pt = pt.next;
				pt.next = pt.next.next;
				pt.next.prev = pt;

				var e = this.editor.sdk.add(obj.point.type == 2 ? "HubEx" : "GetDataEx", toStep(pt.x), toStep(pt.y));
				e.insertInLine(obj.point, obj.obj);
				var points = [];
				for(var i = 1; i <= 3; i++)
					points.push(e.points[(obj.point.type == 2 ? "doWork" : "Var") + i]);
				obj.point.connectWithPath(points);
				this.editor.emouse.obj.connectWithPath(points);
				this.editor.onsdkchange();
				if(this.editor.sdk.undo) {
					this.editor.sdk.undo.addElement(e);
					this.editor.sdk.undo.makeLink(this.editor.emouse.obj);
				}

				return true;
			}
			
			if (!obj || obj && obj.obj.point)
				return true;
			if(obj.type === OBJ_TYPE_ELEMENT) {
				var freePoint = obj.obj.getPointToLink(this.editor.emouse.obj.getPair());
				if(freePoint) {
					obj = {obj: freePoint, type: OBJ_TYPE_POINT};
				}
			}
			var sum = (obj && obj.obj !== this.editor.emouse.obj && obj.type === OBJ_TYPE_POINT) ? (this.editor.emouse.obj.type + obj.obj.type) : 0;
			if (sum === 3 || sum === 7) {
				obj.obj.connect(this.editor.emouse.obj).createPath();
				if(this.editor.sdk.undo) {
					this.editor.sdk.undo.makeLink(obj.obj);
				}
				this.editor.onsdkchange();
			}
			return true;
		}
		cursor(x: number, y: number, obj) {
			if(obj) {
				if(obj.type === OBJ_TYPE_ELEMENT) {
					if(obj.obj.getFirstFreePoint(this.editor.emouse.obj.getPair())) {
						return "url('img/cursor/6.cur'), auto";
					}
				}
				if(obj.type === OBJ_TYPE_POINT) {
					return "url('img/cursor/6.cur'), auto";
				}
				if(obj.type === OBJ_TYPE_LINE || obj.type === OBJ_TYPE_LINEPOINT) {
					return "url('img/cursor/9.cur'), auto";
				}
			}
			return "url('img/cursor/7.cur'), auto";
		}
		draw(ctx: CanvasRenderingContext2D) {
			ctx.strokeStyle = "#555";
			ctx.drawLine(MouseOperation.startX, MouseOperation.startY, MouseOperation.curX, MouseOperation.curY);
		}
	}

	class MouseOperationAddElement extends MouseOperation {
		down(x: number, y: number, button: number, obj, flags: number) {
			if(button === 0) {
				if(obj && obj.type === OBJ_TYPE_POINT && obj.obj.isFree()) {
					this.moveCursorStart(obj.obj.pos.x, obj.obj.pos.y);
					this.editor.emouse.sobj = this.editor.emouse.obj;
					this.editor.beginOperation(ME_ADDELEMENT_POINT, obj.obj);
				}
				else {
					var element = this.editor.addElement(this.editor.emouse.obj, x, y);

					if((flags & 0x1) === 0) {
						palette.unSelect();
					}
					
					if(obj && obj.type === 3) {
						element.insertInLine(obj.point, obj.obj);
					}
					return element;
				}
			}
			else {
				palette.unSelect();
			}
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			return (flags & 0x1) === 0;;
		}
		cursor(x: number, y: number, obj) {
			if(obj) {
				if(obj.type === 2) {
					return this.editor.cursorPoint;
				}
				else if(obj.type === 3) {
					return this.editor.cursorLine;
				}
			}
			return this.editor.cursorNormal;
		}
	}

	class MouseOperationSelectRegion extends MouseOperation {
		private timerId: number = 0;
		begin() {
			this.timerId = setInterval(() => {
				if(!this.editor.isOperation(ME_SELRECT)) {
					clearInterval(this.timerId);
					return;
				}
				var ctl = this.editor.getControl().firstChild as HTMLElement;
				var tx = ctl.scrollLeft;
				var ty = ctl.scrollTop;
				var dx = 0;
				var dy = 0;
				var cY = MouseOperation.curY*this.editor.scale;
				var cX = MouseOperation.curX*this.editor.scale;
				if(cY > this.editor.height + ty - 20 && ctl.clientHeight + ctl.scrollTop + 5 <= ctl.scrollHeight) {
					dy = 5;
				}
				else if(ty > 0 && cY < ty + 20) {
					dy = -Math.min(5, ty);
				}
				if(cX > this.editor.width + tx - 20 && ctl.clientWidth + ctl.scrollLeft + 5 <= ctl.scrollWidth) {
					dx = 5;
				}
				else if(tx > 0 && cX < tx + 20) {
					dx = -Math.min(5, tx);
				}
				
				if(dy) {
					ctl.scrollTop += dy;
					MouseOperation.curY += dy/this.editor.scale;
				}
				if(dx) {
					ctl.scrollLeft += dx;
					MouseOperation.curX += dx/this.editor.scale;
				}
				if(dx || dy) {
					this.editor.draw();
				}
			}, 10);
		}
		move(x: number, y: number, obj) {
			this.moveCursor(x, y);
			this.editor.draw();
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			clearInterval(this.timerId);
			this.editor.sdk.selMan.selRect(MouseOperation.startX, MouseOperation.startY, x, y);
			return true;
		}
		cursor(x: number, y: number, obj) { return "default"; }
		draw(ctx: CanvasRenderingContext2D) {
			var x1 = Math.min(MouseOperation.startX, MouseOperation.curX);
			var y1 = Math.min(MouseOperation.startY, MouseOperation.curY);
			var x2 = Math.max(MouseOperation.startX, MouseOperation.curX);
			var y2 = Math.max(MouseOperation.startY, MouseOperation.curY);

			ctx.fillStyle = "rgba(100,200,255,0.4)";
			ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
			ctx.strokeStyle = "#aaa";
			ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
		}
	}

	class MouseOperationMoveLinePoint extends MouseOperation {
		move(x: number, y: number, obj) {
			var pos = this.editor.emouse.obj;
			var oldX = pos.x, oldY = pos.y;
			pos.x = x;
			pos.y = y;
			
			if(pos.prev && !pos.prev.prev) {
				var dy = Math.abs(pos.y - pos.prev.y);
				var dx = Math.abs(pos.x - pos.prev.x);
				if(dy <= 10 && dx <= 10) {
					// do nothing
				}
				else if(dy <= 5) {
					pos.y = pos.prev.y;
				}
				else if(dx <= 5) {
					pos.x = pos.prev.x;
				}
			}
			if(pos.next && !pos.next.next) {
				var dy = Math.abs(pos.y - pos.next.y);
				var dx = Math.abs(pos.x - pos.next.x);
				if(dy <= 10 && dx <= 10) {
					// do nothing
				}
				else if(dy <= 5) {
					pos.y = pos.next.y;
				}
				else if(dx <= 5) {
					pos.x = pos.next.x;
				}
			}
			
			var no = pos.next;
			var flagx = false;
			var flagy = false;
			if (no.next) {
				var dx = Math.abs(oldX - no.x);
				var dy = Math.abs(oldY - no.y);
				if(dx < 10 && dy < 10) {
					// do nothing
				}
				else if (dx < 10) {
					no.x = x;
					flagx = true;
				}
				else if (dy < 10) {
					no.y = y;
					flagy = true;
				}
			}
			no = pos.prev;
			if (no.prev) {
				var dx = Math.abs(oldX - no.x);
				var dy = Math.abs(oldY - no.y);
				if(dx < 10 && dy < 10) {
					// do nothing
				}
				else if (dx < 10 && !flagx)
					no.x = x;
				else if (dy < 10 && !flagy)
					no.y = y;
			}
			this.editor.draw();
			this.editor.onsdkchange();
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			if(this.editor.sdk.undo) {
				this.editor.sdk.undo.changeLinkEnd(null);
			}
			return true;
		}
		cursor(x: number, y: number, obj) { return "move"; }
	}

	class MouseOperationSlideDown extends MouseOperation {
		down(x: number, y: number, button: number, obj, flags: number) {
			this.editor.sdk.selMan.clear();
			for(var i in this.editor.sdk.imgs) {
				var e = this.editor.sdk.imgs[i];
				if(e.y >= y) {
					this.editor.sdk.selMan.add(e);
				}
			}
			if(!this.editor.sdk.selMan.isEmpty()) {
				this.editor.beginOperation(ME_ELEMENT);
			}
		}
		move(x: number, y: number, obj) {
			this.moveCursor(x, y);
			this.editor.draw();
		}
		cursor(x: number, y: number, obj) { return "url('img/cursor/12.cur'), auto"; }
		draw(ctx: CanvasRenderingContext2D) {
			ctx.drawLine(0, MouseOperation.curY, this.editor.width, MouseOperation.curY);
		}
	}

	class MouseOperationSlideRight extends MouseOperation {
		down(x: number, y: number, button: number, obj, flags: number) {
			this.editor.sdk.selMan.clear();
			for(var i in this.editor.sdk.imgs) {
				var e = this.editor.sdk.imgs[i];
				if(e.x >= x) {
					this.editor.sdk.selMan.add(e);
				}
			}
			if(!this.editor.sdk.selMan.isEmpty()) {
				this.editor.beginOperation(ME_ELEMENT);
			}
		}
		move(x: number, y: number, obj) {
			this.moveCursor(x, y);
			this.editor.draw();
		}
		cursor(x: number, y: number, obj) { return "url('img/cursor/10.cur'), auto"; }
		draw(ctx: CanvasRenderingContext2D) {
			ctx.drawLine(MouseOperation.curX, 0, MouseOperation.curX, this.editor.height);
		}
	}

	class MouseOperationElementProcess extends MouseOperation {
		private state: ElementMouseState;

		begin() {
			this.state = {startX: MouseOperation.startX, startY: MouseOperation.startY};
		}
		move(x: number, y: number, obj) {
			this.editor.emouse.obj.mouseMove(x, y, this.state);
			this.editor.draw();
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			this.editor.emouse.obj.mouseUp(x, y, button, this.state);
			this.editor.draw();
			return true;
		}
		cursor(x: number, y: number, obj) {
			return this.editor.emouse.obj.getCursor(x, y);
		}
	}

	class MouseOperationElementHintAdd extends MouseOperation {
		down(x: number, y: number, button: number, obj, flags: number) {
			if(obj && obj.type === OBJ_TYPE_ELEMENT) {
				this.editor.beginOperation(ME_MOVE_LH, obj.obj.addHint(x - obj.obj.x, y - obj.obj.y, null));
			}
		}
		cursor(x: number, y: number, obj) {
			if(obj && obj.type === OBJ_TYPE_ELEMENT) {
				return "url('img/cursor/14.cur'), auto";
			}
			return "url('img/cursor/13.cur'), auto";
		}
	}

	class MouseOperationElementHintRemove extends MouseOperation {
		down(x: number, y: number, button: number, obj, flags: number) {
			if(obj && obj.type === OBJ_TYPE_HINT) {
				var i = 0;
				for(var h of obj.obj.e.hints) {
					if(h === obj.obj) {
						obj.obj.e.hints.splice(i, 1);
						this.editor.onsdkchange();
						return;
					}
					i++;
				}
				this.editor.draw();
			}
			this.editor.endOperation();
		}
		cursor(x: number, y: number, obj) {
			return "url('img/cursor/15.cur'), auto";
		}
	}

	class MouseOperationElementHintMove extends MouseOperation {
		move(x: number, y: number, obj) {
			var h = this.editor.emouse.obj;
			h.x += x - MouseOperation.startX;
			h.y += y - MouseOperation.startY;
			MouseOperation.startX = x;
			MouseOperation.startY = y;
			this.editor.draw();
			this.editor.onsdkchange();
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			var h = this.editor.emouse.obj;
			if(!h.prop) {
				this.editor.showPopup(PopupMenuType.POPUP_MENU_HINT_LINK, x, y, h);
			}
			return true;
		}
		cursor(x: number, y: number, obj) { return "move"; }
	}

	class MouseOperationAddElementAndLink extends MouseOperation {
		move(x: number, y: number, obj) {
			this.moveCursor(x, y);
			this.editor.draw();
		}
		up(x: number, y: number, button: number, obj, flags: number) {
			var p1 = this.editor.emouse.obj;
			this.editor.emouse.obj = this.editor.emouse.sobj;
			delete this.editor.emouse.sobj;
			
			if(obj && obj.type === 2 && obj.obj.isFree()) {
				if(p1.type - obj.obj.type === 1) {
					let p2 = obj.obj;
					p1.connect(p2);
					var point = p1.isPrimary() ? p1 : p2;
					this.editor.mouseHandlers[ME_ADDELEMENT].down((p1.pos.x + p2.pos.x)/2, (p1.pos.y + p2.pos.y)/2, button, {type: OBJ_TYPE_LINE, point: point, obj: point.pos}, flags);
					if(p1.point) {
						p1.createPath();
					}
					if(p2.point) {
						p2.point.createPath();
					}
				}
			}
			else {
				let e: any = this.editor.mouseHandlers[ME_ADDELEMENT].down(x, y, button, obj, flags);
				let p2 = (e as SdkElement).getFirstFreePoint(p1.getPair());
				if(p2) {
					p1.connect(p2).createPath();
				}
			}
			return true;
		}
		cursor(x: number, y: number, obj) {
			if(obj && obj.type === OBJ_TYPE_POINT) {
				return this.editor.cursorPoint;
			}
			return this.editor.cursorNormal;
		}
		draw(ctx: CanvasRenderingContext2D) {
			this.editor.mouseHandlers[ME_POINTLINK].draw(ctx);
		}
	}

	class MouseOperationPopupMenu extends MouseOperation {
		up(x: number, y: number, button: number, obj, flags: number) {
			if(this.editor.emouse.obj) {
				if(this.editor.emouse.obj.type === OBJ_TYPE_ELEMENT) {
					this.editor.showPopup(PopupMenuType.POPUP_MENU_ELEMENT, x, y);
				}
				else if(this.editor.emouse.obj.type === OBJ_TYPE_LINE) {
					this.editor.pasteX = toStep(x);
					this.editor.pasteY = toStep(y);
					this.editor.pasteObj = obj;
					this.editor.showPopup(PopupMenuType.POPUP_MENU_LINE, x, y);
				}
			}
			else {
				this.editor.pasteX = toStep(x);
				this.editor.pasteY = toStep(y);
				this.editor.showPopup(PopupMenuType.POPUP_MENU_SDK, x, y);
			}
			return true;
		}
	}

	class MouseOperationScrollEditor extends MouseOperation {
		move(x: number, y: number, obj) {
			this.editor.scrollBy(MouseOperation.startX - x, MouseOperation.startY - y);
		}
		cursor(x: number, y: number, obj) { return "move"; }
	}

	class MouseOperationScaleEditor extends MouseOperation {
		cursor(x: number, y: number, obj) { return "move"; }
	}

	export class SdkEditor extends UIControl {

		private canvas: Builder;
		sdk: SDK;
		scale: number;
		private hint: Hint;
		emouse: MouseState;
		private oldSelection: any;
		public pasteObj: PasteObject;

		private old_cursor: string;
		private ctx: CanvasRenderingContext2D;
		
		mouseHandlers: Array<MouseOperation>;
		private mouseOperationIndex: number;
		private mouseOperation: MouseOperation;
		private scaleFactor: number = 1;

		public cursorNormal: string;
		public cursorLine: string;
		public cursorPoint: string;

		pasteX = 0;
		pasteY = 0;
		
		// events ------------------------------------------------------------------
		onstatuschange = (text) => {};
		onpopupmenu = (type, x, y, obj) => {};
		oneditprop = (prop: ElementProperty) => {};
		onselectelement = (selMan: SelectManager) => {};
		onsdkchange = () => {};
		onsdkselect = () => {};

		constructor (options) {
			super(options);

			var c = new Builder().div("canvas");
			this._ctl = c.element;
			this.canvas = c.div("scrollbox").n("canvas");

			this.sdk = null;
			this.old_cursor = "";
			this.oldSelection = null;
			this.scale = 1;
			
			this.emouse = { obj: null, sobj: null };

			this.ctx = (this.canvas.element as HTMLCanvasElement).getContext('2d');
			this.ctx.drawLine = function(x1,y1,x2,y2) {
							this.beginPath();  
							this.moveTo(x1, y1);  
							this.lineTo(x2, y2);  
							this.stroke();
						};

			this.initHandlers();
			
			this.hint = new Hint();

			let hlist = [
				MouseOperationNone,
				MouseOperationMoveElement,
				MouseOperationPointsLink,
				MouseOperationAddElement,
				MouseOperationSelectRegion,
				MouseOperationMoveLinePoint,
				MouseOperationSlideDown,
				MouseOperationSlideRight,
				MouseOperationElementProcess,
				MouseOperationElementHintAdd,
				MouseOperationElementHintRemove,
				MouseOperationElementHintMove,
				MouseOperationAddElementAndLink,
				MouseOperationPopupMenu,
				MouseOperationScrollEditor,
				MouseOperationScaleEditor
			];
			this.mouseHandlers = [];
			for(let h of hlist) {
				this.mouseHandlers.push(new h(this));
			}
			this.beginOperation(ME_NONE);

			window.addEventListener('popstate', (e) => {
				if(e.state && e.state.eid) {
					var element = this.sdk.findElementById(e.state.eid);
					if(element) {
						this.sdk.selMan.select(element);
						this.draw();
						this.forward();
					}
					else {
						this.back();
					}
				}
				else {
					this.back();
				}
			}, false);
		}

		private initHandlers() {
			this.canvas.on("oncontextmenu", (e) => { e.preventDefault(); return false; })
			this.canvas.on("ontouchstart", (event) => {
				event.preventDefault();
				var p1 = GetPos(this.canvas.element);
				var x = event.touches[0].clientX - p1.left - document.body.scrollLeft;
				var y = event.touches[0].clientY - p1.top - document.body.scrollTop;
				// move editor if two finger detected
				if(event.touches.length >= 2) {
					var dx = event.touches[0].clientX - event.touches[1].clientX;
					var dy = event.touches[0].clientY - event.touches[1].clientY;
					this.scaleFactor = Math.sqrt(dx*dx + dy*dy);
					this.beginOperation(ME_SCALE_EDITOR, null);
				}
				event.preventDefault();
				
				return this.onmousedown({layerX: x, layerY: y, button: 0} as MouseEvent);
			});
			this.canvas.on("ontouchmove", (event) => {
				event.preventDefault();
				var p1 = GetPos(this.canvas.element);
				var x = event.touches[0].clientX - p1.left - document.body.scrollLeft;
				var y = event.touches[0].clientY - p1.top - document.body.scrollTop;
				// scale editor if two finger detected
				if(event.touches.length >= 2) {
					var dx = event.touches[0].clientX - event.touches[1].clientX;
					var dy = event.touches[0].clientY - event.touches[1].clientY;
					var scaleFactor = Math.sqrt(dx*dx + dy*dy);
					var ds = (scaleFactor - this.scaleFactor)/200;
					var step = 0.0001;
					if(ds > step && this.scale < 4 || ds < -step && this.scale > 0.2) {
						var newScale = this.scale + ds;
						if(Math.abs(1 - newScale) < step)
							newScale = 1;
						this.scaleFactor = scaleFactor;
						this.zoom(newScale);
					}
				}
				
				this.onmousemove({layerX: x, layerY: y, button: 0} as MouseEvent);
			});
			this.canvas.on("ontouchend", (event) => {
				event.preventDefault();
				var p1 = GetPos(this.canvas.element);
				var x = event.changedTouches[0].clientX - p1.left;
				var y = event.changedTouches[0].clientY - p1.top;
				this.onmouseup({layerX: x, layerY: y, button: 0} as MouseEvent);
			});

			this.canvas.on("onmousedown", (e) => this.onmousedown(e));
			this.canvas.on("onmousemove", (e) => this.onmousemove(e));
			this.canvas.on("onmouseup", (e) => this.onmouseup(e));
			this.canvas.on("ondblclick", () => this.ondblclick());
		}

		private isObjEqual(obj1, obj2) {
			return obj1 === null && obj2 === null || obj1 !== null && obj2 !== null && obj1.obj === obj2.obj;
		};

		private onmousedown(event: MouseEvent) {
			var x = event.layerX/this.scale;
			var y = event.layerY/this.scale;
			var b = event.button;

			this.pasteX = toStep(x);
			this.pasteY = toStep(y);
							
			var obj = this.sdk.getObjectAtPos(x, y);
			this.mouseOperation.moveCursorStart(x, y);
			this.mouseOperation.down(x, y, b, obj, this.makeFlags(event));

			this.draw();

			return false;
		}
		private onmousemove(event: MouseEvent) {
			var x = event.layerX/this.scale;
			var y = event.layerY/this.scale;

			var obj = this.sdk.getObjectAtPos(x, y);
			this.showHintObject(obj, x, y);
			this.mouseOperation.move(x, y, obj);
			
			if(!this.isObjEqual(this.oldSelection, obj)) {
				if(this.oldSelection) {
					this.oldSelection.obj.unselect();
					this.oldSelection = null;
				}
				if(obj && obj.type === OBJ_TYPE_POINT) {
					obj.obj.select();
					this.oldSelection = obj;
				}
				this.draw();
			}

			var cur = this.mouseOperation.cursor(x, y, obj);
			if (cur !== this.old_cursor) {
				this.cursor(cur);
				this.old_cursor = cur;
			}
		}
		private onmouseup(event: MouseEvent) {
			// var p1 = GetPos(this.control);
			// var x = (event.clientX - p1.left)/this.scale;
			// var y = (event.clientY - p1.top)/this.scale;
			var x = event.layerX/this.scale;
			var y = event.layerY/this.scale;
			var b = event.button;

			var obj = this.sdk.getObjectAtPos(x, y);
			if(this.mouseOperation.up(x, y, b, obj, this.makeFlags(event)))
				this.endOperation();
			this.updateScrolls();
			this.draw();

			this.cursor(this.mouseOperation.cursor(x, y, obj));
		}
		private ondblclick() {
			if(this.sdk.selMan.size() === 1) {
				var element = this.sdk.selMan.items[0];
				if(element.sdk) {
					this.forward();
				}
				else {
					for(var i in element.props) {
						var prop = element.props[i];
						if(prop.isDefaultEdit()) {
							this.oneditprop(prop);
						}
					}
				}
			}
		}

		private cursor(value: string) {
			this.canvas.style("cursor", value);
		}

		edit(sdk: SDK) {
			if(this.sdk) {
				this.sdk.selMan.onselect = function(){};
				this.sdk.ondraw = function(){};
				this.sdk.scrollX = this.canvas.parent().scrollTop();
				this.sdk.scrollY = this.canvas.parent().scrollLeft();
			}
			this.sdk = sdk;
			if(sdk) {
				if(!sdk.undo) {
					sdk.undo = new UndoManager(sdk);
				}
				this.sdk.selMan.onselect = () => this.onselectelement(this.sdk.selMan);
				this.sdk.selMan.onselect();
				this.sdk.ondraw = () => this.draw();
				this.updateScrolls();
				this.canvas.parent().scrollTop(this.sdk.scrollX || 0);
				this.canvas.parent().scrollLeft(this.sdk.scrollY || 0);
				this.draw();
			}
			else {
				this.onselectelement(null);
			}
			this.onsdkselect();
		}
		
		makeFlags = function(event) {
			return (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0);
		}
		
		showHintObject(obj, x, y) {
			if (obj) {
				if(obj.type === OBJ_TYPE_ELEMENT) {
					var h = this.hint.body();
					var element = obj.obj;
					h.div("header").html(element.name);
					h.n("div").html(this.sdk.pack.translate(element.info));
					var footer = null;
					for(var i in element.props) {
						var prop = element.props[i];
						if(!prop.isDef()) {
							if(!footer) {
								footer = h.div("footer");
							}
							var text = prop.getText();
							if(text.length > 300) {
								text = text.substring(0, 300) + "...";
							}
							footer.n("div").html("<u>" + i + "</u> = " + text.replace(/\n/g, "<br>"));
						}
					}
				}
				else if(obj.type === OBJ_TYPE_POINT) {
					var h = this.hint.body();
					var header = h.div("header");
					header.n("img").class("icon").attr("src", obj.obj.getIcon());
					header.n("span").html(obj.obj.name);
					if(obj.obj.args) {
						header.n("span").style("fontWeight", "normal").html(" (" + obj.obj.args + ")");
					}
					h.n("div").html(this.sdk.pack.translate(obj.obj.parent.getPointInfo(obj.obj)));
				}
				else if(obj.type === OBJ_TYPE_HINT) {
					this.hint.body().html(obj.obj.prop ? obj.obj.prop.name : "not selected");
				}
				else {
					this.hint.body().html(obj.point.name + " -> " + obj.point.point.name);
				}
				this.showHint(x, y);
			} else {
				this.hint.close();
			}
		}
		
		draw() {
			this.ctx.clearRect(0, 0, this.canvas.element.offsetWidth, this.canvas.element.offsetHeight);

			this.ctx.save();
			if(this.scale != 1) {
				this.ctx.scale(this.scale, this.scale);
			}

			this.ctx.translate(0.5, 0.5);
			this.sdk.draw(this.ctx);
			this.mouseOperation.draw(this.ctx);
			
			this.ctx.restore();
		}
		
		beginAddElement(obj) {
			this.beginOperation(ME_ADDELEMENT, obj);
			
			if(this.sdk) {
				var c = document.createElement("canvas");
				var ctx = c.getContext("2d");
				c.width = c.height = 32;
				ctx.translate(0.5, 0.5);
				ctx.strokeStyle = "#000";
				ctx.moveTo(3, 0);
				ctx.lineTo(3, 17);
				ctx.moveTo(0, 3);
				ctx.lineTo(17, 3);
				ctx.stroke();
				ctx.drawImage(this.sdk.pack.elements[obj].icon, 7, 7);
				this.cursorNormal = "url('" + c.toDataURL("image/png") + "') 3 3, auto";
				
				ctx.beginPath();
				ctx.fillStyle = "white";
				ctx.rect(1, 1, 4, 4);
				ctx.fill();
				ctx.stroke();
				this.cursorLine = "url('" + c.toDataURL("image/png") + "') 3 3, auto";
				
				ctx.fillStyle = "lime";
				ctx.fill();
				ctx.stroke();
				this.cursorPoint = "url('" + c.toDataURL("image/png") + "') 3 3, auto";
			}
		}

		beginOperation(operation, obj?: any) {
			this.mouseOperationIndex = operation;
			this.emouse.obj = obj;
			this.mouseOperation = this.mouseHandlers[operation];
			this.mouseOperation.begin();
		}

		endOperation() {
			this.emouse.obj = null;
			this.mouseOperationIndex = ME_NONE;
			this.mouseOperation = this.mouseHandlers[ME_NONE];
		}

		isOperation(operation: number): boolean {
			return this.mouseOperationIndex === operation;
		}
		
		loadFromText(text: string, fileName: string) {
			this.setFileName(fileName);
			this.sdk.load(text, 0, SDK_PARSE_FILE);
			this.endOperation();
			this.updateScrolls();
			this.draw();
		}
		
		getFileName() {
			var msdk = this.getMainSDK();
			return msdk.fileName;
		}
		
		setFileName(fileName) {
			this.getMainSDK().fileName = fileName;
		}
		
		showPopup(type: PopupMenuType, x: number, y: number, obj?: any) {
			var p1 = GetPos(this.canvas.element);
			this.onpopupmenu(type, x*this.scale + p1.left, y*this.scale + p1.top, obj);
			this.hint.close();
		}
		
		showHint(x, y) {
			var p1 = GetPos(this.canvas.element);
			this.hint.show(x*this.scale + 16 + p1.left, y*this.scale + 16 + p1.top);
		}
		
		createNew() {
			this.sdk.clearProject();
			this.draw();
		}
		
		deleteSelected() {
			if(!this.isOperation(ME_NONE))
				return;
			
			if(this.sdk.undo) {
				this.sdk.undo.delElement(this.sdk.selMan);
			}
			this.sdk.selMan.erase();
			this.draw();
			this.onsdkchange();
		}
		
		shiftIDs(sdk: SDK) {
			for(var i in sdk.imgs) {
				var e = sdk.imgs[i];
				e.eid = this.sdk.getNextID();
				if(e.sdk) {
					this.shiftIDs(e.sdk);
				}
			}
		}

		pasteFromText(text: string) {
			this.sdk.selMan.clear();
			var count = this.sdk.imgs.length;
			this.sdk.load(text, 0, SDK_PARSE_PASTE);
			var dx = 32768, dy = 32768;
			for(var i = count; i < this.sdk.imgs.length; i++) {
				var e = this.sdk.imgs[i];
				this.sdk.selMan.add(e);
				if(e.x < dx) {
					dx = e.x;
				}
				if(e.y < dy) {
					dy = e.y;
				}
			}
			dx = this.pasteX - dx;
			dy = this.pasteY - dy;
			this.sdk.selMan.move(dx, dy);
			this.draw();
			this.onsdkchange();

			this.pasteX += POINT_SPACE;
			this.pasteY += POINT_SPACE;
		}
		
		addElement(name, x, y): SdkElement {
			var element = this.sdk.add(name, toStep(x), toStep(y));
			element.place(x, y);

			this.sdk.selMan.select(element);
			if(this.sdk.undo) {
				this.sdk.undo.addElement(element);
			}
			this.onsdkchange();
			return element;
		}
		
		selectAll() {
			this.sdk.selMan.selectAll();
			this.draw();
		}
		
		back() {
			if(this.canBack()) {
				this.edit(this.sdk.parent);
			}
		}
		
		forward() {
			if(this.canForward()) {
				var e = this.sdk.selMan.items[0];
				if(e.sdk) {
					this.edit(e.sdk);
					if(!window.history.state || window.history.state.eid !== e.eid) {
						window.history.pushState({eid: e.eid}, e.name);
					}
				}
			}
		}
		
		canBack() {
			return this.sdk && this.sdk.parent;
		}
		
		canForward() {
			if(this.sdk && this.sdk.selMan.size() === 1) {
				var e = this.sdk.selMan.items[0];
				if(e.sdk) {
					return true;
				}
			}
			
			return false;
		}
		
		canBringToFront() {
			return this.sdk.selMan.size() === 1 && this.sdk.imgs[this.sdk.imgs.length-1] !== this.sdk.selMan.items[0] && !(this.sdk.selMan.items[0].flags & IS_PARENT);
		}

		canSendToBack() {
			if(this.sdk.selMan.size() === 1) {
				var prevIndex = this.sdk.indexOf(this.sdk.selMan.items[0]);
				return prevIndex > 0 && !(this.sdk.selMan.items[0].flags & IS_PARENT) && !(this.sdk.imgs[prevIndex-1].flags & IS_PARENT);
			}
			
			return false;
		}

		bringToFront() {
			if(this.canBringToFront()) {
				var e = null;
				for(var i = 0; i < this.sdk.imgs.length-1; i++) {
					if(this.sdk.imgs[i].isSelect()) {
						e = this.sdk.imgs[i];
					}
					if(e) {
						this.sdk.imgs[i] = this.sdk.imgs[i+1];
					}
				}
				this.sdk.imgs[this.sdk.imgs.length-1] = e;
				this.draw();
			}
		}

		sendToBack() {
			if(this.canSendToBack()) {
				var e = null;
				var i;
				for(i = this.sdk.imgs.length-1; i > 1 && !(this.sdk.imgs[i-1].flags & IS_PARENT); i--) {
					if(this.sdk.imgs[i].isSelect()) {
						e = this.sdk.imgs[i];
					}
					if(e) {
						this.sdk.imgs[i] = this.sdk.imgs[i-1];
					}
				}
				this.sdk.imgs[i] = e;
				this.draw();
			}
		}
		
		run() {
			this.getMainSDK().run(FLAG_USE_RUN);
		}

		getMainSDK(): MSDK {
			var s = this.sdk;
			while(s.parent) {
				s = s.parent;
			}
			return s as MSDK;
		}
		
		canZoomIn(){
			return this.scale < 8;
		}

		canZoomOut(){
			return this.scale > 0.3;
		}

		zoomIn() {
			this.scale *= 2;
			this.draw();
		}

		zoomOut() {
			this.scale /= 2;
			this.updateScrolls();
			this.draw();
		}
		
		zoom(value: number) {
			var dx = value - this.scale;
			var oW = this.canvas.parent().element.offsetWidth/2*dx;
			var oH = this.canvas.parent().element.offsetHeight/2*dx;
			this.scale = value;
			if(dx < 0) {
				this.canvas.parent().element.scrollLeft += oW;
				this.canvas.parent().element.scrollTop += oH;
			}
			this.updateScrolls();
			if(dx > 0) {
				this.canvas.parent().element.scrollLeft += oW;
				this.canvas.parent().element.scrollTop += oH;
			}
			this.draw();
		}

		/**
		 * Download current project to local computer
		 * @param file downloaded file name
		 */
		download(file: string) {
			var saveData = (function () {
				var a = document.createElement("a");
				a.style.display = "none";
				document.body.appendChild(a);
				return function (data, fileName) {
					var url = window.URL.createObjectURL(new window.Blob([data], {type: "octet/stream"}));
					a.href = url;
					a.download = fileName;
					a.click();
					document.body.removeChild(a);
					window.URL.revokeObjectURL(url);
				};
			}());
			
			saveData(this.getMainSDK().save(false), file.split("/").pop());
		}
		
		/**
		 * Paste element at line and select them
		 * @param id Element code name
		 */
		pasteLineElement(id: string) {
			var element = this.sdk.add(id, this.pasteX, this.pasteY);
			this.sdk.selMan.select(element);

			element.insertInLine(this.pasteObj.point, this.pasteObj.obj);
			
			this.onsdkchange();
			this.draw();
		}

		/**
		 * Set line color
		 * @param color
		 */
		setLineColor(color: string) {
			this.pasteObj.point.setColor(color);
			this.onsdkchange();
			this.draw();
		}

		setLineInfo(data: LineInfo) {
			this.pasteObj.point.setInfo(data);
			this.onsdkchange();
			this.draw();
		}

		resize(){
			if(this.sdk) {
				this.updateScrolls();
				this.draw();
			}
		}

		updateScrolls() {
			var params = this.sdk.getParams();
			var parent = this.canvas.parent().element;
			
			(this.canvas.element as HTMLCanvasElement).height = Math.max(params.y2*this.scale + POINT_SPACE*10, parent.offsetHeight - 20);
			(this.canvas.element as HTMLCanvasElement).width = Math.max(params.x2*this.scale + POINT_SPACE*10, parent.offsetWidth - 20);
		}

		scrollBy(dx: number, dy: number) {
			this.canvas.parent().element.scrollLeft += dx;
			this.canvas.parent().element.scrollTop += dy;
		}

		canUndo(){ return this.sdk.undo.canUndo(); };
		canRedo(){ return this.sdk.undo.canRedo(); };

		undo(){ this.sdk.undo.undo(); this.draw(); };
		redo(){ this.sdk.undo.redo(); this.draw(); };

		canFormEdit() {
			if(this.sdk.imgs.length && this.sdk.imgs[0].flags & IS_PARENT) {
				return true;
			}
			if(this.sdk.imgs.length > 1 && this.sdk.imgs[1].flags & IS_PARENT) {
				return true;
			}
			
			return false;
		}

		getBuild() {
			var sdk = this.getMainSDK();
			return sdk.buildCounter || 0;
		}

		build() {
			var sdk = this.getMainSDK();
			if(sdk.buildCounter)
				sdk.buildCounter++;
			else
				sdk.buildCounter = 1;
		}
	}
}