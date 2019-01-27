var serand = require('serand');
var utils = require('utils');
var form = require('form');
var dust = require('dust')();
var locate = require('./locate');

dust.loadSource(dust.compile(require('./template'), 'locate'));
dust.loadSource(dust.compile(require('./select'), 'locate-select'));

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
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    line1: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
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
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done()
        }
    },
    city: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
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
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
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
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the district of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            if (!value) {
                return done();
            }
            $('input', source).val(value);
            source.removeClass('hidden');
            done()
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.district', lform.elem);
            if (value) {
                el.removeClass('hidden').find('input').val(location.district);
            } else {
                el.addClass('hidden');
            }
            done()
        }
    },
    province: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please enter the province of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            if (!value) {
                return done();
            }
            $('input', source).val(value);
            source.removeClass('hidden');
            done()
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.province', lform.elem);
            if (value) {
                el.removeClass('hidden').find('input').val(location.province);
            } else {
                el.addClass('hidden');
            }
            done()
        }
    },
    state: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            if (!value) {
                return done();
            }
            $('input', source).val(value);
            source.removeClass('hidden');
            done()
        },
        render: function (ctx, lform, data, value, done) {
            var el = $('.state', lform.elem);
            if (value) {
                el.removeClass('hidden').find('input').val(location.state);
            } else {
                el.addClass('hidden');
            }
            done()
        }
    },
    country: {
        find: function (context, source, done) {
            done(null, $('input', source).val());
        },
        validate: function (context, data, value, done) {
            if (!value) {
                return done(null, 'Please select the country of your location');
            }
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            $('input', source).val(value);
            done();
        }
    },
    latitude: {
        find: function (context, source, done) {
            done(null, context.value);
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            context.value = value;
            done();
        },
        render: function (ctx, lform, data, value, done) {
            done(null, {value: value});
        }
    },
    longitude: {
        find: function (context, source, done) {
            done(null, context.value);
        },
        validate: function (context, data, value, done) {
            done(null, null, value);
        },
        update: function (context, source, error, value, done) {
            context.value = value;
            done();
        },
        render: function (ctx, lform, data, value, done) {
            done(null, {value: value});
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
            done(err || status || xhr);
        }
    });
};

var locationUpdated = function (ctx, elem, location) {
    console.log(location);
    ctx.current = location;
    ctx.form.refresh(location, function (err) {
        if (err) {
            return console.error(err);
        }
    });
};

var initMap = function (ctx, elem, options, done) {
    var map = new google.maps.Map($('.map', elem)[0], options);
    var marker = new google.maps.Marker({
        map: map,
        position: options.center,
        draggable: true
    });
    var geocoder = new google.maps.Geocoder();
    var autoComplete = new google.maps.places.Autocomplete($('.search', elem).find('input')[0], {});
    var places = new google.maps.places.PlacesService(map);

    map.addListener('click', function (e) {
        marker.setPosition(e.latLng);
        places.getDetails({placeId: e.placeId}, function (place, status) {
            if (status !== 'OK') {
                return console.error(status)
            }
            locationUpdated(ctx, elem, locate(place));
        });
    });

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
    ctx.places = places;
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
    $('.add', elem).removeClass('hidden');
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
    $('.add', elem).addClass('hidden');
};

var find = function (options, done) {
    $.ajax({
        method: 'GET',
        url: utils.resolve('accounts:///apis/v/locations' + utils.query({user: options.user})),
        dataType: 'json',
        success: function (data) {
            done(null, data);
        },
        error: function (xhr, status, err) {
            done(err);
        }
    });
};

