namespace Hion {
	export class FileManager {
		private location: string;
		private selectOnly: boolean;
		public openSave: boolean;
		private selDir: string;
		onfilename = (fileName: string) => {};
		onerror = (error) => {};
		private form: Dialog;
		private fileName: Edit;
		private direction: Label;
		private address: Panel;
		private btn: Button;
		private places: ListBox;
		private listBox: UISimpleTable;

		constructor() {
			this.location = "/examples";
			
			this.form = new Dialog({
				resize: true,
				width: 540,
				height: 340,
				buttons: [{
					text: "Save/Open",
					click: (dialog) => this._openSave()
				}]
			});

			this.form.layout = new VLayout(this.form, {});
			
			var hpanel = new Panel({theme: "panel-clear"});
			hpanel.setLayoutOptions({shrink: 0});
			hpanel.layout.setOptions({padding: 5});
			this.fileName = new Edit({});
			this.fileName.setLayoutOptions({grow: 1});
			hpanel.add(new Label({caption: "File name: ", width: 100}));
			hpanel.add(this.fileName);
			this.form.add(hpanel);
			
			hpanel = new Panel({theme: "panel-clear"});
			hpanel.setLayoutOptions({shrink: 0});
			hpanel.layout.setOptions({padding: 5});
			hpanel.add(this.direction = new Label({width: 100}));
			
			this.address = new Panel({theme: "panel-clear"});
			this.address.setLayoutOptions({grow: 1});
			hpanel.add(this.address);
			
			this.btn = new Button({caption: "Create folder"});
			this.btn.addListener("click", () => {
				var folder = prompt("Enter folder name", "");
				if(folder) {
					var node = getFileNode(this.location + "/" + folder);
					node.mkdir((error) => {
						if(error) {
							this.onerror({code: error, info: node.location()});
						}
						else {
							this.navigate(node.location());
						}
					});
				}
			});
			hpanel.add(this.btn);
			this.form.add(hpanel);
			
			hpanel = new Panel({theme: "panel-clear"});
			hpanel.layout.setOptions({padding: 5});
			hpanel.setLayoutOptions({grow: 1});
			hpanel.add(this.places = new ListBox({theme: "borderin"}));
			this.places.width = 100;
			this.places.onselect = (item, text) => {
				if(!this.selectOnly)
					this.navigate("/" + text.toLowerCase());
			};
			
			this.listBox = new UISimpleTable({theme: "borderin", showgrid: false, lineheight: 13,
				columns: [
					{title: "", width: "22px", type: "image", align: "center"},
					{title: "File"},
					{title: "Size", width: "30px"},
					{title: "Date", width: "130px", align: "center"}
				]});
			this.listBox.tabIndex = 0;
			this.listBox.setLayoutOptions({grow: 1});
			this.listBox.onrowselect = (item, index) => {
				var text = item.data[1];
				if(item.data[4]) {
					if(!this.openSave) {
						this.fileName.text = "";
					}
					this.selDir = text;
				}
				else {
					this.fileName.text = text;
				}
			};
			this.listBox.onrowclick = (item, index) => {
				var text = item.data[1];
				if(item.data[4]) {
					if(text === "..") {
						this.navigate(this.location.substr(0, this.location.lastIndexOf("/")));
					}
					else {
						this.navigate(this.location + "/" + text);
					}
				}
				else {
					this._openSave();
				}
			};
			this.listBox.addListener("keydown", (event) => {
				if(event.keyCode === 46) {
					var row = this.listBox.getSelectionRow();
					if(row) {
						var node = getFileNode(this.location + "/" + row.data[1]);
						
						node.remove(function(error) {
							if(error) {
								this.onerror({code: error, info: node.location()});
							}
							else {
								this.listBox.removeSelection();
								if(row.index < this.listBox.size())
									this.listBox.selectIndex(row.index);
							}
						});
					}
				}
			});
			hpanel.add(this.listBox);
			
			this.form.add(hpanel);
		}
		
		private _openSave() {
			var text = this.fileName.text;
			if(text) {
				var fileName = this.location + "/" + text;
				this.onfilename(fileName);
			}
			else if(this.selDir) {
				this.navigate(this.location + "/" + this.selDir);
			}
		}

		setAddress(folder) {
			this.location = folder;
			
			var lines = folder.substr(1).split("/");
			this.address.removeAll();
			var addr = "";
			for(var l of lines) {
				addr += "/" + l;
				let btnAddr = addr;
				var btn = new Button({caption: l, theme: "button-dlg"});
				btn.addListener("click", () => this.navigate(btnAddr));
				this.address.add(btn);
			}
		}
		
		updateUser(){
			this.places.clear();
			this.places.addIcon("img/mime-folder.png", "Examples");
			if(user) {
				this.places.addIcon("img/mime-folder.png", "Home");
			}
			this.places.addIcon("img/mime-folder.png", "Local");
			if(user.uid === 3) {
				this.places.addIcon("img/mime-folder.png", "GUI");
			}
		}
		
		open() {
			this.openSave = false;
			this.form.caption = "Load project from file";
			this.direction.caption = "Load from folder:";
			this.form.getButton(0).innerHTML = "Open";
			this.fileName.text = "";
			this.btn.hide();
			this.navigate(this.location);
			this.form.show();
		}
		
		save(addr) {
			this.openSave = true;
			var iPos = addr.lastIndexOf("/");
			if(iPos > 0) {
				var file = addr.substr(iPos+1);
				this.fileName.text = file;
				var place = addr.substr(0, iPos);
				for(let i = 0; i < this.places.size(); i++) {
					if(place.startsWith("/" + this.places.items[i].toLowerCase())) {
						this.selectOnly = true;
						this.places.selectIndex(i);
						delete this.selectOnly;
						break;
					}
				}
				this.navigate(place);
			}
			else {
				this.navigate("/home");
				this.fileName.text = addr;
			}
			this.form.caption = "Save project to file";
			this.direction.caption = "Save in folder:";
			this.form.getButton(0).innerHTML = "Save";
			this.btn.show();
			this.form.show();
		}

		close() {
			this.form.close();
		}

		private _loadList(list: Array<FSNodeListItem>) {
			this.listBox.clear();

			for(var node of list) {
				var icon = node.isFile ? "img/mime-none.png" : "img/mime-folder.png";
				if(node.name.indexOf(".") > 0) {
					var ext = node.name.split(".").pop();
					if(ext === "sha") {
						icon = "img/sha.png";
					}
				}
				this.listBox.addRow([icon, node.name, node.isFile ? node.sizeDisplay() : "", node.date.substr(0, 10), !node.isFile]);
			}
		}
		
		navigate(folder) {
			this.listBox.clear();
			this.setAddress(folder);
			
			var node = getFileNode(folder);
			node.list((error, list) => {
				if(error) {
					this.onerror({code: error, info: node.location()});
				}
				else {
					this._loadList(list);
				}
			});
		}
	}
}