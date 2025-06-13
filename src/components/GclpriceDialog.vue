<template>
  <v-dialog
    :model-value="isGclpriceDialogVisible"
    max-width="1200px"
    @update:model-value="$emit('update:isGclpriceDialogVisible', $event)"
  >
    <v-card>
      <v-card-title>{{
        labels["pageTitle.NA.gclpriceQuery"].name
      }}</v-card-title>
      <v-card-text>
        <v-text-field
          :model-value="gclpriceQuery['supplyno']"
          :label="labels['filter.gclprice.supplyno'].name"
          readonly
        ></v-text-field>
        <v-text-field
          :model-value="gclpriceQuery['matno']"
          :label="labels['filter.gclprice.matno'].name"
          readonly
        ></v-text-field>
        <v-text-field
          :model-value="gclpriceQuery['hig']"
          :label="labels['filter.gclprice.hig'].name"
          readonly
        ></v-text-field>
        <v-text-field
          :model-value="gclpriceQuery['spcd']"
          :label="labels['filter.gclprice.spcd'].name"
          readonly
        ></v-text-field>
        <v-text-field
          :model-value="gclpriceQuery['spunit']"
          :label="labels['filter.gclprice.spunit'].name"
          readonly
        ></v-text-field>

        <!-- 價格選擇元件 -->
        <div style="margin:20px 0px 20px 0px;">
          <v-label>
            {{ labels['filter.NA.priceTypeTitle'].name}}
          </v-label>
          <v-radio-group
            :model-value="priceType"
            @update:model-value="$emit('update:priceType', $event)"
            row
          >
            <v-row>
              <v-radio
                :label="labels['filter.NA.price'].name"
                value=""
              ></v-radio>
              <v-radio
                :label="labels['filter.NA.price1'].name"
                value="1"
              ></v-radio>
              <v-radio
                :label="labels['filter.NA.price2'].name"
                value="2"
              ></v-radio>
            </v-row>
          </v-radio-group>
        </div>

        <!-- 顯示訂單列表 -->
        <v-data-table
          :headers="headers"
          :items="gclprice"
          item-value="spno"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <v-hover v-slot:default="{ isHovering, props: hoverProps }">
              <tr
                v-bind="hoverProps"
                @dblclick="$emit('selectGclprice', item)"
                :style="isHovering ? { backgroundColor: HOVER_COLOR } : {}"
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
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { inject } from "vue";
import { HOVER_COLOR } from "@/config.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 傳遞需要的屬性
const props = defineProps({
  isGclpriceDialogVisible: {
    type: Boolean,
    default: false,
  }, // 是否顯示
  gclpriceQuery: {
    type: Object,
    default: () => ({}), // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
  gclprice: {
    type: Array,
    default: () => [], // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  }, // 價格的表格
  priceType: {
    type: String,
    default: "",
  }, // 預設價格類型為空(價格)
});

const emit = defineEmits(["update:isGclpriceDialogVisible", "selectGclprice", "update:priceType"]);


// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);
</script>

<style src="@/assets/vCustom.css" scoped></style>
