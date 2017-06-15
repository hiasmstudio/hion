namespace Hion {
	function hex(v: number): string {
		var r = v.toString(16);
		return r.length == 1 ? "0" + r : r;
	}

	class Font {
		private fontText: string;
		private fontColor: string;

		constructor(public name: string = "Courier New", public size: number = 8,
					public flags: number = 0, public color: number = 0, public charset: number = 0) {
			this.updateFont();
		}
		updateFont() {
			this.fontText = (this.isItalic() ? "italic " : "") + (this.isBold() ? "bold " : "") + this.size + "px " + this.name;
			if(typeof this.color === "number")
				this.fontColor = '#' + hex(this.color & 0xff) + hex((this.color >> 8) & 0xff) + hex(this.color >> 16);
			else
				this.fontColor = this.color;
		}
		apply(ctx: CanvasRenderingContext2D) {
			ctx.fillStyle = this.fontColor;
			ctx.font = this.fontText;
		}
		valueOf() {
			return this.name + "," + this.size + "," + this.flags + "," + this.color + "," + this.charset;
		}
		isBold() { return this.flags & 0x1; }
		isItalic() { return this.flags & 0x2; }
		isUnderline() { return false; }
	}

	export class ElementProperty {
		/** Link to parent element */
		parent: SdkElement;
		/** Property type: DATA_XXX */
		type: number;
		/** Property code name */
		name: string;
		/** Property name displayed in the editor */
		title: string;
		/** Default property value from template */
		def: string;
		value: any;
		list: Array<string>;
		flags: number;
		group: string;
		editor: string;

		constructor (parent: SdkElement, public inherit: string, public template) {
			this.type = template.type;
			this.name = template.name;
			this.parse(template.def);
			this.def = this.value;
			this.inherit = inherit;
			if(template.title) {
				this.title = template.title;
			}
			if(template.list) {
				this.list = template.list.split(",");
			}
			this.flags = template.flags ? template.flags : 0;
			if(template.group) {
				this.group = template.group;
			}
			if(template.editor) {
				this.editor = template.editor;
			}
			this.parent = parent;
		}

		isDef(): boolean {
			switch(this.type) {
				case DATA_FONT:
					return this.value.valueOf() === this.def.valueOf();
			}
			return this.value === this.def;
		}
		isDefaultEdit(): boolean { return (this.flags & PROP_FLAG_DEFAULT) > 0; }
		isPoint(): boolean { return (this.flags & PROP_FLAG_POINT) > 0; }

		serialize(): string {
			function serializeString(value): string {
				var arr = value.toString().replace(/\r/g, "\\r").split("\n");
				var s = "#";
				for(var i in arr) {
					s += arr[i].length + ":" + arr[i] + "|";
				}
				return s;
			}
			
			switch(this.type) {
				case DATA_LIST:
				case DATA_STR:
					return serializeString(this.value.toString());
				case DATA_DATA:
					if(typeof this.value == "string") {
						return "String(" + this.value + ")";
					}
					else if(parseInt(this.value) == this.value) {
						return "Integer(" + this.value + ")";
					}
					else {
						return "Real(" + this.value + ")";
					}
				case DATA_MANAGER:
					return '"' + this.value + '"';
				case DATA_FONT:
					return '[' + this.value.valueOf() + ']';
				case DATA_ICON:
				case DATA_BITMAP:
				case DATA_JPEG:
				case DATA_STREAM:
					return '[ZIP' + this.value + ']';
				case DATA_ARRAY:
					return "";
			}
			
			return this.value.toString();
		}

		private parseStringValue(value: string) {
			var fIndex = 1;
			var p1 = 0;
			var lines = [];
			var counter = 0;
			while( (p1 = value.indexOf(":", fIndex)) > 0 && counter < 2000) {
				var len = parseInt(value.substr(fIndex, p1-fIndex));
				lines.push(len ? value.substr(p1+1, len) : "");
				fIndex = p1 + len + 2;
				counter++;
			}
			if(counter == 2000) {
				console.error("To many lines in project!");
			}
			return lines.join("\n").replace(/\\r/g, "\r");
		}
		parse(value: string) {
			switch(this.type) {
				case DATA_LIST:
				case DATA_STR:
					if(value) {
						var c = value.charAt(0);
						if(c === "#" && value.charAt(1) !== "#") {
							this.value = this.parseStringValue(value);
						}
						else if(c === "\"") {
							this.value = value.substr(1, value.length-2);
						}
						else {
							this.value = value;
						}
					}
					else {
						this.value = "";
					}
					break;
				case DATA_DATA:
					if(typeof value === "string" && (value.startsWith("Integer(") || value.startsWith("String(") || value.startsWith("Real("))) {
						let i = value.indexOf("(");
						let type = value.substr(0, i);
						let v = value.substr(i + 1, value.length - i - 2);
						if(type === "String") {
							this.value = v.substr(0, 1) == "#" ? this.parseStringValue(v) : v;
						}
						else if(type === "Integer") {
							this.value = parseInt(v);
						}
						else if(type === "Real") {
							this.value = parseFloat(v);
						}
					}
					else if(typeof value === "string" && value.startsWith("#")) {
						this.value = this.parseStringValue(value);
					}
					else {
						let pvalue = parseFloat(value);
						if(!isNaN(pvalue) && value == pvalue.toString()) {
							this.value = pvalue;
						}
						else {
							this.value = value;
						}
					}
					break;
				case DATA_REAL:
					this.value = value ? parseFloat(value) : 0.0;
					break;
				case DATA_INT:
				case DATA_ENUM:
				case DATA_ENUMEX:
					this.value = value ? parseInt(value) : 0;
					break;
				case DATA_MANAGER:
					this.value = value.indexOf('"') == 0 ? value.substr(1, value.length - 2) : value;
					break;
				case DATA_COLOR:
					if(typeof value === "number" || value.charAt(0) >= '0' && value.charAt(0) <= '9') {
						let v = parseInt(value);
						this.value = '#' + hex(v & 0xff) + hex((v >> 8) & 0xff) + hex(v >> 16);
					}
					else {
						this.value = value;
					}
					break;
				case DATA_FONT:
					if(value) {
						let args = value.substr(1, value.length - 2).split(",");
						this.value = new Font(args[0], parseInt(args[1]) /* || args[1] */, parseInt(args[2]), parseInt(args[3]), parseInt(args[4]));
					}
					else {
						this.value = new Font();
					}
					break;
				case DATA_ICON:
				case DATA_BITMAP:
				case DATA_JPEG:
				case DATA_STREAM:
					let icon = value.substr(1, value.length - 2);
					if(icon.startsWith("ZIP")) {
						// convert from ZIP
						this.value = icon.substr(3);
					}
					else {
						this.value = icon;
					}
					break;
				case DATA_ARRAY:
					this.value = [];
					this.value.type = parseInt(value);
					break;
				default:
					console.error("Property[", this.name, "] with type", this.type, "not support.")
					this.value = value;
			}
			
			if(this.parent)
				this.parent.onpropchange(this);
		}

		getText(): string {
			switch(this.type) {
				case DATA_ENUM:
				case DATA_ENUMEX:
					return this.list[this.value];
				case DATA_FONT:
					return this.value.name + "," + this.value.size;
			}
			
			return this.value.toString().replace(/</g, "&lt;");
		}
		getList(): Array<string> {
			switch(this.type) {
				case DATA_MANAGER:
					var list = [];
					for(var e of this.parent.parent.imgs) {
						if(e.props.Name && e.props.Name.value) {
							for(var i of e.interfaces) {
								for(var ie of this.list) {
									if(i == ie) {
										list.push(e.props.Name.value);
									}
								}
							}
						}
					}
					list.push(this.def);
					return list;
			}
			return this.list;
		}
		getElement(): SdkElement {
			var sdk = this.parent.parent;
			for(var item of this.list) {
				for(var e of sdk.imgs) {
					if(e.name === item && e.props.Name.value === this.value) {
						return e;
					}
				}
			}
			return null;
		}
		getInfo(): string {
			return this.inherit + "." + this.name;
		}
		setValue = function(value) {
			this.value = value;
			this.parent.onpropchange(this);
		}

		getTranslateValue(): string {
			return translate ? translate.translate(this.value) : this.value;
		}
	}
}