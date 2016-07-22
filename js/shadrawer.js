var translate = null;

function toStep(v) { return Math.floor(v/7)*7; }
function GetPos(offTrial) {
	var offL=0;
	var offT=0;

	while(offTrial) {
		offL+=offTrial.offsetLeft;
		offT+=offTrial.offsetTop;
		offTrial=offTrial.offsetParent;
	}

	return {left:offL , top:offT};
} 

function SHADrawer(control, file) {
	var packMan = null;
	
    this.ctx = control.getContext('2d');
	this.ctx.drawLine = function(x1,y1,x2,y2) {
					 this.beginPath();  
					 this.moveTo(x1, y1);  
					 this.lineTo(x2, y2);  
					 this.stroke();
				};
				
	this.hint = new Hint();
	control.parent = this;
	control.onmousemove = function() {
	    var p1 = GetPos(this.control);
		var x = event.clientX - p1.left;
		var y = event.clientY - p1.top;

        if(this.parent.sdk) {
    		var obj = this.parent.sdk.getObjectAtPos(x, y);
    	    this.parent.showHintObject(obj, x, y);
        }
	};
	
	this.showHintObject = function(obj, x, y) {
		if (obj) {
			if(obj.type === 1) {
				var h = this.hint.body();
				h.n("div").class("header").html(obj.obj.name);
				h.n("div").html(window.translate.translate(obj.obj.info));
				var footer = null;
				for(var i in obj.obj.props) {
					var prop = obj.obj.props[i];
					if(!prop.isDef() && prop.type !== DATA_INT) {
						if(!footer) {
							footer = h.n("div").class("footer");
						}
						footer.n("div").html(i + " = " + prop.getText());
					}
				}
			}
			else if(obj.type === 2) {
				var h = this.hint.body();
				var header = h.n("div").class("header");
				header.n("img").class("icon").attr("src", obj.obj.getIcon());
				header.n("span").html(obj.obj.name);
				if(obj.obj.args) {
					header.n("span").style("fontWeight", "normal").html(" (" + obj.obj.args + ")");
				}
				h.n("div").html(window.translate.translate(obj.obj.parent.getPointInfo(obj.obj)));
			}
			else if(obj.type === 5) {
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
	
	this.showHint = function(x, y) {
		var p1 = GetPos(this.control);
		this.hint.show(x + 16 + p1.left, y + 16 + p1.top);
	};

    var loader = new Loader();
    loader.parent = this;
	loader.onload = function() {
		$.get("example/" + file + ".sha", function(data, parent) {
            parent.sdk = new SDK(packMan.getPack("base"));
            parent.sdk.clearProject();
            parent.sdk.load(data);
            parent.ctx.translate(0.5, 0.5);
            parent.sdk.draw(parent.ctx);
        }, this.parent);
	}
	loader.add(new LoaderTask(function(){
		translate = new Translate();
		translate.task = this;
		translate.onload = function(){
			this.task.taskComplite("Translate loaded.");
			delete this.task;
		};
		translate.load();
	}));
	loader.add(new LoaderTask(function(){
		packMan = new PackManager();
		packMan.onload = function() {
			this.task.taskComplite("Packs load.");
			delete this.task;
		};
		packMan.task = this;
		packMan.load(["base"]);
	}));
	loader.add(new LoaderTask(function(){
		var palette = new Palette($("palette"));
		palette.onload = function() {
			this.task.taskComplite("Palette loaded.");
			delete this.task;
		};
		palette.task = this;
		palette.load(packMan.getPack("base"));
	}));
	loader.run();
}