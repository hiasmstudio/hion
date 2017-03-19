"use strict";

/* global Builder */

function UIControl() {
	this.parent = null;
}

UIControl.prototype.appendTo = function(parent) {
	parent.appendChild(this.getControl());
	return this;
};

UIControl.prototype.insertBefore = function(child) {
	child.parentNode.insertBefore(this.getControl(), child);
	return this;
};

UIControl.prototype.getControl = function() {
	return this._ctl;
};

UIControl.prototype.show = function() {
	this.visible = true;
	return this;
};

UIControl.prototype.hide = function() {
	this.visible = false;
	return this;
};

UIControl.prototype.free = function() {
	if(this.parent) {
		this.parent.remove(this);
	}
};

UIControl.prototype.addListener = function(name, func) {
	this.getControl().addEventListener(name, func);
};

UIControl.prototype.initFromHTML = function(element) {
	this._ctl = element;
};

UIControl.prototype.move = function(x, y) {
	this.getControl().move(x, y);
};

UIControl.prototype.setLayoutOptions = function(options) {
	this._layoutOpt = options;
};

UIControl.prototype.place = function(left, top, width, height) {
	var style = this.getControl().style;
	style.left = left.toString() + "px";
	style.top = top.toString() + "px";
	if(width !== "") {
		style.width = width.toString() + "px";
	}
	if(height !== "") {
		style.height = height.toString() + "px";
	}
};

UIControl.prototype.setVisible = function(value) {
	value ? this.show() : this.hide();
};

UIControl.prototype.setOptions = function(options) {
	if(options) {
		if(options.theme) {
			this.getControl().className += " " + options.theme;
		}
		if(options.width) {
			this.width = options.width;
		}
		if(options.height) {
			this.height = options.height;
		}
	}
};

UIControl.prototype.setDisabled = function(value) {
	function __disabled(ctl) {
		if(ctl.setAttribute) {
			if(value) {
				ctl.setAttribute("disabled", "");
			}
			else {
				ctl.removeAttribute("disabled");
			}
			for(var i = 0; i < ctl.childNodes.length; i++) {
				__disabled(ctl.childNodes[i]);
			}
		}
	}
	__disabled(this.getControl());
};

Object.defineProperty(UIControl.prototype, "left", {
	get: function() {
	  return this.getControl().offsetLeft;
	},
	set: function(value) {
		this.getControl().style.left = value.toString() + "px";
	}
});
Object.defineProperty(UIControl.prototype, "top", {
	get: function() {
	  return this.getControl().offsetTop;
	},
	set: function(value) {
		this.getControl().style.top = value.toString() + "px";
	}
});
Object.defineProperty(UIControl.prototype, "width", {
	get: function() {
	  return this.getControl().offsetWidth;
	},
	set: function(value) {
		var v = value.toString();
		this.getControl().style.width = v.indexOf("%") > 0 ? v : (value.toString() + "px");
	}
});
Object.defineProperty(UIControl.prototype, "height", {
	get: function() {
	  return this.getControl().offsetHeight;
	},
	set: function(value) {
		var v = value.toString();
		this.getControl().style.height = v.indexOf("%") > 0 ? v : (value.toString() + "px");
	}
});
Object.defineProperty(UIControl.prototype, "tabIndex", {
	get: function() {
	  return this.getControl().getAttribute("tabindex");
	},
	set: function(value) {
		this.getControl().setAttribute("tabindex", value);
	}
});
Object.defineProperty(UIControl.prototype, "visible", {
	get: function() {
	  return this.getControl().getAttribute("visible");
	},
	set: function(value) {
		this.getControl().setAttribute("visible", value);
	}
});

function defineProxy(proto, targetProp, originObject, originProp) {
	Object.defineProperty(proto, targetProp, {
		get: function() {
		  return this[originObject][originProp];
		},
		set: function(value) {
			this[originObject][originProp] = value;
		}
	});
}

//******************************************************************************
// UIContainer
//******************************************************************************

function UIContainer() {
	UIControl.call(this);
	
	this.child = new Set();
	this.layout = new FixLayout(this);
}

UIContainer.prototype = Object.create(UIControl.prototype);

UIContainer.prototype.getContainer = function() {
	return this.getControl();
};

UIContainer.prototype.add = function(control) {
	control.free();
	this.child.add(control);
	control.parent = this;
	
	this.getContainer().appendChild(control.getControl());
	
	this.layout.addChild(control);
	
	return this;
};

UIContainer.prototype.insert = function(control, before) {
	control.free();
	this.child.add(control);
	control.parent = this;
	
	this.getContainer().insertBefore(control.getControl(), before.getControl());
	
	this.layout.addChild(control);
	
	return this;
};

UIContainer.prototype.remove = function(control) {
	this.child.delete(control);
	
	this.getContainer().removeChild(control.getControl());
};

UIContainer.prototype.removeAll = function() {
	for(var item of this.child) {
		this.remove(item);
	}
};

UIContainer.prototype.each = function(callback) {
	for(var item of this.child) {
		if(callback.call(this, item) === true) {
			break;
		}
	}
};

UIContainer.prototype.indexOf = function(ctl) {
	var index = 0;
	for(var item of this.child) {
		if(item === ctl) {
			return index;
		}
		index++;
	}

	return -1;
};

UIContainer.prototype.get = function(index) {
	var _index = 0;
	for(var item of this.child) {
		if(_index === index) {
			return item;
		}
		_index++;
	}
	
	return null;
};

UIContainer.prototype.size = function() { return this.child.size; };

//******************************************************************************
// Label
//******************************************************************************

function Label(options) {
	var b = new Builder().n("div").class("ui-label");
	this._ctl = b.element;
	this._caption = b.n("span").element;
	
	if(options) {
		if(options.caption) {
			this.caption = options.caption;
		}
		if(options.halign) {
			b.style("alignItems", ["flex-start", "center", "flex-end"][options.halign])
		}
		if(options.valign === 0 || options.valign === 2) {
			b.style("justifyContent", ["flex-start", "center", "flex-end"][options.valign])
		}
	}

	this.setOptions(options);
}

Label.prototype = new UIControl();

defineProxy(Label.prototype, "caption", "_caption", "innerHTML");

//******************************************************************************
// Button
//******************************************************************************

function Button(options) {
	UIContainer.call(this);
	
	this._ctl = new Builder().n("button").class("ui-button").element;
	this._caption = new Label();
	this.layout = new Layout(this);
	
	if(options) {
		if(options.caption) {
			this.caption = options.caption;
		}
		if(options.url) {
			this._image = new UIImage({url: options.url});
			this.add(this._image);
		}
	}
	this.add(this._caption);
	
	this.setOptions(options);
}

