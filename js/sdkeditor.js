"use strict";

var ME_NONE       		= 0;  // no operation
var ME_ELEMENT			= 1;  // move element
var ME_POINTLINK		= 2;  // link two points
var ME_ADDELEMENT		= 3;  // create new element
var ME_SELRECT			= 4;  // select elements
var ME_LINEPOINT		= 5;  // move point of line
var ME_SLIDE_DOWN		= 6;  // select elements after horizont line
var ME_SLIDE_RIGHT		= 7;  // select elements after horizont line
var ME_ELEMENT_MOUSE	= 8;  // handle by element
var ME_MAKE_LH			= 9;  // make link hint
var ME_REMOVE_LH		= 10; // remove link hint
var ME_MOVE_LH			= 11; // move link hint
var ME_ADDELEMENT_POINT	= 12; // add new element and link with point
var ME_POPUP_MENU		= 13; // show popup menu
var ME_SCROLL_EDITOR	= 14; // change scroll bars positions
var ME_SCALE_EDITOR		= 15; // change editor scale factor

var POPUP_MENU_ELEMENT	= 1;
var POPUP_MENU_SDK		= 2;
var POPUP_MENU_HINT_LINK	= 3;
var POPUP_MENU_LINE		= 4;

/* global Hint */
/* global SDK */
/* global toStep */
/* global GetPos */

var UNDO_ADD_ELEMENT = 1;
var UNDO_DEL_ELEMENT = 2;
var UNDO_MOVE_ELEMENT = 3;
var UNDO_LINK = 4;
var UNDO_DEL_LINK = 5;
var UNDO_CHANGE_LINK = 6;
var UNDO_ADD_LINK_POINT = 7;
var UNDO_DEL_LINK_POINT = 8;

var UCMD_ADD_ELEMENT = 1;
var UCMD_DEL_ELEMENT = 2;
var UCMD_LOAD_FROM_TEXT = 3;
var UCMD_DEL_ELEMENTS = 4;
var UCMD_MOVE_ELEMENTS = 5;
var UCMD_DEL_LINK = 6;
var UCMD_ADD_LINK = 7;
var UCMD_LINK_PATH = 8;

function UndoManager(sdk) {
	this.items = [];
	this.index = -1;
	this.sdk = sdk;
	this.enabled = true;
}

UndoManager.prototype.canUndo = function() {
	return this.index >= 0;
};

UndoManager.prototype.canRedo = function() {
	return this.index < this.items.length-1;
};

UndoManager.prototype._exec = function(obj) {
	switch(obj.type) {
		case UCMD_DEL_ELEMENT:
			this.sdk.deleteElementById(obj.id);
			break;
		case UCMD_ADD_ELEMENT:
			var e = this.sdk.add(obj.name, obj.x, obj.y);
			e.eid = obj.id;
			break;
		case UCMD_LOAD_FROM_TEXT:
			var eid = this.sdk.getCurrentID();
			this.sdk.load(obj.data, 0);
			this.sdk.setID(eid);
			break;
		case UCMD_DEL_ELEMENTS:
			for(var id of obj.ids) {
				this.sdk.deleteElementById(id);
			}
			break;
		case UCMD_MOVE_ELEMENTS:
			this.sdk.selMan.clear();
			for(var id of obj.ids) {
				this.sdk.selMan.add(this.sdk.findElementById(id));
			}
			this.sdk.selMan.move(-obj.dx, -obj.dy);
			break;
		case UCMD_DEL_LINK:
			var e = this.sdk.findElementById(obj.id);
			if(e) {
				e.points[obj.point].clear();
			}
			break;
		case UCMD_ADD_LINK:
			var e1 = this.sdk.findElementById(obj.id1);
			var e2 = this.sdk.findElementById(obj.id2);
			if(e1 && e2) {
				e1.points[obj.point1].clear();
				e1.points[obj.point1].connect(e2.points[obj.point2]);
			}
			break;
		case UCMD_LINK_PATH:
			var e = this.sdk.findElementById(obj.id);
			if(e) {
				e.points[obj.point].clearPath();
				var pp = e.points[obj.point].pos;
				for(var n of obj.nodes) {
					pp = addLinePoint(pp, n.x, n.y);
				}
			}
			break;
	}
};

UndoManager.prototype.undo = function() {
	if(this.canUndo()) {
		for(var cmd of this.items[this.index].undo) {
			this._exec(cmd);
		}
		this.index--;
	}
};

UndoManager.prototype.redo = function() {
	if(this.canRedo()) {
		this.index++;
		for(var cmd of this.items[this.index].redo) {
			this._exec(cmd);
		}
	}
};

UndoManager.prototype._prepare = function() {
	if(this.index < this.items.length-1) {
		this.items.splice(this.index+1, this.items.length - this.index);
	}
};

UndoManager.prototype._add = function(type, undo, redo) {
	this._prepare();
	this.items.push({type:type, undo: undo, redo: redo});
	this.index ++;
};

UndoManager.prototype.addElement = function(element) {
	this._add(
		UNDO_ADD_ELEMENT,
		[{type: UCMD_DEL_ELEMENT, id: element.eid}],
		[{type: UCMD_ADD_ELEMENT, id: element.eid, name: element.name, x:element.x, y:element.y}]
	);
};

