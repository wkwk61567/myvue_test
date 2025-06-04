<template>
  <v-container style="max-width: none">
    <ButtonsCRUDP
      :add="() => setMode('add')"
      :isAddDisabled="isAddDisabled"
      :edit="() => setMode('edit')"
      :isEditDisabled="true"
      :deleteOrder="deleteOrder"
      :isDeleteOrderDisabled="true"
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
                  :is="
                    field.componentType === 'checkbox'
                      ? 'v-checkbox'
                      : field.componentType === 'select'
                      ? 'v-select'
                      : 'v-text-field'
                  "
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
                  v-bind="
                    field.componentType === 'checkbox'
                      ? {
                          disabled: isReadonly(
                            field.inputType,
                            field.isEditable,
                            field.componentType
                          ),
                        }
                      : field.componentType === 'select'
                      ? {
                          'item-title': field.column,
                          'item-value': field.column,
                          items: formSelectOptions[field.column].value,
                        }
                      : field.componentType === 'date'
                      ? { type: 'date' }
                      : {}
                  "
                  :error="utils.isFormError(mode, field, form[field.column])"
                  @change="updateMst(field)"
                />
              </template>
            </v-col>
          </template>
        </v-row>
        <!-- 工令單物控向導的小視窗 -->
        <ScgcdDialog
          :isScgcdDialogVisible="isScgcdDialogVisible"
          @update:isScgcdDialogVisible="isScgcdDialogVisible = $event"
          :scgcdQuery="scgcdQuery"
          @update:scgcdQuery[gcdno]="scgcdQuery['gcdno'] = $event"
          @update:scgcdQuery[spno]="scgcdQuery['spno'] = $event"
          @update:scgcdQuery[status]="scgcdQuery['status'] = $event"
          @update:scgcdQuery[flag]="scgcdQuery['flag'] = $event"
          @update:scgcdQuery[spkindno]="scgcdQuery['spkindno'] = $event"
          @selectScgcd="selectScgcd"
        ></ScgcdDialog>
        <!-- 材料的小視窗 -->
        <SpDialog
          :isSpDialogVisible="isSpDialogVisible"
          @update:isSpDialogVisible="isSpDialogVisible = $event"
          :spQuery="spQuery"
          @update:spQuery[spno]="spQuery.spno = $event"
          @update:spQuery[spspec]="spQuery.spspec = $event"
          @update:spQuery[matno]="spQuery.matno = $event"
          @update:spQuery[spunit]="spQuery.spunit = $event"
          :spFiltered="spFiltered"
          @handleInputSpQuery="
            handleInputSpQuery
          "
          @selectSp="selectSp"
        ></SpDialog>
      </v-card-text>
    </v-card>

    <!-- 查詢結果顯示區塊：自定義 header 插槽 -->
    <!-- disable-pagination 停用分頁功能 
      hide-default-footer 隱藏預設的頁尾 
      items-per-page="-1" 顯示所有資料
      fixed-header 固定表頭
       -->
    <v-card class="mt-4">
      <v-data-table
        :headers="displayHeaders"
        :items="results"
        disable-pagination
        hide-default-footer
        :items-per-page="-1"
        no-data-text="No data available"
        style="max-height: 400px; overflow-x: auto; overflow-y: auto"
        height="400px"
      >
        <!-- 自定義 header 插槽，強制渲染表頭 -->
        <template v-slot:headers>
          <tr>
            <th v-for="header in displayHeaders" :key="header.key">
              {{ header.title }}
            </th>
          </tr>
        </template>

        <!-- 自定義每一行資料 -->
        <template v-slot:item="{ item }">
          <v-hover v-slot:default="{ isHovering, props: hoverProps }">
            <tr
              v-bind="hoverProps"
              :style="isHovering ? { backgroundColor: '#f5f5f5' } : {}"
            >
              <!-- 刪除按鈕 -->
              <template v-if="mode !== 'view'">
                <td :style="{ 'font-size': '24px' }">
                  <v-btn icon @click="deleteRow(item)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </template>
              <!-- 使用迴圈動態生成表格的欄位 -->
              <!-- 用v-if和v-else-if做特殊處理 -->
              <template v-for="header in headers" :key="header.key">
                <td
                  v-if="header.key === 'header.clllditm.gcdno'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    readonly
                    :append-inner-icon="
                      mode !== 'view' ? 'mdi-dots-horizontal-circle' : null
                    "
                    @click:append-inner="openScgcdDialog()"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.clllditm.spno'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    readonly
                    :append-inner-icon="
                      mode !== 'view' ? 'mdi-dots-horizontal-circle' : null
                    "
                    @click:append-inner="
                      openScgcdDialog(item['header.clllditm.gcdno'])
                    "
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.clllditm.sqpcs'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :readonly="
                      mode === 'view' || isFieldDisabled(item, header.key)
                    "
                    @change="
                      utils.handleField(item, header.key);
                      updateItm(item, header.key);
                    "
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.clllditm.pcs'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :readonly="
                      mode === 'view' || isFieldDisabled(item, header.key)
                    "
                    @change="
                      utils.handleField(item, header.key);
                      updateItm(item, header.key);
                    "
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.clllditm.pcsnx'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :readonly="
                      mode === 'view' || isFieldDisabled(item, header.key)
                    "
                    @change="
                      utils.handleField(item, header.key);
                      updateItm(item, header.key);
                    "
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.clllditm.cbprice'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :readonly="
                      mode === 'view' || isFieldDisabled(item, header.key)
                    "
                    @change="
                      utils.handleField(item, header.key);
                      updateItm(item, header.key);
                    "
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.clllditm.note'"
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :readonly="
                      mode === 'view' || isFieldDisabled(item, header.key)
                    "
                    @change="updateItm(item, header.key)"
                  ></v-text-field>
                </td>
                <td
                  v-else
                  :style="{
                    backgroundColor: INPUT_COLOR[labels[header.key].inputType],
                  }"
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
              <td v-else :style="{ backgroundColor: INPUT_COLOR['fixed'] }">
                <!-- 不需要加總的欄位保持空白 -->
              </td>
            </template>
          </tr>
        </template>
      </v-data-table>
      <!-- 下方的加號 -->
      <template v-if="mode !== 'view'">
        <div class="container">
          <v-btn
            class="plus-button"
            color="primary"
            @click="openScgcdDialog()"
            :disabled="!isFormComplete || isAnyFieldInvalid"
            >+</v-btn
          >
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  onMounted,
  inject,
  watch,
  nextTick,
} from "vue";
import { useRouter } from "vue-router";
import { INPUT_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import ButtonsSaveDiscard from "@/components/ButtonsSaveDiscard.vue";
import ScgcdDialog from "@/components/ScgcdDialog.vue";
import SpDialog from "@/components/SpDialog.vue";
import * as XLSX from "xlsx";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
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
  danno: props.danno, // 領料單號, 從url接收
  kind: "", // 類別
  dannobase: "", // 原始單號
  ddate: "", // 日期
  demo: "", // 備註
  maker: "", // 制單
  audit: "", // 審核
});

