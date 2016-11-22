'use strict';

function webapp() {
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
					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "CheckBox":
				i.run = function (flags) {
					this.ctl = new CheckBox({
						caption: this.props.Caption.getTranslateValue(),
						checked: this.props.Checked.value
					});
					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "RadioButton":
				i.run = function (flags) {
					this.ctl = new RadioButton({
						name: this.props.Name.value,
						caption: this.props.Caption.getTranslateValue(),
						checked: this.props.Checked.value
					});
					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Edit":
				i.run = function (flags) {
					this.ctl = new Edit({
						text: this.props.Text.value,
						placeHolder: this.props.PlaceHolder.getTranslateValue(),
						password: this.props.Password.value,
						pattern: this.props.Pattern.value
					});
					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "NumberEdit":
				i.run = function (flags) {
					this.ctl = new NumberEdit({
						number: this.props.Number.value,
						min: this.props.Min.value,
						max: this.props.Max.value,
						step: this.props.Step.value,
						placeHolder: this.props.PlaceHolder.value
					});
					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Memo":
				i.run = function (flags) {
					this.ctl = new Memo({text: this.props.Text.value});
					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ListBox":
				i.onpropchange = function(prop) {
					this.onSelect.args = this.props.Select.getText();
					this.onClick.args = this.props.Select.getText();
				};
				i.run = function (flags) {
					this.ctl = new ListBox();

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

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ComboBox":
				i.onpropchange = function(prop) {
					this.onSelect.args = this.props.Select.getText();
				};
				i.run = function (flags) {
					this.ctl = new ComboBox();

					this.ctl.setText(this.props.Strings.value);

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "Label":
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
				i.run = function (flags) {
					this.ctl = new Canvas({theme: flags & window.FLAG_USE_EDIT ? "borderin" : ""});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ProgressBar":
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
				i.run = function (flags) {
					this.ctl = new TrackBar({
						min: this.props.Min.value,
						max: this.props.Max.value,
						step: this.props.Step.value,
						position: this.props.Value.value
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
			case "Image":
				i.run = function (flags) {
					this.ctl = new UIImage({
						url: this.props.URL.value,
						mode: this.props.Mode.value
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
				i.run = function (flags) {
					this.ctl = new UISwitcher({
						on: this.props.On.value
					});

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

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "DropBox":
				i.run = function (flags) {
					this.ctl = new DropBox({

					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "MainForm":
				i.run = function(flags) {
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
				i.getChild = function(){
					return null;
				};

				i.flags |= window.IS_PARENT;
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
			case "YaMap":
				i.run = function (flags) {
					this.ctl = new YaMap();

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "YouTube":
				i.run = function(flags) {
					this.ctl = new YouTube({url: this.props.URL.value});

					return WinElement.prototype.run.call(this, flags);
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
				break;
			case "ChartGauge":
				i.run = function(flags) {
					this.ctl = new GoogleChart({
						chart: "Gauge"
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "ChartLine":
				i.run = function(flags) {
					this.ctl = new GoogleChart({
						chart: "LineChart"
					});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "VideoPlayer":
				i.run = function(flags) {
					this.ctl = new VideoPlayer({url: this.props.URL.value, controls: this.props.Controls.value, autoplay: this.props.Autoplay.value});

					return WinElement.prototype.run.call(this, flags);
				};
				break;
			case "AudioPlayer":
				i.run = function(flags) {
					this.ctl = new AudioPlayer({url: this.props.URL.value, controls: this.props.Controls.value, autoplay: this.props.Autoplay.value});

					return WinElement.prototype.run.call(this, flags);
				};
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
		}
	};
}