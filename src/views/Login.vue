<template>
  <div
    class="login-container"
    style="display: flex; flex-direction: column; align-items: center"
  >
    <h2>登入</h2>
    <form v-if="!isLoggedIn" @submit.prevent="login" style="width: 300px">
      <v-text-field
        v-model="user.powerno"
        label="輸入帳號"
        required
        style="width: 100%"
      ></v-text-field>
      <v-text-field
        v-model="user.password"
        label="輸入密碼"
        type="password"
        required
        style="width: 100%"
      ></v-text-field>
      <v-btn type="submit" color="primary" height="56px" style="width: 100%"
        >登入</v-btn
      >
    </form>
    <v-col cols="1" class="text-right" style="width: 300px">
      <v-btn
        v-if="isLoggedIn"
        color="primary"
        @click="logout"
        height="56px"
        style="width: 100%"
        >登出</v-btn
      >
    </v-col>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { API_BASE_URL } from "@/config.js";

const router = useRouter();
const user = ref({ powerno: "", password: "" });
const errorMessage = ref("");
const isLoggedIn = ref(false); // 使用者是否已經登入

const checkLoginStatus = async () => {
  // 檢查使用者是否已經登入
  try {
    const response = await axios.get(
      `${API_BASE_URL}/api/checkAuthenticated.php`,{
        withCredentials: true,
      }
    );
    isLoggedIn.value = response.data.authenticated;
  } catch (error) {
    isLoggedIn.value = false;
  }
};

const login = async () => {
  try {
    await axios.post(`${API_BASE_URL}/api/login.php`, user.value, {
      withCredentials: true,
    });
    errorMessage.value = "登入成功";
    //router.push("/query"); // 登入成功後跳轉
    const redirect = router.currentRoute.value.query.redirect || "/login"; // 讓使用者登入後自動導回原本想去的頁面。如果沒有指定，就導回 /login
    router.push(redirect);
    isLoggedIn.value = true;
    //window.location.reload(); // 重新整理頁面
  } catch (error) {
    console.error("登入失敗", error);
    errorMessage.value = "登入失敗，請檢查帳號或密碼";
  }
};

const logout = async () => {
  await axios.post(
    `${API_BASE_URL}/api/logout.php`,
    {},
    { withCredentials: true }
  );
  errorMessage.value = "已登出";
  router.push("/login");
  window.location.reload(); // 重新整理頁面
};

onMounted(() => {
  checkLoginStatus();
});
</script>
