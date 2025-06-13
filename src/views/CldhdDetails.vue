<!-- 材料采購單明細頁面 -->
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
      :exportExcel="() => utils.exportExcel(results.value, headers.value, '材料采購單明細', '材料采購單明細')"
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
        <!-- 輔料價格的小視窗 -->
        <ClpriceDialog
          :isClpriceDialogVisible="isClpriceDialogVisible"
          @update:isClpriceDialogVisible="isClpriceDialogVisible = $event"
          :clpriceQuery="clpriceQuery"
          :clprice="clprice"
          @selectClprice="selectClprice"
        ></ClpriceDialog>
        <!-- 原材料價格的小視窗 -->
        <GclpriceDialog
          :isGclpriceDialogVisible="isGclpriceDialogVisible"
          @update:isGclpriceDialogVisible="isGclpriceDialogVisible = $event"
          :gclpriceQuery="gclpriceQuery"
          :gclprice="gclprice"
          @selectGclprice="selectGclprice"
          :priceType="priceType"
          @update:priceType="priceType=$event"
          ></GclpriceDialog>
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
        style="max-height: 400px; overflow-x: auto; overflow-y: auto;"
        height="400px"
      >
        <!-- 自定義 header 插槽，強制渲染表頭 -->
        <template v-slot:headers>
          <tr>
            <th v-for="header in displayHeaders" 
            :key="header.key" 
            :style="tableCellStyles[`${header.key}_th`]"
            >
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
                  v-if="header.key === 'header.cldhditm.spno'"
                  :style="tableCellStyles[`${header.key}_td`]"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    readonly
                    :append-inner-icon="(mode !== 'view' && !(item['header.cldhditm.getpcs'] > 0)) ? 'mdi-dots-horizontal-circle' : null"
                    @click:append-inner="openSpDialog(item)"
                    :class="labels[header.key]?.dataType === 'number' ? 'number-field' : ''"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.pcs'"
                  :style="{
                    backgroundColor: INPUT_COLORS[labels[header.key].inputType],
                  }"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :readonly="mode === 'view' || isFieldDisabled(item, header.key)"
                    @change="utils.handleField(item, header.key); updateTable(item, header.key);"
                    :error="!isFieldValid(item[header.key], header.key)"
                    :error-messages="isFocusMechanismActive && !isFieldDisabled(item, header.key) ? '必填' : null"
                    :ref="setFieldRef(`field_${item['NA.cldhditm.id']}_${header.key}`)"
                    @focus="handleFocus(item, header.key, $event.target)"
                    @blur="handleBlur(item, header.key, $event.target)"
                    :class="labels[header.key]?.dataType === 'number' ? 'number-field' : ''"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.price'"
                  :style="tableCellStyles[`${header.key}_td`]"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    :append-inner-icon="(mode !== 'view' && !isFieldDisabled(item, header.key) && spkindno === 3) ? 'mdi-dots-horizontal-circle' : null"
                    @click:append-inner="openGclpriceDialog(item)"
                    readonly
                    :error="!isFieldValid(item[header.key], header.key)"
                    :error-messages="isFocusMechanismActive && !isFieldDisabled(item, header.key) ? '必填' : null"
                    :ref="setFieldRef(`field_${item['NA.cldhditm.id']}_${header.key}`)"
                    @focus="handleFocus(item, header.key, $event.target)"
                    @blur="handleBlur(item, header.key, $event.target)"
                    :class="labels[header.key]?.dataType === 'number' ? 'number-field' : ''"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.gdate'"
                  :style="tableCellStyles[`${header.key}_td`]"
                >
                  <v-text-field
                    v-model="item[header.key]"
                    type="date"
                    :readonly="mode === 'view' || isFieldDisabled(item, header.key)"
                    :error="!isFieldValid(item[header.key], header.key)"
                    :error-messages="isFocusMechanismActive && !isFieldDisabled(item, header.key) ? '必填' : null"
                    @change="updateTable(item, header.key);"
                    :ref="setFieldRef(`field_${item['NA.cldhditm.id']}_${header.key}`)"
                    @focus="handleFocus(item, header.key, $event.target)"
                    @blur="handleBlur(item, header.key, $event.target)"
                    :class="labels[header.key]?.dataType === 'number' ? 'number-field' : ''"
                  ></v-text-field>
                </td>
                <td
                  v-else-if="header.key === 'header.cldhditm.note'"
                  :style="tableCellStyles[`${header.key}_td`]"
                >
                  <v-text-field 
                    v-model="item[header.key]"
                    :readonly="mode === 'view' || isFieldDisabled(item, header.key)"
                    @change="updateTable(item, header.key)"
                    :class="labels[header.key]?.dataType === 'number' ? 'number-field' : ''"
                  ></v-text-field>
                </td>
                <td
                  v-else
                  :style="tableCellStyles[`${header.key}_td`]"
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
              <td v-else :style="
                  (tableCellStyles[`${header.key}_td`],
                  { backgroundColor: INPUT_COLORS['fixed'] })
                ">
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
            @click="openSpDialog(null)"
            :disabled="!isFormComplete || isAnyFieldInvalid"
          >+</v-btn>
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { INPUT_COLORS, HOVER_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import ButtonsCRUDP from "@/components/ButtonsCRUDP.vue";
import ButtonsSaveDiscard from "@/components/ButtonsSaveDiscard.vue";
import SupplyDialog from "@/components/SupplyDialog.vue";
import SpDialog from "@/components/SpDialog.vue";
import ClpriceDialog from "@/components/ClpriceDialog.vue";
import GclpriceDialog from "@/components/GclpriceDialog.vue";
import { useCheckButtonFlags } from "@/composables/useCheckButtonFlags.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";
import { useFieldValidate } from "@/composables/useFieldValidate.js";
import { useSupplyDialog } from "@/composables/useSupplyDialog.js";

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
  supplyno: "", // 供方編碼
  danno: props.danno, // 訂購單號, 從url接收
  supplyname: "", // 供方名稱
  ddate: "", // 訂購日期
  demo: "", // 備註
  maker: "", // 制單
  audit: "", // 審核
});