Button.prototype = Object.create(UIContainer.prototype);

defineProxy(Button.prototype, "caption", "_caption", "caption");

//******************************************************************************
// Edit
//******************************************************************************

function Edit(options) {
	this._ctl = new Builder().n("input").class("ui-edit").element;

	if(options) {
		if(options.text) {
			this.text = options.text;
		}
		if(options.placeHolder) {
			this.placeHolder = options.placeHolder;
		}
		if(options.password) {
			this._ctl.setAttribute("type", "password");
		}
		if(options.pattern) {
			this._ctl.setAttribute("pattern", options.pattern);
		}
	}
	
	this.setOptions(options);
}

Edit.prototype = new UIControl();

defineProxy(Edit.prototype, "text", "_ctl", "value");
defineProxy(Edit.prototype, "placeHolder", "_ctl", "placeholder");

//******************************************************************************
// NumberEdit
//******************************************************************************

function NumberEdit(options) {
	this._ctl = new Builder().n("input").attr("type", "number").class("ui-edit").element;

	if(options) {
		this.number = options.number || 0;
		this._ctl.min = options.min || 0;
		if(options.max) {
			this._ctl.max = options.max;
		}
		if(options.step) {
			this._ctl.step = options.step;
		}
		if(options.placeHolder) {
			this.placeHolder = options.placeHolder;
		}
	}
	
	this.setOptions(options);
}

NumberEdit.prototype = new UIControl();

defineProxy(NumberEdit.prototype, "placeHolder", "_ctl", "placeholder");
Object.defineProperty(NumberEdit.prototype, "number", {
	get: function() {
	  return parseInt(this._ctl.value);
	},
	set: function(value) {
		this._ctl.value = value;
	}
});

//******************************************************************************
// UIDatePicker
//******************************************************************************

function UIDatePicker(options) {
	this._ctl = new Builder().n("input").attr("type", "date").class("ui-datepicker").element;

	if(options) {
		this.date = options.date || "";
		if(options.min) {
			this._ctl.min = options.min;
		}
		if(options.max) {
			this._ctl.max = options.max;
		}
	}
	
	this.setOptions(options);
}

UIDatePicker.prototype = new UIControl();

defineProxy(UIDatePicker.prototype, "placeHolder", "_ctl", "placeholder");
Object.defineProperty(UIDatePicker.prototype, "date", {
	get: function() {
	  return this._ctl.value;
	},
	set: function(value) {
		this._ctl.value = value;
	}
});

//******************************************************************************
// UIColorButton
//******************************************************************************

function UIColorButton(options) {
	this._ctl = new Builder().n("input").attr("type", "color").class("ui-colorbutton").element;

	if(options) {
		this.color = options.color || "";
	}
	
	this.setOptions(options);
}

UIColorButton.prototype = new UIControl();

Object.defineProperty(UIColorButton.prototype, "color", {
	get: function() {
	  return this._ctl.value;
	},
	set: function(value) {
		this._ctl.value = value;
	}
});
	
//******************************************************************************
// Memo
//******************************************************************************

function Memo(options) {
	this._ctl = new Builder().n("textarea").class("ui-memo").element;

	if(options) {
		if(options.text) {
			this.text = options.text;
		}
	}
	
	this.setOptions(options);
}

Memo.prototype = new UIControl();

Memo.prototype.add = function(value) {
	this.text += value + "\n";
};

Object.defineProperty(Memo.prototype, "caretStart", {
	get: function() {
		return this._ctl.selectionStart;
	},
	set: function(value) {
		this._ctl.selectionStart = value;
	}
});

defineProxy(Memo.prototype, "text", "_ctl", "value");

//******************************************************************************
// CheckBox
//******************************************************************************

function CheckBox(options) {
	var b = new Builder().n("label").class("ui-checkbox");
	this._ctl = b.element;

	this._check = b.n("input").attr("type", "checkbox").class("check").element;
	this._caption = b.n("span").class("label").element;

	if(options) {
		if(options.caption) {
			this.caption = options.caption;
		}
		if(options.checked) {
			this.checked = options.checked;
		}
		if(options.style) {
			this._ctl.className = "checkbox" + options.style;
		}
	}
	
	this.setOptions(options);
}

CheckBox.prototype = new UIControl();

CheckBox.prototype.addListener = function(name, func) {
	if(name === "checked") {
		this._check.addEventListener("click", func);
	}
	else {
		UIControl.prototype.addListener.call(this, name, func);
	}
};

defineProxy(CheckBox.prototype, "caption", "_caption", "innerHTML");
defineProxy(CheckBox.prototype, "checked", "_check", "checked");

//******************************************************************************
// RadioButton
//******************************************************************************

function RadioButton(options) {
	var b = new Builder().n("label").class("ui-checkbox");
	this._ctl = b.element;

	this._check = b.n("input").attr("type", "radio").attr("name", options.name).class("check").element;
	this._caption = b.n("span").class("label").element;

	if(options) {
		if(options.caption) {
			this.caption = options.caption;
		}
		if(options.checked) {
			this.checked = options.checked;
		}
	}
	
	this.setOptions(options);
}

RadioButton.prototype = new UIControl();

RadioButton.prototype.addListener = function(name, func) {
	if(name === "checked") {
		this._check.addEventListener("click", func);
	}
	else {
		UIControl.prototype.addListener.call(this, name, func);
	}
};

defineProxy(RadioButton.prototype, "caption", "_caption", "innerHTML");
defineProxy(RadioButton.prototype, "checked", "_check", "checked");

//******************************************************************************
// ProgressBar
//******************************************************************************

function ProgressBar(options) {
	var b = new Builder().n(options.custom ? "div" : "progress").class("ui-progressbar");
	b.n("div").class("content");
	this._ctl = b.element;
	
	if(options) {
		if(options.max) {
			this.max = options.max;
		}
		if(options.position) {
			this.position = options.position;
		}
	}
	
	this.setOptions(options);
}

ProgressBar.prototype = new UIControl();

defineProxy(ProgressBar.prototype, "max", "_ctl", "max");

Object.defineProperty(ProgressBar.prototype, "position", {
	get: function() {
		return this._ctl.value;
	},
	set: function(value) {
		this._ctl.value = value;
		this._ctl.firstChild.style.width = (Math.round(value/this._ctl.max*100)).toString() + "%";
		this._ctl.firstChild.style.display = (value > 0 ? "block" : "none");
	}
});

// ProgressBar.prototype.setPosition = function(value) {
// 	this.position = value;
// 	this.control.firstChild.style.width = this._getPos().toString() + "px";
// 	this.control.firstChild.style.display = (value > 0 ? "block" : "none");
// };

