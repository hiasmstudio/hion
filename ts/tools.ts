namespace Hion {

	/** Translate text to current language */
	export var _T:(text: string) => string = null;

	//******************************************************************************
	// Runner
	//******************************************************************************
	export class Runner {
		private sdk: SDK;
		private e: any;

		constructor (private project: string, private callback?: any) {}

		run(args?: any, overrideCallback?: any) {
			if(this.sdk) {
				this.sdk.run(FLAG_USE_RUN);
				if(this.e && args) {
					if(this.callback || overrideCallback) {
						this.e.onreturn = this.callback || overrideCallback;
					}
					this.e.onInit.call(args);
				}
			}
			else {
				$.get((this.project.indexOf("/") >= 0 ? this.project : "gui/" + this.project) + ".sha", (data: string) => {
					let sdk = new SDK(packMan.getPack("webapp"));
					sdk.load(data);
					sdk.run(FLAG_USE_RUN);
					var e = sdk.getElementById("hcTransmitter") as any;
					if(e) {
						if(this.callback || overrideCallback) {
							e.onreturn = this.callback || overrideCallback;
						}
						if(args) {
							e.onInit.call(args);
						}
					}
					this.sdk = sdk;
					this.e = e;
				});
			}
		}
	}

	//******************************************************************************
	// Loader
	//******************************************************************************

	export class LoaderTask {
		parent: Loader;

		constructor(public run:() => void) {
			this.parent = null;
		}

		taskComplite(text: string) {
			console.log(text);
			this.parent.state(text);
			this.parent["taskComplite"](this);
		}
	}

	interface LoaderOptions {
		havestate: boolean;
	}
	export class Loader {
		private tasks: Array<LoaderTask>;
		onload = () => {};

		constructor(private options: LoaderOptions) {
			this.tasks = [];
		}
		
		add(task: LoaderTask) {
			this.tasks.push(task);
			task.parent = this;
		}
		
		run() {
			let nt = this.tasks.shift();
			nt.run();
		}
		
		private taskComplite(task: LoaderTask) {
			if(this.tasks.length) {
				this.run();
			}
			else {
				this.onload();
			}
		}
		
		state(text: string) {
			if(this.options && this.options.havestate) {
				$("loaderstate").innerHTML = text;
			}
		}
	}

	//******************************************************************************
	// functions
	//******************************************************************************
	interface Error {
		code: number;
		info?: string;
	}
	var infoPanel = new InfoPanel();
	/**
	 * Display error top
	 * @param error - code and info
	 */
	export function displayError(error: Error) {
		var text = "Unknown error, code = " + error.code + (error.info ? ", " + error.info : "");
		var code = "error." + error.code;
		var tText = translate.translate(code);
		
		infoPanel.error(tText === code ? text : tText + (error.info ? ": " + error.info : ""));
	}

	export function printError(text: string) {
		new Builder($("state")).n("div").html(text);
	}
	
	export function GetPos(offTrial) {
		var offL=0;
		var offT=0;

		while(offTrial) {
			offL+=offTrial.offsetLeft - offTrial.scrollLeft;
			offT+=offTrial.offsetTop - offTrial.scrollTop;
			offTrial=offTrial.offsetParent;
		}

		return {left:offL , top:offT};
	} 

	export function toStep(v) { return v < 0 ? Math.ceil(v/7)*7 : Math.floor(v/7)*7; }

	//******************************************************************************
	// WEB API polyfill
	//******************************************************************************
	export function fullScreen(element: HTMLElement) {
		if(element.requestFullscreen) {
			element.requestFullscreen();
		} else if(element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		} else if(element["mozRequestFullScreen"]) {
			element["mozRequestFullScreen"]();
		}
	}

	export function fullScreenCancel() {
		if(document.exitFullscreen) {
			document.exitFullscreen();
		} else if(document.webkitExitFullscreen ) {
			document.webkitExitFullscreen();
		} else if(document["mozCancelFullScreen"]) {
			document["mozCancelFullScreen"]();
		}
	}

	export function isInFullscreen() {
		return document.fullscreenElement || document.webkitFullscreenElement || document["mozFullScreenElement"];
	}

	if(!String.prototype.startsWith) {
		String.prototype.startsWith = function(text){ return this.indexOf(text) === 0 };
	}

	//******************************************************************************
	// options
	//******************************************************************************
	export function getOption(name: string, defValue: any) {
		return window.localStorage["gv_" + name] || defValue;
	}

	export function setOption(name: string, value: any) {
		window.localStorage["gv_" + name] = value;
	}

	export function getOptionBool(name: string, defValue: boolean | number): boolean {
		return parseInt(getOption(name, defValue)) === 1;
	}

	export function getOptionInt(name: string, defValue: number): number {
		return parseInt(getOption(name, defValue));
	}

	export function setOptionBool(name: string, value: boolean | number) {
		setOption(name, value);
	}

	export function setOptionInt(name: string, value: number) {
		setOption(name, value);
	}
}