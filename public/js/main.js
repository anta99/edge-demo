var PING_INTERVAL = 5000
var ANIMATION_DELAY = 2000

function onMapLoad() {
	map.on('load', function () {
		const clientLoc = [client.lon, client.lat]
		var appfleetRegion = null
		let markers = []

		// display regions
		regions.forEach(region => {
			// add region to map
			markers.push(
				addMarker([region.longitude, region.latitude], 'marker server'),
			)

			// set connected region
			if (
				region.code.toLowerCase() === env.APPFLEET_REGION.toLowerCase()
			) {
				appfleetRegion = region
			}
		})

		// on latency data
		setTimeout(() => {
			testLatency(l1 =>
				testLatency(l2 =>
					testLatency(l3 => {
						var latency = Math.min(l1, l2, l3)
						var regionLoc = [
							appfleetRegion.longitude,
							appfleetRegion.latitude,
						]

						// render data into info box
						renderInfoData(client, appfleetRegion, latency)

						// remove markers and render connected server
						markers.map(marker => marker.remove())
						addMarker(
							regionLoc,
							'point server',
						).getElement().innerHTML = `<img class='marker__logo' src='assets/appfleet_logo.svg' alt='logo' />`

						//render client
						const clientMarker = addMarker(
							clientLoc,
							'point client',
						)
						clientMarker.getElement().innerHTML = 'You'

						// render connection line
						const route = createConnectionRoute(
							regionLoc,
							clientLoc,
						)
						renderLatency(
							latency,
							turf.midpoint(
								turf.point(regionLoc),
								turf.point(clientLoc),
							),
							route,
						)

						// animate map
						fitBounds([regionLoc, clientLoc])
						setTimeout(enableLineAnimation('route'), 1000)
					}),
				),
			)
		}, ANIMATION_DELAY)
	})
}

function renderInfoData(client, region, latency) {
	// remove loading
	const values = document.getElementsByClassName('value')
	for (const el of values) {
		el.className = 'value'
	}

	// inner render data
	document.getElementById('loading').innerHTML = 'Connection Information'
	document.getElementById('latency').innerHTML = `${latency}ms`
	document.getElementById('clientIP').innerHTML = client.query
	document.getElementById(
		'location',
	).innerHTML = `<img src='assets/flags/SVG/${client.countryCode}.svg' alt='county'/>&nbsp;&nbsp;${client.city}, ${client.countryCode}`
	document.getElementById(
		'region',
	).innerHTML = `<img src='assets/flags/SVG/${region.country}.svg' alt='county'/>&nbsp;&nbsp;${region.name}, ${region.country}`
}

function testLatency(callback) {
	const URL = `${headers.protocol}://${headers.host}/ping`
	const req = new XMLHttpRequest()

	req.addEventListener('load', () => {
		const resources = performance.getEntriesByName(URL)
		const latency = Math.ceil(
			resources[resources.length - 1].responseEnd -
				resources[resources.length - 1].requestStart,
		)

		callback(latency)
	})

	req.open('GET', URL)
	req.send()
}
