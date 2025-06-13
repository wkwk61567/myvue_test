<template>
  <v-dialog
    :model-value="isCallOrderDialogVisible"
    max-width="1200px"
    @update:model-value="$emit('update:isCallOrderDialogVisible', $event)"
  >
    <v-card>
      <v-card-title>{{ labels["pageTitle.NA.orderQuery"].name }}</v-card-title>
      <v-card-text>
        <v-text-field
          :model-value="supplyno"
          :label="labels['filter.supply.supplyno'].name"
          readonly
        ></v-text-field>
        <v-text-field
          :model-value="orderQuery['danno']"
          :label="labels['filter.cldhdmst.danno'].name"
          @input="$emit('update:orderQuery[danno]', $event.target.value); $emit('handleInputOrderQuery');"
        ></v-text-field>
        <v-text-field
          :model-value="orderQuery['spno']"
          :label="labels['filter.cldhditm.spno'].name"
          @input="$emit('update:orderQuery[spno]', $event.target.value); $emit('handleInputOrderQuery');"
        ></v-text-field>
        <v-text-field
          :model-value="orderQuery['spspec']"
          :label="labels['filter.sp.spspec'].name"
          @input="$emit('update:orderQuery[spspec]', $event.target.value);  $emit('handleInputOrderQuery');"
        ></v-text-field>

        <!-- 顯示訂單列表 -->
        <v-data-table
          :headers="headers"
          :items="orderFiltered"
          item-value="danid"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <v-hover v-slot:default="{ isHovering, props: hoverProps }">
              <tr
                v-bind="hoverProps"
                @dblclick="$emit('selectOrder', item)"
                :style="isHovering ? { backgroundColor: HOVER_COLOR } : {}"
              >
                <template v-for="header in headers" :key="header.key">
                  <td :class="labels[header.key]?.dataType === 'number' ? 'number-td' : ''">{{ item[header.key] }}</td>
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
import { inject } from 'vue';
import { HOVER_COLOR } from "@/config.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 傳遞需要的屬性
const props = defineProps({
  isCallOrderDialogVisible: {
    type: Boolean,
    default: false,
  }, // 是否顯示
  supplyno: {
    type: String,
    default: "",
  },
  orderQuery: {
    type: Object,
    default: () => ({}), // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
  orderFiltered: {
    type: Array,
    default: () => [], // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
});

const emit = defineEmits([
  "update:isCallOrderDialogVisible",
  "update:orderQuery[danno]",
  "update:orderQuery[spno]",
  "update:orderQuery[spspec]",
  "handleInputOrderQuery",
  "selectOrder",
]);

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);


</script>

<style src="@/assets/vCustom.css" scoped></style>