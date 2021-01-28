var steps = 500

function createConnectionRoute(origin, destination) {
	// A simple line from origin to destination.
	var route = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [origin, destination],
				},
			},
		],
	}

	// Calculate the distance in kilometers between route start/end point.
	var lineDistance = turf.length(route.features[0], { units: 'kilometers' })

	var arc = []

	// Draw an arc between the `origin` & `destination` of the two points
	for (var i = 0; i < lineDistance; i += lineDistance / steps) {
		var segment = turf.along(route.features[0], i, { units: 'kilometers' })
		arc.push(segment.geometry.coordinates)
	}

	// Update the route with calculated arc coordinates
	route.features[0].geometry.coordinates = arc

	map.addSource('route', {
		type: 'geojson',
		data: route,
	})

	map.addLayer({
		id: 'route',
		source: 'route',
		type: 'line',
		layout: {
			// 'line-cap': 'round',
			// 'line-join': 'round',
		},
		paint: {
			'line-width': 3,
			'line-color': '#0c5ce5',
			'line-dasharray': [0, 3],
		},
	})

	return route
}

function addMarker(location, className) {
	let el = document.createElement('div')
	el.className = className
	return new mapboxgl.Marker(el).setLngLat(location).addTo(map)
}

const fitBounds = coordinates => {
	const bounds = coordinates.reduce(function (bounds, coord) {
		return bounds.extend(coord)
	}, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]))
	const padding = (window.innerWidth - 600) / 2

	map.fitBounds(bounds, {
		padding:
			padding > 100
				? { top: 200, bottom: 200, right: padding, left: padding }
				: 50,
	})
}

function renderLatency(latency, midPoint, route) {
	var counter = 0

	// A single point that animates along the route.
	// Coordinates are initially set to origin.
	var point = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {
					latency,
				},
				geometry: {
					type: 'Point',
					coordinates: midPoint.geometry.coordinates,
				},
			},
		],
	}

	// load image and draw objects on map
	map.loadImage('../assets/ping.png', function (err, image) {
		if (err) throw err
		map.addImage('signal', image)

		map.addSource('point', {
			type: 'geojson',
			data: point,
		})

		map.addLayer({
			id: 'point',
			source: 'point',
			type: 'symbol',
			layout: {
				'icon-image': 'signal',
				'icon-size': 1,
				'icon-allow-overlap': true,
				'icon-ignore-placement': true,
				'text-field': '{latency}ms',
				'text-font': ['Raleway Bold'],
				'text-transform': 'uppercase',
				'text-size': 12,
				'text-justify': 'center',
			},
			paint: {
				'text-color': '#051243',
			},
		})

		// animate()
	})

	// animation function
	function animate() {
		// Update point geometry to a new position based on counter denoting
		// the index to access the arc.
		point.features[0].geometry.coordinates =
			route.features[0].geometry.coordinates[counter]

		// Calculate the bearing to ensure the icon is rotated to match the route arc
		// The bearing is calculate between the current point and the next point, except
		// at the end of the arc use the previous point and the current point
		point.features[0].properties.bearing = turf.bearing(
			turf.point(
				route.features[0].geometry.coordinates[
					counter >= steps ? counter - 1 : counter
				],
			),
			turf.point(
				route.features[0].geometry.coordinates[
					counter >= steps ? counter : counter + 1
				],
			),
		)

		// Update the source with this new data.
		map.getSource('point').setData(point)

		// Request the next frame of animation so long the end has not been reached.
		if (counter < steps) {
			requestAnimationFrame(animate)
		} else if (counter === steps) {
			counter = 0
			testLatency(latency => {
				point.features[0].properties.latency = latency
				animate()
			})
		}

		counter = counter + 1
	}
}

function enableLineAnimation(layerId) {
	var animationStep = 50
	var step = 0

	let dashArraySeq = [
		[0, 4, 1],
		[1, 4, 0],
		[0, 1, 1, 3],
		[0, 2, 1, 2],
		[0, 3, 1, 1],
	]

	setInterval(() => {
		step = (step + 1) % dashArraySeq.length
		map.setPaintProperty(layerId, 'line-dasharray', dashArraySeq[step])
	}, animationStep)
}
