import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

const router = new Router({
  mode: process.env.CORDOVA_PLATFORM ? "hash" : "history",
  routes: [
    {
      path: "/",
      component: () => import("layouts/MyLayout.vue"),
      children: [{ path: "", component: () => import("pages/Index.vue") }]
    },
    {
      path: "*",
      redirect: "/"
    }
  ]
});

export default router;
