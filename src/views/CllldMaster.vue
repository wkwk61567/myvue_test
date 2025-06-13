<!-- 材料發料單單據頁面 -->
<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :query="query"
      :isQueryDisabled="false"
      :add="() => goToPage(selectedRow?.['header.cllldmst.danno'], { mode: 'add' })"
      :isAddDisabled="isAddDisabled"
      :edit="() => goToPage(selectedRow?.['header.cllldmst.danno'], { mode: 'edit' })"
      :isEditDisabled="isEditDisabled"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :toggleAudit="toggleAudit"
      :isToggleAuditDisabled="isToggleAuditDisabled"
      :exportExcel="() => utils.exportExcel(results.value, headers.value, '材料發料單單據', '材料發料單單據')"
      :isExportExcelDisabled="isExportExcelDisabled"
    />
    <!-- form區塊 -->
    <v-card>
      <v-card-title>資料庫查詢</v-card-title>
      <v-card-text>
        <v-row v-for="(row, rowIdx) in formRows" :key="rowIdx">
          <template v-for="field in row" :key="field.column">
            <v-col :cols="field.cols">
              <template v-if="field.componentType === 'button'">
                <!-- 目前這個頁面沒有用到 -->
                <v-btn
                  color="primary"
                  width="100%"
                  height="56px"
                  :disabled="field.disabled ? field.disabled() : false"
                  @click="field.onClick"
                >
                  {{ field.name }}
                </v-btn>
              </template>
              <template v-else-if="field.componentType === 'icon-text-field'">
                <v-text-field
                  v-model="form[field.column]"
                  :label="field.name"
                  :append-inner-icon="field.icon"
                  @click:append-inner="field.onClick"
                />
              </template>
              <template v-else>
                <component
                  :is="
                    field.componentType === 'checkbox'
                      ? 'v-checkbox'
                      : field.componentType === 'select'
                      ? 'v-select'
                      : 'v-text-field'
                  "
                  v-model="form[field.column]"
                  :label="field.name"
                  v-bind="
                    field.componentType === 'select'
                      ? {
                          'item-title': field.column,
                          'item-value': field.column,
                          items: formSelectOptions[field.column].value,
                        }
                      : field.componentType === 'date'
                      ? { type: 'date' }
                      : {}
                  "
                />
              </template>
            </v-col>
          </template>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- 查詢結果顯示區塊：自定義 header 插槽 -->
    <v-card class="mt-4 table-scroll-card">
      <v-card-title>查詢結果</v-card-title>
      <v-data-table
        :headers="headers"
        :items="results"
        no-data-text="No data available"
        :items-per-page="25"
        style="min-width: 1200px; max-height: 1200px; overflow-y: auto"
        fixed-header
        height="400px"
      >
        <template v-slot:header="{ headers }">
          <thead>
            <tr>
              <th v-for="header in headers" :key="header.key">
                {{ header.title }}
              </th>
            </tr>
          </thead>
        </template>

        <!-- 自定義每一行資料 -->
        <template v-slot:item="{ item }">
          <v-hover v-slot:default="{ isHovering, props: hoverProps }">
            <tr
              v-bind="hoverProps"
              @click="selectRow(item)"
              @dblclick="goToPage(item['header.cllldmst.danno'], { mode: 'view' })"
              :style="
                isRowSelected(item['header.cllldmst.danno'])
                  ? { backgroundColor: SELECTED_COLOR }
                  : isHovering
                  ? { backgroundColor: HOVER_COLOR }
                  : {}
              "
            >
              <template v-for="header in headers" :key="header.key">
                <td v-if="labels[header.key].componentType === 'checkbox'">
                    <v-checkbox
                      :model-value="item[header.key] === 1"
                      disabled
                    ></v-checkbox>
                  </td>
                  <td v-else :class="labels[header.key]?.dataType === 'number' ? 'number-td' : ''" >{{ item[header.key] }}</td>
              </template>
            </tr>
          </v-hover>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from "vue";
import { HOVER_COLOR, SELECTED_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useSelectRow } from "@/composables/useSelectRow.js";
import { useGoToPage } from "@/composables/useGoToPage.js";

