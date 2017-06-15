namespace Hion {
	interface MainMenuItem {
		title: string;
		items: MenuItemsList;
	}
	declare type MainMenuItemsList = Array<MainMenuItem>;

	class MenuItemElement extends HTMLElement {
		menu: PopupMenu;
	}

	export class MainMenu {
		private opened: MenuItemElement;
		private body: Builder;

		constructor(items: MainMenuItemsList) {
			this.body = new Builder().div("mainmenu");
			
			this.opened = null;
			
			for(let i in items) {
				let item = items[i];
				let mainItem = this.body.div("item").html(item.title);
				let mainItemElement = mainItem.element as MenuItemElement;
				
				mainItem
					.on("open", () => this.open(mainItemElement))
					.on("close", () => this.close(mainItemElement))
					.on("onmouseover", () => this.opened ? this.open(mainItemElement) : 0)
					.on("onclick", () => this.open(mainItemElement));

				let menu = new Hion.PopupMenu(item.items);
				menu.onclose = () => this.close(mainItemElement);

				mainItem.attr("menu", menu);
			}
		}

		private close(item: MenuItemElement) {
			if(this.opened === item) {
				this.opened = null;
				item.className = "item";
				item.menu.close();
			}
		}

		private open(item: MenuItemElement) {
			if(this.opened)
				this.opened.menu.close();
			this.opened = item;
			item.className = "item active";
			item.menu.up(item.offsetLeft, item.offsetHeight);
		}
		
		menuItem(index: number): MenuItemElement {
			return this.body.child(index) as MenuItemElement;
		}

		getControl(): HTMLElement {
			return this.body.element;
		}
	}
}