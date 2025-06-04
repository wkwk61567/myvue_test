<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :query="query"
      :isQueryDisabled="false"
      :add="add"
      :isAddDisabled="isAddDisabled"
      :edit="edit"
      :isEditDisabled="isEditDisabled"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :toggleAudit="toggleAudit"
      :isToggleAuditDisabled="isToggleAuditDisabled"
      :exportExcel="exportExcel"
      :isExportExcelDisabled="isExportExcelDisabled"
    />
    <!-- 搜尋表單區塊 -->
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
              @dblclick="goToDetailsPage(item['header.cldhdmst.danno'])"
              :style="
                isRowSelected(item['header.cldhdmst.danno'])
                  ? { backgroundColor: '#d3d3d3' }
                  : isHovering
                  ? { backgroundColor: '#f5f5f5' }
                  : {}
              "
            >
              <template v-for="header in headers" :key="header.key">
                <td>{{ item[header.key] }}</td>
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
import { useRouter } from "vue-router";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import SupplyDialog from "@/components/SupplyDialog.vue";
import * as XLSX from "xlsx";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useSupplyDialog } from "@/composables/useSupplyDialog.js";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";

const router = useRouter();
const selectedLanguage = inject("selectedLanguage"); // 接收selectedLanguage 作為目前顯示的語言

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 查詢條件
const form = reactive({
  dDateStart: "", // 起始日期
  dDateEnd: "", // 結束日期
  danno: "", // 收貨單號
  demo: "", // 備註
  supplyno: "", // 供方編碼
  supplyname: "", // 供方名稱
});

