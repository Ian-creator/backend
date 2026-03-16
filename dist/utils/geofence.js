"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinOffice = exports.OFFICE_LOCATION = exports.calculateDistance = void 0;
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};
exports.calculateDistance = calculateDistance;
exports.OFFICE_LOCATION = {
    lat: 0.3476,
    lon: 32.5825,
    radius: 100 // meters
};
const isWithinOffice = (lat, lon) => {
    const distance = (0, exports.calculateDistance)(lat, lon, exports.OFFICE_LOCATION.lat, exports.OFFICE_LOCATION.lon);
    return distance <= exports.OFFICE_LOCATION.radius;
};
exports.isWithinOffice = isWithinOffice;