const formSelectOptions = {
  kind: ref(["生產領料", "生產制損", "外發領料", "包材領料"]), // 類別選項
};

// 工令單物控向導的小視窗的狀態和方法
const isScgcdDialogVisible = ref(false); // 工令單物控向導的小視窗的顯示狀態
const scgcdQuery = reactive({
  gcdno: "",
  spno: "",
  status: "pending", // 預設查詢狀態為未完成
  flag: "",
  spkindno: "",
}); // 工令單查詢條件
// 調用發料單
const openScgcdDialog = (gcdno = "") => {
  // 打開工令單物控向導的小視窗(調用發料單)
  scgcdQuery.gcdno = gcdno;
  isScgcdDialogVisible.value = true;
};
const selectScgcd = (item) => {
  // 選擇工令單
  let tempItem = {};
  tempItem["header.clllditm.id"] = ++idCurrent.value;
  tempItem["header.clllditm.gcdno"] = item["header.scgcdmst.gcdno"];
  tempItem["header.clllditm.spno"] = item["header.scgcditm.spno"];
  tempItem["header.sp.splk"] = item["NA.sp.splk"];
  tempItem["header.sp.spspec"] = item["header.sp.spspec"];
  tempItem["header.sp.spunit"] = item["NA.sp.spunit"];
  tempItem["header.clllditm.kcpcs"] = item["NA.sp.pcs"];
  tempItem["header.clllditm.kcpcsnx"] = item["NA.sp.pcsnx"];
  if (form.kind === "生產領料" || form.kind === "外發領料") {
    // 外發領料目前沒有在使用了
    tempItem["header.clllditm.yfpcs"] = item["header.NA.notpcs"];
  } else if (form.kind === "生產制損") {
    tempItem["header.clllditm.yfpcs"] = item["header.scgcditm.yfpcs"];
  } else {
    tempItem["header.clllditm.yfpcs"] = 0;
  }
  tempItem["header.clllditm.sqpcs"] = 0;
  tempItem["header.clllditm.pcs"] = 0;
  tempItem["header.clllditm.pcsnx"] = 0;
  tempItem["header.clllditm.cbprice"] = 0;
  tempItem["header.NA.pay"] = 0;
  tempItem["header.clllditm.note"] = "";
  console.log("選擇的工令單資料：", tempItem);
  results.value.push(tempItem); // 新增一行

  isScgcdDialogVisible.value = false; // 關閉工令單物控向導的小視窗
};

