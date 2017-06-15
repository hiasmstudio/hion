namespace Hion {
	const enum FormOperationState {
		FRM_NONE,
		FRM_MOVE,
		FRM_SIZE,
		FRM_SIZE1,
		FRM_SIZE2,
		FRM_SIZE3,
		FRM_SIZE4,
		FRM_SIZE5,
		FRM_SIZE6,
		FRM_SIZE7,
		FRM_SELECT,
		FRM_SIZE_PARENT,
		FRM_SIZE_PARENT1,
		FRM_SIZE_PARENT2,
		FRM_ADD_ELEMENT
	}

	interface FEItem {
		el: SdkElement;
		ctl: any; // UIElement
	}
	class FormState {
		dctrl: FEItem[];
		x: number;
		y: number;
		startX: number;
		startY: number;
		state: FormOperationState;
		obj: any;

		constructor() {
			this.x = 0;
			this.y = 0;
			this.dctrl = null;
			this.state = FormOperationState.FRM_NONE;
		}
	}

	var frm_ms:FormState = new FormState();

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

	export class FormEditor {
		private parentElement: WinContainer = null;
		private ctrl:FEItem[] = null;
		private sdk: SDK;
		private dlg: any;
		private bindFlags: number;
		private parentGripActive: number;
		
		// Элементы управления формы
		/** Parent container */
		private editor: Panel;
		/** Container for project ui controls */
		private elements: Panel;
		private mainContainer: Builder;
		/** Selection frame */
		private selector: Builder;
		/** Editors of sizes and positions of elements */
		private grips: Builder[];
		/** Editors of form sizes */
		private gripsParent: Builder[];
		/** Align rules */
		private nodes: Builder[] = [];
		private toolsLayer: Builder;

		constructor (private sdkEditor: SdkEditor) {
			this.editor = new Panel({theme: "form-editor"});
		}

		edit(sdk: SDK) {
			if(this.parentElement) {
				this.freeControls();
				this.parentElement = null;
				this.editor.free();
				return null;
			}
			
			this.sdk = sdk;
			sdk.onremoveelement = (e: SdkElement) => this.removeElement(e);

			for(var element of sdk.imgs) {
				if(element.flags | IS_PARENT && element.props.Width) {
					this.parentElement = element as WinContainer;
					break;
				}
			}
			if(!this.parentElement) {
				printError("Parent element not found!");
				return null;
			}
			
			// get parent element
			this.dlg = this.parentElement.run(FLAG_USE_EDIT);
			if(this.parentElement.props.Height.value === "") {
				this.dlg.height = "98%";
			}
			if(this.parentElement.props.Width.value === "") {
				this.dlg.width = "98%";
			}
			this.editor.add(this.dlg);

			// controls container
			this.elements = new Panel({theme: "frm-editor"});
			this.dlg.add(this.elements);
			
			// form editor tools
			this.mainContainer = new Builder(this.dlg.getContainer());
			this.mainContainer.style("backgroundImage", "url('img/back.gif')");
			
			this.selector = this.mainContainer.div("frm-ctl frm-edit-select").hide();
			this.toolsLayer = this.mainContainer.div("frm-top-ctl");
			this.createGrips();
			this.createParentGrips();

			this.toolsLayer.on("oncontextmenu", () => false);
			this.toolsLayer.on("ontouchstart", (event: TouchEvent) => {
				event.preventDefault();
				var x = event.touches[0].clientX;
				var y = event.touches[0].clientY;
				return this.toolsLayer.element.onmousedown({clientX: x, clientY: y, button: 0} as MouseEvent);
			});
			this.toolsLayer.on("onmousedown", this.handleToolsMouseDown);
			this.toolsLayer.on("ontouchmove", (event: TouchEvent) => {
				event.preventDefault();
				
				var x = event.touches[0].clientX;
				var y = event.touches[0].clientY;
				this.toolsLayer.element.onmousemove({clientX: x, clientY: y, button: 0} as MouseEvent);
			});
			this.toolsLayer.on("onmousemove", this.handleToolsMouseMove);
			this.toolsLayer.on("ontouchend", (event: TouchEvent) => {
				event.preventDefault();
				
				var x = event.changedTouches[0].clientX;
				var y = event.changedTouches[0].clientY;
				this.toolsLayer.element.onmouseup({clientX: x, clientY: y, button: 0} as MouseEvent);
			});
			this.toolsLayer.on("onmouseup", this.handleToolsMouseUp);
			
			this.dlg.show();

			return this.editor;
		}

		// Tools layer operations ------------------------------------------------------
		private handleToolsMouseDown = (event: MouseEvent): boolean => {
			var p1 = GetPos(this.toolsLayer.element);
			var x = event.clientX;
			var y = event.clientY;
			var rx = x - p1.left;
			var ry = y - p1.top;

			frm_ms.startX = frm_ms.x = x;
			frm_ms.startY = frm_ms.y = y;
			if(frm_ms.state === FormOperationState.FRM_NONE) {
				var arr = this.getControlByPos(rx-2, ry-2);
				if(arr && this.isSelect(arr[0])) {
					frm_ms.state = FormOperationState.FRM_MOVE;
				}
				else if(arr) {
					frm_ms.dctrl = arr;
					this.sdk.selMan.select(arr[0].el);
					this.sdk.ondraw();
					frm_ms.state = FormOperationState.FRM_MOVE;
				}
				else {
					this.selectHide();
					this.sdk.selMan.select(this.parentElement);
					frm_ms.dctrl = null;
					if(event.button === 0) {
						frm_ms.state = FormOperationState.FRM_SELECT;
						this.selector.move(rx, ry).size(0, 0);
						this.selector.show();
						this.sdk.ondraw();
					}
				}
			}
			else if(frm_ms.state === FormOperationState.FRM_ADD_ELEMENT) {
				this.sdkEditor.addElement(frm_ms.obj, rx, ry);
				palette.unSelect();
			}
			return false;
		}

		private handleToolsMouseMove = (event: MouseEvent): boolean => {
			var dx = toStep(event.clientX - frm_ms.x);
			var dy = toStep(event.clientY - frm_ms.y);
			switch(frm_ms.state) {
				case FormOperationState.FRM_NONE:
					break;
				case FormOperationState.FRM_MOVE:
					if(dx||dy) {
						this.moveSelection(dx, dy);
						this.updateLines();
						this.selectForEdit(frm_ms.dctrl);
						frm_ms.x += dx;
						frm_ms.y += dy;
					}
					break;
				case FormOperationState.FRM_SELECT:
					var p1 = GetPos(this.toolsLayer.element);
					var s = this.selector.element;
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
				case FormOperationState.FRM_SIZE_PARENT:
				case FormOperationState.FRM_SIZE_PARENT1:
				case FormOperationState.FRM_SIZE_PARENT2:
					break;
				case FormOperationState.FRM_ADD_ELEMENT:
					break;
				default:
					if(dx||dy) {
						for(var obj of frm_ms.dctrl) {
							var p = obj.el.props;
							if(frm_ms.state === FormOperationState.FRM_SIZE || frm_ms.state === FormOperationState.FRM_SIZE6 || frm_ms.state === FormOperationState.FRM_SIZE7) {
								p.Left.setValue(Math.max(p.Left.value + dx, 0));
								p.Width.setValue(Math.max(parseInt(p.Width.value) - dx, 1));
							}
							if(frm_ms.state <= FormOperationState.FRM_SIZE2) {
								p.Top.setValue(Math.max(p.Top.value + dy, 0));
								p.Height.setValue(Math.max(parseInt(p.Height.value) - dy, 1));
							}
							if(frm_ms.state >= FormOperationState.FRM_SIZE2 && frm_ms.state <= FormOperationState.FRM_SIZE4) {
								p.Width.setValue(Math.max(parseInt(p.Width.value) + dx, 1));
							}
							if(frm_ms.state >= FormOperationState.FRM_SIZE4 && frm_ms.state <= FormOperationState.FRM_SIZE6) {
								p.Height.setValue(Math.max(parseInt(p.Height.value) + dy, 1));
							}
							obj.ctl.move(p.Left.value, p.Top.value);
							obj.ctl.height = p.Height.value;
							obj.ctl.width = p.Width.value;
							obj.el.onformeditorupdate();
						}
						this.updateLines();
						this.selectForEdit(frm_ms.dctrl);
						frm_ms.x += dx;
						frm_ms.y += dy;
					}
					break;
			}
			return true;
		}

		private handleToolsMouseUp = (event: MouseEvent): boolean => {
			if(frm_ms.state === FormOperationState.FRM_SELECT) {
				frm_ms.dctrl = this.getControlsInRect(
					this.selector.element.offsetLeft,
					this.selector.element.offsetTop,
					this.selector.element.offsetLeft + this.selector.element.offsetWidth,
					this.selector.element.offsetTop + this.selector.element.offsetHeight );
				this.selector.hide();
			}
			if(event.button === 2) {
				if(frm_ms.dctrl) {
					popupElement.up(event.clientX, event.clientY);
				}
			}
			frm_ms.state = FormOperationState.FRM_NONE;
			this.toolsLayer.parent().style("cursor", "");
			
			this.updateSelection();
			this.clearLines();

			return true;
		}
		// ------------------------------------------------------------

		private freeControls() {
			this.sdk.stop(FLAG_USE_EDIT);
		}

		private createGrips() {
			this.grips = [];
			for(let i = 0; i < 8; i++) {
				let d = this.mainContainer.div("frm-ctl frm-edit-grip").id("sz" + i).hide();
				d.attr("num", i);
				d.style("cursor", ["nw","n","ne","e","se","s","sw","w"][i] + "-resize");
				d.on("ontouchstart", function(event: TouchEvent) {
					event.preventDefault();
					var x = event.touches[0].clientX;
					var y = event.touches[0].clientY;
					return this.onmousedown({clientX: x, clientY: y, button: 0});
				});
				d.on("ontouchmove", (event: TouchEvent) => {
					event.preventDefault();
					
					var x = event.touches[0].clientX;
					var y = event.touches[0].clientY;
					this.toolsLayer.element.onmousemove({clientX: x, clientY: y, button: 0} as MouseEvent);
				});
				d.on("ontouchend", function(event: TouchEvent) {
					event.preventDefault();
					
					var x = event.changedTouches[0].clientX;
					var y = event.changedTouches[0].clientY;
					this.onmouseup({clientX: x, clientY: y, button: 0});
				});

				d.on("onmousedown", function(event: MouseEvent) {
					this.parentNode.style.cursor = this.style.cursor;
					frm_ms.x = event.clientX;
					frm_ms.y = event.clientY;
					frm_ms.state = FormOperationState.FRM_SIZE + this.num;
					return false;
				});
				d.on("onmouseup", () => {
					frm_ms.state = FormOperationState.FRM_NONE;
					this.mainContainer.style("cursor", "");
					this.updateSelection();
					this.clearLines();
				});
				this.grips.push(d);
			}
		}

		private handleParentGripMove = (event: MouseEvent) => {
			let p = this.parentElement.props;
			if(!p.Width.value) {
				p.Width.value = this.dlg.getControl().offsetWidth;
			}
			if(!p.Height.value) {
				p.Height.value = this.dlg.getControl().offsetHeight;
			}
			if(this.parentGripActive < 2) {
				p.Width.value = parseInt(p.Width.value) + event.screenX - frm_ms.x;
			}
			if(this.parentGripActive > 0) {
				p.Height.value = parseInt(p.Height.value) + event.screenY - frm_ms.y;
			}
			this.dlg.width = p.Width.value;
			this.dlg.height = p.Height.value;
			frm_ms.x = event.screenX;
			frm_ms.y = event.screenY;
			this.moveParentGrips();
			this.updateSelection();
		}
		
		private handleParentGripUp = (event: MouseEvent) => {
			this.gripsParent[this.parentGripActive].parent().style("cursor", "");
			frm_ms.state = FormOperationState.FRM_NONE;
			document.removeEventListener("mousemove", this.handleParentGripMove);
			document.removeEventListener("mouseup", this.handleParentGripUp);
		}

		private moveParentGrips() {
			let i = 0;
			for(let grip of this.gripsParent) {
				let c = this.dlg.getControl();
				let x = c.offsetLeft;
				let y = c.offsetTop;
				
				switch(i++) {
					case 0: x += c.offsetWidth; y += c.offsetHeight/2; break;
					case 1: x += c.offsetWidth; y += c.offsetHeight; break;
					case 2: x += c.offsetWidth/2; y += c.offsetHeight; break;
				}
				
				grip.move(x, y);
			}
		}

		private createParentGrips() {
			this.gripsParent = [];
			var container = this.editor.getContainer();
			for(let i = 0; i < 3; i++) {
				let d = new Builder(container).div("frm-ctl frm-edit-grip");
				d.style("cursor", ["e","se","s"][i] + "-resize");
				d.on("onmousedown", (event) => {
					container.style.cursor = d.element.style.cursor;
					this.parentGripActive = i;
					frm_ms.x = event.screenX;
					frm_ms.y = event.screenY;
					document.addEventListener("mousemove", this.handleParentGripMove);
					document.addEventListener("mouseup", this.handleParentGripUp);
				});

				this.gripsParent.push(d);
			}
		}
		
		update() {
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
					var e = element.run(FLAG_USE_EDIT);
					if(e) {
						this.elements.add(e);
						if(element.sdk) {
							element = element.sdk.imgs[1];
						}
						var control:FEItem = {el: element, ctl: e};
						this.ctrl.push(control);
						
						if(element.isSelect()) {
							selected.push(control);
						}
						element.onformeditorupdate();
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
		}
		
		private updateSelection() {
			this.sdk.selMan.beginSelect();
			if(frm_ms.dctrl) {
				this.sdk.selMan.clear();
				for(var ctl of frm_ms.dctrl) {
					this.sdk.selMan.add(ctl.el);
				}
			}
			this.sdk.selMan.endSelect();
			this.sdk.ondraw();
		}
		
		private isSelect(ctl) {
			if(!frm_ms.dctrl) {
				return false;
			}
			for(var c of frm_ms.dctrl) {
				if(c === ctl) {
					return true;
				}
			}
			return false;
		}
		
		removeElement(element: SdkElement) {
			if(frm_ms.dctrl) {
				for(let i = 0; i < frm_ms.dctrl.length; i++) {
					let c = frm_ms.dctrl[i];
					if(c.el === element) {
						c.ctl.free();
						if(frm_ms.dctrl.length === 1) {
							frm_ms.dctrl = null;
							this.selectHide();
						}
						else {
							frm_ms.dctrl.splice(i, 1);
							this.selectForEdit(frm_ms.dctrl);
						}
						break;
					}
				}
			}
		}
		
		private getControlByPos(x, y): FEItem[] {
			for(var i = this.ctrl.length-1; i >= 0; i--) {
				var p = this.ctrl[i].ctl;
				if(p.left <= x && p.left + p.width >= x && p.top <= y && p.top + p.height >= y)
					return [this.ctrl[i]];
			}
			return null;
		}
		
		private getControlsInRect(x1, y1, x2, y2): FEItem[] {
			var result = [];
			for(var c of this.ctrl) {
				var p = c.ctl;
				if(!(p.left > x2 || p.left + p.width < x1 || p.top > y2 || p.top + p.height < y1)) {
					result.push(c);
				}
			}
			return result.length ? result : null;
		}
		
		beginAddElement(obj, cursor) {
			this.dlg.getContainer().style.cursor = cursor;
			frm_ms.state = FormOperationState.FRM_ADD_ELEMENT;
			frm_ms.obj = obj;
		}

		setBindFlags(flags) {
			this.bindFlags = flags;
		}

		private selectHide() {
			for(var grip of this.grips) {
				grip.hide();
			}
		}

		private getRect(objs: FEItem[]) {
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
		}

		private selectForEdit(objs:FEItem[]) {
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
		}

		private moveSelection(dx, dy) {
			for(var obj of frm_ms.dctrl) {
				var p = obj.el.props;
				var chageHeight = false;
				var chageWidth = false;
				if(frm_ms.state === FormOperationState.FRM_MOVE) {
					p.Left.value = Math.max(p.Left.value + dx, 0);
					p.Top.value = Math.max(p.Top.value + dy, 0);
				}
				else {
					if(frm_ms.state === FormOperationState.FRM_SIZE || frm_ms.state === FormOperationState.FRM_SIZE6 || frm_ms.state === FormOperationState.FRM_SIZE7) {
						p.Left.value = Math.max(p.Left.value + dx, 0);
						p.Width.value = Math.max(parseInt(p.Width.value) - dx, 1);
						chageWidth = true;
					}
					if(frm_ms.state <= FormOperationState.FRM_SIZE2) {
						p.Top.value = Math.max(p.Top.value + dy, 0);
						p.Height.value = Math.max(parseInt(p.Height.value) - dy, 1);
						chageHeight = true;
					}
					if(frm_ms.state >= FormOperationState.FRM_SIZE2 && frm_ms.state <= FormOperationState.FRM_SIZE4) {
						p.Width.value = Math.max(parseInt(p.Width.value) + dx, 1);
						chageWidth = true;
					}
					if(frm_ms.state >= FormOperationState.FRM_SIZE4 && frm_ms.state <= FormOperationState.FRM_SIZE6) {
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
		}

		private clearLines() {
			for(let n of this.nodes) {
				this.mainContainer.element.removeChild(n.element);
			}
			this.nodes = [];
		}

		private updateLines() {
			
			if(this.bindFlags === 0) return;
			
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
			
			var points:{x: number, y: number}[] = [];
			if(frm_ms.state === FormOperationState.FRM_MOVE || frm_ms.state === FormOperationState.FRM_SIZE || frm_ms.state === FormOperationState.FRM_SIZE1 || frm_ms.state === FormOperationState.FRM_SIZE2 || frm_ms.state === FormOperationState.FRM_SIZE6 || frm_ms.state === FormOperationState.FRM_SIZE7)
				points.push({x: rect.x1, y: rect.y1});
			if(frm_ms.state === FormOperationState.FRM_MOVE)
				points.push({x: (rect.x1 + rect.x2)/2, y: (rect.y1 + rect.y2)/2});
			if(frm_ms.state === FormOperationState.FRM_MOVE || frm_ms.state === FormOperationState.FRM_SIZE2 || frm_ms.state === FormOperationState.FRM_SIZE3 || frm_ms.state === FormOperationState.FRM_SIZE4 || frm_ms.state === FormOperationState.FRM_SIZE5 || frm_ms.state === FormOperationState.FRM_SIZE6)
				points.push({x: rect.x2, y: rect.y2});
			var xAzis = false;
			var yAzis = false;
			for(var ctl of this.ctrl) {
				if(!ctl.el.isSelect()) {
					for(var p of points) {
						var edges = getEdges(p.x, p.y, ctl);
						if(edges.x > -1 && !xAzis) {
							xAzis = true;
							var node = new Builder().div("frm-ctl axis-x");
							node.move(edges.x, 0);
							this.mainContainer.element.insertBefore(node.element, this.selector.element);
							this.nodes.push(node);
							this.moveSelection(edges.x - p.x, 0);
						}
						if(edges.y > -1 && !yAzis) {
							yAzis = true;
							var node = new Builder().div("frm-ctl axis-y");
							node.move(0, edges.y);
							this.mainContainer.element.insertBefore(node.element, this.selector.element);
							this.nodes.push(node);
							this.moveSelection(0, edges.y - p.y);
						}
					}
				}
			}
		}
	}
}