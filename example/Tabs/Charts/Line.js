function hiLine() {
	// Global vars ------------------------------------
	var chartData5 = null;
	var res8 = 0;
	var array9 = [];
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Line chart demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '603',
		height: '327',
		modal: true,
		popup: true,
		showcaption: true,
		showborder: true
	});
	this.ctl.layout = new FixLayout(this.ctl);
	
	var Button2 = new Button({
		caption: 'Draw',
		url: ''
	});
	Button2.place(14,14,'45','21');
	this.ctl.add(Button2);
	var ChartLine11 = new GoogleChart({
		chart: "LineChart"
	});
	ChartLine11.place(14,49,'573','237');
	this.ctl.add(ChartLine11);
	
	// Init section ------------------------------------
	Math.point = function(x, y){ return {x: x, y: y}; };
	
	function hub3(data3) {
		chartData5.addColumn('number','Angle');
		chartData5.addColumn('number','Value');
		for(var i7 = 0; i7 < 361; i7 += 5) {
			res8 = Math.round(Math.sin(i7/180*Math.PI)*1000)/1000;
			array9 = [i7,res8];
			chartData5.addRow(array9);
		}
		ChartLine11.draw(chartData5);
	}
	Button2.addListener('click', function (event) {
		hub3();
	});
	$.appendScript('https://www.google.com/jsapi', function() {
		window.google.load("visualization", "1", {packages:["corechart", "gauge"], callback : function(){ 
chartData5 = new window.google.visualization.DataTable();
		} });
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
