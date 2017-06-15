namespace Hion {
	export class Hint {
		private builder: Builder;
		private timer: number;
		private wasShow: boolean;

		constructor() {
			this.builder = new Builder().div("hint");
		}

		body(): Builder {
			return this.builder.html("");
		}
		
		show(x: number, y: number) {
			this.close();
			
			document.addEventListener("touchstart", this.handleEvent, false);

			this.timer = setTimeout(function(hint){
				return function(){
					hint.builder.render();
					hint.wasShow = true;
					if(x + hint.builder.element.offsetWidth + 5 > window.innerWidth)
						x = window.innerWidth - hint.builder.element.offsetWidth - 5;
					if(y + hint.builder.element.offsetHeight + 5 > window.innerHeight)
						y = window.innerHeight - hint.builder.element.offsetHeight - 5;
					hint.builder.move(x, y);
					document.addEventListener("mousemove", hint.handleEvent, false);
				};
			}(this), 400);
		}
		
		close() {
			if(this.timer) {
				document.removeEventListener("mousemove", this.handleEvent);
				document.removeEventListener("touchstart", this.handleEvent);

				clearTimeout(this.timer);
				this.timer = 0;
				if(this.wasShow) {
					this.wasShow = false;
					this.builder.erase();
				}
			}
		}

		handleEvent = (event: MouseEvent) => this.close();
	}
}