UndoManager.prototype.delElement = function(selMan) {
	var ids = [];
	var savedLinks = [{type: UCMD_LOAD_FROM_TEXT, data: this.sdk.save(true)}];
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
};

UndoManager.prototype.makeLink = function(point) {
	var p = point.isPrimary() ? point : point.point;
	this._add(
		UNDO_LINK,
		[{type: UCMD_DEL_LINK, id: p.parent.eid, point: p.name}],
		[{type: UCMD_ADD_LINK, id1: p.parent.eid, point1: p.name, id2: p.point.parent.eid, point2: p.point.name}]
	);
};

UndoManager.prototype.delLink = function(point) {
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
};

UndoManager.prototype.moveElementsBegin = function(selMan) {
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
};

UndoManager.prototype.moveElementsEnd = function(selMan) {
	var dx = this.data.sx - selMan.items[0].x;
	var dy = this.data.sy - selMan.items[0].y;
	
	if(dx || dy) {
		var ids = [];
		var savedLinks = [{type: UCMD_MOVE_ELEMENTS, ids: ids, dx: dx, dy: dy}];
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
};

UndoManager.prototype.changeLinkBegin = function(point) {
	var p = point.isPrimary() ? point : point.point;
	this._add(
		UNDO_CHANGE_LINK,
		[{type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()}],
		null
	);
	this.data = p;
};

UndoManager.prototype.changeLinkEnd = function(point) {
	var p = this.data;
	this.items[this.index].redo = [{type: UCMD_LINK_PATH, id: p.parent.eid, point: p.name, nodes: p.getNodes()}];
};

// ------------------------------------------------------------------------------

function SdkEditor() {
	var c = new Builder().n("div").class("canvas");
	this._ctl = c.element;
	this.control = c.n("div").class("scrollbox")
		.n("canvas").on("oncontextmenu", function(e){ e.preventDefault(); return false; }).element;

	/**
	 * {SDK}
	 */
	this.sdk = null;
	this.old_cursor = "";
	
	this.scale = 1;
	
	this.emouse = { state:0, selstate:0, startX:0, startY:0, curX:0, curY:0, obj: null, selobj: null };

	this.ctx = this.control.getContext('2d');
	this.ctx.drawLine = function(x1,y1,x2,y2) {
					 this.beginPath();  
					 this.moveTo(x1, y1);  
					 this.lineTo(x2, y2);  
					 this.stroke();
				};
	this.control.editor = this;
	
	this.hint = new Hint();
	
	var __editor__ = this;
	window.addEventListener('popstate', function(e){
		if(e.state && e.state.eid) {
			var element = __editor__.sdk.findElementById(e.state.eid);
			if(element) {
				__editor__.sdk.selMan.select(element);
				__editor__.draw();
				__editor__.forward();
			}
			else {
				__editor__.back();
			}
		}
		else {
			__editor__.back();
		}
	}, false);

	// events ------------------------------------------------------------------
	this.onstatuschange = function(text) {};
	this.onpopupmenu = function(type, x, y, obj) {};
	this.oneditprop = function(name, prop) {};
	this.onselectelement = function() {};
	this.onsdkchange = function() {};
	this.onsdkselect = function() {};
	//--------------------------------------------------------------------------

	this._selManOnSelect = function() {
		
	};

	this.edit = function (sdk) {
		if(this.sdk) {
			this.sdk.selMan.onselect = function(){};
			this.sdk.ondraw = function(){};
			this.sdk.scrollX = this.control.parentNode.scrollTop;
			this.sdk.scrollY = this.control.parentNode.scrollLeft;
		}
		this.sdk = sdk;
		if(sdk) {
			if(!sdk.undo) {
				sdk.undo = new UndoManager(sdk);
			}
			this.sdk.selMan.onselect = function(parent) { return function(){ parent.onselectelement(this); }; }(this);
			this.sdk.selMan.onselect();
			this.sdk.ondraw = function(parent) { return function(){ parent.draw(); }; }(this);
			this.updateScrolls();
			this.control.parentNode.scrollTop = this.sdk.scrollX || 0;
			this.control.parentNode.scrollLeft = this.sdk.scrollY || 0;
			this.draw();
		}
		else {
			this.onselectelement(null);
		}
		this.onsdkselect();
	};
	
	this.operations = [
		// no operation
		{
			/**
			 * 
			 * @param {SdkEditor} editor
			 * @param {number} x
			 * @param {number} y
			 * @param {number} button
			 * @param {Object} obj
			 * @returns {undefined}
			 */
			down: function(editor, x, y, button, obj, flags) {
				if(button === 1) {
					editor.beginOperation(ME_SCROLL_EDITOR, null);
				}
				else if (obj) {
					switch (obj.type) {
						case OBJ_TYPE_ELEMENT:
							if(obj.obj.mouseDown(x, y, button, flags)) {
								editor.beginOperation(ME_ELEMENT_MOUSE, obj.obj);
							}
							else {
								if(!obj.obj.isSelect()) {
									editor.sdk.selMan.select(obj.obj);
								}
								if(button === 0) {
									editor.beginOperation(ME_ELEMENT, obj.obj);
								}
								else if(button === 2) {
									editor.beginOperation(ME_POPUP_MENU, obj);
								}
							}
							break;
						case OBJ_TYPE_POINT:
							if(button === 2) {
								if(editor.sdk.undo) {
									editor.sdk.undo.delLink(obj.obj);
								}
								obj.obj.clear();
								editor.onsdkchange();
							}
							else {
								var o = obj.obj;
								if (o.point) {
									var p = o.point;
									o = p;
									if(editor.sdk.undo) {
										editor.sdk.undo.delLink(obj.obj);
									}
									obj.obj.parent.clearPoint(obj.obj);
								}
								editor.beginOperation(ME_POINTLINK, o);
								editor.emouse.startX = o.pos.x;
								editor.emouse.startY = o.pos.y;
							}
							break;
						case OBJ_TYPE_LINE:
							if (button === 0) {
								if(editor.sdk.undo) {
									editor.sdk.undo.changeLinkBegin(obj.point);
								}
								obj.obj.next = {x: x, y: y, next: obj.obj.next, prev: obj.obj};
								obj.obj.next.next.prev = obj.obj.next;
								editor.beginOperation(ME_LINEPOINT, obj.obj.next);
							}
							else if (button === 2) {
								editor.beginOperation(ME_POPUP_MENU, obj);
							}
							break;
						case OBJ_TYPE_LINEPOINT:
							if (button === 0) {
								editor.beginOperation(ME_LINEPOINT, obj.obj);
								if(editor.sdk.undo) {
									editor.sdk.undo.changeLinkBegin(obj.point);
								}
							} else {
								if(editor.sdk.undo) {
									editor.sdk.undo.changeLinkBegin(obj.point);
								}
								var pt = obj.point.pos;
								while (pt.next !== obj.obj)
									pt = pt.next;
								pt.next = pt.next.next;
								pt.next.prev = pt;
								if(editor.sdk.undo) {
									editor.sdk.undo.changeLinkEnd(obj.point);
								}
								editor.onsdkchange();
							}
							break;
						case OBJ_TYPE_HINT:
							if (button === 0) {
								editor.beginOperation(ME_MOVE_LH, obj.obj);
							}
							break;
					}
				} else {
					if(button === 0) {
						if((flags & 0x1) === 0) {
							editor.sdk.selMan.clear();
						}
						editor.beginOperation(ME_SELRECT, null);
						setTimeout(function(){
							if(editor.emouse.state === ME_SELRECT && Math.abs(editor.emouse.curX - x) < 5 && Math.abs(editor.emouse.curY - y) < 5) {
								editor.beginOperation(ME_SCROLL_EDITOR, null);
							}
						}, 300);
					}
					else if(button === 2) {
						editor.sdk.selMan.clear();
						editor.beginOperation(ME_POPUP_MENU, null);
					}
				}
			},
			move: function(editor, x, y, obj) {
				
			},
			up: function(editor, x, y, button, obj) { return true; },
			cursor: function(editor, x, y, obj) {
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
		},
		// move element
		{
			begin: function(editor) {
				if(editor.sdk.undo) {
					editor.sdk.undo.moveElementsBegin(editor.sdk.selMan);
				}
			},
			down: function() {},
			move: function(editor, x, y, obj) {
				var dx = toStep(x - editor.emouse.startX);
				var dy = toStep(y - editor.emouse.startY);
				if (dx || dy) {
					editor.sdk.selMan.move(dx, dy);
					editor.emouse.startX += dx;
					editor.emouse.startY += dy;
					editor.onsdkchange();
					editor.draw();
				}
			},
			up: function(editor, x, y) {
				editor.sdk.selMan.normalizePosition();
				if(editor.sdk.undo) {
					editor.sdk.undo.moveElementsEnd(editor.sdk.selMan);
				}
				editor.sdk.selMan.normalizeLinks();
				return true;
			},
			cursor: function() { return "move"; }
		},
		// points link
		{
			down: function() {},
			move: function(editor, x, y, obj) {
				editor.emouse.curX = x;
				editor.emouse.curY = y;
				editor.draw();
			},
			up: function(editor, x, y, button, obj) {
				if(obj && obj.type === OBJ_TYPE_LINE) {
					// insert hubex
					
					var e = editor.sdk.add(obj.point.type == 2 ? "HubEx" : "GetDataEx", toStep(x), toStep(y));
					e.insertInLine(obj.point, obj.obj);
					e.connectToPoint(editor.emouse.obj);
					editor.onsdkchange();
					if(editor.sdk.undo) {
						editor.sdk.undo.addElement(e);
						editor.sdk.undo.makeLink(editor.emouse.obj);
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

					var e = editor.sdk.add(obj.point.type == 2 ? "HubEx" : "GetDataEx", toStep(pt.x), toStep(pt.y));
					e.insertInLine(obj.point, obj.obj);
					var points = [];
					for(var i = 1; i <= 3; i++)
						points.push(e.points[(obj.point.type == 2 ? "doWork" : "Var") + i]);
					obj.point.connectWithPath(points);
					editor.emouse.obj.connectWithPath(points);
					editor.onsdkchange();
					if(editor.sdk.undo) {
					 	editor.sdk.undo.addElement(e);
					 	editor.sdk.undo.makeLink(editor.emouse.obj);
					}

					return true;
				}
				
				if (!obj || obj && obj.obj.point)
					return true;
				if(obj.type === OBJ_TYPE_ELEMENT) {
					var freePoint = obj.obj.getPointToLink(editor.emouse.obj.getPair());
					if(freePoint) {
						obj = {obj: freePoint, type: OBJ_TYPE_POINT};
					}
				}
				var sum = (obj && obj.obj !== editor.emouse.obj && obj.type === OBJ_TYPE_POINT) ? (editor.emouse.obj.type + obj.obj.type) : 0;
				if (sum === 3 || sum === 7) {
					obj.obj.connect(editor.emouse.obj).createPath();
					if(editor.sdk.undo) {
						editor.sdk.undo.makeLink(obj.obj);
					}
					editor.onsdkchange();
				}
				return true;
			},
			cursor: function(editor, x, y, obj) {
				if(obj) {
					if(obj.type === OBJ_TYPE_ELEMENT) {
						if(obj.obj.getFirstFreePoint(editor.emouse.obj.getPair())) {
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
		},
		// add eleemnt
		{
			down: function(editor, x, y, button, obj, flags) {
				if(button === 0) {
					if(obj && obj.type === 2 && obj.obj.isFree()) {
						editor.emouse.startX = obj.obj.pos.x;
						editor.emouse.startY = obj.obj.pos.y;
						editor.emouse.sobj = editor.emouse.obj;
						editor.beginOperation(ME_ADDELEMENT_POINT, obj.obj);
					}
					else {
						var element = editor.addElement(editor.emouse.obj, x, y);

						if((flags & 0x1) === 0) {
							window.palette.unSelect();
						}
						
						if(obj && obj.type === 3) {
							element.insertInLine(obj.point, obj.obj);
						}
						return element;
					}
				}
			},
			move: function() {},
			up: function(editor, x, y, button, obj, flags) { return (flags & 0x1) === 0; },
			cursor: function(editor, x, y, obj) {
				if(obj) {
					if(obj.type === 2) {
						return editor.cursorPoint;
					}
					else if(obj.type === 3) {
						return editor.cursorLine;
					}
				}
				return editor.cursorNormal;
			}
		},
		// select region
		{
			timerId: 0,
			begin: function(editor) {
				var obj = this;
				this.timerId = setInterval(function(){
					if(editor.emouse.state != ME_SELRECT) {
						clearInterval(obj.timerId);
						return;
					}
					var ctl = editor.getControl().firstChild;
					var tx = ctl.scrollLeft;
					var ty = ctl.scrollTop;
					var dx = 0;
					var dy = 0;
					var cY = editor.emouse.curY*editor.scale;
					var cX = editor.emouse.curX*editor.scale;
					if(cY > editor.height + ty - 20 && ctl.clientHeight + ctl.scrollTop + 5 <= ctl.scrollHeight) {
						dy = 5;
					}
					else if(ty > 0 && cY < ty + 20) {
						dy = -Math.min(5, ty);
					}
					if(cX > editor.width + tx - 20 && ctl.clientWidth + ctl.scrollLeft + 5 <= ctl.scrollWidth) {
						dx = 5;
					}
					else if(tx > 0 && cX < tx + 20) {
						dx = -Math.min(5, tx);
					}
					
					if(dy) {
						ctl.scrollTop += dy;
						editor.emouse.curY += dy/editor.scale;
					}
					if(dx) {
						ctl.scrollLeft += dx;
						editor.emouse.curX += dx/editor.scale;
					}
					if(dx || dy) {
						editor.draw();
					}
				}, 10);
			},
			down: function() {},
			move: function(editor, x, y) {
				editor.emouse.curX = x;
				editor.emouse.curY = y;
				editor.draw();
			},
			up: function(editor, x, y) {
				clearInterval(this.timerId);
				editor.sdk.selMan.selRect(editor.emouse.startX, editor.emouse.startY, x, y);
				return true;
			},
			cursor: function() { return "default"; }
		},
		// move point of line
		{
			down: function(editor) {},
			move: function(editor, x, y) {
				var pos = editor.emouse.obj;
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
				editor.draw();
				editor.onsdkchange();
			},
			up: function(editor, x, y, button, obj) {
				if(editor.sdk.undo) {
					editor.sdk.undo.changeLinkEnd(null);
				}
				return true;
			},
			cursor: function() { return "move"; }
		},
		// slide down
		{
			down: function(editor, x, y) {
				editor.sdk.selMan.clear();
				for(var i in editor.sdk.imgs) {
					var e = editor.sdk.imgs[i];
					if(e.y >= y) {
						editor.sdk.selMan.add(e);
					}
				}
				if(!editor.sdk.selMan.isEmpty()) {
					editor.beginOperation(ME_ELEMENT);
				}
			},
			move: function(editor, x, y, obj) {
				editor.emouse.curX = x;
				editor.emouse.curY = y;
				editor.draw();
			},
			up: function() { return true; },
			cursor: function() { return "url('img/cursor/12.cur'), auto"; }
		},
		// slide right
		{
			down: function(editor, x, y) {
				editor.sdk.selMan.clear();
				for(var i in editor.sdk.imgs) {
					var e = editor.sdk.imgs[i];
					if(e.x >= x) {
						editor.sdk.selMan.add(e);
					}
				}
				if(!editor.sdk.selMan.isEmpty()) {
					editor.beginOperation(ME_ELEMENT);
				}
			},
			move: function(editor, x, y, obj) {
				editor.emouse.curX = x;
				editor.emouse.curY = y;
				editor.draw();
			},
			up: function() { return true; },
			cursor: function() { return "url('img/cursor/10.cur'), auto"; }
		},
		// element process
		{
			down: function() {},
			move: function(editor, x, y) {
				editor.emouse.obj.mouseMove(x, y, editor.emouse);
				editor.draw();
			},
			up: function(editor, x, y, button) {
				editor.emouse.obj.mouseUp(x, y, button, editor.emouse);
				editor.draw();
				return true;
			},
			cursor: function(editor, x, y, obj) {
				return editor.emouse.obj.getCursor(x, y);
			}
		},
		// make element hint
		{
			down: function(editor, x, y, button, obj) {
				if(obj && obj.type === 1) {
					editor.beginOperation(ME_MOVE_LH, obj.obj.addHint(x - obj.obj.x, y - obj.obj.y, null));
				}
			},
			move: function(editor, x, y) {},
			up: function(editor, x, y, button) { return true; },
			cursor: function(editor, x, y, obj) {
				if(obj && obj.type === 1) {
					return "url('img/cursor/14.cur'), auto";
				}
				return "url('img/cursor/13.cur'), auto";
			}
		},
		// remove element hint
		{
			down: function(editor, x, y, button, obj) {
				if(obj && obj.type === 5) {
					var i = 0;
					for(var h of obj.obj.e.hints) {
						if(h === obj.obj) {
							obj.obj.e.hints.splice(i, 1);
							editor.onsdkchange();
							return;
						}
						i++;
					}
					editor.draw();
				}
				editor.endOperation();
			},
			move: function(editor, x, y) {},
			up: function(editor, x, y, button) { return true; },
			cursor: function(editor, x, y, obj) {
				return "url('img/cursor/15.cur'), auto";
			}
		},
		// move element hint
		{
			down: function(editor, x, y, button, obj) {},
			move: function(editor, x, y) {
				var h = editor.emouse.obj;
				h.x += x - editor.emouse.startX;
				h.y += y - editor.emouse.startY;
				editor.emouse.startX = x;
				editor.emouse.startY = y;
				editor.draw();
				editor.onsdkchange();
			},
			up: function(editor, x, y, button) {
				var h = editor.emouse.obj;
				if(!h.prop) {
					editor.showPopup(POPUP_MENU_HINT_LINK, x, y, h);
				}
				return true;
			},
			cursor: function(editor, x, y, obj) {
				return "move";
			}
		},
		// add element and link with point
		{
			down: function(editor, x, y, button, obj) { },
			move: function(editor, x, y) {
				editor.draw();
			},
			up: function(editor, x, y, button, obj) {
				var p1 = editor.emouse.obj;
				editor.emouse.obj = editor.emouse.sobj;
				delete editor.emouse.sobj;
				
				if(obj && obj.type === 2 && obj.obj.isFree()) {
					if(p1.type - obj.obj.type === 1) {
						var p2 = obj.obj;
						p1.connect(p2);
						var point = p1.isPrimary() ? p1 : p2;
						editor.operations[ME_ADDELEMENT].down(editor, (p1.pos.x + p2.pos.x)/2, (p1.pos.y + p2.pos.y)/2, button, {type: 3, point: point, obj: point.pos});
						if(p1.point) {
							p1.createPath();
						}
						if(p2.point) {
							p2.point.createPath();
						}
					}
				}
				else {
					var e = editor.operations[ME_ADDELEMENT].down(editor, x, y, button, obj);
					var p2 = e.getFirstFreePoint(p1.getPair());
					if(p2) {
						p1.connect(p2).createPath();
					}
				}
				return true;
			},
			cursor: function(editor, x, y, obj) {
				if(obj && obj.type === 2) {
					return editor.cursorPoint;
				}
				return editor.cursorNormal;
			}
		},
		// show popup menu
		{
			down: function(editor, x, y, button, obj) { },
			move: function(editor, x, y) { },
			up: function(editor, x, y, button, obj) {
				if(editor.emouse.obj) {
					if(editor.emouse.obj.type === OBJ_TYPE_ELEMENT) {
						editor.showPopup(POPUP_MENU_ELEMENT, x, y);
					}
					else if(editor.emouse.obj.type === OBJ_TYPE_LINE) {
						editor.pasteX = toStep(x);
						editor.pasteY = toStep(y);
						editor.pasteObj = obj;
						editor.showPopup(POPUP_MENU_LINE, x, y);
					}
				}
				else {
					editor.pasteX = toStep(x);
					editor.pasteY = toStep(y);
					editor.showPopup(POPUP_MENU_SDK, x, y);
				}
				return true;
			},
			cursor: function(editor, x, y, obj) { }
		},
		// scroll editor
		{
			down: function(editor, x, y, button, obj) { },
			move: function(editor, x, y) {
				editor.control.parentNode.scrollLeft -= x - editor.emouse.startX;
				editor.control.parentNode.scrollTop -= y - editor.emouse.startY;
			},
			up: function(editor, x, y, button) { return true; },
			cursor: function(editor, x, y, obj) { return "move"; }
		},
		// editor scale
		{
			down: function(editor, x, y, button, obj) { },
			move: function(editor, x, y) { },
			up: function(editor, x, y, button) { return true; },
			cursor: function(editor, x, y, obj) { return "move"; }
		}
	];

	this.makeFlags = function(event) {
		return (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0);
	};

	this.control.onmousedown = function(event) { return this.editor.onmousedown(event); };
	this.control.ontouchstart = function(event) {
		event.preventDefault();
		var p1 = GetPos(this);
		var x = event.touches[0].clientX - p1.left - document.body.scrollLeft;
		var y = event.touches[0].clientY - p1.top - document.body.scrollTop;
		// move editor if two finger detected
		if(event.touches.length >= 2) {
			var dx = event.touches[0].clientX - event.touches[1].clientX;
			var dy = event.touches[0].clientY - event.touches[1].clientY;
			this.editor.emouse.scaleFactor = Math.sqrt(dx*dx + dy*dy);
			this.editor.beginOperation(ME_SCALE_EDITOR, null);
		}
		event.preventDefault();
		
		return this.editor.onmousedown({layerX: x, layerY: y, button: 0});
	};
	this.onmousedown = function (event) {
		// var p1 = GetPos(this.control);
		// var x = (event.clientX - p1.left)/this.scale;
		// var y = (event.clientY - p1.top)/this.scale;
		var x = event.layerX/this.scale;
		var y = event.layerY/this.scale;
		var b = event.button;

		this.pasteX = toStep(x);
		this.pasteY = toStep(y);
						
		this.emouse.startX = x;
		this.emouse.startY = y;
		this.emouse.curX = x;
		this.emouse.curY = y;
		
		var obj = this.sdk.getObjectAtPos(x, y);
		this.operations[this.emouse.state].down(this, x, y, b, obj, this.makeFlags(event));

		this.draw();

		return false;
	};

	this.control.onpaste = function(event) {
		alert(event);
	};
	this.control.oncopy = function(event) {
		alert(event);
	};

	this.oldSelection = null;
	this.isObjEqual = function(obj1, obj2) { return obj1 === null && obj2 === null || obj1 !== null && obj2 !== null && obj1.obj === obj2.obj; };
	this.control.onmousemove = function(event) { this.editor.onmousemove(event); };
	this.control.ontouchmove = function(event) {
		event.preventDefault();
		var p1 = GetPos(this);
		var x = event.touches[0].clientX - p1.left - document.body.scrollLeft;
		var y = event.touches[0].clientY - p1.top - document.body.scrollTop;
		// scale editor if two finger detected
		if(event.touches.length >= 2) {
			var dx = event.touches[0].clientX - event.touches[1].clientX;
			var dy = event.touches[0].clientY - event.touches[1].clientY;
			var scaleFactor = Math.sqrt(dx*dx + dy*dy);
			var ds = (scaleFactor - this.editor.emouse.scaleFactor)/200;
			var step = 0.0001;
			if(ds > step && this.editor.scale < 4 || ds < -step && this.editor.scale > 0.2) {
				var newScale = this.editor.scale + ds;
				if(Math.abs(1 - newScale) < step)
					newScale = 1;
				this.editor.emouse.scaleFactor = scaleFactor;
				this.editor.zoom(newScale);
			}
		}
		
		this.editor.onmousemove({layerX: x, layerY: y, button: 0});
	};
	this.onmousemove = function(event) {
		// var p1 = GetPos(this.control);
		// var x = (event.clientX - p1.left)/this.scale;
		// var y = (event.clientY - p1.top)/this.scale;
		var x = event.layerX/this.scale;
		var y = event.layerY/this.scale;

		var obj = this.sdk.getObjectAtPos(x, y);
		this.showHintObject(obj, x, y);
		this.operations[this.emouse.state].move(this, x, y, obj);
		
		if(!this.isObjEqual(this.oldSelection, obj)) {
			if(this.oldSelection) {
				this.oldSelection.obj.unselect();
				this.oldSelection = null;
			}
			if(obj && obj.type === 2) {
				obj.obj.select();
				this.oldSelection = obj;
			}
			this.draw();
		}

		var cur = this.operations[this.emouse.state].cursor(this, x, y, obj, this.makeFlags(event));
		if (cur !== this.old_cursor) {
			this.control.style.cursor = cur;
			this.old_cursor = cur;
		}

		this.emouse.curX = x;
		this.emouse.curY = y;
	};

	this.control.onmouseup = function(event) { this.editor.onmouseup(event); };
	this.control.ontouchend = function(event) {
		event.preventDefault();
		var p1 = GetPos(this);
		var x = event.changedTouches[0].clientX - p1.left;
		var y = event.changedTouches[0].clientY - p1.top;
		this.editor.onmouseup({layerX: x, layerY: y, button: 0});
	};
	this.onmouseup = function (event) {
		// var p1 = GetPos(this.control);
		// var x = (event.clientX - p1.left)/this.scale;
		// var y = (event.clientY - p1.top)/this.scale;
		var x = event.layerX/this.scale;
		var y = event.layerY/this.scale;
		var b = event.button;

		var obj = this.sdk.getObjectAtPos(x, y);
		if(this.operations[this.emouse.state].up(this, x, y, b, obj, this.makeFlags(event))) {
			this.endOperation();
		}
		this.updateScrolls();
		this.draw();

		this.control.style.cursor = this.operations[this.emouse.state].cursor(this, x, y, obj);
	};
	this.control.ondblclick = function() { this.editor.ondblclick(); };
	this.ondblclick = function() {
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
	};
	
	this.showHintObject = function(obj, x, y) {
		if (obj) {
			if(obj.type === OBJ_TYPE_ELEMENT) {
				var h = this.hint.body();
				var element = obj.obj;
				h.n("div").class("header").html(element.name);
				h.n("div").html(this.sdk.pack.translate(element.info));
				var footer = null;
				for(var i in element.props) {
					var prop = element.props[i];
					if(!prop.isDef()) {
						if(!footer) {
							footer = h.n("div").class("footer");
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
				var header = h.n("div").class("header");
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
	};
	
	this.draw = function () {
		this.ctx.clearRect(0, 0, this.control.offsetWidth, this.control.offsetHeight);

		this.ctx.save();
		if(this.scale != 1) {
			this.ctx.scale(this.scale, this.scale);
		}

		this.ctx.translate(0.5, 0.5);
		// sdk
		this.sdk.draw(this.ctx);

		// operations
		switch (this.emouse.state) {
			case window.ME_POINTLINK:
			case window.ME_ADDELEMENT_POINT:
				this.ctx.strokeStyle = "#555";
				this.ctx.drawLine(this.emouse.startX, this.emouse.startY, this.emouse.curX, this.emouse.curY);
				break;
			case window.ME_SELRECT:
				var x1 = Math.min(this.emouse.startX, this.emouse.curX);
				var y1 = Math.min(this.emouse.startY, this.emouse.curY);
				var x2 = Math.max(this.emouse.startX, this.emouse.curX);
				var y2 = Math.max(this.emouse.startY, this.emouse.curY);

				this.ctx.fillStyle = "rgba(100,200,255,0.4)";
				this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
				this.ctx.strokeStyle = "#aaa";
				this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
				break;
			case window.ME_SLIDE_DOWN:
				this.ctx.drawLine(0, this.emouse.curY, this.control.offsetWidth, this.emouse.curY);
				break;
			case window.ME_SLIDE_RIGHT:
				this.ctx.drawLine(this.emouse.curX, 0, this.emouse.curX, this.control.offsetHeight);
				break;
		}
		
		//this.ctx.translate(-0.5, -0.5);
		this.ctx.restore();
	};
	
	this.beginAddElement = function(obj) {
		this.emouse.obj = obj;
		this.emouse.state = ME_ADDELEMENT;
		
		if(this.sdk) {
			var c = document.createElement("canvas");
			var ctx = c.getContext("2d");
			c.width = c.height = ctx.width = ctx.height = 32;
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
	};
	/**
	 * Start mouse operation
	 * @param {number} operation
	 * @param {Object} obj
	 * @returns {undefined}
	 */
	this.beginOperation = function(operation, obj) {
		this.emouse.state = operation;
		this.emouse.obj = obj;
		if(this.operations[operation].begin) {
			this.operations[operation].begin(this);
		}
	};
	/**
	 * End mouse operation
	 * @returns {undefined}
	 */
	this.endOperation = function() {
		this.emouse.obj = null;
		this.emouse.state = ME_NONE;
	};
	
	this.loadFromText = function(text, fileName) {
		this.setFileName(fileName);
		this.sdk.load(text);
		this.endOperation();
		this.updateScrolls();
		this.draw();
	};
	
	this.getFileName = function() {
		var msdk = this.getMainSDK();
		return msdk.fileName;
	};
	
	this.setFileName = function(fileName) {
		this.getMainSDK().fileName = fileName;
	};
	
	this.showPopup = function(type, x, y, obj) {
		var p1 = GetPos(this.control);
		this.onpopupmenu(type, x*this.scale + p1.left, y*this.scale + p1.top, obj);
		this.hint.close();
	};
	
	this.showHint = function(x, y) {
		var p1 = GetPos(this.control);
		this.hint.show(x*this.scale + 16 + p1.left, y*this.scale + 16 + p1.top);
	};
	
	this.createNew = function() {
		this.sdk.clearProject();
		this.draw();
	};
	
	this.deleteSelected = function() {
		if(this.sdk.undo) {
			this.sdk.undo.delElement(this.sdk.selMan);
		}
		this.sdk.selMan.erase();
		this.draw();
		this.onsdkchange();
	};
	
	this.pasteX = 0;
	this.pasteY = 0;
	this.shiftIDs = function(sdk) {
		for(var i in sdk.imgs) {
			var e = sdk.imgs[i];
			e.eid = this.sdk.getNextID();
			if(e.sdk) {
				this.shiftIDs(e.sdk);
			}
		}
	};
	this.pasteFromText = function(text) {
		this.sdk.selMan.clear();
		var sdk = new SDK(this.sdk.pack);
		sdk.load(text);
		var dx = 32768, dy = 32768;
		for(var i in sdk.imgs) {
			var e = sdk.imgs[i];
			e.eid = this.sdk.getNextID();
			e.parent = this.sdk;
			if(e.sdk) {
				e.sdk.parent = this.sdk;
				this.shiftIDs(e.sdk);
			}
			this.sdk.imgs.push(e);
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
		for(var i in sdk.imgs) {
			sdk.imgs[i].move(dx, dy);
		}
		this.draw();
		this.onsdkchange();

		this.pasteX += POINT_SPACE;
		this.pasteY += POINT_SPACE;

		for(var e1 of this.sdk.imgs) {
			for(var e2 of this.sdk.imgs) {
				if(e1 != e2 && e1.eid == e2.eid)
					console.log("Dup:", e1, e2);
			}
		}
	};
	
	this.addElement = function(name, x, y) {
		var element = this.sdk.add(name, toStep(x), toStep(y));
		element.place(x, y);

		this.sdk.selMan.select(element);
		if(this.sdk.undo) {
			this.sdk.undo.addElement(element);
		}
		this.onsdkchange();
		return element;
	};
	
	this.selectAll = function() {
		this.sdk.selMan.selectAll();
		this.draw();
	};
	
	this.back = function() {
		if(this.canBack()) {
			this.edit(this.sdk.parent);
		}
	};
	
	this.forward = function() {
		if(this.canForward()) {
			var e = this.sdk.selMan.items[0];
			if(e.sdk) {
				this.edit(e.sdk);
				if(!window.history.state || window.history.state.eid !== e.eid) {
					window.history.pushState({eid: e.eid}, e.name);
				}
			}
		}
	};
	
	this.canBack = function() {
		return this.sdk && this.sdk.parent;
	};
	
	this.canForward = function() {
		if(this.sdk && this.sdk.selMan.size() === 1) {
			var e = this.sdk.selMan.items[0];
			if(e.sdk) {
				return true;
			}
		}
		
		return false;
	};
	
	this.canBringToFront = function() {
		return this.sdk.selMan.size() === 1 && this.sdk.imgs[this.sdk.imgs.length-1] !== this.sdk.selMan.items[0] && !(this.sdk.selMan.items[0].flags & IS_PARENT);
	};
	this.canSendToBack = function() {
		if(this.sdk.selMan.size() === 1) {
			var prevIndex = this.sdk.indexOf(this.sdk.selMan.items[0]);
			return prevIndex > 0 && !(this.sdk.selMan.items[0].flags & IS_PARENT) && !(this.sdk.imgs[prevIndex-1].flags & IS_PARENT);
		}
		
		return false;
	};
	this.bringToFront = function() {
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
	};
	this.sendToBack = function() {
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
	};
	
	this.run = function() {
		this.getMainSDK().run(window.FLAG_USE_RUN);
	};
	
	this.getMainSDK = function () {
		var s = this.sdk;
		while(s.parent) {
			s = s.parent;
		}
		return s;
	};
	
	this.canZoomIn = function(){
		return this.scale < 8;
	};
	this.canZoomOut = function(){
		return this.scale > 0.3;
	};
	this.zoomIn = function() {
		this.scale *= 2;
		this.draw();
	};
	
	this.zoomOut = function() {
		this.scale /= 2;
		this.updateScrolls();
		this.draw();
	};
	
	this.zoom = function(value) {
		var dx = value - this.scale;
		var oW = this.control.parentNode.offsetWidth/2*dx;
		var oH = this.control.parentNode.offsetHeight/2*dx;
		this.scale = value;
		if(dx < 0) {
			this.control.parentNode.scrollLeft += oW;
			this.control.parentNode.scrollTop += oH;
		}
		this.updateScrolls();
		if(dx > 0) {
			this.control.parentNode.scrollLeft += oW;
			this.control.parentNode.scrollTop += oH;
		}
		this.draw();
	};

	this.download = function(file) {
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
	};
	
	this.pasteLineElement = function(id) {
		var element = this.sdk.add(id, this.pasteX, this.pasteY);
		this.sdk.selMan.select(element);

		element.insertInLine(this.pasteObj.point, this.pasteObj.obj);
		
		this.onsdkchange();
		this.draw();
	};
}

SdkEditor.prototype = Object.create(UIControl.prototype);

//SdkEditor.prototype.getControl = function(){ return this.control; };

SdkEditor.prototype.setLineColor = function(color) {
	this.pasteObj.point.setColor(color);
	this.onsdkchange();
	this.draw();
};

SdkEditor.prototype.setLineInfo = function(data) {
	this.pasteObj.point.setInfo(data);
	this.onsdkchange();
	this.draw();
};

SdkEditor.prototype.resize = function(){
	if(this.sdk) {
		this.updateScrolls();
	    this.draw();
	}
};

SdkEditor.prototype.updateScrolls = function() {
	var params = this.sdk.getParams();
	var parent = this.control.parentNode;
	
	this.control.height = Math.max(params.y2*this.scale + POINT_SPACE*10, parent.offsetHeight - 20);
	this.control.width = Math.max(params.x2*this.scale + POINT_SPACE*10, parent.offsetWidth - 20);
};

SdkEditor.prototype.canUndo = function(){ return this.sdk.undo.canUndo(); };
SdkEditor.prototype.canRedo = function(){ return this.sdk.undo.canRedo(); };

SdkEditor.prototype.undo = function(){ this.sdk.undo.undo(); this.draw(); };
SdkEditor.prototype.redo = function(){ this.sdk.undo.redo(); this.draw(); };


SdkEditor.prototype.canFormEdit = function() {
	if(this.sdk.imgs.length && this.sdk.imgs[0].flags & IS_PARENT) {
		return true;
	}
	if(this.sdk.imgs.length > 1 && this.sdk.imgs[1].flags & IS_PARENT) {
		return true;
	}
	
	return false;
};

SdkEditor.prototype.getBuild = function() {
	var sdk = this.getMainSDK();
	return sdk.buildCounter || 0;
};

SdkEditor.prototype.build = function() {
	var sdk = this.getMainSDK();
	if(sdk.buildCounter)
		sdk.buildCounter++;
	else
		sdk.buildCounter = 1;
};