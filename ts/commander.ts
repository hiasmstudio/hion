namespace Hion {
	interface Command {
		// init
		def: boolean;
		icon: number;
		key: number;
		ctl: boolean;
		exec: (this: Commander, cmd:string, data: any) => void;
		// work
		enabled: boolean;
		checked: boolean;
	}
	interface CommandList {
		[key:string]: Command;
	}

	/** Managing IDE commands */
	export class Commander {
		public onexec = (cmd: string, data: any) => {};
		public onupdate = () => {};

		constructor(private commands : CommandList) {}
		
		/** Defines the availability of the command */
		isEnabled(command: string): boolean {
			return this.commands[command].enabled;
		}
		
		/** Defines the selected command */
		isChecked(command: string): boolean {
			return this.commands[command].checked;
		}
		
		/** Make the command accessible */
		enabled(command: string): boolean {
			return this.commands[command].enabled = true;
		}
		
		/** Make a command selected */
		checked(command: string): boolean {
			return this.commands[command].checked = true;
		}

		/** Returns the translated command name */
		getCaption(command: string): string {
			return translate.translate("cmd." + command);
		}
		
		/** Returns the command icon */
		haveIcon(command: string): number {
			return this.commands[command].icon || 0;
		}
		
		/** Returns the translated command description */
		getTitle(command: string): string {
			return translate.translate("cmd." + command + ".info");
		}
		
		/** Executes the command */
		execCommand(command: string, data?: any): Commander {
			let cmd = this.commands[command];
			if(cmd.enabled) {
				if(cmd.exec) {
					cmd.exec.call(this, command, data);
				}
				this.onexec(command, data);
			}
			return this;
		}
		
		/** Resets the status of all commands */
		reset() {
			for(let c in this.commands) {
				let cmd = this.commands[c];
				cmd.enabled = cmd.def ? true : false;
				cmd.checked = false;
			}
			this.onupdate();
		}
		
		/** Executes a command on a combination of hot keys */
		execShortCut(event): boolean {
			for(let cmd in this.commands) {
				if(this.commands[cmd].key === event.keyCode) {
					if(this.commands[cmd].ctl && event.ctrlKey || this.commands[cmd].ctl === undefined) {
						this.execCommand(cmd);
						return true;
					}
				}
			}
			return false;
		}
	}
}