const selectedLanguage = inject("selectedLanguage"); // 接收selectedLanguage 作為目前顯示的語言

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 查詢條件
const form = reactive({
  dDateStart: "", // 起始日期
  dDateEnd: "", // 結束日期
  danno: "", // 收貨單號
  dannobase: "", // 原始單號
  kind: "", // 類型
  maker: "", // 制單
});

const kindOptions = ref([
  { kind: "" }, // 不設限選項
  { kind: "生產領料" },
  { kind: "生產制損" },
  { kind: "外發領料" },
  { kind: "包材領料" },
]); // 類別選項，資料庫中沒有對應的紀錄，所以這裡直接定義選項
const formSelectOptions = {
  kind: kindOptions,
}; // form中的所有選項

// 上方的欄位
const formRows = computed(() => {
  const formRowsTemp = [
    [
      labels.value["filter.cllldmst.dDateStart"],
      labels.value["filter.cllldmst.dDateEnd"],
    ],
    [
      labels.value["filter.cllldmst.danno"],
      labels.value["filter.cllldmst.dannobase"],
    ],
    [
      labels.value["filter.cllldmst.kind"],
      labels.value["filter.cllldmst.maker"],
    ],
  ];
  return formRowsTemp;
});
console.log("formRows:", formRows.value);

// 檢查按鈕是否禁用
const {
  isAddDisabled,
  isEditDisabled,
  isDeleteOrderDisabled,
  isToggleAuditDisabled,
  isExportExcelDisabled,
  checkButtonFlags,
} = useCheckButtonFlags("cllld", form.audit);

const results = ref([]); // 查詢結果

const query = async () => {
  // 查詢cllldmst
  const params = {
    dDateStart: form.dDateStart,
    dDateEnd: form.dDateEnd,
    danno: form.danno,
    dannobase: form.dannobase,
    kind: form.kind,
    maker: form.maker,
  };

  console.log("查詢條件：", params);
  results.value = await utils.fetchData("cllldMaster.php", params);
  console.log("查詢結果：", results.value);

  utils.formatDateTimeFields(results.value, labels.value); // 轉換日期和時間欄位
};

const { selectedRow, selectRow, isRowSelected } = useSelectRow("header.cllldmst.danno"); // 選取row相關的變數和函式

const { goToPage } = useGoToPage("/cllldDetails", selectedRow, "header.cllldmst.audit"); // 跳轉到明細頁面的函式

const deleteOrder = async () => {
  // 廢單

  if (selectedRow.value === null) {
    alert("請選擇一筆資料");
    return;
  }
  if (
    selectedRow.value["header.cllldmst.audit"] === null ||
    selectedRow.value["header.cllldmst.audit"] === ""
  ) {
    const itmData = await utils.fetchData("cllldDetails.php", {
      danno: selectedRow.value["header.cllldmst.danno"],
    }); //透過api獲取該筆單據的明細資料
    console.log("明細資料:", itmData["clllditm"]);
    if (confirm("您確定要刪除整張單據嗎?")) {
      for (let item of itmData["clllditm"]) {
        const params = {
          danno: selectedRow.value["header.cllldmst.danno"],
          kind: item["header.clllditm.kind"],
          id: item["header.clllditm.id"],
        };
        const data = await utils.fetchData("cllldDelete.php", params); // 透過api刪除資料
        console.log("刪除資料結果：", data);
      }
      alert("刪除完成");
    }
  } else {
    alert("此單已審核，不能刪除");
  }
  await query(); // 重新載入表格
  selectedRow.value = null; // 清除選擇
};

const toggleAudit = async () => {
  // 審核(反審核)
  if (selectedRow.value === null) {
    alert("請選擇一筆資料");
    return;
  }

  const isAudit =
    selectedRow.value["header.cllldmst.audit"] === null ||
    selectedRow.value["header.cllldmst.audit"] === "";
  const params = {
    danno: selectedRow.value["header.cllldmst.danno"],
    table: "cllldmst",
    formno: "cllld",
  };

  await utils.auditOrder(isAudit, params);
  await query(); // 重新載入表格
  selectedRow.value = null; // 清除選擇
};

onMounted(async () => {
  checkButtonFlags();
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
