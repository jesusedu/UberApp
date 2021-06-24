<template>
  <q-page padding class="flex flex-center">
    <div class="row items-center">
      <div class="col-xs-12 q-col-gutter-y-md">
        <div id="from"></div>
        <div v-show="desde" id="to"></div>
        <div>
          <q-btn
            :disable="visible"
            color="black"
            @click="trazarRuta()"
            class="full-width"
            label="Confirm route"
          />
        </div>
        <div id="map" class="map-container"></div>
      </div>
    </div>
  </q-page>
</template>

<script>
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

export default {
  name: "PageIndex",
  data: () => ({
    axiosConfig: {
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      }
    },
    map: null,
    desde: null,
    hasta: null,
    routes: null,
    markerDriver: false,
    visible: false
  }),
  computed: {
    token() {
      return this.$store.state.accessToken;
    }
  },
  mounted() {
    this.iniciarmapa();
  },
  methods: {
    iniciarmapa() {
      mapboxgl.accessToken = this.token;

      this.map = new mapboxgl.Map({
        container: "map", // container ID
        style: "mapbox://styles/mapbox/streets-v11",
        center: [-103.3797178, 20.6615409], //LON-LAT
        zoom: 12
      });

      // Add the control to the map.
      let from = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl,
        placeholder: "Choose a starting place",
        countries: "mx"
      });

      let to = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl,
        placeholder: "Choose destination",
        countries: "mx"
      });

      //getData MapboxGeocoder
      from.on("result", e => {
        this.desde = e.result.center;
      });
      to.on("result", e => {
        this.hasta = e.result.center;
      });
      from.on("clear", () => {
        this.desde = null;
      });
      to.on("clear", () => {
        this.hasta = null;
      });

      document.getElementById("from").appendChild(from.onAdd(this.map));
      document.getElementById("to").appendChild(to.onAdd(this.map));

      this.map.once("load", () => {
        this.map.resize();
      });
    },
    trazarRuta() {
      this.$q.loading.show();
      if (this.desde == null || this.hasta == null) {
        this.$q.loading.hide();
        this.$q.notify({
          message: "Please enter a route",
          type: "warning",
          progress: true,
          position: "top-right"
        });
        return;
      }
      this.visible = true;
      let url = `${this.$store.state.UrlRuta}${this.desde[0]},${this.desde[1]};${this.hasta[0]},${this.hasta[1]}?steps=true&geometries=geojson&access_token=${this.token}`;
      var vueInstance = this;
      this.$axios
        .get(url, this.axiosConfig)
        .then(function(res) {
          vueInstance.$q.loading.hide();
          let data = res.data;
          console.log(data);
          vueInstance.routes = data.routes[0];
          if (vueInstance.routes.geometry.coordinates.length > 0) {
            vueInstance.trazarRutaMap(vueInstance.routes);
          } else {
            vueInstance.$q.notify({
              message: "There are no routes for that area",
              type: "warning",
              progress: true,
              position: "top-right"
            });
          }
        })
        .catch(function(error) {
          vueInstance.$q.loading.hide();
          vueInstance.visible = false;
          console.error(error);
          vueInstance.$q.notify({
            message: "Please try later",
            type: "warning",
            progress: true,
            position: "top-right"
          });
        });
    },
    trazarRutaMap(routes) {
      let ruta = routes.geometry.coordinates;
      if (this.map.getLayer("route")) {
        this.map.removeLayer("route");
      }
      if (this.map.getSource("route")) {
        this.map.removeSource("route");
      }
      this.map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: ruta
          }
        }
      });
      this.map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#669DF6",
          "line-opacity": 0.5,
          "line-width": 13,
          "line-blur": 0.5
        }
      });
      this.map.fitBounds([ruta[0], ruta[ruta.length - 1]], {
        padding: 100
      });

      //carito
      this.$q.notify({
        message: `Start`,
        caption: `
        distance: ${parseFloat(routes.distance / 1000).toFixed(2)} Km </br>
        duration: ${parseFloat(routes.duration / 60).toFixed(2)} Min`,
        html: true,
        type: "info",
        progress: true,
        position: "top-right"
      });
      let counter = setInterval(() => {
        const coords = ruta.shift();
        if (!coords) {
          this.visible = false;
          this.$q.notify({
            message: `Finish`,
            caption: `
            distance: ${parseFloat(routes.distance / 1000).toFixed(2)} Km </br>
            duration: ${parseFloat(routes.duration / 60).toFixed(2)} Min`,
            html: true,
            type: "info",
            progress: true,
            position: "top-right"
          });
          console.log("se termimna");
          clearInterval(counter);
        } else {
          console.log(coords);
          this.addMarkerCustom(coords);
        }
      }, 1000);
    },
    addMarkerCustom(coords) {
      //let coords = [-103.3797178, 20.6615409];
      const el = document.createElement("div");
      el.className = "marker";
      if (!this.markerDriver) {
        this.markerDriver = new mapboxgl.Marker(el);
        this.markerDriver.setLngLat(coords).addTo(this.map);
      } else {
        this.markerDriver.setLngLat(coords).addTo(this.map);
      }
    },
  }
};
</script>

<style>
@media only screen and (max-width: 600px) {
  .map-container {
    width: 100%;
    height: 500px;
    border-radius: 1rem;
    border: solid 10px white;
    box-shadow: 0 12.5px 10px rgba(0, 0, 0, 0.035),
      0 100px 80px rgba(0, 0, 0, 0.07);
  }
}

@media only screen and (min-width: 600px) {
  .map-container {
    width: 800px;
    height: 500px;
    border-radius: 1rem;
    border: solid 10px white;
    box-shadow: 0 12.5px 10px rgba(0, 0, 0, 0.035),
      0 100px 80px rgba(0, 0, 0, 0.07);
  }
}

.marker {
  width: 50px;
  height: 50px;
  /*background-color: red;*/
  background-image: url("../../public/sport-car.png");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.geocoder,
.mapboxgl-ctrl {
  width: 100%;
  max-width: 100%;
  border-radius: 0;
  background-color: white;
}
</style>
