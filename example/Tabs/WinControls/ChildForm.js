function ChildForm() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Main form',
		icon: '',
		destroy: true,
		resize: 0,
		width: '270',
		height: '110',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	MainForm4 = new Dialog({
		title: 'Sub form',
		icon: '',
		destroy: false,
		resize: 0,
		width: '400',
		height: '300',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	MainForm4.layout = new FixLayout(MainForm4);
	var Button5 = new Button({
		caption: 'Show child form',
		url: ''
	});
	Button5.place(28,21,'213','42');
	this.ctl.add(Button5);
	
	// Init section ------------------------------------
	Button5.addListener('click', function (event) {
		MainForm4.show({noCenter: false});
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
