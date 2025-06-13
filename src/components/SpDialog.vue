<template>
  <v-dialog
    :model-value="isSpDialogVisible"
    max-width="1200px"
    @update:model-value="$emit('update:isSpDialogVisible', $event)"
  >
    <v-card>
      <v-card-title>{{ labels["pageTitle.NA.spQuery"].name }}</v-card-title>
      <v-card-text>
        <v-text-field
          :model-value="spQuery['spno']"
          :label="labels['filter.sp.spno'].name"
          @input="
            $emit('update:spQuery[spno]', $event.target.value);
            $emit('handleInputSpQuery');
          "
        ></v-text-field>
        <v-text-field
          :model-value="spQuery['spspec']"
          :label="labels['filter.sp.spspec'].name"
          @input="
            $emit('update:spQuery[spspec]', $event.target.value);
            $emit('handleInputSpQuery');
          "
        ></v-text-field>
        <v-select
          :model-value="spQuery['matno']"
          :label="labels['filter.sp.matno'].name"
          item-title = "matno"
          item-value = "matno"
          :items="matnoOptionsWithEmpty.map((item) => item.matno)"
          @update:model-value="
            $emit('update:spQuery[matno]', $event);
            $emit('handleInputSpQuery');
          "
        ></v-select>
        <v-select
          :model-value="spQuery['spunit']"
          :label="labels['filter.sp.spunit'].name"
          item-title = "spunit"
          item-value = "spunit"
          :items="spunitOptionsWithEmpty.map((item) => item.spunit)"
          @update:model-value="
            $emit('update:spQuery[spunit]', $event);
            $emit('handleInputSpQuery');
          "
        ></v-select>
        <v-select
          :model-value="spQuery['spkindname']"
          :label="labels['filter.sp.spkindname'].name"
          item-title = "spkindname"
          item-value = "spkindname"
          :items="spkindnoOptionsWithEmpty"
          @update:model-value="
            $emit('update:spQuery[spkindname]', $event);
            $emit('handleInputSpQuery');
          "
        ></v-select>

        <!-- 顯示訂單列表 -->
        <v-data-table
          :headers="headers"
          :items="spFiltered"
          item-value="spno"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <v-hover v-slot:default="{ isHovering, props: hoverProps }">
              <tr
                v-bind="hoverProps"
                @dblclick="$emit('selectSp', item)"
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
import { ref, computed, inject } from "vue";
import { HOVER_COLOR } from "@/config.js";
import * as utils from "@/utils/utils.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 取得材料選項和單位選項
const matnoOptions = ref([]);
const spunitOptions = ref([]);
const spkindnoOptions = ref([]);
(async () => {
  const matData = await utils.fetchData("mat.php", {});
  matnoOptions.value = matData.map((item) => ({
    matno: item.matno,
  }));
  console.log("matnoOptions", matnoOptions.value);
})();
(async () => {
  const spunitData = await utils.fetchData("spunit.php", {});
  spunitOptions.value = spunitData.map((item) => ({
    spunit: item.spunit,
  }));
  console.log("spunitOptions", spunitOptions.value);
})();
(async () => {
  spkindnoOptions.value = await utils.fetchCategories(); // 獲取收貨類別
  console.log("spkindnoOptions", spkindnoOptions.value);
})();

const matnoOptionsWithEmpty = computed(() => {
  return [{ matno: "" }, ...matnoOptions.value];
}); // 在材料選項中加入「不設限」選項
const spunitOptionsWithEmpty = computed(() => {
  return [{ spunit: "" }, ...spunitOptions.value];
}); // 在單位選項中加入「不設限」選項
const spkindnoOptionsWithEmpty = computed(() => {
  return [{ spkindno: "", spkindname: "" }, ...spkindnoOptions.value];
}); // 在收貨類別選項中加入「不設限」選項


// 傳遞需要的屬性
const props = defineProps({
  isSpDialogVisible: {
    type: Boolean,
    default: false,
  }, // 是否顯示
  spQuery: {
    type: Object,
    default: () => ({}), // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
  spFiltered: {
    type: Array,
    default: () => [], // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
});

const emit = defineEmits([
  "update:isSpDialogVisible",
  "update:spQuery[spno]",
  "update:spQuery[spspec]",
  "update:spQuery[matno]",
  "update:spQuery[spunit]",
  "update:spQuery[spkindname]",
  "handleInputSpQuery",
  "selectSp",
]);

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);
</script>

<style src="@/assets/vCustom.css" scoped></style>
