<!-- 材料發料單明細頁面 -->
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
      :exportExcel="() => utils.exportExcel(results.value, headers.value, '材料發料單明細', '材料發料單明細')"
      :isExportExcelDisabled="isExportExcelDisabled"
      :isButtonsCRUDPVisible="mode === 'view'"
    />
    <ButtonsSaveDiscard
      :save="save"
      :isSaveDisabled="!isFormComplete || isAnyFieldInvalid"
      :discard="() => setMode('view')"
      :isButtonsSaveDiscardVisible="mode !== 'view'"
    />
    <!-- form區塊 -->
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
                <!-- 目前這個頁面沒有用到 -->
                <v-text-field
                  v-model="form[field.column]"
                  :label="field.name"
                  :readonly="
                    utils.isReadonly(
                      mode,
                      field.inputType,
                      field.isEditable,
                      field.componentType
                    )
                  "
                  :style="{ backgroundColor: INPUT_COLORS[field.inputType] }"
                  :append-inner-icon="field.icon"
                  @click:append-inner="field.onClick"
                  :error="isFormError(mode, field, form[field.column])"
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
                    field.isReadonly ? field.isReadonly ():
                    utils.isReadonly(
                      mode,
                      field.inputType,
                      field.isEditable,
                      field.componentType
                    )
                  "
                  :style="{ backgroundColor: INPUT_COLORS[field.inputType] }"
                  v-bind="
                    field.componentType === 'checkbox'
                      ? {
                          disabled: utils.isReadonly(
                            mode,
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
                  :error="isFormError(mode, field, form[field.column])"
                  @change="updateForm(field)"
                  @update:modelValue="field.componentType === 'select' ? updateForm(field) : null"
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
          @update:spQuery[spkindname]="spQuery.spkindname = $event"
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
              :style="isHovering ? { backgroundColor: HOVER_COLOR } : {}"
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
                  v-if="specialTableColumns[header.key]"
                  :style="{
                    backgroundColor: INPUT_COLORS[labels[header.key].inputType],
                  }"
                >
                  <component
                    :is="labels[header.key].componentType === 'checkbox'
                      ? 'v-checkbox'
                      : labels[header.key].componentType === 'select'
                        ? 'v-select'
                        : 'v-text-field'"
                    v-model="item[header.key]"
                    v-bind="specialTableColumns[header.key].getProps(item, header.key)"
                    v-on="specialTableColumns[header.key].getEvents(item, header.key)"
                  />
                </td>
                <td
                  v-else
                  :style="{
                    backgroundColor: INPUT_COLORS[labels[header.key].inputType],
                  }"
                  :class="labels[header.key]?.dataType === 'number' ? 'number-td' : ''"
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
                :style="{ backgroundColor: INPUT_COLORS['fixed'] }"
                :class="labels[header.key]?.dataType === 'number' ? 'number-td' : ''"
              >
                {{ utils.calculateColumnSum(results, header.key) }}
              </td>
              <td v-else :style="{ backgroundColor: INPUT_COLORS['fixed'] }">
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
            @click="form.kind === '包材領料' ? openSpDialog() : openScgcdDialog()"
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
import { INPUT_COLORS, HOVER_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import ButtonsSaveDiscard from "@/components/ButtonsSaveDiscard.vue";
import ScgcdDialog from "@/components/ScgcdDialog.vue";
import SpDialog from "@/components/SpDialog.vue";
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
  kind: ref(["生產領料", "生產制損", "外發領料", "包材領料"]), // 類別選項，資料庫中沒有對應的紀錄，所以這裡直接定義選項
}; // form中的所有選單的選項

const numberColumnsConfig = (hasValidation = false) => ({
  // 數字欄位的通用配置
  getProps: (item, headerKey) => ({
    readonly: mode.value === 'view' || isFieldDisabled(item, headerKey),
    class: labels.value[headerKey]?.dataType === 'number' ? 'number-field' : '',
    ...(hasValidation && {
      error: !isRowFieldsValid(item) && labels.value[headerKey].validationGroup !== null,
      'error-messages': isRowFieldsValid(item)
        ? null
        : labels.value[headerKey].validationGroup !== null
          ? '擇一填寫'
          : null,
    }),
  }),
  getEvents: (item, headerKey) => ({
    change: () => {
      utils.handleField(item, headerKey);
      updateTable(item, headerKey);
    },
  }),
});

