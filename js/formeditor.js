'use strict';

var FRM_NONE  = 0;
var FRM_MOVE  = 1;
var FRM_SIZE  = 2;
var FRM_SIZE1 = 3;
var FRM_SIZE2 = 4;
var FRM_SIZE3 = 5;
var FRM_SIZE4 = 6;
var FRM_SIZE5 = 7;
var FRM_SIZE6 = 8;
var FRM_SIZE7 = 9;
var FRM_SELECT  = 10;
var FRM_SIZE_PARENT  = 11;
var FRM_SIZE_PARENT1  = 12;
var FRM_SIZE_PARENT2  = 13;
var FRM_ADD_ELEMENT  = 14;

var frm_ms = {dctrl:null, x:0, y:0, state: FRM_NONE};

function sizerDown(num, obj, x, y) {
	frm_ms.x = x;
	frm_ms.y = y;

	frm_ms.state = FRM_SIZE + num;
	return false;
}

function sizerParentDown(num, obj, x, y) {
	frm_ms.x = x;
	frm_ms.y = y;

	frm_ms.state = FRM_SIZE_PARENT + num;
	return false;
}

function placeCtl(ctl, pos) {
	ctl.className += " frm-ctl";
	ctl.style.left = pos.Left.value.toString() + "px";
	ctl.style.top = pos.Top.value.toString() + "px";
	ctl.style.width = pos.Width.value.toString() + "px";
	ctl.style.height = pos.Height.value.toString() + "px";
	if(pos.Hint.value) {
		ctl.title = pos.Hint.value;
	}
}

function frmEditMove(event) {
	var dx = toStep(event.clientX - frm_ms.x);
	var dy = toStep(event.clientY - frm_ms.y);
	switch(frm_ms.state) {
		case FRM_NONE:
			break;
		case FRM_MOVE:
			if(dx||dy) {
				this.formEditor.moveSelection(dx, dy);
				this.formEditor.updateLines();
				this.formEditor.selectForEdit(frm_ms.dctrl);
				frm_ms.x += dx;
				frm_ms.y += dy;
			}
			break;
		case FRM_SELECT:
			var p1 = GetPos(this);
			var s = this.formEditor.selector;
			var dx = event.clientX - frm_ms.startX;
			var dy = event.clientY - frm_ms.startY;
			if(dx < 0) {
				s.style.left = (event.clientX - p1.left) + "px";
			}
			if(dy < 0) {
				s.style.top = (event.clientY - p1.top) + "px";
			}
			s.style.width = Math.abs(dx) + "px"
			s.style.height = Math.abs(dy) + "px"
			break;
		case FRM_SIZE_PARENT:
		case FRM_SIZE_PARENT1:
		case FRM_SIZE_PARENT2:
			break;
		case FRM_ADD_ELEMENT:
			break;
		default:
			if(dx||dy) {
				for(var obj of frm_ms.dctrl) {
					var p = obj.el.props;
					if(frm_ms.state === FRM_SIZE || frm_ms.state === FRM_SIZE6 || frm_ms.state === FRM_SIZE7) {
						p.Left.value = Math.max(p.Left.value + dx, 0);
						p.Width.value = Math.max(parseInt(p.Width.value) - dx, 1);
					}
					if(frm_ms.state <= FRM_SIZE2) {
						p.Top.value = Math.max(p.Top.value + dy, 0);
						p.Height.value = Math.max(parseInt(p.Height.value) - dy, 1);
					}
					if(frm_ms.state >= FRM_SIZE2 && frm_ms.state <= FRM_SIZE4) {
						p.Width.value = Math.max(parseInt(p.Width.value) + dx, 1);
					}
					if(frm_ms.state >= FRM_SIZE4 && frm_ms.state <= FRM_SIZE6) {
						p.Height.value = Math.max(parseInt(p.Height.value) + dy, 1);
					}
					obj.ctl.move(p.Left.value, p.Top.value);
					obj.ctl.height = p.Height.value;
					obj.ctl.width = p.Width.value;
				}
				this.formEditor.updateLines();
				this.formEditor.selectForEdit(frm_ms.dctrl);
				frm_ms.x += dx;
				frm_ms.y += dy;
			}
			break;
	}
	return true;
}