const spkindname = ref(""); // 在網頁版, spkindname與供方類別對應
const spkindno = ref(""); // 類別編碼

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
} = useSupplyDialog(); // 選擇供方的視窗的狀態和方法

const selectSupplier = async (supplier) => {
  // 選取供方
  form.supplyno = supplier["header.supply.supplyno"];
  form.supplyname = supplier["header.supply.supplyname"];
  spkindname.value = supplier["header.supply.supplykind"]; // 在網頁版, spkindname與供方類別對應
  console.log("選取的供方：", spkindname.value);
  if (spkindname.value === null || spkindname.value === "") {
    spkindno.value = ""; // 沒有對應的類別編碼
  } else {
    spkindno.value =  spkindnoOptions.value.find(
      (item) => item.spkindname === spkindname.value
    ).spkindno; // 類別編碼
  }

  //  取得流水號(danno)
  const params = {
    prefix: `D_${form.supplyno}`,
    table: "cldhdmst",
  };
  const data = await utils.fetchData(
    "getSerialNumber.php",
    params
  );
  form.danno = data[0].NewDanno;

  dialog.value = false; // 關閉...視窗
  openSpDialog(null); // 打開材料查詢介面
};

let selecrRow = null; // 用來存儲選取的行

// 材料的小視窗的狀態和方法
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
    // 如果是卷料，使用pricekg; 否則使用price #Business Logic
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
    const selecrRow_old = { ...selecrRow }; // // 儲存原先的行
    Object.keys(tempItem).forEach(key => {
      selecrRow[key] = tempItem[key];
    });
    console.log("替代的行：", selecrRow);

    // 如果是編輯模式，立刻詢問使用者是否更新到資料庫，否則取消更新
    if (mode.value === "edit") {
      if (confirm(`您確定要更新${labels.value["header.cldhditm.spno"].name}為${selecrRow["header.cldhditm.spno"]}嗎?`)) {
        const paramsSpno = {
          danno: form.danno,
          id: selecrRow["NA.cldhditm.id"],
          column: "spno",
          value: selecrRow["header.cldhditm.spno"],
        };
        const dataSpno = await utils.fetchData("cldhditmUpdate.php", paramsSpno); // 透過api更新資料
        console.log("更新結果dataSpno:", dataSpno);

        // 更新單價，#Business Logic
        if(spkindname.value === "原材料"){
          item["header.cldhditm.pay"] = parseFloat(
            (item["header.cldhditm.kg"] * item["header.cldhditm.price"]).toFixed(2)
          ); // 計算金額
        } else {
          item["header.cldhditm.pay"] = parseFloat(
            (item["header.cldhditm.pcs"] * item["header.cldhditm.price"]).toFixed(2)
          ); // 計算金額
        }
        if (selecrRow["header.cldhditm.price"] === "") {
          alert(`${labels.value["header.cldhditm.spno"].name}已更新, 請手動選擇價格更新`); // 漏洞: 如果使用者不選擇價格, 可能會導致資料庫中仍然是原先的價格
        } else {
          const paramsPrice = {
            danno: form.danno,
            id: selecrRow["NA.cldhditm.id"],
            column: "price",
            value: selecrRow["header.cldhditm.price"],
          };
          const dataPrice = await utils.fetchData("cldhditmUpdate.php", paramsPrice); // 透過api更新資料
          console.log("更新結果dataPrice:", dataPrice);
          alert("由於材料編碼變更, 單價已自動更新");
        }
        alert("更新完成");
      } else {
        // 使用者按取消, 恢復原先的行
        Object.keys(selecrRow_old).forEach(key => {
          selecrRow[key] = selecrRow_old[key];
        });
      }
    }
  }
  console.log("tempItem:", tempItem);
  isSpDialogVisible.value = false; // 關閉材料查詢視窗
  await nextTick(); // 等待DOM更新後，將焦點設置到新添加的行
  focusNextInvalidField(tempItem); // 將焦點移到下一個未填寫的欄位
};