// 表格中需要特殊處理的欄位
const specialTableColumns = {
  'header.clllditm.gcdno': {
    getProps: (item, headerKey) => ({
      readonly: true,
      'append-inner-icon': mode.value !== 'view' ? 'mdi-dots-horizontal-circle' : null,
      class: labels.value[headerKey]?.dataType === 'number' ? 'number-field' : '',
    }),
    getEvents: (item, headerKey) => ({
      'click:append-inner': () => form.kind === '包材領料' ? null : openScgcdDialog(),
    }),
  },
  'header.clllditm.spno': {
    getProps: (item, headerKey) => ({
      readonly: true,
      'append-inner-icon': mode.value !== 'view' ? 'mdi-dots-horizontal-circle' : null,
      class: labels.value[headerKey]?.dataType === 'number' ? 'number-field' : '',
    }),
    getEvents: (item, headerKey) => ({
      'click:append-inner': () => item['header.clllditm.gcdno'] === '' ? openSpDialog(item) : openScgcdDialog(item['header.clllditm.gcdno']),
    }),
  },
  'header.clllditm.sqpcs': numberColumnsConfig(true),
  'header.clllditm.pcs': numberColumnsConfig(true),
  'header.clllditm.pcsnx': numberColumnsConfig(true),
  'header.clllditm.cbprice': numberColumnsConfig(true),
  'header.clllditm.note': {
    getProps: (item, headerKey) => ({
      readonly: mode.value === 'view' || isFieldDisabled(item, headerKey),
      class: labels.value[headerKey]?.dataType === 'number' ? 'number-field' : '',
    }),
    getEvents: (item, headerKey) => ({
      change: () => updateTable(item, headerKey),
    }),
  },
};

const netMaterialRatio = 0.8; // (llpcs + tlpcs) / yfpcs 必須小於此比例才可以做制損領料, 應該要再檢查這個數字是否合理

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

  // 當(llpcs + tlpcs) / yfpcs 超過一定的比例, 才可以做制損領料 #BusinessLogic
  if (form.kind === "生產制損" && (item["header.scgcditm.llpcs"] + item["header.scgcditm.tlpcs"]) / item["header.scgcditm.yfpcs"]
    < netMaterialRatio) {
    alert("領料數不足，不能做制損領料");
    return;
  }

  // 讀入工令單的資料到表格中
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
  tempItem["NA.sp.clkind"] = item["NA.sp.clkind"];
  console.log("選擇的工令單資料：", tempItem);

  results.value.push(tempItem); // 新增一行

  isScgcdDialogVisible.value = false; // 關閉工令單物控向導的小視窗
};

