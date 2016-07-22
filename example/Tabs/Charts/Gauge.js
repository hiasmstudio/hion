function hiGauge() {
	// Global vars ------------------------------------
	var chartData5 = null;
	var timerId6 = 0;
	var res7 = 0;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Gauge demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '358',
		height: '237',
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
	Button2.place(28,7,'45','21');
	this.ctl.add(Button2);
	var ChartGauge4 = new GoogleChart({
		chart: "Gauge"
	});
	ChartGauge4.place(28,42,'300','146');
	this.ctl.add(ChartGauge4);
	
	// Init section ------------------------------------
	Math.point = function(x, y){ return {x: x, y: y}; };
	
	function hub3(data3) {
		ChartGauge4.draw(chartData5);
		timerId6 = setInterval(function() {
			res7 = Math.round(Math.random()*100);
			chartData5.setValue(1,1,res7);
			ChartGauge4.draw(chartData5);
		}, 1000);
	}
	Button2.addListener('click', function (event) {
		hub3();
	});
	$.appendScript('https://www.google.com/jsapi', function() {
		window.google.load("visualization", "1", {packages:["corechart", "gauge"], callback : function(){ 
chartData5 = window.google.visualization.arrayToDataTable([
  ["col 1", "col 2"],
  ["Static", 30],
  ["Dynamic", 65]
]);
		} });
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
