<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :add="() => setMode('add')"
      :isAddDisabled="isAddDisabled"
      :edit="() => setMode('edit')"
      :isEditDisabled="isEditDisabled"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="isDeleteOrderDisabled"
      :toggleAudit="toggleAudit"
      :isToggleAuditDisabled="isToggleAuditDisabled"
      :exportExcel="exportExcel"
      :isExportExcelDisabled="isExportExcelDisabled"
      :isButtonsCRUDPVisible="mode === 'view'"
    />
    <ButtonsSaveDiscard
      :save="save"
      :isSaveDisabled="!isFormComplete || isAnyFieldInvalid"
      :discard="() => setMode('view')"
      :isButtonsSaveDiscardVisible="mode !== 'view'"
    />
    <!-- mst表單區塊 -->
    <v-card>
      <v-card-text>
        <v-row v-for="(row, rowIndex) in formRows" :key="rowIndex">
          <template v-for="field in row" :key="field.column">
            <v-col :cols="field.cols">
              <template v-if="field.componentType === 'button'">
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
                  :readonly="
                    isReadonly(
                      field.inputType,
                      field.isEditable,
                      field.componentType
                    )
                  "
                  :style="{ backgroundColor: INPUT_COLOR[field.inputType] }"
                  :append-inner-icon="field.icon"
                  @click:append-inner="field.onClick"
                  :error="utils.isFormError(mode, field, form[field.column])"
                />
              </template>
              <template v-else>
                <component
                  :is="field.componentType === 'checkbox'
                    ? 'v-checkbox'
                    : field.componentType === 'select'
                      ? 'v-select'
                      : 'v-text-field'"
                  v-model="form[field.column]"
                  :label="field.name"
                  :readonly="isReadonly(field.inputType, field.isEditable, field.componentType)"
                  :style="{ backgroundColor: INPUT_COLOR[field.inputType] }"
                  v-bind="field.componentType === 'checkbox'
                    ? { disabled: isReadonly(field.inputType, field.isEditable, field.componentType) }
                    : field.componentType === 'select'
                      ? { 'item-title': field.column, 'item-value': field.column, items: formSelectOptions[field.column].value }
                      : field.componentType === 'date'
                        ? { type: 'date' }
                        : {}"
                  @change="formChange(field)"
                  :error="utils.isFormError(mode, field, form[field.column])"
                />
              </template>
            </v-col>
          </template>
        </v-row>
        <!-- ...的小視窗 -->
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

        <!-- 調用訂單的小視窗 -->
        <CallOrderDialog
          :isCallOrderDialogVisible="isCallOrderDialogVisible"
          @update:isCallOrderDialogVisible="isCallOrderDialogVisible = $event"
          :supplyno="form.supplyno"
          :orderQuery="orderQuery"
          @update:orderQuery[danno]="orderQuery.danno = $event"
          @update:orderQuery[spno]="orderQuery.spno = $event"
          @update:orderQuery[spspec]="orderQuery.spspec = $event"
          :orderFiltered="orderFiltered"
          @handleInputOrderQuery="handleInputOrderQuery"
          @selectOrder="(item) => selectOrder(item, form.ddate)"
        ></CallOrderDialog>
      </v-card-text>
    </v-card>

    <!-- 查詢結果顯示區塊：自定義 header 插槽 -->
     <!-- disable-pagination 停用分頁功能 
      hide-default-footer 隱藏預設的頁尾 
      items-per-page="-1" 顯示所有資料
      fixed-header 固定表頭
       -->
    <v-card class="mt-4  table-scroll-card">
      <v-data-table
        :headers="displayHeaders"
        :items="results"
        disable-pagination
        hide-default-footer
        :items-per-page="-1"
        no-data-text="No data available"
        style="min-width: 1200px; max-height: 400px; overflow-y: auto"
        fixed-header
        height="400px"
      >
        <!-- 自定義 header 插槽，強制渲染表頭 -->
        <template v-slot:header>
          <thead>
            <tr>
              <th v-for="header in displayHeaders" :key="header.key">
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
              :style="isHovering ? { backgroundColor: '#f5f5f5' } : {}"
            >
               <!-- 編輯按鈕(筆或勾勾)和刪除按鈕 -->
              <template v-if="mode !== 'view'">
                <td :style="{ 'font-size': '24px' }">
                  <v-btn icon @click="editItem(item)">
                    <v-icon>{{ getEditIcon(item) }}</v-icon>
                  </v-btn>
                </td>
                <td :style="{ 'font-size': '24px' }">
                  <v-btn icon @click="deleteRow(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </template>
              <!-- 使用迴圈動態生成表格的欄位 -->
              <template v-for="header in headers" :key="header.key">
                <!-- jhpcs和jhkg做特殊處理 -->
                <td v-if="header.key === 'header.cljhditm.jhpcs'"
                  :style="{ backgroundColor: INPUT_COLOR[labels[header.key].inputType] }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    type="text"
                    :readonly="!item.isEditCljhditmClicked || isFieldDisabled(item, header.key)"
                    @change="
                      utils.handleField(item, header.key);
                      utils.setCljhditmNumbers(item, limitPercentage);
                    "
                    :error="!isFieldValid(item, header.key)"
                    :error-messages="isFocusMechanismActive && !isFieldDisabled(item, header.key) ? '必填' : null"
                    :ref="setFieldRef(`field_${item['NA.cldhditm.id']}_${header.key}`)"
                    @focus="handleFocus(item, header.key, $event.target)"
                    @blur="handleBlur(item, header.key, $event.target)"
                  ></v-text-field>
                </td>
                <td v-else-if="header.key === 'header.cljhditm.jhkg'"
                  :style="{ backgroundColor: !(item.spkindno === '3' && (item.clkind === '板料' || item.clkind === '鋁擠型')) ? INPUT_COLOR['fixed'] : INPUT_COLOR['inputable'] }">
                  <v-text-field
                    v-model="item['header.cljhditm.jhkg']"
                    type="text"
                    :readonly="!item.isEditCljhditmClicked || !(item.spkindno === '3' && (item.clkind === '板料' || item.clkind === '鋁擠型')) || isFieldDisabled(item, header.key)"
                    @change="
                      utils.handleField(item, 'header.cljhditm.jhkg');
                      utils.setCljhditmNumbers(item, limitPercentage);
                    "
                    :error="!isFieldValid(item, header.key)"
                    :error-messages="isFocusMechanismActive && !isFieldDisabled(item, header.key) ? '必填' : null"
                    :ref="setFieldRef(`field_${item['NA.cldhditm.id']}_${header.key}`)"
                    @focus="handleFocus(item, header.key, $event.target)"
                    @blur="handleBlur(item, header.key, $event.target)"
                  ></v-text-field>
                </td>
                <td v-else
                  :style="{ backgroundColor: INPUT_COLOR[labels[header.key].inputType] }"
                >
                {{ item[header.key] }}
                </td>
              </template>
            </tr>
          </v-hover>
        </template>
        <!-- 底部的加總欄位 -->
        <template v-slot:tfoot>
          <tr>
            <!-- 使用迴圈動態生成需要加總的欄位 -->
            <template v-for="header in displayHeaders" :key="header.key">
              <td
                v-if="columnsForSum.includes(header.key)"
                :style="{ backgroundColor: INPUT_COLOR['fixed'] }"
              >
                {{ utils.calculateColumnSum(results, header.key) }}
              </td>
              <td
                v-else
                :style="{ backgroundColor: INPUT_COLOR['fixed'] }"
              >
                <!-- 不需要加總的欄位保持空白 -->
              </td>
            </template>
          </tr>
        </template>
      </v-data-table>

      <!-- 下方的加號(功能與調用訂單按鈕相同) -->
      <template v-if="mode !== 'view'">
        <div class="container">
          <v-btn
            class="plus-button"
            color="primary"
            @click="() => openCallOrdersDialog(form.supplyno)"
            :disabled="!isFormComplete || isAnyFieldInvalid"
          >+</v-btn>
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject } from "vue";
import { useRouter } from "vue-router";
import { INPUT_COLOR } from "@/config.js";
import { API_BASE_URL } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import ButtonsSaveDiscard from "@/components/ButtonsSaveDiscard.vue";
import SupplyDialog from "@/components/SupplyDialog.vue";
import CallOrderDialog from "@/components/CallOrderDialog.vue";
import * as XLSX from "xlsx";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useOrderDialog } from "@/composables/useOrderDialog.js";
import { useFieldValidate } from "@/composables/useFieldValidate.js";

