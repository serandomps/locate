var serand = require('serand');
var utils = require('utils');
var form = require('form');
var dust = require('dust')();
var locate = require('./locate');

dust.loadSource(dust.compile(require('./template'), 'locate'));

var googleGelocate = 'https://www.googleapis.com/geolocation/v1/geolocate?key=';

utils.configs('boot', function (err, config) {
    if (err) {
        return console.error(err)
    }
    googleGelocate += config.googleKey;
});

var select = function (el, val) {
    el = el.children('select');
    return val ? el.val(val) : el;
};

var configs = {
    name: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    line1: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            if (!value) {
                return done(null, 'Please enter the number, street etc. of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    line2: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    city: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            if (!value) {
                return done(null, 'Please enter the city of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    postal: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            if (!value) {
                return done(null, 'Please enter the postal code of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    district: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            if (!value) {
                return done(null, 'Please enter the district of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    province: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            if (!value) {
                return done(null, 'Please enter the province of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    state: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            /*if (!value) {
                return done(null, 'Please enter the state of your location');
            }*/
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    country: {
        find: function (context, source, done) {
            var value = $('input', source).val();
            if (!value) {
                return done(null, 'Please select the country of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            done();
        }
    }
};

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

var locationUpdated = function (ctx, elem, location) {
    console.log(location);
    ctx.current = location;
    $('.locate-name', elem).find('input').val(location.name);
    $('.locate-line1', elem).find('input').val(location.line1);
    $('.locate-line2', elem).find('input').val(location.line2);
    $('.locate-postal', elem).find('input').val(location.postal);
    $('.locate-city', elem).find('input').val(location.city);
    var el = $('.locate-district', elem);
    if (location.district) {
        el.removeClass('hidden').find('input').val(location.district);
    } else {
        el.addClass('hidden');
    }
    el = $('.locate-province', elem);
    if (location.province) {
        el.removeClass('hidden').find('input').val(location.province);
    } else {
        el.addClass('hidden');
    }
    el = $('.locate-state', elem);
    if (location.state) {
        el.removeClass('hidden').find('input').val(location.state);
    } else {
        el.addClass('hidden');
    }
    $('.locate-country', elem).find('input').val(location.country);
}

var initMap = function (ctx, elem, options, done) {
    var map = new google.maps.Map($('.locate-map', elem)[0], options);
    var marker = new google.maps.Marker({
        map: map,
        position: options.center,
        draggable: true
    });
    map.addListener('click', function (e) {
        marker.setPosition(e.latLng);
    });
    var geocoder = new google.maps.Geocoder();
    var autoComplete = new google.maps.places.Autocomplete($('.locate-search', elem).find('input')[0], {});
    autoComplete.addListener('place_changed', function () {
        var place = utils.clone(autoComplete.getPlace());
        var location = locate(place);
        locationUpdated(ctx, elem, location);
        updateMap(ctx, elem, {
            zoom: 18, center: {
                lat: location.latitude,
                lng: location.longitude
            }
        }, serand.none);
    });
    ctx.map = map;
    ctx.marker = marker;
    ctx.geocoder = geocoder;
    ctx.autoComplete = autoComplete;
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

var findLocation = function (ctx, o, done) {
    ctx.geocoder.geocode(o, function (results, status) {
        if (status !== 'OK') {
            return done(status);
        }
        done(null, locate(utils.clone(results[0])));
    });
};

var showMap = function (ctx, elem, done) {
    $('.locate-add', elem).removeClass('hidden');
    findPosition(function (err, location) {
        if (err) {
            return done(err);
        }
        var center = {
            lat: location.latitude,
            lng: location.longitude
        };
        if (ctx.map) {
            return updateMap(ctx, elem, {zoom: 18, center: center}, done);
        }
        var options = {
            zoom: 18,
            center: center
        };
        initMap(ctx, elem, options, function (err) {
            if (err) {
                return done(err);
            }
            findLocation(ctx, {location: center}, function (err, location) {
                if (err) {
                    return done(err);
                }
                locationUpdated(ctx, elem, location);
                done();
            });
        });
    });
};

var updateMap = function (ctx, elem, options, done) {
    ctx.map.setCenter(options.center);
    ctx.map.setZoom(options.zoom);
    ctx.marker.setPosition(options.center);
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

module.exports = function (sandbox, data, done) {
    data = data || {};
    var loctex = {
        map: null,
        geocoder: null,
        marker: null,
        autoComplete: null,
        current: null,
        selectLocation: null
    };
    find(data, function (err, existing) {
        if (err) {
            return done(err);
        }
        dust.render('locate', {locations: existing}, function (err, out) {
            if (err) {
                return done(err);
            }
            var elem = sandbox.append(out);
            var lform = form.create(elem, configs);
            lform.render(data, function (err) {
                if (err) {
                    return done(err);
                }
                var added;
                var el = $('.locate', sandbox);
                var eventer = utils.eventer();
                loctex.selectLocation = form.selectize($('.locate-location', el).val(data.location || ''));
                var ctx = _.map(existing, function (location) {
                    return {
                        value: location.id,
                        text: address(location),
                        location: location
                    }
                });
                var locations = [{value: '+', text: 'Add Location'}];
                locations = locations.concat(ctx);
                loctex.selectLocation.addOption(locations);
                loctex.selectLocation.on('change', function (loc) {
                    console.log(loc)
                    // current = loc;
                    eventer.emit('change', loc, serand.none);
                    if (loc === '+') {
                        return showMap(loctex, el, serand.none);
                    }
                    hideMap(el);
                });
                eventer.on('destroy', function (done) {
                    el.remove();
                    done();
                });
                eventer.on('find', function (done) {
                    var value = el.children('select').val();
                    if (!value || value === '+') {
                        // TODO: return null here and error can be moved to caller
                        return done(null, 'Please select the location of your vehicle');
                    }
                    if (value === '-') {
                        return lform.find(function (err, errors, data) {
                            console.log('lform.find');
                            console.log(err);
                            console.log(errors);
                            console.log(data);
                            done(err, errors, data);
                        });
                    }
                    done(null, null, value);
                });
                eventer.on('update', function (error, value, done) {
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
                    var locations = [{value: '-', text: address(loctex.current), location: loctex.current}];
                    locations.push({value: '+', text: 'Edit Location'});
                    locations = locations.concat(ctx);
                    console.log(locations);
                    loctex.selectLocation.destroy();
                    loctex.selectLocation = form.selectize($('.locate-location', el));
                    loctex.selectLocation.addOption(locations);
                    loctex.selectLocation.addItem('-');
                    loctex.selectLocation.refreshOptions(false);
                    loctex.selectLocation.on('change', function (loc) {
                        console.log(loc)
                        // current = loc;
                        eventer.emit('change', loc, serand.none);
                        if (loc === '+') {
                            return showMap(loctex, el, serand.none);
                        }
                        hideMap(el);
                    });
                    done();
                });
                done(null, eventer);
            });
        });
    });
};
