function hiComboBox() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'ComboBox demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '400',
		height: '70',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var ComboBox4 = new ComboBox({});
	var Label5 = new Label({
		caption: '',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label5.place(154,14,'100','22');
	this.ctl.add(Label5);
	ComboBox4.place(14,14,'128','20');
	this.ctl.add(ComboBox4);
	
	// Init section ------------------------------------
	function onselect4(item, text) {
		Label5.caption = text;
	}
	ComboBox4.onselect = onselect4;
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
		for(var i2 = 1; i2 < 11; i2 += 1) {
			ComboBox4.add('Item ' + (i2).toString());
		}
	};
}

// made by hion
