var serand = require('serand');
var utils = require('utils');
var form = require('form');
var dust = require('dust')();

dust.loadSource(dust.compile(require('./template'), 'locate'));

var map;

var geocoder;

var marker;

var autoComplete;

var googleGelocate = 'https://www.googleapis.com/geolocation/v1/geolocate?key=';

var current;

var selectLocation;

var selectCountry;

var selectCity;

utils.configs('boot', function (err, config) {
    if (err) {
        return console.error(err)
    }
    googleGelocate += config.googleKey;
});

var locateIp = function (done) {
    $.ajax({
        url: googleGelocate,
        type: 'POST',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify({
            considerIp: 'true'
        }),
        success: function (data) {
            done(null, {
                latitude: data.location.lat,
                longitude: data.location.lng
            });
        },
        error: function (xhr, status, err) {
            done(err);
        }
    });
};

var locate = function (o) {
    var address = {};
    var components = o.address_components;
    components.forEach(function (component) {
        component.types.forEach(function (type) {
            if (['political'].indexOf(type) !== -1) {
                return;
            }
            address[type] = component;
        });
    });
    var geometry = o.geometry;
    if (geometry) {
        address.latitude = geometry.location.lat;
        address.longitude = geometry.location.lng;
    }
    address.name = o.name;
    address.place_id = o.place_id;
    address.international_phone_number = o.international_phone_number;
    return address;
};

var located = function (o) {
    o = locate(o);
    var line1 = function (o) {
        if (o.premise) {
            return o.premise.long_name;
        }
        if (o.subpremise) {
            return o.subpremise.long_name;
        }
        if (o.room) {
            return o.room.long_name;
        }
        if (o.floor) {
            return o.floor.long_name;
        }
        if (o.post_box) {
            return o.post_box.long_name;
        }
        if (o.colloquial_area) {
            return o.colloquial_area.long_name;
        }
        if (o.street_number) {
            return o.street_number.long_name;
        }
        return null;
    };
    var line2 = function (o) {
        if (o.route) {
            return o.route.long_name;
        }
        return null;
    };
    var city = function (o) {
        if (o.sublocality) {
            return o.sublocality.long_name;
        }
        if (o.locality) {
            return o.locality.long_name;
        }
        return null;
    };
    var location = {
        name: o.name,
        line1: line1(o),
        line2: line2(o),
        city: city(o),
        postal: o.postal_code && o.postal_code.long_name,
        district: o.administrative_area_level_2 && o.administrative_area_level_2.long_name,
        province: o.administrative_area_level_1 && o.administrative_area_level_1.long_name,
        country: o.country && o.country.short_name,
        latitude: o.latitude,
        longitude: o.longitude
    };
    console.log('original');
    console.log(o);
    console.log('parsed');
    console.log(JSON.stringify(location));
    return location;
};

var locationUpdated = function (elem, location) {
    console.log(location);
    current = location;
    $('.locate-line1', elem).find('input').val(location.line1);
    $('.locate-line2', elem).find('input').val(location.line2);
    $('.locate-postal', elem).find('input').val(location.postal);
    $('.locate-name', elem).find('input').val(location.name);
    selectCity.setValue(location.city);
    selectCountry.setValue(location.country);
}

var initMap = function (elem, options, done) {
    map = new google.maps.Map($('.locate-map', elem)[0], options);
    marker = new google.maps.Marker({
        map: map,
        position: options.center,
        draggable: true
    });
    map.addListener('click', function (e) {
        marker.setPosition(e.latLng);
    });
    geocoder = new google.maps.Geocoder();
    autoComplete = new google.maps.places.Autocomplete($('.locate-search', elem).find('input')[0], {});
    autoComplete.addListener('place_changed', function () {
        var place = utils.clone(autoComplete.getPlace());
        var location = located(place);
        locationUpdated(elem, location);
        updateMap(elem, {
            zoom: 18, center: {
                lat: location.latitude,
                lng: location.longitude
            }
        }, serand.none);
    });
    done();
};

var findPosition = function (done) {
    if (!navigator.geolocation) {
        console.log('no navigator location');
        return locateIp(done);
    }
    navigator.geolocation.getCurrentPosition(function (position) {
        console.log('navigator location options: %j', position);
        done(null, position.coords);
    }, function (err) {
        console.log('navigator location error: %j', err);
        locateIp(done);
    });
};

var findLocation = function (o, done) {
    geocoder.geocode(o, function (results, status) {
        if (status !== 'OK') {
            return done(status);
        }
        done(null, located(utils.clone(results[0])));
    });
};

