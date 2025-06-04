<template>
  <!-- 語言選擇器 -->
  <v-row class="language-selector">
    <v-col cols="12" class="text-right">
      <v-select
        :model-value="selectedLanguage"
        :items="languageOptions"
        item-text="title"
        item-value="key"
        label="選擇語言"
        outlined
        @update:modelValue="updateSelectedLanguage"
      ></v-select>
    </v-col>
  </v-row>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
const props = defineProps({
  selectedLanguage: String, // 選中的語言
  languageOptions: Array, // 語言選項
});

const emit = defineEmits(["update:selectedLanguage"]);

const updateSelectedLanguage = (newSelectedLanguage) => {
  localStorage.setItem('selectedLanguage', newSelectedLanguage); // 將語言設定保存到 localStorage
  emit("update:selectedLanguage", newSelectedLanguage); // 更新父組件的selectedLanguage
};
</script>

<style scoped>
.language-selector {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 200px;
}
v-col {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
::v-deep(.v-input__details) {
  display: none !important;
}
</style>
