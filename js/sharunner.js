function toStep(v) { return Math.floor(v/7)*7; }

function readProperty(data, point, prop) {
	if(point.point)
		return point.point.onevent(data);
	else if(prop)
		return prop;
	else if(data)
		return data;
	return ""; 
}
 
function readInt(data, point, prop) {
	var p = parseInt(prop);
	if(point && point.point)
		return parseInt(point.point.onevent(data));
	else if(prop)
		return p;
	else if(data)
		return parseInt(data);
	return 0;
}

function SHARunner(file, onload) {
	var packMan = null;
	
    var loader = new Loader();
    loader.parent = this;
	loader.onload = function() {
		$.post("/server/core.php", {load: true, name: file}, function(data, parent) {
			if(this.status === 404) {
				alert("File " + file + " not found!");
			}
			else {
				parent.sdk = new SDK(packMan.getPack("base"));
				parent.sdk.clearProject();
				parent.sdk.load(data);
				if(onload) {
					onload.call(parent);
				}
			}
		}, this.parent);
	}
	loader.add(new LoaderTask(function(){
		packMan = new PackManager();
		packMan.onload = function() {
			this.task.taskComplite("Packs load.");
			delete this.task;
		};
		packMan.task = this;
		packMan.load(["base"]);
	}));
	loader.run();
}

SHARunner.prototype.run = function() {
	this.sdk.run(window.FLAG_USE_RUN);
};

window.getOption = function(name, defValue) {
	return window.localStorage["gv_" + name] || defValue;
};

window.getOptionBool = function(name, defValue) {
	return parseInt(window.getOption(name, defValue)) === 1;
};

window.getOptionInt = function(name, defValue) {
	return parseInt(window.getOption(name, defValue));
};