// 材料的小視窗的狀態和方法, 應該可以放到composables?
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
let selecrRow = null; // 用來儲存選取的行, 直接點選表格中的材料編碼時使用
const  openSpDialog = async (item = null)  => {
  // 打開材料查詢介面
  selecrRow = item; // 直接點選表格中的材料編碼時，儲存選取的行

  // 每次材料查詢介面打開時，需清空查詢欄位，否則會殘留前次輸入的內容
  spQuery.spno = "";
  spQuery.spspec = "";
  spQuery.matno = "";
  spQuery.spunit = "";
  spQuery.spkindname = "原材料"; // 預設查詢原材料類別
  
  // 調用訂單查詢
  const params = {
    spkindno: -1, // -1 代表查詢所有材料
    supplyno: "",
  };
  sp.value = await utils.fetchData("sp.php", params);
  //console.log("材料查詢結果：", sp.value);
  
  spFiltered.value = sp.value; // 初始化材料列表
  handleInputSpQuery(); // 處理材料查詢，過濾材料列表
  isSpDialogVisible.value = true; // 打開材料查詢介面
}
const handleInputSpQuery = () => {
  console.log("spQuery:", spQuery);
  // 處理材料查詢, 根據查詢條件過濾材料列表
  if (
    spQuery.spno.trim() === "" &&
    spQuery.spspec.trim() === "" &&
    spQuery.matno.trim() === "" &&
    spQuery.spunit.trim() === "" && 
    spQuery.spkindname.trim() === ""
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
              .includes(spQuery.spunit.toUpperCase()))) && 
        (spQuery.spkindname.trim() === "" ||
          (item["NA.spkind.spkindname"] &&
            item["NA.spkind.spkindname"]
              .toUpperCase()
              .includes(spQuery.spkindname.toUpperCase())))
    );
  }
  //console.log("spFiltered:", spFiltered.value);
};
const selectSp = async (item) => {
  // 選取材料

  // 當(llpcs + tlpcs) / yfpcs 超過一定的比例, 才可以做制損領料 #BusinessLogic
  if ((item["header.scgcditm.llpcs"] + item["header.scgcditm.tlpcs"]) / item["header.scgcditm.yfpcs"]
    < netMaterialRatio) {
    alert("領料數不足，不能做制損領料");
    return;
  }

  console.log("選取的材料：", item);

  let tempItem = {};
  tempItem["header.clllditm.id"] = ++idCurrent.value;
  tempItem["header.clllditm.gcdno"] = "";
  tempItem["header.clllditm.spno"] = item["header.sp.spno"];
  tempItem["header.sp.splk"] = item["header.sp.splk"];
  tempItem["header.sp.spspec"] = item["header.sp.spspec"];
  tempItem["header.sp.spunit"] = item["header.sp.spunit"];
  tempItem["header.clllditm.kcpcs"] = item["NA.sp.pcs"];
  tempItem["header.clllditm.kcpcsnx"] = item["NA.sp.pcsnx"];
  tempItem["header.clllditm.yfpcs"] = 0;
  tempItem["header.clllditm.sqpcs"] = 0;
  tempItem["header.clllditm.pcs"] = 0;
  tempItem["header.clllditm.pcsnx"] = 0;
  tempItem["header.clllditm.cbprice"] = 0;
  tempItem["header.NA.pay"] = 0;
  tempItem["header.clllditm.note"] = "";
  tempItem["NA.sp.clkind"] = item["NA.sp.clkind"];
  console.log("選擇的工令單資料：", tempItem);

  if (selecrRow === null || mode.value === "edit") {
    results.value.push(tempItem); // 新增一行
  } else {
    // 如果是直接點選表格中的材料編碼，則更新該行
    // 改變材料編碼會影響多個欄位, 且使用者必須重新填寫實收數, 但是編輯模式時一次只保存一個欄位, 如果允許在編輯模式修改材料編碼, 會與現在的邏輯不符合
    tempItem["header.clllditm.id"] = selecrRow["header.clllditm.id"]; // 保留原有的id
    idCurrent.value--; // 恢復idCurrent的值
    console.log("更新選取的行：", selecrRow);
    Object.assign(selecrRow, tempItem); // 更新選取的行
    selecrRow = null;
  }

  isSpDialogVisible.value = false; // 關閉材料查詢視窗
  //await nextTick(); // 等待DOM更新後，將焦點設置到新添加的行
  //focusNextInvalidField(tempItem); // 將焦點移到下一個未填寫的欄位
};

const results = ref([]); // 查詢結果(表格的內容)
const idLastInDB = ref("0"); // 最後一筆已儲存的row的 id 用來分隔原有的row和新增的row
const idCurrent = ref(0); // 目前最新的一筆row的 id

const reset = () => {
  // 重設所有欄位(原本會在initializeData中加載的變數)
  Object.keys(form).forEach(key => {
    form[key] = "";
  }); // 將所有 form 屬性設為空字串
  results.value = [];
  idLastInDB.value = "0"; // 重置最後一筆已儲存的row的 id
  idCurrent.value = 0; // 重置目前最新的一筆row的 id
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
};

const columnsForSum = ref([
  "header.clllditm.yfpcs",
  "header.clllditm.sqpcs",
  "header.clllditm.pcs",
  "header.clllditm.pcsnx",
  "header.NA.pay",
]); // 需要加總的欄位名稱

const displayHeaders = computed(() => {
  const currentHeaders = [...headers.value];
  if (mode.value !== "view") {
    currentHeaders.unshift({ title: "", key: "deleteButton" });
  }
  return currentHeaders;
}); // 加入編輯和刪除按鈕