function FormEditor(sdkEditor) {

	this.ctrl = null;
	this.parentElement = null;
	
	this.editor = new Panel({theme: "form-editor"});

	this.edit = function(sdk) {
		
		if(this.parentElement) {
			this.freeControls();
			this.parentElement = null;
			this.editor.free();
			return;
		}
		
		this.sdk = sdk;
		var __editor__ = this;
		sdk.onremoveelement = function(e) {
			__editor__.removeElement(e);
		};

		this.parentElement = null;
		for(var element of sdk.imgs) {
			if(element.flags | window.IS_PARENT > 0 && element.props.Width) {
				this.parentElement = element;
				break;
			}
		}
		if(!this.parentElement) {
			printError("Parent element not found!");
			return null;
		}
		
		this.dlg = this.parentElement.run(window.FLAG_USE_EDIT);
		if(this.parentElement.props.Height.value === "") {
			this.dlg.height = "98%";
		}
		if(this.parentElement.props.Width.value === "") {
			this.dlg.width = "98%";
		}
		this.editor.add(this.dlg);

		this.elements = new Panel({theme: "frm-editor"});
		this.dlg.add(this.elements);
		
		var body = this.dlg.getContainer();
		body.style.backgroundImage = "url('img/back.gif')";
		
		this.selector = document.createElement("div");
		this.selector.hide();
		this.selector.className = "frm-ctl frm-edit-select";
		body.appendChild(this.selector);
		
		var ctl = document.createElement("div");
		ctl.className = "frm-top-ctl";
		ctl.formEditor = this;
		body.appendChild(ctl);
		
		// grips
		this.grips = [];
		for(var i = 0; i < 8; i++) {
			var d = document.createElement("div");
			d.hide();
			d.className = "frm-ctl frm-edit-grip";
			d.id = "sz" + i;
			d.num = i;
			d.style.cursor = ["nw","n","ne","e","se","s","sw","w"][i] + "-resize";
			d.ontouchstart = function(event) {
				event.preventDefault();
				var x = event.touches[0].clientX;
				var y = event.touches[0].clientY;
				return this.onmousedown({clientX: x, clientY: y, button: 0});
			};
			d.onmousedown = function(event) {
				this.parentNode.style.cursor = this.style.cursor;
				return sizerDown(this.num, this.parentNode.lastChild, event.clientX, event.clientY);
			};
			d.ontouchmove = function(event) {
				event.preventDefault();
				
				var x = event.touches[0].clientX;
				var y = event.touches[0].clientY;
				ctl.onmousemove({clientX: x, clientY: y, button: 0});
			};
			d.ontouchend = function(event) {
				event.preventDefault();
				
				var x = event.changedTouches[0].clientX;
				var y = event.changedTouches[0].clientY;
				this.onmouseup({clientX: x, clientY: y, button: 0});
			};
			d.onmouseup = function() {
				frm_ms.state = FRM_NONE;
				this.parentNode.style.cursor = "";
				__editor__.updateSelection();
				__editor__.clearLines();
			};
			body.appendChild(d);
			this.grips.push(d);
		}
		
		// grips parent
		this.gripsParent = [];
		for(var i = 0; i < 3; i++) {
			var f = function(d){
				d.className = "frm-ctl frm-edit-grip";
				d.num = i;
				d.style.cursor = ["e","se","s"][i] + "-resize";
				d._move = function(event) {
					var p = __editor__.parentElement.props;
					if(!p.Width.value) {
						p.Width.value = __editor__.dlg.getControl().offsetWidth;
					}
					if(!p.Height.value) {
						p.Height.value = __editor__.dlg.getControl().offsetHeight;
					}
					if(d.num < 2) {
						p.Width.value = parseInt(p.Width.value) + event.screenX - frm_ms.x;
					}
					if(d.num > 0) {
						p.Height.value = parseInt(p.Height.value) + event.screenY - frm_ms.y;
					}
					__editor__.dlg.width = p.Width.value;
					__editor__.dlg.height = p.Height.value;
					frm_ms.x = event.screenX;
					frm_ms.y = event.screenY;
					__editor__.moveParentGrips();
					__editor__.updateSelection();
				};
				d._up = function() {
					d.parentNode.style.cursor = "";
					frm_ms.state = FRM_NONE;

					document.removeEventListener("mousemove", d._move);
					document.removeEventListener("mouseup", d._up);
				};
				d.onmousedown = function(event) {
					this.parentNode.style.cursor = this.style.cursor;
					frm_ms.x = event.screenX;
					frm_ms.y = event.screenY;
					document.addEventListener("mousemove", this._move);
					document.addEventListener("mouseup", this._up);
				};
				__editor__.editor.getContainer().appendChild(d);
				__editor__.gripsParent.push(d);
			}(document.createElement("div"));
		}

		ctl.oncontextmenu = function(){ return false; };
		
		ctl.ontouchstart = function(event) {
			event.preventDefault();
			var x = event.touches[0].clientX;
			var y = event.touches[0].clientY;
			return ctl.onmousedown({clientX: x, clientY: y, button: 0});
		};
		ctl.onmousedown = function(event) {
			var p1 = GetPos(this);
			var x = event.clientX;
			var y = event.clientY;
			var rx = x - p1.left;
			var ry = y - p1.top;

			frm_ms.startX = frm_ms.x = x;
			frm_ms.startY = frm_ms.y = y;
			if(frm_ms.state === FRM_NONE) {
				var arr = this.formEditor.getControlByPos(rx-2, ry-2);
				if(arr && this.formEditor.isSelect(arr[0])) {
					frm_ms.state = FRM_MOVE;
				}
				else if(arr) {
					frm_ms.dctrl = arr;
					sdk.selMan.select(arr[0].el);
					sdk.ondraw();
					frm_ms.state = FRM_MOVE;
				}
				else {
					this.formEditor.selectHide();
					sdk.selMan.select(this.formEditor.parentElement);
					frm_ms.dctrl = null;
					if(event.button === 0) {
						frm_ms.state = FRM_SELECT;
						this.formEditor.selector.move(rx, ry).height(0).width(0);
						this.formEditor.selector.show();
						this.formEditor.sdk.ondraw();
					}
				}
			}
			else if(frm_ms.state === FRM_ADD_ELEMENT) {
				sdkEditor.addElement(frm_ms.obj, rx, ry);
				window.palette.unSelect();
			}
			return false;
		};
		ctl.ontouchmove = function(event) {
			event.preventDefault();
			
			var x = event.touches[0].clientX;
			var y = event.touches[0].clientY;
			ctl.onmousemove({clientX: x, clientY: y, button: 0});
		};
		ctl.onmousemove = frmEditMove;
		ctl.ontouchend = function(event) {
			event.preventDefault();
			
			var x = event.changedTouches[0].clientX;
			var y = event.changedTouches[0].clientY;
			ctl.onmouseup({clientX: x, clientY: y, button: 0});
		};
		ctl.onmouseup = function(event) {
			if(frm_ms.state === FRM_SELECT) {
				frm_ms.dctrl = this.formEditor.getControlsInRect(
					this.formEditor.selector.offsetLeft,
					this.formEditor.selector.offsetTop,
					this.formEditor.selector.offsetLeft + this.formEditor.selector.offsetWidth,
					this.formEditor.selector.offsetTop + this.formEditor.selector.offsetHeight );
				this.formEditor.selector.hide();
			}
			if(event.button === 2) {
				if(frm_ms.dctrl) {
					popupElement.up(event.clientX, event.clientY);
				}
			}
			frm_ms.state = FRM_NONE;
			this.parentNode.style.cursor = "";
			
			this.formEditor.updateSelection();
			this.formEditor.clearLines();

			return true;
		};
		
		this.dlg.show();

		return this.editor;
	};
	
	this.freeControls = function() {
		this.sdk.stop(window.FLAG_USE_EDIT);
	};
	
	this.update = function() {
		if(this.parentElement === null) {
			return;
		}
		
		this.freeControls();
		
		this.elements.layout = this.parentElement.getLayout(this.elements);
		
		this.elements.removeAll();
		this.ctrl = [];
		var selected = [];
		for(var element of this.sdk.imgs) {
			if(element !== this.parentElement) {
				var e = element.run(window.FLAG_USE_EDIT);
				if(e) {
					this.elements.add(e);
					if(element.sdk) {
						element = element.sdk.imgs[1];
					}
					var control = {el: element, ctl: e};
					this.ctrl.push(control);
					
					if(element.isSelect()) {
						selected.push(control);
					}
				}
			}
		}

		if(selected.length) {
			frm_ms.dctrl = selected;
			this.selectForEdit(frm_ms.dctrl);
		}
		else {
			this.selectHide();
			frm_ms.dctrl = null;
		}
		
		this.moveParentGrips();
	};
	
	this.updateSelection = function() {
		this.sdk.selMan.beginSelect();
		if(frm_ms.dctrl) {
			this.sdk.selMan.clear();
			for(var ctl of frm_ms.dctrl) {
				this.sdk.selMan.add(ctl.el);
			}
		}
		this.sdk.selMan.endSelect();
		this.sdk.ondraw();
	};
	
	this.isSelect = function(ctl) {
		if(!frm_ms.dctrl) {
			return false;
		}
		for(var c of frm_ms.dctrl) {
			if(c === ctl) {
				return true;
			}
		}
		return false;
	};
	
	this.removeElement = function(element) {
		if(frm_ms.dctrl) {
			for(var c of frm_ms.dctrl) {
				if(c.el === element) {
					c.ctl.free();
					if(frm_ms.dctrl.length === 1) {
						frm_ms.dctrl = null;
						this.selectHide();
					}
					else {
						frm_ms.dctrl.pop(c);
						this.selectForEdit(frm_ms.dctrl);
					}
					break;
				}
			}
		}
	};
	
	this.getControlByPos = function(x, y) {
		for(var i = this.ctrl.length-1; i >= 0; i--) {
			var p = this.ctrl[i].ctl;
			if(p.left <= x && p.left + p.width >= x && p.top <= y && p.top + p.height >= y)
				return [this.ctrl[i]];
		}
		return null;
	};
	
	this.getControlsInRect = function(x1, y1, x2, y2) {
		var result = [];
		for(var c of this.ctrl) {
			var p = c.ctl;
			if(!(p.left > x2 || p.left + p.width < x1 || p.top > y2 || p.top + p.height < y1)) {
				result.push(c);
			}
		}
		return result.length ? result : null;
	};
	
	this.beginAddElement = function(obj, cursor) {
		this.dlg.getContainer().style.cursor = cursor;
		frm_ms.state = FRM_ADD_ELEMENT;
		frm_ms.obj = obj;
	};
}

