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

var pickerConfig = function (o) {
    return {
        location: {
            find: function (context, source, done) {
                serand.blocks('select', 'find', source, done);
            },
            validate: function (context, data, value, done) {
                if (!value) {
                    return done(null, 'Please select an existing location or create one');
                }
                done(null, null, value);
            },
            update: function (context, source, error, value, done) {
                done();
            },
            render: function (ctx, pickerForm, data, value, done) {
                var picker = $('.picker .location', pickerForm.elem);
                var creator = $('.creator', pickerForm.elem);
                serand.blocks('select', 'create', picker, {
                    value: value,
                    change: function () {
                        pickerForm.find(function (err, pick) {
                            if (err) {
                                return done(err);
                            }
                            pickerForm.validate(pick, function (err, errors, location) {
                                if (err) {
                                    return done(err);
                                }
                                pickerForm.update(errors, location, function (err) {
                                    if (err) {
                                        return done(err);
                                    }
                                    var val = pick.location;
                                    if (val === '+') {
                                        return showMap(o.loctex, creator, serand.none);
                                    }
                                    hideMap(creator);
                                });
                            });
                        });
                    }
                }, done);
            }
        },
    };
};

var creatorConfig = {
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
    elem.removeClass('hidden');
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
    elem.addClass('hidden');
};

var findLocations = function (options, done) {
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

module.exports = function (ctx, container, data, done) {
    var sandbox = container.sandbox;
    data = data || {};
    findLocations({user: data.user || ctx.user && ctx.user.id}, function (err, locations) {
        if (err) {
            return done(err);
        }
        var locationsById = _.keyBy(locations, 'id');
        var picks = [
            {value: '', label: 'Location'},
            {value: '+', label: 'Add Location'}
        ];
        picks = picks.concat(_.map(locations, function (location) {
            return {
                value: location.id,
                label: address(location)
            }
        }));
        dust.render('locate', {
            _: {
                container: container.id,
                picks: picks
            }
        }, function (err, out) {
            if (err) {
                return done(err);
            }
            var elem = sandbox.append(out);
            var o = utils.eventer();

            var creatorForm = form.create(container.id, elem, creatorConfig);

            var loctex = {
                map: null,
                geocoder: null,
                marker: null,
                autoComplete: null,
                current: null,
                location: null,
                form: creatorForm
            };

            var opts = {
                eventer: o,
                locationsById: locationsById,
                loctex: loctex
            };

            var pickerForm = form.create(container.id, elem, pickerConfig(opts));

            o.find = function (done) {
                pickerForm.find(function (err, o) {
                    if (err) {
                        return done(err);
                    }
                    if (o.location !== '+') {
                        return done(err, o.location);
                    }
                    creatorForm.find(function (err, o) {
                        if (err) {
                            return done(err);
                        }
                        creatorForm.validate(o, function (err, errors, location) {
                            if (err) {
                                return done(err);
                            }
                            if (errors && errors.line1 && location.line2) {
                                location.line1 = location.line2;
                                delete location.line2;
                                locationUpdated(loctex, elem, location);
                                return creatorForm.find(done);
                            }
                            done(err, location);
                        });
                    });
                });
            };
            o.validate = function (loc, done) {
                pickerForm.find(function (err, o) {
                    if (err) {
                        return done(err);
                    }
                    if (o.location !== '+') {
                        pickerForm.validate({
                            location: loc
                        }, function (err, errors, location) {
                            if (err) {
                                return done(err);
                            }
                            done(err, errors, location);
                        });
                        return;
                    }
                    creatorForm.validate(loc, done);
                });
            };
            o.update = function (errors, location, done) {
                pickerForm.find(function (err, o) {
                    if (err) {
                        return done(err);
                    }
                    if (o.location !== '+') {
                        return pickerForm.update(errors, location, done);
                    }
                    creatorForm.update(errors, location, done);
                });
            };
            o.create = function (location, done) {
                console.log('creating location')
                console.log(location)
                if (typeof location === 'string' || location instanceof String) {
                    return done(null, null, location);
                }
                creatorForm.create(location, function (err, errors, location) {
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
            };

            pickerForm.render(ctx, {
                location: data.location
            }, function (err) {
                if (err) {
                    return done(err);
                }
                creatorForm.render(ctx, {
                    location: data.location
                }, function (err) {
                    if (err) {
                        return done(err);
                    }
                    done(null, o);
                });
            });
        });
    });
};
