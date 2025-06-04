// main.js
import { createApp } from "vue";
import App from "./App.vue";
import { createVuetify } from "vuetify";
import "vuetify/styles";

// 引入 Vuetify 的組件和指令
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// 引入 Material Design Icons
import "@mdi/font/css/materialdesignicons.css"; // 確保已安裝 @mdi/font
import { aliases, mdi } from "vuetify/iconsets/mdi";

import router from "./router.js"; // 引入 Vue Router

import dictionary from "@/config.js"; // 引入字典配置

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: "mdi",
    aliases,
    sets: {
      mdi,
    },
  },
});

await dictionary.init(); // 先載入字典

const app = createApp(App);
app.use(vuetify);
app.use(router);
app.mount("#app");
