function hiRegExpSearch() {
	// Global vars ------------------------------------
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Regexp search demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '400',
		height: '263',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Button3 = new Button({
		caption: 'Search',
		url: ''
	});
	Button3.place(7,14,'59','21');
	this.ctl.add(Button3);
	var ListBox5 = new ListBox({});
	ListBox5.place(77,49,'302','170');
	this.ctl.add(ListBox5);
	var Edit6 = new Edit({
		text: 'test Hello 567 test',
		placeHolder: '',
		password: 0,
		pattern: ''
	});
	Edit6.place(77,14,'302','21');
	this.ctl.add(Edit6);
	
	// Init section ------------------------------------
	function hub4(data4) {
		ListBox5.setText(data4);
		var reg = new RegExp('test (.*) ([0-9]+) test', "");
		var arr = reg.exec(Edit6.text);
		if(arr) {
			var result = [];
			for(var i = 1; i < arr.length; i++) {
				result.push(arr[i]);
			}
			var arr7 = result;
			for(var i7 in arr7) {
				ListBox5.add(arr7[i7]);
			}
		}
		else {
			ListBox5.add();
		}
	}
	Button3.addListener('click', function (event) {
		hub4();
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