FormEditor.prototype.setBindFlags = function(flags) {
	this.bindFlags = flags;
};

FormEditor.prototype.selectHide = function() {
	for(var grip of this.grips) {
		grip.hide();
	}
};

FormEditor.prototype.getRect = function(objs) {
	var x1 = 32768, y1 = 32768, x2 = 0, y2 = 0;
	for(var i in objs) {
		var o = objs[i].ctl;
		if(o.left < x1) {
			x1 = o.left;
		}
		if(o.left + o.width > x2) {
			x2 = o.left + o.width;
		}
		if(o.top < y1) {
			y1 = o.top;
		}
		if(o.top + o.height > y2) {
			y2 = o.top + o.height;
		}
	}
	
	return {x1:x1, y1:y1, x2:x2, y2:y2};
};

FormEditor.prototype.selectForEdit = function(objs) {
	var rect = this.getRect(objs);
	var w = (rect.x2-rect.x1) - 1;
	var h = (rect.y2-rect.y1) - 1;
	for(var i = 0; i < 8; i++) {
		var d = this.grips[i];
		var x = rect.x1 - 3;
		var y = rect.y1 - 3;
		switch(i) {
			case 1: x += w / 2; break;
			case 2: x += w; break;
			case 3: x += w; y += h / 2; break;
			case 4: x += w; y += h; break;
			case 5: x += w / 2; y += h; break;
			case 6: y += h; break;
			case 7: y += h / 2; break;
		}
		d.move(x, y);
		d.show();
	}
};

