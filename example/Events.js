function hiEvents() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Control events demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '330',
		height: '300',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Label2 = new Label({
		caption: 'Click here',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label2.place(112,7,'113','14');
	this.ctl.add(Label2);
	var Label3 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label3.place(231,7,'78','14');
	this.ctl.add(Label3);
	var Label4 = new Label({
		caption: 'onClick',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label4.place(7,7,'99','14');
	this.ctl.add(Label4);
	var Label6 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label6.place(231,28,'78','14');
	this.ctl.add(Label6);
	var Label7 = new Label({
		caption: 'onDblClick',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label7.place(7,28,'99','14');
	this.ctl.add(Label7);
	var Label11 = new Label({
		caption: 'Double click here',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label11.place(112,28,'113','14');
	this.ctl.add(Label11);
	var Label12 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label12.place(231,70,'78','14');
	this.ctl.add(Label12);
	var Label13 = new Label({
		caption: 'onMouseWheel',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label13.place(7,70,'99','14');
	this.ctl.add(Label13);
	var Label15 = new Label({
		caption: 'Wheel mouse here',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label15.place(112,70,'113','14');
	this.ctl.add(Label15);
	var Label17 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label17.place(231,49,'78','14');
	this.ctl.add(Label17);
	var Label18 = new Label({
		caption: 'onMouseOver/Out',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label18.place(7,49,'99','14');
	this.ctl.add(Label18);
	var Label21 = new Label({
		caption: 'Mouse over/out',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label21.place(112,49,'113','14');
	this.ctl.add(Label21);
	var Label23 = new Label({
		caption: '---',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label23.place(231,91,'78','14');
	this.ctl.add(Label23);
	var Label24 = new Label({
		caption: 'onMouseDown',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label24.place(7,91,'99','14');
	this.ctl.add(Label24);
	var Label26 = new Label({
		caption: 'Wheel down here',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label26.place(112,91,'113','14');
	this.ctl.add(Label26);
	
	// Init section ------------------------------------
	Label11.addListener('dblclick', function (event) {
		Label6.caption = 'clicked!!!';
	});
	Label15.addListener('wheel', function (event) {
		var args15 = [event.layerX, event.layerY, event.wheelDelta, (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0)];
		Label12.caption = args15[2];
	});
	Label21.addListener('mouseover', function (event) {
		Label17.caption = 'out!!!';
	});
	Label21.addListener('mouseout', function (event) {
		Label17.caption = 'over!!!';
	});
	Label26.addListener('mousedown', function (event) {
		var args26 = [event.layerX, event.layerY, event.button, (event.shiftKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.altKey ? 0x4 : 0)];
		Label23.caption = args26;
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
