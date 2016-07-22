function hiFileRead() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'File reader demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '405',
		height: '300',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Label2 = new Label({
		caption: 'Drop files here',
		halign: 0,
		valign: 1,
		theme: ''
	});
	Label2.place(168,21,'99','42');
	this.ctl.add(Label2);
	var DropBox3 = new DropBox({});
	var Memo5 = new Memo({
		text: ''
	});
	Memo5.place(28,84,'351','170');
	this.ctl.add(Memo5);
	DropBox3.place(28,14,'344','49');
	this.ctl.add(DropBox3);
	
	// Init section ------------------------------------
	function readFileAs4(e) {
		Memo5.text = e.target.result;
	}
	DropBox3.addListener('drop', function (event) {
		var reader = new FileReader();
		reader.onload = readFileAs4;
		reader.readAsText(event);
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
