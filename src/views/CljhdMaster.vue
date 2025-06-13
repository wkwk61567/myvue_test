<!-- 材料QC一覽表單據頁面 -->
<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :query="query"
      :isQueryDisabled="false"
      :add="() => goToPage(selectedRow?.['header.cljhdmst.danno'], { mode: 'add' })"
      :isAddDisabled="isAddDisabled"
      :edit="() => goToPage(selectedRow?.['header.cljhdmst.danno'], { mode: 'edit' })"
      :isEditDisabled="isEditDisabled"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :toggleAudit="toggleAudit"
      :isToggleAuditDisabled="isToggleAuditDisabled"
      :exportExcel="() => utils.exportExcel(results.value, headers.value, '材料QC一覽表單據', '材料QC一覽表單據')"
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
        <!-- 供方的小視窗 -->
        <SupplyDialog
          :dialog="dialog"
          @update:dialog="dialog = $event"
          :supplyQuery="supplyQuery"
          @update:supplyQuery="supplyQuery = $event"
          :tempSupplykind="tempSupplykind"
          @update:tempSupplykind="tempSupplykind = $event"
          :spkindnoOptionsWithEmpty="spkindnoOptionsWithEmpty"
          :filteredSuppliers="filteredSuppliers"
          @handleInputSupplyQueryAndTempSupplykind="
            handleInputSupplyQueryAndTempSupplykind
          "
          @selectSupplier="selectSupplier"
        ></SupplyDialog>
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
        style="min-width: 1200px;  max-height: 1200px; overflow-y: auto"
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
              @dblclick="goToPage(item['header.cljhdmst.danno'], { mode: 'view' })"
              :style="
                isRowSelected(item['header.cljhdmst.danno'])
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
import SupplyDialog from "@/components/SupplyDialog.vue";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useSupplyDialog } from "@/composables/useSupplyDialog.js";
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
  spkindname: null, // 收貨類別
});

const spkindnoOptions = ref([]); // 收貨類別選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: null }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項
const formSelectOptions = {
  spkindname: spkindnoOptionsWithEmpty,
}; // form中的所有選項

const {
  dialog,
  supplyQuery,
  tempSupplykind,
  filteredSuppliers,
  openDialog,
  handleInputSupplyQueryAndTempSupplykind,
} = useSupplyDialog(); // ...視窗的狀態和方法

const selectSupplier = (supplier) => {
  // 選取供方
  form.supplyno = supplier["header.supply.supplyno"];
  form.supplyname = supplier["header.supply.supplyname"];
  dialog.value = false; // 關閉...視窗
};

// 上方的欄位
const formRows = computed(() => {
  const formRowsTemp = [
    [labels.value['filter.cljhdmst.dDateStart'], labels.value['filter.cljhdmst.dDateEnd']],
    [labels.value['filter.cljhdmst.danno'], labels.value['filter.cljhdmst.dannobase']],
    [
      // 供方編碼(componentType: icon-text-field)
      {
        ...labels.value["filter.cljhdmst.supplyno"],
        icon: "mdi-dots-horizontal-circle",
        onClick: openDialog,
      },
      // 供方名稱(componentType: icon-text-field)
      {
        ...labels.value["filter.supply.supplyname"],
        icon: "mdi-dots-horizontal-circle",
        onClick: openDialog,
      },
    ],
    [labels.value['filter.cljhdmst.spkindname']]
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
} = useCheckButtonFlags("cldhd", form.audit);

const { selectedRow, selectRow, isRowSelected } = useSelectRow("header.cljhdmst.danno"); // 選取row相關的變數和函式

const results = ref([]); // 查詢結果

const query = async () => {
  // 查詢cljhdmst
  const params = {
    dDateStart: form.dDateStart,
    dDateEnd: form.dDateEnd,
    danno: form.danno,
    dannobase: form.dannobase,
    supplyno: form.supplyno,
    spkindname: form.spkindname,
  };

  console.log("查詢條件：", params);
  results.value = await utils.fetchData("cljhdMaster.php", params);
  console.log("查詢結果：", results.value);

  utils.formatDateTimeFields(results.value, labels.value); // 轉換日期和時間欄位
};

const { goToPage } = useGoToPage("/cljhdDetails", selectedRow, "header.cljhdmst.audit"); // 跳轉到明細頁面的函式

const deleteOrder = async () => {
  // 廢單
  if (selectedRow.value === null) {
    alert("請選擇一筆資料");
    return;
  }
  if (
    selectedRow.value["header.cljhdmst.audit"] === null ||
    selectedRow.value["header.cljhdmst.audit"] === ""
  ) {
    if (confirm("您確定要刪除整張單據嗎?")) {
      const params = {
        danno: selectedRow.value["header.cljhdmst.danno"],
      };
      const data = await utils.fetchData("cljhdDetails.php", params); //透過api獲取該筆單據的資料
      const resultsData = data["cljhditm"]; // 獲取明細資料
      //console.log("明細資料:", resultsData);
      for (let item of resultsData) {
        await utils.cljhdDelete(
          selectedRow.value["header.cljhdmst.danno"],
          item["header.cljhditm.id"]
        );
      }
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
    selectedRow.value["header.cljhdmst.audit"] === null ||
    selectedRow.value["header.cljhdmst.audit"] === "";
  const params = {
    danno: selectedRow.value["header.cljhdmst.danno"],
    table: "cljhdmst",
    formno: "cljhd",
  };

  await utils.auditOrder(isAudit, params);
  await query(); // 重新載入表格
  selectedRow.value = null; // 清除選擇
};

onMounted(async () => {
  spkindnoOptions.value = await utils.fetchCategories(); // 獲取收貨類別
  checkButtonFlags();
});



</script>

<style src="@/assets/vCustom.css" scoped></style>