FormEditor.prototype.moveParentGrips = function() {
	for(var grip of this.gripsParent) {
		var c = this.dlg.getControl();
		var x = c.offsetLeft;
		var y = c.offsetTop;
		
		switch(grip.num) {
			case 0: x += c.offsetWidth; y += c.offsetHeight/2; break;
			case 1: x += c.offsetWidth; y += c.offsetHeight; break;
			case 2: x += c.offsetWidth/2; y += c.offsetHeight; break;
		}
		
		grip.move(x, y);
	}
};

FormEditor.prototype.moveSelection = function(dx, dy) {
	for(var obj of frm_ms.dctrl) {
		var p = obj.el.props;
		var chageHeight = false;
		var chageWidth = false;
		if(frm_ms.state === FRM_MOVE) {
			p.Left.value = Math.max(p.Left.value + dx, 0);
			p.Top.value = Math.max(p.Top.value + dy, 0);
		}
		else {
			if(frm_ms.state === FRM_SIZE || frm_ms.state === FRM_SIZE6 || frm_ms.state === FRM_SIZE7) {
				p.Left.value = Math.max(p.Left.value + dx, 0);
				p.Width.value = Math.max(parseInt(p.Width.value) - dx, 1);
				chageWidth = true;
			}
			if(frm_ms.state <= FRM_SIZE2) {
				p.Top.value = Math.max(p.Top.value + dy, 0);
				p.Height.value = Math.max(parseInt(p.Height.value) - dy, 1);
				chageHeight = true;
			}
			if(frm_ms.state >= FRM_SIZE2 && frm_ms.state <= FRM_SIZE4) {
				p.Width.value = Math.max(parseInt(p.Width.value) + dx, 1);
				chageWidth = true;
			}
			if(frm_ms.state >= FRM_SIZE4 && frm_ms.state <= FRM_SIZE6) {
				p.Height.value = Math.max(parseInt(p.Height.value) + dy, 1);
				chageHeight = true;
			}
		}
		obj.ctl.move(p.Left.value, p.Top.value);
		if(chageHeight)
			obj.ctl.height = p.Height.value;
		if(chageWidth)
			obj.ctl.width = p.Width.value;
	}
};