// ProgressBar.prototype.getPosition = function() {
// 	return this.position;
// };

//******************************************************************************
// TrackBar
//******************************************************************************

function TrackBar(options) {
	this._ctl = new Builder().n("input").attr("type", "range").class("ui-trackbar").element;

	if(options) {
		if(options.min) {
			this._ctl.min = options.min;
		}
		if(options.max) {
			this._ctl.max = options.max;
		}
		if(options.step) {
			this._ctl.step = options.step;
		}
		this.position = options.position || 0;
	}
	
	this.setOptions(options);
}

TrackBar.prototype = new UIControl();

Object.defineProperty(TrackBar.prototype, "position", {
	get: function() {
		return this._ctl.value;
	},
	set: function(value) {
		this._ctl.value = value;
		this._ctl.dispatchEvent(new Event('input'));
	}
});

//******************************************************************************
// Image
//******************************************************************************

function UIImage(options) {
	var img = null;
	if(options && options.mode) {
		img = new Builder().n("div").class("ui-image").n("img");
		this._ctl = img.element.parentNode;
	}
	else {
		img = new Builder().n("img").class("ui-image");
		this._ctl = img.element;
	}
	img.on("ondragstart", function(){return false;});
	this.image = img.element;

	if(options) {
		if(options.url) {
			this.url = options.url;
		}
		if(options.mode) {
			if(options.mode == 2) {
				img.style("width", "100%");
			}
			else if(options.mode == 3) {
				img.style("height", "100%");
			}
		}
	}
	
	this.setOptions(options);
}

UIImage.prototype = new UIControl();

defineProxy(UIImage.prototype, "url", "image", "src");

//******************************************************************************
// YouTube
//******************************************************************************

function YouTube(options) {
	this._ctl = new Builder().n("iframe").class("ui-youtube").element;
	this._ctl.setAttribute("frameborder", "0");
	this._ctl.setAttribute("allowfullscreen", "");

	if(options) {
		if(options.url) {
			this.load(options.url);
		}
	}
	
	this.setOptions(options);
}

YouTube.prototype = new UIControl();

YouTube.prototype.load = function(url) {
	this._ctl.src = "https://www.youtube.com/embed/" + url;
};

//******************************************************************************
// VideoPlayer
//******************************************************************************

function VideoPlayer(options) {
	this._ctl = new Builder().n("video").element;
	// this._ctl.setAttribute("frameborder", "0");
	// this._ctl.setAttribute("allowfullscreen", "");

	if(options) {
		if(options.url) {
			this.load(options.url);
		}
		if(options.controls) {
			this._ctl.setAttribute("controls", "controls");
		}
		if(options.autoplay) {
			this._ctl.setAttribute("autoplay", "autoplay");
		}
	}
	
	this.setOptions(options);
}

VideoPlayer.prototype = new UIControl();

VideoPlayer.prototype.load = function(url) {
	this._ctl.src = url;
};

VideoPlayer.prototype.play = function() {
	this._ctl.play();
};

VideoPlayer.prototype.pause = function() {
	this._ctl.pause();
};

VideoPlayer.prototype.paused = function() {
	return this._ctl.paused;
};

//******************************************************************************
// AudioPlayer
//******************************************************************************

function AudioPlayer(options) {
	this._ctl = new Builder().n("audio").element;
	
	if(options) {
		if(options.url) {
			this.load(options.url);
		}
		if(options.controls) {
			this._ctl.setAttribute("controls", "controls");
		}
		if(options.autoplay) {
			this._ctl.setAttribute("autoplay", "autoplay");
		}
	}
	
	this.setOptions(options);
}

AudioPlayer.prototype = new UIControl();

AudioPlayer.prototype.load = function(url) {
	this._ctl.src = url;
};

AudioPlayer.prototype.play = function() {
	this._ctl.play();
};

AudioPlayer.prototype.pause = function() {
	this._ctl.pause();
};

AudioPlayer.prototype.paused = function() {
	return this._ctl.paused;
};

//******************************************************************************
// YaMap
//******************************************************************************

function YaMap(options) {
	this._ctl = new Builder().n("div").class("ui-yamap").id("mp-" + Math.random()).element;

	if(options) {
		
	}
	
	this.setOptions(options);
}

YaMap.prototype = new UIControl();

YaMap.prototype.addListener = function(name, func) {
	if(name === "coords") {
		this.oncoords = func;
	}
	else {
		UIControl.prototype.addListener.call(this, name, func);
	}
};

YaMap.prototype.setPlacemark = function(x, y, title, info) {
	if(this.map) {
		var myPlacemark = new window.ymaps.Placemark([x, y], { 
			hintContent: title, 
			balloonContent: info
		});
		
		this.map.geoObjects.add(myPlacemark);
	}
};

YaMap.prototype.setCenter = function(x, y) {
	if(this.map) {
		this.map.setCenter([x, y]);
	}
};

YaMap.prototype.init = function() {
	if(window.ymaps) {
		this._onload();
	}
	else {
		$.appendScript("https://api-maps.yandex.ru/2.1/?lang=ru_RU", function(parent){ return function(){ parent._onload(); }; }(this));
	}
};

YaMap.prototype._onload = function(){
	var parent = this;

	window.ymaps.ready(function(){
		parent.map = new window.ymaps.Map(parent._ctl.id, {
			center: [55.76, 37.64], 
			zoom: 7
		});
		parent.map.events.add('click', function (e) {
			if(parent.oncoords) {
				parent.oncoords(e.get('coords'));
			}
		});
	});
};

//******************************************************************************
// Panel
//******************************************************************************

function Panel(options) {
	UIContainer.call(this);
	
	var panel = new Builder().n('div').class("ui-panel");
	this.body = panel.n("div").class("content").element;
	this._ctl = panel.element;
	
	this.layout = null;
	
	if(options) {
		if(options.layout) {
			this.layout = options.layout;
		}
	}
	
	if(!this.layout) {
		this.layout = new HLayout(this, {});
	}
	
	this.setOptions(options);
}

Panel.prototype = Object.create(UIContainer.prototype);

Panel.prototype.getContainer = function() {
	return this.body;
};

//******************************************************************************
// ListBox
//******************************************************************************