const props = defineProps({
  danno: String,
}); // 從url接收
const selectedLanguage = inject("selectedLanguage");
const router = useRouter();

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 上方的欄位
const form = reactive({
  danno: props.danno, // 收貨單號 從url接收
  supplyno: "", // 供方編碼
  supplyname: "", // 供方名稱
  spkindname: null, // 收貨類別，預設為空
  ckkind: null, // 倉庫類別
  dannobase: "", // 原始單號
  pjdno: "", // 驗收單號
  yjdno: "", // 請款單號 (暫不使用)
  qcnot: true, // 免檢，預設勾選
  ddate: "", // 收貨日期
  ttime: "", // 時間
  demo: "", // 備註
  maker: "", // 制單
  audit: "", // 審核
});

const spkindnoOptions = ref([]); // 收貨類別選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: "" }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項

const ckkindOptions = ref([]); // 倉庫類別選項
const formSelectOptions = {
  ckkind: ckkindOptions,
}; // form中的所有選單的選項

const results = ref([]); // 查詢結果(表格的內容)
const idLastInDB = ref("0"); // 最後一筆已儲存的row的 id 用來分隔原有的row和新增的row //
const idCurrent = ref(0); // 目前最新的一筆row的 id

const reset = () => {
  // 重設所有欄位(原本會在initializeData中加載的變數)
  form.supplyno = "";
  form.supplyname = "";
  form.spkindname = null;
  form.ckkind = null;
  form.dannobase = "";
  form.pjdno = "";
  form.qcnot = true;
  form.ddate = "";
  form.ttime = "";
  form.demo = "";
  form.maker = "";
  form.audit = "";
  results.value = [];
  ckkindOptions.value = [];
  idLastInDB.value = "0"; // 重置最後一筆已儲存的row的 id
  idCurrent.value = 0; // 重置目前最新的一筆row的 id
};