var showMap = function (elem, done) {
    $('.locate-add', elem).removeClass('hidden');
    findPosition(function (err, location) {
        if (err) {
            return done(err);
        }
        var center = {
            lat: location.latitude,
            lng: location.longitude
        };
        if (map) {
            return updateMap(elem, {zoom: 18, center: center}, done);
        }
        var options = {
            zoom: 18,
            center: center
        };
        initMap(elem, options, function (err) {
            if (err) {
                return done(err);
            }
            findLocation({location: center}, function (err, location) {
                if (err) {
                    return done(err);
                }
                locationUpdated(elem, location);
                done();
            });
        });
    });
};

var updateMap = function (elem, options, done) {
    map.setCenter(options.center);
    map.setZoom(options.zoom);
    marker.setPosition(options.center);
    done();
};

var hideMap = function (elem) {
    $('.locate-add', elem).addClass('hidden');
};

var find = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts://apis/v/locations'),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (e) {
            done(e);
        }
    });
};

var create = function (location, done) {
    $.ajax({
        method: 'POST',
        url: utils.resolve('accounts://apis/v/locations'),
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(location),
        success: function (data) {
            done(null, data.id);
        },
        error: function (e) {
            done(e);
        }
    });
};

module.exports = function (sandbox, options, done) {
    options = options || {};
    find(options, function (err, existing) {
        if (err) {
            return done(err);
        }
        var ctx = {
            locations: existing
        };
        dust.render('locate', ctx, function (err, out) {
            if (err) {
                return done(err);
            }
            sandbox.append(out);
            var added;
            var el = $('.locate', sandbox);
            var eventer = utils.eventer();
            selectLocation = form.selectize($('.locate-location', el).val(options.location || ''));
            var address = function (location) {
                var address = '';
                address += location.name ? location.name + ', ' : '';
                if (location.name !== location.line1) {
                    address += location.line1 ? location.line1 + ', ' : '';
                }
                if (location.name !== location.line2 && location.line1 !== location.line2) {
                    address += location.line2 ? location.line2 + ', ' : '';
                }
                address += location.city ? location.city + ', ' : '';
                if (location.city !== location.district) {
                    address += location.district ? location.district + ', ' : '';
                }
                address += location.provice ? location.province + ', ' : '';
                address += location.state ? location.state + ', ' : '';
                address += location.postal ? location.postal + ', ' : '';
                address += location.country ? location.country : '';
                return address;
            };
            var ctx = _.map(existing, function (location) {
                return {
                    value: location.id,
                    text: address(location),
                    location: location
                }
            });
            var locations = [{value: '+', text: 'Add Location'}];
            locations = locations.concat(ctx);
            selectLocation.addOption(locations);
            selectLocation.on('change', function (loc) {
                console.log(loc)
                // current = loc;
                eventer.emit('change', loc, serand.none);
                if (loc === '+') {
                    return showMap(el, serand.none);
                }
                hideMap(el);
            });
            selectCountry = form.selectize($('.locate-country', el).find('select'));
            selectCity = form.selectize($('.locate-city', el).find('select'));
            eventer.on('destroy', function (done) {
                el.remove();
                done();
            });
            eventer.on('find', function (done) {
                var value = el.children('select').val();
                if (!value || value === '+') {
                    return done(null, 'Please select the location of your vehicle');
                }
                var data;
                if (value === '-') {
                    data = selectLocation.options['-'];
                    return done(null, null, data.location);
                }
                done(null, null, value);
            });
            eventer.on('update', function (value, done) {
                done();
            });
            eventer.on('create', function (location, done) {
                console.log('creating location')
                console.log(location)
                create(location, done);
            });
            eventer.on('collapse', function (done) {
                hideMap(el);
                // how to get newly added address
                // how to handle multipe usages of locate components
                // introduce a local ctx which get passed to all methods
                // add -> select existing -> add -> next shows empty in selected
                var locations = [{value: '-', text: address(current), location: current}];
                locations.push({value: '+', text: 'Edit Location'});
                locations = locations.concat(ctx);
                console.log(locations);
                selectLocation.destroy();
                selectLocation = form.selectize($('.locate-location', el));
                selectLocation.addOption(locations);
                selectLocation.addItem('-');
                selectLocation.refreshOptions(false);
                selectLocation.on('change', function (loc) {
                    console.log(loc)
                    // current = loc;
                    eventer.emit('change', loc, serand.none);
                    if (loc === '+') {
                        return showMap(el, serand.none);
                    }
                    hideMap(el);
                });
                done();
            });
            done(null, eventer);
        });
    });
};