const initializeData = async () => {
  // 加載資料
  const params = {
    danno: form.danno,
  };

  const data = await utils.fetchData("cllldDetails.php", params); //透過api獲取資料
  console.log("查詢結果：", data);
  if (
    !data["form"] ||
    data["form"].length === 0 ||
    !data["table"] ||
    data["table"].length === 0
  ) {
    // 如果沒有資料, 設定顯示空白訂單

    // 新增按鈕之外的其他按鈕都禁用
    isAddDisabled.value = false;
    isEditDisabled.value = true;
    isDeleteOrderDisabled.value = true;
    isToggleAuditDisabled.value = true;
    isExportExcelDisabled.value = true;

    reset(); // 重設所有欄位
    return; // 如果沒有資料，則不進行後續操作
  }

  // 接收查詢結果
  results.value = data["table"];

  idLastInDB.value = data["table"].at(-1)["header.clllditm.id"]; // 取得DB最後一筆的 id
  console.log("最後一筆的 id：", idLastInDB.value);
  idCurrent.value = idLastInDB.value; // 設置目前的 id 為DB最後一筆的 id

  Object.keys(form).forEach(key => {
    form[key] = data["form"][0][key];
  }); // 將所有 form 欄位的值設為查詢結果的對應值
  form.ddate = form.ddate.date.split(" ")[0]; // 將日期切割成 YYYY-MM-DD

  /*
  //form.danno = data["form"][0].danno; // danno 由 url 接收
  form.kind = data["form"][0].kind;
  form.dannobase = data["form"][0].dannobase;
  form.ddate = data["form"][0].ddate.date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
  form.demo = data["form"][0].demo;
  form.maker = data["form"][0].maker;
  form.audit = data["form"][0].audit;
  */

  orderInDBNum.value = results.value.length; // 取得原本的行數

  console.log("results:", results.value);

  await checkButtonFlags(); // 檢查按鈕狀態
};