FormEditor.prototype.clearLines = function() {
	if(this.nodes) {
		var body = this.dlg.getContainer();
		for(var n in this.nodes) {
			body.removeChild(this.nodes[n]);
		}
	}
	this.nodes = [];
};

FormEditor.prototype.updateLines = function() {
	
	if(this.bindFlags === 0) return;
	
	var body = this.dlg.getContainer();
	this.clearLines();
	
	var rect = this.getRect(frm_ms.dctrl);
	
	var bindFlags = this.bindFlags;
	function getEdges(x1, y1, ctl) {
		var props = ctl.el.props;
		var radius = 6;
		
		var ex1 = props.Left.value;
		var ex2 = props.Left.value + ctl.ctl.width;
		var ey1 = props.Top.value;
		var ey2 = props.Top.value + ctl.ctl.height;
		
		if(bindFlags & 0x4) {
			var bindPadding = 5;
			ex1 -= bindPadding;
			ey1 -= bindPadding;
			ex2 += bindPadding;
			ey2 += bindPadding;
		}

		var x = -1;
		var dx = 0;
		if(bindFlags & 0x5 && Math.abs(ex1 - x1) <= radius)
			x = ex1;
		else if(bindFlags & 0x5 && Math.abs(ex2 - x1) <= radius)
			x = ex2;
		else if(bindFlags & 0x2 && Math.abs(props.Left.value + Math.round(ctl.ctl.width/2) - x1) <= radius)
			x = Math.round(props.Left.value + ctl.ctl.width/2);

		var y = -1;
		if(bindFlags & 0x5 && Math.abs(ey1 - y1) <= radius)
			y = ey1;
		else if(bindFlags & 0x5 && Math.abs(ey2 - y1) <= radius)
			y = ey2;
		else if(bindFlags & 0x2 && Math.abs(props.Top.value + Math.round(ctl.ctl.height/2) - y1) <= radius)
			y = Math.round(props.Top.value + ctl.ctl.height/2);
				
		return {x:x, y:y}
	}
	
	var points = [];
	if(frm_ms.state === FRM_MOVE || frm_ms.state === FRM_SIZE || frm_ms.state === FRM_SIZE1 || frm_ms.state === FRM_SIZE2 || frm_ms.state === FRM_SIZE6 || frm_ms.state === FRM_SIZE7)
		points.push({x: rect.x1, y: rect.y1});
	if(frm_ms.state === FRM_MOVE)
		points.push({x: (rect.x1 + rect.x2)/2, y: (rect.y1 + rect.y2)/2});
	if(frm_ms.state === FRM_MOVE || frm_ms.state === FRM_SIZE2 || frm_ms.state === FRM_SIZE3 || frm_ms.state === FRM_SIZE4 || frm_ms.state === FRM_SIZE5 || frm_ms.state === FRM_SIZE6)
		points.push({x: rect.x2, y: rect.y2});
	var xAzis = false;
	var yAzis = false;
	for(var ctl of this.ctrl) {
		if(!ctl.el.isSelect()) {
			for(var p of points) {
				var edges = getEdges(p.x, p.y, ctl);
				if(edges.x > -1 && !xAzis) {
					xAzis = true;
					var node = new Builder().n("div").class("frm-ctl axis-x").element;
					node.move(edges.x, 0);
					body.insertBefore(node, this.selector);
					this.nodes.push(node);
					this.moveSelection(edges.x - p.x, 0);
				}
				if(edges.y > -1 && !yAzis) {
					yAzis = true;
					var node = new Builder().n("div").class("frm-ctl axis-y").element;
					node.move(0, edges.y);
					body.insertBefore(node, this.selector);
					this.nodes.push(node);
					this.moveSelection(0, edges.y - p.y);
				}
			}
		}
	}
};