<template>
  <div id="app">
     <!-- 鎖定畫面覆蓋層 -->
     <div v-if="isLocked" class="lock-screen">
      <h2>頁面已鎖定</h2>
      <input type="password" v-model="passwordInput" placeholder="輸入密碼解鎖(1234)">
      <button @click="unlockApp">解鎖</button>
      <p v-if="unlockError" style="color: red;">密碼錯誤</p>
    </div>

    <div v-show="!isLocked">
      <!-- 新增：導航列 -->
      <LanguageSelector
        :selectedLanguage="selectedLanguage" 
        @update:selectedLanguage="selectedLanguage = $event"
        :languageOptions="languageOptions"
      />
      <nav>
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="outlined">{{ labels['menu.NA.purchase'].name }}</v-btn>
          </template>
          <v-list>
            <v-list-item to="/cldhdMaster">
              <v-list-item-title>{{ labels['submenu.NA.cldhd'].name }}</v-list-item-title>
            </v-list-item>
            <v-list-item to="/cljhdMaster">
              <v-list-item-title>{{ labels['submenu.NA.cljhd'].name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="outlined">{{ labels['menu.NA.material'].name }}</v-btn>
          </template>
          <v-list>
            <v-list-item to="/cllldMaster">
              <v-list-item-title>{{ labels['submenu.NA.cllld'].name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" variant="outlined">{{ labels['menu.NA.other'].name }}</v-btn>
          </template>
          <v-list>
            <v-list-item to="/login">
              <v-list-item-title>{{ labels['submenu.NA.login'].name }}</v-list-item-title>
            </v-list-item>
          </v-list>
          <v-list>
            <v-list-item to="/">
              <v-list-item-title>{{ labels['submenu.NA.ordersTable'].name }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </nav>


      <!-- 新增：使用 Vue Router 來顯示對應的頁面 -->
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, provide } from 'vue';
import { useRouter } from 'vue-router';
import dictionaryConfig from "@/config"; // Renamed to avoid conflict with dictionary variable if any
import { SELECTED_LANGUAGE, LANGUAGE_OPTIONS } from "@/config.js";
import LanguageSelector from "@/components/LanguageSelector.vue";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";

// 假設這是驗證密碼的方式，實際應用中應替換為安全的驗證邏輯
const CORRECT_PASSWORD = "1234"; // 警告：請勿在前端硬編碼實際密碼
const LOCK_STORAGE_KEY = 'appLockedState'; // 用於 localStorage 的鍵
// const inactivityTimeout = 10 * 1000; // 測試用的閒置超時時間 (10 秒)
const inactivityTimeout = 15 * 60 * 1000; // 閒置超時時間 (15 分鐘)

const router = useRouter();

const fullDictionary = dictionaryConfig.fullDictionary; // 由 CSV 載進來的完整字典
const selectedLanguage = ref(SELECTED_LANGUAGE ? SELECTED_LANGUAGE : "zh-TW"); // 顯示的語言，如果沒有本地儲存的語言則使用預設值zh-TW
const languageOptions = LANGUAGE_OPTIONS; // This is a constant from import

const isLocked = ref(localStorage.getItem(LOCK_STORAGE_KEY) === 'true'); // 從 localStorage 初始化 isLocked
const passwordInput = ref(''); // 密碼輸入
const unlockError = ref(false); // 解鎖錯誤提示
const inactivityTimer = ref(null); // 閒置計時器 ID

// 傳遞選擇的語言至子元件
provide('selectedLanguage', computed(() => selectedLanguage.value));

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels } = useI18nHeadersLabels(selectedLanguage, fileName);

const lockApp = () => {
  if (!isLocked.value) { // 避免重複鎖定
    isLocked.value = true;
    passwordInput.value = ''; // 清空密碼輸入
    console.log('App locked due to inactivity.');
    // 清除計時器，避免鎖定後還在計時
    clearTimeout(inactivityTimer.value);
    localStorage.setItem(LOCK_STORAGE_KEY, 'true'); // 儲存鎖定狀態

    // 在此處執行其他操作，例如清除敏感資料
  }
};

const resetInactivityTimer = () => {
  return ; //停用鎖定機制
  // The following code is kept from original but commented out due to the return above
  
  unlockError.value = false; // 清除錯誤訊息
  clearTimeout(inactivityTimer.value);
  if (!isLocked.value) { // 只有在未鎖定時才重新啟動計時器
    inactivityTimer.value = setTimeout(lockApp, inactivityTimeout);
  }
  //console.log('Inactivity timer reset.'); // 用於調試
  //console.log('inactivityTimer:', inactivityTimer.value); // 用於調試
  
};

const unlockApp = () => {
  // **重要提示：** 這裡的密碼驗證非常不安全！
  // 在實際應用中，應該呼叫後端 API 來驗證密碼。
  if (passwordInput.value === CORRECT_PASSWORD) {
    isLocked.value = false;
    unlockError.value = false;
    passwordInput.value = ''; // 清空密碼輸入
    localStorage.removeItem(LOCK_STORAGE_KEY); // 移除鎖定狀態
    resetInactivityTimer(); // 解鎖後重置閒置計時器
    console.log('App unlocked.');
  } else {
    unlockError.value = true;
    console.log('Incorrect password.');
  }
};

// Watchers
watch(selectedLanguage, () => {
  const currentRoute = router.currentRoute.value; // 獲取當前路由
  if (currentRoute.meta && currentRoute.meta.titleKey) {
    const titleKey = currentRoute.meta.titleKey;
    const title = (fullDictionary[fileName]?.submenu?.NA?.[titleKey]?.[selectedLanguage.value]) || titleKey;

    // 更新路由標題和頁面標題
    // 直接修改 currentRoute.meta.title (可能不會對所有路由器功能產生影響)
    // currentRoute.meta.title = title; 
    document.title = title;
  }
});

watch(isLocked, (newValue) => {
   // 根據鎖定狀態添加/移除監聽器
   if (newValue) {
    // 如果變為鎖定，移除活動監聽器並清除計時器
    window.removeEventListener('mousemove', resetInactivityTimer);
    window.removeEventListener('mousedown', resetInactivityTimer);
    window.removeEventListener('keypress', resetInactivityTimer);
    window.removeEventListener('touchmove', resetInactivityTimer);
    window.removeEventListener('scroll', resetInactivityTimer);
    clearTimeout(inactivityTimer.value);
    localStorage.setItem(LOCK_STORAGE_KEY, 'true'); // 確保狀態已儲存
  } else {
    // 如果變為解鎖，重新添加監聽器並啟動計時器
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('touchmove', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    localStorage.removeItem(LOCK_STORAGE_KEY); // 確保狀態已移除
    resetInactivityTimer(); // 重新開始計時
  }
});

// Lifecycle Hooks
onMounted(() => {

  // 只有在未鎖定時才啟動計時器和監聽器
  if (!isLocked.value) {
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('mousedown', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('touchmove', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    resetInactivityTimer(); // 初始化計時器
  }
});

onBeforeUnmount(() => {
  // 卸載元件時清理事件監聽器和計時器
  window.removeEventListener('mousemove', resetInactivityTimer);
  window.removeEventListener('mousedown', resetInactivityTimer);
  window.removeEventListener('keypress', resetInactivityTimer);
  window.removeEventListener('touchmove', resetInactivityTimer);
  window.removeEventListener('scroll', resetInactivityTimer);
  clearTimeout(inactivityTimer.value);
});

</script>

<style scoped>
/* 讓導航按鈕有間距 */
nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
</style>