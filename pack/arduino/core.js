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
	var audioContext = null;
	var digitalPins;

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
					digitalPins = [];
					for(var p = 0; p < 13; p++) {
						digitalPins.push(0);
					}

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
					this.ctl = new UILed({
						color: this.props.Color.getText().toLowerCase()
					});

					return AUIElement.prototype.run.call(this, flags);
				};
				i.doSwitch.onevent = function(queue) {
					var v = this.parent.d(queue.state.data).read("Value");
					this.parent.ctl.switch(v);
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
						digitalPins[i.props.Pin.value] = true;
					});
					this.ctl.addListener("mouseup", function () {
						digitalPins[i.props.Pin.value] = false;
					});
					return AUIElement.prototype.run.call(this, flags);
				};
				i.doCheck.onevent = function(queue) {
					var state = digitalPins[this.parent.props.Pin.value];
					var e = this.parent.getMainLink() || this.parent;
					if(this.parent.props.Mode.isDef() || e.oldState != state) {
						e.oldState = state;
						if(this.parent.props.Mode.value != 2 || state)
							queue.push({event: this.parent.onClick, data: state ? 1 : 0});
					}
					return 0;
				};
				i.State.onevent = function() {
					return digitalPins[this.parent.props.Pin.value] ? 1 : 0;
				};
				break;
			case "Potentiometer":
				i.run = function (flags) {
					this.ctl = new UIPotentiometer({
						min: 0,
						max: 1023
					});

					return AUIElement.prototype.run.call(this, flags);
				};
				i.oninit = function(){
					this.ctl.position = 0;
				};
				i.onpropchange = function(prop) {
					SdkElement.prototype.onpropchange.call(this, prop);
					if(prop === this.props.Width) {
						this.props.Height.value = prop.value;
					}
					else if(prop === this.props.Height) {
						this.props.Width.value = prop.value;
					}
				};
				i.onformeditorupdate = function() {
					this.ctl.position = 0;
				};
				i.doRead.onevent = function(queue) {
					queue.push({event: this.parent.onRead, data: this.parent.ctl.position});
					return 0;
				};
				i.Value.onevent = function() {
					return this.parent.ctl.position;
				};
				break;
			case "OLED_128x64":
				i.run = function (flags) {
					this.ctl = new UIOLEDControl({
						url: "/pack/arduino/icons/OLED_128x64.svg"
					});
					return AUIElement.prototype.run.call(this, flags);
				};
				i.oninit = function() {
					this.ctl.init();
					this.ctl.canvas.textBaseline = "top";
					this.ctl.canvas.translate(0.5, 0.5);
				};
				i.doDraw.onevent = function(queue) {
					var canvas = this.parent.ctl.canvas;
					canvas.clearRect(0, 0, 128, 64);
					canvas.strokeStyle = canvas.fillStyle = "black";
					canvas.cursorX = 0;
					canvas.cursorY = 0;
					canvas.fontSize = 8;
					canvas.charInterval = 6;
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;	
				};
				i.Canvas.onevent = function() {
					return this.parent.ctl.canvas;
				};
				break;
			case "TextCursor":
				i.doMove.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var x = d.readInt("X");
					var y = d.readInt("Y");
					canvas.cursorX = x;
					canvas.cursorY = y;
					queue.push({event: this.parent.onMove, data: canvas});
					return 0;
				};
				break;
			case "DrawText":
				i.doDraw.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var text = d.read("Text").toString();
					if(this.parent.props.Size.value) {
						canvas.fontSize = this.parent.props.Size.value == 1 ? 8 : 16;
						canvas.charInterval = this.parent.props.Size.value == 1 ? 6 : 12;
						canvas.font = "bold " + canvas.fontSize + "px monospace";
					}
					if(this.parent.props.Color.value == 1)
						canvas.fillStyle = "white";
					else if(this.parent.props.Color.value == 2)
						canvas.fillStyle = "black";
					for(var i = 0; i < text.length; i++) {
						if(this.parent.props.Color.value == 3) {
							canvas.fillStyle = "white";
							canvas.fillRect(canvas.cursorX, canvas.cursorY, canvas.charInterval, canvas.fontSize);
							canvas.fillStyle = "black";
						}
						canvas.fillText(text.substr(i, 1), canvas.cursorX, canvas.cursorY);
						canvas.cursorX += canvas.charInterval;
						if(canvas.cursorX + canvas.charInterval > 127) {
							canvas.cursorX = 0;
							canvas.cursorY += canvas.fontSize;
						}
					}
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;
				};
				i.doNewLine.onevent = function(queue) {
					var canvas = this.parent.d(queue.state.data).read("Canvas");
					canvas.cursorY += canvas.fontSize;
					canvas.cursorX = 0;
					return 0;
				};
				break;
			case "DrawPixel":
				i.doDraw.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var x = d.readInt("X");
					var y = d.readInt("Y");
					if(!this.idata) {
						this.idata = canvas.createImageData(1,1);
					}
					var d = this.idata.data;
					d[0] = 255;
					d[1] = 255;
					d[2] = 255;
					d[3] = 255;
					canvas.putImageData(this.idata, x, y);  
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;
				};
				break;
			case "DrawLine":
				i.doDraw.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var x1 = d.readInt("X1");
					var y1 = d.readInt("Y1");
					var x2 = d.readInt("X2");
					var y2 = d.readInt("Y2");
					canvas.beginPath();
					canvas.moveTo(x1, y1);
					canvas.lineTo(x2, y2);
					canvas.strokeStyle = this.parent.props.Color.getText();
					canvas.stroke();
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;
				};
				break;
			case "DrawRectangle":
				i.doDraw.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var x1 = d.readInt("X1");
					var y1 = d.readInt("Y1");
					var x2 = d.readInt("X2");
					var y2 = d.readInt("Y2");

					canvas.strokeStyle = this.parent.props.Color.getText();
					if(this.parent.props.Type.isDef()) {
						canvas.fillStyle = this.parent.props.Color.getText();
						canvas.fillRect(x1, y1, x2 - x1, y2 - y1);
					}
					canvas.strokeRect(x1, y1, x2 - x1, y2 - y1);
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;
				};
				break;
			case "DrawRoundRectangle":
				i.doDraw.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var x1 = d.readInt("X1");
					var y1 = d.readInt("Y1");
					var x2 = d.readInt("X2");
					var y2 = d.readInt("Y2");

					canvas.strokeStyle = this.parent.props.Color.getText();
					var radius = this.parent.props.Radius.value;
					if(radius > (x2 - x1)/2) radius = (x2 - x1)/2;
					if(radius > (y2 - y1)/2) radius = (y2 - y1)/2;
					canvas.beginPath();
					canvas.moveTo(x1 + radius, y1);
					canvas.lineTo(x2 - radius, y1);
					canvas.quadraticCurveTo(x2, y1, x2, y1 + radius);
					canvas.lineTo(x2, y2 - radius);
					canvas.quadraticCurveTo(x2, y2, x2 - radius, y2);
					canvas.lineTo(x1 + radius, y2);
					canvas.quadraticCurveTo(x1, y2, x1, y2 - radius);
					canvas.lineTo(x1, y1 + radius);
					canvas.quadraticCurveTo(x1, y1, x1 + radius, y1);
					canvas.closePath();
					if(this.parent.props.Type.isDef()) {
						canvas.fillStyle = this.parent.props.Color.getText();
						canvas.fill();
					}
					canvas.stroke();
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;
				};
				break;
			case "DrawCircle":
				i.doDraw.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var canvas = d.read("Canvas");
					var x = d.readInt("X");
					var y = d.readInt("Y");
					var radius = d.readInt("Radius");

					canvas.strokeStyle = this.parent.props.Color.getText();
					canvas.beginPath();
					canvas.arc(x, y, radius, 0, 2*Math.PI);
					if(this.parent.props.Type.isDef()) {
						canvas.fillStyle = this.parent.props.Color.getText();
						canvas.fill();
					}
					canvas.stroke();
					queue.push({event: this.parent.onDraw, data: canvas});
					return 0;
				};
				break;
			case "Tone":
				i.oninit = function(){
					if(!audioContext)
						audioContext = new AudioContext();
					tones[this.props.Pin.value] = null;
				};
				i.onfree = function(){
					this.doStop.onevent();
				};
				i.doTone.onevent = function(queue) {
					this.parent.doStop.onevent();

					var osc = audioContext.createOscillator();
					osc.type = "square";
					var d = this.parent.d(queue.state.data);
					osc.frequency.value = d.readInt("Frequency");
					osc.connect(audioContext.destination);
					osc.start();
					var dur = d.readInt("Duration");
					if(dur)
						osc.stop(osc.context.currentTime + dur/1000);
					tones[this.parent.props.Pin.value] = osc;
					queue.push({event: this.parent.onTone});
					return 0;
				};
				i.doStop.onevent = function() {
					if(tones[this.parent.props.Pin.value]) {
						tones[this.parent.props.Pin.value].stop();
						tones[this.parent.props.Pin.value] = null;
					}
					return 0;
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
					return 0;
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
					return 0;
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
					return 0;
				};
				i.doReset.onevent = function(queue){
					if(this.parent.state) {
						this.parent.state = false;
						this.parent.change(queue);
					}
					return 0;
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
					if(cnt < end && !this.parent.stop) {
						if(cnt + s < end) {
							queue.state.counter = cnt + s;
							queue.push(queue.state);
						}
						else {
							queue.push({event: e.onStop});
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
			
			case "Array":
				i.doClear.onevent = function(queue) {
					this.parent.array = [];
					queue.push({event: this.parent.onClear});
					return 0;
				};
				i.Array.onevent = function() {
					return this.parent.array;
				};
				i.oninit = function(){
					this.array = [];
					if(!this.props.Array.isDef()) {
						var sarr = this.props.Array.value.trim().split("\n");
						for(var s of sarr) {
							this.array.push(parseInt(s));
						}
					}
				};
				break;
			case "ArrayRead":
				i.doRead.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var array = d.read("Array");
					var index = d.readInt("Index");
					if(index >= 0 && index < array.length) {
						this.parent.value = array[index];
						queue.push({event: this.parent.onRead, data: this.parent.value});
					}
					return 0;
				};
				i.Value.onevent = function() {
					return this.parent.value;
				};
				break;
			case "ArrayWrite":
				i.doWrite.onevent = function(queue) {
					var d = this.parent.d(queue.state.data);
					var array = d.read("Array");
					var index = d.readInt("Index");
					array[index] = d.read("Value");
					queue.push({event: this.parent.onWrite, data: array});
					return 0;
				};
				break;

			case "StrList":
				i.doAdd.onevent = function (queue) {
					this.parent.array.push(this.parent.d(queue.state.data).read("Str"));
					queue.push({event: this.parent.onChange});
					return 0;
				};
				i.doText.onevent = function (queue) {
					this.parent.array = queue.state.data.split("\n");
					queue.push({event: this.parent.onChange});
					return 0;
				};
				i.Text.onevent = function () {
					return this.parent.array.join("\n");
				};
				i.Array.onevent = function () {
					return this.parent.array;
				};
				i.oninit = function () {
					this.array = this.props.Strings.value ? this.props.Strings.value.split("\n") : [];
					if(i.doDelete) {
						i.doDelete.onevent = function(queue) {
							this.parent.array.splice(queue.state.data, 1);
							queue.push({event: this.parent.onChange});
							return 0;
						};
					}
				};
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
	return !this.isLink() || this.isMainLink() ? this.ctl : null;
};

//******************************************************************************
// UISvgControl
//******************************************************************************

function UISvgControl(options) {
	this.display = new Builder().n("div").class("ui-svgcontrol");
	this.monitor = this.display.n("div").style("width", "153px").style("height", "153px");
	this.monitor.n("img").attr("src", options.url).style("width", "100%").style("height", "100%");
	this._ctl = this.display.element;

	if(options) {
		
	}
	
	this.setOptions(options);
}

UISvgControl.prototype = Object.create(UIControl.prototype);

//******************************************************************************
// UILed
//******************************************************************************

function UILed(options) {
	this.body = new Builder().n("div").class("ui-led");
	this.led = this.body.n("div").class(options.color);
	this._ctl = this.body.element;

	this.setOptions(options);
}

UILed.prototype = Object.create(UIControl.prototype);

UILed.prototype.switch = function(value) {
	if(value)
		this.led.element.setAttribute("off", "");
	else
		this.led.element.removeAttribute("off");
};

//******************************************************************************
// UIOLEDControl
//******************************************************************************

function UIOLEDControl(options) {
	UISvgControl.call(this, options);

	this.monitor.style("position", "absolute");
	this.canvasCtl = this.monitor.n("canvas").style("position", "absolute")
		.style("left", "12px")
		.style("top", "41px")
		.style("width", "128px")
		.style("height", "64px").element;
	this.canvas = this.canvasCtl.getContext("2d");
}

UIOLEDControl.prototype = Object.create(UISvgControl.prototype);

UIOLEDControl.prototype.init = function() {
	this.canvasCtl.width = this.canvasCtl.offsetWidth;
	this.canvasCtl.height = this.canvasCtl.offsetHeight;
};

//******************************************************************************
// UIPotentiometer
//******************************************************************************

function UIPotentiometer(options) {
	this.body = new Builder().n("div").class("ui-potentiometer").on("onmousedown", function(){
		document.addEventListener("mousemove", __sliderMove);
		document.addEventListener("mouseup", __sliderUp);
		__sliderManaged = this.parent;
	}).attr("parent", this);
	this.slider = this.body.n("div").class("slider");
	this._ctl = this.body.element;

	this.deg = 0;

	this.setOptions(options);

	this._setPosition(-45);
}

UIPotentiometer.prototype = Object.create(UIControl.prototype);

UIPotentiometer.prototype._setPosition = function(value) {
	if(value < 0 && value > -45) {
		value = -45;
	}
	else if(value >= 0 && value < 45) {
		value = 45;
	}
	var $slider = this.slider.element;
	var sliderW = $slider.offsetWidth/2;
	var radius = this.body.element.offsetWidth/2;
	var radius2 = radius - 10;
	var center = radius - sliderW;
	$slider.style.transform = 'translate(' + center + 'px, ' + center + 'px) rotate(' + value + 'deg) translate(0, ' + radius2 + 'px)';
	this.deg = value;
};

var __sliderManaged = null;
function __sliderMove(event) {
	var $container = __sliderManaged.body.element;
	var radius = $container.offsetWidth/2;
	var elPos = { x: $container.offsetLeft, y: $container.offsetTop};
	var html = $container.parentNode;
	while(html) {
		elPos.x += html.offsetLeft || 0;
		elPos.y += html.offsetTop || 0;
		html = html.parentNode;
	}
	var mPos = {x: event.clientX-elPos.x, y: event.clientY-elPos.y};
	var atan = Math.atan2(mPos.x-radius, mPos.y-radius);

	var deg = -atan/(Math.PI/180);
	__sliderManaged._setPosition(deg);
};

function __sliderUp() {
	document.removeEventListener("mousemove", __sliderMove);
	document.removeEventListener("mouseup", __sliderUp);
	__sliderManaged.getControl().style.cursor = "default";
};

Object.defineProperty(UIPotentiometer.prototype, "position", {
	get: function() {
		if(this.deg >= 0)
			return (this.deg - 45)/270*1023;
		return (135 + 180 + this.deg)/270*1023;
	},
	set: function(value) {
		if(value < 512)
			this._setPosition(value/1023*270 + 45);
		else
			this._setPosition(value/1023*270 - 135 - 180);
	}
});