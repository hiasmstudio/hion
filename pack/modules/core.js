'use strict';

function toRGB(color) {
	if(typeof color === "number") {
		return {r: color & 0xff, g: (color >> 8) & 0xff, b: (color >> 16) & 0xff, a: 1.0};
	}
	else if(color.startsWith("#")) {
		var value = parseInt(color.substring(1), 16);
		return {b: value & 0xff, g: (value >> 8) & 0xff, r: (value >> 16) & 0xff, a: 1.0};
	}
	else if(color.startsWith("rgba")) {
		var arr = color.substring(5, color.length - 1).split(",");
		return {r: parseInt(arr[0]), g: parseInt(arr[1]), b: parseInt(arr[2]), a: parseInt(arr[3])};
	}
	else if(color.startsWith("rgb")) {
		var arr = color.substring(4, color.length - 1).split(",");
		return {r: parseInt(arr[0]), g: parseInt(arr[1]), b: parseInt(arr[2]), a: 1.0};
	}
	
	return {r: 0, g: 0, b: 0, a: 1.0};
}

function componentToHex(c) {
	var hex = c.toString(16);
	return hex.length == 1 ? "0" + hex : hex;
}

function modules() {
	this.init = function(i) {
		switch (i.name) {
			case "Button":
				i.run = function (flags) {
					this.ctl = new Button({
						caption: this.props.Caption.getTranslateValue(),
						url: this.props.URL.value
					});
					if(!this.props.Align.isDef()) {
						this.ctl.layout = new HLayout(this.ctl, {reverse: this.props.Align.value === 2, alignItems: 2, justifyContent: 2});
					}
					this.ctl.addListener("click", function () {
						i.onClick.call(i.props.Data.value);
					});
					return WinElement.prototype.run.call(this, flags);
				};
				i.addPoint = function(name, type) {
					var point = WinElement.prototype.addPoint.call(this, name, type);
					if(name === "doCaption") {
						point.onevent = function(data) {
							this.parent.ctl.caption = data;
						};
					}
					return point;
				};
				break;
			case "CheckBox":
				i.doCheck.onevent = function (data) {
					this.parent.ctl.checked = parseInt(data);
				};
				i.Checked.onevent = function (data) {
					return this.parent.ctl.checked ? 1 : 0;
				};
				i.run = function (flags) {
					this.ctl = new CheckBox({
						caption: this.props.Caption.getTranslateValue(),
						checked: this.props.Checked.value
					});
					this.ctl.addListener("checked", function () {
						i.onCheck.call(i.ctl.checked ? 1 : 0);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "RadioButton":
				i.doCheck.onevent = function (data) {
					this.parent.ctl.checked = parseInt(data);
				};
				i.Checked.onevent = function (data) {
					return this.parent.ctl.checked ? 1 : 0;
				};
				i.run = function (flags) {
					this.ctl = new RadioButton({
						name: this.props.Name.value,
						caption: this.props.Caption.getTranslateValue(),
						checked: this.props.Checked.value
					});
					this.ctl.addListener("checked", function () {
						i.onCheck.call(i.ctl.checked ? 1 : 0);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Edit":
				i.doText.onevent = function (data) {
					this.parent.ctl.text = this.parent.d(data).read("Str");
				};
				i.Text.onevent = function (data) {
					return this.parent.ctl.text;
				};
				i.run = function (flags) {
					this.ctl = new Edit({
						text: this.props.Text.value,
						placeHolder: this.props.PlaceHolder.getTranslateValue(),
						password: this.props.Password.value,
						pattern: this.props.Pattern.value
					});
					this.ctl.addListener("change", function () {
						i.onChange.call(i.ctl.text);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "NumberEdit":
				i.doNumber.onevent = function (data) {
					this.parent.ctl.number = readProperty(data, this.parent.Value);
				};
				i.Number.onevent = function (data) {
					return this.parent.ctl.number;
				};
				i.run = function (flags) {
					this.ctl = new NumberEdit({
						number: this.props.Number.value,
						min: this.props.Min.value,
						max: this.props.Max.value,
						step: this.props.Step.value,
						placeHolder: this.props.PlaceHolder.value
					});
					this.ctl.addListener("input", function () {
						i.onChange.call(i.ctl.number);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "DatePicker":
				i.doDate.onevent = function (data) {
					this.parent.ctl.date = this.parent.d(data).read("Date");
				};
				i.SelectDate.onevent = function () {
					return this.parent.ctl.date;
				};
				i.run = function (flags) {
					this.ctl = new UIDatePicker({
						min: this.props.Min.value,
						max: this.props.Max.value
					});
					this.ctl.addListener("input", function () {
						i.onSelect.call(i.ctl.date);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ColorButton":
				i.doColor.onevent = function (data) {
					this.parent.ctl.color = this.parent.d(data).read("Color");
				};
				i.SelectColor.onevent = function () {
					return this.parent.ctl.color;
				};
				i.run = function (flags) {
					this.ctl = new UIColorButton({});
					this.ctl.addListener("input", function () {
						i.onSelect.call(i.ctl.color);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Memo":
				i.doAdd.onevent = function (data) {
					this.parent.ctl.add(readProperty(data, this.parent.Str));
				};
				i.doText.onevent = function (data) {
					this.parent.ctl.text = readProperty(data, this.parent.Str);
				};
				i.Text.onevent = function (data) {
					return this.parent.ctl.text;
				};
				i.run = function (flags) {
					this.ctl = new Memo({text: this.props.Text.value});

					if(i.Position) {
						i.Position.onevent = function (data) {
							return this.parent.ctl.caretStart;
						};
					}

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ListBox":
				i.onpropchange = function(prop) {
					this.onSelect.args = this.props.Select.getText();
					this.onClick.args = this.props.Select.getText();
				};
				i.doAdd.onevent = function (data) {
					var d = this.parent.d(data);
					if(this.parent.Icon) {
						var text = d.read("Str");
						var icon = d.read("Icon");
						this.parent.ctl.addIcon(icon, text);
					}
					else
						this.parent.ctl.add(d.read("Str"));
				};
				i.doText.onevent = function (data) {
					this.parent.ctl.setText(data);
				};
				i.SelectIndex.onevent = function () {
					return this.parent.ctl.getSelectIndex();
				};
				i.SelectString.onevent = function () {
					return this.parent.ctl.getSelectString();
				};
				i.run = function (flags) {
					this.ctl = new ListBox();
					this.ctl.e = this;

					var text = this.props.Strings.value;
					try {
						var a = JSON.parse(text);
						for(var item of a) {
							this.ctl.addIcon(item[1], item[0]);
						}
					}
					catch(err) {
						this.ctl.setText(text);
					}

					this.ctl.onclick = function(item, text) {
						if(this.e.props.Select.value === 0) {
							this.e.onClick.call(item.index);
						}
						else {
							this.e.onClick.call(text);
						}
					};
					this.ctl.onselect = function(item, text) {
						if(this.e.props.Select.value === 0) {
							this.e.onSelect.call(item.index);
						}
						else {
							this.e.onSelect.call(text);
						}
					};

					this.initPointHandler("doReplace", function(data){
						this.parent.ctl.replaceSelect(data);
					});
					this.initPointHandler("doSelectIndex", function (data) {
						if(data >= 0 && data < this.parent.ctl.size()) {
							this.parent.ctl.selectIndex(data);
						}
					});
					this.initPointHandler("doSelectText", function (data) {
						this.parent.ctl.selectString(data);
					});
					this.initPointHandler("Text", function () {
						return this.parent.ctl.text();
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ComboBox":
				i.onpropchange = function(prop) {
					this.onSelect.args = this.props.Select.getText();
				};
				i.doAdd.onevent = function (data) {
					this.parent.ctl.add(this.parent.d(data).read("Str"));
				};
				i.doText.onevent = function (data) {
					this.parent.ctl.setText(data);
				};
				i.SelectIndex.onevent = function () {
					return this.parent.ctl.getSelectIndex();
				};
				i.SelectString.onevent = function () {
					return this.parent.ctl.getSelectString();
				};
				i.run = function (flags) {
					this.ctl = new ComboBox();
					this.ctl.e = this;

					this.ctl.setText(this.props.Strings.value);

					this.ctl.onselect = function(item, text) {
						if(this.e.props.Select.value === 0) {
							this.e.onSelect.call(item.index);
						}
						else {
							this.e.onSelect.call(text);
						}
					};

					this.initPointHandler("doSelectIndex", function (data) {
						if(data >= 0 && data < this.parent.ctl.size()) {
							this.parent.ctl.selectIndex(data);
						}
					});
					this.initPointHandler("doSelectText", function (data) {
						this.parent.ctl.selectString(data);
					});
					this.initPointHandler("Text", function () {
						return this.parent.ctl.text();
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Label":
				i.doCaption.onevent = function (data) {
					this.parent.ctl.caption = data;
				};
				i.run = function (flags) {
					this.ctl = new Label({
						caption: this.props.Caption.getTranslateValue(),
						halign: this.props.HAlign.value,
						valign: this.props.VAlign.value,
						theme: this.props.Link.isDef() ? "" : "link"
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "PaintBox":
				i.doDraw.onevent = function (data) {
					this.parent.ctl.clear();
					this.parent.onDraw.call(this.parent.ctl.canvas);
				};
				i.Canvas.onevent = function () {
					return this.parent.ctl.canvas;
				};
				i.run = function (flags) {
					this.ctl = new Canvas({theme: flags & window.FLAG_USE_EDIT ? "borderin" : ""});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "PointXY":
				i.Point.onevent = function() {
					var d = this.parent.d(0);
					return {x: d.readInt("X"), y: d.readInt("Y")};
				};
				break;
			case "Line":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("Point1");
					var point2 = d.read("Point2");
					var props = this.parent.props;
					canvas.beginPath();
					canvas.moveTo(point1.x || props.X1.value, point1.y || props.Y1.value);
					canvas.lineTo(point2.x || props.X2.value, point2.y || props.Y2.value);
					canvas.stroke();
					this.parent.onDraw.call(canvas);
				};
				break;
			case "Rectangle":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("Point1");
					var point2 = d.read("Point2");
					var props = this.parent.props;
					var x1 = point1.x || props.X1.value;
					var y1 = point1.y || props.Y1.value;
					var x2 = point2.x || props.X2.value;
					var y2 = point2.y || props.Y2.value;
					if(this.parent.props.Type.value !== 1) {
						canvas.fillRect(x1, y1, x2, y2);
					}
					if(this.parent.props.Type.value !== 0) {
						canvas.strokeRect(x1, y1, x2, y2);
					}
					this.parent.onDraw.call(canvas);
				};
				break;
			case "RoundRectangle":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("Point1");
					var point2 = d.read("Point2");
					var radius = d.readFloat("Radius");
					var props = this.parent.props;
					var x1 = point1.x || props.X1.value;
					var y1 = point1.y || props.Y1.value;
					var x2 = point2.x || props.X2.value;
					var y2 = point2.y || props.Y2.value;
					
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
					
					if(this.parent.props.Type.value !== 1) {
						canvas.fill();
					}
					if(this.parent.props.Type.value !== 0) {
						canvas.stroke();
					}
					this.parent.onDraw.call(canvas);
				};
				break;
			case "DrawPixel":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					
					if(!this.idata) {
						this.idata = canvas.createImageData(1,1);
					}
					var d = this.idata.data;
					var color = toRGB(canvas.fillStyle);
					d[0] = color.r;
					d[1] = color.g;
					d[2] = color.b;
					d[3] = color.a*255;
					canvas.putImageData(this.idata, x, y);    
					this.parent.onDraw.call(canvas);
				};
				break;
			case "FloodFill":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var smooth = 255*d.readFloat("Threshold")/100;
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;

					var data = canvas.getImageData(0,0,canvas.canvas.width,canvas.canvas.height);
					var d = data.data;
					var list = [];
					list.push({x: x, y: y});
					
					var color = toRGB(canvas.fillStyle);
					var r = color.r;
					var g = color.g;
					var b = color.b;
					var fIndex = y*4*data.width + x*4;
					var rf = d[fIndex+0];
					var gf = d[fIndex+1];
					var bf = d[fIndex+2];
					var af = d[fIndex+3];
					
					function isOriginPixel(index) {
						if(smooth) {
							if(d[index + 0] === r && d[index + 1] === g && d[index + 2] === b)
								return false;
							return Math.abs(d[index + 0] - rf) <= smooth && Math.abs(d[index + 1] - gf) <= smooth &&
									Math.abs(d[index + 2] - bf) <= smooth && Math.abs(d[index + 3] - af) <= smooth;
						}
						return d[index + 0] == rf && d[index + 1] == gf && d[index + 2] == bf && d[index + 3] == af;
					}
					
					if(Math.abs(r - rf) == 0 && Math.abs(g - gf) == 0 && Math.abs(b - bf) == 0) {
						// do nothing
					}
					else {
						var coord = 0;
						while(coord < list.length) {
							var p = list[coord];
							coord++;
							var left = false;
							var right = false;
							for(var l = p.y-1; l >= 0; l--) {
								var index = l*4*data.width + p.x*4;
								if(!isOriginPixel(index))
									break;
								p.y--;
							}
							for(var i = p.y; i < data.height; i++) {
								var index = i*4*data.width + p.x*4;
								if(!isOriginPixel(index))
									break;
								d[index + 0] = r;
								d[index + 1] = g;
								d[index + 2] = b;
								d[index + 3] = 255;

								if(p.x - 1 >= 0) {
									if(isOriginPixel(index - 4)) {
										if(!left)
											list.push({x: p.x-1, y: i});
										left = true;
									}
									else left = false;
								}
								if(p.x + 1 < data.width) {
									if(isOriginPixel(index + 4)) {
										if(!right)
											list.push({x: p.x+1, y: i});
										right = true;
									}
									else right = false;
								}
							}
						}
						canvas.putImageData(data, 0, 0);
					}
					this.parent.onDraw.call(canvas);
				};
				break;
			case "GetPixel":
				i.doGetPixel.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					
					var data = canvas.getImageData(x, y, 1, 1);
					var d = data.data;
					this.parent.onGetPixel.call("rgba(" + d[0] + "," + d[1] + "," + d[2] + "," + (d[3]/255) + ")");
				};
				break;
			case "Circle":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var radius = d.read("Radius");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					canvas.beginPath();
					canvas.arc(x, y, radius, 0, 2*Math.PI);
					if(this.parent.props.Type.value !== 1) {
						canvas.fill();
					}
					if(this.parent.props.Type.value !== 0) {
						canvas.stroke();
					}
					this.parent.onDraw.call(canvas);
				};
				break;
			case "DrawText":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var text = d.read("Text");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					canvas.font = props.Font.value;
					if(this.parent.props.Align.value == 1) {
						x -= canvas.measureText(text).width/2;
					}
					else if(this.parent.props.Align.value == 2) {
						x -= canvas.measureText(text).width;
					}
					if(this.parent.props.Align.value == 1) {

					}
					if(this.parent.props.Type.value !== 1) {
						canvas.fillText(text, x, y);
					}
					if(this.parent.props.Type.value !== 0) {
						canvas.strokeText(text, x, y);
					}
					this.parent.onDraw.call(canvas);
				};
				break;
			case "DrawImage":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var image = d.read("Image");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					canvas.drawImage(image, x, y);
					this.parent.onDraw.call(canvas);
				};
				break;
			case "DrawImageRegion":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var image = d.read("Image");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					canvas.drawImage(image, this.parent.sourceX, this.parent.sourceY, props.SourceWidth.value, props.SourceHeight.value, x, y, props.SourceWidth.value, props.SourceHeight.value);
					this.parent.onDraw.call(canvas);
				};
				i.run = function(){
					this.sourceX = this.props.SourceX.value;
					this.sourceY = this.props.SourceY.value;

					if(this.doSourceX) {
						this.doSourceX.onevent = function(data) {
							this.parent.sourceX = parseInt(data);
						};
					}
					if(this.doSourceY) {
						this.doSourceY.onevent = function(data) {
							this.parent.sourceY = parseInt(data);
						};
					}
				};
				break;
			case "FillStyle":
				i.doFill.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					canvas.fillStyle = d.read("Color");
					this.parent.onFill.call(canvas);
				};
				break;
			case "StrokeStyle":
				i.doStroke.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					canvas.strokeStyle = d.read("Color");
					canvas.lineWidth = d.read("Width");
					if(!this.parent.props.Cap.isDef())
						canvas.lineCap = this.parent.props.Cap.getText().toLowerCase();
					if(!this.parent.props.Join.isDef())
						canvas.lineJoin = this.parent.props.Join.getText().toLowerCase();
					this.parent.onStroke.call(canvas);
				};
				break;
			case "ShadowStyle":
				i.doShadow.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					canvas.shadowBlur = d.readFloat("Blur");
					canvas.shadowColor = d.read("Color");
					canvas.shadowOffsetX = d.readFloat("OffsetX");
					canvas.shadowOffsetY = d.readFloat("OffsetY");
					this.parent.onShadow.call(canvas);
				};
				break;
			case "CompositeOperation":
				i.doSet.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					canvas.globalCompositeOperation = this.parent.props.Type.getText();
					this.parent.onSet.call(canvas);
				};
				break;
			case "FillPattern":
				i.doCreate.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var image = d.read("Image");
					this.parent.pattern = canvas.createPattern(image, this.parent.props.Repetition.getText());
					this.parent.onCreate.call(canvas);
				};
				i.Pattern.onevent = function() {
					return this.parent.pattern;
				};
				break;
			case "LinearGradient":
				i.doCreate.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("Point1");
					var point2 = d.read("Point2");
					var props = this.parent.props;
					var x1 = point1.x || props.X1.value;
					var y1 = point1.y || props.Y1.value;
					var x2 = point2.x || props.X2.value;
					var y2 = point2.y || props.Y2.value;
					this.parent.gradient = canvas.createLinearGradient(x1, y1, x2, y2);
					this.parent.onCreate.call(this.parent.gradient);
				};
				i.Gradient.onevent = function() {
					return this.parent.gradient;
				};
				break;
			case "RadialGradient":
				i.doCreate.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("Point1");
					var r1 = d.readFloat("Radius1");
					var point2 = d.read("Point2");
					var r2 = d.readFloat("Radius2");
					var props = this.parent.props;
					var x1 = point1.x || props.X1.value;
					var y1 = point1.y || props.Y1.value;
					var x2 = point2.x || props.X2.value;
					var y2 = point2.y || props.Y2.value;
					this.parent.gradient = canvas.createRadialGradient(x1, y1, r1, x2, y2, r2);
					this.parent.onCreate.call(this.parent.gradient);
				};
				i.Gradient.onevent = function() {
					return this.parent.gradient;
				};
				break;
			case "GradientStopColor":
				i.doAdd.onevent = function(data) {
					var d = this.parent.d(data);
					var grad = d.read("Gradient");
					var index = d.readFloat("Index");
					var color = d.read("Color");
					grad.addColorStop(index, color);
					this.parent.onAdd.call(grad);
				};
				break;
			case "PathCreator":
				i.doPath.onevent = function(data) {
					var canvas = this.parent.d(data).read("Canvas");
					if(this.parent.props.Mode.isDef())
						canvas.beginPath();
					else
						canvas.closePath();
					this.parent.onPath.call(canvas);
				};
				break;
			case "RectPath":
				i.doRect.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("Point1");
					var point2 = d.read("Point2");
					var props = this.parent.props;
					var x1 = point1.x || props.X1.value;
					var y1 = point1.y || props.Y1.value;
					var x2 = point2.x || props.X2.value;
					var y2 = point2.y || props.Y2.value;
					canvas.rect(x1, y1, x2, y2);
					this.parent.onRect.call(canvas);
				};
				break;
			case "ArcPath":
				i.doArc.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var radius = d.read("Radius");
					var startAngle = d.readFloat("StartAngle");
					var endAngle = d.readFloat("EndAngle");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;

					canvas.arc(x, y, radius, startAngle, endAngle);
					this.parent.onArc.call(canvas);
				};
				break;
			case "DrawQuadraticCurve":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("CPoint");
					var point2 = d.read("Point");
					var props = this.parent.props;
					var x1 = point1.x || props.CX.value;
					var y1 = point1.y || props.CY.value;
					var x2 = point2.x || props.X.value;
					var y2 = point2.y || props.Y.value;

					canvas.quadraticCurveTo(x1, y1, x2, y2);
					this.parent.onDraw.call(canvas);
				};
				break;
			case "DrawBezierCurve":
				i.doDraw.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point1 = d.read("CPoint1");
					var point2 = d.read("CPoint2");
					var point = d.read("Point");
					var props = this.parent.props;
					var x1 = point1.x || props.CX1.value;
					var y1 = point1.y || props.CY1.value;
					var x2 = point2.x || props.CX2.value;
					var y2 = point2.y || props.CY2.value;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;

					canvas.bezierCurveTo(x1, y1, x2, y2, x, y);
					this.parent.onDraw.call(canvas);
				};
				break;
			case "PathDrawer":
				i.doDrawPath.onevent = function(data) {
					var canvas = this.parent.d(data).read("Canvas");
					switch(this.parent.props.Mode.value) {
						case 0: canvas.fill(); break;
						case 1: canvas.stroke(); break;
						case 2: canvas.clip(); break;
					}
					this.parent.onDrawPath.call(canvas);
				};
				break;
			case "MoveTo":
				i.doMoveTo.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					canvas.moveTo(x, y);
					
					this.parent.onMoveTo.call(canvas);
				};
				break;
			case "LineTo":
				i.doLineTo.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var point = d.read("Point");
					var props = this.parent.props;
					var x = point.x || props.X.value;
					var y = point.y || props.Y.value;
					canvas.lineTo(x, y);
					
					this.parent.onLineTo.call(canvas);
				};
				break;
			case "CanvasTranslate":
				i.doTranslate.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var x = d.readFloat("X");
					var y = d.readFloat("Y");
					canvas.translate(x, y);
					
					this.parent.onTranslate.call(canvas);
				};
				break;
			case "CanvasRotate":
				i.doRotate.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var a = d.readFloat("Angle");
					canvas.rotate(a);
					
					this.parent.onRotate.call(canvas);
				};
				break;
			case "CanvasScale":
				i.doScale.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					var x = d.readFloat("X");
					var y = d.readFloat("Y");
					canvas.scale(x, y);
					
					this.parent.onScale.call(canvas);
				};
				break;
			case "CanvasState":
				i.doState.onevent = function(data) {
					var d = this.parent.d(data);
					var canvas = d.read("Canvas");
					if(this.parent.props.Mode.value != 1)
						canvas.save();
					else if(this.parent.props.Mode.value == 1)
						canvas.restore();
					
					this.parent.onState.call(canvas);
					
					if(this.parent.props.Mode.value == 2)
						canvas.restore();
				};
				break;
			case "RGB":
				i.doRGB.onevent=  function(data) {
					var d = this.parent.d(data);
					var r = d.readInt("R");
					var g = d.readInt("G");
					var b = d.readInt("B");
					var a = d.readFloat("A");
					switch(this.parent.props.Type.value) {
						case 0:
							this.parent.color = "rgb(" + r + "," + g + "," + b + ")";
							break;
						case 1:
							this.parent.color = "rgba(" + r + "," + g + "," + b + "," + a + ")";
							break;
						case 2:
							this.parent.color = r + (g << 8) + (b << 16);
							break;
						case 3:
							this.parent.color = "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
							break;
					}
					this.parent.onRGB.call(this.parent.color);
				};
				i.Color.onevent = function(){
					return this.parent.color;
				};
				break;
			case "ToRGB":
				i.doGetRGB.onevent=  function(data) {
					var d = this.parent.d(data);
					var color = d.read("Color");
					this.parent.result = toRGB(color);
					this.parent.onRGB.call([this.parent.result.r, this.parent.result.g, this.parent.result.b, this.parent.result.a]);
				};
				i.R.onevent = function(){
					return this.parent.result.r;
				};
				i.G.onevent = function(){
					return this.parent.result.g;
				};
				i.B.onevent = function(){
					return this.parent.result.b;
				};
				i.A.onevent = function(){
					return this.parent.result.a;
				};
				break;
			case "RenderFrameTimer":
				i.doTimer.onevent = function(data) {
					function render() {
						i.fps ++;
						i.onTimer.call();
						i.rid = requestAnimationFrame(render);
					};
					this.parent.rid = requestAnimationFrame(render);
				};
				i.FPS.onevent = function(data) {
					var f = this.parent.fps;
					this.parent.fps = 0;
					return f;
				};
				i.run = function() { this.fps = 0; };
				i.onfree = function() { cancelAnimationFrame(this.rid); };
				break;
			case "ProgressBar":
				i.doPosition.onevent = function (data) {
					this.parent.ctl.position = data;
				};
				i.Position.onevent = function (data) {
					return this.parent.ctl.position;
				};

				i.run = function (flags) {
					this.ctl = new ProgressBar({
						max: this.props.Max.value,
						position: this.props.Position.value,
						custom: this.props.Engine.isDef()
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "TrackBar":
				i.doPosition.onevent = function (data) {
					this.parent.ctl.position = data;
				};
				i.Value.onevent = function() {
					return this.parent.ctl.position;
				};
				i.run = function (flags) {
					this.ctl = new TrackBar({
						min: this.props.Min.value,
						max: this.props.Max.value,
						step: this.props.Step.value,
						position: this.props.Value.value
					});

					this.ctl.addListener("input", function () {
						i.onPosition.call(i.ctl.position);
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Panel":
				i.run = function (flags) {
					this.ctl = new Panel({});
					this.ctl.layout = this.getLayout(this.ctl);

					return WinElement.prototype.run.call(this, flags);
				};
				i.getChild = function(){
					return this.ctl;
				};

				if(i.parent.parent && i.parent.imgs.length === 1) {
					i.flags |= window.IS_PARENT;
				}
				break;
			case "ScrollBox":
				i.run = function (flags) {
					this.ctl = new Panel({theme: "ui-scrollbox"});
					this.ctl.layout = this.getLayout(this.ctl);

					return WinElement.prototype.run.call(this, flags);
				};
				i.getChild = function(){
					return this.ctl;
				};

				if(i.parent.parent && i.parent.imgs.length === 1) {
					i.flags |= window.IS_PARENT;
				}
				break;
			case "CSS":
				i.run = function () {
					if(this.css == null) {
						this.css = document.createElement("style");
						this.css.innerHTML = this.props.StyleSheet.value;
						document.head.appendChild(this.css);
						this.cssref = 1;
					}
					else {
						this.cssref++;
					}
				};
				i.onfree = function() {
					this.cssref--;
					if(this.css && this.cssref == 0) {
						document.head.removeChild(this.css);
						this.css = null;
					}
				};
				break;
			case "Spoiler":
				i.run = function (flags) {
					this.ctl = new Spoiler({caption: "Spoil me"});
					this.ctl.layout = this.getLayout(this.ctl);

					return WinElement.prototype.run.call(this, flags);
				};
				i.getChild = function(){
					return this.ctl;
				};

				if(i.parent.parent) {
					i.flags |= window.IS_PARENT;
				}
				break;
			case "Hub":
				i.onpropchange = function(prop) {
					Hub.prototype.onpropchange.call(this, prop);
					if(prop.name === "InCount") {
						for(var i in this.points) {
							if(this.points[i].type === pt_work) {
								this.points[i].onevent = function(data) {
									for (var i = 0; i < this.parent.props.OutCount.value; i++) {
										this.parent.points["onEvent" + (i+1)].call(data);
									}
								};
							}
						}
					}
				};
				i.onpropchange(i.props.InCount);
				break;
			case "HubEx":
				for(var p = 0; p < 3; p++) {
					i[i.pIndex[p]].onevent = function(data) { this.parent.onEvent.call(data); };
				}
				break;
			case "GetDataEx":
				for(var p = 0; p < 3; p++) {
					i[i.pIndex[p]].onevent = function(data) { return readProperty(data, this.parent.Data); };
				}
				i.onpropchange(i.props.Angle);
				break;
			case "Case":
				i.doCase.onevent = function(data) {
					if(data == this.parent.props.Value.value) {
						this.parent.onTrue.call(this.parent.props.DataOnTrue.value);
					}
					else {
						this.parent.onNextCase.call(data);
					}
				};
				break;
			case "IndexToChannel":
				i.doEvent.onevent = function(data) {
					var name = "onEvent" + (this.parent.d(data).readInt("Index") + 1);
					if(this.parent[name]) {
						this.parent[name].call(this.parent.props.Data.value);
					}
				};
				break;
			case "ChannelToIndex":
				i.onpropchange = function(prop) {
					DPElement.prototype.onpropchange.call(this, prop);
					for(var j = 0; j < this.props.Count.value; j++) {
						this["doWork" + (j + 1)].onevent = function(index){ return function(data) { this.parent.onIndex.call(index); } }(j);
					}
				};
				i.onpropchange(i.props.Count);
				break;
			case "TimeCounter":
				i.doStart.onevent = function(data){
					this.parent.counter = window.performance.now();
					this.parent.onStart.call(data);
				};
				i.doStop.onevent = function(){
					this.parent.elapsed = window.performance.now() - this.parent.counter;
					this.parent.onStop.call(this.parent.elapsed);
				};
				i.Elapsed.onevent = function(){ return this.parent.elapsed; };
				i.run = function(){ this.counter = this.elapsed = 0; };
				break;
			case "Switch":
				i.getValue = function() {
					var r = this.d("");
					return this.state ? r.read("DataOn") : r.read("DataOff");
				};
				i.change = function() {
					var data = this.getValue();
					this.onSwitch.call(data);
					if(this.state) {
						this.onOn && this.onOn.call(data);
					}
					else {
						this.onOff && this.onOff.call(data);
					}
				};
				i.doSwitch.onevent = function(){
					this.parent.state = !this.parent.state;
					this.parent.change();
				};
				i.doReset.onevent = function(){
					if(this.parent.state) {
						this.parent.state = false;
						this.parent.change();
					}
				};
				i.State.onevent = function(){ return this.parent.getValue(); };
				i.run = function(){
					this.state = !this.props.Default.isDef();

					if(this.doOn) {
						this.doOn.onevent = function(){
							if(!this.parent.state) {
								this.parent.state = true;
								this.parent.change();
							}
						};
					}
				};
				break;
			case "ArraySplit":
				i.doSplit.onevent = function(data) {
					this.parent.onSplit.call(readProperty(data, this.parent.String).split(this.parent.props.Delimiter.value));
				};
				break;
			case "ArrayBuilder":
				i.doBuild.onevent = function(data) {
					var array = [];
					var d = this.parent.d(data);
					for(var i in this.parent.points) {
						var point = this.parent.points[i];
						if(point.type === pt_data) {
							array.push(d.read(point.name));
						}
					}
					this.parent.onBuild.call(array);
				};
				break;
			case "ArrayJoin":
				i.doJoin.onevent = function(data) {
					var d = this.parent.d(data);
					var array = d.read("Array");
					var s = d.read("Separator");
					this.parent.onJoin.call(array.join(s));
				};
				break;
			case "ArrayIndexOf":
				i.doIndexOf.onevent = function(data) {
					var d = this.parent.d(data);
					var array = d.read("Array");
					var value = d.read("Value");
					var from = d.readInt("FromIndex");
					this.parent.onIndexOf.call(array.indexOf(value, from));
				};
				break;
			case "JSON":
				i.doConvert.onevent = function(data) {
					var d = this.parent.d(data).read("Data");
					if(this.parent.props.Mode.isDef()) {
						this.parent.result = JSON.parse(d);
					}
					else {
						this.parent.result = JSON.stringify(d);
					}
					this.parent.onConvert.call(this.parent.result);
				};
				i.Result.onevent = function(data) {
					return this.parent.result;
				};
				break;
			case "JSON_Field":
				i.doGet.onevent = function(data) {
					var d = this.parent.d(data);
					var object = d.read("Object");
					var name = d.read("Name");
					this.parent.onGet.call(this.parent.result = object[name]);
				};
				i.Result.onevent = function() {
					return this.parent.result;
				};
				break;
			case "JSON_Field_Set":
				i.doSet.onevent = function(data) {
					var d = this.parent.d(data);
					var object = d.read("Object");
					var name = d.read("Name");
					object[name] = d.read("Value");
					this.parent.onSet.call(object);
				};
				break;
			case "JSON_Enum":
				i.doEnum.onevent = function(data) {
					var d = this.parent.d(data);
					var object = d.read("Object");
					for(var name in object) {
						this.parent.onEnum.call(name);
					}
					this.parent.onEndEnum.call();
				};
				break;
			case "Object":
				i.doCreate.onevent = function(data) {
					this.parent.result = {};
					this.parent.onCreate.call(this.parent.result);
				};
				i.Object.onevent = function(data) {
					return this.parent.result;
				};
				i.run = function(){ this.result = {}; };
				break;
			case "ObjectToArray":
				i.doConvert.onevent = function(data) {
					var d = this.parent.d(data);
					var object = d.read("Object");

					this.parent.array = [];
					for(var item of this.parent.props.Fields.value.split("\n"))
						this.parent.array.push(object[item]);
					this.parent.onConvert.call(this.parent.array);
				};
				i.Array.onevent = function(data) {
					return this.parent.array;
				};
				i.run = function(){ this.array = []; };
				break;
			case "ObjectReader":
				i.doRead.onevent = function(data) {
					var d = this.parent.d(data);
					var object = d.read("Object");

					this.parent.object = object;
					for(var p in this.parent.points) {
						var point = this.parent.points[p];
						if(point.type == pt_event) {
							point.call(object[point.name.substring(2)]);
						}
					}
				};
				i.addPoint = function(name, type) {
					var point = DPLElement.prototype.addPoint.call(this, name, type);
					if(point.type == pt_var) {
						point.onevent = function() {
							return this.parent.object[this.name];
						};
					}
					return point;
				};
				break;
			case "FormatStr":
				i.doString.onevent = function(data) {
					var r = this.parent.d(data);
					var _data = this.parent.props.Mask.value;
					for(var s = 1; s <= this.parent.props.DataCount.value; s++) {
						_data = _data.replace(new RegExp("%" + s, 'g'), r.read("Str" + s));
					}
					this.parent.onFString.call(this.parent.result = _data);
				};
				i.FString.onevent = function() {
					return this.parent.result;
				};
				i.run = function() { this.result = ""; };
				i.onpropchange(i.props.DataCount);
				break;
			case "Counter":
				i.cnt = 0;
				i.doNext.onevent = function (data) {
					var e = this.parent;
					e.cnt += e.props.Step.value;
					if (e.cnt > e.props.Max.value)
						e.cnt = e.props.Min.value;
					e.onCounter.call(e.cnt);
				};
				i.doReset.onevent = function (data) {
					this.parent.run();
					this.parent.onCounter.call(this.parent.cnt);
				};
				i.Value.onevent = function () {
					return this.parent.cnt;
				};
				i.run = function () {
					this.cnt = this.props.Default.value;
					return null;
				};
				break;
			case "Message":
				i.doMessage.onevent = function (data) {
					alert(readProperty(data, this.parent.Text, this.parent.props.Text.value));
					this.parent.onMessage.call(data);
				};
				break;
			case "DoData":
				i.doData.onevent = function (data) {
					this.parent.onEventData.call(readProperty("", this.parent.Data, this.parent.props.Data.value));
				};
				break;
			case "For":
				i.doFor.onevent = function (data) {
					var e = this.parent;
					var r = e.d(data);
					var end = r.readInt("End");
					var start = r.readInt("Start");
					var s = e.props.Step.value;
					for (e.cnt = start; e.cnt < end; e.cnt += s) {
						e.onEvent.call(e.cnt);
					}
					e.onStop.call();
				};
				i.doStop.onevent = function() {
					this.parent.cnt = this.parent.props.End.value;
				};
				i.Position.onevent = function (data) {
					return this.parent.cnt;
				};
				i.run = function(){ this.cnt = 0; };
				break;
			case "Random":
				i.rnd = 0.0;
				i.doRandom.onevent = function (data) {
					this.parent.onRandom.call(this.parent.rnd = Math.random());
				};
				i.Result.onevent = function (data) {
					return this.parent.rnd;
				};
				i.run = function () {
					this.rnd = 0.0;
					return null;
				};
				break;
			case "Memory":
				i.data = "";
				i.doValue.onevent = function (data) {
					this.parent.data = data;
					this.parent.onData.call(data);
				};
				i.doClear.onevent = function (data) {
					this.parent.data = this.parent.props.Default.value;
					this.parent.onData.call("");
				};
				i.Value.onevent = function (data) {
					return this.parent.data;
				};
				i.run = function () {
					this.data = this.props.Default.value;
					return null;
				};
				break;
			case "Image":
				i.doLoad.onevent = function (data) {
					this.parent.ctl.url = readProperty(data, this.parent.URL);
				};
				i.Image.onevent = function (data) {
					return this.parent.ctl.getControl();
				};
				i.run = function (flags) {
					this.ctl = new UIImage({
						url: this.props.URL.value,
						mode: this.props.Mode.value
					});

					this.ctl.addListener("load", function() {
						i.onLoad.call();
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Figure":
				i.run = function (flags) {
					this.ctl = new SVG({
						shape: this.props.Shape.value,
						fill: this.props.Fill.value,
						stroke: this.props.Stroke.value,
						strokeWidth: this.props.StrokeWidth.value
					});
					if(i.doFill) {
						i.doFill.onevent = function(data) {
							this.parent.ctl.fill(data);
						};
					}

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Loader":
				i.run = function (flags) {
					this.ctl = new UILoader({
						size: this.props.Size.value,
						radius: this.props.Radius.value
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Switcher":
				i.State.onevent = function(){
					return this.parent.ctl.on ? 1: 0;
				};
				i.run = function (flags) {
					this.ctl = new UISwitcher({
						on: this.props.On.value
					});

					this.ctl.addListener("onchange", function(value) {
						i.onState.call(value ? 1: 0);
					});

					if(this.doOn) {
						this.doOn.onevent = function(data) {
							this.parent.ctl.on = data;
						};
					}

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ToolBar":
				i.run = function (flags) {
					var array = [];
					if(!this.props.Buttons.isDef()) {
						array = JSON.parse(this.props.Buttons.value);
						var index = 0;
						for(var a of array) {
							if(a.title !== "-") {
								if(!a.tag) {
									a.tag = index;
								}
								a.click = function(btn) {
									i.onClick.call(this.tag);
								};
								index++;
							}
						}
					}
					this.ctl = new ToolBar(array, {url: this.props.URL.value});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "SimpleTable":
				i.onpropchange = function(prop) {
					this.onSelect.args = this.props.Select.getText();
					this.onClick.args = this.props.Select.getText();
				};
				i.run = function (flags) {
					var columns = this.props.Columns.isDef() ? null : JSON.parse(this.props.Columns.value);
					if(columns && translate) {
						for(var col of columns) {
							col.title = translate.translate(col.title);
						}
					}
					this.ctl = new UISimpleTable({
						columns: columns,
						headers: this.props.Headers.isDef(),
						lineheight: this.props.LineHeight.isDef() ? 0 : this.props.LineHeight.value,
						showgrid: this.props.ShowGrid.isDef()
					});

					this.ctl.addListener("rowclick", function (item, index) {
						i.onClick.call(i.props.Select.isDef() ? index : item.data);
					});
					this.ctl.addListener("rowselect", function (item, index) {
						i.onSelect.call(i.props.Select.isDef() ? index : item.data);
					});
					this.initPointHandler("doSelectIndex", function (data) {
						if(data >= 0 && data < this.parent.ctl.size()) {
							this.parent.ctl.selectIndex(data);
						}
					});

					return WinElement.prototype.run.call(this, flags);
				};
				i.doAddRow.onevent = function(data) {
					this.parent.ctl.addRow(data);
				};
				i.doClear.onevent = function() {
					this.parent.ctl.clear();
				};
				break;
			case "DropBox":
				i.run = function (flags) {
					this.ctl = new DropBox({

					});

					this.ctl.addListener("drop", function(file) {
						i.onDropFile.call(file);
					});
					this.ctl.addListener("enddrop", function() {
						i.onEndDrop.call();
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "If_else":
				i.doCompare.onevent = function (data) {
					var d = this.parent.d(data);
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
						this.parent.onTrue.call(data);
					else
						this.parent.onFalse.call(data);
				};
				i.run = function () {
					return null;
				};
				break;
			case "MathParse":
				i.doCalc.onevent = function (data) {
					var args = [this.parent.result];
					var d = this.parent.d(data);
					for (var name of this.parent.arr) {
						var arg = d.read(name);
						args.push(Array.isArray(arg) ? arg : parseFloat(arg));
					}
					this.parent.result = this.parent.calc(args);
					this.parent.onResult.call(this.parent.result);
				};
				i.doClear.onevent = function (data) {
					this.parent.result = this.parent.props.Default.value;
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.prepareMask = function(mask) {
					var s = mask;
					this.arr = this.props.Args.value.split("\n");
					for(var i = 0; i < this.arr.length; i++) {
						s = s.replace(new RegExp("\\$" + this.arr[i], "g"), "%" + (i+1));
					}
					s = s.replace(/\$result/g, "%0");
					s = s.replace(/([_a-zA-Z]+)/g, function(m, c){ return "Math." + c; });
					s = s.replace(/%([0-9]+)/g, function(m, c){ return "args[" + c + "]"; });
					this.calc = new Function("args", "return " + s);
					Math.point = function(x, y){ return {x: x, y: y}; };
				};
				i.run = function () {
					this.result = this.props.Default.value;
					this.prepareMask(this.props.MathStr.value);
					if(this.doMathStr) {
						this.doMathStr.onevent = function (data) {
							this.parent.prepareMask(data);
						};
					}

					return null;
				};
				i.onpropchange = function(prop) {
					DPLElement.prototype.onpropchange.call(this, prop);

					if(prop === this.props.DataCount && this.props.Args.isDef()) {
						var arr = [];
						for(var i = 1; i <= prop.value; i++) {
							arr.push("X" + i);
						}
						this.props.Args.value = arr.join("\n");
						this.onpropchange(this.props.Args);
					}
				};
				i.onpropchange(i.props.Args);
				break;
			case "StrCat":
				i.doStrCat.onevent = function (data) {
					var d = this.parent.d(data);
					this.parent.result = d.read("Str1") + d.read("Str2");
					this.parent.onStrCat.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				break;
			case "StrPart":
				i.doSplit.onevent = function (data) {
					var str = this.parent.d(data).read("Str");
					var c = this.parent.props.Char.value;
					var i = str.indexOf(c);
					if(i >= 0) {
						this.parent.onPart.call(this.parent.result = str.substr(0, i));
						this.parent.onSplit.call(str.substr(i+c.length));
					}
					else {
						this.parent.onSplit.call(str);
					}
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				break;
			case "StrList":
				i.doAdd.onevent = function (data) {
					this.parent.array.push(readProperty(data, this.parent.Str));
					this.parent.onChange.call();
				};
				i.doText.onevent = function (data) {
					this.parent.array = data.split("\n");
					this.parent.onChange.call();
				};
				i.Text.onevent = function (data) {
					return this.parent.array.join("\n");
				};
				i.Array.onevent = function (data) {
					return this.parent.array;
				};
				i.run = function () {
					this.array = this.props.Strings.value ? this.props.Strings.value.split("\n") : [];
					if(i.doDelete) {
						i.doDelete.onevent = function(data) {
							this.parent.array.splice(data, 1);
							this.parent.onChange.call();
						};
					}
				};
				break;
			case "Copy":
				i.doCopy.onevent = function (data) {
					var d = this.parent.d(data);
					this.parent.result = d.read("Str").substr(d.readInt("Position"), d.readInt("Count"));
					this.parent.onCopy.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				break;
			case "Position":
				i.doPosition.onevent = function (data) {
					var d = this.parent.d(data);
					this.parent.result = d.read("String").indexOf(d.read("Search"), d.readInt("FromIndex"));
					this.parent.onPosition.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.run = function(){ this.parent.result = -1; };
				break;
			case "Replace":
				i.doReplace.onevent = function (data) {
					var d = this.parent.d(data);
					this.parent.result = d.read("SrcStr").
						replace(this.parent.props.UseRegExp.isDef() ? d.read("SubStr") : new RegExp(d.read("SubStr"), 'g'), d.read("DestStr"));
					this.parent.onReplace.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.run = function(){ this.parent.result = ""; };
				break;
			case "Insert":
				i.doInsert.onevent = function (data) {
					var flow = this.parent.d(data);
					var str = flow.read("Str");
					var substr = flow.read("SubStr");
					var pos = flow.read("Position");
					this.parent.result = str.substr(0, pos) + substr + str.substr(pos);
					this.parent.onInsert.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.run = function(){ this.parent.result = ""; };
				break;
			case "Delete":
				i.doDelete.onevent = function (data) {
					var d = this.parent.d(data);
					var s = d.read("Str");
					var pos = d.readInt("Position");
					var count = d.readInt("Count");
					this.parent.result = s.substr(0, pos) + s.substr(pos + count);
					this.parent.onDelete.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.run = function(){ this.parent.result = ""; };
				break;
			case "Length":
				i.doLength.onevent = function (data) {
					this.parent.result = readProperty(data, this.parent.Str).toString().length;
					this.parent.onLength.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.run = function(){ this.parent.result = 0; };
				break;
			case "StrCase":
				i.doModify.onevent = function (data) {
					var s = this.parent.d(data).read("Str");
					this.parent.result = this.parent.props.Type.isDef() ? s.toLowerCase() : s.toUpperCase();
					this.parent.onModify.call(this.parent.result);
				};
				i.Result.onevent = function (data) {
					return this.parent.result;
				};
				i.run = function(){ this.parent.result = ""; };
				break;
			case "RE_Search":
				i.doExec.onevent = function(data) {
					var str = readProperty(data, this.parent.String, "");
					var reg = new RegExp(this.parent.props.Mask.value, "");
					var arr = reg.exec(str);
					if(arr) {
						var result = [];
						for(var i = 1; i < arr.length; i++) {
							result.push(arr[i]);
						}
						this.parent.onExec.call(result);
					}
					else {
						this.parent.onNotFound.call();
					}
				};
				break;
			case "FileInfo":
				i.doInfo.onevent = function(data) {
					this.parent.file = readProperty(data, this.parent.File);
					this.parent.onInfo.call(this.parent.file);
				};
				i.Name.onevent = function(){
					return this.parent.file ? this.parent.file.name : "";
				};
				i.Size.onevent = function(){
					return this.parent.file ? this.parent.file.size : -1;
				};
				i.Mime.onevent = function(){
					return this.parent.file ? this.parent.file.type : "";
				};
				i.Time.onevent = function(){
					return this.parent.file ? this.parent.file.lastModified : "";
				};
				break;
			case "FileRead":
				i.doRead.onevent = function(data) {
					var file = readProperty(data, this.parent.File);

					var reader = new FileReader();
					reader.onload = function(e) {
						i.onRead.call(e.target.result);
					};
					switch(this.parent.props.Type.value) {
						case 0: reader.readAsText(file); break;
						case 1: reader.readAsArrayBuffer(file); break;
						case 2: reader.readAsDataURL(file); break;
					}
				};
				break;
			case "ODialog":
				i.doExecute.onevent = function(data) {
					var input = document.createElement("input");
					input.setAttribute("type", "file");
					if(!this.parent.props.Filter.isDef()) {
						input.setAttribute("accept", this.parent.props.Filter.value);
					}
					if(!this.parent.props.Select.isDef()) {
						input.setAttribute("multiple", "");
					}
					input.click();
					input.addEventListener("change", function(event){
						for(var f = 0; f < this.files.length; f++) {
							i.onExecute.call(this.files[f]);
						}
					});
				};
				break;
			case "Timer":
				var f = {func: function () {
						this.e.onTimer.call();
						if (this.e.auto) {
							this.e.start();
							this.e.auto--;
						}
					}, e: i};
				i.doTimer.onevent = function (data) {
					if (this.parent.props.AutoStop.value) {
						this.parent.auto = this.parent.props.AutoStop.value - 1;
						this.parent.start();
					} else {
						clearInterval(this.parent.id);
						this.parent.id = setInterval(function () {
							f.func.call(f);
						}, this.parent.interval);
					}
				};
				i.doStop.onevent = function (data) {
					if(this.parent.id) {
						clearInterval(this.parent.id);
						this.parent.id = 0;
					}
				};
				i.oninit = function() {
					this.interval = this.props.Interval.value;
					this.initPointHandler("doInterval", function(data) {
						this.parent.interval = data;
						if(this.parent.id) {
							this.parent.doStop.onevent();
							this.parent.doTimer.onevent();
						}
					});
				};
				i.onfree = function () {
					clearInterval(this.id);
				};

				i.start = function () {
					setTimeout(function () {
						f.func.call(f);
					}, this.interval);
				};
				break;
			case "GeoLocation":
				i.doLocation.onevent = function(data){
					navigator.geolocation.getCurrentPosition(function(pos){
						i.onLocation.call([pos.coords.latitude, pos.coords.longitude]);
					});
				};
				break;
			case "Window":
				i.doOpen.onevent = function(data){
					var props = this.parent.props;
					var f = [];
					var opt = ["Toolbar", "Location", "Directories", "Status", "Menubar", "Scrollbars", "Resizable"];
					for(var o of opt) {
						if(!props[o].isDef())
							f.push(o.toLocaleString() + "=1");
					}
					
					if(!props.Width.isDef())
						f.push("width=" + props.Width.value); 
					if(!props.Height.isDef())
						f.push("height=" + props.Height.value); 
					
					this.parent.wnd = window.open(props.URL.value, props.Name.value, f.join(","));
					this.parent.onOpen.call();
				};
				i.doClose.onevent = function(data){
					if(this.parent.wnd)
						this.parent.wnd.close();
					else
						window.close();
				};
				i.Location.onevent = function(){
					return window.location.href;
				};
				break;
			case "MainForm":
				i.doShow.onevent = function() {
					this.parent.ctl.show({noCenter: !this.parent.props.Position.isDef()});
				};
				i.doClose.onevent = function() {
					this.parent.ctl.close();
				};
				i.run = function(flags) {
					// if(flags & window.FLAG_USE_EDIT) {
					// 	return null;
					// }

					this.ctl = new Dialog({
						title: this.props.Caption.getTranslateValue(),
						icon: this.props.URL.value,
						destroy: !(flags & window.FLAG_USE_CHILD || flags & window.FLAG_USE_EDIT),
						resize: this.props.Resize.value && !(flags & window.FLAG_USE_EDIT),
						width: this.props.Width.value,
						height: this.props.Height.value,
						modal: !(flags & window.FLAG_USE_EDIT),
						popup: !(flags & window.FLAG_USE_EDIT),
						showcaption: this.props.ShowCaption.isDef(),
						showborder: this.props.ShowBorder.isDef(),
						theme: this.props.Position.value === 2 ? "dialog-fullscreen" : ""
					});

					if(flags & window.FLAG_USE_EDIT) {
						this.ctl.addListener("close", function(){ return false; });
					}
					else if(!(flags & window.FLAG_USE_CHILD)) {
						this.ctl.addListener("close", function(){
							i.parent.stop(window.FLAG_USE_RUN);
							return true;
						});
					}

					this.ctl.layout = this.getLayout(this.ctl);

					WinElement.prototype.run.call(this, flags);
					if(!(flags & window.FLAG_USE_CHILD)) {
						this.ctl.show({noCenter: this.props.Position.value === 0, fullScreen: this.props.Position.value === 2});
					}
					return this.ctl
				};
				i.oninit = function() {
					this.onCreate.call();
				};
				i.addPoint = function(name, type) {
					var point = SdkElement.prototype.addPoint.call(this, name, type);
					if(name === "doCaption") {
						point.onevent = function (data) {
							this.parent.ctl.caption = data;
						};
					}
					return point;
				};
				i.getChild = function(){
					return null;
				};

				if(!i.parent.parent || i.parent.imgs.length === 1) {
					i.flags |= window.IS_PARENT;
				}
				break;
			case "SiteWidget":
				i.run = function(flags) {
					this.ctl = new Panel({theme: ""});

					this.ctl.layout = this.getLayout(this.ctl);

					WinElement.prototype.run.call(this, flags);
					if(!(flags & window.FLAG_USE_CHILD)) {
						this.ctl.show({});
					}
					return this.ctl
				};
				i.oninit = function() {
					this.onCreate.call();
				};
				i.getChild = function(){
					return null;
				};

				i.flags |= window.IS_PARENT;
				break;
			case "Host":
				i.doIP.onevent = function() {
					$.get("server/core.php?ip", function(data, object) {
						object.onIP.call(data);
					}, this.parent);
				};
				break;
			case "URLBuilder":
				i.doBuild.onevent = function(data) {
					var d = this.parent.d(data);
					var result = "";
					for(var i in this.parent.points) {
						var point = this.parent.points[i];
						if(point.type === pt_data) {
							if(result) {
								result += "&";
							}
							result += point.name + "=" + encodeURIComponent(d.read(point.name));
						}
					}
					this.parent.onBuild.call(this.parent.result = result);
				};
				i.Result.onevent = function() {
					return this.parent.result;
				};
				i.onpropchange(i.props.Args);
				break;
			case "HTTP_Get":
				i.doDownload.onevent = function(data) {
					$.post("server/core.php", {url: readProperty(data, this.parent.URL, this.parent.props.URL.value)}, function(data, object) {
						if(this.status != 200) {
							var error = JSON.parse(data);
							object.onError.call(error.code);
						}
						else {
							object.onDownload.call(data);
						}
					}, this.parent);
				};
				break;
			case "XMLHttpRequest":
				i.doOpen.onevent = function(data) {
					this.parent.xhr = new XMLHttpRequest();
					var method = this.parent.props.Method.getText();
					if(!this.parent.props.ResponseType.isDef())
						this.parent.xhr.responseType = this.parent.props.ResponseType.getText().toLowerCase();
					this.parent.xhr.open(method, this.parent.d(data).read("URL"), true);
					if(method === "POST") {
						this.parent.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
					}
				};
				i.doSend.onevent = function(data) {
					this.parent.xhr.send(this.parent.d(data).read("Content"));
					this.parent.xhr.onload = function() {
						if(this.status != 200) {
							i.onError.call(this.status);
						}
						else {
							if(i.props.ResponseType.isDef())
								i.data = this.responseText;
							else if(i.props.ResponseType.value == 3)
								i.data = this.responseXML;
							else
								i.data = this.response;
							i.onLoad.call(i.data);
						}
					};
				};
				i.Data.onevent = function(data) {
					return this.parent.data;
				};
				break;
			case "MultiElement":
				i.run = function(flags) {
					// if(flags & window.FLAG_USE_RUN) {
						return this.sdk.run(flags | window.FLAG_USE_CHILD);
					// }
				};
				i.onfree = function(flags) {
					return this.sdk.stop(flags | window.FLAG_USE_CHILD);
				};
				break;
			case "MultiElementEx":
				i.run = function(flags) {
					// if(flags & window.FLAG_USE_RUN) {
						return this.sdk.run(flags | window.FLAG_USE_CHILD);
					// }
				};
				i.onfree = function(flags) {
					return this.sdk.stop(flags | window.FLAG_USE_CHILD);
				};
				break;
			case "Array":
				i.doClear.onevent = function(data) {
					this.parent.array = [];
					this.parent.onClear.call();
				};
				i.Array.onevent = function() {
					return this.parent.array;
				};
				i.run = function(){
					this.array = this.props.Array.isDef() ? [] : JSON.parse(this.props.Array.value);
				};
				break;
			case "Matrix":
				i.doClear.onevent = function(data) {
					this.parent.run();
					this.parent.onClear.call(this.parent.array);
				};
				i.Array.onevent = function() {
					return this.parent.array;
				};
				i.run = function() {
					this.array = [];
					if(!this.props.Array.isDef()) {
						this.array = JSON.parse(this.props.Array.value);
					}
					else if(!this.props.Width.isDef() && !this.props.Height.isDef()) {
						for(var x = 0; x < this.props.Height.value; x++) {
							var a = [];
							for(var y = 0; y < this.props.Width.value; y++) {
								a.push(0);
							}
							this.array.push(a);
						}
					}
				};
				break;
			case "ArrayRead":
				i.doRead.onevent = function(data) {
					var d = this.parent.d(data);
					var array = d.read("Array");
					var index = d.readInt("Index");
					if(index >= 0 && index < array.length) {
						this.parent.onRead.call(this.parent.value = array[index]);
					}
				};
				i.Value.onevent = function() {
					return this.parent.value;
				};
				break;
			case "ArrayRemove":
				i.doRemove.onevent = function(data) {
					var d = this.parent.d(data);
					var array = d.read("Array");
					var index = d.readInt("Index");
					array.splice(index, 1);
					this.parent.onRemove.call(array);
				};
				break;
			case "ArrayWrite":
				i.doWrite.onevent = function(data) {
					var d = this.parent.d(data);
					var array = d.read("Array");
					var index = d.readInt("Index");
					array[index] = d.read("Value");
					this.parent.onWrite.call(array);
				};
				break;
			case "ArrayAdd":
				i.doAdd.onevent = function(data) {
					var d = this.parent.d(data);
					var array = d.read("Array");
					array.push(d.read("Value"));
					this.parent.onAdd.call(array);
				};
				break;
			case "ArraySize":
				i.arraySize = -1;
				i.doSize.onevent = function(data) {
					var array = readProperty(data, this.parent.Array);
					this.parent.onSize.call(this.parent.arraySize = array.length);
				};
				i.Size.onevent = function(data) {
					return this.parent.arraySize;
				};
				break;
			case "ArrayEnum":
				i.doEnum.onevent = function(data) {
					var array = readProperty(data, this.parent.Array);
					if(this.parent.props.Direction.value === 0) {
						for(var i in array) {
							this.parent.index = i;
							this.parent.onEnum.call(this.parent.item = array[i]);
						}
					}
					else {
						for(var i = array.length-1; i >= 0; i--) {
							this.parent.index = i;
							this.parent.onEnum.call(this.parent.item = array[i]);
						}
					}
					this.parent.onEnd.call();
				};
				i.Item.onevent = function() {
					return this.parent.item;
				};
				i.Index.onevent = function() {
					return this.parent.index;
				};
				break;
			case "MatrixEnum":
				i.doEnum.onevent = function(data) {
					var m = this.parent.d(data).read("Matrix");
					for(var row = 0; row < m.length; row++) {
						for(var col = 0; col < m[row].length; col++) {
							this.parent.index = [col,row];
							this.parent.item = m[row][col];
							if(this.parent.props.Data.isDef()) {
								this.parent.onEnum.call(this.parent.item);
							}
							else {
								this.parent.onEnum.call([this.parent.item, col, row]);
							}
						}
					}
					this.parent.onEnd.call();
				};
				i.Item.onevent = function() {
					return this.parent.item;
				};
				i.Index.onevent = function() {
					return this.parent.index;
				};
				break;
			case "MatrixRead":
				i.doRead.onevent = function(data) {
					var d = this.parent.d(data);
					var m = d.read("Matrix");
					var index = d.read("Index");
					if(index[1] >= 0 && index[1] < m.length) {
						var row = m[index[1]];
						if(index[0] >= 0 && index[0] < row.length) {
							this.parent.onRead.call(this.parent.value = row[index[0]]);
						}
					}
				};
				i.Value.onevent = function() {
					return this.parent.value;
				};
				break;
			case "MatrixWrite":
				i.doWrite.onevent = function(data) {
					var d = this.parent.d(data);
					var m = d.read("Matrix");
					var index = d.read("Index");
					var value = d.read("Value");
					if(index[1] >= 0 && index[1] < m.length) {
						var row = m[index[1]];
						if(index[0] >= 0 && index[0] < row.length) {
							row[index[0]] = value;
							this.parent.onWrite.call(m);
						}
					}
				};
				break;

			case "YaMap":
				i.doPlacemark.onevent = function(data) {
					this.parent.ctl.setPlacemark(data[0], data[1], data[2], data[3]);
				};
				i.doGoto.onevent = function(data) {
					this.parent.ctl.setCenter(data[0], data[1]);
				};
				i.run = function (flags) {
					this.ctl = new YaMap();

					return WinElement.prototype.run.call(this, flags);
				};
				i.oninit = function() {
					WinElement.prototype.oninit.call(this);

					this.ctl.init();
					this.ctl.addListener("coords", function(posXY) {
						i.onCoords.call(posXY);
					});
				};
				break;
			case "YouTube":
				i.run = function(flags) {
					this.ctl = new YouTube({url: this.props.URL.value});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ChartData":
				i.Data.onevent = function() {
					if(!this.parent.data) {
						this.parent.init();
					}
					return this.parent.data;
				};
				i.init = function(){
					if(this.props.Array.isDef()) {
						this.data = new window.google.visualization.DataTable();
					}
					else {
						this.data = window.google.visualization.arrayToDataTable(JSON.parse(this.props.Array.value));
					}
				};
				i.run = function(){ this.data = null; };
				break;
			case "ChartDataSet":
				i.doSet.onevent = function(data) {
					var d = this.parent.d(data);
					var dataTable = d.read("Data");
					dataTable.setValue(d.readInt("Row"), d.readInt("Column"), d.read("Value"));
					this.parent.onSet.call(dataTable);
				};
				break;
			case "ChartDataAddColumn":
				i.doAdd.onevent = function(data) {
					var d = this.parent.d(data);
					var dataTable = d.read("Data");
					dataTable.addColumn(["string", "number"][this.parent.props.Type.value], d.read("Title"));
					this.parent.onAdd.call(dataTable);
				};
				break;
			case "ChartDataAddRow":
				i.doAdd.onevent = function(data) {
					var d = this.parent.d(data);
					var dataTable = d.read("Data");
					dataTable.addRow(d.read("Value"));
					this.parent.onAdd.call(dataTable);
				};
				break;
			case "ChartDataRemoveRow":
				i.doRemove.onevent = function(data) {
					var d = this.parent.d(data);
					var dataTable = d.read("Data");
					var index = d.read("Index");
					var count = d.read("Count");
					dataTable.removeRows(index, count);
					this.parent.onRemove.call(dataTable);
				};
				break;
			case "ChartPie":
				i.run = function(flags) {
					this.ctl = new GoogleChart({
						theme: flags & FLAG_USE_EDIT ? "invisible-control" : "",
						chart: "PieChart",
						title: this.props.Title.value,
						pieHole: this.props.Hole.value,
						chartArea: {
							left: this.props.AreaLeft.value,
							top: this.props.AreaTop.value,
							width: this.props.AreaWidth.value,
							height: this.props.AreaHeight.value
						}
					});

					return WinElement.prototype.run.call(this, flags);
				};
				i.doDraw.onevent = function(data) {
					this.parent.ctl.draw(readProperty(data, this.parent.Data));
				};
				i.oninit = function() {
					WinElement.prototype.oninit.call(this);

					this.ctl.init();
				};
				break;
			case "ChartGauge":
				i.run = function(flags) {
					this.ctl = new GoogleChart({
						chart: "Gauge"
					});

					return WinElement.prototype.run.call(this, flags);
				};
				i.doDraw.onevent = function(data) {
					this.parent.ctl.draw(readProperty(data, this.parent.Data));
				};
				i.oninit = function() {
					WinElement.prototype.oninit.call(this);

					this.ctl.init();
				};
				break;
			case "ChartLine":
				i.run = function(flags) {
					this.ctl = new GoogleChart({
						chart: "LineChart"
					});

					return WinElement.prototype.run.call(this, flags);
				};
				i.doDraw.onevent = function(data) {
					this.parent.ctl.draw(readProperty(data, this.parent.Data));
				};
				i.oninit = function() {
					WinElement.prototype.oninit.call(this);

					this.ctl.init();
				};
				break;
			case "Firebase":
				i.run = function(flags) {
					if(!(flags & window.FLAG_USE_EDIT)) {
						var parent = this;
						$.appendScript("https://www.gstatic.com/firebasejs/live/3.0/firebase.js", function(){
							var config = {
								apiKey: parent.props.ApiKey.value,
								authDomain: parent.props.AuthDomain.value,
								databaseURL: parent.props.DatabaseURL.value,
								storageBucket: parent.props.StorageBucket.value,
							};
							parent.fb = firebase.initializeApp(config);
							parent.onInit.call(parent.fb);

							firebase.auth().onAuthStateChanged(function(user){
								i.onAuthStateChanged.call(user ? 1 : 0);
							});
						});
					}
				};
				break;
			case "FBNode":
				i.doReference.onevent = function(data) {
					this.parent.node = firebase.database().ref(this.parent.d(data).read("Path"));
					this.parent.onReference.call(this.parent.node);
				};
				i.Node.onevent = function() {
					return this.parent.node;
				};
				break;
			case "FBSendMessage":
				i.doSend.onevent = function(data) {
					var d = this.parent.d(data);
					var node = d.read("Node");
					var msg = d.read("Message");
					switch(this.parent.props.Mode.value) {
						case 0:
							node.set(msg);
							break;
						case 1:
							node.push(msg);
							break;
						case 2:
							node.update(msg);
							break;
					}
					this.parent.onSend.call(node);
				};
				break;
			case "FBReadMessage":
				i.doRead.onevent = function(data) {
					var d = this.parent.d(data);
					var node = d.read("Node");

					node.once("value").then(function(data){
						i.onRead.call(data.val());
					});
				};
				break;
			case "FBFilter":
				i.doFilter.onevent = function(data) {
					var d = this.parent.d(data);
					var node = d.read("Node");
					var value = d.read("Value");
					switch(this.parent.props.Mode.value) {
						case 0:
							node.limitToFirst(value);
							break;
						case 1:
							node.limitToLast(value);
							break;
					}
					this.parent.onFilter.call(node);
				};
				break;
			case "FBListen":
				i.run = function() {
					if(this.node) {
						this.node.off(this.getHandler(), this.handler);
						this.node = null;
					}
				};
				i.getHandler = function() {
					return ["value", "child_added", "child_changed", "child_removed"][this.props.Event.value];
				};
				i.doListen.onevent = function(data) {
					var d = this.parent.d(data);
					this.parent.node = d.read("Node");

					this.parent.handler = this.parent.node.on(this.parent.getHandler(), function(data){
						i.onListen.call(data.val());
					});
				};
				break;
			case "FBUserCreate":
				i.doCreate.onevent = function(data) {
					var d = this.parent.d(data);
					var mail = d.read("EMail");
					var pass = d.read("Password");
					firebase.auth().createUserWithEmailAndPassword(mail, pass).then(
						function(){
							i.onCreate.call();
						},
						function(error) {
							i.onError.call([error.code, error.message]);
						}
					);

				};
				break;
			case "FBUserSignIn":
				i.doSignIn.onevent = function(data) {
					var d = this.parent.d(data);
					var mail = d.read("EMail");
					var pass = d.read("Password");
					var auth = null;
					switch(this.parent.props.Method.value) {
						case 0:
							auth = firebase.auth().signInWithEmailAndPassword(mail, pass);
							break;
						case 1:
							var provider = new firebase.auth.GoogleAuthProvider();
							auth = firebase.auth().signInWithPopup(provider);
							break;
					}
					auth.then(
						function(){
							i.onSignIn.call();
						},
						function(error) {
							i.onError.call([error.code, error.message]);
						}
					);

				};
				i.doSignOut.onevent = function(data) {
					firebase.auth().signOut();
				};
				break;
			case "FBUserProfile":
				i.run = function() {
					if(i.doDisplayName) {
						i.doDisplayName.onevent = function(data) {
							if(firebase.auth().currentUser) {
								firebase.auth().currentUser.updateProfile({
									displayName: data
								}).then(function() {

								}, function(error) {

								});
							}
						};
					}
					if(i.doPhotoURL) {
						i.doPhotoURL.onevent = function(data) {
							if(firebase.auth().currentUser) {
								firebase.auth().currentUser.updateProfile({
									photoURL: data
								}).then(function() {

								}, function(error) {

								});
							}
						};
					}
				};
				i.DisplayName.onevent = function() {
					var user = firebase.auth().currentUser;
					return user ? user.displayName : "guest";
				};
				i.EMail.onevent = function() {
					var user = firebase.auth().currentUser;
					return user ? user.email : "";
				};
				i.PhotoURL.onevent = function() {
					var user = firebase.auth().currentUser;
					return user ? user.photoURL : "";
				};
				i.UID.onevent = function() {
					var user = firebase.auth().currentUser;
					return user ? user.uid : 0;
				};
				break;
			case "VideoPlayer":
				i.run = function(flags) {
					this.ctl = new VideoPlayer({url: this.props.URL.value, controls: this.props.Controls.value, autoplay: this.props.Autoplay.value});
					this.ctl.addListener("ended", function(){
						i.onPlay.call();
					});

					if(i.doURL) {
						i.doURL.onevent = function(data) {
							this.parent.ctl.load(data);
						};
					}

					return WinElement.prototype.run.call(this, flags);
				};
				i.doPlay.onevent = function(data) {
					this.parent.ctl.play();
				};
				i.doPause.onevent = function(data) {
					this.parent.ctl.pause();
				};
				i.Paused.onevent = function(data) {
					return this.parent.ctl.paused() ? 1 : 0;
				};
				break;
			case "AudioPlayer":
				i.run = function(flags) {
					this.ctl = new AudioPlayer({url: this.props.URL.value, controls: this.props.Controls.value, autoplay: this.props.Autoplay.value});
					this.ctl.addListener("ended", function(){
						i.onPlay.call();
					});

					if(i.doURL) {
						i.doURL.onevent = function(data) {
							this.parent.ctl.load(data);
						};
					}

					return WinElement.prototype.run.call(this, flags);
				};
				i.doPlay.onevent = function(data) {
					this.parent.ctl.play();
				};
				i.doPause.onevent = function(data) {
					this.parent.ctl.pause();
				};
				i.Paused.onevent = function(data) {
					return this.parent.ctl.paused() ? 1 : 0;
				};
				break;
			case "Inline":
				i.run = function() {
					this.script = eval("new Object({" + this.props.Code.value + "})");
					this.script.element = this;

					for(var i = 1; i <= this.props.WorkCount.value; i++) {
						this["doWork" + i].onevent = function(element, index) { return function(data) {
							element.script["doWork" + index](data, index-1);
						}}(this, i);
					}
					for(var i = 1; i <= this.props.EventCount.value; i++) {
						this.script["onEvent" + i] = function(index){ return function(data) {
							this.element["onEvent" + index].call(data);
						} }(i);
					}
				};
				break;
			case "Notification":
				i.showNotify = function(data) {
					var text = readProperty(data, this.Text, this.props.Text.value);
					var options = {
						body: readProperty(data, this.Content, this.props.Content.value),
						icon: this.props.IconURL.value
					};
					this.notification = new window.Notification(text, options);
					this.notification.parent = this;
					this.notification.onclose = function(){
						this.parent.onClose.call();
					};
					this.notification.onclick = function(){
						this.parent.onClick.call();
					};
				};
				i.doNotify.onevent = function(data) {
					var notify = this.parent;
					if(window.Notification.permission !== "denied") {
						window.Notification.requestPermission(function (permission) {
							if (permission === "granted") {
								notify.showNotify(data);
							}
						});
					}
					else if(window.Notification.permission === "granted") {
						this.parent.showNotify(data);
					}
				};
				i.doClose.onevent = function(data) {
					if(this.parent.notification) {
						this.parent.notification.close();
					}
				};
				i.run = function(){ this.notification = null; };
				break;
			case "hcTransmitter":
				i.onreturn = function(data) { console.log("Transmit: ", data); };
				i.doReturn.onevent = function(data) {
					var options = [];
					var d = this.parent.d(data);
					for(var j = 0; j < this.parent.props.DataCount.value; j++) {
						options.push(d.read("Arg" + (j+1)));
					}

					this.parent.onreturn(options);
				};
				break;
			case "hcTranslator":
				i.doTranslate.onevent = function(data) {
					var text = translate.translate(this.parent.d(data).read("Key"));
					this.parent.onTranslate.call(text);
				};
				break;
			case "hcUser":
				i.Name.onevent = function() {
					return window.user.name;
				};
				i.UID.onevent = function() {
					return window.user.uid;
				};
				i.Plan.onevent = function() {
					return window.user.plan;
				};
				break;
			case "Converter":
				i.doConvert.onevent = function(data) {
					var result = "";
					switch(this.parent.props.Mode.value) {
						case 0:
							result = this.parent.d(data).read("Data").toString();
							break;
						case 1:
							result = parseInt(this.parent.d(data).read("Data"));
							break;
						case 2:
							result = Math.round(this.parent.d(data).readFloat("Data"));
							break;
						case 3:
							result = this.parent.d(data).read("Data").charCodeAt(0);
							break;
						case 4:
							result = String.fromCharCode(this.parent.d(data).readInt("Data"));
							break;
					}
					this.parent.onConvert.call(this.parent.result = result);
				};
				i.Result.onevent = function(){
					return this.parent.result;
				};
				break;
			case "Stack":
				i.doPush.onevent = function(data) {
					var dt = this.parent.d(data).read("Data");
					this.parent.stack.push(dt);
					this.parent.onPush.call(dt);
				};
				i.doPop.onevent = function(data) {
					if(this.parent.stack.length) {
						this.parent.result = this.parent.stack.pop();
						this.parent.onPop.call(this.parent.result);
					}
				};
				i.Result.onevent = function(){
					return this.parent.result;
				};
				i.run = function(){
					this.stack = [];
					this.result = "";
				};
				break;
			case "GlobalVar":
				Object.defineProperty(i, "var", {
					get: function() {
						return Math["_" + i.props.Name.value];
					},
					set: function(value) {
						Math["_" + i.props.Name.value] = value;
						if(i.props.Save.value) {
							window.localStorage["gv_" + i.props.Name.value] = value;
						}
					}
				});

				i.doValue.onevent = function(data) {
					this.parent.var = data;
					this.parent.onValue.call(data);
				};
				i.Var.onevent = function(){
					return this.parent.var;
				};
				i.run = function() {
					if(this.props.Save.value) {
						this.var = window.localStorage["gv_" + this.props.Name.value] || this.props.Default.value;
					}
					else if(!this.var || !this.props.Default.isDef()) {
						this.var = this.props.Default.value;
					}
				};
				break;
			case "Time":
				i.doTime.onevent = function(data) {
					this.parent.time = data ? new Date(data) : new Date();
					this.parent.onTime.call(this.parent.time);
				};
				i.run = function() {
					this.time = new Date();
				};

				i.FormatTime.onevent = function() {
					switch(this.parent.props.Format.value) {
						case 0: return this.parent.time.toUTCString();
						case 1: return this.parent.time.toISOString();
						case 2: return this.parent.time.toLocaleString();
					}
					return this.parent.time.toString();
				};
				i.TimeMillis.onevent = function() {
					return this.parent.time.getTime();
				};
				break;
			case "VK_Init":
				i.doInit.onevent = function() {
					var vkinit = this.parent;
					$.appendScript("http://vk.com/js/api/openapi.js", function(){
						VK.init({
							apiId: vkinit.props.AppId.value,
							onlyWidgets: false
						});
						vkinit.onInit.call();
					});
				};
				break;
			case "VK_Auth":
				i.doLogin.onevent = function(data) {
					var vka = this.parent;
					VK.Auth.getLoginStatus(function(res){
						if(res.status !== "connected"){
							VK.Auth.login(function(lres){
								if(lres.status == "connected")
									vka.onSuccess.call(vka.user = lres.session.user);
								else
									vka.onError.call(lres.status);
							}, vka.d(data).readInt("Permissions"));
						}
						else {
							vka.onSuccess.call(vka.user = res.session.user);
						}
					});
				};
				i.doLogout.onevent = function() {
					VK.Auth.logout();
				};
				i.User.onevent = function() {
					return this.parent.user;
				};
				break;
			case "VK_AudioList":
				i.doGet.onevent = function(data) {
					var self = this.parent;
					var d = self.d(data);
					var options = {
						owner_id: d.readInt("OwnerId"),
						offset: d.readInt("Offset"),
						count: d.readInt("Count"),
						album_id: d.readInt("AlbumId"),
						audio_ids: d.readInt("AudioIds"),
						need_user: 0
					};
					VK.Api.call('audio.get', options, function(r) {
						if(r.response){
							r.response.shift();
							self.onGet.call(self.array = r.response); 
						}
						else {
							self.onError.call(r.error.error_msg);
						}
					});
				};
				i.AudioArray.onevent = function() {
					return this.parent.array;
				};
				break;
			case "VK_AudioInfo":
				i.doValue.onevent = function(data) {
					this.parent.audio = data;
					this.parent.onData.call();
				};
				i.URL.onevent = function() { return this.parent.audio.url; };
				i.Duration.onevent = function() { return this.parent.audio.duration; };
				i.Title.onevent = function() { return this.parent.audio.title; };
				i.AudioID.onevent = function() { return this.parent.audio.aid; };
				i.run = function() {
					this.initPointHandler("OwnerID", function() { return this.parent.audio.owner_id; });
					this.initPointHandler("Artist", function() { return this.parent.audio.artist; });
					this.initPointHandler("LyricsID", function() { return this.parent.audio.lyrics_id; });
					this.initPointHandler("GenreID", function() { return this.parent.audio.genre; });
				};
				break;
			case "AudioContext":
				i.run = function(flags) {
					if(flags & FLAG_USE_RUN)
						this.context = new AudioContext();
				};
				i.onfree = function() {
					if(this.context) {
						this.context.close();
						this.context = null;
					}
				};
				break;
			case "AudioDestination":
				i.run = function(flags){
					if(flags & FLAG_USE_RUN)
						this.dest = this.props.AudioContext.getElement().context.destination;
				};
				i.Input.onevent = function() {
					return this.parent.dest;
				};
				break;
			case "AudioAnalyser":
				i.run = function(flags){
					if(flags & FLAG_USE_RUN) {
						this.analyser = this.props.AudioContext.getElement().context.createAnalyser();
						this.analyser.fftSize = 512;
						switch(this.props.Type.value) {
							case 0: this.array = new Float32Array(this.analyser.frequencyBinCount); break;
							case 1:
							case 2: this.array = new Uint8Array(this.analyser.frequencyBinCount); break;
						}
					}
				};
				i.doGetData.onevent = function() {
					switch(this.parent.props.Type.value) {
						case 0: this.parent.analyser.getFloatFrequencyData(this.parent.array); break;
						case 1: this.parent.analyser.getByteFrequencyData(this.parent.array); break;
						case 2: this.parent.analyser.getByteTimeDomainData(this.parent.array); break;
					}
					this.parent.onData.call(this.parent.array);
				};
				i.Input.onevent = function() {
					return this.parent.analyser;
				};
				break;
			case "AudioOscillator":
				i.oninit = function(){
					this.initPointHandler("doFrequency", function(data) {
						this.parent.osc.frequency.value = data;
					});
				};
				i.doStart.onevent = function(data) {
					this.parent.osc = this.parent.props.AudioContext.getElement().context.createOscillator();
					this.parent.osc.type = this.parent.props.Type.getText();
					this.parent.osc.frequency.value = this.parent.props.Frequency.value;
					this.parent.osc.detune.value = this.parent.props.Detune.value;
					for(var t = 1; t <= this.parent.props.OutputNumber.value; t++) {
						var out = this.parent.d("").read("Output" + t);
						if(out instanceof AudioNode)
							this.parent.osc.connect(out);
					}
					this.parent.osc.onended = function(){
						i.onStop.call();
					};
					this.parent.osc.start();
					if(!this.parent.props.Delay.isDef())
						this.parent.osc.stop(this.parent.osc.context.currentTime + this.parent.props.Delay.value);
					this.parent.onStart.call();
				};
				i.doStop.onevent = function() {
					if(this.parent.osc) {
						this.parent.osc.stop();
						this.parent.osc = null;
					}
				};
				i.onfree = function(){
					this.doStop.onevent();
				};
				break;
			case "AudioGain":
				i.run = function(flags) {
					if(flags & FLAG_USE_RUN)
						this.gain = this.props.AudioContext.getElement().context.createGain();
				};
				i.oninit = function(){
					this.initPointHandler("doGain", function(data) {
						this.parent.gain.gain.value = data;
					});
					for(var i = 1; i <= this.props.OutputNumber.value; i++) {
						var out = this.d("").read("Output" + i);
						if(out instanceof AudioNode)
							this.gain.connect(out);
					}
				};
				i.Input.onevent = function() {
					return this.parent.gain;
				};
				break;
			case "AudioDelay":
				i.run = function(flags) {
					if(flags & FLAG_USE_RUN) {
						this.delay = this.props.AudioContext.getElement().context.createDelay();
						this.delay.delayTime.value = this.props.Time.value;
					}
				};
				i.oninit = function(){
					this.initPointHandler("doTime", function(data) {
						this.parent.delay.delayTime.value = data;
					});
					for(var i = 1; i <= this.props.OutputNumber.value; i++) {
						var out = this.d("").read("Output" + i);
						if(out instanceof AudioNode)
							this.delay.connect(out);
					}
				};
				i.Input.onevent = function() {
					return this.parent.delay;
				};
				break;
			case "AudioFilter":
				i.run = function(flags) {
					if(flags & FLAG_USE_RUN) {
						this.filter = this.props.AudioContext.getElement().context.createBiquadFilter();
						this.filter.type = this.props.Type.getText();
						this.filter.gain.value = this.props.Gain.value;
						this.filter.frequency.value = this.props.Frequency.value;
						this.filter.frequency.Q = this.props.Q.value;
					}
				};
				i.oninit = function(){
					this.initPointHandler("doGain", function(data) {
						this.parent.filter.gain.value = data;
					});
					this.initPointHandler("doFrequency", function(data) {
						this.parent.filter.frequency.value = data;
					});
					this.initPointHandler("doQ", function(data) {
						this.parent.filter.frequency.Q = data;
					});
					for(var i = 1; i <= this.props.OutputNumber.value; i++) {
						var out = this.d("").read("Output" + i);
						if(out instanceof AudioNode)
							this.filter.connect(out);
					}
				};
				i.Input.onevent = function() {
					return this.parent.filter;
				};
				break;
			case "AudioConvolver":
				i.run = function(flags) {
					if(flags & FLAG_USE_RUN)
						this.convolver = this.props.AudioContext.getElement().context.createConvolver();
				};
				i.oninit = function() {
					for(var i = 1; i <= this.props.OutputNumber.value; i++) {
						var out = this.d("").read("Output" + i);
						if(out instanceof AudioNode)
							this.convolver.connect(out);
					}
				};
				i.doBuffer.onevent = function(data) {
					this.parent.convolver.buffer = data;
				};
				i.Input.onevent = function() {
					return this.parent.convolver;
				};
				break;
			case "AudioDecodeData":
				i.doDecode.onevent = function(data) {
					this.parent.props.AudioContext.getElement().context.decodeAudioData(this.parent.d(data).read("Data"), function(buffer) {
						i.buffer = buffer;
						i.onDecode.call(buffer);
					});
				};
				i.Buffer.onevent = function() {
					return this.parent.buffer;
				};
				break;
			case "AudioBufferSource":
				i.oninit = function(){
					this.initPointHandler("doRate", function(data) {
						this.parent.source.playbackRate.value = data;
					});
				};
				i.doStart.onevent = function(data) {
					this.parent.source = this.parent.props.AudioContext.getElement().context.createBufferSource();
					this.parent.source.buffer = data;
					this.parent.source.playbackRate.value = this.parent.props.Rate.value;
					this.parent.source.loop = !this.parent.props.Loop.isDef();
					
					for(var t = 1; t <= this.parent.props.OutputNumber.value; t++) {
						var out = this.parent.d("").read("Output" + t);
						if(out instanceof AudioNode)
							this.parent.source.connect(out);
					}
					this.parent.source.onended = function(){
						i.onStop.call();
					};
					this.parent.source.start();
					this.parent.onStart.call();
				};
				i.doStop.onevent = function(data) {
					if(this.parent.source) {
						this.parent.source.stop();
						this.parent.source = null;
					}
				};
				i.onfree = function(){
					i.doStop.onevent();
				};
				break;
		}
	};
}