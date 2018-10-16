var normalize = function (o) {
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
        if (typeof address.latitude === 'function') {
            address.latitude = address.latitude();
        }
        address.longitude = geometry.location.lng;
        if (typeof address.longitude === 'function') {
            address.longitude = address.longitude();
        }
    }
    console.log('normalize')
    console.log(address)
    address.name = o.name;
    address.place_id = o.place_id;
    address.international_phone_number = o.international_phone_number;
    return address;
};

var locate = function (o) {
    o = normalize(o);
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
        if (o.sublocality_level_2) {
            return o.sublocality_level_2.long_name;
        }
        /*if (o.sublocality_level_2) {
            line += line ? ', ' : '';
            line += o.sublocality_level_2.long_name;
        }*/
        return null;
    };
    var line2 = function (o) {
        var line = ''
        if (o.route) {
            line += o.route.long_name;
        }
        if (o.sublocality_level_1) {
            line += line ? ', ' : '';
            line += o.sublocality_level_1.long_name;
        }
        return line || null;
    };
    var city = function (o) {
        if (o.locality) {
            return o.locality.long_name;
        }
        return null;
    };
    var location = {
        name: o.name,
        line1: line1(o),
        line2: line2(o),
        city: o.locality && o.locality.long_name,
        postal: o.postal_code && o.postal_code.long_name,
        district: o.administrative_area_level_2 && o.administrative_area_level_2.long_name,
        state: o.administrative_area_level_1 && o.administrative_area_level_1.long_name,
        country: o.country && o.country.short_name,
        latitude: o.latitude,
        longitude: o.longitude
    };
    console.log('original');
    console.log(o);
    console.log('parsed');
    console.log(JSON.stringify(location));
    var format = formats[location.country];
    if (!format) {
        return location;
    }
    return format(location);
};

module.exports = locate;

var move = function (o, from, to) {
    o[to] = o[from];
    delete o[from];
    return o;
}

var formats = {
    'LK': function (o) {
        return move(o, 'state', 'province');
    }
}