// 用來驗證表格欄位是否已填寫
const fieldsRequired = computed(() => {
  const fieldsArray = [];
  for (const key in labels.value) {
    if (key.startsWith('header.') && labels.value[key].isAllowBlank !== true) {
      fieldsArray.push(key);
    }
  }
  return fieldsArray;
}); // 表格中的必填欄位
console.log("fieldsRequired:", fieldsRequired.value);
const numberRequired = ["header.cljhditm.jhpcs", "header.cljhditm.jhkg"]; // 不可為0的欄位
const fieldRefs = reactive({});
const setFieldRef = (refName) => (el) => {
  if (el) {
    fieldRefs[refName] = el;
  }
};
const {
  isFieldValid,
  isRowFieldsValid,
  isAnyFieldInvalid,
  handleFocus,
  handleBlur,
  isFieldDisabled,
  focusNextInvalidField,
  isFocusMechanismActive,
} = useFieldValidate(results, fieldsRequired.value, numberRequired, fieldRefs);

const {
  isCallOrderDialogVisible, // 調用訂單介面(CallOrderDialog)是否顯示
  orderQuery, // 用來存儲調用訂單介面(CallOrderDialog)的訂單查詢條件
  orderFiltered, // 用來存儲過濾後的訂單列表 顯示於調用訂單介面(CallOrderDialog)
  openCallOrdersDialog, // 打開調用訂單介面(CallOrderDialog)
  handleInputOrderQuery, // 處理調用訂單介面(CallOrderDialog)的查詢條件
  selectOrder, // 暫時儲存訂單到下方的表格
} = useOrderDialog(results, idCurrent, focusNextInvalidField);

const orderInDBNum = ref(0); // 原本的行數 用來判斷是不是只剩一個row 是的話會在刪除此row後刪除整張收貨單

const mode = ref("view"); // 當前模式，默認為查看模式
const setMode = async (newMode) => { 
  // 設定模式
  if (newMode === "add") {
    // 設定為新增模式
    reset(); // 重設所有欄位
    
    [form.ddate, form.ttime] = utils.getCurrentDateTime(); // 取得當前日期和時間

    //  取得流水號(danno)
    const params = {
      prefix: "D_PC",
      table: "cljhdmst",
    };
    const dannoData = await utils.fetchData("getSerialNumber.php", params);
    form.danno = dannoData[0].NewDanno;

    // 取得製單
    const userData = await utils.fetchData("checkAuthenticated.php");
    console.log("用戶資料：", userData);
    form.maker = userData.powername;

    mode.value = "add";
  } else if (newMode === "edit") {
    // 設定為修改模式
    if (form.audit === null || form.audit === "") {
      mode.value = "edit";
    } else {
      alert("此單已審核，不能修改");
    }
  } else {
    // 設定為查看模式
    form.danno = props.danno;
    await initializeData(); // 重新加載資料
    mode.value = "view";
  }
}