var create = function (location, done) {
    $.ajax({
        method: 'POST',
        url: utils.resolve('accounts:///apis/v/locations'),
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify(location),
        success: function (data) {
            done(null, data.id);
        },
        error: function (xhr, status, err) {
            done(err);
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

module.exports = function (ctx, sandbox, data, done) {
    data = data || {};
    find({user: data.user || ctx.user && ctx.user.id}, function (err, existing) {
        if (err) {
            return done(err);
        }
        var locationsById = _.keyBy(existing, 'id');
        var locations = [
            {val: '', title: 'Location'},
            {val: '+', title: 'Add Location'}
        ];
        var locationsCtx = _.map(existing, function (location) {
            return {
                val: location.id,
                title: address(location)
            }
        });
        locations = locations.concat(locationsCtx);
        dust.render('locate', {
            locations: locations
        }, function (err, out) {
            if (err) {
                return done(err);
            }
            var elem = sandbox.append(out);
            var lform = form.create(elem, configs);
            var loctex = {
                map: null,
                geocoder: null,
                marker: null,
                autoComplete: null,
                current: null,
                location: null,
                form: lform
            };
            lform.render(ctx, data, function (err) {
                if (err) {
                    return done(err);
                }
                var added;
                var el = $('.locate', sandbox);
                var eventer = utils.eventer();
                loctex.location = $('.location', el)
                    .val(data.location || '')
                    .selectpicker()
                    .on('change', function () {
                        var val = $(this).val();
                        var loc = val ? locationsById[val] : val;
                        console.log(loc)
                        // current = loc;
                        eventer.emit('change', loc, serand.none);
                        if (val === '+') {
                            return showMap(loctex, el, serand.none);
                        }
                        hideMap(el);
                    });
                eventer.on('destroy', function (done) {
                    loctex.location.selectpicker('destroy');
                    el.remove();
                    done();
                });
                eventer.on('find', function (done) {
                    var val = loctex.location.val();
                    if (!val) {
                        return done(null, val);
                    }
                    if (val === '-' || val === '+') {
                        return lform.find(function (err, location) {
                            if (err) {
                                return done(err);
                            }
                            lform.validate(location, function (err, errors, location) {
                                if (err) {
                                    return done(err);
                                }
                                if (errors && errors.line1 && location.line2) {
                                    location.line1 = location.line2;
                                    delete location.line2;
                                    locationUpdated(loctex, elem, location);
                                    return lform.find(done);
                                }
                                done(err, location);
                            });
                        });
                    }
                    done(null, locationsById[val]);
                });
                eventer.on('validate', function (location, done) {
                    console.log(location);
                    var i;
                    var loc;
                    if (typeof location !== 'string' && !(location instanceof String)) {
                        return lform.validate(location, done);
                    }
                    if (['', '-', '+'].indexOf(location) === 0) {
                        return done();
                    }
                    for (i = 0; i < existing.length; i++) {
                        loc = existing[i];
                        if (loc.id === location) {
                            return done(null, null, location);
                        }
                    }
                    done(new Error('Location ' + location + ' is invalid'));
                });
                eventer.on('update', function (errors, location, done) {
                    console.log(location);
                    lform.update(errors, location, done);
                });
                eventer.on('create', function (location, done) {
                    console.log('creating location')
                    console.log(location)
                    if (typeof location === 'string' || location instanceof String) {
                        return done(null, null, location);
                    }
                    lform.create(location, function (err, errors, location) {
                        if (err) {
                            return done(err);
                        }
                        if (errors) {
                            return done(null, errors);
                        }
                        create(location, function (err, id) {
                            done(err, null, id);
                        });
                    });
                });
                eventer.on('collapse', function (done) {
                    hideMap(el);
                    // how to get newly added address
                    // how to handle multipe usages of locate components
                    // introduce a local ctx which get passed to all methods
                    // add -> select existing -> add -> next shows empty in selected
                    var locations = [{val: '-', title: address(loctex.current)}];
                    locations.push({val: '+', title: 'Edit Location'});
                    locations = locations.concat(locationsCtx);
                    dust.render('locate-select', locations, function (err, out) {
                        if (err) {
                            return done(err);
                        }
                        loctex.location.html(out).selectpicker('refresh');
                        done();
                    });
                });
                done(null, eventer);
            });
        });
    });
};
