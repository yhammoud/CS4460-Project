(function init(){


    var airports;
    var map;
    var wlSample;

    function fetchWildLifeDataSample() {
        d3.csv('data/wildlifeSample.csv', function(data) {
            wlSample = data;
        });
    }

    // function editAirportID(data, index, array, fieldname, replace, value, mode) {
    //     var newObj = data;
    //     if (newObj[fieldname] == replace) {
    //         newObj[fieldname] = value;
    //         if(mode != 0) {
    //             console.log("fixed index : ", index);
    //         }
    //     }
    //     return newObj;
    // }

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

    // draws circles for airports
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
                var html = '<div class="hover-info">' + data.iataCode + ' - ' + data.name;
                    html += '</div>';
                return html;
            }
        });
    }


    function filterAirports(airport_id) {
        var sample =  wlSample.filter(function(d) {
            return d.AIRPORT_ID === airport_id;
        });
        return sample;
    }

    function onAirportChanged(evt, selected) {
        drawAirport(selected);
        filterAirports(selected.iataCode);
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
                        .translate([element.offsetWidth / 2.5, element.offsetHeight / 2]);

                var path = d3.geo.path().projection(projection);
                return {
                    path: path,
                    projection: projection
                };
            }
        });
    }

    fetchAirportsData();
    fetchWildLifeDataSample();
    initializeMap();
    // var edited = wlSample.map(function(d, index, array) {
    //     return editAirportID(d, index, array, "AIRPORT_ID", "KATL", "ATL", 1);
    // });


}());