// 需要加總的欄位名稱
const columnsForSum = ref([
  "header.cljhditm.dhdpcs",
  "header.cljhditm.getpcs",
  "header.cljhditm.pcs",
  "header.cljhditm.kg",
  "header.cljhditm.pcsth",
  "header.cljhditm.pay",
]);

const displayHeaders = computed(() => {
  const currentHeaders = [...headers.value];
  if (mode.value !== 'view') {
    currentHeaders.unshift({ title: "", key: "deleteButton" });
    currentHeaders.unshift({ title: "", key: "editButton" });
  }
  return currentHeaders;
}); // 加入編輯和刪除按鈕(以後的版本會把編輯按鈕移除)

const initializeData = async () => {
  // 加載表格內的資料
  const params = {
    danno: form.danno,
  };

  const data = await utils.fetchData("cljhdDetails.php", params); //透過api獲取資料
  console.log("查詢結果：", data);
  if (!data["cljhdmst"] || data["cljhdmst"].length === 0 || !data["cljhditm"] || data["cljhditm"].length === 0) { 
    // 如果沒有資料, 設定顯示空白訂單

    // 只允許點擊新增按鈕, 其他按鈕禁用
    isAddDisabled.value = false;
    isEditDisabled.value = true;
    isDeleteOrderDisabled.value = true;
    isToggleAuditDisabled.value = true;
    
    reset(); // 重設所有欄位
    return; // 如果沒有資料，則不進行後續操作
  }

  // 接收查詢結果
  results.value = data["cljhditm"];
  results.value.forEach((item) => (item.isEditCljhditmClicked = false)); // 預設不可編輯

  idLastInDB.value = data["cljhditm"].at(-1)["header.cljhditm.id"]; // 取得DB最後一筆的 id
  console.log("最後一筆的 id：", idLastInDB.value);
  idCurrent.value = idLastInDB.value; // 設置目前的 id 為DB最後一筆的 id
  
  form.ddate = data["cljhdmst"][0].ddate.date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
  form.ttime = data["cljhdmst"][0].ttime;
  form.spkindname = data["cljhdmst"][0].spkindname;
  form.dannobase = data["cljhdmst"][0].dannobase;
  form.ckkind = data["cljhdmst"][0].ckkind;
  form.supplyno = data["cljhdmst"][0].supplyno;
  form.supplyname = data["cljhdmst"][0].supplyname;
  form.pjdno = data["cljhdmst"][0].pjdno;
  form.demo = data["cljhdmst"][0].demo;
  form.maker = data["cljhdmst"][0].maker;
  form.audit = data["cljhdmst"][0].audit;
    
  ckkindOptions.value = await utils.fetchCkkindOptions(
    form.spkindname,
    spkindnoOptions.value
  ); // 取得對應的倉庫類別選項
  console.log("ckkindOptions:", ckkindOptions.value);
  orderInDBNum.value = results.value.length; // 取得原本的行數
  console.log("results:", results.value);
  await checkButtonFlags(); // 檢查按鈕狀態
};

// 下面與...按鈕相關的變數與三個函式應該可以移到composables裡面?
const dialog = ref(false); // ...的小視窗是否顯示, 應該改叫openQuerySupplyDialog
const supplyQuery = ref(""); // 用來存儲供方查詢條件
const tempSupplykind = ref(""); // 用來存儲供方類別查詢條件
const suppliers = ref([]); // 用來存儲從API獲取的供方資料
const filteredSuppliers = ref([]); // 用來存儲過濾後的供方列表

