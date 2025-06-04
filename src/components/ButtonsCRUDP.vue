<template>
  <v-card v-if="isButtonsCRUDPVisible">
    <div class="button-container">
      <v-row>
        <!-- 查詢 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="query"
            height="56px"
            :disabled="isQueryDisabled"
            >{{labels['button.NA.query'].name}}</v-btn
          >
        </v-col>
        <!-- 新增 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="add"
            height="56px"
            :disabled="isAddDisabled"
            >{{labels['button.NA.add'].name}}</v-btn
          >
        </v-col>
        <!-- 修改 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="edit"
            height="56px"
            :disabled="isEditDisabled"
            >{{labels['button.NA.edit'].name}}</v-btn
          >
        </v-col>
        <!-- 廢單 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="deleteOrder"
            height="56px"
            :disabled="isDeleteOrderDisabled"
            >{{labels['button.NA.deleteOrder'].name}}</v-btn
          >
        </v-col>
        <!-- 審核 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="toggleAudit"
            height="56px"
            :disabled="isToggleAuditDisabled"
            >{{labels['button.NA.toggleAudit'].name}}</v-btn
          >
        </v-col>
        <!-- 導出 -->
        <v-col cols="auto" class="text-right">
          <v-btn
            color="primary"
            @click="exportExcel"
            height="56px"
            :disabled="isExportExcelDisabled"
            >{{labels['button.NA.exportExcel'].name}}</v-btn
          >
        </v-col>
      </v-row>
    </div>
  </v-card>
</template>

<script setup>
import { inject } from 'vue';
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

const props = defineProps({
  query: {
    type: Function,
    required: false,
  },
  add: {
    type: Function,
    required: false,
  },
  edit: {
    type: Function,
    required: false,
  },
  deleteOrder: {
    type: Function,
    required: false,
  },
  toggleAudit: {
    type: Function,
    required: false,
  },
  exportExcel: {
    type: Function,
    required: false,
  },

  // 是否禁用"查詢"按鈕
  isQueryDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否禁用"新增"按鈕
  isAddDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否禁用"修改"按鈕
  isEditDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否禁用"廢單"按鈕
  isDeleteOrderDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否禁用"審核"按鈕
  isToggleAuditDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否禁用"導出"按鈕
  isExportExcelDisabled: {
    type: Boolean,
    default: true,
  },
  // 是否顯示按鈕card
  isButtonsCRUDPVisible: {
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
.v-btn--size-default{
  white-space: normal
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