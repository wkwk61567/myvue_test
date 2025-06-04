<template>
  <v-card v-if="isButtonsSaveDiscardVisible">
    <div class="button-container">
      <v-row>
        <!-- 存檔 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="save"
            height="56px"
            :disabled="isSaveDisabled"
            >{{labels['button.NA.save'].name}}</v-btn
          >
        </v-col>
        <!-- 放棄 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="discard"
            height="56px"
            >{{labels['button.NA.discard'].name}}</v-btn
          >
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup>
import { inject } from 'vue';
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

const props = defineProps({
  save: {
    type: Function,
    required: false,
  },
  discard: {
    type: Function,
    required: false,
  },
  // 是否禁用"存檔"按鈕
  isSaveDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否顯示按鈕card
  isButtonsSaveDiscardVisible: {
    type: Boolean,
    default: true,
  },
});

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels } = useI18nHeadersLabels(selectedLanguage, fileName);

</script>

<style scoped>
.v-card {
  padding: 4px;
}
.v-col {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}
::v-deep(.v-input__details) {
  display: none !important;
}
.mt-4 {
  margin-top: 16px;
}
.button-container {
  margin: 16px; /* 可以根據需要調整這裡的 margin */
}


.container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.plus-button {
  font-size: 2rem;
  padding: 10px 20px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>