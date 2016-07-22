function hiEnabledTest() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Enabled test',
		icon: '',
		destroy: true,
		resize: 0,
		width: '294',
		height: '388',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Button2 = new Button({
		caption: 'Push',
		url: ''
	});
	Button2.place(56,21,'45','21');
	this.ctl.add(Button2);
	var Button3 = new Button({
		caption: 'Push',
		url: ''
	});
	Button3.place(161,21,'45','21');
	this.ctl.add(Button3);
	var CheckBox4 = new CheckBox({
		caption: 'CheckBox',
		checked: 0
	});
	CheckBox4.place(56,56,'73','21');
	this.ctl.add(CheckBox4);
	var CheckBox5 = new CheckBox({
		caption: 'CheckBox',
		checked: 0
	});
	CheckBox5.place(161,56,'73','21');
	this.ctl.add(CheckBox5);
	var RadioButton6 = new RadioButton({
		name: 'group',
		caption: 'Radio',
		checked: 0
	});
	RadioButton6.place(56,84,'73','21');
	this.ctl.add(RadioButton6);
	var Edit7 = new Edit({
		text: 'text',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit7.place(161,112,'50','21');
	this.ctl.add(Edit7);
	var Memo8 = new Memo({
		text: 'text'
	});
	Memo8.place(56,168,'78','51');
	this.ctl.add(Memo8);
	var Memo9 = new Memo({
		text: 'text'
	});
	Memo9.place(161,168,'78','51');
	this.ctl.add(Memo9);
	TrackBar10 = new TrackBar({
		min: 0,
		max: 10,
		step: 1,
		position: 0
	});
	TrackBar10.place(56,140,'72','21');
	this.ctl.add(TrackBar10);
	TrackBar11 = new TrackBar({
		min: 0,
		max: 10,
		step: 1,
		position: 0
	});
	TrackBar11.place(161,140,'72','21');
	this.ctl.add(TrackBar11);
	var ListBox12 = new ListBox({});
	ListBox12.setText('Item 1\nItem 2');
	ListBox12.place(56,231,'78','51');
	this.ctl.add(ListBox12);
	var ListBox13 = new ListBox({});
	ListBox13.setText('Item 1\nItem 2');
	ListBox13.place(161,231,'78','51');
	this.ctl.add(ListBox13);
	var RadioButton14 = new RadioButton({
		name: 'group',
		caption: 'Radio',
		checked: 0
	});
	RadioButton14.place(161,84,'73','21');
	this.ctl.add(RadioButton14);
	var Edit15 = new Edit({
		text: 'text',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit15.place(56,112,'50','21');
	this.ctl.add(Edit15);
	var ComboBox16 = new ComboBox({});
	ComboBox16.setText('Item 1\nItem 2');
	ComboBox16.place(56,294,'78','20');
	this.ctl.add(ComboBox16);
	var ComboBox17 = new ComboBox({});
	ComboBox17.setText('Item 1\nItem 2');
	ComboBox17.place(161,294,'78','20');
	this.ctl.add(ComboBox17);
	var Switcher18 = new UISwitcher({
		on: 0
	});
	Switcher18.place(77,322,'40','14');
	this.ctl.add(Switcher18);
	var Switcher19 = new UISwitcher({
		on: 0
	});
	Switcher19.place(182,322,'40','14');
	this.ctl.add(Switcher19);
	
	// Init section ------------------------------------
	Button3.setDisabled(true);
	CheckBox5.setDisabled(true);
	Edit7.setDisabled(true);
	Memo9.setDisabled(true);
	TrackBar11.setDisabled(true);
	ListBox13.setDisabled(true);
	RadioButton14.setDisabled(true);
	ComboBox17.setDisabled(true);
	Switcher19.setDisabled(true);
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