// 材料的小視窗的狀態和方法, 應該可以放到composables
const isSpDialogVisible = ref(false); // 材料的小視窗的顯示狀態
const spQuery = reactive({
  spno: "",
  spspec: "",
  matno: "",
  spunit: "",
  spkindname: "",
}); // 材料查詢條件
const sp = ref([]); // 材料查詢結果
const spFiltered = ref([]); // 過濾過的材料查詢結果

const  openSpDialog = async (item)  => {
  // 打開材料查詢介面
  selecrRow = item; // 直接點選表格中的材料編碼時，儲存選取的行

  // 每次材料查詢介面打開時，需清空查詢欄位，否則會殘留前次輸入的內容
  spQuery.spno = "";
  spQuery.spspec = "";
  spQuery.matno = "";
  spQuery.spunit = "";
  spQuery.spkindname = spkindname.value;
  
  // 調用訂單查詢
  if (!form.supplyno) {
    console.error("供方編碼為空");
  } else {
    const params = {
      spkindno: spkindno.value,
      supplyno: form.supplyno,
    };
    sp.value = await utils.fetchData("sp.php", params);
    console.log("材料查詢結果：", sp.value);
  }
  spFiltered.value = sp.value; // 初始化材料列表
  isSpDialogVisible.value = true; // 打開材料查詢介面
}
const handleInputSpQuery = () => {
  console.log("spQuery:", spQuery);
  // 處理材料查詢, 根據查詢條件過濾材料列表
  if (
    spQuery.spno.trim() === "" &&
    spQuery.spspec.trim() === "" &&
    spQuery.matno.trim() === "" &&
    spQuery.spunit.trim() === ""
  ) {
    spFiltered.value = sp.value;
  } else {
    spFiltered.value = sp.value.filter(
      (item) =>
        (spQuery.spno.trim() === "" ||
          (item["header.sp.spno"] &&
            item["header.sp.spno"]
              .toUpperCase()
              .includes(spQuery.spno.toUpperCase()))) &&
        (spQuery.spspec.trim() === "" ||
          (item["header.sp.spspec"] &&
            item["header.sp.spspec"]
              .toUpperCase()
              .includes(spQuery.spspec.toUpperCase()))) &&
        (spQuery.matno.trim() === "" ||
          (item["header.sp.matno"] &&
            item["header.sp.matno"]
              .toUpperCase()
              .includes(spQuery.matno.toUpperCase()))) &&
        (spQuery.spunit.trim() === "" ||
          (item["header.sp.spunit"] &&
            item["header.sp.spunit"]
              .toUpperCase()
              .includes(spQuery.spunit.toUpperCase())))
    );
  }
  console.log("spFiltered:", spFiltered.value);
};
const selectSp = async (item) => {
  // 選取材料
  console.log("選取的材料：", item);
  return; // 未完成
  
  let tempItem = {};
  tempItem["header.cldhditm.spno"] = item["header.sp.spno"]; // 材料編碼
  tempItem["header.sp.spspec"] = item["header.sp.spspec"]; // 規格
  tempItem["header.sp.spcd"] = item["header.sp.spcd"]; // 產地
  tempItem["header.sp.spunit"] = item["header.sp.spunit"]; // 單位
  tempItem["header.cldhditm.payno"] = item.payno; // 幣別
  tempItem.clkind = item.clkind; // 材料類別(不可見)
  tempItem.dz = item.dz; // 單重(不可見)
  // 單價
  if (spkindno.value === 3) {
    if (item.clkind === '卷料') {
      console.log("卷料價格");
      if (item.pricekg1 > 0 || item.pricekg2 > 0) {
        tempItem["header.cldhditm.price"] = "";
      } else {
        tempItem["header.cldhditm.price"] = item.pricekg; 
      }
    } else {
      if (item.price1 > 0 || item.price2 > 0) {
        tempItem["header.cldhditm.price"] = "";
      } else {
        tempItem["header.cldhditm.price"] = item.price;
      }
    }
  } else {
    tempItem["header.cldhditm.price"] = item.price;
  }
  if (selecrRow === null) {
    // 新增一行
    tempItem["NA.cldhditm.id"] = ++idCurrent.value; // 新增一行的 id
    tempItem["header.cldhditm.danid"] = `${form.danno}_${idCurrent.value}`; // 訂單號碼
    results.value.push(tempItem); // 新增一行
  } else {
    // 重選材料編碼，並替換相關的欄位
    Object.keys(tempItem).forEach(key => {
      selecrRow[key] = tempItem[key];
    });
    console.log("替代的行：", selecrRow);
  }
  console.log("tempItem:", tempItem);
  isSpDialogVisible.value = false; // 關閉材料查詢視窗
  await nextTick(); // 等待DOM更新後，將焦點設置到新添加的行
  focusNextInvalidField(tempItem); // 將焦點移到下一個未填寫的欄位
};