//  輔料價格的小視窗的狀態和方法
const isClpriceDialogVisible = ref(false); // 輔料價格的小視窗的顯示狀態
const clpriceQuery = reactive({
  supplyno: "",
  spno: "",
}); // 輔料價格查詢條件
const clprice = ref([]); // 輔料價格查詢結果

const openClpriceDialog = async (item) => {
  // 打開輔料價格查詢介面
  // 網頁版只有原材料才可以選價格
  selecrRow = item; // 儲存選取的行
  if (!form.supplyno) {
    console.error("供方編碼為空");
  } else {
    clpriceQuery.supplyno = form.supplyno; // 供方編碼
    clpriceQuery.spno = item["header.cldhditm.spno"]; // 材料編碼
    const params = {
      supplyno: clpriceQuery.supplyno,
      spno: clpriceQuery.spno,
    };
    clprice.value = await utils.fetchData("clprice.php", params);
    clprice.value.forEach((item) => {
      item["header.clprice.ddate"] = item["header.clprice.ddate"].date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
    });
    console.log("輔料價格查詢結果：", clprice.value);
  }
  isClpriceDialogVisible.value = true; // 打開輔料價格查詢介面
};

const selectClprice = (item) => {
  // 選取輔料價格
  console.log("選取的輔料價格：", item);
  selecrRow["header.cldhditm.price"] = item["header.clprice.price"]; // 單價
  selecrRow["header.cldhditm.pay"] = parseFloat(
    (selecrRow["header.cldhditm.pcs"] * selecrRow["header.cldhditm.price"]).toFixed(2)
  ); // 計算金額
  isClpriceDialogVisible.value = false; // 關閉輔料價格查詢視窗
};


