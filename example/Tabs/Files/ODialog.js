function hiODialog() {
	// Global vars ------------------------------------
	var odialog2 = document.createElement("input");;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Open dialog demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '410',
		height: '303',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var ListBox4 = new ListBox({});
	ListBox4.place(28,49,'353','205');
	this.ctl.add(ListBox4);
	var Button5 = new Button({
		caption: 'Open files',
		url: ''
	});
	Button5.place(28,14,'353','28');
	this.ctl.add(Button5);
	
	// Init section ------------------------------------
	odialog2.setAttribute("type", "file");
	odialog2.setAttribute("multiple", "");
	function odialogExecute2(event) {
		for(var f = 0; f < this.files.length; f++) {
			ListBox4.add(this.files[f].name);
		}
	}
	odialog2.addEventListener("change", odialogExecute2);
	Button5.addListener('click', function (event) {
		odialog2.click();
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
