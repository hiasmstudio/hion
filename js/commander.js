'use strict';

/* global translate */

function Commander(commands) {
    
    /*
        Список всех команд
    */
    this.commands = commands;
    
    /*
        Вызывается всякий раз после выполнения команды
    */
    this.onexec = function() {};
    this.onupdate = function() {};
    
    this.isEnabled = function(command) {
        return this.commands[command].enabled;
    };
    
    this.isChecked = function(command) {
        return this.commands[command].checked;
    };
    
    this.enabled = function(command) {
        this.commands[command].enabled = true;
    };
    
    this.checked = function(command) {
        this.commands[command].checked = true;
    };
    
    this.getCaption = function(command) {
        return translate.translate("cmd." + command);
    };
    
    this.haveIcon = function(command) {
        return this.commands[command].icon || 0;
    };
    
    this.getTitle = function(command) {
        return translate.translate("cmd." + command + ".info");
    };
    
    this.execCommand = function(command, data) {
        var cmd = this.commands[command];
        if(cmd.enabled) {
            if(cmd.exec) {
                cmd.exec.call(this, command, data);
            }
            this.onexec(command, data);
        }
        return this;
    };
    
    this.reset = function() {
        for(var c in this.commands) {
            var cmd = this.commands[c];
            cmd.enabled = cmd.def ? true : false;
            cmd.checked = false;
        }
        this.onupdate();
    };
    
    this.execShortCut = function(event) {
        for(var cmd in this.commands) {
            if(this.commands[cmd].key === event.keyCode) {
                if(this.commands[cmd].ctl && event.ctrlKey || this.commands[cmd].ctl === undefined) {
                    this.execCommand(cmd);
                    return true;
                }
            }
        }
        return false;
    };
}