// 原材料價格的小視窗的狀態和方法
const isGclpriceDialogVisible = ref(false); // 原材料價格的小視窗的顯示狀態
const gclpriceQuery = reactive({
  supplyno: "",
  matno: "",
  hig: "",
  spcd: "",
  spunit: "",
}); // 原材料價格查詢條件
const gclprice = ref([]); // 原材料價格查詢結果
const priceType = ref(""); // 價格類型

const openGclpriceDialog = async (item) => {
  // 打開原材料價格查詢介面
  selecrRow = item; // 儲存選取的行
  if (!form.supplyno) {
    console.error("供方編碼為空");
  } else {
    gclpriceQuery.supplyno = form.supplyno; // 供方編碼
    gclpriceQuery.spunit = item["header.cldhditm.spunit"]; // 單位
    const params = {
      supplyno: gclpriceQuery.supplyno,
      spno: item["header.cldhditm.spno"], // 材料編碼
    };
    gclprice.value = await utils.fetchData("gclprice.php", params);
    gclprice.value.forEach((item) => {
      item["header.gclprice.ddate"] = item["header.gclprice.ddate"].date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
    });
    console.log("原材料價格查詢結果：", gclprice.value);

    gclpriceQuery.matno = gclprice.value[0]["header.gclprice.matno"]; // 在php中用spno查詢sp取得
    gclpriceQuery.hig = gclprice.value[0]["header.gclprice.hig"]; // 在php中用spno查詢sp取得
    gclpriceQuery.spcd = item["header.sp.spcd"];
    gclpriceQuery.spunit = item["header.sp.spunit"];
    console.log("gclpriceQuery:", gclpriceQuery);
  }
  priceType.value = ""; // 清空價格類型
  isGclpriceDialogVisible.value = true; // 打開原材料價格查詢介面
};
const selectGclprice = async (item) => {
  // 選取原材料價格
  console.log("選取的原材料價格：", item);

  const key = "header.cldhditm.price"; // 要更新的欄位
  const priceOld = selecrRow[key]; // 原先的價格

  // 填入單價欄位，如果是卷料，則使用 pricekg，否則使用 price #Business Logic
  if (selecrRow.clkind === '卷料') {
    const priceTypeName = "header.gclprice.pricekg" + priceType.value;
    console.log("priceTypeName:", priceTypeName);
    if (item[priceTypeName] > 0) {
      selecrRow[key] = item[priceTypeName]; 
    } else {
      alert("價格為0");
      return;
    }
  } else {
    const priceTypeName = "header.gclprice.price" + priceType.value;
    console.log("priceTypeName:", priceTypeName);
    if (item[priceTypeName] > 0) {
      selecrRow[key] = item[priceTypeName];
    } else {
      alert("價格為0");
      return;
    }
  }
  
  // 如果是編輯模式，立刻詢問使用者是否更新到資料庫，否則取消更新
  if (mode.value === "edit") {
    if (confirm(`您確定要更新${labels.value[key].name}為${selecrRow[key]}嗎?`)){
      const params = {
        danno: form.danno,
        id: selecrRow["NA.cldhditm.id"],
        column: labels.value[key].column,
        value: selecrRow[key],
      };
      const data = await utils.fetchData("cldhditmUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      alert("更新完成");

      if(spkindname.value === "原材料"){
        selecrRow["header.cldhditm.pay"] = parseFloat(
          (selecrRow["header.cldhditm.kg"] * selecrRow[key]).toFixed(2)
        ); // 計算金額
      } else {
        selecrRow["header.cldhditm.pay"] = parseFloat(
          (selecrRow["header.cldhditm.pcs"] * selecrRow[key]).toFixed(2)
        ); // 計算金額
      }
    } else {
      selecrRow[key] = priceOld; // 如果使用者按取消, 恢復原先的價格
      return; // 如果使用者按取消, 取消更新
    }
  }
  
  isGclpriceDialogVisible.value = false; // 關閉原材料價格查詢視窗
  //updateTable(selecrRow, "header.cldhditm.price");
};


const results = ref([]); // 查詢結果(表格的內容)
const idLastInDB = ref("0"); // 最後一筆已儲存的row的 id 用來分隔原有的row和新增的row //
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

const paynoOptions = ref([]); // 幣別選項

const orderInDBNum = ref(0); // 原本的行數，用來判斷是不是只剩一個row，是的話會在刪除此row後刪除整張收貨單

const mode = ref("view"); // 當前模式，默認為查看模式
const setMode = async (newMode) => {
  // 設定模式
  if (newMode === "add") {
    // 設定為新增模式
    reset(); // 重設所有欄位

    [form.ddate] = utils.getCurrentDateTime(); // 取得當前日期

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
  "header.cldhditm.pcs",
  "header.cldhditm.kg",
  "header.cldhditm.pay",
  "header.cldhditm.getpcs",
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

  const data = await utils.fetchData("cldhdDetails.php", params); //透過api獲取資料
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

  // 轉換時間格式
  results.value.forEach((item) => {
    item["header.cldhditm.gdate"] = item["header.cldhditm.gdate"]
      ? item["header.cldhditm.gdate"].date.split(" ")[0]
      : "";
  });

  idLastInDB.value = data["table"].at(-1)["NA.cldhditm.id"]; // 取得DB最後一筆的 id
  console.log("最後一筆的 id：", idLastInDB.value);
  idCurrent.value = idLastInDB.value; // 設置目前的 id 為DB最後一筆的 id

  // 這裡應該要根據column找到對應的dataType === "date"的欄位 將日期切割成 YYYY-MM-DD
  Object.keys(form).forEach(key => {
    form[key] = data["form"][0][key];
  }); // 將所有 form 欄位的值設為查詢結果的對應值
  form.ddate = form.ddate.date.split(" ")[0]; // 將日期切割成 YYYY-MM-DD

  /*
  form.supplyno = data["form"][0].supplyno;
  form.supplyname = data["form"][0].supplyname;
  //form.danno = data["form"][0].danno; // danno 由 url 接收
  form.ddate = data["form"][0].ddate.date.split(" ")[0]; // 將日期格式化為 YYYY-MM-DD
  form.demo = data["form"][0].demo;
  form.maker = data["form"][0].maker;
  form.audit = data["form"][0].audit;
  */

  spkindname.value = data["form"][0].supplykind; // 在網頁版, spkindname與供方類別對應
  spkindno.value =  spkindnoOptions.value.find(
      (item) => item.spkindname === spkindname.value
    ).spkindno; // 類別編碼

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
      id: item["NA.cldhditm.id"],
      spno: item["header.cldhditm.spno"],
      pcs: item["header.cldhditm.pcs"],
      payno: item["header.cldhditm.payno"],
      price: item["header.cldhditm.price"],
      gdate: item["header.cldhditm.gdate"],
      note: item["header.cldhditm.note"],
    }));
    const params = {
      supplyno: form.supplyno,
      ddate: form.ddate,
      demo: form.demo,
      itm: itm,
    };
    const data = await utils.fetchData("cldhdDetailsAdd.php", params); // 透過api新增資料
    console.log("新增資料結果：", data);
    alert("存檔完成");

    const url = {
      path: `/cldhdDetails/${form.danno}`,
    };
    await router.push(url); // 移動到新增的訂單的頁面
  } else if (mode.value === "edit") {
    // 保存新增的row到資料庫
    const itemsToBeAdded = results.value.filter(item => item["NA.cldhditm.id"] > idLastInDB.value); // 表格中新增的資料
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

const updateForm = async (field) => {
  // 更新form的欄位

  // 檢查交貨日期是否早於訂購日期 #BusinessLogic
  for (const item of results.value) {
    if (new Date(item["header.cldhditm.gdate"]) < new Date(form.ddate)) {
      alert("交貨日期不能早於訂購日期");
      form.ddate = "";
      return;
    }
  }

  if (mode.value === "edit") {
    // 更新資料庫

    // 檢察欄位是否有效
    if (!isFieldValid(form[field.column], field.key)) {
      return;
    }

    if (confirm(`您確定要更新${field.name}為${form[field.column]}嗎?`)){
      const params = {
        danno: form.danno,
        column: field.column,
        value: form[field.column],
      };
      const data = await utils.fetchData("cldhdmstUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      alert("更新完成");
    }
  }
};

const updateTable= async (item, key) => {
  // 更新form的欄位

  // 處理pcs欄位的變更 #BusinessLogic
  if (key === "header.cldhditm.pcs") {
    if (item["header.cldhditm.pcs"] < item["header.cldhditm.getpcs"]) {
      alert("訂單數不能小於已入庫數!");
      item["header.cldhditm.pcs"] = item["header.cldhditm.getpcs"];
    }
    console.log("pcs欄位更新:", item);
    item["header.cldhditm.kg"] = parseFloat((item["header.cldhditm.pcs"] * item.dz).toFixed(4)); // 更新kg欄位
  }

  // 更新pay欄位 #BusinessLogic
  if ( key === "header.cldhditm.pcs") {
    if(spkindname.value === "原材料"){
      item["header.cldhditm.pay"] = parseFloat(
        (item["header.cldhditm.kg"] * item["header.cldhditm.price"]).toFixed(2)
      ); // 計算金額
    } else {
      item["header.cldhditm.pay"] = parseFloat(
        (item["header.cldhditm.pcs"] * item["header.cldhditm.price"]).toFixed(2)
      ); // 計算金額
    }
  }
  
  // 檢查交貨日期是否早於訂購日期 #BusinessLogic
  if (key === "header.cldhditm.gdate") {
    if (new Date(item["header.cldhditm.gdate"]) < new Date(form.ddate)) {
      item["header.cldhditm.gdate"] = "";
      alert("交貨日期不能早於訂購日期");
      return;
    }
  }

  // 檢察欄位是否有效
  if (!isFieldValid(item[key], key)) {
    return;
  }

  // 新的欄位先跳過
  if (item["NA.cldhditm.id"] > idLastInDB.value) {
    console.log("需要按存檔按鈕");
    return;
  }

  if (mode.value === "edit") {
    if (confirm(`您確定要更新${labels.value[key].name}為${item[key]}嗎?`)){
      const params = {
        danno: form.danno,
        id: item["NA.cldhditm.id"],
        column: labels.value[key].column,
        value: item[key],
      };
      const data = await utils.fetchData("cldhditmUpdate.php", params); // 透過api更新資料
      console.log("更新結果:", data);
      alert("更新完成");
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
    const confirmMessage = orderInDBNum.value === 1 ? "您確定要刪除整張單據嗎?" : "您確定要刪除?";
    if (confirm(confirmMessage)) {
      const params = {
        danno: form.danno,
        id: item["NA.cldhditm.id"],
      };
      const data = await utils.fetchData("cldhdDelete.php", params); // 透過api刪除資料
      console.log("刪除資料結果：", data);
      alert("刪除完成");
      const index = results.value.findIndex(
        (result) =>
          result["NA.cldhditm.id"] === item["NA.cldhditm.id"]
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
      (result) => result["NA.cldhditm.id"] === item["NA.cldhditm.id"]
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
    table: "cldhdmst",
    formno: "cldhd",
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
} = useCheckButtonFlags("cldhd", form.audit);


// 實現凍結表頭和欄位的功能, 並動態計算最小寬度
// 以後應該可以放到composables裡面?
const stickyLeftMap = ref({}); // 用來存儲sticky的left值
const minWidthMap = ref({}); // 用來存儲最小寬度

async function calculateStickyLeft() {
  // 計算 sticky 的 left 值和個欄位的最小寬度
  // 寬度現在是根據資料的長度計算的, 但是中文字的寬度和英文的寬度不一樣, 應該要用其他方法修正這個問題
  let left = 0;
  let thWidth = 0;
  stickyLeftMap.value = {};
  // 依照 displayHeaders 的順序計算
  for (const header of displayHeaders.value) {
    const key = header.key;
    if (key === "header.cldhditm.gdate") {
      thWidth = Math.max(10, String(header.title || '').length) * 8 + 35; // 避免日期未輸入時寬度太小
    } else {
      thWidth = Math.max(
        ...results.value.map(row => String(row[key] || '').length),
        String(header.title || '').length
      ) * 8 + 35;
    }
    minWidthMap.value[key] = thWidth;
    if (labels.value[key]?.isSticky) {
      stickyLeftMap.value[key] = left;
      left += thWidth;
    }
  }
}
watch([displayHeaders, results], () => nextTick(calculateStickyLeft), { deep: true }); // 在每次表頭/資料變動後重新計算 sticky 的 left 值和最小寬度

const tableCellStyles = computed(() => {
  // 儲存表格中的th和td的樣式
  const styles = {};

  displayHeaders.value.forEach(header => {
    const key = header.key;
    
    // 表頭樣式
    if (labels.value[key]?.isSticky) {
      styles[`${key}_th`] = {
        position: 'sticky',
        top: '0px',
        backgroundColor: 'white',
        left: `${stickyLeftMap.value[key] || 0}px`,
        zIndex: 4,
        minWidth: `${minWidthMap.value[key] || 0}px`
      };
    } else {
      styles[`${key}_th`] = {
        position: 'sticky',
        top: '0px',
        backgroundColor: 'white',
        zIndex: 3,
        minWidth: `${minWidthMap.value[key] || 0}px`
      };
    }
    
    // 資料列樣式
    if (labels.value[key]?.isSticky) {
      styles[`${key}_td`] = {
        position: 'sticky',
        left: `${stickyLeftMap.value[key] || 0}px`,
        background: INPUT_COLORS[labels.value[key]?.inputType],
        zIndex: 2,
        minWidth: `${minWidthMap.value[key] || 0}px`
      };
    } else {
      styles[`${key}_td`] = {
        backgroundColor: INPUT_COLORS[labels.value[key]?.inputType],
        minWidth: `${minWidthMap.value[key] || 0}px`
      };
    }
  });
  
  return styles;
});


const formRows = computed(() => {
  const formRowsTemp = [
    [
      // 特殊機制需要在這裡自己定義
      // 供方編碼(componentType: icon-text-field)
      {
        ...labels.value["label.cldhdmst.supplyno"],
        componentType: "icon-text-field",
        icon: (mode.value === "add" && form.supplyno === "") ?"mdi-dots-horizontal-circle" : null, // 如果供方編碼存在, 則不可以再更改 #BusinessLogic
        onClick: openDialog,
      },
      labels.value["label.cldhdmst.danno"],
    ],
    [
      labels.value["label.supply.supplyname"],
      labels.value["label.cldhdmst.ddate"],
    ],
    [
      labels.value["label.cldhdmst.demo"],
      labels.value["label.cldhdmst.maker"],
      labels.value["label.cldhdmst.audit"],
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

  spkindnoOptions.value = await utils.fetchCategories(); // 取得收貨類別選項
  paynoOptions.value = await utils.fetchData("pay.php", {}); // 取得幣別選項

  await setMode("view");

  utils.handleUrlParams(setMode); // 處理URL中的參數，並自動切換到對應的模式
});
</script>

<style src="@/assets/vCustom.css" scoped></style>
