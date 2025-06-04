<template>
  <v-dialog
    :model-value="dialog"
    max-width="600px"
    @update:model-value="$emit('update:dialog', $event)"
  >
    <v-card>
      <v-card-title>{{ labels["pageTitle.NA.supplyQuery"].name }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <!-- 查詢框 -->
            <v-text-field
              :model-value="supplyQuery"
              :label="labels['filter.supply.supply'].name"
              @input="
                $emit('update:supplyQuery', $event.target.value);
                $emit('handleInputSupplyQueryAndTempSupplykind');
              "
            ></v-text-field>
          </v-col>
          <v-col>
            <v-select
              :value="tempSupplykind"
              :items="spkindnoOptionsWithEmpty"
              item-title="spkindname"
              item-value="spkindname"
              :label="labels['filter.supply.supplykind'].name"
              @update:model-value="
                $emit('update:tempSupplykind', $event);
                $emit('handleInputSupplyQueryAndTempSupplykind');
              "
            ></v-select>
          </v-col>
        </v-row>
        <!-- 顯示供方列表 -->
        <v-data-table
          :headers="headers"
          :items="filteredSuppliers"
          item-value="supplyno"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <v-hover v-slot:default="{ isHovering, props: hoverProps }">
              <tr
                v-bind="hoverProps"
                @dblclick="$emit('selectSupplier', item)"
                :style="isHovering ? { backgroundColor: '#f5f5f5' } : {}"
              >
                <template v-for="header in headers" :key="header.key">
                  <td>{{ item[header.key] }}</td>
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
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 傳遞需要的屬性
const props = defineProps({
  dialog: {
    type: Boolean,
    default: false,
  }, // 是否顯示
  supplyQuery: {
    type: String,
    default: "",
  },
  tempSupplykind: {
    type: String,
    default: "",
  },
  spkindnoOptionsWithEmpty: {
    type: Array,
    default: () => [],
  }, // 網頁版的供方類別必須與收貨類別對應
  filteredSuppliers: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  "update:dialog",
  "update:supplyQuery",
  "update:tempSupplykind",
  "handleInputSupplyQueryAndTempSupplykind",
  "selectSupplier",
]);

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

</script>

<style src="@/assets/vCustom.css" scoped></style>