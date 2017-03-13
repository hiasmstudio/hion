function PackManager() {
    
    this.packs = {};
    
    this.onload = function(){};
    
    this.load = function(packs) {
        var pm = this;
        
        this.counter = 0;
		var packName = packs[this.counter];
		var p = new Pack(packName);
		var base = p;
		pm.state(packName);
		p.onload = function() {
			pm.packs[packName] = p;
			pm.counter++;
			
			if(pm.counter < packs.length) {
				packName = packs[pm.counter];
				var np = new Pack(packName);
				np.parent = base;
				np.onload = p.onload;
				p = np;
				pm.state(packName);
				np.load();
			}
			else {
				pm.onload();
			}
		};
		p.load();
    };
	
	this.state = function(text) {
		this.task.parent.state("Load " + text + "...");
	};
    
    this.getPack = function(name) {
        return this.packs[name];
    };
}

function Pack(name) {
    
    this.name = name;
    this.elements = [];
    this.onload = function(){};
	this.loadedImages = 0;
	this.projects = [];
	this.make = [];
	this.namesmap = {};
	this.strings = {};
	this.editors = {};
	this.run = { mode: "none" };
	this.title = "";
}

Pack.prototype.isEntry = function(name) {
	for(var prj of this.projects)
		if(name == prj)
			return true;
	return false;
};

Pack.prototype.getRoot = function() {
    return "pack/" + this.name;
};

Pack.prototype.getEditorsPath = function() {
    return this.getRoot() + "/editors/";
};

Pack.prototype.getSmallIcon = function() {
    return this.getRoot() + "/icon.png";
};

Pack.prototype.load = function() {
	$.get(this.getRoot() + "/lang/" + translate.getLang() + ".json", function(data, pack) {
		pack.strings = JSON.parse(data);

		$.get(pack.getRoot() + "/pack.json", function(data, pack) {
			var js = JSON.parse(data);
			pack.projects = js.projects;
			pack.make = js.make;
			pack.title = js.title;
			if(js.run)
				pack.run = js.run;
			if(js.namesmap)
				pack.namesmap = js.namesmap;
			if(js.editors) {
				for(var e in js.editors) {
					if(window[e]) {
						pack.editors[window[e]] = js.editors[e];
					}
				}
			}

			$.get(pack.getRoot() + "/elements.json", function(data, pack) {
				pack.elements = JSON.parse(data);
				for(var e in pack.elements) {
					var element = pack.elements[e];
					if(element.points) {
						for(var point of element.points) {
							point.inherit = e;
						}
					}
					// lang info generator
					// var k = "el." + e;
					// if(element.points && pack.translate(k) === k) {
					// 	var info = '"' + k + '": "",\n';
					// 	for(var point of element.points) {
					// 		info += '"' + e + "." + point.name + '": "",\n';
					// 	}
					// 	console.log(info);
					// }
					// check translation 
					// if(pack.name == "modules") {
					// 	if(element.points) {
					// 		for(var point of element.points) {
					// 			if(pack.translate(e + "." + point.name) === e + "." + point.name)
					// 				console.log(e, point.name);
					// 		}
					// 	}
					// 	if(element.props) {
					// 		for(var prop of element.props) {
					// 			if(pack.translate(e + "." + prop.name) === e + "." + prop.name)
					// 				console.log(e, prop.name);
					// 		}
					// 	}
					// }
				}
				// inherit elements from base package
				if(pack.parent) {
					for(var e in pack.elements) {
						if(pack.parent.elements[e]) {
							var newElement = {};
							// inherit parent element
							Object.assign(newElement, pack.parent.elements[e]);
							// overflow parent fields
							Object.assign(newElement, pack.elements[e]);
							pack.elements[e] = newElement;

							// create new instance of icon
							if(pack.elements[e].icon) {
								var icon = new Image();
								icon.src = pack.elements[e].icon.src;
								pack.elements[e].icon = icon;
							}
						}
					}
				}
				
				$.appendScript(pack.getRoot() + "/core.js", function(){
					pack.core = new window[pack.name]();
					pack.loadIcons();
				});
			}, pack);
		}, pack);
	}, this);
};

Pack.prototype.loadIcons = function() {
    for (var id in this.elements) {
		var element = this.elements[id];
		if(element.tab && !element.group && !element.icon) {
			this.loadedImages++;
			
			var icon = new Image();
			icon.src = this.getRoot() + "/icons/" + id + ".ico";
			icon.pack = this;
			icon.onerror = icon.onload = function(){
			    this.pack._loadImage();
			};
			
			element.icon = icon;
		}
	}
};

Pack.prototype._loadImage = function(img) {
	this.loadedImages--;
	if(this.loadedImages === 0) {
		this.onload();
	}
};

Pack.prototype.mapElementName = function(name) {
	return this.namesmap[name] || name;
};

Pack.prototype.translate = function(string) {
	if(this.strings[string])
		return this.strings[string];
	if(this.parent && this.parent.strings[string])
		return this.parent.strings[string];
	
	return string;
};

Pack.prototype.initElement = function(element) {
	if(this.parent)
		this.parent.core.init(element);
	this.core.init(element);
};

Pack.prototype.getPropertyEditor = function(propType) {
	if(this.editors[propType])
		return {name: this.editors[propType], path: this.getEditorsPath()};
	
	if(this.parent)
		return this.parent.getPropertyEditor(propType);
	
	return null;
};