namespace Hion {

	interface MenuItem {
		title: string;
		info?: string;
		icon: number;
		checked: boolean;
		click();
	}
	export declare type MenuItemsList = Array<MenuItem>;
	
	class MenuItemElement extends HTMLElement {
		item: MenuItem;
		index: number;
	}

	export class PopupMenu {
		/** Call when menu was closed */
		onclose = () => {};
		/** Declare menu items as radio group */
		group: boolean;
		/** It is true if menu displayed on screen */
		opened: boolean;
		private body: Builder;
		private hint: Hint;

		constructor (items: MenuItemsList) {
			this.group = false;
			
			let body = new Builder().div("popup").on("oncontextmenu", () => false);
			this.body = body;

			this.hint = new Hint();
			
			for(let i in items) {
				let item = items[i];
				if(item.title === "-") {
					body.div("splitter");
				}
				else {
					let popupItem = body.n("div").class("item").attr("item", item).attr("index", i);

					if(item.checked)
						popupItem.htmlAttr("checked", true);
			
					let icon = item.icon || 0;
					popupItem.div("icon").style("backgroundPosition", "-" + (icon % 16)*16 + "px -" + (icon >> 4)*16 + "px");
					popupItem.span("title").html(item.title);
					popupItem.on("onclick", () => this.click(popupItem.element as MenuItemElement));
					popupItem.on("onmouseenter", () => {
						if(item.info) {
							let x = this.body.element.offsetLeft + this.body.element.offsetWidth + 5;
							let y = this.body.element.offsetTop + popupItem.element.offsetTop;
							if(x > window.innerWidth - 320)
								x = window.innerWidth - 320;
							this.hint.body().html(item.info);
							this.hint.show(x, y);
						}
					});
					popupItem.on("onmouseleave", () => this.hint.close());
				}
			}
		}

		private click(menuItem: MenuItemElement) {
			menuItem.item.click();
			this.select(menuItem.index);
			this.close();
		}

		handleEvent = (event: MouseEvent) => {
			if(event.clientX < this.body.element.offsetLeft || event.clientY < this.body.element.offsetTop || event.clientX > this.body.element.offsetLeft + this.body.element.offsetWidth || event.clientY > this.body.element.offsetTop + this.body.element.offsetHeight) {
				this.close();
			}
		}

		/** Show menu on screen at (x, y) pos */
		up(x: number, y: number) {
			let popup = this.body.element;
			this.body.render();
			if(y + popup.offsetHeight > window.innerHeight) {
				y = window.innerHeight - popup.offsetHeight;
			}
			if(x + popup.offsetWidth > window.innerWidth) {
				x = window.innerWidth - popup.offsetWidth;
			}
			this.body.move(x, y);
		
			document.addEventListener("mousedown", this.handleEvent, false);
			this.opened = true;
		}

		/** Close menu if opened */
		close() {
			if(this.opened) {
				this.opened = false;
				document.removeEventListener("mousedown", this.handleEvent, false);
				this.body.erase();
				this.onclose();
			}
		}

		select(index: number) {
			if(this.group) {
				for(let i = 0; i < this.size(); i++) {
					this.checked(i, i == index);
				}
			}
		}

		/** Number of menu items */
		size(): number {
			return this.body.childs();
		}

		/** Enable menu item */
		enabled(index: number, value: boolean) {
			this.body.child(index).setAttribute("enabled", value.toString());
		}

		checked(index: number, value: boolean) {
			this.body.child(index).setAttribute("checked", value.toString());
		}

		getItem(index: number) {
			return (this.body.child(index) as MenuItemElement).item;
		}

		each(callback:(this, index: number, item: HTMLElement) => void) {
			for(let i = 0; i < this.body.childs(); i++) {
				let item = (this.body.child(i) as MenuItemElement).item;
				if(item) {
					callback.call(this, i, item);
				}
			}
		}
	}
}