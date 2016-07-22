function PackManager() {
    
    this.packs = {};
    
    this.onload = function(){};
    
    this.load = function(packs) {
        var pm = this;
        
        this.counter = 0;
        for(var pack of packs) {
            var p = new Pack(pack);
            this.packs[pack] = p;
            this.counter++;
            
            p.onload = function(){
                pm.counter--;
                if(pm.counter == 0) {
                    pm.onload();
                }
            };
            
            p.load();
        }
    };
    
    this.getPack = function(name) {
        return this.packs[name];
    };
}

function Pack(name) {
    
    this.name = name;
    this.elements = [];
    this.onload = function(){};
    this.entry = "MainForm";
	this.loadedImages = 0;
}

Pack.prototype.getRoot = function() {
    return "pack/" + this.name;
};

Pack.prototype.getEditorsPath = function() {
    return this.getRoot() + "/editors/";
};

Pack.prototype.load = function() {
    $.get(this.getRoot() + "/elements.json", function(data, pack) {
		pack.elements = JSON.parse(data);
		pack.loadIcons();
	}, this);
};

Pack.prototype.loadIcons = function() {
    for (var id in this.elements) {
		var element = this.elements[id];
		if(element.tab && !element.group) {
			this.loadedImages++;
			
			var icon = new Image();
			icon.src = this.getRoot() + "/icons/" + id + ".ico";
			icon.pack = this;
			icon.onload = function(){
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