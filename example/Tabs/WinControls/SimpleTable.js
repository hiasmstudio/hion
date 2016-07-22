function hiSimpleTable() {
	// Global vars ------------------------------------
	var arrSplit5 = 0;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Table demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '387',
		height: '302',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var SimpleTable2 = new UISimpleTable({
		columns: [{"title":"Column 1","width":"90px","align":"center"},{"title":"Column 2"},{"title":"Check","width":"40px","type":"checkbox","align":"center"},{"title":"Icon","width":"40px","type":"image","align":"center"}],
		lineheight: 0,
		showgrid: 1
	});
	var Label3 = new Label({
		caption: '-1',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label3.place(168,35,'43','21');
	this.ctl.add(Label3);
	SimpleTable2.place(14,63,'358','205');
	this.ctl.add(SimpleTable2);
	var Button4 = new Button({
		caption: 'Add',
		url: ''
	});
	Button4.place(14,7,'48','20');
	this.ctl.add(Button4);
	var Edit6 = new Edit({
		text: 'Item 1,Item 2,0',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit6.place(98,7,'274','21');
	this.ctl.add(Edit6);
	var Button8 = new Button({
		caption: 'Clear',
		url: ''
	});
	Button8.place(14,35,'48','20');
	this.ctl.add(Button8);
	var Label9 = new Label({
		caption: 'Select row:',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label9.place(98,35,'64','21');
	this.ctl.add(Label9);
	
	// Init section ------------------------------------
	SimpleTable2.addListener('rowselect', function (item, index) {
		Label3.caption = (index).toString();
	});
	SimpleTable2.tabIndex = '1';
	Button4.addListener('click', function (event) {
		arrSplit5 = Edit6.text.split(',');
		arrSplit5.push('img/sha.png');
		SimpleTable2.addRow(arrSplit5);
	});
	Button8.addListener('click', function (event) {
		SimpleTable2.clear();
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
