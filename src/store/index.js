import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    accessToken:
      "pk.eyJ1IjoiamVzdXNlZHUiLCJhIjoiY2tweTIyZG52MjA4MzJ5cXI2bTJwNHhmNyJ9.LI8k4RkAytfy_ohqY6YBDA",
    UrlRuta: "https://api.mapbox.com/directions/v5/mapbox/driving/"
  },
  mutations: {},
  actions: {}
});