const openDialog = async () => {
  // 開啟...的小視窗 應該改叫openQuerySupplyDialog
  supplyQuery.value = ""; // 清空查詢條件
  tempSupplykind.value = ""; // 清空查詢條件

  try {
    const response = await fetch(`${API_BASE_URL}/api/suppliers.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // 憑證
    });
    const data = await response.json();
    console.log("查詢結果：", data);
    suppliers.value = data;
    filteredSuppliers.value = suppliers.value; // 初始化過濾列表為所有供方
  } catch (error) {
    console.error("查詢失敗", error);
  }

  dialog.value = true; // 顯示小視窗
};

const handleInputSupplyQueryAndTempSupplykind = () => {
  // 處理供方查詢介面的查詢條件
  filteredSuppliers.value = utils.filterSuppliers(
    suppliers.value,
    supplyQuery.value,
    tempSupplykind.value
  ); // 根據查詢條件過濾供方列表
};

const selectSupplier = async (supplier) => {
  // 用戶選擇供方編碼後，將編碼放入供方編碼欄位
  form.supplyno = supplier["header.supply.supplyno"];
  form.supplyname = supplier["header.supply.supplyname"];
  form.spkindname = supplier["header.supply.supplykind"]; // 設定收貨類別為供方類別
  ckkindOptions.value = await utils.fetchCkkindOptions(
    form.spkindname,
    spkindnoOptions.value
  ); // 取得對應的倉庫類別選項
  form.ckkind = ""; // 倉庫類別預設為空
  dialog.value = false; // 關閉小視窗
};

const save = async () => {
  // 存檔到資料庫

   // 檢查results是否為空
   if (results.value.length === 0) {
    alert("請先添加訂單資料");
    return;
  }

  if (mode.value === "edit") {
    console.log("更新資料庫中的mst");
    // 更新資料庫中的mst
    const params = {
      danno: form.danno,
      ckkind: form.ckkind,
      dannobase: form.dannobase,
      pjdno: form.pjdno,
      ddate: form.ddate,
      demo: form.demo,
    };
    //console.log("傳送 (Update MST):", params);
    const data = await utils.fetchData(
      "cljhdDetailsUpdate.php",
      params
    ); // 透過api獲取資料
    console.log("更新資料結果 (MST)：", data);
  }

  // 處理表格中新增的資料
  const itemsToBeAdded = results.value.filter(item => item["header.cljhditm.id"] > idLastInDB.value);

  if (itemsToBeAdded.length > 0) {
    // 只保存新增的row
    
    idCurrent.value = idLastInDB.value; // 重頭計算id
    // 逐行新增
    for (let item of itemsToBeAdded) {
      const params = {
        ddate: form.ddate,
        supplyno: form.supplyno,
        pjdno: form.pjdno,
        ckkind: form.ckkind,
        spkindname: form.spkindname,
        qcnot: form.qcnot,
        danno: form.danno,
        dannobase: form.dannobase,
        demo: form.demo,
        id: ++idCurrent.value, // 使用並遞增計數器
        dhdno: item["header.cljhditm.dhdno"],
        dhdid: item["header.cljhditm.dhdid"],
        spno: item["header.cljhditm.spno"],
        jhpcs: item["header.cljhditm.jhpcs"],
        jhkg: item["header.cljhditm.jhkg"],
      };

      //console.log("傳送 (Add ITM):", params);
      const data = await utils.fetchData(
        "cljhdDetailsAdd.php",
        params
      ); // 透過api獲取資料
      console.log("新增資料結果：", data);
    }
  }
  alert("存檔完成");

  if (mode.value === "add") {
    const url = {
        path: `/cljhdDetails/${form.danno}`,
    };
    await router.push(url); // 移動到新增的訂單的頁面
  }

  await setMode("view"); // 切換到查看模式
};

const editItem = async (item) => {
  // 編輯按鈕
  // row左側的編輯按鈕(筆或打勾的圖案)
  console.log("header.cljhditm.id", item["header.cljhditm.id"]);
  if (item["header.cljhditm.id"] <= idLastInDB.value) {
    console.log("Editing existing item, ID:", item["header.cljhditm.id"]);
    if (item.isEditCljhditmClicked) {
      // 儲存更新

      if (!isRowFieldsValid(item)) {
        alert("請輸入暫收數量及暫收重量，且暫存數量不為0");
        return;
      }
      const params = {
        danno: form.danno,
        id: item["header.cljhditm.id"],
        jhpcs: item["header.cljhditm.jhpcs"],
        jhkg: item["header.cljhditm.jhkg"],
      };
      console.log("傳送 (Update Row):", params);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/cljhdDetailsUpdateRow.php`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include", // 憑證
            body: JSON.stringify(params),
          }
        );
        const data = await response.json();
        console.log("伺服器回傳內容 (Update Row):", data);
        alert("更新完成");
      } catch (error) {
        console.error("更新資料失敗 (Update Row)", error);
        alert("更新失敗");
      }
    }
    item.isEditCljhditmClicked = !item.isEditCljhditmClicked; // 切換編輯狀態
  } else {
     console.log("Cannot edit newly added item before saving, ID:", item["header.cljhditm.id"]);
     // 對於新增的項目，編輯按鈕不需要做任何事
  }
  console.log("isEditCljhditmClicked", item.isEditCljhditmClicked);
};

