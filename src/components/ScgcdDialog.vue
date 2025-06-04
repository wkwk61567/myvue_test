<template>
  <v-dialog
    :model-value="isScgcdDialogVisible"
    max-width="1200px"
    @update:model-value="$emit('update:isScgcdDialogVisible', $event)"
  >
    <v-card>
      <v-card-title>{{ labels["pageTitle.NA.scgcdQuery"].name }}</v-card-title>
      <v-card-text>
        <v-text-field
          :model-value="scgcdQuery['gcdno']"
          @update:model-value="$emit('update:scgcdQuery[gcdno]', $event)"
          :label="labels['filter.scgcdmst.gcdno'].name"
        ></v-text-field>
        <v-text-field
          :model-value="scgcdQuery['spno']"
          @update:model-value="$emit('update:scgcdQuery[spno]', $event)"
          :label="labels['filter.scgcdmst.spno'].name"
        ></v-text-field>

        <v-row>
          <v-col cols="3">
            <div style="margin: 20px 0px 20px 0px">
              <v-radio-group
                :model-value="scgcdQuery['status']"
                @update:model-value="$emit('update:scgcdQuery[status]', $event)"
              >
                <v-radio
                  :label="labels['filter.NA.revert'].name"
                  value=""
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.completed'].name"
                  value="completed"
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.pending'].name"
                  value="pending"
                ></v-radio>
              </v-radio-group>
            </div>
          </v-col>
          <v-col cols="3">
            <div style="margin: 20px 0px 20px 0px">
              <v-radio-group
                :model-value="scgcdQuery['flag']"
                @update:model-value="$emit('update:scgcdQuery[flag]', $event)"
              >
                <v-radio
                  :label="labels['filter.NA.revert'].name"
                  value=""
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.production'].name"
                  value="scflag"
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.processing'].name"
                  value="jgflag"
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.outsourced'].name"
                  value="wwflag"
                ></v-radio>
              </v-radio-group>
            </div>
          </v-col>
          <v-col cols="3">
            <div style="margin: 20px 0px 20px 0px">
              <v-radio-group
                :model-value="scgcdQuery['spkindno']"
                @update:model-value="
                  $emit('update:scgcdQuery[spkindno]', $event)
                "
              >
                <v-radio
                  :label="labels['filter.NA.revert'].name"
                  value=""
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.semiFinished'].name"
                  value="2"
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.rawMaterial'].name"
                  value="3"
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.auxiliaryMaterial'].name"
                  value="4"
                ></v-radio>
                <v-radio
                  :label="labels['filter.NA.carton'].name"
                  value="5"
                ></v-radio>
              </v-radio-group>
            </div>
          </v-col>
          <v-col cols="3">
            <v-btn
              color="primary"
              @click="query"
              style="
                margin: 20px 0px 20px 0px;
                width: 80px;
                height: 60px;
                font-size: 16px;
              "
              >{{ labels["button.NA.query"].name }}
            </v-btn>
          </v-col>
        </v-row>

        <!-- 顯示訂單列表 -->
        <v-data-table
          :headers="headers"
          :items="scgcd"
          item-value="spno"
          class="elevation-1"
        >
          <template v-slot:item="{ item }">
            <v-hover v-slot:default="{ isHovering, props: hoverProps }">
              <tr
                v-bind="hoverProps"
                @dblclick="$emit('selectScgcd', item)"
                :style="isHovering ? { backgroundColor: '#f5f5f5' } : {}"
              >
                <template v-for="header in headers" :key="header.key">
                  <td v-if="labels[header.key].componentType === 'checkbox'">
                    <v-checkbox
                      :model-value="item[header.key] === 1"
                      disabled
                    ></v-checkbox>
                  </td>
                  <td v-else style="padding-right: 50px">
                    {{ item[header.key] }}
                  </td>
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
import { inject, ref, watch } from "vue";
import * as utils from "@/utils/utils.js";
import { useI18nHeadersLabels } from "@/composables/useI18nHeadersLabels.js";

// 接收selectedLanguage 作為目前顯示的語言
const selectedLanguage = inject("selectedLanguage");

// 傳遞需要的屬性
const props = defineProps({
  isScgcdDialogVisible: {
    type: Boolean,
    default: false,
  }, // 是否顯示
  scgcdQuery: {
    type: Object,
    default: () => ({}), // 在 Composition API 中，物件和陣列的 default 值建議使用工廠函數
  },
});

const emit = defineEmits([
  "update:isScgcdDialogVisible",
  "update:scgcdQuery[gcdno]",
  "update:scgcdQuery[spno]",
  "update:scgcdQuery[status]",
  "update:scgcdQuery[flag]",
  "update:scgcdQuery[spkindno]",
  "selectScgcd",
]);

// 取得當前語言的字典
const fileName = import.meta.url.split("/").pop().split("%")[0];
const { labels, headers } = useI18nHeadersLabels(selectedLanguage, fileName);

// 查詢
const scgcd = ref([]);
const query = async () => {
  // 檢查是否有輸入條件
  const params = {
    gcdno: props.scgcdQuery["gcdno"],
    spno: props.scgcdQuery["spno"],
    status: props.scgcdQuery["status"],
    flag: props.scgcdQuery["flag"],
    spkindno: props.scgcdQuery["spkindno"],
  };
  const data = await utils.fetchData("scgcd.php", params);
  scgcd.value = data;
};

// 監聽 isScgcdDialogVisible 的變化
watch(
  () => props.isScgcdDialogVisible,
  (newVal) => {
    if (newVal) {
      query(); // 當對話框顯示時，執行查詢
    }
  }
);
</script>

<style src="@/assets/vCustom.css" scoped></style>