const spkindnoOptions = ref([]); // 收貨類別選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: "" }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項

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
    [
      labels.value["filter.cldhdmst.dDateStart"],
      labels.value["filter.cldhdmst.dDateEnd"],
    ],
    [
      labels.value["filter.cldhdmst.danno"],
      labels.value["filter.cldhdmst.demo"],
    ],
    [
      // 供方編碼(componentType: icon-text-field)
      {
        ...labels.value["filter.cldhdmst.supplyno"],
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

const results = ref([]); // 查詢結果

const query = async () => {
  // 查詢cldhdmst
  const params = {
    dDateStart: form.dDateStart,
    dDateEnd: form.dDateEnd,
    danno: form.danno,
    demo: form.demo,
    supplyno: form.supplyno,
    supplyname: form.supplyname,
  };

  console.log("查詢條件：", params);
  results.value = await utils.fetchData("cldhdMaster.php", params);
  console.log("查詢結果：", results.value);

  // 轉換時間格式
  results.value.forEach((item) => {
    item["header.cldhdmst.ddate"] = item["header.cldhdmst.ddate"]
      ? item["header.cldhdmst.ddate"].date.split(" ")[0]
      : "";
    item["header.cldhdmst.dtime"] = item["header.cldhdmst.dtime"]
      ? item["header.cldhdmst.dtime"].date.split(".")[0]
      : "";
    item["header.cldhdmst.auditdtime"] = item["header.cldhdmst.auditdtime"]
      ? item["header.cldhdmst.auditdtime"].date.split(".")[0]
      : "";
  });

  // 依 header.cldhdmst.ddate 日期排序 (舊到新)
  results.value.sort((a, b) => {
    const dateA = a["header.cldhdmst.ddate"] || "";
    const dateB = b["header.cldhdmst.ddate"] || "";
    // 若日期格式為 yyyy-mm-dd，可直接比較字串
    return dateA.localeCompare(dateB);
  });
};

// 選取row相關的變數和函式
const selectedRow = ref(null); // 當前選取的row
const selectRow = (item) => {
  // 選取row
  // 使用可選鏈運算子 (?.) 來處理 selectedRow 可能為 null 的情況
  //selectedRow.value = item; // 設定選取的row

  // 如果已選取的row與點擊的row相同 則取消選取 否則選取該row
  selectedRow.value =
    selectedRow.value?.["header.cldhdmst.danno"] ===
    item["header.cldhdmst.danno"]
      ? null
      : item;
};
const isRowSelected = (dannoParam) => {
  // 判斷row是否被選取
  if (selectedRow.value === null) {
    return false;
  } else {
    return selectedRow.value["header.cldhdmst.danno"] === dannoParam;
  }
};

const add = () => {
  // 開啟明細頁面，並直接切換至新增模式

  // 使用 window.open 開啟新分頁，添加新增模式參數
  const url = router.resolve({
    path: `/cldhdDetails/${selectedRow.value?.["header.cldhdmst.danno"]}`,
    query: { mode: "add" }, // 添加新增模式參數
  }).href;
  console.log("url:", url);
  window.open(url, "_blank");

  //selectedRow.value = null; // 清除選擇
};

const goToDetailsPage = (dannoParam) => {
  // 使用 window.open 開啟新分頁
  const url = router.resolve({
    path: `/cldhdDetails/${dannoParam}`,
  }).href;
  window.open(url, "_blank");
};

const edit = () => {
  // 開啟明細頁面 且直接切換至修改模式
  if (selectedRow.value === null) {
    alert("請選擇一筆資料");
    return;
  }
  if (
    selectedRow.value["header.cldhdmst.audit"] === null ||
    selectedRow.value["header.cldhdmst.audit"] === ""
  ) {
    // 使用 window.open 開啟新分頁，添加編輯模式參數
    const url = router.resolve({
      path: `/cldhdDetails/${selectedRow.value["header.cldhdmst.danno"]}`,
      query: { mode: "edit" }, // 添加編輯模式參數
    }).href;
    console.log("url:", url);
    window.open(url, "_blank");
  } else {
    alert("此單已審核，不能修改");
  }
  //selectedRow.value = null; // 清除選擇
};

const deleteOrder = async () => {
  // 廢單
  
  if (selectedRow.value === null) {
    alert("請選擇一筆資料");
    return;
  }
  if (
    selectedRow.value["header.cldhdmst.audit"] === null ||
    selectedRow.value["header.cldhdmst.audit"] === ""
  ) {
     const itmData = await utils.fetchData("cldhdDetails.php", {danno: selectedRow.value["header.cldhdmst.danno"]}); //透過api獲取該筆單據的明細資料
      console.log("明細資料:", itmData["cldhditm"]);
    for (let item of itmData["cldhditm"]) {
      if (item["header.cldhditm.getpcs"] > 0) {
        alert("此單已有入庫, 不能廢單!");
        return;
      }
    }
    if (confirm("您確定要刪除整張單據嗎?")) {
      for (let item of itmData["cldhditm"]) {
        const params = {
          danno: selectedRow.value["header.cldhdmst.danno"],
          id: item["NA.cldhditm.id"],
        };
        const data = await utils.fetchData("cldhdDelete.php", params); // 透過api刪除資料
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
    selectedRow.value["header.cldhdmst.audit"] === null ||
    selectedRow.value["header.cldhdmst.audit"] === "";
  const params = {
    danno: selectedRow.value["header.cldhdmst.danno"],
    table: "cldhdmst",
    formno: "cldhd",
  };

  await utils.auditOrder(isAudit, params);
  await query(); // 重新載入表格
  selectedRow.value = null; // 清除選擇
};

const exportExcel = () => {
  // 將資料轉換為適合導出的格式
  const dataToExport = results.value.map((row) => {
    let newRow = {};
    headers.value.forEach((header) => {
      newRow[header.title] = row[header.key]; // 根據 key 取值並用 title 作為新鍵名
    });
    return newRow;
  });

  // 建立工作簿和工作表
  const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
    skipHeader: false,
  });

  // 設置凍結窗格(無效)
  //worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  //console.log("worksheet:", worksheet);

  // 建立工作簿並附加工作表
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "訂購單單據");

  // 導出文件
  XLSX.writeFile(workbook, "訂購單單據.xlsx");
};

onMounted(async () => {
  checkButtonFlags();
  spkindnoOptions.value = await utils.fetchCategories(); // 取得收貨類別選項
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
