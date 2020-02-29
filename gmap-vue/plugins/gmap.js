import Vue from 'vue'
import * as VueGoogleMaps from 'vue2-google-maps'
import VueGeolocation from 'vue-browser-geolocation'

Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyCMXF1eLpfl0WeGIQ7hD_sIEQqz7eLwnDI',
    libraries: 'places'
  },
  autobindAllEvents: true
})

Vue.use(VueGeolocation)
