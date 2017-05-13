function arduino() {
	function callAll(queue) {
		while(queue.length) {
			queue.state = queue.pop();
			var sleep = queue.state.event.call(queue);
			if(sleep)
				return sleep;
		}
		return 0;
	}

	var tones = {};

	this.init = function(i) {
		switch (i.name) {
			case "Board":
				i.run = function(flags) {
					if(flags & window.FLAG_USE_RUN) {
						this.ctl = new Dialog({
							title: "Board emulator: " + this.props.Type.getText(),
							//icon: this.props.URL.value,
							destroy: !(flags & window.FLAG_USE_CHILD || flags & window.FLAG_USE_EDIT),
							resize: false,
							width: this.props.Width.value,
							height: this.props.Height.value,
							modal: !(flags & window.FLAG_USE_EDIT),
							popup: !(flags & window.FLAG_USE_EDIT),
							showcaption: true,
							showborder: true
						});
						// this.ctl.getContainer().style.backgroundImage = 'url(img/back.gif)';
						if(!(flags & window.FLAG_USE_CHILD)) {
							this.ctl.addListener("close", function(){
								i.parent.stop(window.FLAG_USE_RUN);
								return true;
							});
						}
					}
					else
						this.ctl = new Panel({theme: ""});

					// this.ctl.layout = this.getLayout(this.ctl);
					//WinElement.prototype.run.call(this, flags);

					this.ctl.place(0, 0, this.props.Width.value, this.props.Height.value);

					if(!(flags & window.FLAG_USE_CHILD)) {
						this.ctl.show({});
					}
					return this.ctl
				};
				i.getChild = function(){
					return null;
				};

				i.getLayout = function(parent) {
					return new FixLayout(parent);
				};

				i.oninit = function() {
					var queue = [];
					var skip = 0;

					queue.push({event: i.onSetup});
					this.timer = setInterval(function() {
						if(skip > 0) {
							skip--;
						}
						else {
							if(queue.length == 0)
								queue.push({event: i.onLoop});
							skip = callAll(queue);
						}
					}, 5);
				};
				i.onfree = function() {
					clearInterval(this.timer);
				};

				i.flags |= window.IS_PARENT;
				break;
			case "LED":
				i.getLightColor = function(){
					return this.props.Color.getText();
				};
				i.getDarkColor = function(){
					return ["#ffffb3", "#7aff7a", "#ffb3b3", "#b8b8ff"][this.props.Color.value];
				};
				i.run = function (flags) {
					this.ctl = new SVG({
						shape: 0,
						fill: this.getDarkColor(),
						stroke: "black",
						strokeWidth: 1
					});

					return AUIElement.prototype.run.call(this, flags);
				};
				i.doSwitch.onevent = function(queue) {
					var v = this.parent.d(queue.state.data).read("Value");
					this.parent.ctl.fill(v ? this.parent.getLightColor() : this.parent.getDarkColor());
					queue.push({event: this.parent.onSwitch});
					return 0;
				};
				break;
			case "Button":
				i.run = function (flags) {
					this.ctl = new Button({
						caption: this.props.Caption.value,
						url: "/pack/arduino/icons/Button.ico"
					});
					this.state = this.oldState = false;
					this.ctl.addListener("mousedown", function () {
						i.state = true;
					});
					this.ctl.addListener("mouseup", function () {
						i.state = false;
					});
					return AUIElement.prototype.run.call(this, flags);
				};
				i.doCheck.onevent = function(queue) {
					if(this.parent.props.Mode.isDef() || this.parent.oldState != this.parent.state) {
						this.parent.oldState = this.parent.state;
						if(this.parent.props.Mode.value != 2 || this.parent.state)
							queue.push({event: this.parent.onClick, data: this.parent.state});
					}
					return 0;
				};
				i.State.onevent = function() {
					return this.parent.state;
				};
				break;
			case "Potentiometer":
				i.run = function (flags) {
					this.ctl = new TrackBar({
						min: 0,
						max: 1023,
						step: 1
					});
					return AUIElement.prototype.run.call(this, flags);
				};
				i.doRead.onevent = function(queue) {
					queue.push({event: this.parent.onRead, data: this.parent.ctl.position});
					return 0;
				};
				i.Value.onevent = function() {
					return this.parent.ctl.position;
				};
				break;
			case "Tone":
				i.oninit = function(){
					this.context = new AudioContext();
					tones[this.props.Pin.value] = null;
				};
				i.onfree = function(){
					this.doStop.onevent();
				};
				i.doTone.onevent = function(queue) {
					this.parent.doStop.onevent();

					var osc = this.parent.context.createOscillator();
					osc.type = "square";
					var d = this.parent.d(queue.state.data);
					osc.frequency.value = d.readInt("Frequency");
					osc.connect(this.parent.context.destination);
					osc.start();
					var dur = d.readInt("Duration");
					if(dur)
						osc.stop(osc.context.currentTime + dur/1000);
					tones[this.parent.props.Pin.value] = osc;
					queue.push({event: this.parent.onTone});
				};
				i.doStop.onevent = function() {
					if(tones[this.parent.props.Pin.value]) {
						tones[this.parent.props.Pin.value].stop();
						tones[this.parent.props.Pin.value] = null;
					}
				};
				break;
			case "Delay":
				i.doDelay.onevent = function(queue) {
					queue.push({event: this.parent.onDelay});
					return this.parent.props.Miliseconds.value/5;
				};
				break;
			case "Time":
				i.CurrentTime.onevent = function() {
					var t = new Date().getTime();
					if(this.parent.props.Mode.value == 1)
						t *= 1000;
					return t;
				};
				break;
			case "SerialOpen":
				i.doBegin.onevent = function(queue) {
					queue.push({event: this.parent.onBegin});
					return 0;
				};
				i.doEnd.onevent = function(queue) {
					return 0;
				};
				break;
			case "SerialPrint":
				i.doPrint.onevent = function(queue) {
					console.log(this.parent.d(queue.state.data).read("Text"));
					queue.push({event: this.parent.onPrint});
					return 0;
				};
				break;
			case "Counter":
				i.cnt = 0;
				i.doNext.onevent = function (queue) {
					var e = this.parent;
					e.cnt += e.props.Step.value;
					if (e.cnt > e.props.Max.value)
						e.cnt = e.props.Min.value;
					queue.push({event: e.onCounter, data: e.cnt});
					return 0;
				};
				i.doReset.onevent = function (queue) {
					this.parent.oninit();
					queue.push({event: this.parent.onCounter, data: this.parent.cnt});
					return 0;
				};
				i.Value.onevent = function () {
					return this.parent.cnt;
				};
				i.oninit = function () {
					this.cnt = this.props.Default.value;
				};
				break;
			case "Random":
				i.rnd = 0.0;
				i.doRandom.onevent = function (queue) {
					this.parent.rnd = Math.random();
					queue.push({event: this.parent.onRandom, data: this.parent.rnd});
					return 0;
				};
				i.Result.onevent = function () {
					return this.parent.rnd;
				};
				i.oninit = function () {
					this.rnd = 0.0;
				};
				break;
			case "MathParse":
				i.doCalc.onevent = function (queue) {
					var args = [this.parent.result];
					var d = this.parent.d(queue.state.data);
					for (var name of this.parent.arr) {
						var arg = d.read(name);
						args.push(Array.isArray(arg) ? arg : parseFloat(arg));
					}
					this.parent.result = this.parent.calc(args);
					queue.push({event: this.parent.onResult, data: this.parent.result});
					return 0;
				};
				i.doClear.onevent = function (data) {
					this.parent.result = this.parent.props.Default.value;
				};
				i.Result.onevent = function () {
					return this.parent.result;
				};
				i.prepareMask = function(mask) {
					var s = mask;
					this.arr = this.props.Args.isDef() ? [] : this.props.Args.value.split("\n");
					for(var i = 0; i < this.arr.length; i++) {
						s = s.replace(new RegExp("\\$" + this.arr[i], "g"), "%" + (i+1));
					}
					s = s.replace(/\$result/g, "%0");
					s = s.replace(/([_a-zA-Z]+)/g, function(m, c){ return "Math." + c; });
					s = s.replace(/%([0-9]+)/g, function(m, c){ return "args[" + c + "]"; });
					this.calc = new Function("args", "return " + s);
					Math.point = function(x, y){ return {x: x, y: y}; };
				};
				i.oninit = function () {
					this.result = this.props.Default.value;
					this.prepareMask(this.props.MathStr.value);
					if(this.doMathStr) {
						this.doMathStr.onevent = function (data) {
							this.parent.prepareMask(data);
						};
					}
				};
				// i.onpropchange(i.props.Args);
				break;
			case "Hub":
				i.onpropchange = function(prop) {
					Hub.prototype.onpropchange.call(this, prop);
					if(prop.name === "InCount") {
						for(var i in this.points) {
							if(this.points[i].type === pt_work) {
								this.points[i].onevent = function(queue) {
									var i = queue.state.index || 1;
									if(i <= this.parent.props.OutCount.value) {
										if(i < this.parent.props.OutCount.value) {
											queue.state.index = i+1;
											queue.push(queue.state);
										}
										queue.push({event: this.parent.points["onEvent" + i], data: queue.state.data});
									}
									return 0;
								};
							}
						}
					}
				};
				i.onpropchange(i.props.InCount);
				break;
			case "IndexToChannel":
				i.doEvent.onevent = function(queue) {
					var name = "onEvent" + (this.parent.d(queue.state.data).readInt("Index") + 1);
					if(this.parent[name]) {
						queue.push({event: this.parent[name], data: this.parent.props.Data.value});
					}
					return 0;
				};
				break;
			case "ChannelToIndex":
				i.onpropchange = function(prop) {
					DPElement.prototype.onpropchange.call(this, prop);
					for(var j = 0; j < this.props.Count.value; j++) {
						this["doWork" + (j + 1)].onevent = function(index){
							return function(queue) {
								queue.push({event: this.parent.onIndex, data: index});
								return 0;
							}
						}(j);
					}
				};
				i.onpropchange(i.props.Count);
				break;
			case "TimeCounter":
				i.doStart.onevent = function(queue){
					this.parent.counter = window.performance.now();
					queue.push({event: this.parent.onStart, data: queue.state.data});
					return 0;
				};
				i.doStop.onevent = function(queue){
					this.parent.elapsed = window.performance.now() - this.parent.counter;
					queue.push({event: this.parent.onStop, data: this.parent.elapsed});
				};
				i.Elapsed.onevent = function(){ return this.parent.elapsed; };
				i.oninit = function(){ this.counter = this.elapsed = 0; };
				break;
			case "Switch":
				i.getValue = function() {
					var r = this.d("");
					return this.state ? r.read("DataOn") : r.read("DataOff");
				};
				i.change = function(queue) {
					var data = this.getValue();
					queue.push({event: this.onSwitch, data: data});
					if(this.state) {
						this.onOn && queue.push({event: this.onOn, data:data});
					}
					else {
						this.onOff && queue.push({event: this.onOff, data:data});
					}
				};
				i.doSwitch.onevent = function(queue){
					this.parent.state = !this.parent.state;
					this.parent.change(queue);
				};
				i.doReset.onevent = function(queue){
					if(this.parent.state) {
						this.parent.state = false;
						this.parent.change(queue);
					}
				};
				i.State.onevent = function(){ return this.parent.getValue(); };
				i.run = function(){
					this.state = !this.props.Default.isDef();

					if(this.doOn) {
						this.doOn.onevent = function(queue){
							if(!this.parent.state) {
								this.parent.state = true;
								this.parent.change(queue);
							}
						};
					}
				};
				break;
			case "DoData":
				i.doData.onevent = function (queue) {
					queue.push({event: this.parent.onEventData, data: this.parent.d("").read("Data")});
					return 0;
				};
				break;
			case "Memory":
				i.data = "";
				i.doValue.onevent = function (queue) {
					this.parent.data = queue.state.data;
					queue.push({event: this.parent.onData, data: queue.state.data});
					return 0;
				};
				i.doClear.onevent = function (queue) {
					this.parent.data = this.parent.props.Default.value;
					queue.push({event: this.parent.onData, data: this.parent.data});
					return 0;
				};
				i.Value.onevent = function () {
					return this.parent.data;
				};
				i.oninit = function () {
					this.data = this.props.Default.value;
				};
				break;
			case "If_else":
				i.doCompare.onevent = function (queue) {
					var d = this.parent.d(queue.state.data);
					var op1 = d.read("Op1");
					var op2 = d.read("Op2");
					var r;
					switch (this.parent.props.Type.value) {
						case 0:
							r = op1 == op2;
							break;
						case 1:
							r = op1 < op2;
							break;
						case 2:
							r = op1 > op2;
							break;
						case 3:
							r = op1 <= op2;
							break;
						case 4:
							r = op1 >= op2;
							break;
						case 5:
							r = op1 != op2;
							break;
						default:
							r = false;
					}
					if (r)
						queue.push({event: this.parent.onTrue, data: queue.state.data});
					else
						queue.push({event: this.parent.onFalse, data: queue.state.data});
					return 0;
				};
				break;
			case "Case":
				i.doCase.onevent = function(queue) {
					if(queue.state.data == this.parent.props.Value.value) {
						queue.push({event: this.parent.onTrue, data: this.parent.props.DataOnTrue.value});
					}
					else {
						queue.push({event: this.parent.onNextCase, data: queue.state.data});
					}
					return 0;
				};
				break;
			case "For":
				i.doFor.onevent = function (queue) {
					var e = this.parent;
					var r = e.d(queue.state.data);
					var end = r.readInt("End");
					var start = r.readInt("Start");
					var s = e.props.Step.value;
					var cnt = queue.state.counter || start;
					if(cnt < end || this.parent.stop) {
						if(cnt + s < end) {
							queue.state.counter = cnt + s;
							queue.push(queue.state);
						}
						this.parent.cnt = cnt;
						queue.push({event: e.onEvent, data: cnt});
					}
					else {
						this.parent.stop = false;
						queue.push({event: e.onStop});
					}
					return 0;
				};
				i.doStop.onevent = function() {
					this.parent.stop = true;
				};
				i.Position.onevent = function () {
					return this.parent.cnt;
				};
				i.oninit = function(){ this.cnt = 0; this.stop = false; };
				break;
			case "Debug":
				i.doEvent.onevent = function(queue) {
					console.log(this.parent.props.WEName.value, queue.state.data);
					queue.push({event: this.parent.onEvent, data: queue.state.data});
					return 0;
				};
				break;
			case "HubEx":
				for(var p = 0; p < 3; p++) {
					i[i.pIndex[p]].onevent = function(queue) { queue.push({event: this.parent.onEvent, data: queue.state.data}); };
				}
				break;
			case "GetDataEx":
				for(var p = 0; p < 3; p++) {
					i[i.pIndex[p]].onevent = function(data) { return readProperty(data, this.parent.Data); };
				}
				break;
		}
	};
}

function AUIElement(id) {
	SdkElement.call(this, id);
}

AUIElement.prototype = Object.create(SdkElement.prototype);

AUIElement.prototype.place = function(x, y) {
	SdkElement.prototype.place.call(this, x, y);
	
	this.props.Left.value = this.x;
	this.props.Top.value = this.y;
};

AUIElement.prototype.run = function(flags) {
	this.ctl.place(this.props.Left.value, this.props.Top.value, this.props.Width.value, this.props.Height.value);
	return this.ctl;
};