const getEditIcon = (item) => {
  // 編輯按鈕的圖示
  if (item["header.cljhditm.id"] <= idLastInDB.value) {
    if (item.isEditCljhditmClicked) {
      return "mdi-check";
    } else {
      return "mdi-pencil";
    }
  } else {
    // 新增的項目，在保存前可能不需要顯示編輯/保存圖標
    return ""; // 或者根據需求返回特定圖標
  }
};

const deleteRow = (item) => {
  // 刪行
  if (item["header.cljhditm.id"] <= idLastInDB.value) {
    if (item["header.cljhditm.pcs"] > 0) {
      alert("此項已品管入庫,不能刪除!");
      return;
    } else {
      //目前預設免檢是打勾的, 所有保存的訂單都會自動入庫, 無法單行刪除
      alert("目前預設免檢是打勾的, 所有保存的訂單都會自動入庫, 無法單行刪除");
      /*
      const confirmMessage =
      orderInDBNum.value === 1 ? "您確定要刪除整張單據嗎?" : "您確定要刪除?";
      if (confirm(confirmMessage)) {
        utils.cljhdDelete(form.danno, item["header.cljhditm.id"]); // 從資料庫刪除
        alert("刪除完成");
        const index = results.value.findIndex(
          (result) =>
            result["header.cljhditm.id"] === item["header.cljhditm.id"]
        );
        if (index !== -1) {
          results.value.splice(index, 1); // 從 results 中移除
          orderInDBNum.value = orderInDBNum.value - 1; // 更新行數
          if (orderInDBNum.value === 0) {
            //setMode("view"); // 如果刪除的是最後一行, 則切換到查看模式
          }
        } else {
          console.error("Item not found in results:", item);
        }
      }
      */
    }
  } else {
    // 刪除調用訂單新增的row
    const index = results.value.findIndex(
      (result) =>
        result["header.cljhditm.id"] === item["header.cljhditm.id"]
    );
    if (index !== -1) {
      // 從 results 中移除該項
      results.value.splice(index, 1);
    } else {
      console.error("Item not found in results:", item);
    }
  }
};

const deleteOrder = async () => {
  // 廢單
  if (form.audit === null || form.audit === "") {
    if (confirm("您確定要刪除整張單據嗎?")) {
      try {
        for (let item of results.value) {
          await utils.cljhdDelete(form.danno, item["header.cljhditm.id"]);
        }
        alert("刪除完成");
        initializeData(); // 重新加載資料
      } catch (error) {
        console.error("刪除單據時發生錯誤:", error);
        alert("刪除失敗");
      }
    }
  } else {
    alert("此單已審核，不能刪除");
  }
};

const toggleAudit = async () => {
  // 審核(反審核)
  const isAudit = form.audit === null || form.audit === "";
  const params = {
    danno: form.danno,
    table: "cljhdmst",
    formno: "cljhd",
  };

  await utils.auditOrder(isAudit, params); // 切換資料庫中的審核狀態
  await initializeData(); // 重新加載資料

  await checkButtonFlags(); // 審核狀態改變後，重新檢查按鈕狀態
};

const exportExcel = () => {
  // 導出 Excel 檔案

  // 將資料轉換為適合導出的格式
  const dataToExport = results.value.map((row) => {
    let rowNew = {};
    headers.value.forEach((header) => { 
      if (header.title !== "") {
        rowNew[header.title] = row[header.key]; // 根據 key 取值並用 title 作為新鍵名
      }
    });
    return rowNew;
  });

  // 建立工作簿和工作表
  const worksheet = XLSX.utils.json_to_sheet(dataToExport, {
    skipHeader: false,
  });

  // 手動添加標題列
  const headerTitles = headers.value.map((header) => header.title);
  XLSX.utils.sheet_add_aoa(worksheet, [headerTitles], { origin: "A1" });

  // 建立工作簿並附加工作表
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "收貨單明細");

  // 導出文件
  XLSX.writeFile(workbook, "收貨單明細.xlsx");
};

