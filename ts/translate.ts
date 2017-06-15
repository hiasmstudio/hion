namespace Hion {
	export class Translate {
		strings = {};
		onload = () => {};

		constructor() {	}

		translate(text: string): string {
			// if(!this.strings[string]) {
			// 	console.log(string)
			// }
			return this.strings[text] || text;
		}
		
		load() {
			let lang = this.getLang();
			$.get("lang/" + lang + ".json", (data: string) => {
				this.strings = JSON.parse(data);
				this.onload();
			});
		}
		
		getLang(): string {
			let def = window.navigator.language.substr(0, 2);
			if(def !== "ru" && def !== "en") {
				def = "en";
			}
			return getOption("opt_lang", def);
		}
	}
}
