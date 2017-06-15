namespace Hion {
	export function getFileNode(location: string) {
		if(location === "") {
			return null;
		}
		
		var fs;
		if(location.startsWith("/local")) {
			fs = new LocalFS();
		}
		else {
			fs = new RemoteFS();
		}
		
		var node = new FSNode(fs, location);
		return node;
	}

	declare type DataCallback = (error: number, data?: string) => void;

	export class FSNode {
		isFile: boolean;
		name: string;
		date: string;
		path: string;
		mime: string;
		size: number;

		constructor(public fs: FS, location?: string) {
			if(location) {
				var p = fs.getPath(location);
				this.name = p.name;
				this.path = p.path;
			}
			else {
				this.name = "";
				this.path = "";
			}
			this.mime = "";
			this.size = 0;
			this.isFile = false;
		}

		location(): string {
			return this.path + "/" + this.name;
		}

		read(callback: DataCallback) {
			this.fs.read(this.location(), callback);
		}

		readArray(callback) {
			this.read(callback);
		}

		write(data, callback) {
			this.fs.write(this.location(), data, callback);
		}

		remove(callback) {
			this.fs.remove(this.location(), callback);
		}

		list(callback) {
			this.fs.list(this.location(), callback);
		}

		mkdir(callback) {
			this.fs.mkdir(this.location(), callback);
		}

		sizeDisplay() {
			var size: any = 0;
			if(this.size < 1024) {
				size = this.size;
			}
			else if(this.size < 1024*1024) {
				size = Math.floor(this.size / 1024 * 10)/10 + "Kb";
			}
			else if(this.size < 1024*1024*1024) {
				size = Math.floor(this.size / (1024*1024) * 10)/10 + "Mb";
			}
			return size;
		}
	}

	export class DesktopFSNode extends FSNode {
		constructor(private desktopFile) {
			super(null);

			this.isFile = true;
			this.name = desktopFile.name;
			this.size = desktopFile.size;
			this.mime = desktopFile.type;
			this.desktopFile = desktopFile;
		}

		read(callback) {
			var reader = new FileReader();
			reader.onload = function(e: any) {
				callback(0, e.target.result);
			};
			reader.readAsText(this.desktopFile);
		}

		readArray(callback) {
			var reader = new FileReader();
			reader.onload = function(e: any) {
				callback(0, e.target.result);
			};
			reader.readAsArrayBuffer(this.desktopFile);
		}
	}

	//------------------------------------------------------------------------------
	interface LocationPath {
		name: string;
		path: string;
	}

	export class FS {
		getPath(location: string): LocationPath {
			if(location.charAt(location.length-1) === "/") {
				location = location.substr(0, location.length-1);
			}
			var i = location.lastIndexOf("/");
			return {path: location.substr(0, i), name: location.substr(i+1)};
		}

		private __supportError = function() { console.error("Not supported"); }

		list(dir, callback) { this.__supportError(); }
		mkdir(dir, callback) { this.__supportError(); }
		rmdir(dir, callback) { this.__supportError(); }

		remove(file, callback) { this.__supportError(); }
		move(fileOld, fileNew, callback) {
			this.read(fileOld, function(error, data) {
				if(error === 0) {
					this.remove(fileOld, function(error) {
						if(error === 0) {
							this.write(fileNew, data, function(error) {
								if(error === 0) {
									callback(0);
								}
								else {
									callback(3);
								}
							});
						}
						else {
							callback(2);
						}
					});
				}
				else {
					callback(1);
				}
			});
		}
		read(file, callback) { this.__supportError(); }
		write(file, data, callback) { this.__supportError(); }
	}

	export class LocalFS extends FS {
		
		private __getKey(dir: string) {
			return dir.replace(/\//g, "_");
		}

		private _loadList(folder: string, data: string): Array<FSNode> {
			var nodes = [];
			var lines = JSON.parse(data);
			for(var i in lines) {
				var node = new FSNode(this);
				node.name = i;
				node.isFile = lines[i] == 0;
				node.path = folder;
				node.size = 0;
				node.date = "";
				nodes.push(node);
				node.read(function(error, data){
					if(error === 0)
						node.size = data.length;
				});
			}
			return nodes;
		}

		list(dir: string, callback: (error: number, nodes: Array<FSNode>) => void) {
			var key = this.__getKey(dir);
			if(window.localStorage[key]) {
				callback(0, this._loadList(dir, window.localStorage[key]));
			}
		}

		mkdir(dir, callback: (error: number) => void) {
			var node = this.getPath(dir);
			var key = this.__getKey(node.path);
			var list = window.localStorage[key] ? JSON.parse(window.localStorage[key]) : {};
			list[node.name] = 1;
			window.localStorage[key] = JSON.stringify(list);
			callback(0);
		}

		rmdir(dir, callback: (error: number) => void) {
			var node = this.getPath(dir);
			var key1 = this.__getKey(dir);
			if(!window.localStorage[key1] || window.localStorage[key1] === "{}") {
				var key2 = this.__getKey(node.path);
				
				if(window.localStorage[key2]) {
					var list = JSON.parse(window.localStorage[key2]);
					delete list[node.name];
					window.localStorage[key2] = JSON.stringify(list);
					callback(0);
				}
				else {
					callback(2);
				}
			}
			else {
				callback(1);
			}
		}

		remove(file, callback: (error: number) => void) {
			var node = this.getPath(file);
			var key = this.__getKey(node.path);
			var folder = window.localStorage[key];
			if(folder) {
				var list = JSON.parse(window.localStorage[key]);
				delete list[node.name];
				window.localStorage[key] = JSON.stringify(list);
				key = this.__getKey(file);
				delete window.localStorage[key];
				callback(0);
			}
			else {
				callback(1);
			}
		}

		read(file, callback: DataCallback) {
			var key = this.__getKey(file);
			var data = window.localStorage[key];
			if(data) {
				callback(0, data);
			}
			else {
				callback(1);
			}
		}

		write(file, data, callback: (error: number) => void) {
			var node = this.getPath(file);
			var key1 = this.__getKey(node.path);
			var fList = window.localStorage[key1];
			if(!fList) {
				fList = "{}";
			}
			if(fList) {
				var list = JSON.parse(fList);
				if(!list[node.name]) {
					list[node.name] = 0;
					window.localStorage[key1] = JSON.stringify(list);
				}
				var key2 = this.__getKey(file);
				window.localStorage[key2] = data;
				callback(0);
			}
			else {
				callback(1);
			}
		}
	}

	export class RemoteFS extends FS {
		
		private _loadList(folder, data): Array<FSNode> {
			var nodes = [];
			var files = JSON.parse(data);
			for(var file of files) {
				var node = new FSNode(this);
				node.name = file.name;
				node.isFile = file.folder === 0;
				node.path = folder;
				node.size = file.size;
				node.date = file.date;
				nodes.push(node);
			}
			return nodes;
		}

		list(dir, callback: (error: number, nodes: Array<FSNode>) => void) {
			var __fs = this;
			$.get(API_FS_URL + "?dir=" + dir, function(data){
				callback(0, __fs._loadList(dir, data));
			});
		}

		mkdir(dir, callback: (error: number) => void) {
			$.post(API_FS_URL, {mkdir: dir}, function(data) {
				if(data) {
					var error = JSON.parse(data);
					callback(error.code);
				}
				else {
					callback(0);
				}
			});
		};

		rmdir(dir, callback: (error: number) => void) {
			$.post(API_FS_URL, {rm: dir}, function(data){
				if(data) {
					var error = JSON.parse(data);
					callback(error.code);
				}
				else {
					callback(0);
				}	
			});
		}

		remove(file, callback: (error: number) => void) {
			this.rmdir(file, callback);
		}

		read(file, callback: (error: number, data?: string) => void) {
			$.post(API_FS_URL, {name: file, load: true}, function(data) {
				if(this.status == 200) {
					callback(0, data);
				}
				else {
					var error = JSON.parse(data);
					callback(error.code);
				}
			});
		}

		write(file, data, callback: (error: number) => void) {
			$.post(API_FS_URL, {name: file, sha: data, save: true}, function(data){
				if(data) {
					var error = JSON.parse(data);
					callback(error.code);
				}
				else {
					callback(0);
				}
			});
		}
	}
}