// 檢查按鈕是否禁用
const {
  isAddDisabled,
  isEditDisabled,
  isDeleteOrderDisabled,
  isToggleAuditDisabled,
  isExportExcelDisabled,
  checkButtonFlags,
} = useCheckButtonFlags("cljhd", form.audit);

const isReadonly = (inputType, isEditable, componentType) => {
  //是否唯讀
  return mode.value === 'view' ||
    (mode.value === 'add' && inputType !== 'inputable' && !(inputType==='optional'&& componentType==='select')) ||
    (mode.value === 'edit' && !isEditable)
}
console.log("isReadonly:", labels.value['label.cljhdmst.supplyno']);

// 上方的欄位
const formRows = computed(() => {
  const formRowsTemp = [
    [
      // 特殊機制需要在這裡自己定義
      // 供方編碼(componentType: icon-text-field)
      {
        ...labels.value['label.cljhdmst.supplyno'],
        componentType: "icon-text-field",
        icon: (mode.value === "add" && !isAnyFieldInvalid.value) ?"mdi-dots-horizontal-circle" : null,
        onClick: openDialog,
      },
      // 調用訂單按鈕
      {
        column: 'callOrder',
        componentType: 'button',
        isAllowBlank: true,
        cols: '1',
        onClick: () => openCallOrdersDialog(form.supplyno),
        disabled: () => mode.value === 'view' || isAnyFieldInvalid.value || !isFormComplete.value,
        name: labels.value["button.NA.callOrder"].name
      },
      labels.value['label.cljhdmst.ckkind'],
      labels.value['label.cljhdmst.danno'],
    ],
    [labels.value['label.supply.supplyname'], labels.value['label.cljhdmst.spkindname'], labels.value['label.cljhdmst.dannobase']],
    [labels.value['label.cljhdmst.pjdno'], labels.value['label.cljhdmst.yjdno'], labels.value['label.cljhdmst.qcnot'], labels.value['label.cljhdmst.ddate'], labels.value['label.cljhdmst.ttime']],
    [labels.value['label.cljhdmst.demo'], labels.value['label.cljhdmst.maker'], labels.value['label.cljhdmst.audit']],
  ];
  return formRowsTemp;
});
console.log("formRows:", formRows.value);

const formChange = (field) => {
  // 當表單欄位變更時觸發
  if (field.column === 'ddate') {
    let today = "";
    [today] = utils.getCurrentDateTime();
    if (new Date(form[field.column] ) > new Date(today)) {
      alert("日期錯誤, 不能開今天以後的單");
      form[field.column] = today;
      return;
    }
  }
};

const isFormComplete = computed(() => {
  // 以後其他頁面可能也會用到, 到時候應該可以移到utils裡面
  // 檢查mst的欄位是否有空值
  for (let row of formRows.value) {
    for (let field of row) {
      if (!field.isAllowBlank && (form[field.column] === null || form[field.column] === "")) {
        return false; // 有空值，返回false
      }
    }
  }
  return true; // 所有欄位都有值，返回true
});

const limitPercentage = ref(0); // 收貨數量的限制百分比

// --- Lifecycle Hooks ---
onMounted(async () => {
  // 原本的created, 應該可以拿出來直接執行?

  spkindnoOptions.value = await utils.fetchCategories(); // 取得收貨類別選項
  console.log("spkindnoOptions:", spkindnoOptions.value);

  // 取得限制百分比
  // view mode 時不需要
  const limitPercentageData = await utils.fetchData("getLimitPercentage.php", {});
  limitPercentage.value = limitPercentageData[0];
  console.log("限制百分比：", limitPercentage.value);

  await setMode("view");
  // 檢查 URL 參數，自動切換到對應的模式
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("mode") === "add") {
    await setMode("add");
    // 移除 URL 中的 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete('mode');
    window.history.replaceState({}, '', urlCurrent);
  } else if (urlParams.get("mode") === "edit") {
    await setMode("edit");
    // 移除 URL 中的 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete('mode');
    window.history.replaceState({}, '', urlCurrent);
  }
});

</script>

<style src="@/assets/vCustom.css" scoped></style>