const save = async () => {
  // 存檔到資料庫

  if (mode.value === "add") {
    // 保存form和table的資料到資料庫

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
    console.log("新增資料結果：", data);
    alert("存檔完成");

    const url = {
      path: `/cllldDetails/${form.danno}`,
    };
    await router.push(url); // 移動到新增的訂單的頁面
  } else if (mode.value === "edit") {
    // 保存新增的row到資料庫
    const itemsToBeAdded = results.value.filter(
      (item) => item["header.clllditm.id"] > idLastInDB.value
    ); // 表格中新增的資料
    const itm = itemsToBeAdded.map((item) => ({
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
      danno: form.danno,
      kind: form.kind,
      itm: itm,
    };
    const data = await utils.fetchData("clllditmUpdateNewRow.php", params); // 透過api更新資料
    console.log("更新資料結果：", data);
    alert("存檔完成");
  }
  await setMode("view"); // 切換到查看模式
};

const updateForm = async (field) => {
  // 更新form的欄位

  // 檢查日期是否是今天以後的日期 #BusinessLogic
  if (field.column === "ddate") {
    if (isFieldValid(form[field.column], field.key) === false) {
      alert("日期錯誤, 不能開今天以後的單");
      form[field.column] = "";
      return;
    }
  }

  if (mode.value === "edit") {
    // 更新資料庫

    // 檢察欄位是否有效
    if (!isFieldValid(form[field.column], field.key)) {
      return;
    }

    if (confirm(`您確定要更新${field.name}為${form[field.column]}嗎?`)) {
      const params = {
        danno: form.danno,
        column: field.column,
        value: form[field.column],
      };
      const data = await utils.fetchData("cllldmstUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      alert("更新完成");
    }
  }
};

const updateTable = async (item, key) => {
  // 表格的欄位變動

  // 檢查數量是否符合限制 #BusinessLogic
  if (key === "header.clllditm.pcs" || key === "header.clllditm.pcsnx") {
    // 處理實發數欄位的變更
    if (form.kind == '生產領料' || form.kind == '外發領料') {
      // 外發領料目前沒有在使用了

      // 限制能領的上限 #BusinessLogic
      const limitRatio = 1; // 實發數的上限比例, 應該要再檢查這個數字是否合理
      const maxPcs = Math.ceil(
        parseFloat(item["header.clllditm.yfpcs"]) * limitRatio
      ); // 上限是實發數乘上一個比例, 再無條件進位
      if (
        parseFloat(item["header.clllditm.pcs"]) +
          parseFloat(item["header.clllditm.pcsnx"]) >
        maxPcs &&
        item["NA.sp.clkind"] !== "卷料"
      ) {
        alert("實發數不能大於應發數");
        item["header.clllditm.pcs"] = 0;
        item["header.clllditm.pcsnx"] = 0;
        return;
      }
    }
    else if (form.kind === "包材領料") {
      // 包材領料
      // 實發數不能超過對應的庫存數, 但是其他類別沒有這個限制
      if (
        parseFloat(item["header.clllditm.pcs"])  >
        parseFloat(item["header.clllditm.kcpcs"])
      ) {
        alert(`保稅庫存數為:${item["header.clllditm.kcpcs"]}\n請查清楚!`);
        item["header.clllditm.pcs"] = 0;
        return;
      } else if (
        parseFloat(item["header.clllditm.pcsnx"]) >
        parseFloat(item["header.clllditm.kcpcsnx"])
      ) {
        alert(`內銷庫存數為:${item["header.clllditm.kcpcsnx"]}\n請查清楚!`);
        item["header.clllditm.pcsnx"] = 0;
        return;
      }
    }
  }

  // 更新pay欄位 #BusinessLogic
  if (key === "header.clllditm.pcs" || key === "header.clllditm.cbprice") {
    item["header.NA.pay"] =
    parseFloat(
      (
        parseFloat(item["header.clllditm.pcs"]) *
        parseFloat(item["header.clllditm.cbprice"])
      ).toFixed(2)
    ) || 0; // 更新金額
  }
  
  
  if (mode.value === "edit") {
    // 更新資料庫

    // 新的欄位先跳過
    if (item["header.clllditm.id"] > idLastInDB.value) {
      console.log("需要按存檔按鈕");
      return;
    }

    // 檢察欄位是否有效
    if (!isFieldValid(item[key], key)) {
      console.error(`欄位 ${key} 的值無效:`, item[key]);
      return;
    }

    if (confirm(`您確定要更新${labels.value[key].name}為${item[key]}嗎?`)) {
      const params = {
        danno: form.danno,
        id: item["header.clllditm.id"],
        column: labels.value[key].column,
        value: item[key],
      };
      const data = await utils.fetchData("clllditmUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      alert("更新完成");
    }
  }
};

const deleteRow = async (item) => {
  // 刪行
  if (item["header.clllditm.id"] <= idLastInDB.value) {
    const confirmMessage =
      orderInDBNum.value === 1 ? "您確定要刪除整張單據嗎?" : "您確定要刪除?";
    if (confirm(confirmMessage)) {
      const params = {
        danno: form.danno,
        id: item["header.clllditm.id"],
      };
      const data = await utils.fetchData("cllldDelete.php", params); // 透過api刪除資料
      console.log("刪除資料結果：", data);
      alert("刪除完成");
      const index = results.value.findIndex(
        (result) => result["header.clllditm.id"] === item["header.clllditm.id"]
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
    if (confirm("您確定要刪除整張單據嗎?")) {
      try {
        for (let item of results.value) {
          const params = {
            danno: form.danno,
            id: item["header.clllditm.id"],
          };
          const data = await utils.fetchData("cllldDelete.php", params); // 透過api刪除資料
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
        background: INPUT_COLORS[labels.value[key]?.inputType],
        zIndex: 2,
        minWidth: `${minWidthMap.value[key] || 0}px`,
      };
    } else {
      styles[`${key}_td`] = {
        backgroundColor: INPUT_COLORS[labels.value[key]?.inputType],
        minWidth: `${minWidthMap.value[key] || 0}px`,
      };
    }
  });

  return styles;
});
*/
const formRows = computed(() => {
  const formRowsTemp = [
    [
      labels.value["label.cllldmst.danno"],
      {
        ...labels.value["label.cllldmst.kind"],
        isReadonly: () => form.kind !== "" // 特殊的唯讀邏輯, 如果kind已經有值了, 則不允許修改 #BusinessLogic
      },
    ],
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

// 驗證表格欄位是否已填寫
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
  isFormError,
  isFormComplete,
} = useFieldValidate(results, form, formRows.value, fieldRefs, labels.value);

// --- Lifecycle Hooks ---
onMounted(async () => {
  // 原本的created, 應該可以拿出來直接執行?

  await setMode("view");

  utils.handleUrlParams(setMode); // 處理URL中的參數，並自動切換到對應的模式
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
