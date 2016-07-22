function hiPie() {
	// Global vars ------------------------------------
	var chartData4 = null;
	
	// Widgets section ------------------------------------
	this.ctl = new Dialog({
		title: 'Pie chart demo',
		icon: '',
		destroy: true,
		resize: 0,
		width: '403',
		height: '383',
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
	Button2.place(294,14,'45','21');
	this.ctl.add(Button2);
	var ChartPie3 = new GoogleChart({
		chart: "PieChart",
		title: 'Browser popularity 2016',
		pieHole: 0,
		chartArea: {
			left: '5%',
			top: '5%',
			width: '90%',
			height: '90%'
		}
	});
	ChartPie3.place(21,42,'363','300');
	this.ctl.add(ChartPie3);
	
	// Init section ------------------------------------
	Button2.addListener('click', function (event) {
		ChartPie3.draw(chartData4);
	});
	$.appendScript('https://www.google.com/jsapi', function() {
		window.google.load("visualization", "1", {packages:["corechart", "gauge"], callback : function(){ 
chartData4 = window.google.visualization.arrayToDataTable([
  ["Browser", "Popularity"],
  ["Google Chrome", 73058866],
  ["Mobile Safari", 21038402],
  ["Android Browser", 19410635],
  ["Яндекс.Браузер", 11546258],
  ["Firefox", 8993858]
]);
		} });
	});
	
	// Main section ------------------------------------
	this.run = function() {
		this.ctl.show({noCenter: false});
	};
}

// made by hion