function _attachKeyHandler(__box__) {
	__box__.addListener("keydown", function(event){
		if(this.hasAttribute("disabled")) {
			return;
		}
		var selIndex = -1;
		switch(event.keyCode) {
			case 38: // up
				if(__box__.selected) {
					var index = __box__.selected.index;
					if(index) {
						selIndex = index-1;
					}
				}
				else if(__box__.size()) {
					selIndex = __box__.size()-1;
				}
				break;
			case 40: // down
				if(__box__.selected) {
					var index = __box__.selected.index;
					if(index < __box__.size()-1) {
						selIndex = index+1;
					}
				}
				else if(__box__.size()) {
					selIndex = 0;
				}
				break;
			case 13:
				if(__box__.selected) {
					__box__.click(__box__.selected);
				}
				break;
		}
		if(selIndex != -1) {
			__box__.selectIndex(selIndex);
		}
	});
}

function ListBox(options) {
	var l = new Builder().n("div").class("ui-listbox").n("div").class("content");
	l.n("div").class("items");
	this.control = l.element;

	this.items = [];
	
	this.selected = null;
	
	this.onclick = function(item, text) {};
	this.onselect = function(item, text) {};
	this.oncheck = function(item, text) {};
	
	if(options) {
		if(options.checkboxes) {
			this.checkboxes = true;
		}
	}

	this.setOptions(options);
	
	_attachKeyHandler(this);
}

ListBox.prototype = new UIControl();

ListBox.prototype.setDisabled = function(value) {
	UIControl.prototype.setDisabled.call(this, value);
	if(value) {
		this.getControl().removeAttribute("tabindex");
	}
	else {
		this.tabIndex = 0;
	}
};

ListBox.prototype.getControl = function() {
	return this.control.parentNode;
};

ListBox.prototype._makeItem = function() {
	var _box_ = this;
	var ctl = new Builder(this.control.childNodes[0]).n("div").class("item").attr("index", this.items.length-1);
	ctl.on("onclick", function() {
		if(!this.hasAttribute("disabled")) {
			_box_.select(this);
		}
	});
	ctl.on("ondblclick", function() {
		if(!this.hasAttribute("disabled")) {
			_box_.click(this);
		}
	});
	
	if(this.checkboxes) {
		ctl.n("input").attr("type", "checkbox").class("check").on("onclick", function(){
			_box_.check(this.parentNode);
		});
	}
	
	return ctl;
};

ListBox.prototype.select = function(item) {
	if(this.selected) {
		this.selected.setAttribute("selected", false);
	}
	this.selected = item;
	item.setAttribute("selected", true);
	this.onselect(item, this.items[item.index]);
};

ListBox.prototype.click = function(item) {
	this.onclick(item, this.items[item.index]);
};

ListBox.prototype.check = function(item) {
	this.oncheck(item, this.items[item.index]);
};

ListBox.prototype.selectIndex = function(index) {
	this.select(this.control.childNodes[0].childNodes[index]);
};

ListBox.prototype.selectString = function(text) {
	for(var i = 0; i < this.items.length; i++) {
		if(this.items[i] == text) {
			this.selectIndex(i);
			break;
		}
	}
};

ListBox.prototype.add = function(text) {
	this.items.push(text);
	
	return this._makeItem().n("span").html(text).element;
};

ListBox.prototype.addIcon = function(icon, text) {
	this.items.push(text);
	
	var div = this._makeItem();
	
	div.n("img").attr("src", icon).class("icon");
	div.n("span").html(text);
	
	return div.element;
};

ListBox.prototype.checked = function(item, value) {
	item.childNodes[0].checked = value;
};

ListBox.prototype.clear = function() {
	this.control.childNodes[0].innerHTML = "";
	this.items = [];
	this.selected = null;
};

ListBox.prototype.setText = function(text) {
	this.clear();
	if(text) {
		var arr = text.split("\n");
		for(var line in arr) {
			this.add(arr[line]);
		}
	}
};

ListBox.prototype.getSelectString = function() {
	var index = this.getSelectIndex();
	return index === -1 ? "" : this.items[index];
};

ListBox.prototype.getSelectIndex = function() {
	return this.selected ? this.selected.index : -1;
};

ListBox.prototype.text = function() {
	var s = "";
	for(var i in this.items) {
		s += this.items[i];
	}
	return s;
};

ListBox.prototype.size = function() {
	return this.items.length;
};

ListBox.prototype.replaceSelect = function(text) {
	var index = this.getSelectIndex();
	if(index != -1) {
		this.items[index] = text;
		this.selected.childNodes[0].innerHTML = text;
	}
};

//******************************************************************************
// ComboBox
//******************************************************************************

function ComboBox(options) {
	this.combo = new Builder().n("select").class("ui-combobox");
	this._ctl = this.combo.element;
	
	this.selected = null;
	this.items = [];
	this.onselect = function(){};

	this.combo.attr("parent", this).on("onchange", function() {
		this.parent.select(this.options[this.selectedIndex]);
	});
	
	this.setOptions(options);
}

ComboBox.prototype = Object.create(UIControl.prototype);

ComboBox.prototype._makeItem = function() {
	var ctl = this.combo.n("option").attr("parent", this).attr("index", this.items.length-1);
	return ctl;
};

ComboBox.prototype.select = function(item) {
	if(this.selected) {
		this.selected.setAttribute("selected", false);
	}
	this.selected = item;
	item.setAttribute("selected", true);
	this.onselect(item, this.items[item.index]);
};

ComboBox.prototype.selectIndex = function(index) {
	this._ctl.selectedIndex = index;
	this.onselect(this._ctl.options[index], this.items[index]);
};

ComboBox.prototype.selectString = function(string) {
	for(var i = 0; i < this.size(); i++) {
		if(this.items[i] == string) {
			this.selectIndex(i);
			break;
		}
	}
};

ComboBox.prototype.add = function(text) {
	this.items.push(text);
	
	return this._makeItem().html(text).element;
};

ComboBox.prototype.addIcon = function(icon, text) {
	this.items.push(text);
	
	var div = this._makeItem();
	
	div.n("img").attr("src", icon).class("icon");
	div.n("span").html(text);
	
	return div.element;
};

ComboBox.prototype.clear = function() {
	this.combo.html("");
	this.items = [];
	this.selected = null;
};

ComboBox.prototype.setText = function(text) {
	this.clear();
	if(text) {
		var arr = text.split("\n");
		for(var line in arr) {
			this.add(arr[line]);
		}
	}
};

ComboBox.prototype.text = function() {
	var s = "";
	for(var i in this.items) {
		s += this.items[i];
	}
	return s;
};

ComboBox.prototype.size = function() {
	return this.items.length;
};

ComboBox.prototype.getSelectIndex = function() {
	return this.combo.element.selectedIndex;
};

ComboBox.prototype.getSelectString = function() {
	return this.items[this.getSelectIndex()];
};

//******************************************************************************
// DropBox
//******************************************************************************

