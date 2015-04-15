(function init(){


    var airports;       // stores the airports.csv data
    var map;            // sotres the map data from datamaps
    var wlSample;       // stores the wildlife data
    var airportIDs = [];// stores the airportIDs


    /*
    * Reads in the wildLife data and stores it in wlSample.
    * editAirportID edit the airport IDs
    * (remove the 'K' from the airport IDs to match iatacode from airportts.csv)
    */
    function fetchWildLifeDataSample() {
        d3.csv('data/wildlife.csv', function(data) {
            wlSample = data;
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

    /*
    * Draws a circle to represent the airport at the appropriate coordinates.
    * Sets the circle size and color(fill).
    * Shows the details on demand on hovering over the airport(circle).
    */
    function drawAirport(originator){
        var paths = [];
        var bubbles = [];

            var path = {
                origin: {
                    latitude: originator.latitude,
                    longitude: originator.longitude
                },
            };
            paths.push(path);

        originator.radius = 20;
        originator.fillKey = 'origin';

        bubbles.push(originator);

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
    // function getTop10Airports() {
    //     var arr;
    //     var tmp = {}, tops = [];
    //     var sample = wlSample.map(function(d, index, array) {
    //         airportIDs.push(d.AIRPORT_ID);
    //     });
    //     // Create object with count of occurances of each array element
    //     airportIDs.forEach(function(item) {
    //         tmp[item] = tmp[item] ? tmp[item]+1 : 1;
    //     });

    //     // Create an array of the sorted object properties
    //     tops = Object.keys(tmp).sort(function(a, b) { return tmp[a] - tmp[b] });

    //     // Return last n elements in reverse order
    //     arr = (tops.slice(-(10)).reverse());
    //     return arr;
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

    // function onStart(evt, selected) {
    //     getTop10Airports();
    // }

    /*
    *
    *
    */
    function onAirportChanged(evt, selected) {
        drawAirport(selected);
        //filterAirports(selected.iataCode);
        getTotalCostsByAirport(selected.iataCode);
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
            //Controls the zoom and pan.
            //Start Here
            done: function(datamap) {
           datamap.svg.call(d3.behavior.zoom().on("zoom", redraw));

           function redraw() {
                datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }
            },
            // End Here
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
        map.legend();
    }

    fetchAirportsData();
    fetchWildLifeDataSample();
    initializeMap();
    // onStart();

}());
