//******************************************************************************
// HTML extend
//******************************************************************************

window.HTMLElement.prototype.show = function() {
	this.removeAttribute("visible");
	return this;
};
window.HTMLElement.prototype.hide = function() {
	this.setAttribute("visible", false);
	return this;
};
window.HTMLElement.prototype.move = function(x, y) {
	this.style.left = x.toString() + "px";
	this.style.top = y.toString() + "px";
	return this;
};
window.HTMLElement.prototype.left = function(x) {
	this.style.left = x.toString() + "px";
	return this;
};
window.HTMLElement.prototype.top = function(y) {
	this.style.top = y.toString() + "px";
	return this;
};
window.HTMLElement.prototype.width = function(w) {
	this.style.width = w.toString() + "px";
	return this;
};
window.HTMLElement.prototype.height = function(h) {
	this.style.height = h.toString() + "px";
	return this;
};

window.HTMLElement.prototype.append = function(html) {
	
	return this;
};

//******************************************************************************
// Builder
//******************************************************************************

function Builder(element) {
	this.element = element;
}
Builder.prototype.n = function(tag) {
	var element = document.createElement(tag);
	if(this.element) {
		this.element.appendChild(element);
	}
	return new Builder(element);
};
Builder.prototype.div = function(className) {
	return this.n("div").class(className);
};
Builder.prototype.span = function(className) {
	return this.n("span").class(className);
};
Builder.prototype.checkbox = function(className) {
	return this.n("input").attr("type", "checkbox").class(className);
};
Builder.prototype.inputbox = function(className) {
	return this.n("input").attr("type", "text").class(className);
};
Builder.prototype.html = function(text) {
	this.element.innerHTML = text;
	return this;
};
Builder.prototype.class = function(className) {
	this.element.className = className;
	return this;
};
Builder.prototype.id = function(id) {
	this.element.id = id;
	return this;
};
Builder.prototype.checked = function(value) {
	if(value === undefined) {
		return this.element.checked;
	}
	this.element.checked = value;
	return this;
};
Builder.prototype.value = function(value) {
	if(value === undefined) {
		return this.element.value;
	}
	this.element.value = value;
	return this;
};
Builder.prototype.scrollLeft = function(value) {
	if(value === undefined) {
		return this.element.scrollLeft;
	}
	this.element.scrollLeft = value;
	return this;
};
Builder.prototype.scrollTop = function(value) {
	if(value === undefined) {
		return this.element.scrollTop;
	}
	this.element.scrollTop = value;
	return this;
};
Builder.prototype.attr = function(name, value) {
	this.element[name] = value;
	return this;
};
Builder.prototype.htmlAttr = function(name, value) {
	this.element.setAttribute(name, value);
	return this;
};
Builder.prototype.style = function(name, value) {
	this.element.style[name] = value;
	return this;
};
Builder.prototype.append = function(node) {
	this.element.appendChild(node);
	return this;
};
Builder.prototype.on = function(name, proc) {
	this.element[name] = proc;
	return this;
};
Builder.prototype.childs = function() {
	return this.element.childNodes.length;
};
Builder.prototype.child = function(index) {
	return this.element.childNodes[index];
};
Builder.prototype.parent = function() {
	return new Builder(this.element.parentNode);
};
Builder.prototype.hide = function() {
	this.element.hide();
	return this;
};
Builder.prototype.show = function() {
	this.element.show();
	return this;
};
Builder.prototype.render = function() {
	document.body.appendChild(this.element);
	return this;
};
Builder.prototype.erase = function() {
	document.body.removeChild(this.element);
	return this;
};
Builder.prototype.move = function(x, y) {
	this.element.move(x, y);
	return this;
};
Builder.prototype.size = function(width, height) {
	this.element.style.width = width.toString() + "px";
	this.element.style.height = height.toString() + "px";
	return this;
};

$ = function(id) {
	return document.getElementById(id);
};

$.appendChild = function(child) {
	document.getElementsByTagName("body")[0].appendChild(child);
};
$.insertBefore = function(parent, child) {
	document.getElementsByTagName("body")[0].insertBefore(child, parent);
};
$.removeChildById = function(id) {
	document.getElementsByTagName("body")[0].removeChild($(id));
};
$.removeChild = function(child) {
	document.getElementsByTagName("body")[0].removeChild(child);
};
$.appendScript = function(source, onload) {
	var sc = document.createElement("script");
	sc.src = source;
	sc.type="text/javascript";
	if(onload) {
		sc.onload = onload;
	}
	document.getElementsByTagName("head")[0].appendChild(sc);
};
$.cursor = function(cursor) {
	document.getElementsByTagName("body")[0].style.cursor = cursor;
};

//******************************************************************************
// HTTP Requests
//******************************************************************************

$.get = function(url, callback, object) {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.send();

	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) return;

		callback(xhr.responseText, object);
	};
};

$.post = function(url, data, callback, object) {
	var xhr = new XMLHttpRequest();
	xhr.open('POST', url, true);
	//xhr.responseType    = "arraybuffer";
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	var requre = "";
	for(var name in data) {
		if(requre) {
			requre += "&";
		}
		requre += name + "=" + encodeURIComponent(data[name]);
	}
	xhr.send(requre);

	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) return;

		callback.call(xhr, xhr.responseText, object);
	};
};
