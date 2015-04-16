(function init(){


    var airports = [];       // stores the airports.csv data
    var map;            // sotres the map data from datamaps
    var wlSample = [];       // stores the wildlife data
    var airportIDs = [];// stores the airportIDs
    var top5 = [];


    /*
    * Reads in the wildLife data and stores it in wlSample.
    * editAirportID edit the airport IDs
    * (remove the 'K' from the airport IDs to match iatacode from airportts.csv)
    */
    function fetchWildLifeDataSample() {
        d3.csv('data/wildlife.csv', function(data) {
            wlSample = data.map(function(d) {
                return d;
            });
            function editAirportID(data, index, array, fieldname, replace, value, mode) {
                var newObj = data;
                if (newObj[fieldname] == replace) {
                    newObj[fieldname] = value;
                    if(mode != 0) {
                        console.log("fixed index : ", index);
                    }
                }
                return newObj;
            }
            var edited = data.map(function(d, index, array) {
                s1 = d.AIRPORT_ID;
                s2 = s1.substring(1, 4);
                t2= editAirportID(d, index, array, "AIRPORT_ID", s1, s2, 0);
                return t2;
            });
        });

    }

    /*
    * Read in the airports.csv data and stores it to airports variable.
    * Enables the search bar. => $('#dep').prop('disabled', false)
    */
    function fetchAirportsData(){
        d3.csv('data/airports.csv', function(data){
            airports = data.map(function(d){
                $('#dep').prop('disabled', false);
                return {
                    iataCode: d.iata_code,
                    name: d.name,
                    city: d.municipality,
                    latitude: d.latitude_deg,
                    longitude: d.longitude_deg
                };
            });
            initializeInput();
        });
    }

    function drawCharts(data){
        d3.selectAll('.hidden').classed('hidden', false);

        var crfl = crossfilter(data); // create crossfilter instance

        // create dimensions
        var spcsDim = crfl.dimension(function(d) { return d. SPECIES; });
        var monthDim = crfl.dimension(function(d) { return d.INCIDENT_MONTH; });
        var yearDim = crfl.dimension(function(d) { return d.INCIDENT_YEAR; });

        // define data groups
        var all = crfl.groupAll();
        var numIncidentsBySpecies = spcsDim.group();
        var numIncidentsByMonth = monthDim.group();
        var numIncidentsByYear = yearDim.group();

        var maxYear = yearDim.bottom(1)[0]["INCIDENT_YEAR"];
        var minYear = yearDim.top(1)[0]["INCIDENT_YEAR"];
        var maxMonth = monthDim.bottom(1)[0]["INCIDENT_MONTH"];
        var minMonth = monthDim.top(1)[0]["INCIDENT_MONTH"];

        var speciesChart = dc.barChart('#species-chart');
        var yearChart = dc.barChart('#year-chart');
        var monthlyChart = dc.barChart('#month-chart');

        // adds chart to svg
        speciesChart
            .width(1000)
            .height(300)
            .margins({top: 10, right: 50, bottom: 30, left: 50})
            .dimension(spcsDim)
            .group(numIncidentsBySpecies)
            .transitionDuration(500)
            .x(d3.scale.ordinal().domain(spcsDim))
            .xUnits(dc.units.ordinal)
            .elasticY(true)
            .ordinalColors(['#E1B74D'])
            .renderHorizontalGridLines(true)
            .yAxisLabel("Frequency")
            .yAxis().ticks(10);


        yearChart
            .width(900)
            .height(300)
            .margins({top: 10, right: 50, bottom: 30, left: 50})
            .dimension(yearDim)
            .group(numIncidentsByYear)
            .transitionDuration(500)
            .x(d3.time.scale().domain([maxYear, minYear]))
            .elasticY(true)
            .ordinalColors(['#E1B74D'])
            .renderHorizontalGridLines(true)
            .xAxisLabel("Year")
            .yAxis().ticks(6);

        monthlyChart
            .width(900)
            .height(250)
            .margins({top: 10, right: 50, bottom: 30, left: 50})
            .dimension(monthDim)
            .group(numIncidentsByMonth)
            .transitionDuration(500)
            .x(d3.time.scale().domain([1, 12]))
            .elasticY(true)
            .ordinalColors(['#E1B74D'])
            .renderHorizontalGridLines(true)
            .xAxisLabel("Month")
            .yAxis().ticks(6);
        dc.renderAll();


    }

    /*
    * Draws a circle to represent the airport at the appropriate coordinates.
    * Sets the circle size and color(fill).
    * Shows the details on demand on hovering over the airport(circle).
    */
    function drawAirport(originator){
        var paths = [];
        var bubbles = [];
        // console.log(airports);
            var path = {
                origin: {
                    latitude: originator.latitude,
                    longitude: originator.longitude
                },
            };
            paths.push(path);

        originator.radius = 20;
        originator.fillKey = 'origin';

        //if (strikes < top 5th strikes)
        //  radius = 10;
        // else
        //    radius = sqrt(strikes);

        bubbles.push(originator);
        //console.log(bubbles);

        map.bubbles(bubbles, {
            popupTemplate: function(geo, data) {
                var total = getTotalCostsByAirport(data.iataCode).formatMoney(2,',','.');
                var filter = filterAirports(data.iataCode);
                var html = '<div class="hover-info">'
                    + "Airport Code: " + data.iataCode + '<br>'
                    + "Airport Name: " + data.name + '<br>'
                    + "City: " + data.city + '<br>';
                    if (filter != null) {
                        html += "Total Number of Incidents: " + filter.length + '<br>';
                    }
                    if (total != null) {
                        html += "Total Costs of Repairs: $" + total + '</div>';
                    } else {
                        html += '</div>';
                    }
                return html;
            }
        });
    }

    /*
    * Formats a number to a currency format.
    */
    Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator) {
    var n = this,
        decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
        decSeparator = decSeparator == undefined ? "." : decSeparator,
        thouSeparator = thouSeparator == undefined ? "," : thouSeparator,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;
        return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
    };

    /*
    * Store the top 10 airports (strikes number) in arr[]
    * Draw each airport in arr[]
    */
    // function getTop5Airports() {
    //     var arr = [];
    //     var tops;
    //     var tmp = {}, tops = [];
    //     var sample = wlSample.map(function(d, index, array) {
    //         airportIDs.push(d.AIRPORT_ID);
    //     });
    //     //console.log(sample);
    //     // Create object with count of occurances of each array element
    //     airportIDs.forEach(function(item) {
    //         tmp[item] = tmp[item] ? tmp[item]+1 : 1;
    //     });

    //     // Create an array of the sorted object properties
    //     tops = Object.keys(tmp).sort(function(a, b) { return tmp[a] - tmp[b] });

    //     // Return last n elements in reverse order
    //     arr = (tops.slice(-(5)).reverse());
    //     // console.log(arr);

    //     arr.forEach(function(d) {
    //         top5.push(filterAirportsCSV(d));
    //     });
    //     //console.log(top5);

    //     return top5;
    // }

    /*
    * Filter airports by airport ID
    * if aiport ID matches from WL and airports data sets
    */
    function filterAirports(airport_id) {
        var sample =  wlSample.filter(function(d) {
            return d.AIRPORT_ID === airport_id;
        });
        return sample;
    }

    // function getSpeciesByAirport(airport_id) {
    //     var sample = filterAirports(airport_id);
    //     var spcs = sample.map(function(d, index, array) {
    //         return d.SPECIES;
    //     });
    //     spcs.sort();
    //     // console.log(spcs);
    //     return spcs;
    // }

    // function getSpeciesFreqByAirport(airport_id, species) {
    //     var frequency = 0;
    //     var spcs = getSpeciesByAirport(airport_id);
    //     spcs.forEach(function(d) {
    //         if (d == species) {
    //             frequency++;
    //         }
    //     });
    //     return frequency;
    // }


    /*
    * Gets the airport IDs and stores it in airportIDs[].
    */
    // function getAirportID() {
    //     var sample = wlSample.map(function(d, index, array) {
    //         airportIDs.push(d.AIRPORT_ID);
    //     });
    // }

    /*
    * Gets the total costs of repairs for all struck flights out of airport_id.
    */
    function getTotalCostsByAirport(airport_id) {
        var total = 0;
        var sample = filterAirports(airport_id);
        var arr = [];
        var cost = sample.map(function(d, index, array) {
            var c = d.COST_REPAIRS;
            arr.push(+c);
        });
        if (arr.length > 0) {
            total = arr.reduce(function(a, b) {
                return a + b;
            });
        }
        return total;
    }


    /*
    *
    *
    */
    function onAirportChanged(evt, selected) {
        var sample = filterAirports(selected.iataCode);
        // check if sample is NULL
        // if NUll print error message
        drawCharts(sample);
        drawAirport(selected);
    }

    function initializeInput(){
       var engine = new Bloodhound({
            name: 'airports',
            local: airports,
            limit: 10,
            datumTokenizer: function(d) {
                var keywords = [d.name, d.iataCode, d.city].join(' ');
                return Bloodhound.tokenizers.whitespace(keywords);
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace
        });

        engine.initialize();

        $('#dep').typeahead(null, {
            name: 'airports',
            displayKey: 'name',
            source: engine.ttAdapter()
        })
        .on('typeahead:selected', onAirportChanged);
    }

    function initializeMap(){
        map = new Datamap({
            element: document.getElementById('map'),
            scope: 'usa',
            fills: {
                origin: '#AA2519',
                defaultFill: '#E9D3A1'
            },
            geographyConfig: {
                popupOnHover: true,
                highlightOnHover: true
            },
            setProjection: function(element, options) {
                var projection = d3.geo.albersUsa()
                        .scale(element.offsetWidth)
                        .translate([element.offsetWidth / 2.5, element.offsetHeight / 2.3]);

                var path = d3.geo.path().projection(projection);
                return {
                    path: path,
                    projection: projection
                };
            }
        });
        map.labels();
    }

    fetchAirportsData();
    fetchWildLifeDataSample();
    initializeMap();

}());