const results = ref([]); // 查詢結果(表格的內容)
const idLastInDB = ref("0"); // 最後一筆已儲存的row的 id 用來分隔原有的row和新增的row
const idCurrent = ref(0); // 目前最新的一筆row的 id

const reset = () => {
  // 重設所有欄位(原本會在initializeData中加載的變數)
  form.danno = "";
  form.kind = "";
  form.dannobase = "";
  form.ddate = "";
  form.demo = "";
  form.maker = "";
  form.audit = "";
  results.value = [];
  idLastInDB.value = "0"; // 重置最後一筆已儲存的row的 id
  idCurrent.value = 0; // 重置目前最新的一筆row的 id

  Object.keys(form).forEach((key) => {
    formPreviousValues[key] = form[key];
  }); // 紀錄form欄位的值

  resultsPreviousValues = {};
  results.value.forEach((item) => {
    resultsPreviousValues[item["NA.clllditm.id"]] = { ...item };
  }); // 紀錄results的值
};

const orderInDBNum = ref(0); // 原本的行數，用來判斷是不是只剩一個row，是的話會在刪除此row後刪除整張收貨單

const mode = ref("view"); // 當前模式，默認為查看模式
const setMode = async (newMode) => {
  // 設定模式
  if (newMode === "add") {
    // 設定為新增模式
    reset(); // 重設所有欄位

    [form.ddate] = utils.getCurrentDateTime(); // 取得當前日期

    //  取得流水號(danno)
    const params = {
      prefix: `D_ML`,
      table: "cllldmst",
    };
    const data = await utils.fetchData("getSerialNumber.php", params);
    form.danno = data[0].NewDanno;

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
};

const columnsForSum = ref([
  "header.clllditm.yfpcs",
  "header.clllditm.sqpcs",
  "header.clllditm.pcs",
  "header.clllditm.pcsnx",
  "header.clllditm.pay",
]); // 需要加總的欄位名稱

const displayHeaders = computed(() => {
  const currentHeaders = [...headers.value];
  if (mode.value !== "view") {
    currentHeaders.unshift({ title: "", key: "deleteButton" });
  }
  return currentHeaders;
}); // 加入編輯和刪除按鈕

const initializeData = async () => {
  // 加載表格內的資料
  const params = {
    danno: form.danno,
  };

  const data = await utils.fetchData("cllldDetails.php", params); //透過api獲取資料
  console.log("查詢結果：", data);
  if (
    !data["cllldmst"] ||
    data["cllldmst"].length === 0 ||
    !data["clllditm"] ||
    data["clllditm"].length === 0
  ) {
    // 如果沒有資料, 設定顯示空白訂單

    // 只允許點擊新增和保存按鈕, 其他按鈕禁用
    isAddDisabled.value = false;
    isEditDisabled.value = true;
    isDeleteOrderDisabled.value = true;
    isToggleAuditDisabled.value = true;

    reset(); // 重設所有欄位
    return; // 如果沒有資料，則不進行後續操作
  }

  // 接收查詢結果
  results.value = data["clllditm"];

  // 排序
  results.value.sort((a, b) => {
    const idA = String(a["header.clllditm.id"] || "");
    const idB = String(b["header.clllditm.id"] || "");
    return idA.localeCompare(idB, "zh-Hant", { numeric: true });
  });

  idLastInDB.value = data["clllditm"].at(-1)["NA.clllditm.id"]; // 取得DB最後一筆的 id
  console.log("最後一筆的 id：", idLastInDB.value);
  idCurrent.value = idLastInDB.value; // 設置目前的 id 為DB最後一筆的 id

  //form.danno = data["cllldmst"][0].danno; // danno 由 url 接收
  form.kind = data["cllldmst"][0].kind;
  form.dannobase = data["cllldmst"][0].dannobase;
  form.ddate = data["cllldmst"][0].ddate.date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
  form.demo = data["cllldmst"][0].demo;
  form.maker = data["cllldmst"][0].maker;
  form.audit = data["cllldmst"][0].audit;

  orderInDBNum.value = results.value.length; // 取得原本的行數

  console.log("results:", results.value);

  Object.keys(form).forEach((key) => {
    formPreviousValues[key] = form[key];
  }); // 紀錄form欄位的值

  resultsPreviousValues = {};
  results.value.forEach((item) => {
    resultsPreviousValues[item["NA.clllditm.id"]] = { ...item };
  }); // 紀錄results的值

  await checkButtonFlags(); // 檢查按鈕狀態
};

const save = async () => {
  // 存檔到資料庫
  if (
    (parseFloat(results.value[0]["header.clllditm.pcs"]) ||
      0 + parseFloat(results.value[0]["header.clllditm.pcsnx"]) ||
      0) <= 0
  ) {
    alert("請填入實發數");
    return;
  }

  if (mode.value === "add") {
    // 檢查results是否為空
    if (results.value.length === 0) {
      alert("請先添加訂單資料");
      return;
    }
    const itm = results.value.map((item) => ({
      id: item["header.clllditm.id"],
      spno: item["header.clllditm.spno"],
      pcs: item["header.clllditm.pcs"],
      kcpcs: item["header.clllditm.kcpcs"],
      gcdno: item["header.clllditm.gcdno"],
      note: item["header.clllditm.note"],
      cbprice: item["header.clllditm.cbprice"],
      yfpcs: item["header.clllditm.yfpcs"],
      sqpcs: item["header.clllditm.sqpcs"],
      pcsnx: item["header.clllditm.pcsnx"],
      kcpcsnx: item["header.clllditm.kcpcsnx"],
    }));
    const params = {
      dannobase: form.dannobase,
      kind: form.kind,
      ddate: form.ddate,
      demo: form.demo,
      itm: itm,
    };
    const data = await utils.fetchData("cllldDetailsAdd.php", params); // 透過api新增資料
    console.log("新增資料結果 (MST)：", data);
    alert("存檔完成");

    const url = {
      path: `/cllldDetails/${form.danno}`,
    };
    await router.push(url); // 移動到新增的訂單的頁面
  } else if (mode.value === "edit") {
    return; // 未完成
    // 保存新增的row到資料庫
    const itemsToBeAdded = results.value.filter(
      (item) => item["NA.cldhditm.id"] > idLastInDB.value
    ); // 表格中新增的資料
    const itm = itemsToBeAdded.map((item) => ({
      id: item["NA.cldhditm.id"],
      spno: item["header.cldhditm.spno"],
      pcs: item["header.cldhditm.pcs"],
      payno: item["header.cldhditm.payno"],
      price: item["header.cldhditm.price"],
      gdate: item["header.cldhditm.gdate"],
      note: item["header.cldhditm.note"],
    }));
    const params = {
      danno: form.danno,
      itm: itm,
    };
    const data = await utils.fetchData("cldhditmUpdateNewRow.php", params); // 透過api更新資料
    console.log("更新資料結果：", data);
    alert("存檔完成");
  }
  await setMode("view"); // 切換到查看模式
};

let formPreviousValues = {}; // 紀錄form欄位的先前值
const updateMst = async (field) => {
  // 更新cldhdmst的欄位

  if (field.column === "ddate") {
    let today = "";
    [today] = utils.getCurrentDateTime();
    if (new Date(form[field.column]) > new Date(today)) {
      alert("日期錯誤, 不能開今天以後的單");
      form[field.column] = today;
      return;
    }
  }

  if (mode.value === "edit") {
    if (confirm(`您確定要更新${field.name}嗎?`)) {
      console.log("更新", field.column, "欄位");
      console.log("先前值:", formPreviousValues[field.column]);
      console.log("更改為:", form[field.column]);
      const params = {
        danno: form.danno,
        column: field.column,
        value: form[field.column],
      };
      const data = await utils.fetchData("cldhdmstUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      formPreviousValues[field.column] = form[field.column]; // 更新先前值
      alert("更新完成");
    } else {
      form[field.column] = formPreviousValues[field.column]; // 恢復到先前的值
    }
  }
};

let resultsPreviousValues = {}; // 紀錄results欄位的先前值
const updateItm = async (item, key) => {
  // 表格的欄位變動

  if (key === "header.clllditm.pcs" || key === "header.clllditm.pcsnx") {
    // 處理實發數欄位的變更
    if (form.kind == '生產領料' || form.kind == '外發領料') {
      // 外發領料目前沒有在使用了
      if (
        parseFloat(item["header.clllditm.pcs"]) +
          parseFloat(item["header.clllditm.pcsnx"]) >
        parseFloat(item["header.clllditm.yfpcs"])
      ) {
        alert("實發數不能大於應發數");
        item["header.clllditm.pcs"] = 0;
        item["header.clllditm.pcsnx"] = 0;
        return;
      }
    }
  }

  item["header.NA.pay"] =
    parseFloat(
      (
        parseFloat(item["header.clllditm.pcs"]) *
        parseFloat(item["header.clllditm.cbprice"])
      ).toFixed(2)
    ) || 0; // 更新金額
  
  if (mode.value === "edit") {
    // 更新資料庫

    // 新的欄位先跳過
    if (item["NA.clllditm.id"] > idLastInDB.value) {
      console.log("需要按存檔按鈕");
      return;
    }

    // 檢察欄位是否有效
    if (!isFieldValid(item, key)) {
      console.error(`欄位 ${key} 的值無效:`, item[key]);
      return;
    }

    console.log("先前值:", item[key]);
    console.log("先前值:", resultsPreviousValues[1]);
    if (confirm(`您確定要更新${labels.value[key].name}嗎?`)) {
      const params = {
        danno: form.danno,
        id: item["NA.cldhditm.id"],
        column: labels.value[key].column,
        value: item[key],
      };
      const data = await utils.fetchData("cldhditmUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      resultsPreviousValues[item["NA.cldhditm.id"]][key] = item[key]; // 更新先前值
      alert("更新完成");
    } else {
      item[key] = resultsPreviousValues[item["NA.cldhditm.id"]][key]; // 恢復到先前的值
    }
  }
};

const deleteRow = async (item) => {
  // 刪行
  if (item["NA.cldhditm.id"] <= idLastInDB.value) {
    if (item["header.cldhditm.getpcs"] > 0) {
      alert("此項已開始入倉, 不能刪行!");
      return;
    }
    const confirmMessage =
      orderInDBNum.value === 1 ? "您確定要刪除整張單據嗎?" : "您確定要刪除?";
    if (confirm(confirmMessage)) {
      const params = {
        danno: form.danno,
        id: item["NA.cldhditm.id"],
      };
      const data = await utils.fetchData("cldhdDelete.php", params); // 透過api刪除資料
      console.log("刪除資料結果：", data);
      alert("刪除完成");
      const index = results.value.findIndex(
        (result) => result["NA.cldhditm.id"] === item["NA.cldhditm.id"]
      );
      if (index !== -1) {
        results.value.splice(index, 1); // 從 results 中移除
        orderInDBNum.value = orderInDBNum.value - 1; // 更新行數
        if (orderInDBNum.value === 0) {
          setMode("view"); // 如果刪除的是最後一行, 則切換到查看模式
        }
      } else {
        console.error("Item not found in results:", item);
      }
    }
  } else {
    // 刪除調用訂單新增的row
    const index = results.value.findIndex(
      (result) => result["header.clllditm.id"] === item["header.clllditm.id"]
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
    for (let item of results.value) {
      if (item["header.cldhditm.getpcs"] > 0) {
        alert("此單已有入庫, 不能廢單!");
        return;
      }
    }
    if (confirm("您確定要刪除整張單據嗎?")) {
      try {
        for (let item of results.value) {
          const params = {
            danno: form.danno,
            id: item["NA.cldhditm.id"],
          };
          const data = await utils.fetchData("cldhdDelete.php", params); // 透過api刪除資料
          console.log("刪除資料結果：", data);
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
    table: "cllldmst",
    formno: "cllld",
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "材料發料單明細");

  // 導出文件
  XLSX.writeFile(workbook, "材料發料單明細.xlsx");
};

// 檢查按鈕是否禁用
const {
  isAddDisabled,
  isEditDisabled,
  isDeleteOrderDisabled,
  isToggleAuditDisabled,
  isExportExcelDisabled,
  checkButtonFlags,
} = useCheckButtonFlags("cllld", form.audit);
/*
// 實現凍結表頭和欄位的功能, 並動態計算最小寬度
// 以後應該可以放到composables裡面?
const stickyLeftMap = ref({}); // 用來存儲sticky的left值
const minWidthMap = ref({}); // 用來存儲最小寬度

async function calculateStickyLeft() {
  // 計算 sticky 的 left 值和個欄位的最小寬度
  let left = 0;
  let thWidth = 0;
  stickyLeftMap.value = {};
  // 依照 displayHeaders 的順序計算
  for (const header of displayHeaders.value) {
    const key = header.key;
    thWidth =
      Math.max(
        ...results.value.map((row) => String(row[key] || "").length),
        String(header.title || "").length
      ) *
        8 +
      35;
    minWidthMap.value[key] = thWidth;
    if (labels.value[key]?.isSticky) {
      stickyLeftMap.value[key] = left;
      left += thWidth;
    }
  }
}
watch([displayHeaders, results], () => nextTick(calculateStickyLeft), {
  deep: true,
}); // 在每次表頭/資料變動後重新計算 sticky 的 left 值和最小寬度

const tableCellStyles = computed(() => {
  // 儲存表格中的th和td的樣式
  const styles = {};

  displayHeaders.value.forEach((header) => {
    const key = header.key;

    // 表頭樣式
    if (labels.value[key]?.isSticky) {
      styles[`${key}_th`] = {
        position: "sticky",
        top: "0px",
        backgroundColor: "white",
        left: `${stickyLeftMap.value[key] || 0}px`,
        zIndex: 4,
        minWidth: `${minWidthMap.value[key] || 0}px`,
      };
    } else {
      styles[`${key}_th`] = {
        position: "sticky",
        top: "0px",
        backgroundColor: "white",
        zIndex: 3,
        minWidth: `${minWidthMap.value[key] || 0}px`,
      };
    }

    // 資料列樣式
    if (labels.value[key]?.isSticky) {
      styles[`${key}_td`] = {
        position: "sticky",
        left: `${stickyLeftMap.value[key] || 0}px`,
        background: INPUT_COLOR[labels.value[key]?.inputType],
        zIndex: 2,
        minWidth: `${minWidthMap.value[key] || 0}px`,
      };
    } else {
      styles[`${key}_td`] = {
        backgroundColor: INPUT_COLOR[labels.value[key]?.inputType],
        minWidth: `${minWidthMap.value[key] || 0}px`,
      };
    }
  });

  return styles;
});
*/
const formRows = computed(() => {
  const formRowsTemp = [
    [labels.value["label.cllldmst.danno"], labels.value["label.cllldmst.kind"]],
    [
      labels.value["label.cllldmst.dannobase"],
      labels.value["label.cllldmst.ddate"],
    ],
    [
      labels.value["label.cllldmst.demo"],
      labels.value["label.cllldmst.maker"],
      labels.value["label.cllldmst.audit"],
    ],
  ];
  return formRowsTemp;
}); // 上方的欄位
console.log("formRows:", formRows.value);

const isFormComplete = computed(() => {
  // 檢查mst的欄位是否有空值
  for (let row of formRows.value) {
    for (let field of row) {
      if (
        !field.isAllowBlank &&
        (form[field.column] === null || form[field.column] === "")
      ) {
        return false; // 有空值，返回false
      }
    }
  }
  return true; // 所有欄位都有值，返回true
});

// 用來驗證表格欄位是否已填寫
const fieldsRequired = computed(() => {
  const fieldsArray = [];
  for (const key in labels.value) {
    if (key.startsWith("header.") && labels.value[key].isAllowBlank !== true) {
      fieldsArray.push(key);
    }
  }
  return fieldsArray;
}); // 表格中的必填欄位
console.log("fieldsRequired:", fieldsRequired.value);
const numberRequired = [""]; // 不可為0的欄位
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

const isReadonly = (inputType, isEditable, componentType) => {
  //是否唯讀
  return (
    mode.value === "view" ||
    (mode.value === "add" &&
      inputType !== "inputable" &&
      !(inputType === "optional" && componentType === "select")) ||
    (mode.value === "edit" && !isEditable)
  );
};

// --- Lifecycle Hooks ---
onMounted(async () => {
  // 原本的created, 應該可以拿出來直接執行?

  await setMode("view");

  // 檢查 URL 參數，自動切換到對應的模式
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("mode") === "add") {
    await setMode("add");
    // 移除 URL 中的 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete("mode");
    window.history.replaceState({}, "", urlCurrent);
  } else if (urlParams.get("mode") === "edit") {
    await setMode("edit");
    // 移除 URL 中的 mode 參數
    const urlCurrent = new URL(window.location);
    urlCurrent.searchParams.delete("mode");
    window.history.replaceState({}, "", urlCurrent);
  }
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
