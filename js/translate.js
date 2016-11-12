function Translate() {
	this.strings = {};
	
	this.onload = function(){};

	this.translate = function(string) {
		// if(!this.strings[string]) {
		// 	console.log(string)
		// }
		return this.strings[string] || string;
	};
	
	this.load = function() {
		var lang = this.getLang();
		$.get("lang/" + lang + ".json", function(data, t){
			t.strings = JSON.parse(data);
			t.onload();
		}, this);
	};
	
	this.getLang = function() {
		var def = window.navigator.language.substr(0, 2);
		if(def !== "ru" && def !== "en") {
			def = "en";
		}
		return window.getOption("opt_lang", def);
	};
}
