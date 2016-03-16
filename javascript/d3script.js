window.onload = function(){

var model = {
    init: function() {
        this.hexColours ={
            "Drinking":["#373f90","#5c5eb5","#8585b9","#b1b2d0"],
            "Clothes":["#3d88be","#499ec5","#79b3cb","#a9cddd"],
            "House":["#c31173","#c8418d","#d776a1","#dbaac7"],
            "Electronics":["#117b3d","#368c5b","#60a07e","#8eb99e"],
            "Recreation":["#c31b27","#c64750","#cf7577","#d9adae"]
        };
        
        this.countries ={"br":"Brazil","ca":"Canada","ch":"Switzerland","cn":"China","de":"Germany","dk":"Denmark","eg":"Egypt","fi":"Finland","gb":"UK","in":"India","pe":"Peru","th":"Thailand","us":"USA","se":"Sweden","no":"Norway","pk":"Pakistan","co":"Colombia","ng":"Nigeria","id":"Indonesia","au":"Australia"}
        
        this.categories = ['Recreation','House','Clothes','Drinking','Electronics'];
   
        this.currentCategory = null;

        this.getData();
    },

    getData: function() {
        d3.json("../data/world_countries.json",function(jsonData){
            d3.tsv("../data/Data.tsv",model.assesorConvertToInt,function(data){
                return function() {
                    model.map_data = jsonData;
                    model.data = data;
                    model.aggregateData();
                    model.allLoaded();
                }();
            });
        });
    },

    getDataTsv: function() {
    },

    aggregateData: function() {
        //Aggregate data
        for (var i = 0; i < this.data.length; i++) {
            for (var j = 0; j < this.map_data.features.length; j++) {
                if (this.data[i]['Country'] == this.map_data.features[j].properties.name) {
                    this.map_data.features[j].Values = {};
                    this.map_data.features[j].Values['Recreation'] = this.data[i]['Recreation'];
                    this.map_data.features[j].Values['Drinking'] = this.data[i]['Drinking'];
                    this.map_data.features[j].Values['Electronics'] = this.data[i]['Electronics'];
                    this.map_data.features[j].Values['Clothes'] = this.data[i]['Clothes'];
                    this.map_data.features[j].Values['House'] = this.data[i]['House'];
                    break;
                }
            }
        }
    },

    assesorConvertToInt: function(d) {

        var countriesDictionary ={"br":"Brazil","ca":"Canada","ch":"Switzerland","cn":"China","de":"Germany",
                                    "dk":"Denmark","eg":"Egypt","fi":"Finland","gb":"UK","in":"India","pe":"Peru",
                                    "th":"Thailand","us":"USA","se":"Sweden","no":"Norway","pk":"Pakistan",
                                    "co":"Colombia","ng":"Nigeria","id":"Indonesia","au":"Australia"}

        d['Recreation'] = +d['Recreation'];
        d['House'] = +d['House'];
        d['Clothes'] = +d['Clothes'];
        d['Drinking'] = +d['Drinking'];
        d['Electronics'] = +d['Electronics'];

        d['Country'] = countriesDictionary[d['Country']];
        return d;
    },

    allLoaded: function() {
        controller.start()
    }
}



var controller = {
    init: function() {
        model.init()
    },

    start: function() {
        view.init()
    },

    getMapData: function() {
        return model.map_data;
    },

    getData: function() {
        return model.data;
    },

    getCategories: function() {
        return model.categories;
    },

    setCurrentCategory: function(category) {
        model.currentCategory = category;
    },

    getCurrentCategory: function(category) {
        return model.currentCategory;
    }
}

var view = {
    init: function() {
        this.container = d3.select(".container");

        this.margin = {top: 10, right: 10, bottom: 10, left: 10},

        this.chartWidth = Math.floor(parseInt(this.container.style("width"),10)*0.3) - this.margin.right - this.margin.left;
        this.chartHeight = parseInt(this.container.style("height"),10) - this.margin.top - this.margin.bottom;

        this.mapWidth = Math.floor(parseInt(this.container.style("width"),10)*0.7) - this.margin.right - this.margin.left;
        this.mapHeight = parseInt(this.container.style("height"),10) - this.margin.top - this.margin.bottom;

        var map_data = controller.getMapData();
        var data = controller.getData();

        this.xChartScale = d3.scale.linear()
                        .range([0,this.chartWidth*0.8]);

        this.yChartScale = d3.scale.ordinal()
                        .domain(d3.range(data.length))
                        .rangeRoundBands([0, this.chartHeight*0.95],0.2);

        this.xAxis  = d3.svg.axis();

        //Render empty map and return countries
        this.countries = this.render_emptyMap(map_data);

        //Render empty char and return chart container
        this.chart = this.render_emptyChart(data);

        this.buttons = this.render_buttons();
    },

    keyFunc: function(d) { return d["Country"]; },

    render_emptyMap: function(map_data) {

        //Map
        var map = this.container
            .append('svg')
            .attr("class","map")
            .attr({
                width: this.mapWidth,
                height: this.mapHeight
            });

        var center = d3.geo.centroid(map_data);
        var scale  = 50;
        var offset = [this.mapWidth/2, this.mapHeight/2];
        var projection = d3.geo.mercator()
                        .scale(scale)
                        .center(center)
                        .translate(offset);

        // create the path
        var path = d3.geo.path().projection(projection);

        // using the path determine the bounds of the current map and use 
        // these to determine better values for the scale and translation
        var bounds  = path.bounds(map_data);
        var hscale  = scale*this.mapWidth  / (bounds[1][0] - bounds[0][0]);
        var vscale  = scale*this.mapHeight / (bounds[1][1] - bounds[0][1]);
        var scale   = (hscale < vscale) ? hscale : vscale;
        var offset  = [this.mapWidth - (bounds[0][0] + bounds[1][0])/2,
                        this.mapHeight - (bounds[0][1] + bounds[1][1])/2];

        // new projection
        var projection = d3.geo.mercator()
                        .center(center)
                        .scale(scale)
                        .translate(offset);

        var path = path.projection(projection);

        var countries = map.selectAll('path')
                            .data(map_data.features)
                            .enter()
                            .append('path')
                            .attr("d", path)          
                            .attr('fill',"#ccc");
        //End of map drawing

        return countries;
    },

    render_emptyChart: function(data) {

        var chartBox = this.container.append('svg')
                                .attr("class","chartBox")
                                .attr({
                                    width: this.chartWidth,
                                    height: this.chartHeight
                                })
                                .attr("transform","translate(" + this.mapWidth + ",0)");

        var chart = chartBox.append("g")
                        .selectAll("g")
                        .data(data.sort(function(a,b){return a['Country'].charCodeAt(0)-b['Country'].charCodeAt(0); }),this.keyFunc)
                        .enter()
                        .append("g")
                        .classed("datagroup",true);

        var maxTextLength = d3.max(data,function(d){ return d['Country'].length;});
        var fontSize = this.chartWidth * 0.2 / maxTextLength * 1.5;

        // append invisible rects
        chart.append("rect")
            .attr({
                x: this.chartWidth*0.2,
                y: function(d,i) {return view.yChartScale(i);}
            });

        chart.append('text')
            .classed("label",true);

        // place country labels
        chart.append("text")
            .attr({
                y: function(d,i) {return view.yChartScale(i)+view.yChartScale.rangeBand()/2;},
                "dominant-baseline": "middle"
            })
            .style('font-size',fontSize + "px")
            .text(function(d){return d['Country']; });

        // place axis
        d3.select(".chartBox")
            .append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + this.chartWidth * 0.2 + "," + this.chartHeight*0.95 + ")");

        return chart;
    },

    colorInCountries: function(category) {

        var data = controller.getData();

        //Define quantize scale to sort data values into buckets of color
        var color = d3.scale.quantize()
                            .range(model.hexColours[category].slice().reverse())
                            .domain([
                                d3.min(data, function(d) { return d[category]; }), 
                                d3.max(data, function(d) { return d[category]; })
                            ]);
                            
        this.countries
            .transition()
            .attr('fill',function(d) {
            if (d.Values) {
                return color(d.Values[category]);
            }
            else {
                return "#ccc";
            }
            });
    },

    fillInChart: function(category) {
        var data = controller.getData();
        // data.sort(function(a,b){ return b[category]-a[category];});

        this.xChartScale.domain([0,d3.max(data,function(d){return d[category];})]);

        this.xAxis.scale(this.xChartScale)
            .innerTickSize(-this.chartHeight*0.95);

        var updatedChart = this.chart.data(data,this.keyFunc);

        var rects = updatedChart.select("rect")
            .attr({
                width: function(d,i) { return view.xChartScale(d[category]);},
                height: this.yChartScale.rangeBand(),
                fill: model.hexColours[category][0]
            });

        var labels = updatedChart.select("text.label")
            .text(function(d){ return d[category]; })
            .attr({
                x: function(d) { 
                    var barWidth = view.xChartScale(d[category]);
                    if (barWidth<30) {
                        return view.chartWidth * 0.2 + barWidth + 5;
                    }
                    else {
                        return view.chartWidth * 0.2 + barWidth - 5;
                    }
                },
                y: function(d,i) { return view.yChartScale(i)+view.yChartScale.rangeBand()*1.1/2;},
                "dominant-baseline": "middle",
                fill: function(d) { 
                    var barWidth = view.xChartScale(d[category]);
                    if (barWidth<25) {
                        return "#ccc";
                    }
                    else {
                        return "white";
                    }
                }
            })
            .style({
                'font-size':"8px",
                'text-anchor': function(d) { 
                    var barWidth = view.xChartScale(d[category]);
                    if (barWidth<25) {
                        return "start";
                    }
                    else {
                        return "end";
                    }
                },
                'visibility':"hidden"
                });


            updatedChart.on('mouseover',function(){
                d3.select(this).select("rect").attr("fill",model.hexColours[category][1])
                d3.select(this).select("text.label").style("visibility","visible");
            })
            .on('mouseout',function(){
                d3.select(this).select("rect").attr("fill",model.hexColours[category][0]);
                d3.select(this).select("text.label").style("visibility","hidden");
            });

        // updatedChart.selectAll("text")
        //     .text(function(d){return d['Country']; });

        d3.select(".axis") 
            .call(this.xAxis);  // <-E)  
    },

    render_buttons: function() {

        var categories = controller.getCategories();

        d3.select(".buttons")
            .selectAll("div")
            .data(categories)
            .enter()
            .append("div")
            .text(function(d){return d;})
            .on('click', function(d) {
                return view.updateView;
            }());
    },

    updateView: function(d) {
        controller.setCurrentCategory(d);
        d3.selectAll(".enabled").classed("enabled",false);
        view.colorInCountries(d);
        view.fillInChart(d);
        this.setAttribute("class","enabled");
    }
}

controller.init();


d3.select(window).on("resize",function(){
    d3.selectAll("svg").remove();
    var category = controller.getCurrentCategory();
    view.init();
    if (category) {
        view.updateView(category);
    }
});

}