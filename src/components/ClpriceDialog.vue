<template>
  <v-dialog
    :model-value="isClpriceDialogVisible"
    max-width="1200px"
    @update:model-value="$emit('update:isClpriceDialogVisible', $event)"
  >
    <v-card>
      <v-card-title>{{
        labels["pageTitle.NA.clpriceQuery"].name
      }}</v-card-title>
      <v-card-text>
        <v-text-field
          :model-value="clpriceQuery['supplyno']"
          :label="labels['filter.clprice.supplyno'].name"
          readonly
        ></v-text-field>
        <v-text-field
          :model-value="clpriceQuery['spno']"
          :label="labels['filter.clprice.spno'].name"
          readonly
        ></v-text-field>

        <!-- 顯示訂單列表 -->
        <v-data-table
          :headers="headers"
          :items="clprice"
          item-value="spno"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <v-hover v-slot:default="{ isHovering, props: hoverProps }">
              <tr
                v-bind="hoverProps"
                @dblclick="$emit('selectClprice', item)"
                :style="isHovering ? { backgroundColor: '#f5f5f5' } : {}"
              >
                <template v-for="header in headers" :key="header.key">
                  <td v-if="labels[header.key].componentType === 'checkbox'">
                    <v-checkbox
                      :model-value="item[header.key] === 1"
                      disabled
                    ></v-checkbox>
                  </td>
                  <td v-else >{{ item[header.key] }}</td>
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
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 傳遞需要的屬性
const props = defineProps({
  isClpriceDialogVisible: {
    type: Boolean,
    default: false,
  }, // 是否顯示
  clpriceQuery: {
    type: Object,
    default: () => ({}), // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
  clprice: {
    type: Array,
    default: () => [], // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
});

const emit = defineEmits(["update:isClpriceDialogVisible", "selectClprice"]);

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);
</script>

<style src="@/assets/vCustom.css" scoped></style>