function DropBox(options) {
	
	this.ondrop = function(file){};
	this.onenddrop = function(){};
	
	this._ctl = new Builder().n("div").class("ui-dropbox").attr("parent", this).on("ondragover", function(){
		this.setAttribute("over", true);
		return false;
	}).on("ondragleave", function(){
		this.setAttribute("over", false);
		return false;
	}).on("ondrop", function(){
		event.preventDefault();
		for(var i = 0; i < event.dataTransfer.files.length; i++) {
			var file = event.dataTransfer.files[i];
			this.parent.ondrop(file);
		}
		this.parent.onenddrop();

    	this.setAttribute("over", false);
		
		return false;
	}).element;
	
	this.setOptions(options);
}

DropBox.prototype = Object.create(UIControl.prototype);

DropBox.prototype.addListener = function(name, func) {
	if(name === "drop") {
		this.ondrop = func;
	}
	else if(name === "enddrop") {
		this.onenddrop = func;
	}
	else {
		UIControl.prototype.addListener.call(this, name, func);
	}
};


//******************************************************************************
// SVG
//******************************************************************************

function SVG(options) {
	var d = new Builder().n("div").class("ui-figure");
	this._ctl = d.element;
	d.element.appendChild(this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"));
	this.svg.setAttribute("width", "100%");
	this.svg.setAttribute("height", "100%");
	// this.svg.setAttribute("viewBox", "0 0 100 100");

	switch(options.shape) {
		case 0:
			this.svg.innerHTML = '<ellipse cx="50%" cy="50%" rx="50%" ry="50%" stroke="' + options.stroke + '" stroke-width="' + options.strokeWidth + '" fill="' + options.fill + '"/>';
			break;
		case 1:
			this.svg.innerHTML = '<rect x="0" y="0" width="99.9%" height="99.9%" stroke="' + options.stroke + '" stroke-width="' + options.strokeWidth + '" fill="' + options.fill + '"/>';
			break;
		case 2:
			this.svg.innerHTML = '<line x1="0" y1="50%" x2="100%" y2="50%" stroke="' + options.stroke + '" stroke-width="' + options.strokeWidth + '" fill="' + options.fill + '"/>';
			break;
	}

	this.setOptions(options);
}

SVG.prototype = Object.create(UIControl.prototype);

SVG.prototype.fill = function(value) {
	this.svg.childNodes[0].style.fill = value;
};

SVG.prototype.stroke = function(value) {
	this.svg.childNodes[0].style.stroke = value;
};

//******************************************************************************
// UILoader
//******************************************************************************

function UILoader(options) {
	var d = new Builder().n("div").class("ui-loader");
	this._ctl = d.element;
	d.element.appendChild(this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"));
	var lSize = options.size || 120;
	this.svg.setAttribute("width", lSize);
	this.svg.setAttribute("height", lSize);

	var radius = options.radius || 10;
	var center = lSize/2;
	var offset = center - radius;
	var text = "";
	for(var i = 0; i < 12; i++) {
		var x = center + Math.sin(i*30/180*Math.PI)*offset;
		var y = center + Math.cos(i*30/180*Math.PI)*offset;
		text += '<circle class="g--circle" r="' + radius + '" cx="' + x + '" cy="' + y + '"></circle>';
	}

	this.svg.innerHTML = text;
}

UILoader.prototype = Object.create(UIControl.prototype);

//******************************************************************************
// UISwitcher
//******************************************************************************

function UISwitcher(options) {
	this.onchange = function(value){};
	
	this._ctl = new Builder().n("div").class("ui-switcher").attr("parent", this).on("onclick", function(){
		if(this.hasAttribute("disabled")) {
			return;
		}
		
		this.parent.on = !this.parent.on;
	}).on("onkeypress", function(event){
		if(this.hasAttribute("disabled")) {
			return;
		}
		
		if(event.keyCode === 32) {
			this.parent.on = !this.parent.on;
		}
	}).n("div").class("in").element.parentNode;

	if(options) {
		if(options.on) {
			this.on = true;
		}
	}

	this.setOptions(options);
}

UISwitcher.prototype = Object.create(UIControl.prototype);

UISwitcher.prototype.addListener = function(name, proc) {
	if(name === "onchange") {
		this.onchange = proc;
	}
	else {
		UIControl.prototype.addListener(name, proc);
	}
};

Object.defineProperty(UISwitcher.prototype, "on", {
	get: function() {
	  return this._ctl.hasAttribute("on");
	},
	set: function(value) {
		value ? this._ctl.setAttribute("on", "true") : this._ctl.removeAttribute("on");
		this.onchange(value);
	}
});

//******************************************************************************
// UISimpleTable
//******************************************************************************

function UISimpleTable(options) {
	this.table = new Builder().n("div").class("ui-simple-table").n("div").n("div").n("table");
	this._ctl = this.table.element.parentNode.parentNode.parentNode;
	
	this.onrowclick = function(row, index) {};
	this.onrowselect = function(row, index) {};
	
	if(options) {
		if(options.columns) {
			var head = this.table.n("thead").n("tr")
			for(var col of options.columns) {
				head.n("th").style("width", col.width).html(col.title);
			}
			this.columns = options.columns;
		}
		if(options.lineheight) {
			this.lineHeight = options.lineheight;
		}
		this.showgrid = options.showgrid;
		if(options.headers === false) {
			this._ctl.setAttribute("headers", false);
		}
	}
	
	this.body = this.table.n("tbody");
	
	_attachKeyHandler(this);
	
	this.setOptions(options);
}

UISimpleTable.prototype = Object.create(UIControl.prototype);

UISimpleTable.prototype.addListener = function(name, func) {
	if(name === "rowselect") {
		this.onrowselect = func;
	}
	else if(name === "rowclick") {
		this.onrowclick = func;
	}
	else {
		UIControl.prototype.addListener.call(this, name, func);
	}
};

UISimpleTable.prototype.clear = function() {
	this.body.html("");
	this.selected = null;
};

UISimpleTable.prototype._select = function(row) {
	if(this.selected) {
		this.selected.setAttribute("selected", false);
	}
	this.selected = row;
	row.setAttribute("selected", true);
	this.onrowselect(row, row.index);
};

UISimpleTable.prototype.click = function(obj) {
	this.onrowclick(obj, obj.index);
};

UISimpleTable.prototype.addRow = function(row) {
	var r = this.body.n("tr").attr("parent", this).attr("data", row).attr("index", this.size()-1)
		.on("onclick", function() {
			this.parent._select(this);
		})
		.on("ondblclick", function() {
			this.parent.click(this);
		});
	
	if(this.lineHeight) {
		r.style("lineHeight", this.lineHeight.toString() + "px");
	}
	
	var index = 0;
	for(var item of row) {
		var col = this.columns[index];
		
		if(!col) break;
		
		var td = r.n("td");
		if(col.type == "image") {
			td.n("img").attr("src", item.v || item);
		}
		else if(col.type == "checkbox") {
			td.n("input").attr("type", "checkbox").attr("index", index).on("onchange", function(){
				this.parentNode.parentNode.data[this.index] = this.checked ? 1 : 0;
			}).element.value = item.v || item;
		}
		else {
			td.n("div").html(item.v || item);
		}
		
		if(!this.showgrid) {
			td.style("border", 0);
		}
		if(this.body.element.childNodes.length === 1) {
			var w = col.width || "100%";
			td.style(w.indexOf("%") > 0 ? "width" : "min-width", w);
		}
		if(col.align) {
			td.style("textAlign", col.align);
		}
		
		index++;
	}
};

UISimpleTable.prototype.selectIndex = function(index) {
	this._select(this.body.child(index));
};

UISimpleTable.prototype.size = function() {
	return this.body.childs();
};

UISimpleTable.prototype.getSelectionRow = function() {
	return this.selected;
};

UISimpleTable.prototype.removeSelection = function() {
	if(this.selected) {
		this.body.element.removeChild(this.selected);
		for(var i = this.selected.index; i < this.size(); i++)
			this.body.child(i).index --;
		this.selected = null;
	}
};

//******************************************************************************
// Canvas
//******************************************************************************

function Canvas(options) {
	this._ctl = new Builder().n("canvas").class("ui-canvas").element;
	this.canvas = this._ctl.getContext("2d");

	if(options) {
		
	}

	this.setOptions(options);
}

Canvas.prototype = Object.create(UIControl.prototype);

Canvas.prototype.clear = function(){
	this._ctl.width = this._ctl.offsetWidth;
	this._ctl.height = this._ctl.offsetHeight;
	this.canvas.clearRect(0, 0, this._ctl.offsetWidth, this._ctl.offsetHeight);
};

//******************************************************************************
// ModalFrame
//******************************************************************************

function ModalFrame(child) {
	this.id = "_modalframe";
	this.control = new Builder().n("div").class("modalframe").id(this.id).element;
	child.parentNode.insertBefore(this.control, child);
}

ModalFrame.prototype.close = function(){ $.removeChild(this.control); };

//******************************************************************************
// Spoiler
//******************************************************************************

function Spoiler(options) {
	UIContainer.call(this);
	
	this.onchange = function() {};
	
	this._spoiler = new Builder().n("div").class("ui-spoiler");
	this._ctl = this._spoiler.element;
	
	this._caption = this._spoiler.n("div").class("caption").html(options.caption).attr("parent", this).on("onclick", function() {
		this.parent.opened = !this.parent.opened;
	});
	
	this._body = this._spoiler.n("div").class("content").n("div").class("body");
}

Spoiler.prototype = Object.create(UIContainer.prototype);

Spoiler.prototype.getContainer = function() {
	return this._body.element;
};

Spoiler.prototype.body = function() {
    return this._body;
};

Spoiler.prototype.setCaption = function(text) {
	this._caption.html(text);
};

Object.defineProperty(Spoiler.prototype, "opened", {
	get: function() {
	  return this.getControl().getAttribute("opened");
	},
	set: function(value) {
		if(value) {
			this.getControl().setAttribute("opened", true);
			this._body.element.parentNode.height(this._body.element.offsetHeight);
		}
		else {
			this.getControl().removeAttribute("opened");
			this._body.element.parentNode.height(0);
		}
		this.onchange();
	}
});

//******************************************************************************
// ToolBar
//******************************************************************************

function ToolBar(buttons, options) {
	UIContainer.call(this);
	
	var p = new Builder().n("div").class("ui-toolbar");
	
	this._ctl = p.element;
	
	this.layout = new HLayout(this, {});
	
	for(var btn of buttons) {
		if(btn.title === "-") {
			p.n("div").class("splitter");
		}
		else {
			if(options && options.url) {
				btn.url = options.url;
			}
			this.add(new ToolButton(btn));
		}
	}
	
	this.setOptions(options);
}

ToolBar.prototype = Object.create(UIContainer.prototype);

ToolBar.prototype.enabled = function(index, value) {
	this.items[index].enabled = value;
};

ToolBar.prototype.getButtonByTag = function(tag) {
	var _btn = null;
	this.each(function(btn){
		if(btn.tag == tag) {
			_btn = btn;
			return true;
		}
	});
	return _btn;
};

//******************************************************************************
// ToolButton
//******************************************************************************

function ToolButton(options) {
	var b = new Builder().n("div").class("button");
	var _icon = b.n("div").class("icon");
	this._ctl = b.element;
	this.submenu = null;
	
	if(options.items) {
		this.setSubMenu(options.items);
	}
	
	this.enabled = true;
	
	this.addListener("click", function(){
		if(this.getAttribute("enabled")) {
			options.click(this);
		}
	});

	if(options) {
		if(options.title) {
			b.attr("title", options.title);
		}
		if(options.icon) {
			_icon.style("backgroundPosition", "-" + (options.icon % 16)*16 + "px -" + (options.icon >> 4)*16 + "px");
		}
		if(options.tag) {
			this.tag = options.tag;
		}
		if(options.url) {
			_icon.style("backgroundImage", "url('" + options.url + "')");
		}
	}
	
	this.setOptions(options);
}

ToolButton.prototype = Object.create(UIControl.prototype);

ToolButton.prototype.haveSubMenu = function() {
	return this.submenu;
};

ToolButton.prototype.setSubMenu = function(subitems) {
	var items = [];
	for(var i in subitems) {
		var item = subitems[i];
		items.push({
			title: item.title,
			command: item.cmd,
			click: item.click
		});
	}
	var popup = new PopupMenu(items);
	if(!this.submenu) {
		new Builder(this._ctl).n("div").attr("parent", this).class("submenu").on("onclick", function(e) {
			e.stopPropagation();
			if(this.parent.enabled == "true") {
				popup.up(this.offsetLeft - 24, this.offsetHeight + 3);
			}

			return false;
		});
	}
	this.submenu = popup;
};

Object.defineProperty(ToolButton.prototype, "enabled", {
	get: function() {
	  return this._ctl.getAttribute("enabled");
	},
	set: function(value) {
		this._ctl.setAttribute("enabled", value);
	}
});

Object.defineProperty(ToolButton.prototype, "checked", {
	get: function() {
	  return this._ctl.getAttribute("checked");
	},
	set: function(value) {
		this._ctl.setAttribute("checked", value);
	}
});

//******************************************************************************
// Splitter
//******************************************************************************

var __sliderDragObj = {x: 0, y: 0};
var __sliderManaged = null;
var __sliderMode = 1;

function Splitter(options) {
	this.manage = null;
	
	this.onresize = function(){};
	
	this._ctl = new Builder().n("div").class("ui-splitter " + (options.theme || "")).attr("parent", this).on("onmousedown", function(event) {
		__sliderManaged = this.parent.manage;
		__sliderDragObj = {x: event.clientX, y: event.clientY, w: __sliderManaged.width, h: __sliderManaged.height, ctl: this.parent};
		document.addEventListener("mousemove", options.edge % 2 === 1 ? __sliderMoveX : __sliderMoveY);
		document.addEventListener("mouseup", __sliderUp);
		__sliderManaged.parent.getControl().style.cursor = options.edge % 2 === 1 ? "col-resize" : "row-resize";
		__sliderMode = options.edge > 2 ? 1 : -1;
	}).element;
	
	if(options.edge % 2 === 0) {
		this._ctl.setAttribute("vertical", true);
	}
	
	if(options.size) {
		if(options.edge % 2 === 1) {
			this.width = options.size;
		}
		else {
			this.height = options.size;
		}
	}

	this.edge = options.edge;
	if(options.manage) {
		this.setManage(options.manage);
	}
}

Splitter.prototype = Object.create(UIControl.prototype);

Splitter.prototype.setManage = function(control) {
	this.manage = control;
	this.free();
	var c = control;
	if(this.edge > 2) {
		var index = control.parent.indexOf(control);
		c = index + 1 < control.parent.size() ? control.parent.get(index + 1) : null;
	}
	if(c) {
		control.parent.insert(this, c);
	}
	else {
		control.parent.add(this);
	}
};

function __sliderMoveX(event) {
	var deltaX = __sliderDragObj.x - event.clientX;
	__sliderManaged.width = __sliderDragObj.w - __sliderMode*deltaX;
};
function __sliderMoveY(event) {
	var deltaY = __sliderDragObj.y - event.clientY;
	__sliderManaged.height = __sliderDragObj.h - __sliderMode*deltaY;
};

function __sliderUp() {
	document.removeEventListener("mousemove", __sliderMoveX);
	document.removeEventListener("mousemove", __sliderMoveY);
	document.removeEventListener("mouseup", __sliderUp);
	__sliderManaged.parent.getControl().style.cursor = "default";
	__sliderDragObj.ctl.onresize();
};

//******************************************************************************
// Tab
//******************************************************************************

function Tab(options) {
	var tab = new Builder().n("div").class("tab").attr("parent", this);
	if(options.title) {
		tab.attr("title", options.title);
	}
	var parent = this;
	tab.on("onmousedown", function() {
		parent.parent.select(parent);
	});
	this._icon = tab.n("div").class("icon");
	this._title = tab.n("div").class("title").html(options.caption);
	tab.n("div").class("close").attr("title", "Close tab").html("&#10006;").on("onclick", function() {
		parent.parent.close(parent);
	});
	this._ctl = tab.element;
}

Tab.prototype = Object.create(UIControl.prototype);

Tab.prototype.save = function(value) {
	this._ctl.setAttribute("save", value);
};

Tab.prototype.load = function(value) {
	this._ctl.setAttribute("save", value);
};

Object.defineProperty(Tab.prototype, "caption", {
	get: function() {
		return this._title.element.innerHTML;
	},
	set: function(value) {
		this._title.html(value);
	}
});

Object.defineProperty(Tab.prototype, "title", {
	get: function() {
		return this._ctl.getAttribute("title");
	},
	set: function(value) {
		this._ctl.setAttribute("title", value);
	}
});

Object.defineProperty(Tab.prototype, "icon", {
	get: function() {
		return this._icon.element.style.backgroundImage;
	},
	set: function(value) {
		this._icon.style("background-image", "url('" + value + "')");
	}
});

Object.defineProperty(Tab.prototype, "active", {
	get: function() {
		return this._ctl.getAttribute("active");
	},
	set: function(value) {
		this._ctl.setAttribute("active", value);
	}
});

//******************************************************************************
// TabControl
//******************************************************************************

function TabControl(options) {
	UIContainer.call(this);
	
	this._tabController = new Builder().n("div").attr("parent", this).on("onmousewheel", function(event) {
		var y = -(event.deltaY/2);
		this.parent.scroll(y);
	}).class("tabs").n("div").class("body");
	this._ctl = this._tabController.element.parentNode;

	this.onselect = function() { };
	this.onclose = function() { return true; };
	
	this.control = this._tabController.element;
	
	this.setOptions(options);

	this.layout = new HLayout(this, {});
}

TabControl.prototype = Object.create(UIContainer.prototype);

TabControl.prototype.getContainer = function() {
	return this._tabController.element;
};

TabControl.prototype.scroll = function(delta) {
	if(delta > 0 && this.getContainer().offsetLeft + delta > 0)
		delta = -this.getContainer().offsetLeft;
	else if(delta < 0 && this.getContainer().offsetLeft + delta + this.getContainer().offsetWidth < this._ctl.offsetWidth-2)
		delta = this._ctl.offsetWidth-2 - (this.getContainer().offsetLeft + this.getContainer().offsetWidth);
	
	if(this.getContainer().offsetWidth < this._ctl.offsetWidth-2) {
		if(this.getContainer().offsetLeft)
			this.getContainer().style.left = "0px";
	}
	else
		this.getContainer().style.left = (this.getContainer().offsetLeft + delta).toString() + "px";
};

TabControl.prototype.select = function(tab) {
	this.each(function(item) {
		item.active = false;
		if(item.control) {
			item.control.hide();
		}
	});
	
	tab.active = true;
	
	if(tab.control) {
		tab.control.show();
	}
	
	this.onselect(tab);
};

TabControl.prototype.close = function(tab) {
	if(this.onclose(tab)) {
		var index = this.indexOf(tab);
		tab.free();
		if(index > 0) {
			this.select(this.get(index-1));
		}
		else if(this.size()) {
			this.select(this.get(0));
		}
		else {
			this.onselect(null);
		}
		var d = this._ctl.offsetWidth-2 - (this.getContainer().offsetLeft + this.getContainer().offsetWidth);
		if(d > 0)
			this.scroll(d);
	}
};

TabControl.prototype.addTab = function(name, title, control) {
	var tab = new Tab({caption: name, title: title});

	this.add(tab);
	this.select(tab);
	
	if(control) {
		control.hide();
		this.control.parentNode.appendChild(control);
		tab.control = control;
	}
	this.scroll(-4096);
	
	return tab;
};

TabControl.prototype.getCurrentTab = function() {
	var active = null;
	this.each(function(item) {
		if(item.active) {
			active = item;
		}
	});
	
	return active;
};

//******************************************************************************
// GoogleChart
//******************************************************************************

function GoogleChart(options) {
	this._ctl = new Builder().n("div").class("ui-chart").element;
	this.oninit = function(){};
	
	this.options = options;
	
	this.setOptions(options);
}

GoogleChart.prototype = new UIControl();

GoogleChart.prototype.init = function() {
	if(window.google) {
		this.oninit();
	}
	else {
		$.appendScript("https://www.google.com/jsapi", function(parent){ return function(){ parent._onload(); }; }(this));
	}
};

GoogleChart.prototype.draw = function(data) {
	if(!this.chart) {
		this.chart = new window.google.visualization[this.options.chart](this._ctl);
	}
	this.chart.draw(data, this.options);
};

GoogleChart.prototype._onload = function() {
	var parent = this;
	window.google.load("visualization", "1", {packages:["corechart", "gauge"], callback : function(){ parent.oninit(); } });
};

//******************************************************************************
// Info
//******************************************************************************



//******************************************************************************
// Dialog
//******************************************************************************

function Dialog(options) {
	UIContainer.call(this);

	this.form = new Builder().n("div").element;
	this.form.dialog(options);
	this._ctl = this.form;
	this.hide();
	
	if(options) {
		// if(options.width) {
		// 	this.form.width(options.width);
		// }
		// if(options.height) {
		// 	this.form.height(options.height);
		// }
		if(options.showcaption === false) {
			this.form.childNodes[0].className = "";
			this.form.childNodes[0].hide();
		}
		if(options.showborder === false) {
			this.form.style.borderWidth = 0;
		}
		if(options.popup || options.popup === undefined) {
			$.appendChild(this.form);
		}
	}
	
	this.setOptions(options);
}

Dialog.prototype = Object.create(UIContainer.prototype);

Object.defineProperty(Dialog.prototype, "caption", {
	get: function() {
	  return "";
	},
	set: function(value) {
		this.form.setCaption(value);
	}
});

Dialog.prototype.getContainer = function() {
	return this.form.body();
};

Dialog.prototype.show = function(opt) {
	this.form.show(opt);
};

Dialog.prototype.close = function() {
	this.form.close();
};

Dialog.prototype.addListener = function(name, func) {
	if(name === "resize") {
		this.form.onresize = func;
	}
	else if(name === "close") {
		this.form.onclose = func;
	}
	else {
		UIContainer.prototype.addListener.call(this, name, func);
	}
};

//******************************************************************************
// InfoPanel
//******************************************************************************

function InfoPanel() {
	
}

InfoPanel.prototype._show = function(className, text) {
	var parent = this;
	this.panel = new Builder().n("div").class("infopanel").on("onclick", function(){
		parent._hide(this);
		clearInterval(this.timer);
	}).n("div").class(className).html(text);
	var e = this.panel.element.parentNode;
	document.body.appendChild(e);
	e.style.top = "0";
	
	e.timer = setTimeout(function(){
		parent._hide(e);
	}, 5000);
};

InfoPanel.prototype._hide = function(obj) {
	obj.style.top = "-60px";
	this.panel = null;
	setTimeout(function(){
		document.body.removeChild(obj);
	}, 1000);
};

InfoPanel.prototype.error = function(text) {
	this._show("error", text);
};

InfoPanel.prototype.info = function(text) {
	this._show("info", text);
};

//******************************************************************************
// Layout
//******************************************************************************

function Layout(parent) {
	this.parent = parent;
}

Layout.prototype.addChild = function(child) {
	// do nothing
};

Layout.prototype.setOptions = function(options) {
	// var style = this.parent.getControl().style;
	// if(options.padding) {
	// 	var v = options.padding.toString() + "px";
	// 	style.paddingTop = v;
	// 	style.paddingLeft = v;
	// 	style.paddingRight = v;
	// 	style.paddingBottom = v;
	// }
};

// FixLayout

function FixLayout(parent) {
	Layout.call(this, parent);

}

FixLayout.prototype = Object.create(Layout.prototype);

FixLayout.prototype.addChild = function(child) {
	child.getControl().style.position = "absolute";
};

// FlexLayout

function FlexLayout(parent, options) {
	Layout.call(this, parent);
	
	this.setOptions(options);
}

FlexLayout.prototype = Object.create(Layout.prototype);

FlexLayout.prototype.addChild = function(child) {
	if(child._layoutOpt) {
		var style = child.getControl().style;
		if(child._layoutOpt.margin) {
			var v = child._layoutOpt.margin.toString() + "px";
			style.marginTop = v;
			style.marginLeft = v;
			style.marginRight = v;
			style.marginBottom = v;
		}
		if(child._layoutOpt.grow) {
			style.flexGrow = child._layoutOpt.grow;
		}
		if(child._layoutOpt.shrink || child._layoutOpt.shrink === 0) {
			style.flexShrink = child._layoutOpt.shrink;
		}
		if(child._layoutOpt.alignSelf) {
			style.alignSelf = ["auto", "flex-start", "flex-end", "enter", "baseline", "stretch"][child._layoutOpt.alignSelf];
		}
	}
};

FlexLayout.prototype.setOptions = function(options) {
	var style = this.parent.getContainer().style;
	this.parent.getContainer().classList.add("ui-layout-flex");
	if(options.wrap) {
		style.flexWrap = ["nowrap", "wrap", "wrap-reverse"][options.wrap];
	}
	if(options.justifyContent) {
		style.justifyContent = ["flex-start", "flex-end", "center", "space-between", "space-around"][options.justifyContent];
	}
	if(options.alignItems) {
		style.alignItems = ["flex-start", "flex-end", "center", "baseline", "stretch"][options.alignItems];
	}
	if(options.alignContent) {
		style.alignContent = ["flex-start", "flex-end", "center", "space-between", "space-around", "stretch"][options.alignContent];
	}
	if(options.padding) {
		style.padding = options.padding + "px";
	}
	
	Layout.prototype.setOptions.call(this, options);
};

// HLayout

function HLayout(parent, options) {
	FlexLayout.call(this, parent, options);
	
	parent.getContainer().style.flexDirection = options.reverse ? "row-reverse" : "row";
}

HLayout.prototype = Object.create(FlexLayout.prototype);

// VLayout

function VLayout(parent, options) {
	FlexLayout.call(this, parent, options);
	
	parent.getContainer().style.flexDirection = options.reverse ? "column-reverse" : "column";
}

VLayout.prototype = Object.create(FlexLayout.prototype);
