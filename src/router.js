import { createRouter, createWebHistory } from "vue-router";
import OrdersTable from "@/views/OrdersTable.vue"; // 訂單管理頁面
import CldhdMaster from "@/views/CldhdMaster.vue"; // 訂購單單據頁面
import CldhdDetails from "@/views/CldhdDetails.vue"; // 訂購單明細頁面
import CljhdMaster from "@/views/CljhdMaster.vue"; // 收貨單單據頁面
import CljhdDetails from "@/views/CljhdDetails.vue"; // 收貨單明細頁面
import DatabaseQuery_ from "@/views/DatabaseQuery_.vue"; // 資料庫查詢頁面_測試
import CllldMaster from "@/views/CllldMaster.vue"; // 發料單單據頁面
import CllldDetails from "@/views/CllldDetails.vue"; // 發料單明細頁面
import Login from "@/views/Login.vue"; // 登入頁面
//Windows 檔案系統大小寫不敏感 如果只是改檔名大小寫 需要先改成別的檔名 例如 login.vue -> login_.vue -> Login.vue
import axios from "axios";
import { API_BASE_URL } from "@/config";
import dictionary from "@/config";
import { SELECTED_LANGUAGE } from "@/config.js";

const routes = [
  {
    path: "/",
    component: OrdersTable,
    props: true,
    meta: {
      requiresAuth: true, // 在設置authRequired的時候判斷是不是false 不是則設為true
      requiredFormno: "cllld",
      requiredFlag: "findflag",
      titleKey: "ordersTable",
    },
  }, // 訂單管理頁面
  {
    path: "/login",
    component: Login,
    meta: { requiresAuth: false, titleKey: "login" },
  }, // 登入頁面
  {
    path: "/cldhdMaster",
    component: CldhdMaster,
    props: true,
    meta: {
      requiresAuth: true,
      requiredFormno: "cldhd",
      requiredFlag: "findflag",
      titleKey: "cldhd",
    },
  },
  {
    path: "/cldhdDetails/:danno",
    component: CldhdDetails,
    props: true,
    meta: {
      requiresAuth: true,
      requiredFormno: "cldhd",
      requiredFlag: "findflag",
      titleKey: "cldhd",
    },
  },
  {
    path: "/cljhdMaster",
    component: CljhdMaster,
    props: true,
    meta: {
      requiresAuth: true,
      requiredFormno: "cljhd",
      requiredFlag: "findflag",
      titleKey: "cljhd",
    },
  },
  {
    path: "/cljhdDetails/:danno",
    component: CljhdDetails,
    props: true,
    meta: {
      requiresAuth: true,
      requiredFormno: "cljhd",
      requiredFlag: "findflag",
      titleKey: "cljhd",
    },
  },
  {
    path: "/cllldMaster",
    component: CllldMaster,
    props: true,
    meta: {
      requiresAuth: true,
      requiredFormno: "cllld",
      requiredFlag: "findflag",
      titleKey: "cllld",
    },
  },
  {
    path: "/cllldDetails/:danno",
    component: CllldDetails,
    props: true,
    meta: {
      requiresAuth: true,
      requiredFormno: "cllld",
      requiredFlag: "findflag",
      titleKey: "cllld",
    },
  },
  { path: "/query_", component: DatabaseQuery_ }, // 資料庫查詢頁面_測試
];

// 為了根據字典取得標題
const getTitleFromDictionary = (titleKey) => {
  const fileName = import.meta.url.split("/").pop().split("%")[0]; // 同下拉式選單的page
  const languageOptions = SELECTED_LANGUAGE ? SELECTED_LANGUAGE : "zh-TW"; // 顯示的語言，如果沒有本地儲存的語言則使用預設值zh-TW
  return (
    dictionary.fullDictionary?.[fileName]?.pageTitle?.["NA"]?.[titleKey]?.[
      languageOptions
    ] || titleKey
  );
};

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // 路由守衛

  // 為每個路由設定標題
  if (to.meta && to.meta.titleKey) {
    to.meta.title = getTitleFromDictionary(to.meta.titleKey);
  }
  document.title = to.meta.title || "表單"; // 變更標題

  //const authRequired = to.matched.some((record) => record.meta.requiresAuth);
  const authRequired = to.matched.some(
    (record) => record.meta.requiresAuth !== false
  ); // 如果沒有明確設定為 false，則預設為 true

  const requiredFlag = to.meta.requiredFlag;
  const requiredFormno = to.meta.requiredFormno;

  if (authRequired) {
    console.log("API_BASE_URL", API_BASE_URL);
    console.log(`${API_BASE_URL}/api/checkAuthenticated.php`, {
      flag: requiredFlag,
      formno: requiredFormno,
    });
    try {
      const responseAuthenticated = await axios.get(
        `${API_BASE_URL}/api/checkAuthenticated.php`,
        {
          withCredentials: true,
          params: {
            flag: requiredFlag,
            formno: requiredFormno,
          },
        }
      );
      const authenticated = await responseAuthenticated.data.authenticated;

      if (!authenticated) {
        //console.error(authenticated);
        return next({
          path: "/login", // 跳到登入介面
          query: { redirect: to.fullPath }, // 保存原本要進入的頁面路徑
        });
      }

      const responseFlag = await axios.get(
        `${API_BASE_URL}/api/checkFlag.php`,
        {
          withCredentials: true,
          params: {
            flag: requiredFlag,
            formno: requiredFormno,
          },
        }
      );
      const flag = await responseFlag.data.flag;
      if (requiredFlag && flag !== 1) {
        alert("無權限");
        return next(false); // 停留在原本的頁面
      }
    } catch (error) {
      console.error("驗證失敗", error);
      return next(false); // 停留在原本的頁面
    }
  }

  next();
});



export default router;
