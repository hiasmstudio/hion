function hiListBox() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'ListBox demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '312',
		height: '278',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var ListBox2 = new ListBox({});
	var Label3 = new Label({
		caption: '',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label3.place(147,238,'154','14');
	this.ctl.add(Label3);
	ListBox2.place(112,35,'190','198');
	this.ctl.add(ListBox2);
	var Edit4 = new Edit({
		text: 'some text',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit4.place(112,7,'190','21');
	this.ctl.add(Edit4);
	var Label5 = new Label({
		caption: 'Select:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label5.place(105,238,'36','14');
	this.ctl.add(Label5);
	var Button7 = new Button({
		caption: 'Add',
		url: ''
	});
	Button7.place(7,7,'92','21');
	this.ctl.add(Button7);
	var Button8 = new Button({
		caption: 'Clear',
		url: ''
	});
	Button8.place(7,35,'92','21');
	this.ctl.add(Button8);
	var Button9 = new Button({
		caption: 'Add 1-10',
		url: ''
	});
	Button9.place(7,63,'92','21');
	this.ctl.add(Button9);
	
	// Init section ------------------------------------
	function onselect2(item, text) {
		Label3.caption = '';
	}
	ListBox2.onselect = onselect2;
	Button7.addListener('click', function (event) {
		ListBox2.add(Edit4.text);
	});
	Button8.addListener('click', function (event) {
		ListBox2.setText();
	});
	Button9.addListener('click', function (event) {
		for(var i10 = 1; i10 < 0; i10 += 1) {
			ListBox2.add(i10);
		}
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
